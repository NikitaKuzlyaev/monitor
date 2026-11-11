from typing import List

from pydantic import BaseModel


class Run(BaseModel):
    contestant: str
    problemLetter: str
    timeMinutesFromStart: int
    success: bool


class SarisLog(BaseModel):
    contestName: str
    freezeTimeMinutesFromStart: int
    problemLetters: List[str]
    contestants: List[str]
    runs: List[Run]
