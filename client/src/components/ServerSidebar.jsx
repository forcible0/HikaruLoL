import React from 'react'

export default function ServerSidebar({ servers, selectedServerId, onSelect, onCreateServer, onlineCount }) {
  return (
    <div className="w-[72px] bg-discord-sidebar flex flex-col items-center py-3 gap-2 shrink-0 overflow-y-auto discord-scrollbar">
      {/* DM Home */}
      <button
        onClick={()=>onSelect('DM')}
        className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center text-[22px] transition-all duration-200 ${selectedServerId==='DM' ? 'bg-discord-blurple rounded-[16px] text-white' : 'bg-discord-channels text-discord-text hover:bg-discord-blurple hover:text-white'}`}
        title="Direkt Mesajlar"
      >🏠</button>
      <div className="w-8 h-0.5 bg-discord-channels rounded-full my-1" />

      {servers.map(srv=>(
        <button
          key={srv.id}
          onClick={()=>onSelect(srv.id)}
          className="group relative w-full flex items-center justify-center"
        >
          <div className={`absolute left-0 w-1 bg-white rounded-r-full transition-all ${selectedServerId===srv.id ? 'h-10' : 'h-0 group-hover:h-5'}`} />
          <div className={`w-12 h-12 flex items-center justify-center text-lg font-bold transition-all duration-200
            ${selectedServerId===srv.id ? 'bg-discord-blurple text-white rounded-[16px]' : 'bg-discord-channels text-discord-text rounded-[24px] group-hover:rounded-[16px] group-hover:bg-discord-blurple group-hover:text-white'}`}>
            {srv.icon}
          </div>
        </button>
      ))}

      <button
        onClick={onCreateServer}
        className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-discord-channels hover:bg-discord-green text-discord-green hover:text-white flex items-center justify-center text-2xl transition-all"
        title="Sunucu Ekle"
      >+</button>

      <div className="mt-auto text-[10px] text-discord-muted text-center px-1">
        {onlineCount} çevrimiçi
      </div>
    </div>
  )
}
