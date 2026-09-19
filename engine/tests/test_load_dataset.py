from pathlib import Path

from trading_research_lab.data.loader import load_dataset


def test_load_discovery_dataset():
    repo_root = Path(__file__).resolve().parents[2]
    data_dir = repo_root / "data"

    candles, metadata = load_dataset(
        "discovery",
        data_dir=data_dir,
    )

    assert len(candles) == metadata["candleCount"]
    assert len(candles) > 0

    assert metadata["instrument"] == "EUR_USD"
    assert metadata["timeframe"] == "M5"

    assert candles["time"].is_monotonic_increasing
    assert candles["time"].notna().all()