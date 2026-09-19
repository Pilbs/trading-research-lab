from dataclasses import dataclass


@dataclass
class HorizonObservation:
    future_close: float | None
    raw_price_change: float | None
    pip_change: float | None
    directional_price_change: float | None
    directional_pip_change: float | None


@dataclass
class ResearchObservation:
    hypothesis_id: str
    dataset: str

    event_time: int
    event_price: float
    direction: str

    instrument: str
    timeframe: str

    plus_5m: HorizonObservation
    plus_15m: HorizonObservation
    plus_30m: HorizonObservation
    plus_60m: HorizonObservation

    highest_price_60m: float | None
    lowest_price_60m: float | None

    mfe_price: float | None
    mfe_pips: float | None

    mae_price: float | None
    mae_pips: float | None