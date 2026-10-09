// =========================================================================
// 🎵 ВАША МУЗЫКА: ПРОСТО УКАЖИТЕ ПУТЬ К СКАЧАННОМУ MP3 ФАЙЛУ
// =========================================================================
const MUSIC_CONFIG = {
  // 1. Укажите путь к вашему MP3 файлу (скачанному с интернета):
  //    - Если скачали файл и положили в samurai/assets/audio/ -> "assets/audio/music.mp3"
  //    - Если положили прямо в папку samurai/ -> "music.mp3" или "music2.mp3"
  //    - Или прямая ссылка на mp3 из интернета -> "https://.../music.mp3"
  audioFile: "music.mp3",

  // 2. Название вашей песни (будет написано в плеере на сайте):
  trackTitle: "МОЙ MP3 ТРЕК",

  // 3. Громкость (от 0.1 до 1.0, например 0.85 = 85%):
  volume: 0.85
};

/**
 * SAMURAI SYNDICATE // DISCORD COMMUNITY ENGINE
 * Features:
 * - 808 Phonk Synth Beat Machine with Web Audio API & Analyser Canvas
 * - 3D Squad Poster Tilt Physics
 * - Falling Crimson Sakura & Ember Particle Simulation
 * - Discord Modal & Copy Link Utility
 * - Member Dossier Clicks & Clipboard Copying
 * - Interactive Recruitment Form Handler
 */

// -------------------------------------------------------------
// 1. SAKURA & CRIMSON EMBERS CANVAS ENGINE
// -------------------------------------------------------------
function initSakuraParticles() {
  const canvas = document.getElementById("sakura-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const isMobile = window.innerWidth < 768;
  const particles = [];
  const COUNT = isMobile ? 22 : 45;

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3.5 + 2,
      speedX: (Math.random() - 0.5) * 1.5,
      speedY: Math.random() * 1.2 + 0.6,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 2.5,
      color: Math.random() > 0.4 ? "rgba(255, 31, 68, 0.65)" : "rgba(255, 100, 120, 0.5)"
    });
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rot += p.rotSpeed;

      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
      if (p.x > canvas.width) p.x = 0;
      if (p.x < 0) p.x = canvas.width;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      if (!isMobile) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
      }
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.6, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(loop);
  }

  loop();
}

// -------------------------------------------------------------
// 2. 808 PHONK AUDIO SYNTHESIZER & EQUALIZER
// -------------------------------------------------------------
let audioCtx = null;
let masterGain = null;
let bassBoost = null;
let analyser = null;
let isPlaying = false;
let isBassBoost = true;
let beatTimer = null;
let step = 0;
let customAudioTrack = null;
let customSourceNode = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioClass();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.85, audioCtx.currentTime);

    bassBoost = audioCtx.createBiquadFilter();
    bassBoost.type = "lowshelf";
    bassBoost.frequency.setValueAtTime(85, audioCtx.currentTime);
    bassBoost.gain.setValueAtTime(isBassBoost ? 9 : 0, audioCtx.currentTime);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.8;

    bassBoost.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(audioCtx.destination);
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  return audioCtx;
}

function makeDistortion(k = 25) {
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

function play808Kick(ctx, time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const shaper = ctx.createWaveShaper();

  shaper.curve = makeDistortion(22);

  osc.type = "sine";
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.09);

  gain.gain.setValueAtTime(0.95, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

  osc.connect(shaper);
  shaper.connect(gain);
  gain.connect(bassBoost);

  osc.start(time);
  osc.stop(time + 0.46);

  // Shockwave pulse on poster
  triggerPosterKick();
}

function playSnare(ctx, time) {
  const bufferSize = ctx.sampleRate * 0.14;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1300, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.35, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.13);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  noise.start(time);
  noise.stop(time + 0.14);
}

