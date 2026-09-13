(function () {
  'use strict';

  // Universal Storage & Application Configuration
  const STORAGE_KEY = 'spelling_bee_save_v2';
  const CSV_PATH = './puzzles.csv';
  
  // PLACEHOLDER: Replace '#home' with supplied main-page destination URL when provided
  const HOME_URL = 'https://tileworksgamesstudio.github.io/86/';

  const RANKS = [
    { name: 'Beginner', pct: 0 },
    { name: 'Good Start', pct: 0.03 },
    { name: 'Moving Up', pct: 0.08 },
    { name: 'Good', pct: 0.16 },
    { name: 'Solid', pct: 0.26 },
    { name: 'Nice', pct: 0.40 },
    { name: 'Great', pct: 0.55 },
    { name: 'Amazing', pct: 0.70 },
    { name: 'Genius', pct: 0.85 },
    { name: 'Queen Bee', pct: 1.00 }
  ];

  // Built-in fallback puzzle dataset (Guarantees zero crashes even without server or CSV)
  const FALLBACK_PUZZLES = [
    {
      date: '2024-05-15',
      centerLetter: 'T',
      outerLetters: ['A', 'C', 'E', 'L', 'O', 'P'],
      words: ['ATOP', 'CATTLE', 'CLATTER', 'COAT', 'COLT', 'COMPACT', 'LOCATE', 'OCTAVE', 'PELT', 'PLATE', 'PLEAT', 'PLOT', 'POLITE', 'PULLPOT', 'TACT', 'TEAPOT', 'TOLL', 'TOTAL', 'TOTE'],
      pangrams: ['COMPACT', 'LOCATE']
    },
    {
      date: '2024-05-14',
      centerLetter: 'G',
      outerLetters: ['A', 'D', 'I', 'N', 'R', 'T'],
      words: ['AGING', 'DARTING', 'DATING', 'DRAG', 'DRAINING', 'GAIN', 'GANG', 'GIANT', 'GLAD', 'GRAD', 'GRAIN', 'GRANT', 'GRATING', 'GRID', 'GRIN', 'IGNITE', 'RATING', 'TRADING'],
      pangrams: ['DARTING', 'TRADING']
    },
    {
      date: '2024-05-13',
      centerLetter: 'H',
      outerLetters: ['A', 'C', 'K', 'M', 'N', 'T'],
      words: ['CATHARTIC', 'CHAMP', 'CHANT', 'CHAT', 'HACK', 'HATCH', 'MATCH', 'THANK'],
      pangrams: ['CHANT']
    }
  ];

  /* ==========================================================================
     PRESENTATIONAL ENHANCEMENT 1: WEB AUDIO COCKTAIL SOUND SYNTHESIS
     Safe, lightweight, fails silently, gesture-activated, zero dependencies.
     ========================================================================== */
  class LoungeAudio {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.initOnGesture();
    }

    initOnGesture() {
      const unlock = () => {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            this.ctx = new AudioContext();
          }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }

    playGlassTap(freq = 580, duration = 0.08) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(0.045, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Safe silent fail
      }
    }

    playSuccessChime(isPangram = false) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      try {
        const notes = isPangram ? [523.25, 659.25, 783.99, 1046.50] : [587.33, 880.0];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const startTime = this.ctx.currentTime + idx * 0.09;
          const duration = isPangram ? 0.45 : 0.28;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.05, startTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + duration);
        });
      } catch (e) {
        // Safe silent fail
      }
    }

    playMutedTone() {
      if (!this.ctx || this.ctx.state !== 'running') return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
      } catch (e) {
        // Safe silent fail
      }
    }
  }

  /* ==========================================================================
     PRESENTATIONAL ENHANCEMENT 2: 12 COCKTAIL GARNISH BACKGROUND SYSTEM
     Lightweight vector silhouettes drifting gracefully through amber ambiance.
     ========================================================================== */
  const GARNISH_SVGS = [
    // 1. Orange twist
    `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M10 30 C 14 12, 28 10, 24 24 C 20 34, 34 26, 32 12"/></svg>`,
    // 2. Lemon twist
    `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 22 C 16 6, 26 12, 22 28 C 18 38, 32 30, 34 16"/></svg>`,
    // 3. Lime wheel
    `<svg viewBox="0 0 40 40" stroke="currentColor" fill="none" stroke-width="1.8"><circle cx="20" cy="20" r="16"/><circle cx="20" cy="20" r="13" stroke-dasharray="2 3"/><path d="M20 7 v26 M7 20 h26 M11 11 l18 18 M29 11 l-18 18"/></svg>`,
    // 4. Lemon wheel
    `<svg viewBox="0 0 40 40" stroke="currentColor" fill="none" stroke-width="1.8"><circle cx="20" cy="20" r="16.5"/><circle cx="20" cy="20" r="12"/><path d="M20 8 v24 M8 20 h24 M11.5 11.5 l17 17 M28.5 11.5 l-17 17"/></svg>`,
    // 5. Dehydrated orange wheel
    `<svg viewBox="0 0 40 40" stroke="currentColor" fill="none" stroke-width="1.6"><circle cx="20" cy="20" r="17" stroke-width="2.2"/><circle cx="20" cy="20" r="13.5"/><circle cx="20" cy="20" r="3" fill="currentColor"/><path d="M20 7 v6 M20 27 v6 M7 20 h6 M27 20 h6 M10.8 10.8 l4.2 4.2 M25 25 l4.2 4.2 M29.2 10.8 l-4.2 4.2 M15 25 l-4.2 4.2"/></svg>`,
    // 6. Dehydrated lemon wheel
    `<svg viewBox="0 0 40 40" stroke="currentColor" fill="none" stroke-width="1.6"><circle cx="20" cy="20" r="16.5" stroke-dasharray="3 1.5"/><circle cx="20" cy="20" r="11.5"/><path d="M20 9 v22 M9 20 h22 M12 12 l16 16 M28 12 l-16 16"/></svg>`,
    // 7. Cocktail cherry
    `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2"><circle cx="16" cy="26" r="9" fill="currentColor" fill-opacity="0.25"/><path d="M17 17 C 19 8, 28 6, 32 4" stroke-linecap="round"/><path d="M30 5 C 32 7, 33 11, 29 11"/></svg>`,
    // 8. Maraschino cherry pair
    `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="13" cy="27" r="7.5" fill="currentColor" fill-opacity="0.25"/><circle cx="27" cy="25" r="7.5" fill="currentColor" fill-opacity="0.25"/><path d="M14 20 C 17 10, 21 6, 21 4 C 22 8, 25 12, 27 18" stroke-linecap="round"/></svg>`,
    // 9. Mint sprig
    `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 34 V10" stroke-linecap="round"/><path d="M20 26 C 14 24, 12 16, 20 18 C 28 16, 26 24, 20 26" fill="currentColor" fill-opacity="0.2"/><path d="M20 18 C 12 16, 12 8, 20 10 C 28 8, 28 16, 20 18" fill="currentColor" fill-opacity="0.2"/><path d="M20 10 C 16 4, 24 4, 20 10"/></svg>`,
    // 10. Rosemary sprig
    `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M20 36 V4"/><path d="M20 30 L11 26 M20 27 L29 23 M20 22 L12 18 M20 19 L28 15 M20 14 L13 10 M20 11 L27 7 M20 6 L15 3 M20 5 L25 3"/></svg>`,
    // 11. Green olive on pick
    `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="6" y1="34" x2="34" y2="6" stroke-linecap="round"/><ellipse cx="20" cy="20" rx="9" ry="12" transform="rotate(-45 20 20)" fill="currentColor" fill-opacity="0.25"/><circle cx="20" cy="20" r="3.5" fill="currentColor"/></svg>`,
    // 12. Cucumber ribbon
    `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 12 C 16 8, 14 26, 24 22 C 30 20, 31 32, 34 30" /><path d="M8 17 C 16 13, 14 31, 24 27 C 30 25, 31 37, 34 35" opacity="0.6"/></svg>`
  ];

  class GarnishAtmosphere {
    constructor(container) {
      this.container = container;
      this.activeGarnishes = new Set();
      this.maxGarnishes = 14;
      this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!this.prefersReduced && this.container) {
        this.start();
      }
    }

    start() {
      // Seed initial garnishes staggered
      const initialCount = Math.min(6, this.maxGarnishes);
      for (let i = 0; i < initialCount; i++) {
        setTimeout(() => this.spawn(), i * 1400);
      }
      this.loopTimer = setInterval(() => {
        if (this.activeGarnishes.size < this.maxGarnishes) {
          this.spawn();
        }
      }, 3600);
    }

    spawn() {
      if (!this.container) return;

      const garnish = document.createElement('div');
      garnish.className = 'garnish-item';

      const iconIdx = Math.floor(Math.random() * GARNISH_SVGS.length);
      garnish.innerHTML = GARNISH_SVGS[iconIdx];

      // Depth layers: Distant, Middle, Near
      const depthRoll = Math.random();
      let depthClass = 'garnish-depth-distant';
      let size = 28;
      let duration = 28;
      let targetOpacity = 0.25;

      if (depthRoll > 0.65) {
        depthClass = 'garnish-depth-near';
        size = 46 + Math.floor(Math.random() * 12);
        duration = 18 + Math.floor(Math.random() * 8);
        targetOpacity = 0.48;
      } else if (depthRoll > 0.3) {
        depthClass = 'garnish-depth-middle';
        size = 36 + Math.floor(Math.random() * 10);
        duration = 22 + Math.floor(Math.random() * 8);
        targetOpacity = 0.34;
      } else {
        size = 24 + Math.floor(Math.random() * 8);
        duration = 28 + Math.floor(Math.random() * 10);
        targetOpacity = 0.2;
      }

      garnish.classList.add(depthClass);

      const leftPct = Math.random() * 92;
      const driftX = (Math.random() - 0.5) * 80;
      const startRot = Math.floor(Math.random() * 360);
      const endRot = startRot + (Math.random() > 0.5 ? 90 : -90) + (Math.random() - 0.5) * 45;

      garnish.style.width = `${size}px`;
      garnish.style.height = `${size}px`;
      garnish.style.left = `${leftPct}%`;
      garnish.style.setProperty('--drift-x', `${driftX}px`);
      garnish.style.setProperty('--start-rot', `${startRot}deg`);
      garnish.style.setProperty('--end-rot', `${endRot}deg`);
      garnish.style.setProperty('--target-opacity', targetOpacity);
      garnish.style.animation = `floatGarnish ${duration}s cubic-bezier(0.35, 0, 0.25, 1) forwards`;

      this.container.appendChild(garnish);
      this.activeGarnishes.add(garnish);

      garnish.addEventListener('animationend', () => {
        if (garnish.parentNode) {
          garnish.parentNode.removeChild(garnish);
        }
        this.activeGarnishes.delete(garnish);
      });
    }
  }

  /* ==========================================================================
     CORE APPLICATION CLASS
     ========================================================================== */
  class SpellingBeeApp {
    constructor() {
      this.puzzles = [];
      this.dailyPuzzle = null;
      this.activePuzzle = null;
      this.outerLetters = [];
      this.inputWord = '';
      this.foundWords = [];
      this.score = 0;
      this.maxScore = 0;
      this.currentView = 'menu'; // 'menu' | 'game' | 'vault'
      this.previousView = 'menu';

      this.audio = new LoungeAudio();
      this.storage = this.loadSafeStorage();
      this.cacheDom();
      this.bindEvents();
      this.initAtmosphere();
      this.init();
    }

    initAtmosphere() {
      const container = document.getElementById('garnishContainer');
      if (container) {
        new GarnishAtmosphere(container);
      }
    }

    cacheDom() {
      this.dom = {
        // Views
        menuView: document.getElementById('menuView'),
        gameView: document.getElementById('gameView'),
        vaultView: document.getElementById('vaultView'),

        // Main Menu Elements
        menuDailyDate: document.getElementById('menuDailyDate'),
        menuDailyStatus: document.getElementById('menuDailyStatus'),
        menuDailyProgressFill: document.getElementById('menuDailyProgressFill'),
        btnPlayDaily: document.getElementById('btnPlayDaily'),
        cardDaily: document.getElementById('cardDaily'),
        btnOpenVault: document.getElementById('btnOpenVault'),
        cardVault: document.getElementById('cardVault'),
        menuVaultCount: document.getElementById('menuVaultCount'),
        linkHome: document.getElementById('linkHome'),
        btnMenuRules: document.getElementById('btnMenuRules'),
        btnMenuStats: document.getElementById('btnMenuStats'),

        // Gameplay Elements
        btnGameBack: document.getElementById('btnGameBack'),
        gamePuzzleTitle: document.getElementById('gamePuzzleTitle'),
        btnGameRules: document.getElementById('btnGameRules'),
        btnGameStats: document.getElementById('btnGameStats'),
        rankName: document.getElementById('rankName'),
        currentScore: document.getElementById('currentScore'),
        maxScore: document.getElementById('maxScore'),
        rankFill: document.getElementById('rankFill'),
        feedback: document.getElementById('feedback'),
        inputDisplay: document.getElementById('inputDisplay'),
        cellCenter: document.getElementById('cellCenter'),
        outerCells: [
          document.getElementById('cell-0'),
          document.getElementById('cell-1'),
          document.getElementById('cell-2'),
          document.getElementById('cell-3'),
          document.getElementById('cell-4'),
          document.getElementById('cell-5')
        ],
        btnDelete: document.getElementById('btnDelete'),
        btnShuffle: document.getElementById('btnShuffle'),
        btnEnter: document.getElementById('btnEnter'),
        foundToggle: document.getElementById('foundToggle'),
        foundToggleIcon: document.getElementById('foundToggleIcon'),
        foundListWrap: document.getElementById('foundListWrap'),
        foundList: document.getElementById('foundList'),
        foundCount: document.getElementById('foundCount'),

        // Vault Elements
        btnVaultBack: document.getElementById('btnVaultBack'),
        vaultHeaderCount: document.getElementById('vaultHeaderCount'),
        vaultGrid: document.getElementById('vaultGrid'),

        // Modals
        modalRules: document.getElementById('modalRules'),
        modalStats: document.getElementById('modalStats'),
        statPlayed: document.getElementById('statPlayed'),
        statWords: document.getElementById('statWords'),
        statPangrams: document.getElementById('statPangrams'),
        statPoints: document.getElementById('statPoints'),
        statCurrentStreak: document.getElementById('statCurrentStreak'),
        statMaxStreak: document.getElementById('statMaxStreak')
      };
    }

    bindEvents() {
      // Navigation: Main Menu Card Actions
      this.dom.btnPlayDaily.addEventListener('click', () => {
        this.audio.playGlassTap(640);
        if (this.dailyPuzzle) {
          this.loadPuzzle(this.dailyPuzzle);
          this.switchView('game');
        }
      });

      this.dom.btnOpenVault.addEventListener('click', () => {
        this.audio.playGlassTap(580);
        this.renderVault();
        this.switchView('vault');
      });

      // Navigation: Home Action
      this.dom.linkHome.setAttribute('href', HOME_URL);

      // Back Buttons
      this.dom.btnGameBack.addEventListener('click', () => {
        this.audio.playGlassTap(520);
        this.switchView(this.previousView === 'vault' ? 'vault' : 'menu');
      });

      this.dom.btnVaultBack.addEventListener('click', () => {
        this.audio.playGlassTap(520);
        this.switchView('menu');
      });

      // Modals
      this.dom.btnMenuRules.addEventListener('click', () => {
        this.audio.playGlassTap(600);
        this.openModal(this.dom.modalRules);
      });
      this.dom.btnGameRules.addEventListener('click', () => {
        this.audio.playGlassTap(600);
        this.openModal(this.dom.modalRules);
      });
      this.dom.btnMenuStats.addEventListener('click', () => {
        this.audio.playGlassTap(600);
        this.renderStats();
        this.openModal(this.dom.modalStats);
      });
      this.dom.btnGameStats.addEventListener('click', () => {
        this.audio.playGlassTap(600);
        this.renderStats();
        this.openModal(this.dom.modalStats);
      });

      document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.audio.playGlassTap(480);
          const id = btn.getAttribute('data-close');
          const target = document.getElementById(id);
          if (target) this.closeModal(target);
        });
      });

      window.addEventListener('click', e => {
        if (e.target.classList.contains('modal-backdrop')) {
          this.closeModal(e.target);
        }
      });

      // Found Words Accordion
      this.dom.foundToggle.addEventListener('click', () => {
        this.audio.playGlassTap(680);
        const isHidden = this.dom.foundListWrap.hidden;
        this.dom.foundListWrap.hidden = !isHidden;
        this.dom.foundToggle.setAttribute('aria-expanded', String(isHidden));
        this.dom.foundToggleIcon.textContent = isHidden ? '▲' : '▼';
      });

      // Hive Clicks
      this.dom.cellCenter.addEventListener('click', () => {
        if (this.activePuzzle) {
          this.audio.playGlassTap(740);
          this.addLetter(this.activePuzzle.centerLetter);
        }
      });

      this.dom.outerCells.forEach(cell => {
        cell.addEventListener('click', () => {
          const letter = cell.getAttribute('data-letter');
          if (letter) {
            this.audio.playGlassTap(620);
            this.addLetter(letter);
          }
        });
      });

      // Controls
      this.dom.btnDelete.addEventListener('click', () => {
        this.audio.playGlassTap(460);
        this.deleteLetter();
      });
      this.dom.btnShuffle.addEventListener('click', () => {
        this.audio.playGlassTap(660);
        this.shuffleLetters();
      });
      this.dom.btnEnter.addEventListener('click', () => {
        this.submitWord();
      });

      // Keyboard Controls
      window.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          this.closeModal(this.dom.modalRules);
          this.closeModal(this.dom.modalStats);
          return;
        }

        if (this.currentView !== 'game' || !this.activePuzzle) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        const key = e.key.toUpperCase();
        if (/^[A-Z]$/.test(key)) {
          e.preventDefault();
          this.audio.playGlassTap(620);
          this.addLetter(key);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          this.audio.playGlassTap(460);
          this.deleteLetter();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.submitWord();
        } else if (e.key === ' ' || e.key === '/') {
          e.preventDefault();
          this.audio.playGlassTap(660);
          this.shuffleLetters();
        }
      });
    }

    async init() {
      try {
        const res = await fetch(CSV_PATH);
        if (!res.ok) throw new Error('Network response not ok');
        const text = await res.text();
        const parsed = this.parseCSV(text);
        this.puzzles = parsed.length > 0 ? parsed : FALLBACK_PUZZLES;
      } catch (err) {
        // Safe graceful fallback
        this.puzzles = FALLBACK_PUZZLES;
      }

      this.determineDailyPuzzle();
      this.updateMenuDashboard();
    }

    determineDailyPuzzle() {
      const today = new Date().toISOString().slice(0, 10);
      let match = this.puzzles.find(p => p.date === today);

      if (!match) {
        const past = this.puzzles.filter(p => p.date <= today);
        match = past.length > 0 ? past[past.length - 1] : this.puzzles[0];
      }
      this.dailyPuzzle = match;
    }

    updateMenuDashboard() {
      if (!this.dailyPuzzle) return;

      this.dom.menuDailyDate.textContent = this.formatDate(this.dailyPuzzle.date);
      const progress = this.storage.puzzles[this.dailyPuzzle.date] || { foundWords: [] };
      const max = this.calculateMaxScore(this.dailyPuzzle);
      const score = this.calculateWordsScore(progress.foundWords, this.dailyPuzzle);
      const pct = max > 0 ? Math.min(100, Math.round((score / max) * 100)) : 0;

      const rank = this.getRank(score, max);
      this.dom.menuDailyStatus.textContent = `${rank.name} • ${progress.foundWords.length} words found (${score} pts)`;
      this.dom.menuDailyProgressFill.style.width = `${pct}%`;

      const vaultCount = Math.max(0, this.puzzles.length - 1);
      this.dom.menuVaultCount.textContent = `${vaultCount} past vintage${vaultCount === 1 ? '' : 's'}`;
    }

    switchView(targetView) {
      this.previousView = this.currentView;
      this.currentView = targetView;

      this.dom.menuView.hidden = targetView !== 'menu';
      this.dom.gameView.hidden = targetView !== 'game';
      this.dom.vaultView.hidden = targetView !== 'vault';

      if (targetView === 'menu') {
        this.updateMenuDashboard();
      }
      window.scrollTo(0, 0);
    }

    parseCSV(text) {
      const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) return [];

      const puzzles = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length < 4) continue;

        const date = parts[0].trim();
        const centerLetter = parts[1].trim().toUpperCase();
        const outerLetters = parts[2].trim().toUpperCase().replace(/[^A-Z]/g, '').split('');
        const words = parts.slice(3).join(',').replace(/["\r]/g, '').trim().toUpperCase().split(/\s+/).filter(Boolean);

        puzzles.push({
          date,
          centerLetter,
          outerLetters,
          words,
          pangrams: words.filter(w => {
            const unique = new Set(w.split(''));
            return unique.size >= 7 && [centerLetter, ...outerLetters].every(c => unique.has(c));
          })
        });
      }
      return puzzles;
    }

    loadPuzzle(puzzle) {
      this.activePuzzle = puzzle;
      this.outerLetters = [...puzzle.outerLetters];
      this.inputWord = '';

      const progress = this.storage.puzzles[puzzle.date] || { foundWords: [] };
      this.foundWords = [...progress.foundWords];
      this.maxScore = this.calculateMaxScore(puzzle);
      this.score = this.calculateWordsScore(this.foundWords, puzzle);

      // Dedicated Header: Puzzle Title
      const isDaily = this.dailyPuzzle && this.dailyPuzzle.date === puzzle.date;
      this.dom.gamePuzzleTitle.textContent = isDaily 
        ? `Daily Honeycomb • ${this.formatDate(puzzle.date)}`
        : `Vault Honeycomb • ${this.formatDate(puzzle.date)}`;

      this.renderHive();
      this.renderInput();
      this.renderRank();
      this.renderFoundList();
    }

    calculateWordScore(word, puzzle) {
      const isPangram = puzzle.pangrams.includes(word);
      const base = word.length === 4 ? 1 : word.length;
      return base + (isPangram ? 7 : 0);
    }

    calculateMaxScore(puzzle) {
      return puzzle.words.reduce((sum, w) => sum + this.calculateWordScore(w, puzzle), 0);
    }

    calculateWordsScore(words, puzzle) {
      return words.reduce((sum, w) => sum + this.calculateWordScore(w, puzzle), 0);
    }

    renderHive() {
      // Center letter
      const centerLetterSpan = this.dom.cellCenter.querySelector('.hex-letter');
      centerLetterSpan.textContent = this.activePuzzle.centerLetter;
      this.dom.cellCenter.setAttribute('data-letter', this.activePuzzle.centerLetter);
      this.dom.cellCenter.setAttribute('aria-label', `Center letter ${this.activePuzzle.centerLetter}`);

      // Outer letters
      this.dom.outerCells.forEach((cell, idx) => {
        const letter = this.outerLetters[idx] || '';
        const span = cell.querySelector('.hex-letter');
        span.textContent = letter;
        cell.setAttribute('data-letter', letter);
        cell.setAttribute('aria-label', `Letter ${letter}`);
      });
    }

    renderInput() {
      this.dom.inputDisplay.innerHTML = '';
      for (const ch of this.inputWord) {
        const span = document.createElement('span');
        span.textContent = ch;
        if (ch === this.activePuzzle.centerLetter) span.classList.add('center-ch');
        this.dom.inputDisplay.appendChild(span);
      }
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      cursor.setAttribute('aria-hidden', 'true');
      this.dom.inputDisplay.appendChild(cursor);
    }

    addLetter(letter) {
      const valid = [this.activePuzzle.centerLetter, ...this.activePuzzle.outerLetters];
      if (!valid.includes(letter)) {
        this.audio.playMutedTone();
        this.showFeedback('Bad letter', 'error');
        return;
      }
      if (this.inputWord.length >= 18) return;
      this.inputWord += letter;
      this.renderInput();
    }

    deleteLetter() {
      if (!this.inputWord) return;
      this.inputWord = this.inputWord.slice(0, -1);
      this.renderInput();
    }

    shuffleLetters() {
      for (let i = this.outerLetters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.outerLetters[i], this.outerLetters[j]] = [this.outerLetters[j], this.outerLetters[i]];
      }
      this.renderHive();
    }

    submitWord() {
      const word = this.inputWord.trim().toUpperCase();
      if (!word) return;

      if (word.length < 4) {
        this.audio.playMutedTone();
        this.showFeedback('Too short (min 4)', 'error');
        return;
      }
      if (!word.includes(this.activePuzzle.centerLetter)) {
        this.audio.playMutedTone();
        this.showFeedback('Missing center letter', 'error');
        return;
      }
      if (this.foundWords.includes(word)) {
        this.audio.playMutedTone();
        this.showFeedback('Already found', 'error');
        return;
      }
      if (!this.activePuzzle.words.includes(word)) {
        this.audio.playMutedTone();
        this.showFeedback('Not in word list', 'error');
        return;
      }

      const points = this.calculateWordScore(word, this.activePuzzle);
      const isPangram = this.activePuzzle.pangrams.includes(word);

      this.foundWords.push(word);
      this.score += points;
      this.inputWord = '';

      this.saveProgress();
      this.updateStats(points, isPangram);

      this.audio.playSuccessChime(isPangram);

      const msg = isPangram ? `Pangram! +${points}` : `+${points}`;
      this.showFeedback(msg, isPangram ? 'pangram' : 'success');

      this.renderInput();
      this.renderRank();
      this.renderFoundList();
    }

    getRank(score, maxScore) {
      const pct = maxScore > 0 ? score / maxScore : 0;
      let currentRank = RANKS[0];
      for (let i = RANKS.length - 1; i >= 0; i--) {
        if (pct >= RANKS[i].pct) {
          currentRank = RANKS[i];
          break;
        }
      }
      return currentRank;
    }

    renderRank() {
      const rank = this.getRank(this.score, this.maxScore);
      const pct = this.maxScore > 0 ? Math.min(100, Math.round((this.score / this.maxScore) * 100)) : 0;

      this.dom.rankName.textContent = rank.name;
      this.dom.currentScore.textContent = this.score;
      this.dom.maxScore.textContent = this.maxScore;
      this.dom.rankFill.style.width = `${pct}%`;
    }

    renderFoundList() {
      this.dom.foundCount.textContent = this.foundWords.length;
      this.dom.foundList.innerHTML = '';

      if (this.foundWords.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-found-msg';
        empty.textContent = 'No words found yet.';
        this.dom.foundList.appendChild(empty);
        return;
      }

      const sorted = [...this.foundWords].sort();
      sorted.forEach(w => {
        const item = document.createElement('span');
        item.className = 'found-item';
        if (this.activePuzzle.pangrams.includes(w)) {
          item.classList.add('is-pangram');
          item.setAttribute('title', 'Pangram');
        }
        item.textContent = w;
        this.dom.foundList.appendChild(item);
      });
    }

    showFeedback(message, type) {
      if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
      this.dom.feedback.textContent = message;
      this.dom.feedback.className = `feedback ${type}`;
      this.feedbackTimer = setTimeout(() => {
        this.dom.feedback.textContent = '';
        this.dom.feedback.className = 'feedback';
      }, 1700);
    }

    renderVault() {
      this.dom.vaultGrid.innerHTML = '';
      
      const vaultPuzzles = this.puzzles
        .filter(p => !this.dailyPuzzle || p.date !== this.dailyPuzzle.date)
        .sort((a, b) => b.date.localeCompare(a.date));

      this.dom.vaultHeaderCount.textContent = vaultPuzzles.length;

      if (vaultPuzzles.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-found-msg';
        empty.textContent = 'No historical puzzles archived yet.';
        this.dom.vaultGrid.appendChild(empty);
        return;
      }

      vaultPuzzles.forEach(puzzle => {
        const card = document.createElement('div');
        card.className = 'vault-card';
        card.setAttribute('role', 'article');

        const prog = this.storage.puzzles[puzzle.date] || { foundWords: [] };
        const max = this.calculateMaxScore(puzzle);
        const score = this.calculateWordsScore(prog.foundWords, puzzle);
        const rank = this.getRank(score, max);

        card.innerHTML = `
          <div class="vault-card-info">
            <span class="vault-date">${this.formatDate(puzzle.date)}</span>
            <span class="vault-letters">
              <span class="center-ltr">${puzzle.centerLetter}</span> ${puzzle.outerLetters.join(' ')}
            </span>
          </div>
          <div class="vault-card-right">
            <span class="vault-progress-tag ${rank.pct >= 0.85 ? 'completed' : ''}">
              ${prog.foundWords.length}/${puzzle.words.length} • ${rank.name}
            </span>
          </div>
        `;

        card.addEventListener('click', () => {
          this.audio.playGlassTap(600);
          this.loadPuzzle(puzzle);
          this.switchView('game');
        });

        this.dom.vaultGrid.appendChild(card);
      });
    }

    renderStats() {
      const s = this.storage.stats;
      this.dom.statPlayed.textContent = s.played;
      this.dom.statWords.textContent = s.words;
      this.dom.statPangrams.textContent = s.pangrams;
      this.dom.statPoints.textContent = s.points;
      this.dom.statCurrentStreak.textContent = s.currentStreak;
      this.dom.statMaxStreak.textContent = s.maxStreak;
    }

    openModal(modal) {
      if (modal) modal.hidden = false;
    }

    closeModal(modal) {
      if (modal) modal.hidden = true;
    }

    formatDate(dateStr) {
      if (!dateStr) return '';
      const [y, m, d] = dateStr.split('-');
      const date = new Date(Date.UTC(+y, +m - 1, +d));
      return date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
    }

    loadSafeStorage() {
      const fallback = {
        version: 2,
        stats: {
          played: 0,
          words: 0,
          pangrams: 0,
          points: 0,
          currentStreak: 0,
          maxStreak: 0,
          lastDate: null
        },
        puzzles: {}
      };

      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return {
          ...fallback,
          ...parsed,
          stats: { ...fallback.stats, ...(parsed.stats || {}) },
          puzzles: parsed.puzzles || {}
        };
      } catch (e) {
        return fallback;
      }
    }

    saveProgress() {
      if (!this.activePuzzle) return;
      this.storage.puzzles[this.activePuzzle.date] = {
        foundWords: this.foundWords,
        score: this.score
      };
      this.persist();
    }

    updateStats(pts, isPangram) {
      const stats = this.storage.stats;
      const today = new Date().toISOString().slice(0, 10);

      stats.words += 1;
      stats.points += pts;
      if (isPangram) stats.pangrams += 1;

      if (stats.lastDate !== today) {
        if (!stats.lastDate) {
          stats.currentStreak = 1;
        } else {
          const diff = Math.round((new Date(today) - new Date(stats.lastDate)) / 86400000);
          stats.currentStreak = diff === 1 ? stats.currentStreak + 1 : 1;
        }
        stats.lastDate = today;
        stats.played += 1;
        if (stats.currentStreak > stats.maxStreak) stats.maxStreak = stats.currentStreak;
      }
      this.persist();
    }

    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.storage));
      } catch (e) {
        // Safe handling of quota exceeded
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    new SpellingBeeApp();
  });
})();