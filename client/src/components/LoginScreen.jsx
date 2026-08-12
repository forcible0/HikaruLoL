import React, { useState } from 'react'

const AVATARS = ['😎','💜','🔥','⚡','🐱','🦊','🎮','🚀','🌟','🍕','🎨','🤖','👑','💀','🌈']
const COLORS = ['#5865f2','#eb459e','#23a559','#f0b132','#ed4245','#3ba55c','#faa61a','#ff73fa','#57f287','#2ecc71']

export default function LoginScreen({ onJoin }) {
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [color, setColor] = useState(COLORS[0])

  const handle = (e) => {
    e.preventDefault()
    if (!username.trim()) return
    onJoin({ username: username.trim(), avatar, color })
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#5865f2] relative overflow-hidden p-4">
      {/* bg decor like discord */}
      <div className="absolute inset-0 opacity-30" style={{backgroundImage:`url("https://cdn.discordapp.com/attachments/760560429842006077/781943252174438410/bg.png")`}} />
      <div className="absolute left-0 bottom-0 w-[600px] h-[400px] bg-[#3ba55c] blur-[100px] opacity-20 rounded-full" />
      <div className="absolute right-0 top-0 w-[600px] h-[400px] bg-[#ed4245] blur-[100px] opacity-20 rounded-full" />

      <div className="relative z-10 w-full max-w-[900px] bg-[#313338] rounded-[5px] p-8 md:p-10 shadow-2xl flex flex-col md:flex-row gap-10">
        <div className="flex-1">
          <h1 className="text-[24px] font-bold text-white text-center md:text-left mb-2">Tekrar hoş geldin!</h1>
          <p className="text-[#b5bac1] text-center md:text-left mb-5">Türkiye'nin Discord'u Hikaru'ya giriş yap.</p>

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-[#b5bac1] tracking-wide">Kullanıcı Adı <span className="text-red-400">*</span></label>
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="HikaruFan42"
                className="mt-2 w-full bg-[#2b2d31] rounded p-2.5 outline-none text-white placeholder:text-[#6d6f78] focus:ring-0 border border-transparent focus:border-[#00a8fc]"
                maxLength={24} required />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#b5bac1] tracking-wide">Avatar Seç</label>
              <div className="mt-2 grid grid-cols-8 gap-2">
                {AVATARS.map(a=>(
                  <button type="button" key={a} onClick={()=>setAvatar(a)} className={`w-10 h-10 rounded-full text-xl flex items-center justify-center transition ${avatar===a ? 'ring-2 ring-white scale-110' : 'hover:scale-105 bg-[#2b2d31]'}`}>{a}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#b5bac1] tracking-wide">Renk</label>
              <div className="mt-2 flex gap-2 flex-wrap">
                {COLORS.map(c=>(
                  <button type="button" key={c} onClick={()=>setColor(c)} className={`w-8 h-8 rounded-full transition ${color===c ? 'ring-2 ring-white scale-110' : ''}`} style={{background:c}} />
                ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2.5 rounded-[3px] mt-2 transition">Giriş Yap ve Sohbete Başla</button>
            <p className="text-[12px] text-[#949ba4]">Discord Türkiye'de yasaklı olduğu için Hikaru'yu yaptık. Verilerin sadece bu sunucuda durur.</p>
          </form>
        </div>

        <div className="md:w-[260px] flex flex-col items-center justify-center text-center border-t md:border-t-0 md:border-l border-[#3f4147] pt-6 md:pt-0 md:pl-10">
          <div className="w-40 h-40 bg-white rounded-lg mb-6 flex items-center justify-center">
            <div className="text-6xl">🇹🇷</div>
          </div>
          <h3 className="font-bold text-xl text-white">QR ile giriş</h3>
          <p className="text-sm text-[#b5bac1] mt-2 leading-5">Bu açık kaynak Discord klonu. <span className="font-bold text-white">forcible0/HikaruLoL</span> reposu. Kendi sunucunda host edebilirsin.</p>
          <div className="mt-6 text-xs text-[#6d6f78]">Sesli sohbet WebRTC ile çalışır. Mesajlar Socket.IO üzerinden anlık iletilir.</div>
        </div>
      </div>
    </div>
  )
}
