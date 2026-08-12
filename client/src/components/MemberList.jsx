import React from 'react'

export default function MemberList({ users, typingMap }) {
  const online = users.filter(u=>u.status!=='offline')
  const offline = users.filter(u=>u.status==='offline')

  const Group = ({ title, list }) => (
    <div className="mb-6">
      <div className="text-[12px] font-semibold text-discord-muted uppercase px-2 mb-1">{title} — {list.length}</div>
      <div className="space-y-0.5">
        {list.map(u=>(
          <div key={u.id} className="flex items-center gap-3 px-2 py-1 rounded hover:bg-discord-hover group cursor-pointer">
            <div className="relative">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{background:u.color}}>{u.avatar}</div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-discord-channels flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[15px] leading-4 truncate group-hover:text-white" style={{color:u.color}}>{u.username}</div>
              <div className="text-[11px] text-discord-muted truncate">Çevrimiçi</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="w-60 bg-discord-channels p-3 overflow-y-auto hidden lg:block discord-scrollbar shrink-0">
      <Group title="Çevrimiçi" list={online} />
      {offline.length>0 && <Group title="Çevrimdışı" list={offline} />}
      <div className="text-[11px] text-discord-muted mt-8 px-2">
        <p>Bu liste gerçek zamanlı. {users.length} kullanıcı bağlı.</p>
      </div>
    </div>
  )
}
