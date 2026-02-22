# interactive_search.py

import os
from preprocess import load_exporters, load_importers, load_news
from matchmaker import get_top_buyers, get_top_exporters
from risk_engine import compute_industry_risk

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "data")

EXPORTER_PATH = os.path.join(DATA, "EXIM_DatasetAlgo_Hackathon(Exporter_LiveSignals_v5_Updated).csv")
IMPORTER_PATH = os.path.join(DATA, "EXIM_DatasetAlgo_Hackathon(Importer_LiveSignals_v5_Updated).csv")
NEWS_PATH     = os.path.join(DATA, "EXIM_DatasetAlgo_Hackathon(Global_News_LiveSignals_Updated) (1).csv")

# ── Load ──────────────────────────────────────────────────────────────────────
print("Loading dataset...")
exporters         = load_exporters(EXPORTER_PATH)
importers         = load_importers(IMPORTER_PATH)
news_df           = load_news(NEWS_PATH)
industry_risk_map = compute_industry_risk(news_df)

print(f"Loaded {len(exporters)} exporters | {len(importers)} importers\n")

print("Industry risk scores (from news signals):")
for ind, risk in sorted(industry_risk_map.items(), key=lambda x: -x[1]):
    bar = "█" * int(risk * 25)
    print(f"  {ind:<20} {bar:<25} {risk:.3f}")
print()

exporter_dict = {e.Exporter_ID: e for e in exporters}
buyer_dict    = {b.Buyer_ID:    b for b in importers}

# ── Display helpers ───────────────────────────────────────────────────────────

COMPONENT_LABELS = {
    "demand_fit":             "Supply-Demand Fit       [operational]",
    "geo_fit":                "Geographic Fit          [location]",
    "behavioral_fit":         "Behavioural Intent      [live signal]",
    "reliability":            "Reliability & Trust     [payment/certs]",
    "scale_fit":              "Scale Compatibility     [firmographic]",
    "outreach_receptiveness": "Outreach Receptiveness  [timing]",
    "momentum":               "Growth Momentum         [trajectory]",
    "trade_signal":           "Trade History Signal    [execution]",
    "safety_score":           "Macro Safety            [geopolitical]",
}

GEO_SUB_LABELS = {
    "geo_corridor":   "  Trade Corridor Strength",
    "geo_state_spec": "  State Specialisation",
    "geo_regulatory": "  Regulatory/FTA Ease",
    "geo_logistics":  "  Logistics Proximity",
}


def _bar(val, width=20, char="█"):
    return (char * int(float(val) * width)).ljust(width)


def _print_effective_weights(ew: dict):
    print("\n  ── RRF Effective Weights (auto-computed for this search) ────────")
    print("  (higher = this component differentiated candidates most)")
    for comp, label in COMPONENT_LABELS.items():
        w = ew.get(comp, 0.0)
        print(f"  {label:<45} {_bar(w, 25, '▓')} {w:.4f}")
    print()


def _print_breakdown(rank: int, cid: str, score: float, bd: dict, exp=None, imp=None):
    print(f"\n  ── Rank {rank}: {cid}  Score: {score:.4f} ──────────────────────────────")

    # Show location context
    if exp and imp:
        geo_lbl = bd.get("geo_label", "")
        print(f"  Location: {exp.State} (India) → {imp.Country}  |  Geo Tier: {geo_lbl}")

    print(f"\n  {'DIMENSION':<45} {'SCORE BAR':<20}  SCORE")
    print("  " + "─" * 72)
    for comp, label in COMPONENT_LABELS.items():
        val = bd.get(comp, 0.0)
        print(f"  {label:<45} {_bar(val)} {val:.4f}")

    # Geo sub-breakdown
    print(f"\n  Geographic breakdown:")
    for k, lbl in GEO_SUB_LABELS.items():
        val = bd.get(k, 0.0)
        print(f"  {lbl:<35} {_bar(float(val), 15)} {float(val):.4f}")

    # Fusion details
    print(f"\n  Fusion scores:")
    print(f"    CC score          : {bd.get('cc_score',        '–')}")
    print(f"    WRRF score        : {bd.get('wrrf_score',      '–')}")
    print(f"    Consensus bonus   : {bd.get('consensus_bonus', '–')}")
    print(f"    Recency multiplier: {bd.get('recency_mult',    '–')}")
    print(f"    ★ Final Score     : {bd.get('final_score',     '–')}")


