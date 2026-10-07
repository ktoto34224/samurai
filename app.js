/**
 * GENA SAMURAI • MAJESTIC RP • SUPREME AUDIO & INTERACTIVE ENGINE
 * Features:
 * - 808 Phonk / Drift Trap Synthesizer Engine (Pumping bass, cowbell melody, trap drums)
 * - Canvas Frequency Equalizer Visualizer (Dynamic reactive bars)
 * - Bass Kick Shockwave pulse on the central photo
 * - 3D Card Tilt Physics
 * - Floating Sakura / Ember Canvas Particles
 * - GTA V Wanted Stars & Sound FX
 * - LocalStorage Profile State & Custom MP3 Upload
 */

// =========================================================================
// 🎵 НАСТРОЙКИ ВАШЕЙ МУЗЫКИ (ПРОСТО ПОМЕНЯЙТЕ ФАЙЛ ИЛИ НАЗВАНИЕ ЗДЕСЬ)
// =========================================================================
const MUSIC_CONFIG = {
  // Путь к вашей песне (положите любой MP3 в папку или укажите имя/путь):
  audioFile: "music.mp3",

  // Название вашей песни:
  trackTitle: "МОЙ MP3 ТРЕК",

  // Громкость по умолчанию (от 0.1 до 1.0, например 0.85 = 85%):
  volume: 0.85
};

// -------------------------------------------------------------
// 1. STATE & CONSTANTS
// -------------------------------------------------------------
const DEFAULT_PROFILE = {
  fullname: "GENA SAMURAI",
  staticId: "#251503",
  quote: "«В этом городе нужно быть не просто сильным. Нужно быть умным. А я — и то, и другое.»",
  discord: "ktoto342245",
};

const VIDEO_PRESETS = {
  traffic: "https://assets.mixkit.co/videos/preview/mixkit-night-skyline-and-city-traffic-timelapse-4279-large.mp4",
  sunset: "https://assets.mixkit.co/videos/preview/mixkit-los-angeles-sunset-skyline-timelapse-4309-large.mp4",
  cyber: "https://assets.mixkit.co/videos/preview/mixkit-highway-traffic-at-night-aerial-view-34533-large.mp4"
};

// -------------------------------------------------------------
// 2. WEB AUDIO API SYNTHESIZER ENGINE & CUSTOM AUDIO PLAYER
// -------------------------------------------------------------
let audioCtx = null;
let masterGain = null;
let bassBoostNode = null;
let analyser = null;
let isPlaying = false;
let bassBoostEnabled = true;
let sfxEnabled = true;
let beatInterval = null;
let currentPreset = 'phonk';
let userAudioElement = null;
let customAudioTrack = null;
let customSourceNode = null;

function initAudioSystem() {
  if (audioCtx) return audioCtx;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContextClass();

  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0.85, audioCtx.currentTime);

  // Bass Boost Filter (Low shelf)
  bassBoostNode = audioCtx.createBiquadFilter();
  bassBoostNode.type = "lowshelf";
  bassBoostNode.frequency.setValueAtTime(90, audioCtx.currentTime);
  bassBoostNode.gain.setValueAtTime(bassBoostEnabled ? 8 : 0, audioCtx.currentTime);

  // Analyser Node for Visualizer
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 64;
  analyser.smoothingTimeConstant = 0.8;

  // Chain: Source -> BassBoost -> MasterGain -> Analyser -> Destination
  bassBoostNode.connect(masterGain);
  masterGain.connect(analyser);
  analyser.connect(audioCtx.destination);

  return audioCtx;
}


