import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e7
});

const PORT = process.env.PORT || 3001;

// --- In-Memory DB ---
let db = {
  servers: [
    {
      id: 'home',
      name: 'Ana Sunucu',
      icon: '🏠',
      owner: 'system',
      channels: [
        { id: 'genel', name: 'genel', type: 'text' },
        { id: 'oyun', name: 'oyun-sohbet', type: 'text' },
        { id: 'muzik', name: 'Müzik Odası', type: 'voice' },
        { id: 'genel-ses', name: 'Genel Ses', type: 'voice' }
      ]
    },
    {
      id: 'hikaru',
      name: 'Hikaru Gang',
      icon: '⚡',
      owner: 'system',
      channels: [
        { id: 'duyurular', name: 'duyurular', type: 'text' },
        { id: 'kod', name: 'kodlama', type: 'text' },
        { id: 'tasarim', name: 'tasarım', type: 'text' },
        { id: 'lobi', name: 'Lobi', type: 'voice' }
      ]
    }
  ],
  messages: {
    'genel': [
      { id: uuidv4(), channelId: 'genel', author: 'Hikaru', avatar: '💜', content: 'Hikaru Discord Klonuna Hoşgeldiniz! 🇹🇷 Discord yasaksa, kendi Discordumuzu yaparız.', timestamp: Date.now() - 100000, color: '#5865f2' },
      { id: uuidv4(), channelId: 'genel', author: 'Sistem', avatar: '🤖', content: 'Bu proje tamamen açık kaynak ve Türkiye için yapıldı. Gerçek zamanlı mesajlaşma + sesli sohbet aktif!', timestamp: Date.now() - 80000 }
    ],
    'oyun': [],
    'duyurular': [{ id: uuidv4(), channelId: 'duyurular', author: 'Yönetim', avatar: '📢', content: '@everyone Yeni güncelleme: Sesli kanallar artık çalışıyor!', timestamp: Date.now() - 50000 }],
    'kod': [],
    'tasarim': []
  },
  users: {} // socketId -> user
};

// Load persisted if exists
try {
  if (fs.existsSync('./data.json')) {
    const saved = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
    db.servers = saved.servers || db.servers;
    db.messages = saved.messages || db.messages;
  }
} catch {}

const saveDB = () => {
  try { fs.writeFileSync('./data.json', JSON.stringify({ servers: db.servers, messages: db.messages }, null, 2)); } catch {}
};

const usersBySocket = new Map(); // socketId -> user
const voiceChannels = new Map(); // channelId -> Set<socketId>

let onlineUsers = [];

function broadcastOnline() {
  onlineUsers = Array.from(usersBySocket.values());
  io.emit('users:online', onlineUsers);
  // also per server presence mock
}

