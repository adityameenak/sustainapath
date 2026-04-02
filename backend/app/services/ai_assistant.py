import os
import re
from typing import List
from openai import OpenAI
from dotenv import load_dotenv
from app.core.scoring import calculate_sustainability_score

load_dotenv()

# Initialize OpenAI client with minimal configuration
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url="https://api.openai.com/v1",  # Explicitly set the base URL
    timeout=60.0  # Set a reasonable timeout
)

def extract_metrics_from_description(prompt: str, goal: str = "sustainability") -> dict:
    system_msg = """
You are a chemical engineering expert.

You will be given a chemical process description and an optimization goal (sustainability, cost, or time).

Your task:
- Extract estimated sustainability metrics as JSON (if possible)
- Output 3–6 short, specific, factual suggestions (no bullets or numbers)
- Avoid vague advice — each recommendation should name chemicals, values, or actions
- Your suggestions must include cost, quantity, temperature, or sustainability tradeoffs where applicable
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=700
        )

        content = response.choices[0].message.content
        if not content:
            raise RuntimeError("Empty response from OpenAI API")
        content = content.strip()

        chem_metrics = {}
        process_metrics = {}

        if goal == "sustainability":
            match = re.search(r'\{[\s\S]*?\}', content)
            if match:
                import json5
                json_str = match.group(0)
                data = json5.loads(json_str)
                if isinstance(data, dict):
                    chem_metrics = data.get("chem_metrics", {})
                    process_metrics = data.get("process_metrics", {})

        recs = re.split(r'(Recommendations:|Suggestions:)', content, flags=re.IGNORECASE)
        recs = recs[-1].strip() if len(recs) > 1 else content.strip()

        return {
            "chem_metrics": chem_metrics,
            "process_metrics": process_metrics,
            "recommendations": recs
        }

    except Exception as e:
        raise RuntimeError(f"❌ Failed to extract metrics. Error: {str(e)}")

def evaluate_process_with_score(prompt: str) -> str:
    try:
        result = extract_metrics_from_description(prompt)
        chem = result["chem_metrics"]
        proc = result["process_metrics"]
        score = min(100, calculate_sustainability_score(chem, proc))

        formatted_recs = "".join(
            f"<li>{line.strip()}</li>"
            for line in result['recommendations'].split("\n") if line.strip()
        )

        return f"""
        <p><strong>♻️ Sustainability Score:</strong> {score}/100</p>
        <p><strong>💡 Suggestions:</strong></p>
        <ul>{formatted_recs}</ul>
        """.strip()

    except Exception as e:
        return f"<p>⚠️ Could not evaluate your process. Error: {str(e)}</p>"

def suggest_from_prompt(prompt: str, goal: str = "sustainability") -> str:
    system_message = (
        "You are a highly precise chemical process consultant. "
        "You must ONLY make specific, actionable, fact-based suggestions. "
        "Each suggestion must include:\n"
        "- Specific chemical or equipment names\n"
        "- Numerical values (e.g. molarity, volume, price)\n"
        "- Cost, time, or sustainability benefits\n\n"
        "If the input is vague (e.g., missing molarity, titrant, volume, or equipment), do not guess. "
        "Politely ask the user to provide the missing information."
    )

    user_prompt = f"""
User submitted this process description:

{prompt}

Your task:
1. First, evaluate whether the user gave enough info to make specific recommendations.
2. If not, ask for clarification: e.g., "What is the molarity of the HCl?" or "What base are you titrating?"
3. If sufficient info is given, return a numbered list of specific, fact-based suggestions.
4. Avoid general advice. Be specific. Show numerical comparisons if possible.

Example suggestion:
**1.** Replace acetic anhydride with ethyl acetate – 30% less toxic, $0.15/mL cheaper  
**2.** Lower reaction temperature from 70°C to 55°C – reduces energy use by ~25%  
**3.** Replace sulfuric acid with p-toluenesulfonic acid – less corrosive, easier to handle
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.4,
            max_tokens=800
        )

        content = response.choices[0].message.content
        if not content:
            return "<p>⚠️ Empty response from OpenAI API</p>"
        content = content.strip()

        if not content.startswith("**1.**"):
            cleaned = re.sub(r"^\*\*\d+\.\*\*\s*", "", content).strip()
            return f"<p><strong>🧠 Assistant:</strong> {cleaned}</p>"

        lines = [line.strip(" *") for line in content.splitlines() if line.strip()]
        numbered_items = [f"<li>{line.split('**')[-1].strip()}</li>" for line in lines if line.startswith("**")]
        formatted_list = "<ol>" + "".join(numbered_items) + "</ol>"

        return f"<p><strong>Here are specific ways to optimize your process:</strong></p>{formatted_list}"

    except Exception as e:
        return f"<p>⚠️ Could not generate suggestions. Error: {str(e)}</p>"

def build_prompt(steps: List[str], goal: str = "sustainability") -> str:
    goal_instructions = {
        "sustainability": "Focus on chemical safety, toxicity, energy use, waste, and environmental impact.",
        "cost": "Focus on reducing reagent cost, equipment cost, and waste handling fees. Include $ comparisons.",
        "time": "Focus on reducing process time, improving throughput, and simplifying steps or setup."
    }

    return f"""
You are an expert process engineer.

Here are the process steps:
{chr(10).join(f"{i+1}. {step}" for i, step in enumerate(steps))}

Your task is to optimize the process for **{goal.upper()}**.

{goal_instructions.get(goal, '')}

Only return numbered suggestions that include:
- Chemical/equipment names
- Quantitative benefits
- No vague advice
""".strip()

def suggest_improvements(steps: List[str], goal: str = "sustainability") -> str:
    prompt = build_prompt(steps, goal)

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a detail-focused process optimization expert."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=700
        )

        content = response.choices[0].message.content
        if not content:
            return "<p>⚠️ Empty response from OpenAI API</p>"
        content = content.strip()

        lines = [line.strip(" *") for line in content.splitlines() if line.strip()]
        items = [f"<li>{line.split('**')[-1].strip()}</li>" for line in lines if line.startswith("**")]
        return "<ol>" + "".join(items) + "</ol>"

    except Exception as e:
        return f"<p>⚠️ Could not generate suggestions. Error: {str(e)}</p>"
    
def generate_mermaid_diagram(prompt: str) -> str:
    system_message = """
You are an expert chemical process flow designer.

You will receive a chemical process description. Your task:
- Extract main inputs, key process steps, outputs, and wastes.
- Convert it into Mermaid.js flowchart format.
- Use this structure:
graph TD
  A[Input 1] --> B[Step 1]
  B --> C[Step 2]
  C --> D[Output 1]
  C --> E[Waste 1]

- Be minimal, only include 3-7 key nodes.
- Use clear short labels (under 5 words per label).
- DO NOT explain anything else. ONLY return valid Mermaid code.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4",  # Fixed model name
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=400
        )
        content = response.choices[0].message.content
        if not content:
            return "⚠️ Empty response from OpenAI API"
        return content.strip()

    except Exception as e:
        return f"⚠️ Failed to generate Mermaid diagram: {str(e)}"
