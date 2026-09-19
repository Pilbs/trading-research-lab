import json
from pathlib import Path

import pandas as pd


REQUIRED_COLUMNS = [
    "time",
    "volume",
    "bid_open",
    "bid_high",
    "bid_low",
    "bid_close",
    "ask_open",
    "ask_high",
    "ask_low",
    "ask_close",
    "mid_open",
    "mid_high",
    "mid_low",
    "mid_close",
]


def load_dataset(name: str, data_dir: str | Path = "data"):
    data_dir = Path(data_dir)

    csv_path = data_dir / f"{name}.csv"
    meta_path = data_dir / f"{name}.meta.json"

    if not csv_path.exists():
        raise FileNotFoundError(csv_path)

    if not meta_path.exists():
        raise FileNotFoundError(meta_path)

    with meta_path.open("r", encoding="utf-8") as file:
        metadata = json.load(file)

    candles = pd.read_csv(csv_path)

    missing = [
        column
        for column in REQUIRED_COLUMNS
        if column not in candles.columns
    ]

    if missing:
        raise ValueError(
            f"Dataset missing required columns: {missing}"
        )

    if len(candles) != metadata["candleCount"]:
        raise ValueError(
            f"Candle count mismatch: "
            f"CSV={len(candles)}, "
            f"metadata={metadata['candleCount']}"
        )

    candles["datetime"] = pd.to_datetime(
        candles["time"],
        unit="ms",
        utc=True,
    )

    candles = candles.sort_values("time").reset_index(drop=True)

    return candles, metadata