import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import ServerSidebar from './components/ServerSidebar'
import ChannelSidebar from './components/ChannelSidebar'
import ChatArea from './components/ChatArea'
import MemberList from './components/MemberList'
import LoginScreen from './components/LoginScreen'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || undefined // undefined = same origin via vite proxy for preview

export default function App() {
  const [user, setUser] = useState(null) // {username, avatar, color, id}
  const [servers, setServers] = useState([])
  const [selectedServerId, setSelectedServerId] = useState(null)
  const [selectedChannelId, setSelectedChannelId] = useState(null)
  const [messages, setMessages] = useState({}) // channelId -> []
  const [onlineUsers, setOnlineUsers] = useState([])
  const [typing, setTyping] = useState({}) // channelId -> [usernames]
  const [voice, setVoice] = useState({ channelId: null, participants: [], counts: {}, socketIds: [] })
  const socketRef = useRef(null)
  const localStreamRef = useRef(null)
  const peerConnectionsRef = useRef({}) // socketId -> RTCPeerConnection
  const remoteAudiosRef = useRef({})

  // init socket
  useEffect(() => {
    if (!user) return
    const socket = io(SERVER_URL, { transports: ['websocket','polling'] })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('user:join', { username: user.username, avatar: user.avatar, color: user.color })
    })

    socket.on('init', ({ servers, messages, user: u }) => {
      setServers(servers)
      setMessages(messages)
      if (!selectedServerId && servers.length>0) {
        setSelectedServerId(servers[0].id)
        const firstText = servers[0].channels.find(c=>c.type==='text')
        if (firstText) setSelectedChannelId(firstText.id)
      }
      setUser(prev=> ({...prev, id: socket.id}))
    })

    socket.on('servers:list', setServers)
    socket.on('server:created', (srv) => setServers(prev=>[...prev, srv]))
    socket.on('channel:created', ({ serverId, channel }) => {
      setServers(prev=> prev.map(s=> s.id===serverId ? {...s, channels:[...s.channels, channel]} : s))
      if (channel.type==='text') setMessages(prev=> ({...prev, [channel.id]: []}))
    })

    socket.on('messages:history', ({ channelId, messages: hist }) => {
      setMessages(prev=> ({...prev, [channelId]: hist}))
    })
    socket.on('message:new', (msg) => {
      setMessages(prev=> ({...prev, [msg.channelId]: [...(prev[msg.channelId]||[]), msg]}))
    })
    socket.on('message:deleted', ({ channelId, messageId }) => {
      setMessages(prev=> ({...prev, [channelId]: (prev[channelId]||[]).filter(m=>m.id!==messageId)}))
    })

    socket.on('users:online', setOnlineUsers)
    socket.on('user:joined', (u) => setOnlineUsers(prev=> [...prev.filter(x=>x.id!==u.id), u]))
    socket.on('user:left', (u) => setOnlineUsers(prev=> prev.filter(x=>x.id!==u.id)))

    socket.on('typing:update', ({ channelId, user: uname, typing: isTyping }) => {
      setTyping(prev=>{
        const list = prev[channelId] || []
        if (isTyping) {
          if (!list.includes(uname)) return {...prev, [channelId]: [...list, uname]}
        } else {
          return {...prev, [channelId]: list.filter(n=>n!==uname)}
        }
        return prev
      })
    })

    // Voice
    socket.on('voice:participants', ({ channelId, participants, allSocketIds }) => {
      setVoice(prev=> ({...prev, channelId, participants: participants || [], socketIds: allSocketIds || []}))
      // initiate peer connections for all existing participants
      if (localStreamRef.current) {
        allSocketIds.forEach(sid=>{
          if (sid!==socket.id && !peerConnectionsRef.current[sid]) {
            createPeerConnection(sid, true)
          }
        })
      }
    })
    socket.on('voice:joined', ({ channelId, user: joinedUser, socketId }) => {
      setVoice(prev=>{
        if (prev.channelId!==channelId) return prev
        return {...prev, participants: [...prev.participants.filter(p=>p.id!==socketId), joinedUser], socketIds: [...new Set([...(prev.socketIds||[]), socketId])]}
      })
      if (localStreamRef.current && socketId!==socket.id) {
        createPeerConnection(socketId, false)
      }
    })
    socket.on('voice:left', ({ channelId, socketId }) => {
      setVoice(prev=>{
        if (prev.channelId!==channelId) return prev
        return {...prev, participants: prev.participants.filter(p=>p.id!==socketId), socketIds: (prev.socketIds||[]).filter(id=>id!==socketId)}
      })
      if (peerConnectionsRef.current[socketId]) {
        peerConnectionsRef.current[socketId].close()
        delete peerConnectionsRef.current[socketId]
      }
      if (remoteAudiosRef.current[socketId]) {
        remoteAudiosRef.current[socketId].remove()
        delete remoteAudiosRef.current[socketId]
      }
    })
    socket.on('voice:update', ({ channelId, participantsCount }) => {
      setVoice(prev=> ({...prev, counts: {...prev.counts, [channelId]: participantsCount}}))
    })

    socket.on('webrtc:offer', async ({ from, offer }) => {
      console.log('got offer from', from)
      if (!localStreamRef.current) return
      const pc = createPeerConnection(from, false)
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('webrtc:answer', { to: from, answer })
    })
    socket.on('webrtc:answer', async ({ from, answer }) => {
      const pc = peerConnectionsRef.current[from]
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer))
    })
    socket.on('webrtc:ice', async ({ from, candidate }) => {
      const pc = peerConnectionsRef.current[from]
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch(e){ console.warn(e)}
      }
    })

    return () => {
      socket.disconnect()
      cleanupVoice()
    }
  }, [user?.username])

  const cleanupVoice = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t=>t.stop())
      localStreamRef.current = null
    }
    Object.values(peerConnectionsRef.current).forEach(pc=>pc.close())
    peerConnectionsRef.current = {}
    Object.values(remoteAudiosRef.current).forEach(el=>el.remove())
    remoteAudiosRef.current = {}
  }

  const createPeerConnection = (remoteSocketId, isInitiator) => {
    if (peerConnectionsRef.current[remoteSocketId]) return peerConnectionsRef.current[remoteSocketId]
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    peerConnectionsRef.current[remoteSocketId] = pc

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track=> pc.addTrack(track, localStreamRef.current))
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit('webrtc:ice', { to: remoteSocketId, candidate: e.candidate })
      }
    }

    pc.ontrack = (e) => {
      let audioEl = remoteAudiosRef.current[remoteSocketId]
      if (!audioEl) {
        audioEl = document.createElement('audio')
        audioEl.autoplay = true
        audioEl.playsInline = true
        document.body.appendChild(audioEl)
        remoteAudiosRef.current[remoteSocketId] = audioEl
      }
      audioEl.srcObject = e.streams[0]
    }

    if (isInitiator) {
      pc.createOffer().then(offer=>{
        pc.setLocalDescription(offer)
        socketRef.current?.emit('webrtc:offer', { to: remoteSocketId, offer, channelId: voice.channelId })
      })
    }

    return pc
  }

  // handlers
  const handleLogin = (u) => setUser(u)

  const selectedServer = servers.find(s=>s.id===selectedServerId)
  const selectedChannel = selectedServer?.channels.find(c=>c.id===selectedChannelId) || null

  const handleSelectServer = (id) => {
    setSelectedServerId(id)
    if (id==='DM') { setSelectedChannelId(null); return }
    const srv = servers.find(s=>s.id===id)
    const first = srv?.channels.find(c=>c.type==='text') || srv?.channels[0]
    if (first) setSelectedChannelId(first.id)
  }

  const handleCreateServer = () => {
    const name = prompt('Sunucu adı?')
    if (!name) return
    const icon = prompt('İkon / emoji?', '🚀') || '🚀'
    socketRef.current?.emit('server:create', { name, icon })
  }

  const handleCreateChannel = ({ serverId, name, type }) => {
    socketRef.current?.emit('channel:create', { serverId, name, type })
  }

  const handleSend = (content) => {
    if (!selectedChannelId) return
    socketRef.current?.emit('message:send', { channelId: selectedChannelId, content })
  }
  const handleDelete = (msgId) => {
    if (!selectedChannelId) return
    socketRef.current?.emit('message:delete', { channelId: selectedChannelId, messageId: msgId })
  }

  const handleJoinVoice = async (channelId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false })
      localStreamRef.current = stream
      socketRef.current?.emit('voice:join', { channelId })
      setVoice(prev=> ({...prev, channelId}))
    } catch(e) {
      alert('Mikrofon izni gerekli: '+e.message)
    }
  }
  const handleLeaveVoice = () => {
    socketRef.current?.emit('voice:leave')
    cleanupVoice()
    setVoice(prev=> ({...prev, channelId: null, participants: [], socketIds: []}))
  }

  if (!user) return <LoginScreen onJoin={handleLogin} />

  const msgs = messages[selectedChannelId] || []

  return (
    <div className="h-screen w-screen flex bg-discord-bg text-white overflow-hidden">
      <ServerSidebar servers={servers} selectedServerId={selectedServerId} onSelect={handleSelectServer} onCreateServer={handleCreateServer} onlineCount={onlineUsers.length} />
      <ChannelSidebar server={selectedServer} selectedChannelId={selectedChannelId} onSelectChannel={setSelectedChannelId} onCreateChannel={handleCreateChannel} user={user} voiceState={voice} onLeaveVoice={handleLeaveVoice} />
      <ChatArea channel={selectedChannel} messages={msgs} onSend={handleSend} onDelete={handleDelete} typingUsers={typing[selectedChannelId]||[]} user={user} socket={socketRef.current} onJoinVoice={handleJoinVoice} voiceState={voice} />
      <MemberList users={onlineUsers} />
    </div>
  )
}
