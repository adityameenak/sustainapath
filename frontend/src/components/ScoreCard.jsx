import { useEffect, useRef, useState } from 'react'
import { Leaf, DollarSign, Clock, BarChart3 } from 'lucide-react'

const SCORE_CONFIG = {
  sustainability: { icon: Leaf, label: 'Sustainability', color: '#22c55e', track: '#22c55e20' },
  costEfficiency: { icon: DollarSign, label: 'Cost Efficiency', color: '#f59e0b', track: '#f59e0b20' },
  timeEfficiency: { icon: Clock, label: 'Time Efficiency', color: '#3b82f6', track: '#3b82f620' },
  overall: { icon: BarChart3, label: 'Overall Score', color: '#06b6d4', track: '#06b6d420', isOverall: true },
}

function getGrade(score) {
  if (score >= 80) return { label: 'Excellent', color: 'text-green-400' }
  if (score >= 65) return { label: 'Good', color: 'text-brand-400' }
  if (score >= 50) return { label: 'Average', color: 'text-amber-400' }
  return { label: 'Needs Work', color: 'text-red-400' }
}

function RadialScore({ score, color, size = 100 }) {
  const [animated, setAnimated] = useState(0)
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animated / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="8"
      />
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      />
    </svg>
  )
}

function useCountUp(target, duration = 1400) {
  const [count, setCount] = useState(0)
  const raf = useRef()

  useEffect(() => {
    const start = performance.now()
    function step(now) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return count
}

function ScorePill({ type, score, reasoning }) {
  const config = SCORE_CONFIG[type]
  const Icon = config.icon
  const grade = getGrade(score)
  const count = useCountUp(score)

  if (config.isOverall) return null

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: `${config.color}18`, border: `1px solid ${config.color}30` }}>
            <Icon className="w-4 h-4" style={{ color: config.color }} />
          </div>
          <span className="text-sm font-semibold text-white/80">{config.label}</span>
        </div>
        <span className={`text-xs font-semibold ${grade.color}`}>{grade.label}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <RadialScore score={score} color={config.color} size={72} />
          <span className="absolute inset-0 flex items-center justify-center
                           text-lg font-black text-white rotate-90 select-none">
            {count}
          </span>
        </div>
        <div className="flex-1">
          <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden mb-1">
            <div
              className="h-full rounded-full transition-all duration-[1.4s] ease-out"
              style={{
                width: `${score}%`,
                background: `linear-gradient(90deg, ${config.color}80, ${config.color})`
              }}
            />
          </div>
          <p className="text-xs text-white/40 leading-relaxed mt-2">{reasoning}</p>
        </div>
      </div>
    </div>
  )
}

export default function ScoreCard({ scores }) {
  const overallCount = useCountUp(scores.overall)
  const grade = getGrade(scores.overall)
  const overallConfig = SCORE_CONFIG.overall

  return (
    <div className="space-y-4">
      {/* Overall score hero */}
      <div className="card p-6 flex items-center gap-6">
        <div className="relative shrink-0">
          <RadialScore score={scores.overall} color={overallConfig.color} size={100} />
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-90 select-none">
            <span className="text-3xl font-black text-white leading-none">{overallCount}</span>
            <span className="text-xs text-white/40 leading-none">/100</span>
          </div>
        </div>
        <div>
          <p className="section-label mb-1">Overall Score</p>
          <p className={`text-2xl font-bold ${grade.color} mb-1`}>{grade.label}</p>
          <p className="text-sm text-white/40 leading-relaxed max-w-xs">
            {grade.label === 'Excellent'
              ? 'This process performs well across all dimensions.'
              : grade.label === 'Good'
              ? 'Solid performance with room for targeted improvements.'
              : grade.label === 'Average'
              ? 'Moderate performance — focused optimization will yield clear gains.'
              : 'Significant optimization opportunities exist across multiple areas.'}
          </p>
        </div>
      </div>

      {/* Individual scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['sustainability', 'costEfficiency', 'timeEfficiency'].map(key => (
          <ScorePill
            key={key}
            type={key}
            score={scores[key]}
            reasoning={scores.reasoning?.[key] || ''}
          />
        ))}
      </div>
    </div>
  )
}
