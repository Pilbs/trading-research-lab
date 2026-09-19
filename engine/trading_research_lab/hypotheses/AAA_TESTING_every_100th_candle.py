from trading_research_lab.events.model import ResearchEvent


def detect_events(candles, metadata):
    events = []

    instrument = metadata["instrument"]
    timeframe = metadata["timeframe"]

    for index, row in candles.iterrows():
        if index % 100 != 0:
            continue

        events.append(
            ResearchEvent(
                hypothesis_id="AAA_TESTING_every_100th_candle",
                time=int(row["time"]),
                direction="NEUTRAL",
                price=float(row["mid_close"]),
                instrument=instrument,
                timeframe=timeframe,
                context={
                    "candle_index": int(index),
                },
            )
        )

    return events