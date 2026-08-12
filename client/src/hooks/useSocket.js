import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

export function useSocket(serverUrl) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const url = serverUrl || (import.meta.env.VITE_SERVER_URL || 'http://localhost:3001')
    socketRef.current = io(url, { transports: ['websocket','polling'] })
    socketRef.current.on('connect', ()=>setConnected(true))
    socketRef.current.on('disconnect', ()=>setConnected(false))
    return () => { socketRef.current?.disconnect() }
  }, [serverUrl])

  return { socket: socketRef.current, connected }
}
