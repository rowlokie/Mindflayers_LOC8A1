# matchmaker.py

from scoring_engine import compute_rrf_scores


def get_top_buyers(exporter, importers, industry_risk_map, top_k=100):
    """Top buyers for an exporter. Returns (buyer_id, score, breakdown) list."""
    candidates = [imp for imp in importers if imp.Industry == exporter.Industry]
    if not candidates:
        print(f"  [Warning] No buyers found for industry: {exporter.Industry}")
        return []
    results = compute_rrf_scores(exporter, candidates, industry_risk_map)
    results.sort(key=lambda x: x[1], reverse=True)
    return results[:top_k]


def get_top_exporters(buyer, exporters, industry_risk_map, top_k=100):
    """Top exporters for a buyer. Returns (exporter_id, score, breakdown) list."""
    candidates = [exp for exp in exporters if exp.Industry == buyer.Industry]
    if not candidates:
        print(f"  [Warning] No exporters found for industry: {buyer.Industry}")
        return []
    results = compute_rrf_scores(buyer, candidates, industry_risk_map)
    results.sort(key=lambda x: x[1], reverse=True)
    return results[:top_k]