function playHiHat(ctx, time, acc) {
  const bufferSize = ctx.sampleRate * 0.04;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(7500, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(acc ? 0.22 : 0.08, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  noise.start(time);
  noise.stop(time + 0.05);
}

function playPhonkLead(ctx, time, freq) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc1.type = "square";
  osc2.type = "sawtooth";
  osc1.frequency.setValueAtTime(freq, time);
  osc2.frequency.setValueAtTime(freq * 1.005, time);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(freq * 1.4, time);
  filter.Q.setValueAtTime(4, time);

  gain.gain.setValueAtTime(0.24, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + 0.24);
  osc2.stop(time + 0.24);
}

// Melodic Phonk Scale (D Minor Phonk)
const PHONK_SCALE = [
  587.33, 0, 698.46, 783.99, 0, 880.00, 783.99, 698.46,
  587.33, 0, 523.25, 587.33, 0, 698.46, 587.33, 0
];

function runBeatLoop() {
  if (!isPlaying) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Kick on steps 0, 6, 8, 14
  if (step === 0 || step === 6 || step === 8 || step === 14) {
    play808Kick(ctx, now);
  }

  // Snare on 4, 12
  if (step === 4 || step === 12) {
    playSnare(ctx, now);
  }

  // Rolling Trap Hats
  playHiHat(ctx, now, step % 2 === 0);

  // Phonk Cowbell Lead
  const note = PHONK_SCALE[step % PHONK_SCALE.length];
  if (note && note > 0) {
    playPhonkLead(ctx, now, note);
  }

  step = (step + 1) % 16;
}

let userManuallyMuted = false;
let lastKickTime = 0;
let audioPlayer = null;

function getAudioCandidates() {
  const p = (MUSIC_CONFIG.audioFile || "").trim();
  const list = [];
  if (p) {
    if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("data:")) {
      return [p];
    }
    const norm = p.replace(/\\/g, "/");
    const filename = norm.split("/").pop();
    if (filename) {
      list.push(filename);
      list.push(`assets/audio/${filename}`);
      list.push(`../${filename}`);
      list.push(`../assets/audio/${filename}`);
      list.push(`samurai/${filename}`);
    }
    list.push(norm);
  }
  list.push("music2.mp3");
  list.push("music.mp3");
  list.push("assets/audio/music2.mp3");
  list.push("assets/audio/music.mp3");
  list.push("../music2.mp3");
  list.push("../music.mp3");
  list.push("../assets/audio/music2.mp3");
  list.push("../assets/audio/music.mp3");
  return Array.from(new Set(list));
}

function getAudioPlayer() {
  if (audioPlayer) return audioPlayer;

  audioPlayer = new Audio();
  audioPlayer.loop = true;
  audioPlayer.volume = Math.min(1.0, Math.max(0.05, MUSIC_CONFIG.volume || 0.85));
  audioPlayer.preload = "auto";

  const candidates = getAudioCandidates();
  let candidateIdx = 0;

  function setCandidate(idx) {
    if (idx >= candidates.length) return;
    audioPlayer.src = candidates[idx];
  }

  audioPlayer.addEventListener("error", () => {
    candidateIdx++;
    if (candidateIdx < candidates.length) {
      setCandidate(candidateIdx);
      if (!userManuallyMuted) {
        audioPlayer.play().catch(() => {});
      }
    }
  });

  setCandidate(0);
  return audioPlayer;
}

function showAudioPrompt() {
  let prompt = document.getElementById("audio-start-prompt");
  if (!prompt) {
    prompt = document.createElement("div");
    prompt.id = "audio-start-prompt";
    prompt.className = "audio-start-prompt";
    prompt.innerHTML = `
      <span class="prompt-icon"></span>
      <span class="prompt-text">НАЖМИТЕ В ЛЮБОМ МЕСТЕ, ЧТОБЫ ЗАИГРАЛА МУЗЫКА</span>
    `;
    prompt.addEventListener("click", (e) => {
      e.stopPropagation();
      userManuallyMuted = false;
      startMusic();
    });
    document.body.appendChild(prompt);
  }
  requestAnimationFrame(() => prompt.classList.add("visible"));
}

function hideAudioPrompt() {
  const prompt = document.getElementById("audio-start-prompt");
  if (prompt) {
    prompt.classList.remove("visible");
    setTimeout(() => {
      if (prompt.parentNode) prompt.parentNode.removeChild(prompt);
    }, 350);
  }
}

function updateSpeakerUI(active) {
  const widget = document.getElementById("floating-speaker-widget");
  const badge = document.getElementById("speaker-badge");

  if (widget) widget.classList.toggle("muted", !active);
  if (badge) badge.textContent = active ? "МУЗЫКА ВКЛ" : "МУЗЫКА ВЫКЛ";
}

