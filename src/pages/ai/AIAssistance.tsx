import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import { Plus, Trash2, Sparkles, Send, MessageSquare } from 'lucide-react'

export default function AIAssistance() {
  const { business } = useAuthStore()
  const [conversations, setConversations] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('ai_conversations').select('*').eq('business_id', business.id).order('updated_at', { ascending: false })
    setConversations(data || [])
    if (data && data.length > 0 && !activeConv) {
      setActiveConv(data[0].id)
      loadMessages(data[0].id)
    }
    setLoading(false)
  }, [business])

  const loadMessages = async (convId: string) => {
    const { data } = await supabase.from('ai_messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true })
    setMessages(data || [])
  }

  useEffect(() => { load() }, [load])
  useEffect(() => { if (activeConv) loadMessages(activeConv) }, [activeConv])

  const newConversation = async () => {
    if (!business) return
    const { data } = await supabase.from('ai_conversations').insert({ business_id: business.id, title: 'New Conversation' }).select().single()
    if (data) { setActiveConv(data.id); load() }
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeConv) return
    const userMsg = input.trim()
    setInput('')
    await supabase.from('ai_messages').insert({ conversation_id: activeConv, role: 'user', content: userMsg })
    await supabase.from('ai_conversations').update({ title: conversations.find(c => c.id === activeConv)?.title === 'New Conversation' ? userMsg.slice(0, 50) : undefined }).eq('id', activeConv)
    loadMessages(activeConv)

    // Simulated AI response
    setTimeout(async () => {
      const response = `I understand you're asking about "${userMsg}". This is a demo AI assistant. In production, this would connect to OpenAI or similar service to provide intelligent responses about your business data.`
      await supabase.from('ai_messages').insert({ conversation_id: activeConv, role: 'assistant', content: response })
      loadMessages(activeConv)
    }, 1000)
  }

  const delConv = async (id: string) => {
    if (confirm('Delete this conversation?')) {
      await supabase.from('ai_conversations').delete().eq('id', id)
      if (activeConv === id) setActiveConv(null)
      load()
    }
  }

  return (
    <div>
      <PageHeader title="AI Assistant" subtitle="Get AI-powered help with your business" actions={<button onClick={newConversation} className="btn-primary"><Plus className="w-4 h-4" /> New Chat</button>} />
      <div className="px-6 flex gap-4 h-[calc(100vh-160px)]">
        <div className="w-64 space-y-2 overflow-y-auto">
          {loading ? <LoadingState /> : conversations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No conversations yet</p>
          ) : conversations.map(c => (
            <button key={c.id} onClick={() => setActiveConv(c.id)} className={`w-full text-left p-3 rounded-lg border transition-colors ${activeConv === c.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">{c.title}</p>
                <button onClick={(e) => { e.stopPropagation(); delConv(c.id) }} className="text-gray-300 hover:text-error-500"><Trash2 className="w-3 h-3" /></button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{formatDateTime(c.updated_at)}</p>
            </button>
          ))}
        </div>

        <div className="flex-1 card flex flex-col">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center"><Sparkles className="w-12 h-12 text-primary-300 mx-auto mb-3" /><p className="text-gray-400">Start a new conversation to get AI assistance</p></div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full"><div className="text-center"><MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">Send a message to start chatting</p></div></div>
                ) : messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}>{m.content}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 p-3 flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} className="input flex-1" placeholder="Ask anything..." />
                <button onClick={sendMessage} className="btn-primary"><Send className="w-4 h-4" /></button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
