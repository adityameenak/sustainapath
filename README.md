# SustainaPath — AI Process Optimization Platform

A polished MVP for AI-powered chemical and engineering process optimization. Describe any process in plain English and get engineering-grade analysis, scores, suggestions, and an interactive PFD.

## Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React + Vite + Tailwind CSS       |
| AI Graphs | ReactFlow + Dagre auto-layout     |
| Backend   | Python FastAPI                    |
| AI Engine | Claude Opus 4.6 (Anthropic)       |

## Quick Start

### 1. Set your Anthropic API key

Edit `backend/.env`:

```
ANTHROPIC_API_KEY=sk-ant-...your key here...
```

Get a key at: https://console.anthropic.com

### 2. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## How it works

1. **Enter your process** — describe any chemical, manufacturing, or engineering workflow in plain English
2. **Select a goal** — sustainability, cost, efficiency, or balanced
3. **Clarification loop** — Claude asks follow-up questions if info is missing
4. **Full analysis** — scores, step breakdown, key metrics, specific suggestions, optimized process, and interactive PFD

## Sample inputs to try

- "NaCl crystallization from saturated brine by triple-effect evaporation"
- "Batch synthesis of aspirin via acetylation at 85°C followed by recrystallization"
- "Reverse osmosis desalination of seawater with 35,000 ppm TDS"
- "Wastewater treatment: neutralization with lime, sedimentation, and activated carbon polishing"
- "Distillation train for 95% ethanol from 12% fermentation broth"

## Project structure

```
sustainapath/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── api/routes/chat.py  # Chat endpoint
│   │   └── services/
│   │       └── claude_service.py  # Claude API integration
│   ├── .env                    # API keys (add yours here)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── Hero.jsx          # Landing / input page
    │   │   ├── ChatInterface.jsx # Clarification chat
    │   │   ├── ResultsDashboard.jsx  # Full results view
    │   │   ├── ScoreCard.jsx     # Animated score displays
    │   │   ├── PFDDiagram.jsx    # ReactFlow PFD
    │   │   └── Navbar.jsx
    │   └── utils/api.js
    ├── package.json
    └── vite.config.js
```

## Adding real AI logic

The Claude service is in `backend/app/services/claude_service.py`. The system prompt defines Claude's behavior, output schema, and scoring rubric. To customize:

- Edit `SYSTEM_PROMPT` to adjust scoring criteria, suggestion style, or PFD structure
- The output is structured JSON — add new fields to the prompt and consume them in the frontend
