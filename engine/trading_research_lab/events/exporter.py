import json
from dataclasses import asdict
from pathlib import Path


def export_events(
    events,
    dataset_name: str,
    output_dir: str | Path = "outputs",
):
    if not events:
        raise ValueError("No events to export")

    hypothesis_id = events[0].hypothesis_id

    output_path = (
        Path(output_dir)
        / dataset_name
        / f"{hypothesis_id}.events.json"
    )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    payload = {
        "hypothesisId": hypothesis_id,
        "dataset": dataset_name,
        "eventCount": len(events),
        "events": [
            asdict(event)
            for event in events
        ],
    }

    with output_path.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            payload,
            file,
            indent=2,
        )

    return output_path