import { useState } from 'react'
import { ArrowRight, Leaf, DollarSign, Clock, Sliders, Beaker, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'

const GOALS = [
  { id: 'sustainability', label: 'Sustainability', icon: Leaf, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', desc: 'Minimize waste & environmental impact' },
  { id: 'cost', label: 'Cost', icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', desc: 'Reduce reagent & operating costs' },
  { id: 'time', label: 'Efficiency', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', desc: 'Maximize throughput & speed' },
  { id: 'balanced', label: 'Balanced', icon: Sliders, color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/30', desc: 'Optimize all three equally' },
]

const EXAMPLES = [
  'NaCl crystallization from a saturated brine solution by evaporation',
  'Batch distillation to purify ethanol from a 50% aqueous mixture',
  'Wastewater neutralization using lime addition followed by sedimentation',
  'Reverse osmosis desalination for brackish water treatment',
  'Ethyl acetate synthesis via Fischer esterification of ethanol and acetic acid',
]

export default function Hero({ onStart }) {
  const [text, setText] = useState('')
  const [goal, setGoal] = useState('balanced')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) {
      setError('Please describe your process first.')
      return
    }
    if (text.trim().length < 20) {
      setError('Please provide a more detailed process description (at least a sentence).')
      return
    }
    setError('')
    onStart(text.trim(), goal)
  }

  function useExample(ex) {
    setText(ex)
    setError('')
  }

  return (
    <main className="pt-16 min-h-screen flex flex-col">
      {/* Hero headline */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20
                          rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-brand-300 text-sm font-medium">Powered by Claude AI</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-5 tracking-tight">
            Optimize any{' '}
            <span className="gradient-text">chemical process</span>
            {' '}instantly
          </h1>

          <p className="text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
            Describe your process in plain English. SustainaPath analyzes it, scores it,
            generates a PFD, and delivers engineering-grade optimization recommendations.
          </p>
        </motion.div>

        {/* Main input card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="card-glow p-6 space-y-5">
            {/* Process input */}
            <div>
              <label className="section-label mb-2 block">
                Process Description
              </label>
              <textarea
                value={text}
                onChange={e => { setText(e.target.value); setError('') }}
                placeholder="Describe your process in plain English. E.g. 'Batch production of aspirin via acetylation of salicylic acid with acetic anhydride at 85°C for 15 minutes, followed by recrystallization from ethanol…'"
                rows={5}
                className="input-field text-sm leading-relaxed"
              />
              {error && (
                <p className="text-red-400 text-xs mt-1.5">{error}</p>
              )}
            </div>

            {/* Goal selector */}
            <div>
              <label className="section-label mb-3 block">
                Optimization Goal
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {GOALS.map(g => {
                  const Icon = g.icon
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center
                                  transition-all duration-200 cursor-pointer
                                  ${goal === g.id
                                    ? `${g.bg} ${g.color}`
                                    : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:bg-white/[0.06] hover:text-white/60'
                                  }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-semibold">{g.label}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-white/30 mt-2 text-center">
                {GOALS.find(g => g.id === goal)?.desc}
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Beaker className="w-4 h-4" />
              Analyze Process
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Examples */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-white/30 font-medium">Try an example</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => useExample(ex)}
                  className="text-xs text-white/40 hover:text-brand-300 hover:bg-brand-500/10
                             border border-white/[0.06] hover:border-brand-500/30
                             px-3 py-1.5 rounded-full transition-all duration-150 cursor-pointer"
                >
                  {ex.length > 48 ? ex.slice(0, 48) + '…' : ex}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Feature strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full"
        >
          {[
            { label: 'Process Scoring', desc: 'Sustainability, cost & efficiency scores' },
            { label: 'Clarifying AI', desc: 'Asks follow-ups before analyzing' },
            { label: 'PFD Generation', desc: 'Visual process flow diagrams' },
            { label: 'Expert Suggestions', desc: 'Specific, actionable recommendations' },
          ].map(f => (
            <div key={f.label} className="text-center">
              <p className="text-white/70 text-sm font-semibold mb-0.5">{f.label}</p>
              <p className="text-white/30 text-xs">{f.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-10 text-white/20"
        >
          <ChevronDown className="w-4 h-4 animate-bounce mx-auto" />
        </motion.div>
      </div>
    </main>
  )
}
