# geo_engine.py  —  Location-based trade corridor matching
#
# Classification basis explained:
# ────────────────────────────────
# India's export geography is NOT uniform. Real trade data shows:
#   - Gujarat dominates Chemicals/Pharma exports
#   - Karnataka/Telangana dominate IT Software
#   - Tamil Nadu dominates Auto Parts
#   - Punjab/Rajasthan dominate Textiles
#
# Similarly, buyer countries have proven appetite for specific industries:
#   - USA/UK: IT Software, Pharmaceuticals, Medical Devices
#   - Germany/Japan: Engineering, Auto Parts, Machinery
#   - UAE: Textiles, Solar, Engineering
#   - Singapore: Electronics, IT Software, Chemicals
#
# The geo score combines:
#   1. TRADE CORRIDOR STRENGTH  — how strong is this Industry×Country pair
#   2. STATE SPECIALISATION     — is the exporter in a hub state for this industry
#   3. REGULATORY EASE          — tariff environment between India and that country
#   4. LOGISTICS PROXIMITY      — distance/trade-route convenience
#
# All four sub-scores fuse into geo_score (0–1), which is used as a
# standalone component in the scoring engine AND as a multiplier on
# demand_fit (location affects whether the order can even be fulfilled).

# ── Trade corridor strengths (Industry × Buyer Country) ───────────────────────
# Source: India EXIM Bank data, DGFT export statistics, WTO trade profiles
# Scale: 1.0 = very strong proven corridor, 0.5 = moderate, 0.3 = weak/emerging
TRADE_CORRIDORS: dict = {
    # Textiles
    ("Textiles", "USA"):          1.00,
    ("Textiles", "UK"):           0.90,
    ("Textiles", "Germany"):      0.85,
    ("Textiles", "France"):       0.80,
    ("Textiles", "Italy"):        0.80,
    ("Textiles", "UAE"):          0.85,
    ("Textiles", "Netherlands"):  0.75,
    ("Textiles", "Canada"):       0.70,
    ("Textiles", "Australia"):    0.65,
    ("Textiles", "Japan"):        0.60,
    ("Textiles", "Singapore"):    0.55,
    # Chemicals
    ("Chemicals", "USA"):         0.90,
    ("Chemicals", "Germany"):     0.95,
    ("Chemicals", "Netherlands"): 0.90,
    ("Chemicals", "Japan"):       0.85,
    ("Chemicals", "Singapore"):   0.85,
    ("Chemicals", "UK"):          0.80,
    ("Chemicals", "UAE"):         0.75,
    ("Chemicals", "France"):      0.75,
    ("Chemicals", "Australia"):   0.70,
    ("Chemicals", "Canada"):      0.70,
    ("Chemicals", "Italy"):       0.65,
    # Pharmaceuticals
    ("Pharmaceuticals", "USA"):         1.00,
    ("Pharmaceuticals", "UK"):          0.95,
    ("Pharmaceuticals", "Germany"):     0.90,
    ("Pharmaceuticals", "Australia"):   0.85,
    ("Pharmaceuticals", "Canada"):      0.85,
    ("Pharmaceuticals", "France"):      0.80,
    ("Pharmaceuticals", "Japan"):       0.75,
    ("Pharmaceuticals", "Netherlands"): 0.75,
    ("Pharmaceuticals", "UAE"):         0.70,
    ("Pharmaceuticals", "Singapore"):   0.70,
    ("Pharmaceuticals", "Italy"):       0.65,
    # Engineering
    ("Engineering", "Germany"):   0.95,
    ("Engineering", "USA"):       0.85,
    ("Engineering", "UK"):        0.85,
    ("Engineering", "UAE"):       0.80,
    ("Engineering", "Japan"):     0.80,
    ("Engineering", "Australia"): 0.75,
    ("Engineering", "Italy"):     0.75,
    ("Engineering", "France"):    0.70,
    ("Engineering", "Singapore"): 0.70,
    ("Engineering", "Canada"):    0.65,
    ("Engineering", "Netherlands"):0.65,
    # Auto Parts
    ("Auto Parts", "Germany"):    0.95,
    ("Auto Parts", "Japan"):      0.90,
    ("Auto Parts", "USA"):        0.90,
    ("Auto Parts", "UK"):         0.85,
    ("Auto Parts", "France"):     0.80,
    ("Auto Parts", "Italy"):      0.80,
    ("Auto Parts", "Australia"):  0.75,
    ("Auto Parts", "Canada"):     0.70,
    ("Auto Parts", "Singapore"):  0.65,
    ("Auto Parts", "UAE"):        0.60,
    ("Auto Parts", "Netherlands"):0.60,
    # Electronics
    ("Electronics", "USA"):         0.90,
    ("Electronics", "Germany"):     0.90,
    ("Electronics", "Japan"):       0.95,
    ("Electronics", "Singapore"):   0.95,
    ("Electronics", "UK"):          0.80,
    ("Electronics", "Netherlands"): 0.80,
    ("Electronics", "France"):      0.75,
    ("Electronics", "Australia"):   0.75,
    ("Electronics", "Canada"):      0.70,
    ("Electronics", "UAE"):         0.65,
    ("Electronics", "Italy"):       0.65,
    # IT Software
    ("IT Software", "USA"):         1.00,
    ("IT Software", "UK"):          0.95,
    ("IT Software", "Australia"):   0.90,
    ("IT Software", "Canada"):      0.90,
    ("IT Software", "Singapore"):   0.90,
    ("IT Software", "Germany"):     0.85,
    ("IT Software", "Netherlands"): 0.80,
    ("IT Software", "France"):      0.75,
    ("IT Software", "UAE"):         0.75,
    ("IT Software", "Japan"):       0.70,
    ("IT Software", "Italy"):       0.65,
    # Solar
    ("Solar", "Australia"):   0.95,
    ("Solar", "Germany"):     0.90,
    ("Solar", "UAE"):         0.90,
    ("Solar", "USA"):         0.85,
    ("Solar", "Japan"):       0.85,
    ("Solar", "UK"):          0.80,
    ("Solar", "Singapore"):   0.75,
    ("Solar", "France"):      0.75,
    ("Solar", "Netherlands"): 0.70,
    ("Solar", "Italy"):       0.70,
    ("Solar", "Canada"):      0.70,
    # Machinery
    ("Machinery", "Germany"):     0.95,
    ("Machinery", "Japan"):       0.90,
    ("Machinery", "USA"):         0.85,
    ("Machinery", "UAE"):         0.80,
    ("Machinery", "UK"):          0.80,
    ("Machinery", "Italy"):       0.80,
    ("Machinery", "Singapore"):   0.75,
    ("Machinery", "Australia"):   0.70,
    ("Machinery", "France"):      0.70,
    ("Machinery", "Netherlands"): 0.65,
    ("Machinery", "Canada"):      0.65,
    # Medical Devices
    ("Medical Devices", "USA"):         1.00,
    ("Medical Devices", "Germany"):     0.90,
    ("Medical Devices", "UK"):          0.90,
    ("Medical Devices", "Japan"):       0.85,
    ("Medical Devices", "Australia"):   0.85,
    ("Medical Devices", "France"):      0.80,
    ("Medical Devices", "Canada"):      0.80,
    ("Medical Devices", "Netherlands"): 0.75,
    ("Medical Devices", "Singapore"):   0.75,
    ("Medical Devices", "UAE"):         0.70,
    ("Medical Devices", "Italy"):       0.65,
}

