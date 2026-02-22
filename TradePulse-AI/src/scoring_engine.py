# scoring_engine.py  —  Full hybrid scoring with RRF + CC + Geo + Classification
#
# ═══════════════════════════════════════════════════════════════════════════════
# CLASSIFICATION BASIS — How and Why We Classify Each Match
# ═══════════════════════════════════════════════════════════════════════════════
#
# We classify matches across 10 independent dimensions, each answering a
# specific business question about whether this exporter-importer pair will
# result in a successful trade deal:
#
# DIMENSION 1 — SUPPLY-DEMAND FIT (basis: operational feasibility)
#   Question: Can this exporter physically fulfil this buyer's order?
#   Signal:   Manufacturing_Capacity_Tons vs Avg_Order_Tons
#   Why:      A match is worthless if the exporter cannot ship at the required
#             volume. Sweet spot = 1×–3× capacity (enough but not wasteful).
#
# DIMENSION 2 — GEOGRAPHIC FIT (basis: trade corridor intelligence)
#   Question: Is this India State → Buyer Country route a proven trade lane?
#   Signal:   TRADE_CORRIDORS (industry×country), STATE_SPECIALISATION,
#             REGULATORY_EASE (FTAs), LOGISTICS_SCORE
#   Why:      Gujarat→Germany for Chemicals is 10× more likely to succeed than
#             Rajasthan→Canada for Electronics. Location is structural, not noise.
#
# DIMENSION 3 — SCALE COMPATIBILITY (basis: firmographic fit)
#   Question: Are these companies sized to work with each other?
#   Signal:   Revenue_Size_USD, Team_Size (log-ratio similarity)
#   Why:      A $500K exporter cannot service a $100M buyer's compliance,
#             documentation, and volume requirements. Log-ratio handles the
#             natural 2–5× size difference between exporters and importers.
#
# DIMENSION 4 — BEHAVIOURAL INTENT (basis: live signal intelligence)
#   Question: Are BOTH parties actively in buying/selling mode RIGHT NOW?
#   Signal:   Intent_Score (both), Prompt_Response_Score, Prompt_Response
#   Why:      B2B research (KGAT 2023, Frontiers 2024) shows intent signals
#             are the single strongest predictor of deal conversion. A buyer
#             passively browsing vs actively sourcing = completely different lead.
#
# DIMENSION 5 — RELIABILITY & TRUST (basis: payment + certification)
#   Question: Can both parties be trusted to execute the deal?
#   Signal:   Good_Payment_Terms, Good_Payment_History, Certification overlap
#   Why:      KGAT B2B study (2023) found trust signals most predictive of
#             B2B match quality after intent. Jaccard cert overlap rewards
#             compliance alignment (ISO, FDA, CE marks match buyer requirements).
#
# DIMENSION 6 — GROWTH MOMENTUM (basis: firmographic trajectory)
#   Question: Is this company growing or shrinking?
#   Signal:   Hiring_Signal, LinkedIn_Activity, SalesNav views, Funding_Event
#   Why:      Growing companies have budget, need new suppliers, and are more
#             open to new trade relationships. A company in decline is a bad bet.
#
# DIMENSION 7 — OUTREACH RECEPTIVENESS (basis: timing intelligence)
#   Question: Is this the right MOMENT to reach out?
#   Signal:   Response_Probability, Engagement_Spike, DecisionMaker_Change
#   Why:      A decision-maker change = new person wants to prove themselves
#             by finding better suppliers. Engagement spike = actively evaluating.
#             These are the "warm windows" where outreach converts.
#
# DIMENSION 8 — TRADE HISTORY SIGNAL (basis: proven execution)
#   Question: Has this exporter actually shipped at scale before?
#   Signal:   Shipment_Value_USD, Quantity_Tons
#   Why:      First-time exporters are risky. Proven shipment history signals
#             the exporter can navigate customs, logistics, and documentation.
#
# DIMENSION 9 — MACRO SAFETY (basis: geopolitical + market risk)
#   Question: Is this trade lane safe from external disruptions?
#   Signal:   War_Risk, Tariff_Impact, Natural_Calamity_Risk (exporter),
#             War_Event, Tariff_News, Natural_Calamity (importer),
#             Industry news risk (risk_engine.py)
#   Why:      Even a perfect match fails if there's an active trade embargo,
#             war in the region, or major tariff spike on this industry.
#
# DIMENSION 10 — MSME BONUS (basis: policy + platform equity)
#   Question: Should we boost smaller exporters who need the platform most?
#   Signal:   MSME_Udyam registration flag
#   Why:      MSMEs represent 95%+ of Indian exporters but are underrepresented
#             in matches due to lower revenue/capacity scores. A small boost
#             prevents the platform from only showing large corporates.
#
# ── FUSION METHOD ──────────────────────────────────────────────────────────────
# We use a 3-path hybrid to avoid overfitting to any single method:
#
#   Path A: Convex Combination (CC)  — Bruch et al. 2022
#           Weighted average of normalised scores.
#           Best when score magnitudes are meaningful (not just relative rank).
#
#   Path B: Weighted RRF (WRRF)      — MMMORRF, Samuel et al. 2025
#           Candidate-dependent weights × reciprocal smoothed rank.
#           Best for detecting consensus: buyer ranked top by MANY dimensions.
#
#   Path C: Consensus Bonus          — Exp4Fuse, Liu et al. 2025
#           Additive bonus for candidates in top-k across multiple dimensions.
#
#   Final = 0.60 * CC + 0.40 * WRRF + consensus_bonus
#   Then multiplied by recency weight (Frontiers B2B 2024).
#
# ── OVERFITTING PREVENTION ────────────────────────────────────────────────────
#   1. No learned parameters — all weights are domain-knowledge-based
#   2. WRRF α_d clipped to [0.3, 1.0] — prevents extreme per-candidate weights
#   3. Consensus bonus capped at +8% — cannot dominate the score
#   4. MSME bonus capped at +3% — small equity nudge only
#   5. Recency is multiplicative with 0.7 floor — stale records can still rank
#   6. All component scores are individually clamped to [0,1]
#   7. Log-ratio similarity uses σ=1.5 (wider tolerance = less overfitting)
# ═══════════════════════════════════════════════════════════════════════════════

