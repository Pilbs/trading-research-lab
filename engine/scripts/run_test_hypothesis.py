from trading_research_lab.data.loader import load_dataset
from trading_research_lab.events.exporter import export_events

from trading_research_lab.hypotheses.AAA_TESTING_every_100th_candle import (
    detect_events,
)


candles, metadata = load_dataset(
    "discovery",
    data_dir="../data",
)

events = detect_events(
    candles,
    metadata,
)

print(f"Events detected: {len(events):,}")
print()

for event in events[:5]:
    print(event)

output_path = export_events(
    events,
    dataset_name="discovery",
)

print(f"Exported to: {output_path}")