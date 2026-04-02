import { useState } from 'react'
import Hero from './components/Hero'
import ChatInterface from './components/ChatInterface'
import ResultsDashboard from './components/ResultsDashboard'
import Navbar from './components/Navbar'

// App states: "hero" | "chat" | "results"
export default function App() {
  const [appState, setAppState] = useState('hero')
  const [goal, setGoal] = useState('balanced')
  const [messages, setMessages] = useState([])
  const [analysisResult, setAnalysisResult] = useState(null)

  function handleStart(initialMessage, selectedGoal) {
    setGoal(selectedGoal)
    setMessages([{ role: 'user', content: initialMessage }])
    setAppState('chat')
  }

  function handleAnalysisComplete(result) {
    setAnalysisResult(result)
    setAppState('results')
  }

  function handleReset() {
    setAppState('hero')
    setMessages([])
    setAnalysisResult(null)
    setGoal('balanced')
  }

  function handleNewAnalysis() {
    setAppState('hero')
    setMessages([])
    setAnalysisResult(null)
    setGoal('balanced')
  }

  return (
    <div className="min-h-screen bg-surface-950 mesh-bg">
      <Navbar
        showReset={appState !== 'hero'}
        onReset={handleReset}
        appState={appState}
      />

      {appState === 'hero' && (
        <Hero onStart={handleStart} />
      )}

      {appState === 'chat' && (
        <ChatInterface
          messages={messages}
          setMessages={setMessages}
          goal={goal}
          onAnalysisComplete={handleAnalysisComplete}
          onBack={handleReset}
        />
      )}

      {appState === 'results' && analysisResult && (
        <ResultsDashboard
          data={analysisResult}
          goal={goal}
          onNewAnalysis={handleNewAnalysis}
        />
      )}
    </div>
  )
}
