from trading_research_lab.observations.model import (
    HorizonObservation,
    ResearchObservation,
)


HORIZONS_MINUTES = {
    "plus_5m": 5,
    "plus_15m": 15,
    "plus_30m": 30,
    "plus_60m": 60,
}


def _pip_size(instrument: str) -> float:
    if instrument.endswith("_JPY"):
        return 0.01

    return 0.0001


def _direction_multiplier(direction: str) -> int:
    if direction == "LONG":
        return 1

    if direction == "SHORT":
        return -1

    raise ValueError(
        f"Unsupported event direction: {direction}"
    )

def _round_price(value: float | None) -> float | None:
    if value is None:
        return None

    return round(value, 10)


def _round_pips(value: float | None) -> float | None:
    if value is None:
        return None

    return round(value, 3)


def _build_horizon_observation(
    future_close: float | None,
    event_price: float,
    direction: str,
    pip_size: float,
) -> HorizonObservation:
    if future_close is None:
        return HorizonObservation(
            future_close=None,
            raw_price_change=None,
            pip_change=None,
            directional_price_change=None,
            directional_pip_change=None,
        )

    raw_change = future_close - event_price

    directional_change = (
        raw_change
        * _direction_multiplier(direction)
    )

    return HorizonObservation(
    future_close=_round_price(future_close),
    raw_price_change=_round_price(raw_change),
    pip_change=_round_pips(raw_change / pip_size),
    directional_price_change=_round_price(
        directional_change
    ),
    directional_pip_change=_round_pips(
        directional_change / pip_size
    ),
)


def generate_observation(
    event,
    candles,
    dataset_name: str,
) -> ResearchObservation:
    pip_size = _pip_size(event.instrument)

    event_rows = candles[
        candles["time"] == event.time
    ]

    if event_rows.empty:
        raise ValueError(
            f"Event candle not found: {event.time}"
        )

    event_index = event_rows.index[0]

    horizons = {}

    for field_name, minutes in HORIZONS_MINUTES.items():
        target_time = (
            event.time
            + minutes * 60 * 1000
        )

        future_rows = candles[
            candles["time"] == target_time
        ]

        future_close = None

        if not future_rows.empty:
            future_close = float(
                future_rows.iloc[0]["mid_close"]
            )

        horizons[field_name] = (
            _build_horizon_observation(
                future_close=future_close,
                event_price=event.price,
                direction=event.direction,
                pip_size=pip_size,
            )
        )

    window_end_time = (
        event.time
        + 60 * 60 * 1000
    )

    future_window = candles[
        (candles["time"] > event.time)
        & (candles["time"] <= window_end_time)
    ]

    highest_price = None
    lowest_price = None
    mfe_price = None
    mae_price = None

    if not future_window.empty:
        highest_price = float(
            future_window["mid_high"].max()
        )

        lowest_price = float(
            future_window["mid_low"].min()
        )

        if event.direction == "LONG":
            mfe_price = max(
                0.0,
                highest_price - event.price,
            )

            mae_price = max(
                0.0,
                event.price - lowest_price,
            )

        elif event.direction == "SHORT":
            mfe_price = max(
                0.0,
                event.price - lowest_price,
            )

            mae_price = max(
                0.0,
                highest_price - event.price,
            )

        else:
            raise ValueError(
                f"Unsupported event direction: "
                f"{event.direction}"
            )

    return ResearchObservation(
        hypothesis_id=event.hypothesis_id,
        dataset=dataset_name,
        event_time=event.time,
        event_price=event.price,
        direction=event.direction,
        instrument=event.instrument,
        timeframe=event.timeframe,

        plus_5m=horizons["plus_5m"],
        plus_15m=horizons["plus_15m"],
        plus_30m=horizons["plus_30m"],
        plus_60m=horizons["plus_60m"],

        highest_price_60m=_round_price(highest_price),
        lowest_price_60m=_round_price(lowest_price),

        mfe_price=_round_price(mfe_price),
        mfe_pips=(
            None
            if mfe_price is None
            else _round_pips(mfe_price / pip_size)
        ),

        mae_price=_round_price(mae_price),
        mae_pips=(
            None
            if mae_price is None
            else _round_pips(mae_price / pip_size)
        ),
    )


def generate_observations(
    events,
    candles,
    dataset_name: str,
):
    return [
        generate_observation(
            event=event,
            candles=candles,
            dataset_name=dataset_name,
        )
        for event in events
    ]