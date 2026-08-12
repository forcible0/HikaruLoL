# Hikaru - Türkiye'nin Discord'u 🇹🇷

Discord Türkiye'de yasaklı olduğu için kendi Discord'umuzu yaptık.

## Özellikler
- 💬 Gerçek zamanlı mesajlaşma (Socket.IO)
- 🔊 Sesli kanallar (WebRTC mesh, P2P)
- 🏠 Sunucu & Kanal sistemi (Discord UI birebir)
- 👥 Online kullanıcı listesi, yazıyor göstergesi
- 😎 Avatar + renk seçimi, Discord teması
- 📱 Responsive, Türkçe

## Stack
- **Frontend:** Vite + React + Tailwind + lucide-react
- **Backend:** Node + Express + Socket.IO
- **Voice:** WebRTC + STUN, Socket.IO signaling
- **Veri:** In-memory + JSON persist

## Çalıştırma

```bash
# tüm proje
npm run dev

# sadece server
npm run server
# http://localhost:3001

# sadece client
npm run client
# http://localhost:5173
```

Veya iki terminal:

Terminal 1:
```
cd server
npm install
npm run dev
```

Terminal 2:
```
cd client
npm install
npm run dev
```

## Ortam
- `VITE_SERVER_URL` env ile backend URL değiştirilebilir
- Varsayılan local: http://localhost:3001

## Deploy
- Client static -> Vercel / Netlify
- Server -> Render / Fly / Railway

## Lisans
MIT - Herkes host edebilir. Sansüre karşı açık kaynak.

Made with ❤️ by forcible0 / HikaruLoL