import math
import numpy as np
from data_models import clamp, jaccard_similarity, log_ratio_similarity
from geo_engine import compute_geo_score

# ── CC base weights (research-backed, sum to 1.0) ────────────────────────────
CC_WEIGHTS = {
    "demand_fit":             0.18,
    "geo_fit":                0.15,   # NEW — location matching
    "behavioral_fit":         0.17,
    "reliability":            0.15,
    "scale_fit":              0.12,
    "outreach_receptiveness": 0.10,
    "momentum":               0.08,
    "trade_signal":           0.03,
    "safety_score":           0.02,
}

RRF_K     = 60
SRRF_BETA = 5.0
CC_ALPHA  = 0.60   # blend: 60% CC, 40% WRRF

# Empirical percentiles
LI_P5, LI_P95              = 500,    24000
SNAV_EXP_P5, SNAV_EXP_P95  = 100,    14000
SNAV_IMP_P5, SNAV_IMP_P95  = 200,    19000
SHIP_P5,     SHIP_P95      = 10_000, 850_000


def _norm_linear(v, lo, hi):
    return clamp((v - lo) / (hi - lo)) if hi > lo else 0.5


def _norm_log(v, p5, p95):
    if p95 <= p5:
        return 0.5
    return clamp((math.log(max(v, 1)) - math.log(max(p5, 1))) /
                 (math.log(max(p95, 1)) - math.log(max(p5, 1))))


# ── Per-pair component scorer ─────────────────────────────────────────────────

