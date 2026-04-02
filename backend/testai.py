from app.services.ai_assistant import suggest_improvements

prompt = "A step uses benzene, which is toxic. Suggest a better, greener, cheaper chemical."
print(suggest_improvements(prompt))