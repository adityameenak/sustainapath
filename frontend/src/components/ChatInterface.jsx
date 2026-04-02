import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, ArrowLeft, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { sendChat } from '../utils/api'

export default function ChatInterface({ messages, setMessages, goal, onAnalysisComplete, onBack }) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiResponse, setAiResponse] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, aiResponse])

  // Trigger initial analysis when component mounts
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'user') {
      runAnalysis(messages)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runAnalysis(currentMessages) {
    setIsLoading(true)
    setError('')
    try {
      const result = await sendChat(currentMessages, goal)

      if (result.type === 'clarifying') {
        setAiResponse(result)
        // Add assistant message to history
        const clarifyMsg = {
          role: 'assistant',
          content: result.message + '\n\n' + result.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')
        }
        setMessages(prev => [...prev, clarifyMsg])
        setAiResponse(null)
      } else if (result.type === 'analysis') {
        // Done — hand off to results page
        onAnalysisComplete(result.data)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')

    await runAnalysis(newMessages)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  const assistantMessages = messages.filter(m => m.role === 'assistant')
  const hasQuestions = assistantMessages.length > 0

  return (
    <main className="pt-16 min-h-screen flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30">Goal:</span>
            <span className="badge-cyan capitalize">{goal}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {/* Info banner */}
          {!hasQuestions && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 bg-brand-500/10 border border-brand-500/20
                         rounded-xl p-4 text-sm text-brand-200"
            >
              <Sparkles className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-brand-300 mb-0.5">Analyzing your process…</p>
                <p className="text-brand-300/70 text-xs">
                  SustainaPath is evaluating your description. It may ask follow-up
                  questions to generate a more precise analysis.
                </p>
              </div>
            </motion.div>
          )}

          {/* Message bubbles */}
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/40
                                  flex items-center justify-center shrink-0 mt-1 mr-2">
                    <Sparkles className="w-3 h-3 text-brand-400" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === 'user'
                      ? 'bg-brand-600/30 border border-brand-500/30 text-white ml-4'
                      : 'bg-white/[0.05] border border-white/[0.06] text-white/80'
                    }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/40
                              flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 text-brand-400" />
              </div>
              <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="text-xs text-white/40 mr-1">Analyzing</span>
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="typing-dot w-1.5 h-1.5 rounded-full bg-brand-400"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-2 bg-red-500/10 border border-red-500/20
                         rounded-xl p-3 text-red-300 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-red-300/70 text-xs mt-0.5">{error}</p>
                <button
                  onClick={() => runAnalysis(messages)}
                  className="text-red-300 underline text-xs mt-1 hover:text-red-200"
                >
                  Retry
                </button>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        {hasQuestions && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-4"
          >
            <form onSubmit={handleSend} className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Answer the questions above to continue the analysis…"
                rows={3}
                className="input-field text-sm pr-12 leading-relaxed"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center
                           bg-brand-500 hover:bg-brand-400 disabled:bg-white/10 disabled:cursor-not-allowed
                           rounded-lg transition-colors duration-150 text-white"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <p className="text-xs text-white/20 mt-1.5 text-center">
              Enter ↵ to send · Shift+Enter for new line
            </p>
          </motion.div>
        )}
      </div>
    </main>
  )
}
