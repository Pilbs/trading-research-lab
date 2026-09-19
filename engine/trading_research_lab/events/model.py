from dataclasses import dataclass, field
from typing import Any


@dataclass
class ResearchEvent:
    hypothesis_id: str
    time: int
    direction: str
    price: float

    instrument: str
    timeframe: str

    context: dict[str, Any] = field(default_factory=dict)