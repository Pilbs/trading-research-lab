from trading_research_lab.events.model import ResearchEvent


def detect_events(candles, metadata):
    events = []

    instrument = metadata["instrument"]
    timeframe = metadata["timeframe"]
    
    for index, row in candles.iterrows():
        if index == 0 or index % 100 != 0:
            continue
        event_number = index // 100
        events.append(
            ResearchEvent(
                hypothesis_id="AAA_TESTING_every_100th_candle",
                time=int(row["time"]),
                direction = (
                    "LONG"
                    if event_number % 2 == 1
                    else "SHORT"
                    ),
                price=float(row["mid_close"]),
                instrument=instrument,
                timeframe=timeframe,
                context={
                    "candle_index": int(index),
                    "event_number": int(event_number),
                },
            )
        )

    return events