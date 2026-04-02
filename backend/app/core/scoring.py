def calculate_sustainability_score(chem_metrics: dict, process_metrics: dict) -> float:
    # Chemical impact scoring
    toxicity_score = (1 - chem_metrics.get("toxicity", 0)) * 15
    biodegradability_score = chem_metrics.get("biodegradability", 0) * 10
    carcinogenicity_score = (1 - chem_metrics.get("carcinogenicity", 0)) * 10
    flammability_score = (1 - chem_metrics.get("flammability", 0)) * 5
    gwp_score = (1 - chem_metrics.get("gwp", 0)) * 10

    chem_score = (
        toxicity_score +
        biodegradability_score +
        carcinogenicity_score +
        flammability_score +
        gwp_score
    )

    # Process impact scoring
    step_efficiency = process_metrics.get("step_efficiency", 0) * 15
    energy_score = (1 - process_metrics.get("energy_consumption", 0)) * 15
    solvent_score = (1 - process_metrics.get("solvent_hazard", 0)) * 10
    waste_score = (1 - process_metrics.get("waste_output", 0)) * 10
    time_score = (1 - process_metrics.get("process_time", 0)) * 10  # New addition

    process_score = (
        step_efficiency +
        energy_score +
        solvent_score +
        waste_score +
        time_score
    )

    sustainability_score = chem_score + process_score
    return round(sustainability_score, 2)
