# demo.py

from preprocess import load_exporters, load_importers
from matchmaker import run_matchmaking

EXPORTER_PATH = r"C:\Users\PRASAD\Downloads\3.0-Model+Training\exim_matchmaker\data\EXIM_DatasetAlgo_Hackathon(Exporter_LiveSignals_v5_Updated).csv"

IMPORTER_PATH = r"C:\Users\PRASAD\Downloads\3.0-Model+Training\exim_matchmaker\data\EXIM_DatasetAlgo_Hackathon(Importer_LiveSignals_v5_Updated).csv"


print("Loading Data...")

exporters = load_exporters(EXPORTER_PATH)
importers = load_importers(IMPORTER_PATH)

print("Exporters:", len(exporters))
print("Importers:", len(importers))

print("\nRunning Matching...\n")

results = run_matchmaking(exporters, importers)

for exp, matches in results.items():
    print("\nExporter:", exp)
    for m in matches:
        print("   Buyer:", m[0], "| Score:", m[1])