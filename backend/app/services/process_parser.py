import os
import openai
import json
import re
from typing import List, Union
from app.models.schema import ProcessStep

openai.api_key = os.getenv("OPENAI_API_KEY")


def parse_process_description(description: str) -> Union[List[ProcessStep], dict]:
    try:
        # Step 1: Simple rule-based checks
        if not any(chem in description.lower() for chem in ["hcl", "nacl", "naoh", "acid", "base", "titrate", "titration"]):
            return {
                "clarification_required": True,
                "message": "Please include at least one chemical and describe the action you're performing."
            }

        # Step 2: Smarter GPT prompt (structured output, but tolerant)
        system_prompt = """
You are an intelligent chemical engineering assistant.

Your task is to analyze a process described in natural language and extract the most relevant information.

Return a structured JSON list of steps. Each step should include:
- name
- chemical
- temperature (Celsius or null)
- pressure (atm or null)
- duration (in hours or null)
- cost_usd (or null)
- energy_kwh (or null)
- waste_kg (or null)
- solvent_used (string or null)

If any field is not mentioned or unclear, use null. Be realistic — do not hallucinate. Only extract what is present or implied.

If the process cannot be parsed at all, respond like this:
{
  "clarification_required": true,
  "message": "I need more detail to evaluate this process. Please provide chemical names and actions."
}
"""

        user_prompt = f'Description: "{description}"'

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=800
        )

        raw = response.choices[0].message.content.strip()
        print("GPT response:\n", raw)  # Debug: log output

        # Try to extract JSON from GPT output using regex if needed
        match = re.search(r"\{.*\}|\[.*\]", raw, re.DOTALL)
        if not match:
            raise ValueError("No JSON found in model output")

        parsed = json.loads(match.group(0))

        # Return clarification message if present
        if isinstance(parsed, dict) and parsed.get("clarification_required"):
            return parsed

        # Convert to list of ProcessStep models
        return [ProcessStep(**step) for step in parsed]

    except Exception as e:
        print("AI parse error:", e)
        return {
            "clarification_required": True,
            "message": "Sorry, I couldn't understand the process. Could you describe it more clearly?"
        }