# ── Indian state specialisation by industry ────────────────────────────────────
# 1.0 = primary hub, 0.8 = strong, 0.6 = moderate, 0.4 = minor presence
STATE_SPECIALISATION: dict = {
    "Gujarat":     {
        "Chemicals": 1.0, "Pharmaceuticals": 1.0, "Textiles": 0.85,
        "Engineering": 0.75, "Machinery": 0.70, "Solar": 0.70,
        "Auto Parts": 0.55, "Electronics": 0.50, "IT Software": 0.40, "Medical Devices": 0.60,
    },
    "Maharashtra": {
        "IT Software": 1.0, "Pharmaceuticals": 0.90, "Engineering": 0.85,
        "Auto Parts": 0.85, "Chemicals": 0.75, "Machinery": 0.80,
        "Electronics": 0.70, "Medical Devices": 0.80, "Textiles": 0.65, "Solar": 0.60,
    },
    "Tamil Nadu":  {
        "Auto Parts": 1.0, "Textiles": 0.90, "Machinery": 0.85,
        "Electronics": 0.80, "Engineering": 0.75, "Chemicals": 0.65,
        "Pharmaceuticals": 0.60, "Solar": 0.65, "IT Software": 0.70, "Medical Devices": 0.65,
    },
    "Karnataka":   {
        "IT Software": 1.0, "Electronics": 0.90, "Engineering": 0.80,
        "Machinery": 0.75, "Pharmaceuticals": 0.70, "Medical Devices": 0.75,
        "Auto Parts": 0.65, "Chemicals": 0.60, "Textiles": 0.55, "Solar": 0.70,
    },
    "Delhi":       {
        "IT Software": 0.90, "Textiles": 0.85, "Engineering": 0.80,
        "Electronics": 0.75, "Pharmaceuticals": 0.70, "Machinery": 0.65,
        "Chemicals": 0.60, "Auto Parts": 0.60, "Medical Devices": 0.65, "Solar": 0.55,
    },
    "Telangana":   {
        "IT Software": 1.0, "Pharmaceuticals": 0.90, "Electronics": 0.80,
        "Engineering": 0.70, "Medical Devices": 0.75, "Chemicals": 0.65,
        "Machinery": 0.60, "Auto Parts": 0.55, "Textiles": 0.50, "Solar": 0.65,
    },
    "Punjab":      {
        "Textiles": 1.0, "Auto Parts": 0.80, "Engineering": 0.75,
        "Machinery": 0.70, "Chemicals": 0.60, "Electronics": 0.50,
        "IT Software": 0.55, "Pharmaceuticals": 0.55, "Medical Devices": 0.50, "Solar": 0.55,
    },
    "Haryana":     {
        "Auto Parts": 0.90, "Engineering": 0.85, "Textiles": 0.80,
        "Machinery": 0.75, "Electronics": 0.65, "IT Software": 0.65,
        "Chemicals": 0.60, "Pharmaceuticals": 0.55, "Medical Devices": 0.55, "Solar": 0.55,
    },
    "Rajasthan":   {
        "Textiles": 0.95, "Chemicals": 0.80, "Machinery": 0.70,
        "Engineering": 0.65, "Auto Parts": 0.60, "Solar": 0.75,
        "Electronics": 0.50, "IT Software": 0.50, "Pharmaceuticals": 0.55, "Medical Devices": 0.50,
    },
}

