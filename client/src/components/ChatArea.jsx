import React, { useEffect, useRef, useState } from 'react'
import { Hash, Volume2, Users, Inbox, HelpCircle, Gift, Sticker, Smile, PlusCircle, Send } from 'lucide-react'

function formatTime(ts) {
  const d = new Date(ts)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) return `Bugün ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  return `${d.toLocaleDateString('tr-TR')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

function MessageItem({ msg, onDelete, isOwn }) {
  return (
    <div className="group flex gap-4 px-4 py-1 hover:bg-[#2e3035] message-hover relative">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 mt-0.5" style={{background: msg.color || '#5865f2'}}>
        {msg.avatar || '😎'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-medium text-[15px]" style={{color: msg.color || '#f2f3f5'}}>{msg.author}</span>
          <span className="text-[11px] text-discord-muted">{formatTime(msg.timestamp)}</span>
        </div>
        <div className="text-[15px] leading-[22px] whitespace-pre-wrap break-words text-[#dbdee1]">
          {msg.replyTo && <div className="text-xs text-discord-muted border-l-2 border-discord-divider pl-2 mb-1">↳ {msg.replyTo.content?.slice(0,80)}</div>}
          {msg.content}
        </div>
      </div>
      {isOwn && (
        <button onClick={()=>onDelete(msg.id)} className="absolute right-2 top-1 hidden group-hover:block text-xs text-discord-muted hover:text-red-400 bg-discord-bg border border-discord-divider px-2 py-1 rounded">
          Sil
        </button>
      )}
    </div>
  )
}

export default function ChatArea({ channel, messages, onSend, onDelete, typingUsers, user, socket, onJoinVoice, voiceState }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const listRef = useRef(null)
  const typingTimeout = useRef(null)

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:'smooth'})
  }, [messages])

  const handleTyping = (val) => {
    setInput(val)
    if (!socket) return
    socket.emit('typing:start', { channelId: channel?.id })
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(()=> socket.emit('typing:stop', { channelId: channel?.id }), 1200)
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    onSend(input)
    setInput('')
    socket?.emit('typing:stop', { channelId: channel?.id })
  }

  if (!channel) {
    return <div className="flex-1 flex items-center justify-center bg-discord-bg text-discord-muted">Bir kanal seç</div>
  }

  const isVoice = channel.type === 'voice'
  const isInThisVoice = voiceState?.channelId === channel.id

  return (
    <div className="flex-1 flex flex-col bg-discord-bg min-w-0">
      {/* header */}
      <div className="h-12 border-b border-[#1e1f22] shadow-sm flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-discord-muted">
            {isVoice ? <Volume2 size={20} /> : <Hash size={20} />}
          </div>
          <span className="font-bold truncate">{channel.name}</span>
          {!isVoice && <span className="hidden md:block w-px h-6 bg-discord-divider mx-2" />}
          {!isVoice && <span className="hidden md:block text-sm text-discord-muted truncate">Türkiye'nin en hızlı Discord alternatifi</span>}
        </div>
        <div className="flex items-center gap-4 text-discord-muted">
          <div className="hidden sm:flex items-center gap-4">
            <Users size={20} className="hover:text-white cursor-pointer" />
            <Inbox size={20} className="hover:text-white cursor-pointer" />
            <HelpCircle size={20} className="hover:text-white cursor-pointer" />
          </div>
          {isVoice && !isInThisVoice && (
            <button onClick={()=>onJoinVoice(channel.id)} className="bg-discord-green text-white px-3 py-1 rounded text-sm hover:bg-green-600">Sese Katıl</button>
          )}
          {isVoice && isInThisVoice && (
            <span className="text-green-400 text-sm flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Bağlısın</span>
          )}
        </div>
      </div>

      {/* messages or voice */}
      {isVoice ? (
        <VoiceView channel={channel} voiceState={voiceState} onJoinVoice={onJoinVoice} isInThisVoice={isInThisVoice} />
      ) : (
        <div ref={listRef} className="flex-1 overflow-y-auto py-4 space-y-0.5 discord-scrollbar">
          <div className="px-4 pb-6">
            <div className="w-16 h-16 rounded-full bg-discord-channels flex items-center justify-center text-3xl mb-3">
              <Hash />
            </div>
            <h1 className="text-3xl font-bold mb-2">#{channel.name} kanalına hoş geldin!</h1>
            <p className="text-discord-muted"># {channel.name} kanalının başlangıcı burası.</p>
          </div>

          {messages.map(m=>(
            <MessageItem key={m.id} msg={m} onDelete={onDelete} isOwn={m.authorId===user?.id || m.author===user?.username} />
          ))}
          <div ref={bottomRef} />

          {typingUsers?.length>0 && (
            <div className="px-4 py-2 text-sm text-discord-muted flex items-center gap-2">
              <span className="flex gap-1"><i className="w-1 h-1 bg-discord-muted rounded-full animate-bounce" /><i className="w-1 h-1 bg-discord-muted rounded-full animate-bounce delay-75" /><i className="w-1 h-1 bg-discord-muted rounded-full animate-bounce delay-150" /></span>
              {typingUsers.join(', ')} yazıyor...
            </div>
          )}
        </div>
      )}

      {/* input */}
      {!isVoice && (
        <div className="p-4 pt-0">
          <form onSubmit={handleSend} className="bg-discord-input rounded-lg flex items-end">
            <button type="button" className="p-3 text-discord-muted hover:text-white"><PlusCircle size={22} /></button>
            <input
              value={input}
              onChange={e=>handleTyping(e.target.value)}
              placeholder={`#${channel.name} kanalına mesaj gönder`}
              className="flex-1 bg-transparent py-3 outline-none text-[15px] placeholder:text-[#6d6f78]"
              maxLength={2000}
            />
            <div className="flex items-center gap-1 p-2">
              <button type="button" className="p-1.5 text-discord-muted hover:text-white"><Gift size={22} /></button>
              <button type="button" className="p-1.5 text-discord-muted hover:text-white"><Sticker size={22} /></button>
              <button type="button" className="p-1.5 text-discord-muted hover:text-white"><Smile size={22} /></button>
              <button type="submit" disabled={!input.trim()} className={`p-1.5 ${input.trim() ? 'text-white' : 'text-discord-muted'}`}><Send size={18} /></button>
            </div>
          </form>
          <div className="text-[11px] text-discord-muted mt-1 px-1">Enter ile gönder • Shift+Enter ile yeni satır • Hikaru v1.0 Türkiye 🇹🇷</div>
        </div>
      )}
    </div>
  )
}

