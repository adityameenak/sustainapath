from app.models.schema import ProcessInput, OptimizationResult, Suggestion
from app.services.ai_assistant import extract_metrics_from_description, build_prompt, suggest_from_prompt
from app.core.scoring import calculate_sustainability_score


def extract_metrics(steps):
    chem_metrics = {
        "toxicity": 0.5,
        "biodegradability": 0.6,
        "carcinogenicity": 0.3,
        "flammability": 0.4,
        "gwp": 0.5
    }

    total_steps = len(steps)
    total_energy = sum(step.energy_kwh for step in steps)
    total_waste = sum(step.waste_kg for step in steps)
    total_duration = sum(step.duration for step in steps)

    avg_energy = total_energy / total_steps if total_steps else 0
    avg_waste = total_waste / total_steps if total_steps else 0
    avg_duration = total_duration / total_steps if total_steps else 0

    process_metrics = {
        "step_efficiency": 0.7,
        "energy_consumption": min(1, avg_energy / 10),
        "solvent_hazard": 0.5,
        "waste_output": min(1, avg_waste / 5),
        "process_time": min(1, avg_duration / 60)
    }

    return chem_metrics, process_metrics


def optimize_process(data: ProcessInput) -> OptimizationResult:
    goal = data.optimization_goal or "sustainability"

    total_cost = sum(step.cost_usd for step in data.steps)
    total_energy = sum(step.energy_kwh for step in data.steps)
    total_waste = sum(step.waste_kg for step in data.steps)

    try:
        if goal == "sustainability":
            step_texts = [step.name + ": " + step.chemical for step in data.steps]
            prompt = "\n".join(f"{i+1}. {t}" for i, t in enumerate(step_texts))
            result = extract_metrics_from_description(prompt)
            chem_metrics = result["chem_metrics"]
            process_metrics = result["process_metrics"]
            score = calculate_sustainability_score(chem_metrics, process_metrics)
            suggestions = suggest_from_prompt(prompt, goal)
        elif goal == "cost":
            prompt = f"I want to reduce the cost of this process:\n" + "\n".join(
                f"{step.name} using {step.chemical}, costing ${step.cost_usd}" for step in data.steps
            )
            suggestions = suggest_from_prompt(prompt, goal)
            score = 100 - min(100, int(total_cost / 10))
        elif goal == "time":
            prompt = f"I want to make this process faster:\n" + "\n".join(
                f"{step.name} takes {step.duration} minutes" for step in data.steps
            )
            suggestions = suggest_from_prompt(prompt, goal)
            avg_duration = sum(step.duration for step in data.steps) / len(data.steps)
            score = 100 - min(100, int(avg_duration))
        else:
            raise ValueError("Unsupported optimization goal.")

        return OptimizationResult(
            score=score,
            goal=goal,
            total_cost=total_cost,
            total_energy=total_energy,
            total_waste=total_waste,
            suggestions=[Suggestion(message=s) for s in suggestions]
        )

    except Exception as e:
        return OptimizationResult(
            score=0,
            goal=goal,
            total_cost=total_cost,
            total_energy=total_energy,
            total_waste=total_waste,
            suggestions=[Suggestion(message=f"❌ Error during optimization: {str(e)}")]
        )
