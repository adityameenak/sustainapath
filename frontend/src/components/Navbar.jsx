import { Atom, RotateCcw } from 'lucide-react'

export default function Navbar({ showReset, onReset, appState }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6
                    bg-surface-950/80 backdrop-blur-xl border-b border-white/[0.04]">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/40
                        flex items-center justify-center">
          <Atom className="w-4 h-4 text-brand-400" />
        </div>
        <span className="font-bold text-white tracking-tight">
          Sustaina<span className="text-brand-400">Path</span>
        </span>
        <span className="ml-1 text-[10px] font-semibold uppercase tracking-widest
                         text-white/30 border border-white/10 px-1.5 py-0.5 rounded">
          AI
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {appState === 'results' && (
          <span className="text-xs text-green-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Analysis complete
          </span>
        )}
        {appState === 'chat' && (
          <span className="text-xs text-brand-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Analyzing process
          </span>
        )}
        {showReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70
                       text-sm transition-colors duration-150"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Analysis</span>
          </button>
        )}
      </div>
    </nav>
  )
}
