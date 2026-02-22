# data_models.py

from dataclasses import dataclass
from typing import List
import math


@dataclass
class ExporterProfile:
    Exporter_ID: str
    Date: str
    Industry: str
    State: str                        # Indian state — used for geo matching
    MSME_Flag: int                    # 1 = MSME/Udyam registered
    Manufacturing_Capacity_Tons: float
    Revenue_Size_USD: float
    Team_Size: int
    Certification: List[str]
    Good_Payment_Terms: float
    Prompt_Response_Score: float
    Hiring_Signal: float
    LinkedIn_Activity: float
    SalesNav_ProfileViews: float
    SalesNav_JobChange: float
    Intent_Score: float
    Shipment_Value_USD: float
    Quantity_Tons: float
    Tariff_Impact: float
    StockMarket_Impact: float
    War_Risk: float
    Natural_Calamity_Risk: float
    Currency_Shift: float
    Recency_Weight: float = 1.0


@dataclass
class ImporterProfile:
    Buyer_ID: str
    Date: str
    Industry: str
    Country: str                      # Buyer country — used for geo matching
    Avg_Order_Tons: float
    Revenue_Size_USD: float
    Team_Size: int
    Certification: List[str]
    Good_Payment_History: float
    Prompt_Response: float
    Hiring_Growth: float
    Funding_Event: float
    Engagement_Spike: float
    SalesNav_ProfileVisits: float
    DecisionMaker_Change: float
    Intent_Score: float
    Preferred_Channel: str
    Response_Probability: float
    Tariff_News: float
    StockMarket_Shock: float
    War_Event: float
    Natural_Calamity: float
    Currency_Fluctuation: float
    Recency_Weight: float = 1.0


# ── math helpers ──────────────────────────────────────────────────────────────

def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))


def jaccard_similarity(a, b):
    a, b = set(a), set(b)
    if not a and not b:
        return 1.0
    return len(a & b) / len(a | b)


def log_ratio_similarity(x, y):
    """
    Similarity in log-space. Returns 1.0 when equal, decays as ratio diverges.
    Much better than min/max for values spanning orders of magnitude.
    σ=1.5 means a 4× gap still scores ~0.60 (not near-zero).
    """
    if x <= 0 or y <= 0:
        return 0.0
    ratio = math.log(x / y)
    return math.exp(-0.5 * (ratio / 1.5) ** 2)
