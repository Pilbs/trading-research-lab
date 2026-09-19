import json
from dataclasses import asdict
from pathlib import Path


def export_observations(
    observations,
    dataset_name: str,
    output_dir: str | Path = "outputs",
):
    if not observations:
        raise ValueError("No observations to export")

    output_dir = Path(output_dir)

    hypothesis_id = observations[0].hypothesis_id

    dataset_dir = output_dir / dataset_name
    dataset_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path = (
        dataset_dir
        / f"{hypothesis_id}.observations.json"
    )

    payload = {
        "hypothesisId": hypothesis_id,
        "dataset": dataset_name,
        "observationCount": len(observations),
        "observations": [
            asdict(observation)
            for observation in observations
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