// Distortion curve for heavy saturated 808
function makeDistortionCurve(amount = 25) {
  const k = amount;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

// 808 Punchy Kick with Pitch Drop
function play808Kick(ctx, time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const shaper = ctx.createWaveShaper();

  shaper.curve = makeDistortionCurve(18);

  osc.type = "sine";
  osc.frequency.setValueAtTime(145, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);

  gain.gain.setValueAtTime(0.9, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.42);

  osc.connect(shaper);
  shaper.connect(gain);
  gain.connect(bassBoostNode);

  osc.start(time);
  osc.stop(time + 0.45);

  // Visual shockwave on hero card
  triggerCardKickVisual();
}

// Phonk Snare / Clap
function playSnare(ctx, time) {
  // Noise buffer for snap
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1400, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.35, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.14);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  noise.start(time);
  noise.stop(time + 0.15);

  // Tone body
  const bodyOsc = ctx.createOscillator();
  const bodyGain = ctx.createGain();
  bodyOsc.type = "triangle";
  bodyOsc.frequency.setValueAtTime(190, time);
  bodyGain.gain.setValueAtTime(0.3, time);
  bodyGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
  bodyOsc.connect(bodyGain);
  bodyGain.connect(masterGain);
  bodyOsc.start(time);
  bodyOsc.stop(time + 0.09);
}

// Crisp Trap Hi-Hat
function playHiHat(ctx, time, accented = false) {
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
  filter.frequency.setValueAtTime(8000, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(accented ? 0.22 : 0.09, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + (accented ? 0.06 : 0.035));

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  noise.start(time);
  noise.stop(time + 0.07);
}

// Phonk Cowbell / Lead Melody (Square wave with detune and sharp envelope)
function playPhonkCowbell(ctx, time, freq) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const bandpass = ctx.createBiquadFilter();

  osc1.type = "square";
  osc2.type = "square";
  osc1.frequency.setValueAtTime(freq, time);
  osc2.frequency.setValueAtTime(freq * 1.004, time); // Subtle Phonk detune chorus

  bandpass.type = "bandpass";
  bandpass.frequency.setValueAtTime(freq * 1.5, time);
  bandpass.Q.setValueAtTime(3.5, time);

  gain.gain.setValueAtTime(0.28, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

  osc1.connect(bandpass);
  osc2.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(masterGain);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + 0.24);
  osc2.stop(time + 0.24);
}

// Phonk Cowbell Melody Patterns (Frequencies in Hz)
const MELODIES = {
  // Classic Phonk Drive (E Minor)
  phonk: [
    659.25, 0, 783.99, 880.00, 0, 987.77, 880.00, 783.99,
    659.25, 0, 587.33, 659.25, 0, 783.99, 659.25, 0
  ],
  // Drift Beat (Darker & Aggressive)
  drift: [
    440.00, 440.00, 0, 523.25, 0, 587.33, 659.25, 0,
    587.33, 0, 523.25, 0, 440.00, 493.88, 523.25, 440.00
  ],
  // Cyberpunk Bass Lead
  cyber: [
    329.63, 0, 329.63, 392.00, 0, 493.88, 440.00, 0,
    329.63, 392.00, 0, 440.00, 0, 493.88, 587.33, 523.25
  ]
};