def _classification_basis():
    print("""
  ══════════════════════════════════════════════════════════════════
  HOW MATCHES ARE CLASSIFIED — 10 Dimensions Explained
  ══════════════════════════════════════════════════════════════════
  1. Supply-Demand Fit       Can exporter physically fulfil buyer's order volume?
  2. Geographic Fit          Is this India-state → buyer-country a proven trade lane?
                               • Trade corridor strength (industry × country)
                               • State specialisation (e.g. Gujarat=Chemicals hub)
                               • Regulatory ease (India FTA status with country)
                               • Logistics proximity (shipping convenience)
  3. Behavioural Intent      Are BOTH parties actively in buy/sell mode right now?
  4. Reliability & Trust     Payment history + certification compliance overlap
  5. Scale Compatibility     Revenue & team size fit (log-ratio, not min/max)
  6. Outreach Receptiveness  Is this the right MOMENT? (decision-maker change,
                               engagement spike, response probability)
  7. Growth Momentum         Hiring, LinkedIn, SalesNav, funding events
  8. Trade History Signal    Proven shipment track record (value + quantity)
  9. Macro Safety            War/tariff/calamity risk on both sides + industry news
  10. MSME Equity Bonus      Small +3% boost for registered MSME exporters
  ══════════════════════════════════════════════════════════════════
""")


# ── Main loop ─────────────────────────────────────────────────────────────────
print("Commands:")
print("  <ID>        search   (e.g.  EXP_5094  or  BUY_69687)")
print("  <ID> -v     search + full per-match breakdown")
print("  basis       show classification basis explanation")
print("  exit        quit")
print()

while True:
    user_input = input("Enter ID: ").strip()

    if not user_input:
        continue

    if user_input.lower() == "exit":
        break

    if user_input.lower() == "basis":
        _classification_basis()
        continue

    show_v    = user_input.endswith(" -v")
    target_id = user_input[:-3].strip() if show_v else user_input

    # ── Exporter search ───────────────────────────────────────────────────────
    if target_id in exporter_dict:
        exp = exporter_dict[target_id]
        print(f"\nTop 10 Buyers for Exporter [{target_id}]")
        print(f"  Industry : {exp.Industry}")
        print(f"  State    : {exp.State}")
        print(f"  MSME     : {'Yes' if exp.MSME_Flag else 'No'}")
        print("=" * 72)

        results = get_top_buyers(exp, importers, industry_risk_map)

        if not results:
            continue

        _print_effective_weights(results[0][2].get("effective_weights", {}))

        print(f"  {'Rank':<5} {'Buyer ID':<15} {'Country':<14} {'Geo Tier':<10} {'Score':>7}")
        print("  " + "─" * 58)
        for rank, (bid, score, bd) in enumerate(results[:10], 1):
            buyer   = buyer_dict.get(bid)
            country = buyer.Country if buyer else "?"
            geo_lbl = bd.get("geo_label", "?")
            print(f"  {rank:<5} {bid:<15} {country:<14} {geo_lbl:<10} {score:.4f}")

        if show_v:
            for rank, (bid, score, bd) in enumerate(results[:5], 1):
                buyer = buyer_dict.get(bid)
                _print_breakdown(rank, bid, score, bd, exp=exp, imp=buyer)

        print()
        continue

    # ── Buyer search ──────────────────────────────────────────────────────────
    if target_id in buyer_dict:
        imp = buyer_dict[target_id]
        print(f"\nTop 10 Exporters for Buyer [{target_id}]")
        print(f"  Industry : {imp.Industry}")
        print(f"  Country  : {imp.Country}")
        print("=" * 72)

        results = get_top_exporters(imp, exporters, industry_risk_map)

        if not results:
            continue

        _print_effective_weights(results[0][2].get("effective_weights", {}))

        print(f"  {'Rank':<5} {'Exporter ID':<15} {'State':<14} {'Geo Tier':<10} {'Score':>7}")
        print("  " + "─" * 58)
        for rank, (eid, score, bd) in enumerate(results[:10], 1):
            exp     = exporter_dict.get(eid)
            state   = exp.State if exp else "?"
            geo_lbl = bd.get("geo_label", "?")
            print(f"  {rank:<5} {eid:<15} {state:<14} {geo_lbl:<10} {score:.4f}")

        if show_v:
            for rank, (eid, score, bd) in enumerate(results[:5], 1):
                exp = exporter_dict.get(eid)
                _print_breakdown(rank, eid, score, bd, exp=exp, imp=imp)

        print()
        continue

    print(f"  ID '{target_id}' not found. Try EXP_XXXX or BUY_XXXXX\n")