def compute_components(anchor, candidate, industry_risk_map: dict) -> dict:
    """
    Compute all 9 component scores (0–1) plus geo breakdown for one pair.
    Works regardless of which side (exporter/importer) is the anchor.
    """
    # Normalise direction
    if hasattr(anchor, "Manufacturing_Capacity_Tons"):
        exp, imp = anchor, candidate
    else:
        exp, imp = candidate, anchor

    # ── 1. Supply–Demand Fit ──────────────────────────────────────────────────
    cap, need = max(exp.Manufacturing_Capacity_Tons, 1.0), max(imp.Avg_Order_Tons, 1.0)
    ratio = cap / need
    if ratio >= 1.0:
        demand_fit = clamp(1.0 - 0.1 * max(0, math.log(ratio) - math.log(3)))
    else:
        demand_fit = clamp(ratio * 0.8)

    # ── 2. Geographic Fit ─────────────────────────────────────────────────────
    geo_bd  = compute_geo_score(exp.State, imp.Country, exp.Industry)
    geo_fit = geo_bd["geo_score"]

    # ── 3. Scale Compatibility ────────────────────────────────────────────────
    scale_fit = (
        0.6 * log_ratio_similarity(exp.Revenue_Size_USD, imp.Revenue_Size_USD) +
        0.4 * log_ratio_similarity(exp.Team_Size, imp.Team_Size)
    )

    # ── 4. Behavioural Intent ─────────────────────────────────────────────────
    behavioral_fit = (
        0.6 * (exp.Intent_Score + imp.Intent_Score) / 2 +
        0.4 * (exp.Prompt_Response_Score + imp.Prompt_Response) / 2
    )

    # ── 5. Reliability & Trust ────────────────────────────────────────────────
    reliability = (
        0.6 * (exp.Good_Payment_Terms + imp.Good_Payment_History) / 2 +
        0.4 * jaccard_similarity(exp.Certification, imp.Certification)
    )

    # ── 6. Growth Momentum ────────────────────────────────────────────────────
    exp_momentum = (
        0.35 * exp.Hiring_Signal +
        0.35 * _norm_linear(exp.LinkedIn_Activity, LI_P5, LI_P95) +
        0.30 * _norm_linear(exp.SalesNav_ProfileViews, SNAV_EXP_P5, SNAV_EXP_P95)
    )
    imp_momentum = (
        0.30 * imp.Hiring_Growth +
        0.30 * imp.Funding_Event +
        0.40 * _norm_linear(imp.SalesNav_ProfileVisits, SNAV_IMP_P5, SNAV_IMP_P95)
    )
    momentum = (exp_momentum + imp_momentum) / 2

    # ── 7. Outreach Receptiveness ─────────────────────────────────────────────
    outreach_receptiveness = (
        0.50 * imp.Response_Probability +
        0.30 * imp.Engagement_Spike +
        0.20 * imp.DecisionMaker_Change
    )

    # ── 8. Trade History Signal ───────────────────────────────────────────────
    trade_signal = (
        0.5 * _norm_log(exp.Shipment_Value_USD, SHIP_P5, SHIP_P95) +
        0.5 * _norm_log(exp.Quantity_Tons, 10, 4500)
    )

    # ── 9. Macro Safety Score ─────────────────────────────────────────────────
    industry_risk = industry_risk_map.get(exp.Industry, 0.5)
    risk_exp = (
        exp.War_Risk * 0.40 +
        clamp((exp.Tariff_Impact + 1) / 2) * 0.30 +
        exp.Natural_Calamity_Risk * 0.30
    )
    risk_imp = (
        imp.War_Event * 0.40 +
        imp.Tariff_News * 0.30 +
        imp.Natural_Calamity * 0.30
    )
    risk = clamp(0.40 * industry_risk + 0.35 * risk_exp + 0.25 * risk_imp)
    safety_score = 1.0 - risk

    # ── Recency ───────────────────────────────────────────────────────────────
    recency = math.sqrt(exp.Recency_Weight * imp.Recency_Weight)

    return {
        "demand_fit":             round(demand_fit,            4),
        "geo_fit":                round(geo_fit,               4),
        "scale_fit":              round(scale_fit,             4),
        "behavioral_fit":         round(behavioral_fit,        4),
        "reliability":            round(reliability,           4),
        "momentum":               round(momentum,              4),
        "outreach_receptiveness": round(outreach_receptiveness,4),
        "trade_signal":           round(trade_signal,          4),
        "safety_score":           round(safety_score,          4),
        "recency":                round(recency,               4),
        # geo breakdown for display
        "geo_corridor":           round(geo_bd["corridor_score"],   4),
        "geo_state_spec":         round(geo_bd["state_spec_score"], 4),
        "geo_regulatory":         round(geo_bd["regulatory_score"], 4),
        "geo_logistics":          round(geo_bd["logistics_score"],  4),
        "geo_label":              geo_bd["geo_label"],
    }


