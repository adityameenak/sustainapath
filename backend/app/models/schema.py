from pydantic import BaseModel, validator
from typing import List, Optional, Dict, Union

class ProcessStep(BaseModel):
    name: str
    chemical: str
    temperature: float
    pressure: float
    duration: float
    cost_usd: float
    energy_kwh: float
    waste_kg: float
    solvent_used: str

class Suggestion(BaseModel):
    message: str
    step_index: Optional[int] = None

class ProcessInput(BaseModel):
    steps: List[ProcessStep]
    optimization_goal: Optional[str] = None

    @validator("optimization_goal")
    def validate_goal(cls, v):
        allowed = {"sustainability", "cost", "time"}
        if v and v not in allowed:
            raise ValueError(f"Invalid optimization goal: {v}. Must be one of {allowed}.")
        return v

class OptimizationResult(BaseModel):
    score: Optional[float] = None
    goal: Optional[str] = None
    total_cost: float
    total_energy: float
    total_waste: float
    suggestions: List[Suggestion]

class ChatPrompt(BaseModel):
    prompt: str
    goal: Optional[str] = None

    @validator("goal")
    def validate_goal(cls, v):
        allowed = {"sustainability", "cost", "time"}
        if v and v not in allowed:
            raise ValueError(f"Invalid goal: {v}. Must be one of {allowed}.")
        return v

class ProcessNode(BaseModel):
    id: str
    type: str
    label: str
    properties: Dict[str, Union[str, float, int]]

class ProcessEdge(BaseModel):
    source: str
    target: str
    label: Optional[str] = None

class ProcessGraph(BaseModel):
    name: str
    description: Optional[str] = None
    nodes: List[ProcessNode]
    edges: List[ProcessEdge]

class StepAnalysis(BaseModel):
    node_id: str
    issue: Optional[str]
    suggestion: Optional[str]
    score_impact: Optional[int]
    category: Optional[str]

class ProcessModel(BaseModel):
    graph: ProcessGraph
    analysis: Optional[List[StepAnalysis]] = None
    score_before: Optional[int] = None
    score_after: Optional[int] = None
