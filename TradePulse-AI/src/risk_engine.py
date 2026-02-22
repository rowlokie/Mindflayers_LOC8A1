# risk_engine.py

import pandas as pd
import numpy as np

IMPACT_WEIGHTS = {"High": 1.0, "Medium": 0.6, "Low": 0.3}


def compute_industry_risk(news_df: pd.DataFrame) -> dict:
    """
    Compute recency-weighted, impact-weighted risk score per industry (0–1).
    Higher = riskier industry environment right now.
    """
    news_df = news_df.copy()
    news_df["Date"] = pd.to_datetime(news_df["Date"], errors="coerce")
    ref = pd.Timestamp("2025-01-01")
    news_df["days_old"]  = (ref - news_df["Date"]).dt.days.fillna(730)
    news_df["recency_w"] = np.exp(-news_df["days_old"] / 730)
    news_df["impact_w"]  = news_df["Impact_Level"].map(IMPACT_WEIGHTS).fillna(0.5)
    news_df["weight"]    = news_df["recency_w"] * news_df["impact_w"]

    news_df["raw_risk"] = (
        news_df["Tariff_Change"].abs().clip(0, 1)       * 0.25 +
        news_df["StockMarket_Shock"].abs().clip(0, 1)   * 0.25 +
        news_df["War_Flag"].clip(0, 1)                  * 0.30 +
        news_df["Natural_Calamity_Flag"].clip(0, 1)     * 0.10 +
        news_df["Currency_Shift"].abs().clip(0, 1)      * 0.10
    )

    result = {}
    for ind, grp in news_df.groupby("Affected_Industry"):
        w = grp["weight"].values
        r = grp["raw_risk"].values
        result[ind] = float(np.average(r, weights=w)) if w.sum() > 0 else 0.5

    if result:
        lo, hi = min(result.values()), max(result.values())
        span = hi - lo if hi > lo else 1.0
        result = {k: (v - lo) / span for k, v in result.items()}

    return result