# ── Regulatory / tariff environment (India FTA status) ────────────────────────
# Based on India's Free Trade Agreements and GSP benefits as of 2024
# Higher = easier regulatory access, lower tariffs, less paperwork
REGULATORY_EASE: dict = {
    "UAE":          0.95,   # India-UAE CEPA signed 2022 — very strong
    "Australia":    0.90,   # India-Australia ECTA signed 2022
    "Singapore":    0.85,   # CECA with Singapore — long-standing
    "Japan":        0.80,   # India-Japan CEPA
    "Germany":      0.75,   # EU relations — no FTA but stable
    "France":       0.75,
    "Netherlands":  0.75,
    "Italy":        0.72,
    "UK":           0.70,   # Post-Brexit FTA in progress
    "Canada":       0.65,   # FIPA in negotiation
    "USA":          0.60,   # No FTA — GSP partially restored
}

# ── Logistics proximity score (India export convenience) ──────────────────────
# Based on shipping lanes, freight costs, transit time from India
LOGISTICS_SCORE: dict = {
    "UAE":          1.00,   # closest major trading partner, major re-export hub
    "Singapore":    0.95,   # key SE Asia gateway
    "UK":           0.80,
    "Germany":      0.78,
    "Netherlands":  0.78,   # Port of Rotterdam — EU entry point
    "France":       0.75,
    "Italy":        0.73,
    "Australia":    0.70,
    "Japan":        0.72,
    "USA":          0.68,   # long transit but high volume
    "Canada":       0.60,
}

DEFAULT_CORRIDOR    = 0.40   # unknown industry×country pair
DEFAULT_STATE_SPEC  = 0.50   # unknown state
DEFAULT_REGULATORY  = 0.55
DEFAULT_LOGISTICS   = 0.55


def compute_geo_score(state: str, country: str, industry: str) -> dict:
    """
    Compute a composite geographic match score (0–1) for one exporter–importer pair.

    Returns dict with:
        geo_score        — final composite (0–1), used in scoring engine
        corridor_score   — industry × country trade strength
        state_spec_score — exporter state specialisation for this industry
        regulatory_score — India FTA/tariff ease with buyer country
        logistics_score  — shipping convenience from India to buyer country
        geo_label        — human-readable tier: Premium / Strong / Moderate / Weak
    """
    corridor   = TRADE_CORRIDORS.get((industry, country), DEFAULT_CORRIDOR)
    state_spec = STATE_SPECIALISATION.get(state, {}).get(industry, DEFAULT_STATE_SPEC)
    regulatory = REGULATORY_EASE.get(country, DEFAULT_REGULATORY)
    logistics  = LOGISTICS_SCORE.get(country, DEFAULT_LOGISTICS)

    # Weighted composite — corridor and state-spec carry most weight
    geo_score = (
        0.40 * corridor   +
        0.30 * state_spec +
        0.20 * regulatory +
        0.10 * logistics
    )

    # Clamp
    geo_score = max(0.0, min(1.0, geo_score))

    # Human-readable tier
    if geo_score >= 0.80:
        label = "Premium"
    elif geo_score >= 0.65:
        label = "Strong"
    elif geo_score >= 0.50:
        label = "Moderate"
    else:
        label = "Weak"

    return {
        "geo_score":        round(geo_score,  4),
        "corridor_score":   round(corridor,   4),
        "state_spec_score": round(state_spec, 4),
        "regulatory_score": round(regulatory, 4),
        "logistics_score":  round(logistics,  4),
        "geo_label":        label,
    }
