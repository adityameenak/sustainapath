# app/core/extract_metrics.py

def extract_chem_metrics_from_graph(graph):
    """
    Estimate chemical sustainability metrics based on node labels and properties.
    """

    total_toxicity = 0
    solvent_count = 0

    for node in graph.get("nodes", []):
        label = node.get("label", "").lower()
        props = node.get("properties", {})

        # Estimate toxicity
        if "benzene" in label or "hexane" in label:
            toxicity = 0.9
        elif "ethanol" in label:
            toxicity = 0.2
        elif "water" in label:
            toxicity = 0.1
        elif "solvent" in label:
            toxicity = 0.5
        else:
            toxicity = 0.4

        total_toxicity += toxicity

        # Count solvents
        if "solvent" in label or "solvent_used" in props:
            solvent_count += 1

    node_count = len(graph.get("nodes", [])) or 1
    avg_toxicity = total_toxicity / node_count
    biodegradability = max(0.0, 1.0 - avg_toxicity)
    renewability = 1.0 - (0.1 * solvent_count)

    return {
        "toxicity": round(avg_toxicity, 2),
        "biodegradability": round(biodegradability, 2),
        "renewability": round(max(0, min(renewability, 1.0)), 2)
    }


def extract_process_metrics_from_graph(graph):
    """
    Estimate process sustainability metrics based on number of steps, heat usage, and waste keywords.
    """

    nodes = graph.get("nodes", [])
    num_steps = len(nodes)

    has_energy = any("heat" in node.get("label", "").lower() or "temperature" in (node.get("properties") or {})
                     for node in nodes)
    has_waste = any("waste" in node.get("label", "").lower() for node in nodes)

    energy_use = 0.7 if has_energy else 0.3
    waste_generation = 0.6 if has_waste else 0.3
    step_complexity = min(1.0, num_steps / 10)

    return {
        "energy_use": round(energy_use, 2),
        "waste_generation": round(waste_generation, 2),
        "step_complexity": round(step_complexity, 2)
    }
