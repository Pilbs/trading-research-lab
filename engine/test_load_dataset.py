from trading_research_lab.data.loader import load_dataset

candles, metadata = load_dataset(
    "discovery",
    data_dir="../data",
)

print(metadata)
print()
print(candles.head())
print()
print(candles.tail())
print()
print(f"Candles: {len(candles):,}")
print(f"From: {candles['datetime'].iloc[0]}")
print(f"To:   {candles['datetime'].iloc[-1]}")