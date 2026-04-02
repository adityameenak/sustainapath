from fastapi import APIRouter, Query, Body, Request, HTTPException
from pydantic import BaseModel
from app.models.schema import ProcessInput, OptimizationResult, ChatPrompt
from app.core.engine import optimize_process
from app.services.chem_api import get_combined_chemical_data
from app.core.scoring import calculate_sustainability_score
from app.services.ai_assistant import extract_metrics_from_description
from app.services.ai_assistant import client
from app.models.schema import ProcessModel, StepAnalysis
import json
from app.core.extract_metrics import extract_chem_metrics_from_graph, extract_process_metrics_from_graph
import os
from app.services.ai_assistant import generate_mermaid_diagram
import re
from typing import List, Optional, Dict, Any
import uuid

router = APIRouter(tags=["process"])

chat_sessions = {}
MAX_MEMORY = 15

@router.post("/optimize", response_model=OptimizationResult)
def optimize(input_data: ProcessInput):
    result = optimize_process(input_data)
    return result

@router.get("/lookup")
def lookup_chemical(name: str = Query(..., description="Chemical name to look up")):
    return get_combined_chemical_data(name)

@router.post("/score")
def score_process(
    chem_metrics: dict = Body(..., description="Chemical metrics between 0 and 1"),
    process_metrics: dict = Body(..., description="Process metrics between 0 and 1")
):
    score = min(100, calculate_sustainability_score(chem_metrics, process_metrics))
    return {"sustainability_score": score}

@router.post("/chat")
def chat_response(data: ChatPrompt, request: Request):
    session_id = request.client.host if request.client else "default"

    if session_id not in chat_sessions:
        chat_sessions[session_id] = []

    chat_sessions[session_id].append({"role": "user", "content": data.prompt})
    chat_sessions[session_id] = chat_sessions[session_id][-MAX_MEMORY:]

    system_msg = {
        "role": "system",
        "content": (
            "You are a helpful chemical process optimization assistant. "
            "Maintain context from earlier messages. Ask for missing info like molarity or base. "
            "Give suggestions with numeric details, specific chemicals, or better equipment."
        )
    }

    messages = [system_msg] + chat_sessions[session_id]

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0.4,
            max_tokens=700
        )
        reply = response.choices[0].message.content
        if not reply:
            return {
                "response": "⚠️ Empty response from OpenAI API",
                "modelable": False,
                "graph": None
            }
        reply = reply.strip()
        chat_sessions[session_id].append({"role": "assistant", "content": reply})

        is_modelable = not (
            reply.lower().startswith("please") or
            reply.lower().startswith("can you") or
            reply.endswith("?")
        )

        graph_prompt = (
            "Extract a process graph from the following description. "
            "Return a JSON object with this structure:\n\n"
            '{\n  "name": "Process Name",\n  "nodes": [\n    {\n      "id": "1",\n      "type": "input",\n      "label": "NaCl",\n      "properties": {"amount": "10g"}\n    }\n  ],\n'
            '  "edges": [ { "source": "1", "target": "2" } ]\n}'
            "\n\nProcess description:\n" + data.prompt +
            "\n\nOnly return the raw JSON object. No explanation."
        )

        graph_response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": graph_prompt}],
            temperature=0.2,
            max_tokens=700
        )

        graph_str = graph_response.choices[0].message.content
        if not graph_str:
            return {
                "response": reply,
                "modelable": is_modelable,
                "graph": None
            }
        graph_str = graph_str.strip()

        try:
            graph = json.loads(graph_str)
        except Exception as parse_err:
            print("⚠️ Failed to parse graph:", parse_err)
            print("Raw response was:", graph_str)
            graph = None

        return {
            "response": reply,
            "modelable": is_modelable,
            "graph": graph
        }

    except Exception as e:
        return {
            "response": f"⚠️ Could not evaluate your process. Error: {str(e)}",
            "modelable": False,
            "graph": None
        }