# ── SRRF: Sigmoid-smoothed ranks ──────────────────────────────────────────────

def _srrf_ranks(col: np.ndarray) -> np.ndarray:
    """Blend hard ranks (40%) with sigmoid-smoothed ranks (60%) — Bruch 2024."""
    median    = float(np.median(col))
    soft      = 1.0 / (1.0 + np.exp(-SRRF_BETA * (col - median)))
    soft_ord  = np.argsort(-soft);  soft_ranks = np.empty_like(soft_ord, dtype=float)
    soft_ranks[soft_ord] = np.arange(1, len(col) + 1)
    hard_ord  = np.argsort(-col);   hard_ranks = np.empty_like(hard_ord, dtype=float)
    hard_ranks[hard_ord] = np.arange(1, len(col) + 1)
    return 0.4 * hard_ranks + 0.6 * soft_ranks


# ── WRRF: per-candidate component reliability weight ─────────────────────────

def _alpha_d(col: np.ndarray) -> np.ndarray:
    """α_d ∈ [0.3, 1.0]: strong outliers → high weight, near-median → 0.5."""
    std  = float(col.std()) + 1e-9
    dist = np.abs(col - float(np.median(col))) / std
    raw  = 1.0 / (1.0 + np.exp(-dist + 1.0))
    return np.clip(raw, 0.3, 1.0)


# ── Consensus bonus ───────────────────────────────────────────────────────────