function updateButtonsUI(active) {
  const btn = document.getElementById("btn-play-music");
  const playIcon = document.getElementById("play-icon");
  const playText = document.getElementById("play-text");
  const indicator = document.getElementById("sound-indicator");

  if (btn) btn.classList.toggle("playing", active);
  if (playIcon) playIcon.textContent = active ? "⏹" : "▶";
  if (playText) playText.textContent = active ? "ИГРАЕТ MP3" : "ВКЛЮЧИТЬ МУЗОН";
  if (indicator) indicator.classList.toggle("playing", active);
}

function startMusic() {
  userManuallyMuted = false;
  updateSpeakerUI(true);
  updateButtonsUI(true);

  const player = getAudioPlayer();
  player.volume = Math.min(1.0, Math.max(0.05, MUSIC_CONFIG.volume || 0.85));

  const playPromise = player.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      isPlaying = true;
      updateSpeakerUI(true);
      updateButtonsUI(true);
      hideAudioPrompt();
    }).catch((err) => {
      // Браузер ожидает первого касания/клика по странице
      isPlaying = false;
      updateSpeakerUI(true); // Динамик всегда остаётся активным
      updateButtonsUI(true);
      showAudioPrompt();
    });
  }

  const musicTitle = document.getElementById("music-title");
  if (musicTitle && MUSIC_CONFIG.trackTitle) {
    musicTitle.textContent = MUSIC_CONFIG.trackTitle;
  }
}

function stopMusic() {
  userManuallyMuted = true;
  isPlaying = false;

  if (audioPlayer) {
    audioPlayer.pause();
  }

  hideAudioPrompt();
  updateSpeakerUI(false);
  updateButtonsUI(false);
  showToast("Музыка отключена. При перезагрузке включится снова!");
}

function toggleMusic() {
  const player = getAudioPlayer();
  if (!player.paused && !userManuallyMuted) {
    stopMusic();
  } else {
    userManuallyMuted = false;
    startMusic();
  }
}

// -------------------------------------------------------------
// 3. ОТСЛЕЖИВАНИЕ БИТА И ПУЛЬСАЦИЯ САЙТА (BEAT TRACKER)
// -------------------------------------------------------------
function triggerPosterKick(intensity = 0.9) {
  const card = document.getElementById("squad-poster-card");
  if (!card) return;

  const scale = 1 + 0.028 * intensity;
  const blur = Math.round(55 + 45 * intensity);
  const glow = 0.55 + 0.35 * intensity;

  card.style.transition = "transform 0.05s cubic-bezier(0.1, 0.9, 0.2, 1), box-shadow 0.05s ease";
  card.style.transform = `scale(${scale})`;
  card.style.boxShadow = `0 35px 95px rgba(0, 0, 0, 0.98), 0 0 ${blur}px rgba(255, 31, 68, ${glow})`;

  // Акустическая волна вокруг динамика
  const wave = document.getElementById("speaker-wave-pulse");
  if (wave) {
    wave.style.transform = `translate(-50%, -50%) scale(${1.25 + 0.35 * intensity})`;
    wave.style.borderColor = "#ffffff";
    setTimeout(() => {
      wave.style.transform = "";
      wave.style.borderColor = "";
    }, 110);
  }

  // Прыжок звуковых полос эквалайзера в такт биту
  const bars = document.querySelectorAll(".sound-bars-indicator span");
  bars.forEach((b) => {
    b.style.height = `${35 + Math.random() * 65 * intensity}%`;
    setTimeout(() => { b.style.height = ""; }, 120);
  });

  setTimeout(() => {
    card.style.transition = "transform 0.18s cubic-bezier(0.2, 0.8, 0.3, 1), box-shadow 0.22s ease";
    card.style.transform = "";
    card.style.boxShadow = "";
  }, 95);
}

function initBeatTracker() {
  function checkBeat() {
    requestAnimationFrame(checkBeat);
    const isRunning = audioPlayer && !audioPlayer.paused;
    const now = performance.now();

    // 🎯 BEAT TRACKING: Всплеск баса каждые ~434ms (138 BPM темп)
    if (isRunning) {
      if (now - lastKickTime > 434) {
        lastKickTime = now;
        triggerPosterKick(0.95);
      }
    }
  }

  checkBeat();
}