io.on('connection', (socket) => {
  console.log('connected', socket.id);

  socket.on('user:join', ({ username, avatar, color }) => {
    const user = {
      id: socket.id,
      username: username || 'Anon',
      avatar: avatar || '😎',
      color: color || '#5865f2',
      status: 'online',
      joinedAt: Date.now()
    };
    usersBySocket.set(socket.id, user);
    db.users[socket.id] = user;
    socket.emit('init', { servers: db.servers, messages: db.messages, user });
    broadcastOnline();
    socket.broadcast.emit('user:joined', user);
  });

  socket.on('servers:list', () => {
    socket.emit('servers:list', db.servers);
  });

  socket.on('server:create', ({ name, icon }) => {
    const newServer = {
      id: uuidv4().slice(0,8),
      name: name || 'Yeni Sunucu',
      icon: icon || '🚀',
      owner: usersBySocket.get(socket.id)?.username || 'anon',
      channels: [
        { id: uuidv4().slice(0,6), name: 'genel', type: 'text' },
        { id: uuidv4().slice(0,6), name: 'Genel Ses', type: 'voice' }
      ]
    };
    db.servers.push(newServer);
    saveDB();
    io.emit('server:created', newServer);
  });

  socket.on('channel:create', ({ serverId, name, type }) => {
    const srv = db.servers.find(s => s.id === serverId);
    if (!srv) return;
    const newChannel = { id: uuidv4().slice(0,6), name: name.toLowerCase().replace(/\s+/g,'-'), type: type || 'text' };
    srv.channels.push(newChannel);
    if (type === 'text') db.messages[newChannel.id] = [];
    saveDB();
    io.emit('channel:created', { serverId, channel: newChannel });
  });

  socket.on('messages:get', ({ channelId }) => {
    socket.emit('messages:history', { channelId, messages: db.messages[channelId] || [] });
  });

  socket.on('message:send', ({ channelId, content, replyTo }) => {
    const user = usersBySocket.get(socket.id);
    if (!user || !content?.trim()) return;
    const message = {
      id: uuidv4(),
      channelId,
      author: user.username,
      authorId: socket.id,
      avatar: user.avatar,
      color: user.color,
      content: content.slice(0,2000),
      timestamp: Date.now(),
      replyTo: replyTo || null
    };
    if (!db.messages[channelId]) db.messages[channelId] = [];
    db.messages[channelId].push(message);
    if (db.messages[channelId].length > 500) db.messages[channelId] = db.messages[channelId].slice(-500);
    saveDB();
    io.emit('message:new', message);
  });

  socket.on('message:delete', ({ channelId, messageId }) => {
    if (!db.messages[channelId]) return;
    db.messages[channelId] = db.messages[channelId].filter(m => m.id !== messageId);
    saveDB();
    io.emit('message:deleted', { channelId, messageId });
  });

  socket.on('typing:start', ({ channelId }) => {
    const user = usersBySocket.get(socket.id);
    if (!user) return;
    socket.broadcast.emit('typing:update', { channelId, user: user.username, typing: true });
  });
  socket.on('typing:stop', ({ channelId }) => {
    const user = usersBySocket.get(socket.id);
    if (!user) return;
    socket.broadcast.emit('typing:update', { channelId, user: user.username, typing: false });
  });

  // Voice handling
  socket.on('voice:join', ({ channelId }) => {
    // leave previous voice channels
    for (const [cid, set] of voiceChannels.entries()) {
      if (set.has(socket.id)) {
        set.delete(socket.id);
        io.to(cid).emit('voice:left', { channelId: cid, socketId: socket.id });
        socket.leave(cid);
      }
    }
    if (!voiceChannels.has(channelId)) voiceChannels.set(channelId, new Set());
    voiceChannels.get(channelId).add(socket.id);
    socket.join(channelId);
    const user = usersBySocket.get(socket.id);
    const participants = Array.from(voiceChannels.get(channelId)).map(sid => usersBySocket.get(sid)).filter(Boolean);
    // notify others in channel
    socket.to(channelId).emit('voice:joined', { channelId, user, socketId: socket.id });
    // send current participants to joiner
    socket.emit('voice:participants', { channelId, participants, allSocketIds: Array.from(voiceChannels.get(channelId)) });
    io.emit('voice:update', { channelId, participantsCount: voiceChannels.get(channelId).size });
  });

  socket.on('voice:leave', () => {
    for (const [cid, set] of voiceChannels.entries()) {
      if (set.has(socket.id)) {
        set.delete(socket.id);
        io.to(cid).emit('voice:left', { channelId: cid, socketId: socket.id });
        socket.leave(cid);
        io.emit('voice:update', { channelId: cid, participantsCount: set.size });
      }
    }
  });

  // WebRTC signaling
  socket.on('webrtc:offer', ({ to, offer, channelId }) => {
    io.to(to).emit('webrtc:offer', { from: socket.id, offer, channelId });
  });
  socket.on('webrtc:answer', ({ to, answer }) => {
    io.to(to).emit('webrtc:answer', { from: socket.id, answer });
  });
  socket.on('webrtc:ice', ({ to, candidate }) => {
    io.to(to).emit('webrtc:ice', { from: socket.id, candidate });
  });

  socket.on('disconnect', () => {
    const user = usersBySocket.get(socket.id);
    usersBySocket.delete(socket.id);
    delete db.users[socket.id];
    for (const [cid, set] of voiceChannels.entries()) {
      if (set.has(socket.id)) {
        set.delete(socket.id);
        io.to(cid).emit('voice:left', { channelId: cid, socketId: socket.id });
        io.emit('voice:update', { channelId: cid, participantsCount: set.size });
      }
    }
    broadcastOnline();
    if (user) socket.broadcast.emit('user:left', user);
    console.log('disconnected', socket.id);
  });
});

app.get('/', (req, res) => res.json({ status: 'Hikaru Discord Clone API working 🇹🇷', online: usersBySocket.size, servers: db.servers.length }));
app.get('/health', (req, res) => res.json({ ok: true }));

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
