# preprocess.py

import pandas as pd
import numpy as np
from data_models import ExporterProfile, ImporterProfile


def split_cert(x):
    if pd.isna(x):
        return []
    return [i.strip() for i in str(x).split(",") if i.strip()]


def recency_weight(date_str, reference_date=pd.Timestamp("2025-01-01")):
    """Exponential decay: 1.0 for recent records, ~0.5 at 2 years old."""
    try:
        d = pd.to_datetime(date_str)
        days_old = max((reference_date - d).days, 0)
        return float(np.exp(-days_old / 730))
    except Exception:
        return 0.5


def _fill_median(series: pd.Series) -> pd.Series:
    return series.fillna(series.median())


def load_exporters(path: str):
    df = pd.read_csv(path)

    # ── Null imputation ───────────────────────────────────────────────────────
    df["Manufacturing_Capacity_Tons"] = _fill_median(df["Manufacturing_Capacity_Tons"])
    df["Shipment_Value_USD"]          = _fill_median(df["Shipment_Value_USD"])
    df["MSME_Udyam"]  = pd.to_numeric(df["MSME_Udyam"], errors="coerce").fillna(0).astype(int)

    exporters = []
    for _, r in df.iterrows():
        exporters.append(ExporterProfile(
            Exporter_ID                 = str(r["Exporter_ID"]),
            Date                        = str(r["Date"]),
            Industry                    = str(r["Industry"]),
            State                       = str(r.get("State", "Unknown")),
            MSME_Flag                   = int(r["MSME_Udyam"]),
            Manufacturing_Capacity_Tons = float(r["Manufacturing_Capacity_Tons"]),
            Revenue_Size_USD            = float(r["Revenue_Size_USD"]),
            Team_Size                   = int(r["Team_Size"]),
            Certification               = split_cert(r["Certification"]),
            Good_Payment_Terms          = float(r["Good_Payment_Terms"]),
            Prompt_Response_Score       = float(r["Prompt_Response_Score"]),
            Hiring_Signal               = float(r["Hiring_Signal"]),
            LinkedIn_Activity           = float(r["LinkedIn_Activity"]),
            SalesNav_ProfileViews       = float(r["SalesNav_ProfileViews"]),
            SalesNav_JobChange          = float(r["SalesNav_JobChange"]),
            Intent_Score                = float(r["Intent_Score"]),
            Shipment_Value_USD          = float(r["Shipment_Value_USD"]),
            Quantity_Tons               = float(r["Quantity_Tons"]),
            Tariff_Impact               = float(r["Tariff_Impact"]),
            StockMarket_Impact          = float(r["StockMarket_Impact"]),
            War_Risk                    = float(r["War_Risk"]),
            Natural_Calamity_Risk       = float(r["Natural_Calamity_Risk"]),
            Currency_Shift              = float(r["Currency_Shift"]),
            Recency_Weight              = recency_weight(r["Date"]),
        ))
    return exporters


def load_importers(path: str):
    df = pd.read_csv(path)

    # ── Null imputation ───────────────────────────────────────────────────────
    df["Avg_Order_Tons"]      = _fill_median(df["Avg_Order_Tons"])
    df["Response_Probability"]= df["Response_Probability"].fillna(0.5)
    df["Funding_Event"]       = pd.to_numeric(df["Funding_Event"], errors="coerce").fillna(0)
    df["Preferred_Channel"]   = df["Preferred_Channel"].fillna("Email")

    importers = []
    for _, r in df.iterrows():
        if pd.isna(r["Buyer_ID"]):
            continue
        importers.append(ImporterProfile(
            Buyer_ID              = str(r["Buyer_ID"]),
            Date                  = str(r["Date"]),
            Industry              = str(r["Industry"]),
            Country               = str(r.get("Country", "Unknown")),
            Avg_Order_Tons        = float(r["Avg_Order_Tons"]),
            Revenue_Size_USD      = float(r["Revenue_Size_USD"]),
            Team_Size             = int(r["Team_Size"]),
            Certification         = split_cert(r["Certification"]),
            Good_Payment_History  = float(r["Good_Payment_History"]),
            Prompt_Response       = float(r["Prompt_Response"]),
            Hiring_Growth         = float(r["Hiring_Growth"]),
            Funding_Event         = float(r["Funding_Event"]),
            Engagement_Spike      = float(r["Engagement_Spike"]),
            SalesNav_ProfileVisits= float(r["SalesNav_ProfileVisits"]),
            DecisionMaker_Change  = float(r["DecisionMaker_Change"]),
            Intent_Score          = float(r["Intent_Score"]),
            Preferred_Channel     = str(r["Preferred_Channel"]),
            Response_Probability  = float(r["Response_Probability"]),
            Tariff_News           = float(r["Tariff_News"]),
            StockMarket_Shock     = float(r["StockMarket_Shock"]),
            War_Event             = float(r["War_Event"]),
            Natural_Calamity      = float(r["Natural_Calamity"]),
            Currency_Fluctuation  = float(r["Currency_Fluctuation"]),
            Recency_Weight        = recency_weight(r["Date"]),
        ))
    return importers


def load_news(path: str):
    return pd.read_csv(path)