// Pumping Beat Sequencer Loop (138 BPM, 16 steps per bar)
let step = 0;
function runBeatEngine() {
  if (!isPlaying) return;

  const ctx = initAudioSystem();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const melody = MELODIES[currentPreset] || MELODIES.phonk;

  // 1. Kick on steps 0, 6, 8, 14 (Syncopated Phonk groove)
  if (step === 0 || step === 6 || step === 8 || step === 14) {
    play808Kick(ctx, now);
  }

  // 2. Snare / Clap on step 4 and 12 (half-time trap backbeat)
  if (step === 4 || step === 12) {
    playSnare(ctx, now);
  }

  // 3. Rolling Hi-Hats every step with accents
  playHiHat(ctx, now, step % 2 === 0);

  // 4. Phonk Cowbell Melody
  const note = melody[step % melody.length];
  if (note && note > 0) {
    playPhonkCowbell(ctx, now, note);
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
      list.push(`samurai/${filename}`);
      list.push(`samurai/assets/audio/${filename}`);
    }
    list.push(norm);
  }
  list.push("music.mp3");
  list.push("assets/audio/music.mp3");
  list.push("music.mp3");
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
        audioPlayer.play().catch(() => { });
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
  const playBtn = document.getElementById("music-play-btn");
  const waveIcon = document.getElementById("sound-wave-icon");
  const playIcon = document.getElementById("play-btn-icon");
  const playText = document.getElementById("play-btn-text");

  if (playBtn) playBtn.classList.toggle("playing", active);
  if (waveIcon) waveIcon.classList.toggle("playing", active);
  if (playIcon) playIcon.textContent = active ? "⏹" : "▶";
  if (playText) playText.textContent = active ? "КАЧАЕТ НА ПОЛНУЮ!" : "ВКЛЮЧИТЬ МУЗОНЧИК";
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
      updateSpeakerUI(true);
      updateButtonsUI(true);
      showAudioPrompt();
    });
  }

  const trackDisp = document.getElementById("track-title-disp");
  if (trackDisp && MUSIC_CONFIG.trackTitle) {
    trackDisp.textContent = MUSIC_CONFIG.trackTitle;
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
// 3. ОТСЛЕЖИВАНИЕ БИТА И ПУЛЬСАЦИЯ ФОТО (BEAT TRACKER)
// -------------------------------------------------------------
function triggerCardKickVisual(intensity = 0.95) {
  const photo = document.getElementById("main-samurai-photo") || document.getElementById("poster-img");
  const card = document.getElementById("hero-card") || document.getElementById("squad-poster-card");
  if (!photo) return;

  // Просто пульсация фото под бит
  photo.style.transition = "transform 0.06s cubic-bezier(0.1, 0.9, 0.2, 1)";
  photo.style.transform = `scale(${1 + 0.035 * intensity})`;

  if (card) {
    card.style.transition = "box-shadow 0.06s ease";
    card.style.boxShadow = `0 35px 85px rgba(0, 0, 0, 0.95), 0 0 55px rgba(255, 45, 85, ${0.45 + 0.25 * intensity})`;
  }

  // Акустическая волна вокруг динамика
  const wave = document.getElementById("speaker-wave-pulse");
  if (wave) {
    wave.style.transform = `translate(-50%, -50%) scale(${1.2 + 0.3 * intensity})`;
    wave.style.borderColor = "#ffffff";
    setTimeout(() => {
      wave.style.transform = "";
      wave.style.borderColor = "";
    }, 110);
  }

  // Прыжок волны в плеере
  const waveIcon = document.getElementById("sound-wave-icon");
  if (waveIcon) {
    waveIcon.style.transform = `scale(${1.1 + 0.2 * intensity})`;
    setTimeout(() => { waveIcon.style.transform = ""; }, 120);
  }

  setTimeout(() => {
    photo.style.transition = "transform 0.16s cubic-bezier(0.2, 0.8, 0.3, 1)";
    photo.style.transform = "";
    if (card) {
      card.style.transition = "box-shadow 0.2s ease";
      card.style.boxShadow = "";
    }
  }, 90);
}

function initVisualizer() {
  function render() {
    requestAnimationFrame(render);

    const isRunning = (audioPlayer && !audioPlayer.paused) || isPlaying;
    const now = performance.now();

    // Пульсация фото под бит каждые ~434ms (138 BPM темп)
    if (isRunning) {
      if (now - lastKickTime > 434) {
        lastKickTime = now;
        triggerCardKickVisual(1.0);
      }
    }
  }

  render();
}

// -------------------------------------------------------------
// 4. FLOATING SAKURA & EMBER PARTICLES CANVAS
// -------------------------------------------------------------
function initParticles() {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const particles = [];
  const COUNT = 45;

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3.5 + 1.5,
      speedX: (Math.random() - 0.5) * 1.2,
      speedY: Math.random() * 0.9 + 0.4,
      color: Math.random() > 0.4 ? "rgba(255, 45, 85, 0.6)" : "rgba(229, 169, 60, 0.55)",
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 2
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
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.5, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(loop);
  }

  loop();
}