@router.post("/analyze_graph", response_model=ProcessModel)
def analyze_graph(model: ProcessModel):
    try:
        description = []
        for node in model.graph.nodes:
            props = ", ".join([f"{k}: {v}" for k, v in node.properties.items()])
            description.append(f"{node.label} ({node.type}) - {props}")

        prompt = (
            "You are a chemical engineering assistant. Analyze this chemical process:\n\n"
            + "\n".join(description) +
            "\n\nFor each step, identify inefficiencies related to sustainability, cost, or time.\n"
            "Provide a clear and specific suggestion with real alternatives.\n"
            "Your response must follow these strict rules:\n"
            "- Use specific chemical or equipment names\n"
            "- Be quantitative (e.g., reduce temperature from 70°C to 50°C)\n"
            "- Justify based on cost, energy, toxicity, or environmental impact\n"
            "- Suggestions must reflect realistic industry practices\n"
            "- NO vague language like 'consider', 'investigate', 'could be better', etc.\n\n"
            "Respond ONLY with a raw JSON array of objects using the fields:\n"
            "node_id, issue, suggestion, score_impact, and category.\n\n"
            "Example:\n"
            '[\n'
            '  {\n'
            '    "node_id": "2",\n'
            '    "issue": "Acetic anhydride is hazardous and costly.",\n'
            '    "suggestion": "Use ethyl acetate (less toxic and cheaper: $0.32/mL vs $0.47/mL) as an alternative for mild esterification.",\n'
            '    "score_impact": 14,\n'
            '    "category": "sustainability"\n'
            '  }\n'
            ']'
        )

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=700
        )

        ai_output = response.choices[0].message.content
        if not ai_output:
            raise Exception("Empty response from OpenAI API")
        ai_output = ai_output.strip()
        print("🧪 AI Output:")
        print(ai_output)

        try:
            analysis_list = json.loads(ai_output)
        except Exception as parse_err:
            raise Exception(f"JSON parsing failed: {parse_err}. Raw output: {ai_output}")

        analyses = [StepAnalysis(**a) for a in analysis_list]

        graph_dict = model.graph.dict()
        chem_metrics = extract_chem_metrics_from_graph(graph_dict)
        process_metrics = extract_process_metrics_from_graph(graph_dict)
        before_score = calculate_sustainability_score(chem_metrics, process_metrics)
        delta = sum(a.score_impact or 0 for a in analyses)
        after_score = min(100, before_score + delta)

        return ProcessModel(
            graph=model.graph,
            analysis=analyses,
            score_before=int(round(before_score, 2)),
            score_after=int(round(after_score, 2))
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise Exception(f"Graph analysis failed: {str(e)}")
    
def clean_mermaid_code(raw_code: str) -> str:
    # Only keep Mermaid portion starting from 'graph TD'
    if "graph TD" in raw_code:
        raw_code = raw_code.split("graph TD", 1)[-1]
        raw_code = "graph TD" + raw_code

    # Remove any markdown code blocks
    raw_code = re.split(r"```", raw_code)[0]

    # Remove extra whitespace and blank lines
    raw_code = "\n".join(line.strip() for line in raw_code.splitlines() if line.strip())

    # Shorten node labels to max 5 words to avoid Mermaid parse errors
    raw_code = re.sub(r'\[([^\]]+)\]', lambda m: f"[{' '.join(m.group(1).split()[:5])}]", raw_code)

    return raw_code.strip()
    
class ProcessNode:
    def __init__(self, id: str, label: str, type: str = "process", details: str = ""):
        self.id = id
        self.label = label
        self.type = type
        self.details = details

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "label": self.label,
            "type": self.type,
            "details": self.details
        }

class ProcessConnection:
    def __init__(self, from_id: str, to_id: str, label: str = ""):
        self.from_id = from_id
        self.to_id = to_id
        self.label = label

    def to_dict(self) -> Dict[str, Any]:
        return {
            "from": self.from_id,
            "to": self.to_id,
            "label": self.label
        }

class ProcessDiagram:
    nodes: List[ProcessNode]
    connections: List[ProcessConnection]

    def __init__(self):
        self.nodes = []
        self.connections = []

    def add_node(self, label: str, type: str = "process", details: str = "") -> ProcessNode:
        node_id = f"node_{len(self.nodes) + 1}"
        node = ProcessNode(node_id, label, type, details)
        self.nodes.append(node)
        return node

    def add_connection(self, from_node: ProcessNode, to_node: ProcessNode, label: str = "") -> None:
        connection = ProcessConnection(from_node.id, to_node.id, label)
        self.connections.append(connection)

    def to_mermaid(self) -> str:
        mermaid_code = ["graph TD"]
        
        # Add nodes with styles
        for node in self.nodes:
            style = self._get_node_style(node.type)
            mermaid_code.append(f'  {node.id}["{node.label}"]{style}')
        
        # Add connections
        for conn in self.connections:
            if conn.label:
                mermaid_code.append(f'  {conn.from_id} -->|"{conn.label}"| {conn.to_id}')
            else:
                mermaid_code.append(f'  {conn.from_id} --> {conn.to_id}')
        
        return "\n".join(mermaid_code)

    def _get_node_style(self, node_type: str) -> str:
        return ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nodes": [node.to_dict() for node in self.nodes],
            "connections": [conn.to_dict() for conn in self.connections]
        }

class PFDRequest(BaseModel):
    prompt: str
    include_details: Optional[bool] = False

class PFDResponse(BaseModel):
    mermaid_diagram: str
    nodes: List[Dict[str, Any]]
    connections: List[Dict[str, Any]]

    class Config:
        arbitrary_types_allowed = True

def parse_gpt_response(response_text: str) -> ProcessDiagram:
    diagram = ProcessDiagram()
    
    # Extract nodes and connections from GPT response
    lines = response_text.strip().split("\n")
    node_map = {}  # Map node IDs to ProcessNode objects
    
    for line in lines:
        line = line.strip()
        if not line or line == "graph TD":
            continue
            
        # Parse node definitions
        node_match = re.match(r'\s*(\w+)\["([^"]+)"\]', line)
        if node_match:
            node_id, label = node_match.groups()
            node = diagram.add_node(label)
            node_map[node_id] = node
            continue
            
        # Parse connections
        conn_match = re.match(r'\s*(\w+)\s*-->\s*(\w+)', line)
        if conn_match:
            from_id, to_id = conn_match.groups()
            if from_id in node_map and to_id in node_map:
                diagram.add_connection(node_map[from_id], node_map[to_id])
                
    return diagram

@router.post("/pfd")
async def generate_pfd(request: PFDRequest):
    try:
        mermaid_code = generate_mermaid_diagram(request.prompt)
        
        if mermaid_code.startswith("⚠️"):
            raise Exception(mermaid_code)
            
        diagram = parse_gpt_response(mermaid_code)
        
        return PFDResponse(
            mermaid_diagram=mermaid_code,
            nodes=diagram.to_dict()["nodes"],
            connections=diagram.to_dict()["connections"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
