import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, ListOrdered, BarChart2, Lightbulb, GitBranch,
  Repeat2, ChevronDown, ChevronUp, ArrowUpRight, Beaker,
  Zap, Package, Droplets, AlertTriangle, Plus
} from 'lucide-react'
import ScoreCard from './ScoreCard'
import PFDDiagram from './PFDDiagram'

const PRIORITY_STYLES = {
  high: 'badge-red',
  medium: 'badge-amber',
  low: 'badge-cyan',
}

const CATEGORY_STYLES = {
  sustainability: { label: 'Sustainability', cls: 'badge-green' },
  cost: { label: 'Cost', cls: 'badge-amber' },
  time: { label: 'Efficiency', cls: 'badge-cyan' },
  safety: { label: 'Safety', cls: 'badge-purple' },
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20
                      flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-brand-400" />
      </div>
      <div>
        <h2 className="text-base font-bold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
      </div>
    </div>
  )
}

function StepCard({ step, index }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors text-left"
      >
        <span className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30
                         flex items-center justify-center text-xs font-bold text-brand-400 shrink-0">
          {step.id || index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{step.name}</p>
          <p className="text-xs text-white/40 truncate mt-0.5">{step.description}</p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-white/30 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />
        )}
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-4 pt-0 border-t border-white/[0.05] space-y-3"
        >
          {step.equipment?.length > 0 && (
            <div>
              <p className="section-label mb-1.5">Equipment</p>
              <div className="flex flex-wrap gap-1.5">
                {step.equipment.map((e, i) => (
                  <span key={i} className="text-xs bg-white/[0.05] text-white/60
                                           border border-white/[0.08] px-2 py-0.5 rounded-full">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
          {step.chemicals?.length > 0 && (
            <div>
              <p className="section-label mb-1.5">Chemicals / Materials</p>
              <div className="flex flex-wrap gap-1.5">
                {step.chemicals.map((c, i) => (
                  <span key={i} className="text-xs bg-brand-500/10 text-brand-300
                                           border border-brand-500/20 px-2 py-0.5 rounded-full">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {step.conditions && Object.keys(step.conditions).some(k => step.conditions[k]) && (
            <div>
              <p className="section-label mb-1.5">Conditions</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(step.conditions).map(([k, v]) => v ? (
                  <div key={k} className="bg-white/[0.03] rounded-lg p-2 text-center">
                    <p className="text-xs text-white/30 capitalize">{k}</p>
                    <p className="text-xs font-semibold text-white/80 mt-0.5">{v}</p>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

function SuggestionCard({ suggestion, index }) {
  const catStyle = CATEGORY_STYLES[suggestion.category] || CATEGORY_STYLES.sustainability
  const priorityStyle = PRIORITY_STYLES[suggestion.priority] || PRIORITY_STYLES.medium

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="card p-5 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={catStyle.cls}>{catStyle.label}</span>
          <span className={priorityStyle}>{suggestion.priority} priority</span>
        </div>
        <ArrowUpRight className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
      </div>

      <div>
        <h3 className="text-sm font-bold text-white mb-1">{suggestion.title}</h3>
        <p className="text-sm text-white/60 leading-relaxed">{suggestion.description}</p>
      </div>

      {suggestion.impact && (
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-3">
          <p className="text-xs text-white/40 mb-0.5 font-medium">Expected Impact</p>
          <p className="text-xs text-white/70 leading-relaxed">{suggestion.impact}</p>
        </div>
      )}

      {suggestion.metrics && (
        <div className="grid grid-cols-2 gap-2">
          {suggestion.metrics.before && (
            <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2">
              <p className="text-[10px] text-red-400/60 font-semibold uppercase tracking-wide mb-0.5">Before</p>
              <p className="text-xs text-red-300/80">{suggestion.metrics.before}</p>
            </div>
          )}
          {suggestion.metrics.after && (
            <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-2">
              <p className="text-[10px] text-green-400/60 font-semibold uppercase tracking-wide mb-0.5">After</p>
              <p className="text-xs text-green-300/80">{suggestion.metrics.after}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

function MetricsPanel({ metrics }) {
  const panels = [
    { key: 'chemicals', icon: Beaker, label: 'Chemicals & Materials', color: 'text-brand-400' },
    { key: 'equipment', icon: Package, label: 'Equipment', color: 'text-purple-400' },
    { key: 'utilities', icon: Zap, label: 'Utilities', color: 'text-amber-400' },
    { key: 'wasteStreams', icon: Droplets, label: 'Waste Streams', color: 'text-red-400' },
    { key: 'bottlenecks', icon: AlertTriangle, label: 'Bottlenecks', color: 'text-orange-400' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {panels.map(({ key, icon: Icon, label, color }) => {
        const items = metrics[key] || []
        if (!items.length) return null
        return (
          <div key={key} className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span className="section-label">{label}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.map((item, i) => (
                <span key={i} className="text-xs bg-white/[0.05] text-white/60
                                         border border-white/[0.08] px-2 py-0.5 rounded-full">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const NAV_SECTIONS = [
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'scores', label: 'Scores', icon: BarChart2 },
  { id: 'steps', label: 'Process Steps', icon: ListOrdered },
  { id: 'metrics', label: 'Key Metrics', icon: Package },
  { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
  { id: 'pfd', label: 'PFD', icon: GitBranch },
  { id: 'optimized', label: 'Optimized', icon: Repeat2 },
]

export default function ResultsDashboard({ data, goal, onNewAnalysis }) {
  const [activeSection, setActiveSection] = useState('summary')

  function scrollTo(id) {
    setActiveSection(id)
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  }

  return (
    <main className="pt-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Page header */}
        <motion.div {...fadeUp} className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-cyan">Analysis Complete</span>
              <span className="badge bg-white/[0.06] text-white/40 border border-white/[0.08] capitalize">
                {goal} optimization
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              {data.processName || 'Process Analysis'}
            </h1>
          </div>
          <button
            onClick={onNewAnalysis}
            className="btn-secondary flex items-center gap-2 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            New Analysis
          </button>
        </motion.div>

        {/* Sticky nav */}
        <div className="sticky top-16 z-40 -mx-4 px-4 mb-6">
          <div className="bg-surface-950/90 backdrop-blur-xl border-b border-white/[0.04] py-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                               whitespace-nowrap transition-all duration-150 cursor-pointer
                               ${activeSection === id
                                 ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                                 : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                               }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="space-y-12">
          {/* Summary */}
          <motion.section id="section-summary" {...fadeUp}>
            <SectionHeader icon={FileText} title="Process Summary" subtitle="What this process does" />
            <div className="card p-6">
              <p className="text-white/70 leading-relaxed text-sm">{data.summary}</p>
            </div>
          </motion.section>

          {/* Scores */}
          <motion.section
            id="section-scores"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <SectionHeader icon={BarChart2} title="Performance Scores" subtitle="Evaluated across three dimensions" />
            <ScoreCard scores={data.scores} />
          </motion.section>

          {/* Process Steps */}
          <motion.section
            id="section-steps"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <SectionHeader
              icon={ListOrdered}
              title="Structured Process Breakdown"
              subtitle={`${data.steps?.length || 0} steps identified`}
            />
            <div className="space-y-2">
              {(data.steps || []).map((step, i) => (
                <StepCard key={i} step={step} index={i} />
              ))}
            </div>
          </motion.section>

          {/* Key Metrics */}
          {data.keyMetrics && (
            <motion.section
              id="section-metrics"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <SectionHeader icon={Package} title="Key Metrics" subtitle="Identified components and streams" />
              <MetricsPanel metrics={data.keyMetrics} />
            </motion.section>
          )}

          {/* Suggestions */}
          <motion.section
            id="section-suggestions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <SectionHeader
              icon={Lightbulb}
              title="Optimization Suggestions"
              subtitle={`${data.suggestions?.length || 0} recommendations`}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(data.suggestions || []).map((s, i) => (
                <SuggestionCard key={i} suggestion={s} index={i} />
              ))}
            </div>
          </motion.section>

          {/* PFD */}
          <motion.section
            id="section-pfd"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <SectionHeader
              icon={GitBranch}
              title="Process Flow Diagram"
              subtitle="Interactive — drag to rearrange, scroll to zoom"
            />
            <PFDDiagram pfd={data.pfd} />

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-3">
              {[
                { cat: 'input', label: 'Input' },
                { cat: 'reactor', label: 'Reactor' },
                { cat: 'separator', label: 'Separator' },
                { cat: 'heat', label: 'Heat Transfer' },
                { cat: 'output', label: 'Product' },
                { cat: 'waste', label: 'Waste' },
              ].map(({ cat, label }) => {
                const colors = {
                  input: 'bg-green-500/20 text-green-400',
                  reactor: 'bg-indigo-500/20 text-indigo-400',
                  separator: 'bg-purple-500/20 text-purple-400',
                  heat: 'bg-red-500/20 text-red-400',
                  output: 'bg-green-500/20 text-green-300',
                  waste: 'bg-orange-500/20 text-orange-400',
                }
                return (
                  <span key={cat} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colors[cat]}`}>
                    {label}
                  </span>
                )
              })}
            </div>
          </motion.section>

          {/* Optimized Process */}
          <motion.section
            id="section-optimized"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <SectionHeader
              icon={Repeat2}
              title="Optimized Process"
              subtitle="Revised workflow incorporating key improvements"
            />
            <div className="card p-6 border-brand-500/20">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30
                                flex items-center justify-center shrink-0">
                  <Repeat2 className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-brand-300 uppercase tracking-wider">
                    Improved Workflow
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">
                    Based on the optimization recommendations above
                  </p>
                </div>
              </div>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
                {data.optimizedProcess}
              </p>
            </div>
          </motion.section>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center pb-8">
          <button
            onClick={onNewAnalysis}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Analyze Another Process
          </button>
          <p className="text-xs text-white/20 mt-3">
            Powered by Claude AI · SustainaPath
          </p>
        </div>
      </div>
    </main>
  )
}
