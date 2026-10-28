from pydantic import BaseModel, Field
from typing import Literal
class GenerateRequest(BaseModel):
    topic: str=Field(min_length=3,max_length=300)
    level: Literal["beginner","intermediate","advanced"]="beginner"
    minutes: int=Field(default=1,ge=1,le=15)
    narration: str="en"
    captions: str="en"
class ExportRequest(BaseModel):
    lessonId: str=Field(min_length=1,max_length=100)
    narration: str="en"
    captions: str="en"
    resolution: Literal["1080p","720p","480p"]="720p"
    format: Literal["mp4","webm"]="mp4"
    burnInCaptions: bool=True
