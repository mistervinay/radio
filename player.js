/* ── player.js — RadioWave Logic ───────────────────────────── */

let stations    = [];
let currentIdx  = 0;
let isPlaying   = false;
let isLoading   = false;
let toastTimer  = null;

// ── DOM References ───────────────────────────────────────────
const audioEl       = document.getElementById('audioEl');
const playBtn       = document.getElementById('playBtn');
const prevBtn       = document.getElementById('prevBtn');
const nextBtn       = document.getElementById('nextBtn');
const volSlider     = document.getElementById('volSlider');
const stationsList  = document.getElementById('stationsList');
const stationsCount = document.getElementById('stationsCount');
const artEmoji      = document.getElementById('artEmoji');
const stationName   = document.getElementById('stationName');
const stationGenre  = document.getElementById('stationGenre');
const stationDesc   = document.getElementById('stationDesc');
const nowPlaying    = document.getElementById('nowPlaying');
const waveContainer = document.getElementById('waveContainer');
const dynamicIsland = document.getElementById('dynamicIsland');
const islandName    = document.getElementById('islandName');
const statusTime    = document.getElementById('statusTime');
const phone         = document.getElementById('phone');
const toast         = document.getElementById('toast');
const stationsPanel = document.getElementById('stationsPanel');

// ── Panel Toggle ─────────────────────────────────────────────
document.getElementById('openPanelBtn').addEventListener('click', () => stationsPanel.classList.add('open'));
document.getElementById('closePanelBtn').addEventListener('click', () => stationsPanel.classList.remove('open'));

// ── Clock ────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  statusTime.textContent = h + ':' + m;
}
updateClock();
setInterval(updateClock, 15000);

// ── Wave Visualizer ──────────────────────────────────────────
function buildWave() {
  for (let i = 0; i < 40; i++) {
    const bar = document.createElement('div');
    bar.className = 'wave-bar';
    const h     = Math.floor(Math.random() * 28) + 8;
    const speed = (Math.random() * 0.6 + 0.5).toFixed(2);
    bar.style.setProperty('--h',   h + 'px');
    bar.style.setProperty('--spd', speed + 's');
    bar.style.animationDelay = (Math.random() * 0.5) + 's';
    waveContainer.appendChild(bar);
  }
}

// ── Build Station List ───────────────────────────────────────
function buildList() {
  stationsCount.textContent = stations.length + ' stations';
  stationsList.innerHTML = '';
  stations.forEach((s, i) => {
    const item = document.createElement('div');
    item.className = 'station-item' + (i === 0 ? ' active' : '');
    item.id = 'si-' + i;
    item.innerHTML = `
      <div class="station-icon" style="background:linear-gradient(135deg,${s.color[0]},${s.color[1]})">${s.emoji}</div>
      <div class="station-info">
        <div class="station-item-name">${s.name}</div>
        <div class="station-item-genre">${s.genre}</div>
      </div>
      <div class="station-item-action">
        <div class="mini-eq">
          <div class="mini-eq-bar" style="--dur:0.55s;height:4px"></div>
          <div class="mini-eq-bar" style="--dur:0.8s;height:4px"></div>
          <div class="mini-eq-bar" style="--dur:0.65s;height:4px"></div>
        </div>
        <svg viewBox="0 0 24 24" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>`;
    item.addEventListener('click', () => selectStation(i));
    stationsList.appendChild(item);
  });
}

// ── Apply Theme ──────────────────────────────────────────────
function applyTheme(station) {
  document.documentElement.style.setProperty('--station-bg1', station.color[0]);
  document.documentElement.style.setProperty('--station-bg2', station.color[1]);
  document.documentElement.style.setProperty('--accent1',     station.accent);
  phone.style.boxShadow = `0 0 0 1px rgba(0,0,0,0.5), 0 60px 120px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 120px ${station.color[0]}30`;
}

// ── Select Station ───────────────────────────────────────────
function selectStation(idx, autoplay = false) {
  const prev = document.getElementById('si-' + currentIdx);
  if (prev) prev.classList.remove('active', 'playing');

  currentIdx = idx;
  const station  = stations[idx];
  const listItem = document.getElementById('si-' + idx);
  if (listItem) {
    listItem.classList.add('active');
    listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  artEmoji.textContent    = station.emoji;
  stationName.textContent = station.name;
  stationGenre.textContent = station.genre;
  stationDesc.textContent  = station.desc;
  islandName.textContent   = station.name;
  stationName.classList.add('fade-in');
  setTimeout(() => stationName.classList.remove('fade-in'), 500);

  applyTheme(station);

  // Close the stations panel after selection
  stationsPanel.classList.remove('open');

  audioEl.pause();
  audioEl.src = '';
  setPlayingState(false);

  if (autoplay || isPlaying) startPlaying();
}

// ── Start Playing ────────────────────────────────────────────
function startPlaying() {
  const station = stations[currentIdx];
  setLoadingState(true);
  audioEl.src    = station.stream;
  audioEl.volume = parseFloat(volSlider.value);
  audioEl.load();
  audioEl.play().catch(err => {
    setLoadingState(false);
    showToast('Could not connect to stream. Try another station.');
    console.warn('Stream error:', err);
  });
}

// ── Controls ─────────────────────────────────────────────────
playBtn.addEventListener('click', () => {
  if (isLoading) return;
  if (isPlaying) {
    audioEl.pause();
    setPlayingState(false);
  } else {
    startPlaying();
  }
});

prevBtn.addEventListener('click', () => {
  selectStation((currentIdx - 1 + stations.length) % stations.length, true);
});
nextBtn.addEventListener('click', () => {
  selectStation((currentIdx + 1) % stations.length, true);
});

volSlider.addEventListener('input', () => {
  audioEl.volume = parseFloat(volSlider.value);
});

// ── Audio Events ─────────────────────────────────────────────
audioEl.addEventListener('playing', () => { setLoadingState(false); setPlayingState(true); });
audioEl.addEventListener('waiting', () => { setLoadingState(true); });
audioEl.addEventListener('canplay', () => { setLoadingState(false); });
audioEl.addEventListener('stalled', () => { setLoadingState(true); });
audioEl.addEventListener('error',   () => {
  setLoadingState(false);
  setPlayingState(false);
  showToast('Stream unavailable. Try another station.');
});

// ── State Helpers ─────────────────────────────────────────────
function setPlayingState(state) {
  isPlaying = state;
  playBtn.classList.toggle('playing', state);
  nowPlaying.classList.toggle('playing', state);
  waveContainer.classList.toggle('playing-wave', state);
  dynamicIsland.classList.toggle('expanded', state);
  const listItem = document.getElementById('si-' + currentIdx);
  if (listItem) listItem.classList.toggle('playing', state);
}

function setLoadingState(state) {
  isLoading = state;
  playBtn.classList.toggle('loading', state);
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}

// ── Init — Fetch stations.json then boot ──────────────────────
fetch('stations.json')
  .then(res => {
    if (!res.ok) throw new Error('Failed to load stations.json');
    return res.json();
  })
  .then(data => {
    stations = data;
    buildWave();
    buildList();
    applyTheme(stations[0]);
    stationName.textContent  = stations[0].name;
    stationGenre.textContent = stations[0].genre;
    stationDesc.textContent  = stations[0].desc;
    artEmoji.textContent     = stations[0].emoji;
    islandName.textContent   = stations[0].name;
  })
  .catch(err => {
    console.error(err);
    showToast('Could not load station list.');
  });