// -------------------------------------------------------------
// 5. 3D CARD TILT INTERACTION
// -------------------------------------------------------------
function init3DTilt() {
  const card = document.getElementById("hero-card");
  if (!card) return;

  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  });
}

// -------------------------------------------------------------
// 6. WANTED STARS SYSTEM & GTA SFX
// -------------------------------------------------------------
let wantedStars = 0;

function playWantedSound(stars) {
  if (!sfxEnabled) return;
  const ctx = initAudioSystem();
  const freq = [440, 554, 659, 830, 880, 1108][Math.min(stars, 5)];

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}

function playClickSound() {
  if (!sfxEnabled) return;
  try {
    const ctx = initAudioSystem();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(750, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) { }
}

function initWantedStars() {
  const starBtns = document.querySelectorAll(".star-btn");
  starBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-star"), 10);
      wantedStars = wantedStars === idx ? idx - 1 : idx;

      starBtns.forEach(b => {
        const s = parseInt(b.getAttribute("data-star"), 10);
        b.classList.toggle("active", s <= wantedStars);
      });

      playWantedSound(wantedStars);
      showToast(wantedStars > 0 ? `LSPD Розыск: ${wantedStars} ★` : "Розыск снят! Лидер чист.");
    });
  });
}

// -------------------------------------------------------------
// 7. TRACK PRESETS & CUSTOM UPLOAD
// -------------------------------------------------------------
function initTrackControls() {
  const playBtn = document.getElementById("music-play-btn");
  if (playBtn) playBtn.addEventListener("click", toggleMusic);

  const bassBtn = document.getElementById("bass-boost-btn");
  if (bassBtn) {
    bassBtn.addEventListener("click", () => {
      bassBoostEnabled = !bassBoostEnabled;
      bassBtn.classList.toggle("active", bassBoostEnabled);
      if (bassBoostNode && audioCtx) {
        bassBoostNode.gain.setValueAtTime(bassBoostEnabled ? 9 : 0, audioCtx.currentTime);
      }
      playClickSound();
      showToast(bassBoostEnabled ? "🔊 808 BASS BOOST: ВКЛЮЧЕН" : "808 Bass Boost: Отключен");
    });
  }

  // Preset buttons
  const trackBtns = document.querySelectorAll(".track-btn[data-preset]");
  const trackTitleDisp = document.getElementById("track-title-disp");

  const TITLES = {
    phonk: "🔥 SAMURAI PHONK // 808 BASS DRIFT (MAJESTIC EDITION)",
    drift: "🏎️ LOS SANTOS DRIFT // TOKYO TO VINEWOOD 140BPM",
    cyber: "🌃 NIGHT CYBER BASS // SAMURAI SYNDICATE HEIST"
  };

  trackBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const preset = btn.getAttribute("data-preset");
      currentPreset = preset;
      trackBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      if (trackTitleDisp) trackTitleDisp.textContent = TITLES[preset] || "SAMURAI BEAT";

      playClickSound();
      showToast(`Выбран трек: ${btn.innerText}`);
      if (!isPlaying) startMusic();
    });
  });

  // User Custom MP3 File
  const fileInput = document.getElementById("user-audio-file");
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        stopMusic();
        const objectUrl = URL.createObjectURL(file);
        if (!userAudioElement) {
          userAudioElement = new Audio();
          userAudioElement.loop = true;
        }
        userAudioElement.src = objectUrl;

        // Connect user audio to analyser
        const ctx = initAudioSystem();
        const source = ctx.createMediaElementSource(userAudioElement);
        source.connect(bassBoostNode);

        userAudioElement.play();
        isPlaying = true;

        if (trackTitleDisp) trackTitleDisp.textContent = `📁 СВОЙ ТРЕК: ${file.name.toUpperCase()}`;

        const playBtn = document.getElementById("music-play-btn");
        const waveIcon = document.getElementById("sound-wave-icon");
        const playIcon = document.getElementById("play-btn-icon");
        const playText = document.getElementById("play-btn-text");

        if (playBtn) playBtn.classList.add("playing");
        if (waveIcon) waveIcon.classList.add("playing");
        if (playIcon) playIcon.textContent = "⏹";
        if (playText) playText.textContent = "ИГРАЕТ СВОЙ ТРЕК";

        showToast(`Загружен ваш трек: ${file.name}`);
      }
    });
  }
}