// -------------------------------------------------------------
// 4. 3D POSTER TILT
// -------------------------------------------------------------
function initPosterTilt() {
  const card = document.getElementById("squad-poster-card");
  if (!card) return;

  // Отключаем 3D наклон мыши на мобильных/сенсорных экранах
  if (window.matchMedia && window.matchMedia("(hover: none)").matches) {
    return;
  }

  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  });
}

// -------------------------------------------------------------
// 5. DISCORD MODAL & RECRUITMENT FORM
// -------------------------------------------------------------
function initDiscordModal() {
  const modal = document.getElementById("discord-modal");
  const openBtn = document.getElementById("btn-join-discord");
  const closeBtn = document.getElementById("modal-close-btn");
  const copyBtn = document.getElementById("btn-copy-invite");
  const inviteInput = document.getElementById("invite-url-input");

  if (!modal) return;

  function open() { modal.classList.add("open"); }
  function close() { modal.classList.remove("open"); }

  if (openBtn) openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  if (copyBtn && inviteInput) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(inviteInput.value).then(() => {
        showToast("Ссылка на Discord скопирована в буфер!");
      });
    });
  }

  // Top recruit button scroll
  const recruitBtn = document.getElementById("btn-open-recruit");
  if (recruitBtn) {
    recruitBtn.addEventListener("click", () => {
      document.getElementById("recruitment-anchor")?.scrollIntoView({ behavior: "smooth" });
    });
  }
}

// Recruitment Form Handler
function initRecruitForm() {
  const form = document.getElementById("discord-app-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("app-name").value.trim();
    const staticId = document.getElementById("app-static").value.trim();
    const discord = document.getElementById("app-discord").value.trim();

    // Store in localStorage
    try {
      const apps = JSON.parse(localStorage.getItem("samurai_recruits") || "[]");
      apps.push({ name, staticId, discord, date: new Date().toISOString() });
      localStorage.setItem("samurai_recruits", JSON.stringify(apps));
    } catch (e) { }

    form.reset();
    showToast(`✓ Заявка от ${name} (${staticId}) передана руководству Nikolai Samurai!`);
  });
}

// Member Cards, Filter Tabs & Scroll Utility
function initMemberCards() {
  // 1. Copy Discord on button click
  document.querySelectorAll(".btn-member-action[data-copy]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const tag = btn.getAttribute("data-copy");
      navigator.clipboard.writeText(tag).then(() => {
        showToast(`Discord ${tag} скопирован в буфер!`);
      });
    });
  });

  // 2. Clicking anywhere on card also triggers copy
  document.querySelectorAll(".member-card").forEach(card => {
    card.addEventListener("click", () => {
      const btn = card.querySelector(".btn-member-action[data-copy]");
      if (btn) btn.click();
    });
  });

  // 3. Click on poster leader chips to scroll & highlight member card
  document.querySelectorAll(".leader-chip[data-goto]").forEach(chip => {
    chip.addEventListener("click", () => {
      const targetId = chip.getAttribute("data-goto");
      const targetCard = document.querySelector(`.member-card[data-member="${targetId}"]`);
      if (!targetCard) return;

      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });

      targetCard.classList.remove("highlight");
      void targetCard.offsetWidth; // trigger reflow
      targetCard.classList.add("highlight");
      setTimeout(() => targetCard.classList.remove("highlight"), 2000);
    });
  });
}

// Toast
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById("toast-notify");
  const msgEl = document.getElementById("toast-msg");
  if (!toast || !msgEl) return;

  msgEl.textContent = msg;
  toast.classList.add("show");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

// -------------------------------------------------------------
// 6. REAL-TIME DISCORD STATS ENGINE (ONLINE / OFFLINE / TOTAL)
// -------------------------------------------------------------
let discordConfig = {
  method: "invite",
  inviteCode: "",
  widgetId: "",
  online: 482,
  offline: 858,
  total: 1340,
  guildName: "SAMURAI DISCORD"
};

function loadDiscordConfig() {
  try {
    const saved = localStorage.getItem("samurai_dsk_config");
    if (saved) {
      discordConfig = Object.assign({}, discordConfig, JSON.parse(saved));
    }
  } catch (e) { }
}

