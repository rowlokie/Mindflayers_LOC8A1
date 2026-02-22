import pickle
from preprocess import load_exporters, load_importers, load_news
from risk_engine import compute_industry_risk

EXPORTER_PATH = "data/EXIM_DatasetAlgo_Hackathon(Exporter_LiveSignals_v5_Updated).csv"
IMPORTER_PATH = "data/EXIM_DatasetAlgo_Hackathon(Importer_LiveSignals_v5_Updated).csv"
NEWS_PATH     = "data/EXIM_DatasetAlgo_Hackathon(Global_News_LiveSignals_Updated) (1).csv"

print("Loading and preprocessing...")

exporters = load_exporters(EXPORTER_PATH)
importers = load_importers(IMPORTER_PATH)
news_df   = load_news(NEWS_PATH)

industry_risk_map = compute_industry_risk(news_df)

artifacts = {
    "exporters": exporters,
    "importers": importers,
    "industry_risk_map": industry_risk_map
}

with open("exim_matchmaker.pkl", "wb") as f:
    pickle.dump(artifacts, f)

print("✅ PKL file created: exim_matchmaker.pkl")