function VoiceView({ channel, voiceState, onJoinVoice, isInThisVoice }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#1e1f22] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#313338]/50 to-[#1e1f22]" />
      <div className="relative z-10 text-center max-w-lg">
        <div className="w-24 h-24 bg-discord-channels rounded-full flex items-center justify-center mx-auto mb-6">
          <Volume2 size={40} className="text-discord-muted" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{channel.name} Ses Kanalı</h2>
        <p className="text-discord-muted mb-6">Discord gibi sesli konuş. Tarayıcın mikrofonunu kullanır. WebRTC ile direkt peer-to-peer.</p>

        {!isInThisVoice ? (
          <button onClick={()=>onJoinVoice(channel.id)} className="bg-discord-green hover:bg-green-600 text-white px-8 py-3 rounded-full font-medium text-[15px]">Sese Katıl</button>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
            {voiceState?.participants?.map(p=>(
              <div key={p.id || p.socketId} className="bg-discord-channels rounded-lg p-4 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 relative" style={{background:p.color}}>
                  {p.avatar}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-discord-channels flex items-center justify-center">
                    <span className="text-[10px]">🎤</span>
                  </div>
                </div>
                <span className="text-sm font-medium truncate w-full text-center">{p.username}</span>
                <span className="text-xs text-discord-muted">Konuşuyor</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