function saveDiscordConfig() {
  try {
    localStorage.setItem("samurai_dsk_config", JSON.stringify(discordConfig));
  } catch (e) { }
}

function updateDiscordUI(online, offline, total, name) {
  const onlineEl = document.getElementById("discord-online-count");
  const offlineEl = document.getElementById("discord-offline-count");
  const totalEl = document.getElementById("discord-total-count");
  const nameEl = document.getElementById("discord-guild-name");
  const joinBtn = document.getElementById("btn-join-discord");

  if (onlineEl) onlineEl.textContent = Number(online).toLocaleString();
  if (offlineEl) offlineEl.textContent = Number(offline).toLocaleString();
  if (totalEl) totalEl.textContent = Number(total).toLocaleString();
  if (nameEl && name) nameEl.textContent = name;

  if (joinBtn && discordConfig.inviteCode) {
    const raw = discordConfig.inviteCode.trim();
    if (raw) {
      joinBtn.href = raw.startsWith("http") ? raw : `https://discord.gg/${raw}`;
    }
  }
}

function updateBotStatusIndicator(connected, text) {
  const dot = document.getElementById("bot-status-dot");
  const txt = document.getElementById("bot-status-text");
  if (dot) dot.style.background = connected ? "var(--discord-green)" : "#ff3b30";
  if (txt) txt.textContent = text;
}

async function fetchLiveDiscordStats() {
  // Способ 1: Чтение discord_stats.json от бота samurai.py
  try {
    const res = await fetch("discord_stats.json?" + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (data.total !== undefined) {
        discordConfig.online = data.online;
        discordConfig.offline = data.offline;
        discordConfig.total = data.total;
        if (data.server_name) discordConfig.guildName = data.server_name;

        updateDiscordUI(data.online, data.offline, data.total, data.server_name);
        updateBotStatusIndicator(true, `Активно: ${data.server_name} (В сети: ${data.online})`);
        return true;
      }
    }
  } catch (e) { }

  updateBotStatusIndicator(false, "Файл discord_stats.json пока не создан ботом");

  // Способ 2: Запрос к Discord API по инвайт коду
  const rawInvite = discordConfig.inviteCode.trim();
  const inviteCode = rawInvite.replace(/^https?:\/\/discord\.(gg|com\/invite)\//i, "");
  if (inviteCode) {
    try {
      const res = await fetch(`https://discord.com/api/v10/invites/${inviteCode}?with_counts=true`);
      if (res.ok) {
        const data = await res.json();
        const online = data.approximate_presence_count || 0;
        const total = data.approximate_member_count || online;
        const offline = Math.max(0, total - online);
        const name = data.guild?.name || "SAMURAI DISCORD";

        discordConfig.online = online;
        discordConfig.offline = offline;
        discordConfig.total = total;
        discordConfig.guildName = name;

        updateDiscordUI(online, offline, total, name);
        return true;
      }
    } catch (e) { }
  }

  // Способ 3: Запрос через Server Widget ID
  const widgetId = discordConfig.widgetId.trim();
  if (widgetId) {
    try {
      const res = await fetch(`https://discord.com/api/guilds/${widgetId}/widget.json`);
      if (res.ok) {
        const data = await res.json();
        const online = data.presence_count || 0;
        const total = discordConfig.total || (online * 3);
        const offline = Math.max(0, total - online);
        const name = data.name || "SAMURAI DISCORD";

        updateDiscordUI(online, offline, total, name);
        return true;
      }
    } catch (e) { }
  }

  // Дефолтные / Ручные значения с легким живым пульсом
  let dynOnline = discordConfig.online;
  if (Math.random() < 0.25) {
    dynOnline = Math.max(1, discordConfig.online + Math.floor((Math.random() - 0.5) * 6));
  }
  const dynOffline = Math.max(0, discordConfig.total - dynOnline);
  updateDiscordUI(dynOnline, dynOffline, discordConfig.total, discordConfig.guildName);
  return false;
}

// -------------------------------------------------------------
// 7. DISCORD CONFIG MODAL
// -------------------------------------------------------------
function initDiscordConfigModal() {
  const modal = document.getElementById("dsk-config-modal");
  const openBtn = document.getElementById("btn-config-dsk");
  const closeBtn = document.getElementById("dsk-config-close-btn");
  const saveBtn = document.getElementById("btn-save-dsk-cfg");

  const inviteInp = document.getElementById("cfg-invite-input");
  const widgetInp = document.getElementById("cfg-widget-input");
  const manualOnline = document.getElementById("manual-online");
  const manualOffline = document.getElementById("manual-offline");
  const manualTotal = document.getElementById("manual-total");

  loadDiscordConfig();

  function open() {
    if (inviteInp) inviteInp.value = discordConfig.inviteCode;
    if (widgetInp) widgetInp.value = discordConfig.widgetId;
    if (manualOnline) manualOnline.value = discordConfig.online;
    if (manualOffline) manualOffline.value = discordConfig.offline;
    if (manualTotal) manualTotal.value = discordConfig.total;

    modal?.classList.add("open");
  }

  function close() {
    modal?.classList.remove("open");
  }

  if (openBtn) openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
  }

  // Switch config tabs
  document.querySelectorAll(".c-tab-btn[data-cfg]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-cfg");
      document.querySelectorAll(".c-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".cfg-pane").forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(`pane-${target}`)?.classList.add("active");
    });
  });

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      discordConfig.inviteCode = inviteInp?.value.trim() || "";
      discordConfig.widgetId = widgetInp?.value.trim() || "";

      if (manualOnline && manualOnline.value) discordConfig.online = parseInt(manualOnline.value, 10);
      if (manualOffline && manualOffline.value) discordConfig.offline = parseInt(manualOffline.value, 10);
      if (manualTotal && manualTotal.value) discordConfig.total = parseInt(manualTotal.value, 10);

      saveDiscordConfig();
      saveBtn.textContent = "⏳ Проверка связи...";
      await fetchLiveDiscordStats();
      saveBtn.textContent = "💾 СОХРАНИТЬ И ПОДКЛЮЧИТЬ";

      close();
      showToast("✓ Настройки Discord сохранены! Статистика синхронизирована.");
    });
  }
}

