import React, { useState } from 'react'
import { Hash, Volume2, Plus, Settings, Mic, Headphones, PhoneOff } from 'lucide-react'

export default function ChannelSidebar({ server, selectedChannelId, onSelectChannel, onCreateChannel, user, voiceState, onLeaveVoice }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('text')

  if (!server) {
    return (
      <div className="w-60 bg-discord-channels flex flex-col">
        <div className="h-12 px-4 flex items-center border-b border-[#1e1f22] font-bold shadow-sm">Direkt Mesajlar</div>
        <div className="p-4 text-sm text-discord-muted">DM'ler yakında... Şimdilik sunucuları kullan.</div>
      </div>
    )
  }

  const textChannels = server.channels.filter(c=>c.type==='text')
  const voiceChannels = server.channels.filter(c=>c.type==='voice')

  const handleCreate = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    onCreateChannel({ serverId: server.id, name: newName, type: newType })
    setNewName('')
    setShowAdd(false)
  }

  return (
    <div className="w-60 bg-discord-channels flex flex-col shrink-0">
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#1e1f22] shadow-sm font-bold text-[15px] cursor-pointer hover:bg-[#35373c]">
        <span className="truncate">{server.name}</span>
        <span className="text-discord-muted">⌄</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4 discord-scrollbar">
        {/* Text */}
        <div>
          <div className="flex items-center justify-between px-1 py-1 text-[12px] font-semibold text-discord-muted uppercase tracking-wide">
            <span>Metin Kanalları</span>
            <button onClick={()=>setShowAdd(v=>!v)} className="hover:text-white"><Plus size={14} /></button>
          </div>
          {showAdd && (
            <form onSubmit={handleCreate} className="bg-discord-bg p-2 rounded mb-2 space-y-2">
              <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="kanal-adi" className="w-full bg-discord-input rounded px-2 py-1 text-sm outline-none" autoFocus />
              <div className="flex gap-2 text-xs">
                <label className={`flex-1 text-center py-1 rounded cursor-pointer ${newType==='text' ? 'bg-discord-blurple' : 'bg-discord-input'}`}>
                  <input type="radio" checked={newType==='text'} onChange={()=>setNewType('text')} className="hidden" /> Yazı
                </label>
                <label className={`flex-1 text-center py-1 rounded cursor-pointer ${newType==='voice' ? 'bg-discord-blurple' : 'bg-discord-input'}`}>
                  <input type="radio" checked={newType==='voice'} onChange={()=>setNewType('voice')} className="hidden" /> Ses
                </label>
              </div>
              <button type="submit" className="w-full bg-discord-blurple text-white py-1 rounded text-sm">Oluştur</button>
            </form>
          )}
          <div className="space-y-[2px]">
            {textChannels.map(ch=>(
              <button key={ch.id} onClick={()=>onSelectChannel(ch.id)}
                className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-[15px] ${selectedChannelId===ch.id ? 'bg-discord-active text-white' : 'text-discord-muted hover:bg-discord-hover hover:text-discord-text'}`}>
                <Hash size={18} className="shrink-0 opacity-70" />
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Voice */}
        <div>
          <div className="px-1 py-1 text-[12px] font-semibold text-discord-muted uppercase tracking-wide">Ses Kanalları</div>
          <div className="space-y-[2px]">
            {voiceChannels.map(ch=>{
              const isActive = voiceState?.channelId===ch.id
              const count = voiceState?.counts?.[ch.id] || 0
              return (
                <button key={ch.id} onClick={()=>onSelectChannel(ch.id)}
                  className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-[15px] ${selectedChannelId===ch.id ? 'bg-discord-active text-white' : 'text-discord-muted hover:bg-discord-hover hover:text-discord-text'}`}>
                  <Volume2 size={18} className="shrink-0 opacity-70" />
                  <span className="truncate flex-1 text-left">{ch.name}</span>
                  {count>0 && <span className="text-xs bg-discord-bg px-1.5 rounded-full">{count}</span>}
                  {isActive && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="pt-6 text-[11px] text-discord-muted px-2 leading-4">
          <p className="font-bold">🇹🇷 Türkiye için üretildi</p>
          <p>Discord yasaklı olduğu için kendi platformumuzu kurduk. Sesli + yazılı tamamen ücretsiz.</p>
        </div>
      </div>

      {/* Voice status */}
      {voiceState?.channelId && (
        <div className="bg-[#232428] p-2 border-t border-[#1e1f22]">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400">{voiceState.channelId} / Ses Bağlı</span>
            </div>
            <button onClick={onLeaveVoice} className="bg-discord-red text-white p-1 rounded hover:bg-red-600"><PhoneOff size={14} /></button>
          </div>
          <div className="mt-2 space-y-1">
            {voiceState.participants?.map(p=>(
              <div key={p.id || p.socketId} className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{background:p.color}}>{p.avatar}</div>
                <span className="truncate">{p.username}</span>
                <Mic size={12} className="ml-auto text-discord-muted" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User panel */}
      <div className="h-[52px] bg-[#232428] flex items-center px-2 gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{background:user?.color}}>{user?.avatar}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate leading-4">{user?.username}</div>
          <div className="text-[11px] text-discord-muted leading-3">Çevrimiçi</div>
        </div>
        <button className="p-1.5 hover:bg-discord-hover rounded text-discord-muted hover:text-white"><Mic size={18} /></button>
        <button className="p-1.5 hover:bg-discord-hover rounded text-discord-muted hover:text-white"><Headphones size={18} /></button>
        <button className="p-1.5 hover:bg-discord-hover rounded text-discord-muted hover:text-white"><Settings size={18} /></button>
      </div>
    </div>
  )
}