// -------------------------------------------------------------
// 8. BACKGROUND VIDEO & CRT SCANLINES
// -------------------------------------------------------------
function initVideoControls() {
  const videoEl = document.getElementById("bg-video");
  const scanlinesEl = document.getElementById("scanlines-overlay");

  document.querySelectorAll(".v-btn[data-video]").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-video");
      if (VIDEO_PRESETS[key] && videoEl) {
        document.querySelectorAll(".v-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        videoEl.src = VIDEO_PRESETS[key];
        videoEl.play().catch(() => { });
        playClickSound();
        showToast(`Фоновое видео: ${btn.innerText}`);
      }
    });
  });

  const customBtn = document.getElementById("custom-video-btn");
  if (customBtn && videoEl) {
    customBtn.addEventListener("click", () => {
      const url = prompt("Введите прямую ссылку на видео MP4 / WebM:", "");
      if (url && url.trim()) {
        videoEl.src = url.trim();
        videoEl.play().catch(() => { });
        showToast("Установлено свое видео для фона!");
      }
    });
  }

  const toggleScanlinesBtn = document.getElementById("toggle-scanlines-btn");
  if (toggleScanlinesBtn && scanlinesEl) {
    toggleScanlinesBtn.addEventListener("click", () => {
      const active = toggleScanlinesBtn.classList.toggle("active");
      scanlinesEl.classList.toggle("disabled", !active);
      playClickSound();
      showToast(active ? "CRT Сетка включена" : "CRT Сетка выключена");
    });
  }

  const sfxToggleBtn = document.getElementById("sfx-toggle-btn");
  if (sfxToggleBtn) {
    sfxToggleBtn.addEventListener("click", () => {
      sfxEnabled = !sfxEnabled;
      sfxToggleBtn.classList.toggle("active", sfxEnabled);
      sfxToggleBtn.textContent = sfxEnabled ? "🔊 SFX ON" : "🔇 SFX OFF";
      showToast(sfxEnabled ? "Звуки интерфейса включены" : "Звуки выключены");
    });
  }
}

// -------------------------------------------------------------
// 9. PROFILE LOCALSTORAGE & EDIT MODAL
// -------------------------------------------------------------
function loadProfile() {
  try {
    const saved = localStorage.getItem("gena_samurai_profile");
    if (saved) return Object.assign({}, DEFAULT_PROFILE, JSON.parse(saved));
  } catch (e) { }
  return Object.assign({}, DEFAULT_PROFILE);
}

function saveProfile(p) {
  try {
    localStorage.setItem("gena_samurai_profile", JSON.stringify(p));
  } catch (e) { }
}