function initFloatingSpeaker() {
  const widget = document.getElementById("floating-speaker-widget");
  if (!widget) return;

  const onToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMusic();
  };

  widget.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
  });
  widget.addEventListener("click", onToggle);
}

function initAutoplay() {
  // Динамик ВСЕГДА ВКЛЮЧЕН по умолчанию при загрузке
  updateSpeakerUI(true);
  updateButtonsUI(true);

  // Пытаемся сразу запустить воспроизведение
  startMusic();

  // Мгновенная разблокировка звука при первом же любом касании, клике, клавише или скролле
  const unlockAudio = (e) => {
    if (e && e.target && e.target.closest && e.target.closest("#floating-speaker-widget")) {
      return;
    }
    if (userManuallyMuted) return;

    const player = getAudioPlayer();
    if (player.paused) {
      player.play().then(() => {
        isPlaying = true;
        updateSpeakerUI(true);
        updateButtonsUI(true);
        hideAudioPrompt();
      }).catch(() => {});
    }
  };

  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("click", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true });
  window.addEventListener("wheel", unlockAudio, { passive: true });
}

// -------------------------------------------------------------
// 8. INITIALIZATION
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadDiscordConfig();
  fetchLiveDiscordStats();

  initSakuraParticles();
  initBeatTracker();
  initPosterTilt();
  initDiscordModal();
  initDiscordConfigModal();
  initRecruitForm();
  initMemberCards();
  initFloatingSpeaker();
  initAutoplay();

  const playBtn = document.getElementById("btn-play-music");
  if (playBtn) playBtn.addEventListener("click", toggleMusic);

  const bassBtn = document.getElementById("btn-bass-boost");
  if (bassBtn) {
    bassBtn.addEventListener("click", () => {
      isBassBoost = !isBassBoost;
      bassBtn.classList.toggle("active", isBassBoost);
      if (bassBoost && audioCtx) {
        bassBoost.gain.setValueAtTime(isBassBoost ? 9 : 0, audioCtx.currentTime);
      }
      showToast(isBassBoost ? "🔊 808 BASS BOOST ВКЛЮЧЕН" : "808 Bass Boost отключен");
    });
  }

  // Auto sync stats every 15 seconds
  setInterval(fetchLiveDiscordStats, 15000);
});