def _consensus_bonus(rank_matrix: np.ndarray) -> np.ndarray:
    """Additive bonus ∈ [0, 0.08] for candidates ranked top-k by many components."""
    top_k   = max(3, rank_matrix.shape[0] // 20)
    counts  = (rank_matrix <= top_k).sum(axis=1).astype(float)
    bonus   = np.exp(counts / rank_matrix.shape[1]) - 1.0
    mx      = float(bonus.max())
    return (bonus / mx * 0.08) if mx > 0 else bonus


# ── Main fusion engine ────────────────────────────────────────────────────────

def compute_rrf_scores(anchor, candidates, industry_risk_map: dict):
    """
    Compute final match scores for all candidates against one anchor.

    Fusion pipeline:
      1. Compute 9 component scores per pair → score_matrix (n × 9)
      2. CC path:   weighted avg of population-normalised scores
      3. WRRF path: α_d × 1/(k + SRRF_rank), summed across components
      4. Hybrid:    0.60 × CC + 0.40 × WRRF + consensus_bonus
      5. Recency multiplier: 0.70 + 0.30 × recency
      6. MSME equity bonus: +3% for MSME-registered exporters
      7. Normalise to [0, 1]

    Returns list of (id, score, breakdown_dict) — unsorted.
    """
    if not candidates:
        return []

    def get_id(c):
        return c.Buyer_ID if hasattr(c, "Buyer_ID") else c.Exporter_ID

    def get_msme(exp_or_imp):
        if hasattr(exp_or_imp, "MSME_Flag"):
            return exp_or_imp.MSME_Flag
        return 0

    ids   = [get_id(c) for c in candidates]
    n     = len(candidates)
    fkeys = list(CC_WEIGHTS.keys())   # 9 fusion components (no recency)
    nf    = len(fkeys)

    # ── Step 1: score matrix ──────────────────────────────────────────────────
    score_mat = np.zeros((n, nf))
    recency_v = np.zeros(n)
    msme_v    = np.zeros(n)
    all_bd    = []

    for i, cand in enumerate(candidates):
        bd = compute_components(anchor, cand, industry_risk_map)
        all_bd.append(bd)
        for j, k in enumerate(fkeys):
            score_mat[i, j] = bd[k]
        recency_v[i] = bd["recency"]
        # MSME flag is on the exporter side
        exp_side = anchor if hasattr(anchor, "MSME_Flag") else cand
        msme_v[i] = get_msme(exp_side)

    # ── Step 2: Convex Combination ────────────────────────────────────────────
    col_min = score_mat.min(axis=0)
    col_max = score_mat.max(axis=0)
    col_rng = np.where(col_max - col_min > 1e-9, col_max - col_min, 1.0)
    normed  = (score_mat - col_min) / col_rng

    cc_w    = np.array([CC_WEIGHTS[k] for k in fkeys], dtype=float)
    cc_w   /= cc_w.sum()
    cc_sc   = normed @ cc_w

    # ── Step 3: WRRF with SRRF ranks ─────────────────────────────────────────
    wrrf_sc = np.zeros(n)
    for j in range(nf):
        col      = score_mat[:, j]
        sr       = _srrf_ranks(col)
        alpha    = _alpha_d(col)
        wrrf_sc += alpha * (1.0 / (RRF_K + sr))

    wrrf_rng = wrrf_sc.max() - wrrf_sc.min()
    wrrf_n   = (wrrf_sc - wrrf_sc.min()) / wrrf_rng if wrrf_rng > 1e-9 else np.full(n, 0.5)

    # ── Step 4: Consensus bonus ───────────────────────────────────────────────
    hard_rm = np.zeros((n, nf))
    for j in range(nf):
        o = np.argsort(-score_mat[:, j])
        r = np.empty_like(o, dtype=float)
        r[o] = np.arange(1, n + 1)
        hard_rm[:, j] = r
    cb = _consensus_bonus(hard_rm)

    # ── Step 5: Hybrid score ──────────────────────────────────────────────────
    hybrid = CC_ALPHA * cc_sc + (1.0 - CC_ALPHA) * wrrf_n + cb

    # ── Step 6: Recency multiplier ────────────────────────────────────────────
    rec_mult = 0.70 + 0.30 * recency_v
    hybrid   = hybrid * rec_mult

    # ── Step 7: MSME equity bonus (+3% max, anti-overfit cap) ────────────────
    hybrid   = hybrid + msme_v * 0.03

    # ── Step 8: Normalise to [0, 1] ───────────────────────────────────────────
    f_rng  = hybrid.max() - hybrid.min()
    final  = (hybrid - hybrid.min()) / f_rng if f_rng > 1e-9 else np.full(n, 0.5)

    # ── Effective weights for explainability ──────────────────────────────────
    score_std = score_mat.std(axis=0)
    tot_std   = score_std.sum()
    eff_w     = score_std / tot_std if tot_std > 0 else cc_w
    disp_w    = 0.5 * eff_w + 0.5 * cc_w
    disp_w   /= disp_w.sum()
    eff_map   = {k: round(float(w), 4) for k, w in zip(fkeys, disp_w)}

    # ── Assemble ──────────────────────────────────────────────────────────────
    results = []
    for i in range(n):
        bd = all_bd[i]
        bd.update({
            "cc_score":         round(float(cc_sc[i]),   4),
            "wrrf_score":       round(float(wrrf_n[i]),  4),
            "consensus_bonus":  round(float(cb[i]),      4),
            "recency_mult":     round(float(rec_mult[i]),4),
            "final_score":      round(float(final[i]),   4),
            "effective_weights":eff_map,
        })
        results.append((ids[i], float(final[i]), bd))

    return results


# ── Legacy single-pair (for unit tests) ───────────────────────────────────────

def compute_score(exp, imp, industry_risk_map: dict):
    bd  = compute_components(exp, imp, industry_risk_map)
    raw = sum(CC_WEIGHTS.get(k, 0) * v for k, v in bd.items() if k in CC_WEIGHTS)
    bd["raw_score"] = round(raw, 4)
    bd["final_score"] = round(clamp(raw), 4)
    return clamp(raw), bd