function initEditModal() {
  const modal = document.getElementById("edit-modal");
  const openBtn = document.getElementById("open-edit-modal-btn");
  const closeBtn = document.getElementById("edit-close-btn");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  const form = document.getElementById("edit-profile-form");
  const resetBtn = document.getElementById("reset-defaults-btn");

  let p = loadProfile();

  function open() {
    p = loadProfile();
    document.getElementById("input-fullname").value = p.fullname;
    document.getElementById("input-static-id").value = p.staticId;
    document.getElementById("input-server").value = p.server;
    document.getElementById("input-faction").value = p.faction;
    document.getElementById("input-cash").value = p.cash;
    document.getElementById("input-bank").value = p.bank;
    document.getElementById("input-quote").value = p.quote;
    document.getElementById("input-discord").value = p.discord;
    document.getElementById("input-telegram").value = p.telegram;

    modal.classList.add("open");
    playClickSound();
  }

  function close() {
    modal.classList.remove("open");
  }

  if (openBtn) openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  if (cancelBtn) cancelBtn.addEventListener("click", close);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      p.fullname = document.getElementById("input-fullname").value.trim();
      p.staticId = document.getElementById("input-static-id").value.trim();
      p.server = document.getElementById("input-server").value.trim();
      p.faction = document.getElementById("input-faction").value.trim();
      p.cash = document.getElementById("input-cash").value.trim();
      p.bank = document.getElementById("input-bank").value.trim();
      p.quote = document.getElementById("input-quote").value.trim();
      p.discord = document.getElementById("input-discord").value.trim();
      p.telegram = document.getElementById("input-telegram").value.trim();

      saveProfile(p);
      applyProfileUI(p);
      close();
      playClickSound();
      showToast("💾 Данные Gena Samurai успешно сохранены!");
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Сбросить настройки к стандартным?")) {
        p = Object.assign({}, DEFAULT_PROFILE);
        saveProfile(p);
        applyProfileUI(p);
        close();
        showToast("Настройки сброшены.");
      }
    });
  }
}

function applyProfileUI(p) {
  const hudCash = document.getElementById("hud-cash");
  const hudBank = document.getElementById("hud-bank");
  const hudServerTitle = document.getElementById("hud-server-title");
  const staticChip = document.getElementById("disp-static-chip");
  const socDiscord = document.getElementById("soc-discord-val");
  const socTg = document.getElementById("soc-telegram-val");
  const copyBtn = document.getElementById("copy-discord-btn");

  if (hudCash) hudCash.textContent = p.cash;
  if (hudBank) hudBank.textContent = p.bank;
  if (hudServerTitle) hudServerTitle.textContent = `MAJESTIC ${p.server}`;
  if (staticChip) staticChip.textContent = p.staticId;
  if (socDiscord) socDiscord.textContent = p.discord;
  if (socTg) socTg.textContent = p.telegram;
  if (copyBtn) copyBtn.setAttribute("data-clipboard", p.discord);
}

// -------------------------------------------------------------
// 10. TOAST NOTIFICATION & CLIPBOARD
// -------------------------------------------------------------
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

function initClipboard() {
  const btn = document.getElementById("copy-discord-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-clipboard") || "ktoto342245";
      navigator.clipboard.writeText(val).then(() => {
        playClickSound();
        showToast(`Discord скопирован: ${val}`);
      }).catch(() => {
        showToast(`Discord: ${val}`);
      });
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
  updateSpeakerUI(true);
  updateButtonsUI(true);

  // Попытка прямого автозапуска
  startMusic();

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
        // Удаляем слушатели после успешного запуска
        ['mousemove', 'pointermove', 'wheel', 'keydown', 'touchstart'].forEach(evt => {
          window.removeEventListener(evt, unlockAudio);
        });
      }).catch(() => { });
    }
  };

  // Музыка стартует при первом движении мыши над сайтом или скролле:
  window.addEventListener("mousemove", unlockAudio, { once: true, passive: true });
  window.addEventListener("pointermove", unlockAudio, { once: true, passive: true });
  window.addEventListener("wheel", unlockAudio, { once: true, passive: true });
  window.addEventListener("keydown", unlockAudio, { once: true, passive: true });
  window.addEventListener("touchstart", unlockAudio, { once: true, passive: true });
}

// -------------------------------------------------------------
// 11. BOOTSTRAP INITIALIZATION
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const profile = loadProfile();
  applyProfileUI(profile);

  initParticles();
  initVisualizer();
  init3DTilt();
  initWantedStars();
  initTrackControls();
  initVideoControls();
  initEditModal();
  initClipboard();
  initFloatingSpeaker();
  initAutoplay();

  // Subtle hover sound on interactive elements
  document.querySelectorAll("button, a, .rank-item, .contact-item").forEach(el => {
    el.addEventListener("mouseenter", playClickSound);
  });
});
