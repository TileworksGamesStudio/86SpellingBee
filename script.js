/**
 * ============================================================================
 * COCKTAIL SPELLING BEE — GAME ENGINE & PLATFORM CONTROLLER
 * Architecture: Standalone Main Menu, Day 0 Anchor (8 Sep 2026),
 * Deterministic Scheduler, Garnish Background System, Web Audio Synthesizer,
 * Touch/Keyboard Input & LocalStorage State Management.
 * ============================================================================
 */

(function () {
  'use strict';

  // Master Platform Anchor: 8 September 2026 is Day 0
  const DAY_ZERO_UTC = Date.UTC(2026, 8, 8, 0, 0, 0); // Month 8 = September
  const STORAGE_KEY = '86_SPELLING_BEE_DATA_V1';

  // Bartender Rank Progression Ladder Tiers (Percentages of max available points)
  const RANK_TIERS = [
    { name: 'Barback', minPct: 0 },
    { name: 'Novice Pourer', minPct: 0.03 },
    { name: 'Line Bartender', minPct: 0.08 },
    { name: 'Mixologist', minPct: 0.16 },
    { name: 'Senior Mixologist', minPct: 0.26 },
    { name: 'Head Bartender', minPct: 0.40 },
    { name: 'Beverage Director', minPct: 0.55 },
    { name: 'Master Distiller', minPct: 0.70 },
    { name: 'Cocktail Legend', minPct: 0.85 }
  ];

  /* --------------------------------------------------------------------------
     1. SOUND ENGINE (Web Audio API Synthesizer)
     -------------------------------------------------------------------------- */
  class CocktailSoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTap() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    }

    playShuffle() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.07;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2400;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    }

    playSuccess(isPangram = false) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = isPangram ? [523.25, 659.25, 783.99, 1046.50] : [587.33, 880.00];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const startTime = this.ctx.currentTime + (idx * 0.07);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(isPangram ? 0.22 : 0.14, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.32);
      });
    }

    playError() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    }
  }

  /* --------------------------------------------------------------------------
     2. GARNISH BACKGROUND SYSTEM
     Manages animated botanical garnish line-art with menu vs game density.
     -------------------------------------------------------------------------- */
  class GarnishBackgroundEngine {
    constructor(container) {
      this.container = container;
      this.isGameActive = false;
      this.maxNodes = 4; // Menu: 2-5, Game: 1-2
      this.spawnTimer = null;
      this.icons = [
        // Citrus Wheel
        `<svg viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="21" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="1" fill="none" opacity="0.6"/><circle cx="24" cy="24" r="3" fill="currentColor"/><path d="M24 6 L24 21 M24 27 L24 42 M6 24 L21 24 M27 24 L42 24 M11 11 L22 22 M26 26 L37 37 M11 37 L22 26 M26 22 L37 11" stroke="currentColor" stroke-width="1.2"/></svg>`,
        // Orange Peel Spiral
        `<svg viewBox="0 0 48 48" width="48" height="48"><path d="M12 40 C 6 28, 14 14, 26 10 C 38 6, 42 18, 32 26 C 22 34, 18 42, 28 44 C 36 46, 42 36, 40 32" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M15 38 C 10 28, 16 17, 26 13 C 35 10, 39 19, 31 25" stroke="currentColor" stroke-width="0.9" fill="none" opacity="0.5"/></svg>`,
        // Mint Sprig
        `<svg viewBox="0 0 48 48" width="48" height="48"><path d="M24 44 C 24 28, 24 16, 24 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M24 30 C 14 26, 12 16, 24 20" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M24 22 C 34 18, 36 8, 24 12" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M24 14 C 18 10, 18 4, 24 4 C 30 4, 30 10, 24 14" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>`,
        // Cherry Pair
        `<svg viewBox="0 0 48 48" width="48" height="48"><circle cx="15" cy="34" r="8.5" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="33" cy="32" r="8" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M15 25.5 C 16 14, 21 8, 27 6 C 29 12, 32 18, 33 24" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M27 6 C 23 4, 20 6, 22 10 Z" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
        // Olive on Skewer
        `<svg viewBox="0 0 48 48" width="48" height="48"><line x1="6" y1="42" x2="42" y2="6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="24" cy="24" rx="8.5" ry="12.5" transform="rotate(45 24 24)" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="24" cy="24" r="3" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
        // Rosemary Sprig
        `<svg viewBox="0 0 48 48" width="48" height="48"><line x1="24" y1="44" x2="24" y2="4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M24 38 L14 32 M24 38 L34 32 M24 28 L12 21 M24 28 L36 21 M24 18 L14 11 M24 18 L34 11 M24 8 L18 3 M24 8 L30 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`
      ];
      this.start();
    }

    setGameMode(isGame) {
      this.isGameActive = isGame;
      this.maxNodes = isGame ? 2 : 4;
      // If entering game mode, prune excess nodes to focus on honeycomb
      if (isGame && this.container) {
        while (this.container.children.length > 2) {
          this.container.removeChild(this.container.firstChild);
        }
      }
    }

    start() {
      const scheduleNext = () => {
        const interval = this.isGameActive ? (Math.random() * 4000 + 4000) : (Math.random() * 2500 + 2000);
        this.spawnTimer = setTimeout(() => {
          this.spawn();
          scheduleNext();
        }, interval);
      };
      scheduleNext();
    }

    spawn() {
      if (!this.container) return;
      if (this.container.children.length >= this.maxNodes) return;

      const node = document.createElement('div');
      node.className = 'garnish-node';
      const iconHtml = this.icons[Math.floor(Math.random() * this.icons.length)];
      node.innerHTML = iconHtml;

      const startLeft = Math.random() * 84 + 8; // 8% to 92%
      const duration = Math.random() * 10 + 16; // 16s to 26s
      const driftX = (Math.random() * 50 - 25);
      const driftEnd = (Math.random() * 60 - 30);
      const rot = Math.random() * 180;
      const rotEnd = rot + (Math.random() * 180 + 90);

      node.style.left = `${startLeft}%`;
      node.style.setProperty('--drift-x', `${driftX}px`);
      node.style.setProperty('--drift-end', `${driftEnd}px`);
      node.style.setProperty('--rot', `${rot}deg`);
      node.style.setProperty('--rot-end', `${rotEnd}deg`);
      node.style.animationDuration = `${duration}s`;

      node.addEventListener('animationend', () => {
        if (node.parentNode) node.parentNode.removeChild(node);
      });

      this.container.appendChild(node);
    }
  }

  /* --------------------------------------------------------------------------
     3. LOCAL STORAGE & PERSISTENCE
     -------------------------------------------------------------------------- */
  class StorageManager {
    static getInitialData() {
      return {
        version: 1,
        soundEnabled: true,
        stats: {
          gamesPlayed: 0,
          wordsFoundTotal: 0,
          pangramsFoundTotal: 0,
          totalPoints: 0,
          currentStreak: 0,
          maxStreak: 0,
          lastPlayedDate: null
        },
        puzzleProgress: {}, // Keyed by puzzle ID
        releasedSchedule: {} // Preserves day-to-puzzle id mapping
      };
    }

    static load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return this.getInitialData();
        const parsed = JSON.parse(raw);
        if (!parsed.version || parsed.version < 1) return this.getInitialData();
        return Object.assign(this.getInitialData(), parsed);
      } catch (err) {
        console.warn('Storage read issue, initializing defaults:', err);
        return this.getInitialData();
      }
    }

    static save(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.warn('Storage write failed:', err);
      }
    }
  }

  /* --------------------------------------------------------------------------
     4. DETERMINISTIC DAILY SCHEDULER (Day 0 = 8 September 2026)
     -------------------------------------------------------------------------- */
  class DailyScheduler {
    static getDayIndex(date = new Date()) {
      const targetUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      const diffMs = targetUtc - DAY_ZERO_UTC;
      const dayNum = Math.floor(diffMs / 86400000);
      // Pre-launch days are safely clamped to Day 0
      return Math.max(0, dayNum);
    }

    static getPuzzleForDay(dayIndex, puzzles, savedSchedule = {}) {
      if (!puzzles || puzzles.length === 0) return null;
      // If historical schedule has this day locked, honor it
      if (savedSchedule[dayIndex]) {
        const found = puzzles.find(p => p.id === savedSchedule[dayIndex]);
        if (found) return found;
      }
      // Linear mapping if within bounds, otherwise stable wrap
      const index = dayIndex < puzzles.length ? dayIndex : (dayIndex % puzzles.length);
      return puzzles[index];
    }

    static getTodayPuzzle(puzzles, savedSchedule = {}) {
      const dayIndex = this.getDayIndex();
      const puzzle = this.getPuzzleForDay(dayIndex, puzzles, savedSchedule);
      return {
        puzzle,
        dayIndex,
        isToday: true
      };
    }

    static getReleasedVaultPuzzles(puzzles, savedSchedule = {}) {
      const todayIndex = this.getDayIndex();
      // On Day 0 (8 Sep 2026), Vault has exactly ZERO released puzzles.
      // Day 1 will have 1 puzzle (Day 0).
      if (todayIndex <= 0) return [];

      const vaultList = [];
      for (let d = todayIndex - 1; d >= 0; d--) {
        const puzzle = this.getPuzzleForDay(d, puzzles, savedSchedule);
        if (puzzle) {
          vaultList.push({
            puzzle,
            dayIndex: d,
            isToday: false
          });
        }
      }
      return vaultList;
    }
  }

  /* --------------------------------------------------------------------------
     5. MAIN COCKTAIL SPELLING BEE GAME APPLICATION
     -------------------------------------------------------------------------- */
  class CocktailBeeApp {
    constructor() {
      this.sound = new CocktailSoundEngine();
      this.state = StorageManager.load();
      this.sound.enabled = this.state.soundEnabled;

      this.currentPuzzle = null;
      this.currentDayIndex = 0;
      this.isCurrentPuzzleToday = true;

      this.activeInput = '';
      this.foundWords = [];
      this.score = 0;
      this.maxPossibleScore = 0;
      this.outerLettersShuffled = [];
      this.toastTimeout = null;

      this.initDom();
      this.garnishEngine = new GarnishBackgroundEngine(this.dom.garnishStage);
      this.initEventListeners();

      // Lock current release schedule in storage for absolute historical continuity
      this.lockReleaseSchedule();

      // Refresh Menu View initially
      this.renderMenuTodayCard();
      this.updateSoundDisplay();

      // Start midnight observer
      this.startMidnightObserver();
    }

    initDom() {
      this.dom = {
        garnishStage: document.getElementById('garnishStage'),
        mainMenuScreen: document.getElementById('mainMenuScreen'),
        gameplayScreen: document.getElementById('gameplayScreen'),

        // Main Menu
        menuTodayBadge: document.getElementById('menuTodayBadge'),
        menuDiffPill: document.getElementById('menuDiffPill'),
        menuThemeTitle: document.getElementById('menuThemeTitle'),
        menuCurriculumCategory: document.getElementById('menuCurriculumCategory'),
        menuStatusText: document.getElementById('menuStatusText'),
        menuStatusRank: document.getElementById('menuStatusRank'),
        playTodayBtn: document.getElementById('playTodayBtn'),
        playBtnText: document.getElementById('playBtnText'),
        openVaultMenuBtn: document.getElementById('openVaultMenuBtn'),
        vaultArchiveCountBadge: document.getElementById('vaultArchiveCountBadge'),
        menuSoundBtn: document.getElementById('menuSoundBtn'),
        menuSoundIcon: document.getElementById('menuSoundIcon'),
        menuSoundLabel: document.getElementById('menuSoundLabel'),
        menuHowToPlayBtn: document.getElementById('menuHowToPlayBtn'),
        menuStatsBtn: document.getElementById('menuStatsBtn'),

        // Gameplay Screen
        backToMenuBtn: document.getElementById('backToMenuBtn'),
        gameEditionBadge: document.getElementById('gameEditionBadge'),
        gameSoundBtn: document.getElementById('gameSoundBtn'),
        gameSoundIcon: document.getElementById('gameSoundIcon'),
        gameHowBtn: document.getElementById('gameHowBtn'),
        gameStatsBtn: document.getElementById('gameStatsBtn'),

        gameThemeTitle: document.getElementById('gameThemeTitle'),
        gameCategoryTitle: document.getElementById('gameCategoryTitle'),
        currentRankLabel: document.getElementById('currentRankLabel'),
        playerCurrentScore: document.getElementById('playerCurrentScore'),
        rankMaxScore: document.getElementById('rankMaxScore'),
        rankProgressBar: document.getElementById('rankProgressBar'),
        rankMarkers: document.getElementById('rankMarkers'),

        wordInputDisplay: document.getElementById('wordInputDisplay'),
        toastMessage: document.getElementById('toastMessage'),

        cellCenter: document.getElementById('cell-center'),
        outerCells: [
          document.getElementById('cell-0'),
          document.getElementById('cell-1'),
          document.getElementById('cell-2'),
          document.getElementById('cell-3'),
          document.getElementById('cell-4'),
          document.getElementById('cell-5')
        ],

        deleteBtn: document.getElementById('deleteBtn'),
        shuffleBtn: document.getElementById('shuffleBtn'),
        enterBtn: document.getElementById('enterBtn'),

        foundDrawer: document.getElementById('foundDrawer'),
        toggleDrawerBtn: document.getElementById('toggleDrawerBtn'),
        drawerContent: document.getElementById('drawerContent'),
        foundCount: document.getElementById('foundCount'),
        foundPreview: document.getElementById('foundPreview'),
        foundChipsGrid: document.getElementById('foundChipsGrid'),

        // Modals
        vaultModal: document.getElementById('vaultModal'),
        vaultListContainer: document.getElementById('vaultListContainer'),
        rulesModal: document.getElementById('rulesModal'),
        statsModal: document.getElementById('statsModal'),

        statPlayed: document.getElementById('statPlayed'),
        statWords: document.getElementById('statWords'),
        statPangrams: document.getElementById('statPangrams'),
        statPoints: document.getElementById('statPoints'),
        statCurrentStreak: document.getElementById('statCurrentStreak'),
        statMaxStreak: document.getElementById('statMaxStreak')
      };
    }

    initEventListeners() {
      // Menu Actions
      this.dom.playTodayBtn.addEventListener('click', () => {
        this.sound.playTap();
        this.startTodayGame();
      });

      this.dom.openVaultMenuBtn.addEventListener('click', () => {
        this.sound.playTap();
        this.renderVaultArchive();
        this.openModal(this.dom.vaultModal);
      });

      this.dom.menuSoundBtn.addEventListener('click', () => this.toggleSound());
      this.dom.gameSoundBtn.addEventListener('click', () => this.toggleSound());

      this.dom.menuHowToPlayBtn.addEventListener('click', () => this.openModal(this.dom.rulesModal));
      this.dom.gameHowBtn.addEventListener('click', () => this.openModal(this.dom.rulesModal));

      this.dom.menuStatsBtn.addEventListener('click', () => {
        this.refreshStats();
        this.openModal(this.dom.statsModal);
      });
      this.dom.gameStatsBtn.addEventListener('click', () => {
        this.refreshStats();
        this.openModal(this.dom.statsModal);
      });

      this.dom.backToMenuBtn.addEventListener('click', () => {
        this.sound.playTap();
        this.showScreen('menu');
      });

      // Modal Close Elements
      document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const targetId = btn.getAttribute('data-close');
          const modal = document.getElementById(targetId);
          if (modal) this.closeModal(modal);
        });
      });

      // Accordion Drawer
      this.dom.toggleDrawerBtn.addEventListener('click', () => {
        const isExpanded = this.dom.toggleDrawerBtn.getAttribute('aria-expanded') === 'true';
        this.dom.toggleDrawerBtn.setAttribute('aria-expanded', String(!isExpanded));
        this.dom.drawerContent.hidden = isExpanded;
        this.sound.playTap();
      });

      // Hive letter taps
      this.dom.cellCenter.addEventListener('click', () => {
        if (this.currentPuzzle) this.handleLetterInput(this.currentPuzzle.centerLetter);
      });
      this.dom.outerCells.forEach(cell => {
        cell.addEventListener('click', () => {
          const char = cell.getAttribute('data-letter');
          if (char) this.handleLetterInput(char);
        });
      });

      // Controls
      this.dom.deleteBtn.addEventListener('click', () => this.handleDelete());
      this.dom.shuffleBtn.addEventListener('click', () => this.handleShuffle());
      this.dom.enterBtn.addEventListener('click', () => this.handleWordSubmit());

      // Physical Keyboard Handlers
      window.addEventListener('keydown', (e) => {
        if (this.dom.gameplayScreen.hidden) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        const key = e.key.toUpperCase();
        if (/^[A-Z]$/.test(key)) {
          e.preventDefault();
          this.handleLetterInput(key);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          this.handleDelete();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.handleWordSubmit();
        } else if (e.key === ' ' || e.key === '/') {
          e.preventDefault();
          this.handleShuffle();
        } else if (e.key === 'Escape') {
          if (!this.dom.vaultModal.hidden) this.closeModal(this.dom.vaultModal);
          else if (!this.dom.rulesModal.hidden) this.closeModal(this.dom.rulesModal);
          else if (!this.dom.statsModal.hidden) this.closeModal(this.dom.statsModal);
        }
      });
    }

    lockReleaseSchedule() {
      const todayIndex = DailyScheduler.getDayIndex();
      const puzzles = window.COCKTAIL_SPELLING_BEE_PUZZLES;
      if (!puzzles) return;
      if (!this.state.releasedSchedule) this.state.releasedSchedule = {};

      for (let d = 0; d <= todayIndex; d++) {
        if (!this.state.releasedSchedule[d]) {
          const p = DailyScheduler.getPuzzleForDay(d, puzzles, this.state.releasedSchedule);
          if (p) this.state.releasedSchedule[d] = p.id;
        }
      }
      StorageManager.save(this.state);
    }

    toggleSound() {
      this.sound.enabled = !this.sound.enabled;
      this.state.soundEnabled = this.sound.enabled;
      StorageManager.save(this.state);
      this.updateSoundDisplay();
      if (this.sound.enabled) this.sound.playTap();
    }

    updateSoundDisplay() {
      const icon = this.sound.enabled ? '🔊' : '🔇';
      const label = this.sound.enabled ? 'SOUND ON' : 'SOUND OFF';
      this.dom.menuSoundIcon.textContent = icon;
      this.dom.menuSoundLabel.textContent = label;
      this.dom.gameSoundIcon.textContent = icon;
    }

    showScreen(screen) {
      if (screen === 'menu') {
        this.renderMenuTodayCard();
        this.dom.mainMenuScreen.hidden = false;
        this.dom.gameplayScreen.hidden = true;
        this.garnishEngine.setGameMode(false);
      } else {
        this.dom.mainMenuScreen.hidden = true;
        this.dom.gameplayScreen.hidden = false;
        this.garnishEngine.setGameMode(true);
      }
    }

    openModal(modal) {
      if (!modal) return;
      modal.hidden = false;
      this.sound.playTap();
    }

    closeModal(modal) {
      if (!modal) return;
      modal.hidden = true;
      this.sound.playTap();
    }

    /* --------------------------------------------------------------------------
       6. MAIN MENU RENDERING
       -------------------------------------------------------------------------- */
    renderMenuTodayCard() {
      const puzzles = window.COCKTAIL_SPELLING_BEE_PUZZLES;
      if (!puzzles || puzzles.length === 0) return;

      const todayMeta = DailyScheduler.getTodayPuzzle(puzzles, this.state.releasedSchedule);
      const puzzle = todayMeta.puzzle;
      const dayIndex = todayMeta.dayIndex;

      this.dom.menuTodayBadge.textContent = dayIndex === 0 ? "TODAY'S SERVICE (DAY 0)" : `TODAY'S SERVICE • DAY #${dayIndex}`;
      this.dom.menuDiffPill.textContent = puzzle.difficulty.toUpperCase();
      this.dom.menuThemeTitle.textContent = puzzle.title;
      this.dom.menuCurriculumCategory.textContent = puzzle.curriculumCategory;

      const saved = this.state.puzzleProgress[puzzle.id];
      const maxPts = this.computeMaxScore(puzzle);

      if (saved && saved.foundWords && saved.foundWords.length > 0) {
        const score = saved.score || 0;
        const rank = this.computeRank(score, maxPts);
        this.dom.menuStatusText.textContent = `${saved.foundWords.length} words poured • ${score} pts`;
        this.dom.menuStatusRank.textContent = rank.name;
        this.dom.playBtnText.textContent = 'RESUME SHIFT';
      } else {
        this.dom.menuStatusText.textContent = 'Ready for service';
        this.dom.menuStatusRank.textContent = 'Barback';
        this.dom.playBtnText.textContent = 'START SHIFT';
      }

      // Vault archive count
      const releasedVault = DailyScheduler.getReleasedVaultPuzzles(puzzles, this.state.releasedSchedule);
      this.dom.vaultArchiveCountBadge.textContent = `${releasedVault.length} Edition${releasedVault.length === 1 ? '' : 's'}`;
    }

    startTodayGame() {
      const puzzles = window.COCKTAIL_SPELLING_BEE_PUZZLES;
      const todayMeta = DailyScheduler.getTodayPuzzle(puzzles, this.state.releasedSchedule);
      this.mountPuzzle(todayMeta.puzzle, todayMeta.dayIndex, true);
      this.showScreen('game');
    }

    /* --------------------------------------------------------------------------
       7. ACTIVE GAME SETUP & RENDERING
       -------------------------------------------------------------------------- */
    mountPuzzle(puzzle, dayIndex, isToday = false) {
      this.currentPuzzle = puzzle;
      this.currentDayIndex = dayIndex;
      this.isCurrentPuzzleToday = isToday;
      this.activeInput = '';

      this.maxPossibleScore = this.computeMaxScore(puzzle);

      // Load progress
      const saved = this.state.puzzleProgress[puzzle.id] || { foundWords: [], score: 0 };
      this.foundWords = [...saved.foundWords];
      this.score = this.calculateWordsScore(this.foundWords, puzzle);

      // Shuffle outer letters initially
      this.outerLettersShuffled = [...puzzle.outerLetters];
      this.shuffleArray(this.outerLettersShuffled);

      this.renderGameHeader();
      this.renderHiveCells();
      this.renderInputDisplay();
      this.renderRankLadder();
      this.renderFoundWordsList();
    }

    computeMaxScore(puzzle) {
      let total = 0;
      puzzle.words.forEach(w => {
        const pts = w.length === 4 ? 1 : w.length;
        const isPangram = puzzle.pangrams.includes(w);
        total += isPangram ? pts + 7 : pts;
      });
      return total;
    }

    calculateWordsScore(words, puzzle) {
      let score = 0;
      words.forEach(w => {
        const pts = w.length === 4 ? 1 : w.length;
        const isPangram = puzzle.pangrams.includes(w);
        score += isPangram ? pts + 7 : pts;
      });
      return score;
    }

    computeRank(score, maxScore) {
      const pct = maxScore > 0 ? (score / maxScore) : 0;
      let currentTier = RANK_TIERS[0];
      for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
        if (pct >= RANK_TIERS[i].minPct) {
          currentTier = RANK_TIERS[i];
          break;
        }
      }
      return currentTier;
    }

    renderGameHeader() {
      this.dom.gameEditionBadge.textContent = this.isCurrentPuzzleToday ? 'TODAY' : `DAY #${this.currentDayIndex}`;
      this.dom.gameThemeTitle.textContent = this.currentPuzzle.title;
      this.dom.gameCategoryTitle.textContent = this.currentPuzzle.curriculumCategory;
    }

    renderHiveCells() {
      // Center cell
      this.dom.cellCenter.setAttribute('data-letter', this.currentPuzzle.centerLetter);
      this.dom.cellCenter.querySelector('.cell-letter').textContent = this.currentPuzzle.centerLetter;

      // Outer cells
      this.dom.outerCells.forEach((cell, idx) => {
        const letter = this.outerLettersShuffled[idx];
        cell.setAttribute('data-letter', letter);
        cell.querySelector('.cell-letter').textContent = letter;
      });
    }

    renderInputDisplay() {
      this.dom.wordInputDisplay.innerHTML = '';
      if (!this.activeInput) {
        const cursor = document.createElement('span');
        cursor.className = 'cursor-beam';
        this.dom.wordInputDisplay.appendChild(cursor);
        return;
      }

      for (let i = 0; i < this.activeInput.length; i++) {
        const char = this.activeInput[i];
        const span = document.createElement('span');
        span.className = 'word-char';
        if (char === this.currentPuzzle.centerLetter) {
          span.classList.add('char-center');
        }
        span.textContent = char;
        this.dom.wordInputDisplay.appendChild(span);
      }

      const cursor = document.createElement('span');
      cursor.className = 'cursor-beam';
      this.dom.wordInputDisplay.appendChild(cursor);
    }

    /* --------------------------------------------------------------------------
       8. INPUT HANDLING & WORD SUBMISSION
       -------------------------------------------------------------------------- */
    handleLetterInput(letter) {
      const allowed = [this.currentPuzzle.centerLetter, ...this.currentPuzzle.outerLetters];
      if (!allowed.includes(letter)) {
        this.showToast('Bad letter', true);
        this.sound.playError();
        return;
      }
      if (this.activeInput.length >= 19) return;
      this.activeInput += letter;
      this.sound.playTap();
      this.renderInputDisplay();
    }

    handleDelete() {
      if (this.activeInput.length === 0) return;
      this.activeInput = this.activeInput.slice(0, -1);
      this.sound.playTap();
      this.renderInputDisplay();
    }

    handleShuffle() {
      this.shuffleArray(this.outerLettersShuffled);
      this.renderHiveCells();
      this.sound.playShuffle();
    }

    shuffleArray(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }

    handleWordSubmit() {
      const word = this.activeInput.trim().toUpperCase();

      if (word.length < 4) {
        this.showToast('Too short (min 4 letters)', true);
        this.sound.playError();
        return;
      }

      if (!word.includes(this.currentPuzzle.centerLetter)) {
        this.showToast(`Missing center letter (${this.currentPuzzle.centerLetter})`, true);
        this.sound.playError();
        return;
      }

      if (this.foundWords.includes(word)) {
        this.showToast('Already poured', true);
        this.sound.playError();
        return;
      }

      if (!this.currentPuzzle.words.includes(word)) {
        this.showToast('Not on the cocktail menu', true);
        this.sound.playError();
        return;
      }

      // Valid word scored
      const isPangram = this.currentPuzzle.pangrams.includes(word);
      const isCocktailTerm = this.currentPuzzle.cocktailWords && this.currentPuzzle.cocktailWords.includes(word);
      const pts = (word.length === 4 ? 1 : word.length) + (isPangram ? 7 : 0);

      this.foundWords.push(word);
      this.score += pts;
      this.activeInput = '';

      this.saveCurrentProgress();
      this.updateCareerStats(pts, isPangram);

      if (isPangram) {
        this.showToast(`★ PANGRAM! +${pts} PTS! 🍸`, false, true);
        this.sound.playSuccess(true);
      } else if (isCocktailTerm) {
        this.showToast(`Cocktail Spec! +${pts} pts`, false, false);
        this.sound.playSuccess(false);
      } else {
        const praise = pts >= 7 ? 'Brilliant!' : pts >= 5 ? 'Great!' : 'Good!';
        this.showToast(`${praise} +${pts}`, false, false);
        this.sound.playSuccess(false);
      }

      this.renderInputDisplay();
      this.renderRankLadder();
      this.renderFoundWordsList();
    }

    showToast(message, isError = false, isPangram = false) {
      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.dom.toastMessage.textContent = message;
      this.dom.toastMessage.className = 'toast-message show';

      if (isError) {
        this.dom.toastMessage.classList.add('toast-error');
      } else if (isPangram) {
        this.dom.toastMessage.classList.add('toast-pangram');
      }

      this.toastTimeout = setTimeout(() => {
        this.dom.toastMessage.className = 'toast-message';
      }, 1900);
    }

    /* --------------------------------------------------------------------------
       9. RANK LADDER & FOUND WORDS
       -------------------------------------------------------------------------- */
    renderRankLadder() {
      const currentRank = this.computeRank(this.score, this.maxPossibleScore);
      this.dom.currentRankLabel.textContent = currentRank.name;
      this.dom.playerCurrentScore.textContent = this.score;
      this.dom.rankMaxScore.textContent = this.maxPossibleScore;

      const pct = Math.min(100, Math.round((this.score / this.maxPossibleScore) * 100));
      this.dom.rankProgressBar.style.width = `${pct}%`;

      this.dom.rankMarkers.innerHTML = '';
      RANK_TIERS.forEach(tier => {
        if (tier.minPct === 0) return;
        const pip = document.createElement('div');
        pip.className = 'rank-pip';
        const leftPercent = tier.minPct * 100;
        pip.style.left = `${leftPercent}%`;
        if (pct >= leftPercent) {
          pip.classList.add('reached');
        }
        this.dom.rankMarkers.appendChild(pip);
      });
    }

    renderFoundWordsList() {
      this.dom.foundCount.textContent = this.foundWords.length;
      if (this.foundWords.length === 0) {
        this.dom.foundPreview.textContent = 'None yet';
        this.dom.foundChipsGrid.innerHTML = '<span style="color:var(--text-dim);font-size:0.8rem;">No drinks poured yet. Spell your first word!</span>';
        return;
      }

      const recent = this.foundWords.slice(-3).reverse().join(', ');
      this.dom.foundPreview.textContent = recent;

      const sorted = [...this.foundWords].sort();
      this.dom.foundChipsGrid.innerHTML = '';

      sorted.forEach(w => {
        const isPangram = this.currentPuzzle.pangrams.includes(w);
        const isCocktail = this.currentPuzzle.cocktailWords && this.currentPuzzle.cocktailWords.includes(w);
        const chip = document.createElement('span');
        chip.className = 'found-chip';
        if (isPangram) chip.classList.add('chip-pangram');
        if (isCocktail) chip.classList.add('chip-cocktail');

        let badge = '';
        if (isPangram) badge = ' <span class="chip-badge">★ PANGRAM</span>';
        else if (isCocktail) badge = ' <span class="chip-badge">🍸</span>';

        chip.innerHTML = `${w}${badge}`;
        this.dom.foundChipsGrid.appendChild(chip);
      });
    }

    saveCurrentProgress() {
      this.state.puzzleProgress[this.currentPuzzle.id] = {
        dayIndex: this.currentDayIndex,
        foundWords: this.foundWords,
        score: this.score,
        lastPlayedAt: Date.now()
      };
      StorageManager.save(this.state);
    }

    updateCareerStats(pointsEarned, isPangram) {
      const todayStr = new Date().toISOString().split('T')[0];
      const stats = this.state.stats;

      stats.wordsFoundTotal += 1;
      stats.totalPoints += pointsEarned;
      if (isPangram) stats.pangramsFoundTotal += 1;

      if (stats.lastPlayedDate !== todayStr) {
        if (!stats.lastPlayedDate) {
          stats.currentStreak = 1;
        } else {
          const lastDate = new Date(stats.lastPlayedDate);
          const currDate = new Date(todayStr);
          const diffDays = Math.round((currDate - lastDate) / 86400000);
          if (diffDays === 1) {
            stats.currentStreak += 1;
          } else if (diffDays > 1) {
            stats.currentStreak = 1;
          }
        }
        stats.lastPlayedDate = todayStr;
        stats.gamesPlayed += 1;
        if (stats.currentStreak > stats.maxStreak) {
          stats.maxStreak = stats.currentStreak;
        }
      }
      StorageManager.save(this.state);
    }

    refreshStats() {
      const stats = this.state.stats;
      this.dom.statPlayed.textContent = stats.gamesPlayed;
      this.dom.statWords.textContent = stats.wordsFoundTotal;
      this.dom.statPangrams.textContent = stats.pangramsFoundTotal;
      this.dom.statPoints.textContent = stats.totalPoints;
      this.dom.statCurrentStreak.textContent = `${stats.currentStreak} Days`;
      this.dom.statMaxStreak.textContent = `${stats.maxStreak} Days`;
    }

    /* --------------------------------------------------------------------------
       10. CELLAR VAULT ARCHIVE
       -------------------------------------------------------------------------- */
    renderVaultArchive() {
      const puzzles = window.COCKTAIL_SPELLING_BEE_PUZZLES;
      const released = DailyScheduler.getReleasedVaultPuzzles(puzzles, this.state.releasedSchedule);
      this.dom.vaultListContainer.innerHTML = '';

      if (released.length === 0) {
        const emptyNotice = document.createElement('div');
        emptyNotice.className = 'vault-empty-notice';
        emptyNotice.innerHTML = `
          <p><strong>The Cellar Vault is empty on Opening Day.</strong></p>
          <p style="margin-top:6px;font-size:0.75rem;color:var(--text-dim);">Previous daily editions will be archived here as each service day concludes.</p>
        `;
        this.dom.vaultListContainer.appendChild(emptyNotice);
        return;
      }

      released.forEach(item => {
        const saved = this.state.puzzleProgress[item.puzzle.id];
        const wordsFoundCount = saved ? saved.foundWords.length : 0;
        const totalWords = item.puzzle.words.length;
        const isDone = wordsFoundCount >= totalWords;

        const card = document.createElement('div');
        card.className = 'vault-item-card';

        card.innerHTML = `
          <div class="vault-meta">
            <div class="vault-edition-row">
              <span class="vault-day-num">DAY #${item.dayIndex}</span>
              <span class="card-diff-pill">${item.puzzle.difficulty.toUpperCase()}</span>
            </div>
            <span class="vault-theme-title">${item.puzzle.title}</span>
          </div>
          <div class="vault-status-badge ${isDone ? 'badge-done' : ''}">
            ${wordsFoundCount > 0 ? `${wordsFoundCount} / ${totalWords} Words` : 'Unplayed'}
          </div>
        `;

        card.addEventListener('click', () => {
          this.closeModal(this.dom.vaultModal);
          this.mountPuzzle(item.puzzle, item.dayIndex, false);
          this.showScreen('game');
        });

        this.dom.vaultListContainer.appendChild(card);
      });
    }

    /* --------------------------------------------------------------------------
       11. MIDNIGHT ROLLOVER OBSERVER
       -------------------------------------------------------------------------- */
    startMidnightObserver() {
      let recordedDay = DailyScheduler.getDayIndex();
      setInterval(() => {
        const currentDay = DailyScheduler.getDayIndex();
        if (currentDay !== recordedDay) {
          recordedDay = currentDay;
          this.lockReleaseSchedule();
          this.renderMenuTodayCard();
          if (!this.dom.gameplayScreen.hidden) {
            this.showToast('New service day ready in the Cellar Vault!', false);
          }
        }
      }, 30000);
    }
  }

  // Initialize once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    window.cocktailBeeApp = new CocktailBeeApp();
  });
})();