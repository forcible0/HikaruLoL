# HikaruLoL

deeplol.gg benzeri, Riot API + Community Dragon tabanlı, **Electron + React** ile yazılmış
bir **League of Legends masaüstü build / tier listesi / counter** uygulaması.

## ✨ Özellikler

- 🏆 **Tüm şampiyonlar** (170+ şampiyon) — Data Dragon (Riot'un resmi statik CDN'i)
- 🎯 **Tier Listesi** — S / A / B / C / D / F tier'ları, win rate, pick rate, ban rate
- ⚔️ **Build Rehberi** — Her şampiyon için:
  - Önerilen rünler (keystone + minor + finish)
  - Core build sırası (boots → 3 core → situational)
  - Yetenek sırası (Q / W / E max önceliği)
  - Summoner büyüleri (Flash + Ignite)
- 🛡️ **Counter pickler** ve 🤝 **Sinergi** önerileri
- 🔍 **Şampiyon arama** (header'da, canlı sonuçlu)
- 👤 **Oyuncu arama** — Riot ID (GameName#Tag) ile (Riot API kullanır)
- 🅰️ **Alfabetik filtreleme** ve pozisyon filtreleme
- 📊 **Patch otomatik algılama** — Data Dragon'dan en son sürümü çeker
- 🌗 **Karanlık tema** — deeplol.gg tarzı modern UI

## 🚀 Kurulum (Windows)

```bash
cd hikarulol-app
npm install
```

### Geliştirme modu (web önizleme)

```bash
npm run dev:web
```
→ http://localhost:3000 adresinde açılır.

### Geliştirme modu (Electron penceresi)

```bash
npm run dev
```
→ React dev server + Electron birlikte açılır.

### Windows .exe olarak derle

```bash
npm run build:win
```
→ `dist/` klasörüne kurulum dosyası çıkar.

## 🔑 Riot API Key

`src/data/communityDragon.js` dosyasındaki `RIOT_API_KEY` sabit değişkenine
kendi key'inizi yazabilirsiniz. Bu key sadece **Oyuncu Ara** sayfasında
kullanılır (summoner bilgisi çekmek için). Şampiyon, item, rün gibi
diğer tüm veriler **Community Dragon / Data Dragon** üzerinden ücretsiz
olarak çekilir — Riot API kullanmaz.

Önemli: Riot API'nin ücretsiz tier'ı sadece hesap ve temel summoner
bilgisi sağlar. Rank, lig ve maç geçmişi için "Application Production"
onayı gerekir.

## 📁 Proje Yapısı

```
hikarulol-app/
├── main.js                  # Electron ana process
├── preload.js               # Güvenli IPC köprüsü
├── package.json
├── public/
│   └── index.html
└── src/
    ├── App.js               # Ana router
    ├── index.js             # React entry
    ├── components/
    │   ├── Header.js        # Üst navigasyon + arama
    │   ├── ChampionsList.js # Şampiyon grid + filtre
    │   ├── TierList.js      # Tier listesi tablosu
    │   ├── ChampionDetail.js# Şampiyon detay sayfası
    │   └── SummonerSearch.js# Oyuncu arama
    ├── data/
    │   ├── communityDragon.js # Data Dragon / Riot API client
    │   └── buildData.js     # Build / tier oluşturucu
    └── styles/
        └── global.css       # Tüm stiller
```

## 🎨 Mimari

- **Frontend**: React 18 + react-router-dom v6
- **Masaüstü**: Electron 28
- **Veri kaynağı**:
  - Şampiyon / item / spell görselleri → [Data Dragon CDN](https://ddragon.leagueoflegends.com)
  - Rün verisi → [Community Dragon GitHub](https://github.com/CommunityDragon/Data)
  - Oyuncu bilgisi → Riot Games API (Account-v1, Summoner-v4)
- **Tier & build**: Riot API'de tier listesi olmadığı için
  `buildData.js` her şampiyon için tag'lerine ve statlarına göre
  deterministik bir tier + build önerisi oluşturur (de eplol.gg
  benzeri bir simülasyon). Gelecekte üçüncü parti bir meta API
  (Mobalytics, ugg.lol vb.) ile değiştirilebilir.

## 📝 Lisans

MIT
