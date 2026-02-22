# test_run.py

from preprocess import load_exporters, load_importers
from matchmaker import run_matchmaking

EXPORTER_PATH = r"C:\Users\PRASAD\Downloads\3.0-Model+Training\exim_matchmaker\data\EXIM_DatasetAlgo_Hackathon(Exporter_LiveSignals_v5_Updated).csv"

IMPORTER_PATH = r"C:\Users\PRASAD\Downloads\3.0-Model+Training\exim_matchmaker\data\EXIM_DatasetAlgo_Hackathon(Importer_LiveSignals_v5_Updated).csv"


print("Loading small test dataset...")

# Load only small subset for testing
exporters = load_exporters(EXPORTER_PATH)[:3]
importers = load_importers(IMPORTER_PATH)[:10]

print("Exporters Loaded:", len(exporters))
print("Importers Loaded:", len(importers))

print("\nRunning Test Matching...\n")

results = run_matchmaking(exporters, importers)

for exp, matches in results.items():
    print("\nExporter:", exp)
    for buyer, score in matches:
        print("   Buyer:", buyer, "| Score:", score)

print("\nTest completed successfully.")