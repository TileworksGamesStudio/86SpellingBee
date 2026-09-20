(function () {
  'use strict';

  const STORAGE_KEY = 'cocktail_spelling_bee_save_v5';
  const CACHE_PUZZLES_KEY = 'cocktail_spelling_bee_cached_puzzles_v2';
  const DRAFT_STORAGE_KEY = 'cocktail_spelling_bee_draft_input';
  const SETTINGS_KEY = 'cocktail_spelling_bee_settings_v1';
  const CSV_PATH = './puzzles.csv';

  // Configurable Plus button hook
  const PLUS_BUTTON_ACTION = {
    url: '',
    fallbackMessage: 'Spelling Bee • High-Proof Hive Edition'
  };

  /* ==========================================================================
     SHARED TILEWORKS DAILY RELEASE ENGINE
     Device-Clock Independent, CORS-Safe, IANA London Timezone
     ========================================================================== */
  class TileworksDailyRelease {
    constructor(options = {}) {
      this.timeZone = options.timeZone || 'Europe/London';
      this.syncOffsetMs = 0;
      this.perfSyncMark = performance.now();
      this.hasAuthoritativeSync = false;
      this.isSyncing = false;
      this.onRolloverCallback = options.onRollover || null;
      this.lastObservedDateString = null;
    }

    async syncTime() {
      if (this.isSyncing) return;
      this.isSyncing = true;

      // Tier 1: Public CORS HTTPS Internet Time API
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const res = await fetch('https://timeapi.io/api/v1/time/current/zone?timeZone=UTC', {
          signal: controller.signal,
          cache: 'no-store'
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const serverIso = data.dateTime || data.utc_datetime;
          const serverEpochMs = new Date(serverIso.endsWith('Z') ? serverIso : serverIso + 'Z').getTime();

          if (!isNaN(serverEpochMs)) {
            this.perfSyncMark = performance.now();
            this.syncOffsetMs = serverEpochMs - this.perfSyncMark;
            this.hasAuthoritativeSync = true;
            this.isSyncing = false;
            return;
          }
        }
      } catch (err) {
        // Fallback to Tier 2
      }

      // Tier 2: HTTP Server Date Header from same-origin resource (Fastly / GitHub Pages Edge)
      try {
        const res = await fetch(CSV_PATH + '?t=' + Date.now(), {
          method: 'HEAD',
          cache: 'no-store'
        });
        const httpDate = res.headers.get('date');
        if (httpDate) {
          const headerEpochMs = Date.parse(httpDate);
          if (!isNaN(headerEpochMs)) {
            this.perfSyncMark = performance.now();
            this.syncOffsetMs = headerEpochMs - this.perfSyncMark;
            this.hasAuthoritativeSync = true;
            this.isSyncing = false;
            return;
          }
        }
      } catch (err) {
        // Fallback to Tier 3
      }

      // Tier 3: Deterministic fallback if completely offline
      if (!this.hasAuthoritativeSync) {
        this.perfSyncMark = performance.now();
        this.syncOffsetMs = Date.now() - this.perfSyncMark;
      }
      this.isSyncing = false;
    }

    getNow() {
      const elapsedSinceSync = performance.now() - this.perfSyncMark;
      return new Date(this.syncOffsetMs + elapsedSinceSync);
    }

    getReleaseDateString() {
      const now = this.getNow();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: this.timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(now);
    }

    checkDayRollover() {
      const currentDate = this.getReleaseDateString();
      if (!this.lastObservedDateString) {
        this.lastObservedDateString = currentDate;
        return false;
      }
      if (currentDate !== this.lastObservedDateString) {
        this.lastObservedDateString = currentDate;
        if (typeof this.onRolloverCallback === 'function') {
          this.onRolloverCallback(currentDate);
        }
        return true;
      }
      return false;
    }
  }

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

  const FALLBACK_PUZZLES = [
    {
      date: '2025-05-15',
      centerLetter: 'T',
      outerLetters: ['A', 'E', 'I', 'N', 'R', 'S'],
      words: [
        'ANTI', 'ARTIST', 'ATTAIN', 'ATTIRE', 'EAST', 'EATEN', 'EATER', 'EATS',
        'ENTER', 'ENTERS', 'ESTATE', 'INITIATE', 'INSTATE', 'INTENT', 'INTER',
        'INTERN', 'IRATE', 'ITERATE', 'NATTER', 'NEAT', 'NEST', 'NETT', 'RATE',
        'RATER', 'RATES', 'RETAIN', 'RETINA', 'SAINT', 'SATIN', 'STAIN', 'STAINER',
        'STAIR', 'STAR', 'STARE', 'START', 'STATE', 'STEER', 'STEIN', 'STERN',
        'STIR', 'STRAIN', 'STRAINER', 'STRAIT', 'STRATA', 'TAINT', 'TANNIN',
        'TARE', 'TARN', 'TART', 'TASTE', 'TASTER', 'TEAR', 'TEAT', 'TEEN',
        'TENET', 'TENNIS', 'TENT', 'TERRA', 'TERSE', 'TIARA', 'TIER', 'TINE',
        'TINT', 'TIRE', 'TITAN', 'TITRE', 'TRAIN', 'TRAINER', 'TRAIT', 'TRANSIT',
        'TREAT', 'TREE'
      ],
      pangrams: ['STAINER', 'STRAINER']
    },
    {
      date: '2025-05-16',
      centerLetter: 'G',
      outerLetters: ['E', 'I', 'N', 'O', 'R', 'S'],
      words: [
        'EGGS', 'EGOS', 'ERGO', 'ERGS', 'GEAR', 'GEARS', 'GEESE', 'GENIE', 'GENRE',
        'GIGS', 'GINGER', 'GINS', 'GOER', 'GOES', 'GONE', 'GONG', 'GORE', 'GORGE',
        'GORGER', 'GORGES', 'GORGON', 'GREEN', 'GREENS', 'GRIN', 'GRINS', 'GROG',
        'GROIN', 'IGNORE', 'IGNORES', 'OGRE', 'OGRES', 'ORIGIN', 'REGION', 'REGIONS',
        'REIGN', 'REIGNS', 'RESIGN', 'RESIGNS', 'RING', 'RINGER', 'RINGS', 'SAGE',
        'SAGER', 'SAGES', 'SIGN', 'SIGNER', 'SIGNS', 'SING', 'SINGER', 'SINGE',
        'SINGES', 'SINGS', 'SONG', 'SONGS'
      ],
      pangrams: ['RESIGN', 'RESIGNS', 'IGNORES', 'REGION', 'REGIONS']
    }
  ];

  /* ==========================================================================
     CORE PUZZLE ENGINE
     ========================================================================== */
  class SpellingBeeEngine {
    static calculateWordScore(word, puzzle) {
      if (!word || !puzzle) return 0;
      const isPangram = puzzle.pangrams.includes(word);
      const base = word.length === 4 ? 1 : word.length;
      return base + (isPangram ? 7 : 0);
    }

    static calculateMaxScore(puzzle) {
      if (!puzzle || !puzzle.words) return 0;
      return puzzle.words.reduce((sum, w) => sum + this.calculateWordScore(w, puzzle), 0);
    }

    static calculateWordsScore(words, puzzle) {
      if (!words || !puzzle) return 0;
      return words.reduce((sum, w) => sum + this.calculateWordScore(w, puzzle), 0);
    }

    static getRank(score, maxScore) {
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

    static validateWord(rawWord, puzzle, foundWords) {
      const word = (rawWord || '').trim().toUpperCase();
      if (!word) return { valid: false, error: 'Empty' };

      if (word.length < 4) {
        return { valid: false, error: 'Too short (min 4)' };
      }

      if (!word.includes(puzzle.centerLetter)) {
        return { valid: false, error: 'Missing center letter' };
      }

      const allowedLetters = new Set([puzzle.centerLetter, ...puzzle.outerLetters]);
      const invalidLetter = word.split('').find(ch => !allowedLetters.has(ch));
      if (invalidLetter) {
        return { valid: false, error: `Letter '${invalidLetter}' not in hive` };
      }

      if (foundWords.includes(word)) {
        return { valid: false, error: 'Already found' };
      }

      if (!puzzle.words.includes(word)) {
        return { valid: false, error: 'Not in word list' };
      }

      const points = this.calculateWordScore(word, puzzle);
      const isPangram = puzzle.pangrams.includes(word);
      const isPerfectPangram = isPangram && word.length === 7;

      return {
        valid: true,
        word,
        points,
        isPangram,
        isPerfectPangram
      };
    }
  }

  /* ==========================================================================
     SECTION 68A: 12 ULTRA-PREMIUM VECTOR GARNISH SVG DEFINITIONS
     Consistent viewBox (0 0 60 60), botanical/mixology silhouettes, warm light
     ========================================================================== */
  const GARNISH_SVG_ICONS = [
    // 1. Orange Twist
    `<svg viewBox="0 0 60 60" aria-hidden="true">
      <path d="M12 44 C10 32, 22 20, 34 22 C46 24, 48 12, 38 8 C30 5, 20 12, 24 24 C28 36, 44 38, 48 48 C50 54, 42 56, 36 52" fill="none" stroke="#E86A2D" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M14 43 C12 33, 23 22, 34 24 C44 26, 46 14, 38 10" fill="none" stroke="#F5DE8C" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`,

    // 2. Lemon Twist
    `<svg viewBox="0 0 60 60" aria-hidden="true">
      <path d="M15 48 C8 36, 16 18, 30 18 C44 18, 52 28, 46 40 C42 48, 30 52, 22 46 C16 42, 18 30, 26 24 C32 20, 42 22, 45 14" fill="none" stroke="#F5DE8C" stroke-width="3.8" stroke-linecap="round"/>
      <path d="M17 47 C11 37, 18 20, 30 20 C42 20, 50 29, 45 39" fill="none" stroke="#FFF1BE" stroke-width="1.3" stroke-linecap="round"/>
    </svg>`,

    // 3. Lime Wheel
    `<svg viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="24" fill="#1C381E" stroke="#7BA858" stroke-width="2.6"/>
      <circle cx="30" cy="30" r="20" fill="none" stroke="#A3D977" stroke-width="1.2" stroke-dasharray="2 3"/>
      <circle cx="30" cy="30" r="3.5" fill="#C2F099"/>
      <line x1="30" y1="10" x2="30" y2="26.5" stroke="#7BA858" stroke-width="1.6"/>
      <line x1="30" y1="33.5" x2="30" y2="50" stroke="#7BA858" stroke-width="1.6"/>
      <line x1="10" y1="30" x2="26.5" y2="30" stroke="#7BA858" stroke-width="1.6"/>
      <line x1="33.5" y1="30" x2="50" y2="30" stroke="#7BA858" stroke-width="1.6"/>
      <line x1="16" y1="16" x2="27.5" y2="27.5" stroke="#7BA858" stroke-width="1.6"/>
      <line x1="32.5" y1="32.5" x2="44" y2="44" stroke="#7BA858" stroke-width="1.6"/>
      <line x1="16" y1="44" x2="27.5" y2="32.5" stroke="#7BA858" stroke-width="1.6"/>
      <line x1="32.5" y1="27.5" x2="44" y2="16" stroke="#7BA858" stroke-width="1.6"/>
    </svg>`,

    // 4. Grapefruit Wheel
    `<svg viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="25" fill="#421414" stroke="#DF8235" stroke-width="2.8"/>
      <circle cx="30" cy="30" r="21" fill="none" stroke="#F87171" stroke-width="1.4"/>
      <circle cx="30" cy="30" r="4" fill="#FCA5A5"/>
      <line x1="30" y1="9" x2="30" y2="26" stroke="#DF8235" stroke-width="1.8"/>
      <line x1="30" y1="34" x2="30" y2="51" stroke="#DF8235" stroke-width="1.8"/>
      <line x1="9" y1="30" x2="26" y2="30" stroke="#DF8235" stroke-width="1.8"/>
      <line x1="34" y1="30" x2="51" y2="30" stroke="#DF8235" stroke-width="1.8"/>
      <line x1="15" y1="15" x2="27" y2="27" stroke="#DF8235" stroke-width="1.8"/>
      <line x1="33" y1="33" x2="45" y2="45" stroke="#DF8235" stroke-width="1.8"/>
      <line x1="15" y1="45" x2="27" y2="33" stroke="#DF8235" stroke-width="1.8"/>
      <line x1="33" y1="27" x2="45" y2="15" stroke="#DF8235" stroke-width="1.8"/>
    </svg>`,

    // 5. Blood Orange Wheel
    `<svg viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="24" fill="#38080C" stroke="#C4511D" stroke-width="2.6"/>
      <circle cx="30" cy="19" r="19" fill="#540D14" stroke="#991B1B" stroke-width="1"/>
      <circle cx="30" cy="30" r="3.5" fill="#FCA5A5"/>
      <line x1="30" y1="11" x2="30" y2="26.5" stroke="#C4511D" stroke-width="1.6"/>
      <line x1="30" y1="33.5" x2="30" y2="49" stroke="#C4511D" stroke-width="1.6"/>
      <line x1="11" y1="30" x2="26.5" y2="30" stroke="#C4511D" stroke-width="1.6"/>
      <line x1="33.5" y1="30" x2="49" y2="30" stroke="#C4511D" stroke-width="1.6"/>
      <line x1="16.5" y1="16.5" x2="27.5" y2="27.5" stroke="#C4511D" stroke-width="1.6"/>
      <line x1="32.5" y1="32.5" x2="43.5" y2="43.5" stroke="#C4511D" stroke-width="1.6"/>
      <line x1="16.5" y1="43.5" x2="27.5" y2="32.5" stroke="#C4511D" stroke-width="1.6"/>
      <line x1="32.5" y1="27.5" x2="43.5" y2="16.5" stroke="#C4511D" stroke-width="1.6"/>
    </svg>`,

    // 6. Dehydrated Citrus Wheel
    `<svg viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="24" fill="#2E1809" stroke="#A5772D" stroke-width="2.5"/>
      <circle cx="30" cy="30" r="20" fill="none" stroke="#CCA048" stroke-width="1.2" stroke-dasharray="3 2"/>
      <circle cx="30" cy="30" r="3.5" fill="#ECD078"/>
      <line x1="30" y1="10" x2="30" y2="26.5" stroke="#A5772D" stroke-width="1.6"/>
      <line x1="30" y1="33.5" x2="30" y2="50" stroke="#A5772D" stroke-width="1.6"/>
      <line x1="10" y1="30" x2="26.5" y2="30" stroke="#A5772D" stroke-width="1.6"/>
      <line x1="33.5" y1="30" x2="50" y2="30" stroke="#A5772D" stroke-width="1.6"/>
      <line x1="16" y1="16" x2="27.5" y2="27.5" stroke="#A5772D" stroke-width="1.6"/>
      <line x1="32.5" y1="32.5" x2="44" y2="44" stroke="#A5772D" stroke-width="1.6"/>
      <line x1="16" y1="44" x2="27.5" y2="32.5" stroke="#A5772D" stroke-width="1.6"/>
      <line x1="32.5" y1="27.5" x2="44" y2="16" stroke="#A5772D" stroke-width="1.6"/>
    </svg>`,

    // 7. Single Cocktail Cherry
    `<svg viewBox="0 0 60 60" aria-hidden="true">
      <path d="M30 26 C30 14, 42 6, 48 8" fill="none" stroke="#73501D" stroke-width="2" stroke-linecap="round"/>
      <circle cx="28" cy="36" r="14" fill="#7F1D1D" stroke="#DC2626" stroke-width="2.2"/>
      <ellipse cx="23" cy="32" rx="4" ry="2.5" transform="rotate(-30 23 32)" fill="#FCA5A5" opacity="0.65"/>
    </svg>`,

    // 8. Double Cherry
    `<svg viewBox="0 0 60 60" aria-hidden="true">
      <path d="M18 36 C18 18, 30 10, 36 8" fill="none" stroke="#73501D" stroke-width="2" stroke-linecap="round"/>
      <path d="M42 38 C42 20, 34 10, 36 8" fill="none" stroke="#73501D" stroke-width="2" stroke-linecap="round"/>
      <circle cx="18" cy="40" r="11" fill="#7F1D1D" stroke="#DC2626" stroke-width="2"/>
      <circle cx="42" cy="42" r="11" fill="#991B1B" stroke="#EF4444" stroke-width="2"/>
      <ellipse cx="14" cy="37" rx="3.5" ry="2" transform="rotate(-30 14 37)" fill="#FCA5A5" opacity="0.6"/>
      <ellipse cx="38" cy="39" rx="3.5" ry="2" transform="rotate(-30 38 39)" fill="#FCA5A5" opacity="0.6"/>
    </svg>`,

    // 9. Mint Sprig
    `<svg viewBox="0 0 60 60" aria-hidden="true">
      <path d="M30 52 C30 36, 30 18, 30 12" fill="none" stroke="#4D7C0F" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M30 34 C20 30, 14 22, 18 16 C24 14, 28 24, 30 34 Z" fill="#365314" stroke="#84CC16" stroke-width="1.8"/>
      <path d="M30 28 C40 24, 46 16, 42 10 C36 8, 32 18, 30 28 Z" fill="#365314" stroke="#84CC16" stroke-width="1.8"/>
      <path d="M30 14 C26 6, 34 6, 30 14 Z" fill="#4D7C0F" stroke="#A3E635" stroke-width="1.5"/>
    </svg>`,

    // 10. Rosemary Sprig
    `<svg viewBox="0 0 60 60" aria-hidden="true">
      <path d="M15 50 C24 40, 36 26, 45 10" fill="none" stroke="#527928" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="22" y1="42" x2="16" y2="36" stroke="#7BA858" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="26" y1="37" x2="34" y2="40" stroke="#7BA858" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="30" y1="32" x2="24" y2="24" stroke="#7BA858" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="34" y1="27" x2="42" y2="30" stroke="#7BA858" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="38" y1="21" x2="32" y2="14" stroke="#7BA858" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="42" y1="16" x2="50" y2="18" stroke="#7BA858" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`,

    // 11. Green Olive
    `<svg viewBox="0 0 60 60" aria-hidden="true">
      <ellipse cx="30" cy="30" rx="14" ry="20" fill="#364918" stroke="#65882B" stroke-width="2.4"/>
      <circle cx="30" cy="22" r="5.5" fill="#991B1B" stroke="#DC2626" stroke-width="1.5"/>
      <ellipse cx="25" cy="34" rx="3.5" ry="6" fill="#A3D977" opacity="0.35"/>
    </svg>`,

    // 12. Cucumber Ribbon
    `<svg viewBox="0 0 60 60" aria-hidden="true">
      <path d="M12 48 C20 40, 18 28, 30 24 C42 20, 38 12, 48 10" fill="none" stroke="#225429" stroke-width="6" stroke-linecap="round"/>
      <path d="M12 48 C20 40, 18 28, 30 24 C42 20, 38 12, 48 10" fill="none" stroke="#86EFAC" stroke-width="2.8" stroke-linecap="round"/>
      <circle cx="28" cy="27" r="1.2" fill="#225429"/>
      <circle cx="33" cy="22" r="1.2" fill="#225429"/>
    </svg>`
  ];

  /* ==========================================================================
     UPGRADED GLOWING GARNISH FLIGHT SYSTEM (MANAGER)
     Maintains 6–9 visible floating garnishes continuously traveling bottom-to-top
     ========================================================================== */
  class FloatingAtmosphereManager {
    constructor(containerEl, isEnabled = true) {
      this.container = containerEl;
      this.isEnabled = isEnabled;
      this.activeGarnishes = [];
      this.minPopulation = 6;
      this.maxPopulation = 9;
      this.animationFrameId = null;
      this.lastSpawnTime = 0;
      this.spawnInterval = 1200;

      if (this.isEnabled) {
        this.init();
      }
    }

    init() {
      if (!this.container) return;
      this.container.innerHTML = '';
      this.activeGarnishes = [];

      // Staggered initial population across the viewport height
      const count = 7;
      for (let i = 0; i < count; i++) {
        const initialY = (window.innerHeight / count) * i + (Math.random() * 40 - 20);
        this.spawnGarnish(initialY);
      }

      this.startLoop();
    }

    spawnGarnish(initialY = null) {
      if (!this.isEnabled || !this.container) return;
      if (this.activeGarnishes.length >= this.maxPopulation) return;

      const el = document.createElement('div');
      const depths = ['depth-far', 'depth-mid', 'depth-near'];
      const depthClass = depths[Math.floor(Math.random() * depths.length)];
      el.className = `floating-garnish ${depthClass}`;

      const iconIndex = Math.floor(Math.random() * GARNISH_SVG_ICONS.length);
      el.innerHTML = GARNISH_SVG_ICONS[iconIndex];

      const sizeMap = {
        'depth-far': 34 + Math.random() * 6,
        'depth-mid': 44 + Math.random() * 8,
        'depth-near': 54 + Math.random() * 10
      };
      const size = sizeMap[depthClass];
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;

      const x = Math.random() * (window.innerWidth - size - 20) + 10;
      const speed = depthClass === 'depth-far'
        ? (0.32 + Math.random() * 0.18)
        : (depthClass === 'depth-mid' ? (0.50 + Math.random() * 0.22) : (0.70 + Math.random() * 0.25));

      const garnish = {
        el,
        x,
        baseX: x,
        y: initialY !== null ? initialY : (window.innerHeight + size + 20),
        size,
        speed,
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: 0.008 + Math.random() * 0.008,
        driftAmplitude: 14 + Math.random() * 18,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 0.25 // Calm slow rotation
      };

      this.container.appendChild(el);
      this.activeGarnishes.push(garnish);
    }

    startLoop() {
      if (this.animationFrameId) return;

      const tick = (now) => {
        if (!this.isEnabled) {
          this.animationFrameId = null;
          return;
        }

        // Spawn to maintain 6-9 count organically
        if (now - this.lastSpawnTime > this.spawnInterval) {
          this.lastSpawnTime = now;
          if (this.activeGarnishes.length < this.maxPopulation) {
            this.spawnGarnish();
          }
        }

        for (let i = this.activeGarnishes.length - 1; i >= 0; i--) {
          const g = this.activeGarnishes[i];
          g.y -= g.speed;
          g.driftPhase += g.driftSpeed;
          g.x = g.baseX + Math.sin(g.driftPhase) * g.driftAmplitude;
          g.rotation += g.rotSpeed;

          g.el.style.transform = `translate3d(${g.x.toFixed(1)}px, ${g.y.toFixed(1)}px, 0) rotate(${g.rotation.toFixed(1)}deg)`;

          // When object leaves well above the viewport, recycle it cleanly
          if (g.y < -(g.size + 40)) {
            if (g.el.parentNode) g.el.parentNode.removeChild(g.el);
            this.activeGarnishes.splice(i, 1);
          }
        }

        this.animationFrameId = requestAnimationFrame(tick);
      };

      this.animationFrameId = requestAnimationFrame(tick);
    }

    stopLoop() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }

    setEnabled(enabled) {
      this.isEnabled = enabled;
      if (enabled) {
        this.init();
      } else {
        this.stopLoop();
        if (this.container) this.container.innerHTML = '';
        this.activeGarnishes = [];
      }
    }
  }

  /* ==========================================================================
     APP CONTROLLER & PRESENTATION ENGINE
     ========================================================================== */
  class SpellingBeeApp {
    constructor() {
      this.releaseSystem = new TileworksDailyRelease({
        timeZone: 'Europe/London',
        onRollover: () => {
          this.determineDailyPuzzle();
          this.updateMenuDashboard();
        }
      });

      this.puzzles = [...FALLBACK_PUZZLES];
      this.dailyPuzzle = null;
      this.activePuzzle = null;
      this.outerLetters = [];
      this.inputWord = '';
      this.foundWords = [];
      this.revealedMissedWords = [];
      this.score = 0;
      this.maxScore = 0;
      this.sortMode = 'alpha';
      this.hintsMode = 'remaining';
      this.vaultFilter = 'all';
      this.lastFocusedElement = null;
      this.currentView = 'menu';
      this.previousView = 'menu';
      this.feedbackTimer = null;
      this.isSubmitting = false;
      this.deleteHoldTimer = null;

      this.storage = this.loadSafeStorage();
      this.settings = this.loadSettings();

      this.cacheDom();

      // Atmospheric floating garnish flight system
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const shouldAnimate = this.settings.bgAnimation && !prefersReducedMotion;
      this.atmosphere = new FloatingAtmosphereManager(this.dom.bgFloatingIcons, shouldAnimate);

      this.bindEvents();
      this.renderRankTicks();

      this.loadCachedPuzzles();
      this.init();
    }

    cacheDom() {
      this.dom = {
        appRoot: document.getElementById('appRoot'),
        srAnnouncer: document.getElementById('srAnnouncer'),
        bgFloatingIcons: document.getElementById('bgFloatingIcons'),

        // Views
        menuView: document.getElementById('menuView'),
        gameView: document.getElementById('gameView'),
        vaultView: document.getElementById('vaultView'),
        offlineIndicator: document.getElementById('offlineIndicator'),

        // Main Menu Center Controls
        menuDailyDate: document.getElementById('menuDailyDate'),
        menuDailyStatus: document.getElementById('menuDailyStatus'),
        menuDailyProgressFill: document.getElementById('menuDailyProgressFill'),
        btnPlayDaily: document.getElementById('btnPlayDaily'),
        btnPlayDailyText: document.getElementById('btnPlayDailyText'),
        btnOpenVault: document.getElementById('btnOpenVault'),
        menuVaultCount: document.getElementById('menuVaultCount'),
        btnOpenSettings: document.getElementById('btnOpenSettings'),
        btnOpenHowToPlay: document.getElementById('btnOpenHowToPlay'),

        // Bottom 3 Utility Buttons
        btnMenuStats: document.getElementById('btnMenuStats'),
        btnMenuShare: document.getElementById('btnMenuShare'),
        btnMenuPlus: document.getElementById('btnMenuPlus'),

        // How to Play Right-Side Panel
        howToOverlay: document.getElementById('howToOverlay'),
        howToBackdrop: document.getElementById('howToBackdrop'),
        howToPanel: document.getElementById('howToPanel'),
        btnHowToBack: document.getElementById('btnHowToBack'),

        // Settings Modal
        modalSettings: document.getElementById('modalSettings'),
        btnToggleAnimation: document.getElementById('btnToggleAnimation'),
        btnToggleHaptics: document.getElementById('btnToggleHaptics'),

        // Gameplay
        btnGameBack: document.getElementById('btnGameBack'),
        gamePuzzleTitle: document.getElementById('gamePuzzleTitle'),
        btnGameHints: document.getElementById('btnGameHints'),
        btnGameRules: document.getElementById('btnGameRules'),
        btnGameShare: document.getElementById('btnGameShare'),
        btnGameStats: document.getElementById('btnGameStats'),
        rankStrip: document.querySelector('.rank-strip'),
        rankName: document.getElementById('rankName'),
        badgeQueenBee: document.getElementById('badgeQueenBee'),
        currentScore: document.getElementById('currentScore'),
        maxScore: document.getElementById('maxScore'),
        rankFill: document.getElementById('rankFill'),
        rankTicksLayer: document.getElementById('rankTicksLayer'),
        rankProgressBar: document.getElementById('rankProgressBar'),
        feedback: document.getElementById('feedback'),
        inputDisplay: document.getElementById('inputDisplay'),
        btnQuickClear: document.getElementById('btnQuickClear'),
        hiveBoard: document.getElementById('hiveBoard'),
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
        btnSortAlpha: document.getElementById('btnSortAlpha'),
        btnSortRecent: document.getElementById('btnSortRecent'),
        btnVaultReveal: document.getElementById('btnVaultReveal'),

        // Vault
        btnVaultBack: document.getElementById('btnVaultBack'),
        vaultHeaderCount: document.getElementById('vaultHeaderCount'),
        vaultGrid: document.getElementById('vaultGrid'),
        vaultFilterBtns: document.querySelectorAll('.vault-filter-btn'),

        // Modals & Panels
        modalStats: document.getElementById('modalStats'),
        modalHints: document.getElementById('modalHints'),
        modalDefinition: document.getElementById('modalDefinition'),
        modalQueenBee: document.getElementById('modalQueenBee'),
        hintsSummary: document.getElementById('hintsSummary'),
        hintsTable: document.getElementById('hintsTable'),
        hintsTwoLetter: document.getElementById('hintsTwoLetter'),
        btnHintsModeRemaining: document.getElementById('btnHintsModeRemaining'),
        btnHintsModeTotal: document.getElementById('btnHintsModeTotal'),
        statPlayed: document.getElementById('statPlayed'),
        statWords: document.getElementById('statWords'),
        statPangrams: document.getElementById('statPangrams'),
        statPoints: document.getElementById('statPoints'),
        statCurrentStreak: document.getElementById('statCurrentStreak'),
        statMaxStreak: document.getElementById('statMaxStreak'),
        btnExportData: document.getElementById('btnExportData'),
        btnImportData: document.getElementById('btnImportData'),
        backupPayloadArea: document.getElementById('backupPayloadArea'),
        defWordTitle: document.getElementById('defWordTitle'),
        defMeta: document.getElementById('defMeta'),
        defMeaningText: document.getElementById('defMeaningText'),
        defExternalLink: document.getElementById('defExternalLink')
      };
    }

    bindEvents() {
      // 1. Play Daily
      if (this.dom.btnPlayDaily) {
        this.dom.btnPlayDaily.addEventListener('click', () => {
          if (this.dailyPuzzle) {
            this.loadPuzzle(this.dailyPuzzle);
            this.switchView('game');
          }
        });
      }

      // 2. Vault
      if (this.dom.btnOpenVault) {
        this.dom.btnOpenVault.addEventListener('click', () => {
          this.renderVault();
          this.switchView('vault');
        });
      }

      // 3. Settings
      if (this.dom.btnOpenSettings) {
        this.dom.btnOpenSettings.addEventListener('click', () => {
          this.openModal(this.dom.modalSettings);
        });
      }

      // 4. How to Play (Right-to-Left Panel)
      if (this.dom.btnOpenHowToPlay) {
        this.dom.btnOpenHowToPlay.addEventListener('click', () => this.openHowToPlayPanel());
      }
      if (this.dom.btnGameRules) {
        this.dom.btnGameRules.addEventListener('click', () => this.openHowToPlayPanel());
      }
      if (this.dom.btnHowToBack) {
        this.dom.btnHowToBack.addEventListener('click', () => this.closeHowToPlayPanel());
      }
      if (this.dom.howToBackdrop) {
        this.dom.howToBackdrop.addEventListener('click', () => this.closeHowToPlayPanel());
      }

      // Bottom 3 Utility Buttons
      if (this.dom.btnMenuStats) {
        this.dom.btnMenuStats.addEventListener('click', () => {
          this.renderStats();
          this.openModal(this.dom.modalStats);
        });
      }
      if (this.dom.btnMenuShare) {
        this.dom.btnMenuShare.addEventListener('click', () => this.shareProgress());
      }
      if (this.dom.btnMenuPlus) {
        this.dom.btnMenuPlus.addEventListener('click', () => {
          if (PLUS_BUTTON_ACTION.url) {
            window.open(PLUS_BUTTON_ACTION.url, '_blank', 'noopener,noreferrer');
          } else {
            this.showFeedback(PLUS_BUTTON_ACTION.fallbackMessage, 'success');
          }
        });
      }

      // Settings Toggles
      if (this.dom.btnToggleAnimation) {
        this.dom.btnToggleAnimation.addEventListener('click', () => {
          this.settings.bgAnimation = !this.settings.bgAnimation;
          this.saveSettings();
          this.updateSettingsUi();
          this.atmosphere.setEnabled(this.settings.bgAnimation);
        });
      }

      if (this.dom.btnToggleHaptics) {
        this.dom.btnToggleHaptics.addEventListener('click', () => {
          this.settings.haptics = !this.settings.haptics;
          this.saveSettings();
          this.updateSettingsUi();
          if (this.settings.haptics) this.triggerHaptic(20);
        });
      }

      // Back Buttons
      if (this.dom.btnGameBack) {
        this.dom.btnGameBack.addEventListener('click', () => {
          this.switchView(this.previousView === 'vault' ? 'vault' : 'menu');
        });
      }
      if (this.dom.btnVaultBack) {
        this.dom.btnVaultBack.addEventListener('click', () => {
          this.switchView('menu');
        });
      }

      // Vault Filter Buttons
      if (this.dom.vaultFilterBtns) {
        this.dom.vaultFilterBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            this.dom.vaultFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.vaultFilter = btn.getAttribute('data-filter') || 'all';
            this.renderVault();
          });
        });
      }

      // Vault Card Click
      if (this.dom.vaultGrid) {
        this.dom.vaultGrid.addEventListener('click', (e) => {
          const card = e.target.closest('.vault-card');
          if (!card) return;
          const date = card.getAttribute('data-date');
          const puzzle = this.puzzles.find(p => p.date === date);
          if (puzzle) {
            this.loadPuzzle(puzzle);
            this.switchView('game');
          }
        });
        this.dom.vaultGrid.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            const card = e.target.closest('.vault-card');
            if (card) {
              e.preventDefault();
              card.click();
            }
          }
        });
      }

      // Found Words Sort
      if (this.dom.btnSortAlpha) {
        this.dom.btnSortAlpha.addEventListener('click', () => {
          this.sortMode = 'alpha';
          this.dom.btnSortAlpha.classList.add('active');
          this.dom.btnSortRecent.classList.remove('active');
          this.renderFoundList();
        });
      }
      if (this.dom.btnSortRecent) {
        this.dom.btnSortRecent.addEventListener('click', () => {
          this.sortMode = 'recent';
          this.dom.btnSortRecent.classList.add('active');
          this.dom.btnSortAlpha.classList.remove('active');
          this.renderFoundList();
        });
      }

      // Word Definition Lookups
      if (this.dom.foundList) {
        this.dom.foundList.addEventListener('click', (e) => {
          const item = e.target.closest('.found-item');
          if (item) {
            const word = item.getAttribute('data-word');
            if (word) this.openWordDefinition(word);
          }
        });
      }

      // Vault Unfound Words Reveal
      if (this.dom.btnVaultReveal) {
        this.dom.btnVaultReveal.addEventListener('click', () => {
          if (!this.activePuzzle) return;
          if (confirm('Reveal all remaining unfound words for this archived puzzle?')) {
            const unfound = this.activePuzzle.words.filter(w => !this.foundWords.includes(w));
            this.revealedMissedWords = unfound;
            this.renderFoundList();
            this.dom.btnVaultReveal.hidden = true;
          }
        });
      }

      // Hints Modes
      if (this.dom.btnHintsModeRemaining) {
        this.dom.btnHintsModeRemaining.addEventListener('click', () => {
          this.hintsMode = 'remaining';
          this.dom.btnHintsModeRemaining.classList.add('active');
          this.dom.btnHintsModeTotal.classList.remove('active');
          this.renderHints();
        });
      }
      if (this.dom.btnHintsModeTotal) {
        this.dom.btnHintsModeTotal.addEventListener('click', () => {
          this.hintsMode = 'total';
          this.dom.btnHintsModeTotal.classList.add('active');
          this.dom.btnHintsModeRemaining.classList.remove('active');
          this.renderHints();
        });
      }

      // Gameplay Header Tools
      if (this.dom.btnGameStats) {
        this.dom.btnGameStats.addEventListener('click', () => {
          this.renderStats();
          this.openModal(this.dom.modalStats);
        });
      }
      if (this.dom.btnGameHints) {
        this.dom.btnGameHints.addEventListener('click', () => {
          this.renderHints();
          this.openModal(this.dom.modalHints);
        });
      }
      if (this.dom.btnGameShare) {
        this.dom.btnGameShare.addEventListener('click', () => this.shareProgress());
      }

      // Backup Export/Import
      if (this.dom.btnExportData) this.dom.btnExportData.addEventListener('click', () => this.exportBackupData());
      if (this.dom.btnImportData) this.dom.btnImportData.addEventListener('click', () => this.importBackupData());

      // Modal Close Listeners
      document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
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
      if (this.dom.foundToggle) {
        this.dom.foundToggle.addEventListener('click', () => {
          const isHidden = this.dom.foundListWrap.hidden;
          this.dom.foundListWrap.hidden = !isHidden;
          this.dom.foundToggle.setAttribute('aria-expanded', String(isHidden));
          if (this.dom.foundToggleIcon) {
            this.dom.foundToggleIcon.textContent = isHidden ? '▲' : '▼';
          }
        });
      }

      // Hexagon Letters (Single-Tap immediate input)
      if (this.dom.cellCenter) {
        this.dom.cellCenter.addEventListener('click', () => {
          if (this.activePuzzle) {
            this.triggerHaptic(14);
            this.addLetter(this.activePuzzle.centerLetter);
          }
        });
      }

      this.dom.outerCells.forEach(cell => {
        if (cell) {
          cell.addEventListener('click', () => {
            const letter = cell.getAttribute('data-letter');
            if (letter) {
              this.triggerHaptic(12);
              this.addLetter(letter);
            }
          });
        }
      });

      if (this.dom.btnQuickClear) {
        this.dom.btnQuickClear.addEventListener('click', () => {
          this.triggerHaptic(15);
          this.clearInput();
        });
      }

      if (this.dom.btnDelete) {
        const startHold = () => {
          this.deleteHoldTimer = setTimeout(() => {
            this.triggerHaptic(30);
            this.clearInput();
            this.deleteHoldTimer = null;
          }, 450);
        };
        const endHold = () => {
          if (this.deleteHoldTimer) {
            clearTimeout(this.deleteHoldTimer);
            this.deleteHoldTimer = null;
          }
        };

        this.dom.btnDelete.addEventListener('mousedown', startHold);
        this.dom.btnDelete.addEventListener('touchstart', startHold, { passive: true });
        this.dom.btnDelete.addEventListener('mouseup', endHold);
        this.dom.btnDelete.addEventListener('mouseleave', endHold);
        this.dom.btnDelete.addEventListener('touchend', endHold);

        this.dom.btnDelete.addEventListener('click', () => {
          this.triggerHaptic(8);
          this.deleteLetter();
        });
      }

      if (this.dom.btnShuffle) {
        this.dom.btnShuffle.addEventListener('click', () => {
          this.triggerHaptic(16);
          this.shuffleLetters();
        });
      }

      if (this.dom.btnEnter) {
        this.dom.btnEnter.addEventListener('click', () => this.submitWord());
      }

      if (this.dom.hiveBoard) {
        this.dom.hiveBoard.addEventListener('keydown', (e) => this.handleHiveSpatialNav(e));
      }

      // Keyboard support
      window.addEventListener('keydown', e => {
        const activeOverlay = !this.dom.howToOverlay.hidden;
        if (e.key === 'Escape') {
          if (activeOverlay) {
            this.closeHowToPlayPanel();
            return;
          }
          const activeModal = document.querySelector('.modal-backdrop:not([hidden])');
          if (activeModal) {
            this.closeModal(activeModal);
            return;
          }
        }

        const activeModal = document.querySelector('.modal-backdrop:not([hidden])');
        if (activeModal || activeOverlay) return;

        if (this.currentView !== 'game' || !this.activePuzzle) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        const key = e.key.toUpperCase();
        if (/^[A-Z]$/.test(key)) {
          e.preventDefault();
          this.handleKeyStroke(key);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          this.deleteLetter();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.submitWord();
        } else if (e.key === ' ' || e.key === '/') {
          e.preventDefault();
          this.shuffleLetters();
        }
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.releaseSystem.syncTime().then(() => {
            this.releaseSystem.checkDayRollover();
          });
        }
      });

      setInterval(() => {
        this.releaseSystem.checkDayRollover();
      }, 60000);
    }

    triggerHaptic(ms = 12) {
      if (!this.settings.haptics) return;
      if ('vibrate' in navigator) {
        try { navigator.vibrate(ms); } catch (e) {}
      }
    }

    openHowToPlayPanel() {
      if (!this.dom.howToOverlay) return;
      this.lastFocusedElement = document.activeElement;
      this.dom.howToOverlay.hidden = false;
      this.dom.howToOverlay.setAttribute('aria-hidden', 'false');

      // Force layout recalculation before triggering transition class
      void this.dom.howToPanel.offsetWidth;
      this.dom.howToOverlay.classList.add('open');

      if (this.dom.btnHowToBack) this.dom.btnHowToBack.focus();
    }

    closeHowToPlayPanel() {
      if (!this.dom.howToOverlay) return;
      this.dom.howToOverlay.classList.remove('open');

      setTimeout(() => {
        this.dom.howToOverlay.hidden = true;
        this.dom.howToOverlay.setAttribute('aria-hidden', 'true');
        if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
          this.lastFocusedElement.focus();
        }
      }, 380);
    }

    updateSettingsUi() {
      if (this.dom.btnToggleAnimation) {
        const on = this.settings.bgAnimation;
        this.dom.btnToggleAnimation.setAttribute('aria-checked', String(on));
        const txt = this.dom.btnToggleAnimation.querySelector('.toggle-state-text');
        if (txt) txt.textContent = on ? 'ON' : 'OFF';
      }
      if (this.dom.btnToggleHaptics) {
        const on = this.settings.haptics;
        this.dom.btnToggleHaptics.setAttribute('aria-checked', String(on));
        const txt = this.dom.btnToggleHaptics.querySelector('.toggle-state-text');
        if (txt) txt.textContent = on ? 'ON' : 'OFF';
      }
    }

    async init() {
      this.updateSettingsUi();
      await this.releaseSystem.syncTime();

      try {
        const res = await fetch(CSV_PATH, { cache: 'no-store' });
        if (!res.ok) throw new Error('Network error');
        const text = await res.text();
        const parsed = this.parseCSV(text);
        if (parsed.length > 0) {
          this.puzzles = parsed;
          this.cachePuzzlesLocally(parsed);
          if (this.dom.offlineIndicator) this.dom.offlineIndicator.hidden = true;
        }
      } catch (err) {
        if (this.dom.offlineIndicator) this.dom.offlineIndicator.hidden = false;
      }

      this.determineDailyPuzzle();
      this.updateMenuDashboard();
    }

    cachePuzzlesLocally(puzzles) {
      try {
        localStorage.setItem(CACHE_PUZZLES_KEY, JSON.stringify(puzzles));
      } catch (e) {
        console.warn('Unable to cache puzzles locally:', e);
      }
    }

    loadCachedPuzzles() {
      try {
        const raw = localStorage.getItem(CACHE_PUZZLES_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (Array.isArray(cached) && cached.length > 0) {
            this.puzzles = cached;
          }
        }
      } catch (e) {}
    }

    getReleasedPuzzles() {
      const authoritativeDate = this.releaseSystem.getReleaseDateString();
      return this.puzzles.filter(p => p.date <= authoritativeDate);
    }

    determineDailyPuzzle() {
      const released = this.getReleasedPuzzles();
      if (released.length === 0) {
        this.dailyPuzzle = this.puzzles[0] || null;
        return;
      }

      const authoritativeDate = this.releaseSystem.getReleaseDateString();
      let match = released.find(p => p.date === authoritativeDate);
      if (!match) {
        const sorted = [...released].sort((a, b) => a.date.localeCompare(b.date));
        match = sorted[sorted.length - 1];
      }
      this.dailyPuzzle = match;
    }

    updateMenuDashboard() {
      if (!this.dailyPuzzle) return;

      if (this.dom.menuDailyDate) {
        this.dom.menuDailyDate.textContent = this.formatDate(this.dailyPuzzle.date);
      }
      const progress = this.storage.puzzles[this.dailyPuzzle.date] || { foundWords: [] };
      const max = SpellingBeeEngine.calculateMaxScore(this.dailyPuzzle);
      const score = SpellingBeeEngine.calculateWordsScore(progress.foundWords, this.dailyPuzzle);
      const pct = max > 0 ? Math.min(100, Math.round((score / max) * 100)) : 0;
      const rank = SpellingBeeEngine.getRank(score, max);

      if (this.dom.menuDailyStatus) {
        const qbNotice = rank.name === 'Queen Bee' ? ' 👑' : '';
        this.dom.menuDailyStatus.textContent = `${rank.name}${qbNotice} • ${progress.foundWords.length} words (${score} pts)`;
      }
      if (this.dom.menuDailyProgressFill) {
        this.dom.menuDailyProgressFill.style.width = `${pct}%`;
      }

      const released = this.getReleasedPuzzles();
      const vaultCount = Math.max(0, released.filter(p => p.date !== this.dailyPuzzle.date).length);
      if (this.dom.menuVaultCount) {
        this.dom.menuVaultCount.textContent = `${vaultCount} past`;
      }

      if (this.dom.btnPlayDailyText) {
        this.dom.btnPlayDailyText.textContent = progress.foundWords.length > 0 ? 'Continue Spelling Bee' : 'Play Spelling Bee';
      }
    }

    switchView(targetView) {
      this.previousView = this.currentView;
      this.currentView = targetView;

      if (this.dom.menuView) this.dom.menuView.hidden = targetView !== 'menu';
      if (this.dom.gameView) this.dom.gameView.hidden = targetView !== 'game';
      if (this.dom.vaultView) this.dom.vaultView.hidden = targetView !== 'vault';

      if (targetView === 'game') {
        if (this.dom.btnGameBack) {
          const backLabel = this.previousView === 'vault' ? 'Vault' : 'Menu';
          this.dom.btnGameBack.innerHTML = `<span aria-hidden="true">←</span> ${backLabel}`;
          this.dom.btnGameBack.setAttribute('aria-label', `Back to ${backLabel}`);
        }
      } else if (targetView === 'menu') {
        this.updateMenuDashboard();
      } else if (targetView === 'vault') {
        this.renderVault();
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
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

        const centerLetter = parts[1].trim().toUpperCase();
        const outerLetters = parts[2].trim().toUpperCase().replace(/[^A-Z]/g, '').split('');
        if (outerLetters.length !== 6 || centerLetter.length !== 1) continue;

        const validLetters = new Set([centerLetter, ...outerLetters]);
        if (validLetters.size !== 7) continue;

        const rawWords = parts.slice(3).join(',').replace(/["\r]/g, '').trim().toUpperCase().split(/[\s,]+/).filter(Boolean);
        const words = [...new Set(rawWords.filter(w => {
          if (w.length < 4) return false;
          if (!w.includes(centerLetter)) return false;
          return w.split('').every(ch => validLetters.has(ch));
        }))];

        if (words.length === 0) continue;

        const pangrams = words.filter(w => {
          const unique = new Set(w.split(''));
          return [centerLetter, ...outerLetters].every(c => unique.has(c));
        });

        puzzles.push({
          date,
          centerLetter,
          outerLetters,
          words,
          pangrams
        });
      }
      return puzzles;
    }

    loadPuzzle(puzzle) {
      if (!puzzle) return;

      this.activePuzzle = puzzle;
      this.outerLetters = [...puzzle.outerLetters];
      this.revealedMissedWords = [];

      const progress = this.storage.puzzles[puzzle.date] || { foundWords: [] };
      const validSet = new Set(puzzle.words);
      this.foundWords = [...new Set((progress.foundWords || []).filter(w => validSet.has(w)))];

      if (this.foundWords.length !== (progress.foundWords || []).length) {
        this.saveProgress();
      }

      this.maxScore = SpellingBeeEngine.calculateMaxScore(puzzle);
      this.score = SpellingBeeEngine.calculateWordsScore(this.foundWords, puzzle);

      const draft = sessionStorage.getItem(DRAFT_STORAGE_KEY + '_' + puzzle.date);
      this.inputWord = draft || '';

      const isDaily = this.dailyPuzzle && this.dailyPuzzle.date === puzzle.date;
      if (this.dom.gamePuzzleTitle) {
        this.dom.gamePuzzleTitle.textContent = isDaily
          ? `Daily Honeycomb • ${this.formatDate(puzzle.date)}`
          : `Vault Honeycomb • ${this.formatDate(puzzle.date)}`;
      }

      if (this.dom.btnVaultReveal) {
        this.dom.btnVaultReveal.hidden = isDaily || (this.foundWords.length === puzzle.words.length);
      }

      if (this.dom.foundListWrap) this.dom.foundListWrap.hidden = true;
      if (this.dom.foundToggle) this.dom.foundToggle.setAttribute('aria-expanded', 'false');
      if (this.dom.foundToggleIcon) this.dom.foundToggleIcon.textContent = '▼';

      if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
      if (this.dom.feedback) {
        this.dom.feedback.textContent = '';
        this.dom.feedback.className = 'feedback';
      }

      this.renderHive();
      this.renderInput();
      this.renderRank();
      this.renderFoundList();
    }

    renderRankTicks() {
      if (!this.dom.rankTicksLayer) return;
      this.dom.rankTicksLayer.innerHTML = '';
      RANKS.forEach(rank => {
        if (rank.pct > 0 && rank.pct < 1) {
          const tick = document.createElement('div');
          tick.className = 'rank-tick';
          tick.style.left = `${rank.pct * 100}%`;
          tick.setAttribute('data-rank-pct', rank.pct);
          this.dom.rankTicksLayer.appendChild(tick);
        }
      });
    }

    renderHive() {
      if (!this.activePuzzle) return;

      if (this.dom.cellCenter) {
        const svgText = this.dom.cellCenter.querySelector('.hex-svg-letter');
        if (svgText) svgText.textContent = this.activePuzzle.centerLetter;
        this.dom.cellCenter.setAttribute('data-letter', this.activePuzzle.centerLetter);
        this.dom.cellCenter.setAttribute('aria-label', `Center letter ${this.activePuzzle.centerLetter}`);
      }

      this.dom.outerCells.forEach((cell, idx) => {
        if (!cell) return;
        const letter = this.outerLetters[idx] || '';
        const svgText = cell.querySelector('.hex-svg-letter');
        if (svgText) svgText.textContent = letter;
        cell.setAttribute('data-letter', letter);
        cell.setAttribute('aria-label', `Outer letter ${letter}`);
      });
    }

    renderInput() {
      if (!this.dom.inputDisplay) return;
      this.dom.inputDisplay.innerHTML = '';
      for (const ch of this.inputWord) {
        const span = document.createElement('span');
        span.textContent = ch;
        if (this.activePuzzle && ch === this.activePuzzle.centerLetter) {
          span.classList.add('center-ch');
        }
        this.dom.inputDisplay.appendChild(span);
      }
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      cursor.setAttribute('aria-hidden', 'true');
      this.dom.inputDisplay.appendChild(cursor);

      if (this.dom.btnQuickClear) {
        this.dom.btnQuickClear.hidden = this.inputWord.length === 0;
      }
    }

    handleKeyStroke(letter) {
      if (!this.activePuzzle) return;
      const valid = [this.activePuzzle.centerLetter, ...this.activePuzzle.outerLetters];
      if (!valid.includes(letter)) {
        this.shakeInput();
        return;
      }
      this.addLetter(letter);
    }

    addLetter(letter) {
      if (!this.activePuzzle || this.inputWord.length >= 19) return;
      this.inputWord += letter;
      this.renderInput();
      this.persistDraftInput();
    }

    deleteLetter() {
      if (!this.inputWord) return;
      this.inputWord = this.inputWord.slice(0, -1);
      this.renderInput();
      this.persistDraftInput();
    }

    clearInput() {
      if (!this.inputWord) return;
      this.inputWord = '';
      this.renderInput();
      this.persistDraftInput();
    }

    persistDraftInput() {
      if (!this.activePuzzle) return;
      try {
        sessionStorage.setItem(DRAFT_STORAGE_KEY + '_' + this.activePuzzle.date, this.inputWord);
      } catch (e) {}
    }

    shuffleLetters() {
      this.dom.outerCells.forEach(cell => {
        if (!cell) return;
        cell.classList.remove('shuffling');
        void cell.offsetWidth;
        cell.classList.add('shuffling');
      });

      const initial = this.outerLetters.join('');
      let attempts = 0;
      do {
        for (let i = this.outerLetters.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.outerLetters[i], this.outerLetters[j]] = [this.outerLetters[j], this.outerLetters[i]];
        }
        attempts++;
      } while (this.outerLetters.join('') === initial && attempts < 10);

      this.renderHive();
      this.announceScreenReader('Letters shuffled');
    }

    submitWord() {
      if (!this.activePuzzle || this.isSubmitting) return;
      this.isSubmitting = true;

      const result = SpellingBeeEngine.validateWord(
        this.inputWord,
        this.activePuzzle,
        this.foundWords
      );

      if (!result.valid) {
        this.showFeedback(result.error, 'error');
        this.shakeInput();
        this.announceScreenReader(`Word rejected: ${result.error}`);
        setTimeout(() => { this.isSubmitting = false; }, 180);
        return;
      }

      const { word, points, isPangram, isPerfectPangram } = result;
      const prevRank = SpellingBeeEngine.getRank(this.score, this.maxScore);

      this.foundWords.push(word);
      this.score += points;
      this.inputWord = '';
      this.persistDraftInput();

      this.saveProgress();
      this.updateStreakIfNeeded();

      let feedbackMsg = `+${points}`;
      let feedbackType = 'success';

      if (isPerfectPangram) {
        feedbackMsg = `Perfect Pangram! +${points}`;
        feedbackType = 'perfect-pangram';
      } else if (isPangram) {
        feedbackMsg = `Pangram! +${points}`;
        feedbackType = 'pangram';
      }

      if (isPangram && this.dom.inputDisplay) {
        this.dom.inputDisplay.classList.add('pangram-glow');
      }

      this.showFeedback(feedbackMsg, feedbackType);
      this.renderInput();
      this.renderRank();
      this.renderFoundList(word);

      const newRank = SpellingBeeEngine.getRank(this.score, this.maxScore);
      if (newRank.name !== prevRank.name && this.dom.rankStrip) {
        this.dom.rankStrip.classList.remove('rank-pulse');
        void this.dom.rankStrip.offsetWidth;
        this.dom.rankStrip.classList.add('rank-pulse');
        if (newRank.name !== 'Queen Bee') {
          setTimeout(() => {
            this.showFeedback(`Rank Up: ${newRank.name}!`, 'success');
          }, 1100);
        }
      }

      this.announceScreenReader(`Accepted: ${word}. Plus ${points} points. Total: ${this.score} points, ${newRank.name}.`);

      if (this.score >= this.maxScore && this.maxScore > 0) {
        setTimeout(() => this.openModal(this.dom.modalQueenBee), 500);
      }

      setTimeout(() => { this.isSubmitting = false; }, 200);
    }

    shakeInput() {
      if (this.dom.inputDisplay) {
        this.dom.inputDisplay.classList.remove('shake');
        void this.dom.inputDisplay.offsetWidth;
        this.dom.inputDisplay.classList.add('shake');
      }
    }

    renderRank() {
      const rank = SpellingBeeEngine.getRank(this.score, this.maxScore);
      const pct = this.maxScore > 0 ? Math.min(100, Math.round((this.score / this.maxScore) * 100)) : 0;

      if (this.dom.rankName) this.dom.rankName.textContent = rank.name;
      if (this.dom.currentScore) this.dom.currentScore.textContent = this.score;
      if (this.dom.maxScore) this.dom.maxScore.textContent = this.maxScore;
      if (this.dom.rankFill) this.dom.rankFill.style.width = `${pct}%`;

      if (this.dom.rankTicksLayer) {
        const ticks = this.dom.rankTicksLayer.querySelectorAll('.rank-tick');
        ticks.forEach(tick => {
          const tPct = parseFloat(tick.getAttribute('data-rank-pct') || '0') * 100;
          if (pct >= tPct) {
            tick.classList.add('passed');
          } else {
            tick.classList.remove('passed');
          }
        });
      }

      if (this.dom.badgeQueenBee) {
        this.dom.badgeQueenBee.hidden = rank.name !== 'Queen Bee';
      }

      if (this.dom.rankProgressBar) {
        this.dom.rankProgressBar.setAttribute('aria-valuenow', pct);
        this.dom.rankProgressBar.setAttribute('aria-valuetext', `${rank.name}, ${this.score} of ${this.maxScore} points`);
      }
    }

    renderFoundList(recentlyAddedWord = null) {
      if (this.dom.foundCount) this.dom.foundCount.textContent = this.foundWords.length;
      if (!this.dom.foundList) return;

      this.dom.foundList.innerHTML = '';

      if (this.foundWords.length === 0 && this.revealedMissedWords.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-found-msg';
        empty.textContent = 'No words found yet.';
        this.dom.foundList.appendChild(empty);
        return;
      }

      const displayList = this.sortMode === 'recent'
        ? [...this.foundWords].reverse()
        : [...this.foundWords].sort();

      displayList.forEach(w => {
        const item = document.createElement('span');
        item.className = 'found-item';
        item.setAttribute('data-word', w);
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');

        const isPangram = this.activePuzzle && this.activePuzzle.pangrams.includes(w);
        const isPerfect = isPangram && w.length === 7;

        if (isPerfect) {
          item.classList.add('is-perfect-pangram');
          item.setAttribute('title', `${w}: Perfect Pangram (Tap for definition)`);
        } else if (isPangram) {
          item.classList.add('is-pangram');
          item.setAttribute('title', `${w}: Pangram (Tap for definition)`);
        } else {
          item.setAttribute('title', `${w} (Tap for definition)`);
        }

        if (w === recentlyAddedWord) {
          item.classList.add('highlight-new');
        }

        item.textContent = w;
        this.dom.foundList.appendChild(item);
      });

      if (this.revealedMissedWords.length > 0) {
        this.revealedMissedWords.sort().forEach(w => {
          const item = document.createElement('span');
          item.className = 'found-item is-revealed-missed';
          item.setAttribute('data-word', w);
          item.setAttribute('role', 'button');
          item.setAttribute('tabindex', '0');
          item.setAttribute('title', `${w} (Missed word - Tap for definition)`);
          item.textContent = w + ' ✕';
          this.dom.foundList.appendChild(item);
        });
      }
    }

    showFeedback(message, type) {
      if (!this.dom.feedback) return;
      clearTimeout(this.feedbackTimer);

      this.dom.feedback.textContent = message;
      this.dom.feedback.className = `feedback ${type} active`;

      this.feedbackTimer = setTimeout(() => {
        if (this.dom.feedback) {
          this.dom.feedback.classList.remove('active');
        }
      }, 1600);
    }

    announceScreenReader(message) {
      if (this.dom.srAnnouncer) {
        this.dom.srAnnouncer.textContent = message;
      }
    }

    async openWordDefinition(word) {
      if (!this.dom.modalDefinition) return;
      if (this.dom.defWordTitle) this.dom.defWordTitle.textContent = word;
      if (this.dom.defMeta) this.dom.defMeta.textContent = 'Looking up dictionary definition...';
      if (this.dom.defMeaningText) this.dom.defMeaningText.textContent = 'Please wait...';
      if (this.dom.defExternalLink) {
        this.dom.defExternalLink.setAttribute('href', `https://en.wiktionary.org/wiki/${encodeURIComponent(word.toLowerCase())}`);
      }

      this.openModal(this.dom.modalDefinition);

      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`);
        if (!res.ok) throw new Error('No definition found');
        const data = await res.json();
        const entry = data[0];
        const part = entry?.meanings?.[0]?.partOfSpeech || 'word';
        const def = entry?.meanings?.[0]?.definitions?.[0]?.definition || 'Definition available on Wiktionary.';

        if (this.dom.defMeta) this.dom.defMeta.textContent = `Part of speech: ${part}`;
        if (this.dom.defMeaningText) this.dom.defMeaningText.textContent = def;
      } catch (err) {
        if (this.dom.defMeta) this.dom.defMeta.textContent = 'Dictionary lookup unavailable';
        if (this.dom.defMeaningText) {
          this.dom.defMeaningText.textContent = `"${word}" is a valid solution in today's puzzle. You can view full etymology and usage notes on Wiktionary.`;
        }
      }
    }

    renderHints() {
      if (!this.activePuzzle) return;
      const puzzle = this.activePuzzle;
      const remaining = puzzle.words.filter(w => !this.foundWords.includes(w));
      const pangramCount = puzzle.pangrams.length;
      const pangramsFound = this.foundWords.filter(w => puzzle.pangrams.includes(w)).length;

      if (this.dom.hintsSummary) {
        this.dom.hintsSummary.innerHTML = `
          <strong>Total Words:</strong> ${puzzle.words.length} (${this.foundWords.length} found, ${remaining.length} remaining)<br>
          <strong>Total Points:</strong> ${this.maxScore} (${this.score} current)<br>
          <strong>Pangrams:</strong> ${pangramCount} (${pangramsFound} found)
        `;
      }

      const activeWordList = this.hintsMode === 'remaining' ? remaining : puzzle.words;
      const lengths = [...new Set(puzzle.words.map(w => w.length))].sort((a, b) => a - b);
      const letters = [puzzle.centerLetter, ...puzzle.outerLetters].sort();

      let tableHtml = `<thead><tr><th></th>`;
      lengths.forEach(l => { tableHtml += `<th>${l}</th>`; });
      tableHtml += `<th>Total</th></tr></thead><tbody>`;

      const colTotals = {};
      lengths.forEach(l => colTotals[l] = 0);
      let grandTotal = 0;

      letters.forEach(ltr => {
        const wordsForLtr = activeWordList.filter(w => w.startsWith(ltr));
        tableHtml += `<tr><th>${ltr}</th>`;
        let rowSum = 0;
        lengths.forEach(len => {
          const count = wordsForLtr.filter(w => w.length === len).length;
          const isComplete = this.hintsMode === 'remaining' && count === 0;
          tableHtml += `<td class="${isComplete ? 'cell-complete' : ''}">${count > 0 ? count : (isComplete ? '✓' : '-')}</td>`;
          colTotals[len] += count;
          rowSum += count;
        });
        tableHtml += `<td><strong>${rowSum}</strong></td></tr>`;
        grandTotal += rowSum;
      });

      tableHtml += `<tr class="total-row"><th>Total</th>`;
      lengths.forEach(len => {
        tableHtml += `<td>${colTotals[len]}</td>`;
      });
      tableHtml += `<td>${grandTotal}</td></tr></tbody>`;

      if (this.dom.hintsTable) {
        this.dom.hintsTable.innerHTML = tableHtml;
      }

      const prefixMap = {};
      const remainingPrefixMap = {};

      puzzle.words.forEach(w => {
        const pref = w.slice(0, 2);
        prefixMap[pref] = (prefixMap[pref] || 0) + 1;
      });

      remaining.forEach(w => {
        const pref = w.slice(0, 2);
        remainingPrefixMap[pref] = (remainingPrefixMap[pref] || 0) + 1;
      });

      if (this.dom.hintsTwoLetter) {
        this.dom.hintsTwoLetter.innerHTML = Object.entries(prefixMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([pref, cnt]) => {
            const remCnt = remainingPrefixMap[pref] || 0;
            const isDone = remCnt === 0;
            const displayCount = this.hintsMode === 'remaining' ? remCnt : cnt;
            return `<span class="two-letter-chip ${isDone ? 'chip-done' : ''}">${pref}-${displayCount}</span>`;
          })
          .join('');
      }
    }

    renderVault() {
      if (!this.dom.vaultGrid) return;
      this.dom.vaultGrid.innerHTML = '';

      const released = this.getReleasedPuzzles();
      let vaultPuzzles = released
        .filter(p => !this.dailyPuzzle || p.date !== this.dailyPuzzle.date)
        .sort((a, b) => b.date.localeCompare(a.date));

      if (this.vaultFilter === 'unplayed') {
        vaultPuzzles = vaultPuzzles.filter(p => !(this.storage.puzzles[p.date]?.foundWords?.length > 0));
      } else if (this.vaultFilter === 'inprogress') {
        vaultPuzzles = vaultPuzzles.filter(p => {
          const count = this.storage.puzzles[p.date]?.foundWords?.length || 0;
          return count > 0 && count < p.words.length;
        });
      } else if (this.vaultFilter === 'completed') {
        vaultPuzzles = vaultPuzzles.filter(p => {
          const prog = this.storage.puzzles[p.date];
          if (!prog || !prog.foundWords) return false;
          const score = SpellingBeeEngine.calculateWordsScore(prog.foundWords, p);
          const max = SpellingBeeEngine.calculateMaxScore(p);
          const rank = SpellingBeeEngine.getRank(score, max);
          return rank.pct >= 0.85;
        });
      }

      if (this.dom.vaultHeaderCount) {
        this.dom.vaultHeaderCount.textContent = vaultPuzzles.length;
      }

      if (vaultPuzzles.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-found-msg';
        empty.textContent = 'No matching puzzles in archive.';
        this.dom.vaultGrid.appendChild(empty);
        return;
      }

      vaultPuzzles.forEach(puzzle => {
        const card = document.createElement('div');
        card.className = 'vault-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('data-date', puzzle.date);
        card.setAttribute('aria-label', `Play honeycomb from ${this.formatDate(puzzle.date)}`);

        const prog = this.storage.puzzles[puzzle.date] || { foundWords: [] };
        const max = SpellingBeeEngine.calculateMaxScore(puzzle);
        const score = SpellingBeeEngine.calculateWordsScore(prog.foundWords, puzzle);
        const rank = SpellingBeeEngine.getRank(score, max);

        const isQB = rank.name === 'Queen Bee';
        const isGenius = rank.pct >= 0.85 && !isQB;

        card.innerHTML = `
          <div class="vault-card-info">
            <span class="vault-date">${this.formatDate(puzzle.date)}</span>
            <span class="vault-letters">
              <span class="center-ltr">${puzzle.centerLetter}</span> ${puzzle.outerLetters.join(' ')}
            </span>
          </div>
          <div class="vault-card-right">
            <span class="vault-progress-tag ${isQB ? 'queen-bee' : (isGenius ? 'completed' : '')}">
              ${isQB ? '👑 ' : ''}${prog.foundWords.length}/${puzzle.words.length} • ${rank.name}
            </span>
          </div>
        `;

        this.dom.vaultGrid.appendChild(card);
      });
    }

    calculateDerivedStats() {
      let totalWords = 0;
      let totalPoints = 0;
      let totalPangrams = 0;
      let playedCount = 0;

      for (const [date, entry] of Object.entries(this.storage.puzzles)) {
        if (entry && entry.foundWords && entry.foundWords.length > 0) {
          playedCount++;
          totalWords += entry.foundWords.length;
          const puzzle = this.puzzles.find(p => p.date === date);
          if (puzzle) {
            totalPoints += SpellingBeeEngine.calculateWordsScore(entry.foundWords, puzzle);
            totalPangrams += entry.foundWords.filter(w => puzzle.pangrams.includes(w)).length;
          }
        }
      }

      return {
        played: playedCount,
        words: totalWords,
        points: totalPoints,
        pangrams: totalPangrams
      };
    }

    renderStats() {
      const derived = this.calculateDerivedStats();
      const s = this.storage.stats;

      if (this.dom.statPlayed) this.dom.statPlayed.textContent = derived.played;
      if (this.dom.statWords) this.dom.statWords.textContent = derived.words;
      if (this.dom.statPangrams) this.dom.statPangrams.textContent = derived.pangrams;
      if (this.dom.statPoints) this.dom.statPoints.textContent = derived.points;
      if (this.dom.statCurrentStreak) this.dom.statCurrentStreak.textContent = s.currentStreak;
      if (this.dom.statMaxStreak) this.dom.statMaxStreak.textContent = s.maxStreak;
    }

    updateStreakIfNeeded() {
      if (!this.activePuzzle || !this.dailyPuzzle || this.activePuzzle.date !== this.dailyPuzzle.date) return;

      const rank = SpellingBeeEngine.getRank(this.score, this.maxScore);
      if (rank.pct < 0.26) return;

      const stats = this.storage.stats;
      const today = this.dailyPuzzle.date;

      if (stats.lastCompletedDailyDate === today) return;

      if (stats.lastCompletedDailyDate) {
        const last = new Date(stats.lastCompletedDailyDate + 'T00:00:00');
        const curr = new Date(today + 'T00:00:00');
        const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          stats.currentStreak += 1;
        } else if (diffDays === 2 && (stats.graceDaysRemaining || 0) > 0) {
          stats.graceDaysRemaining -= 1;
          stats.currentStreak += 1;
          this.showFeedback('Streak Shield Protected!', 'success');
        } else if (diffDays > 1) {
          stats.currentStreak = 1;
        }
      } else {
        stats.currentStreak = 1;
      }

      stats.lastCompletedDailyDate = today;
      stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
      this.saveSafeStorage();
    }

    shareProgress() {
      const puzzle = this.activePuzzle || this.dailyPuzzle;
      if (!puzzle) return;

      const rank = SpellingBeeEngine.getRank(this.score, this.maxScore);
      const pangramCount = puzzle.pangrams.length;
      const pangramsFound = this.foundWords.filter(w => puzzle.pangrams.includes(w)).length;

      const summaryText = [
        `🐝 Spelling Bee • ${this.formatDate(puzzle.date)}`,
        `Rank: ${rank.name} (${this.score} pts)`,
        `Words: ${this.foundWords.length}/${puzzle.words.length}`,
        `Pangrams: ${pangramsFound}/${pangramCount} ${'★'.repeat(pangramsFound)}`
      ].join('\n');

      if (navigator.share) {
        navigator.share({
          title: 'Spelling Bee Daily Progress',
          text: summaryText
        }).catch(() => {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summaryText).then(() => {
          this.showFeedback('Progress copied to clipboard!', 'success');
        }).catch(() => {
          this.showFeedback('Unable to copy to clipboard', 'error');
        });
      }
    }

    exportBackupData() {
      if (!this.dom.backupPayloadArea) return;
      const json = JSON.stringify(this.storage, null, 2);
      this.dom.backupPayloadArea.hidden = false;
      this.dom.backupPayloadArea.value = json;
      this.dom.backupPayloadArea.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json);
        this.showFeedback('Backup copied to clipboard!', 'success');
      }
    }

    importBackupData() {
      if (!this.dom.backupPayloadArea) return;
      if (this.dom.backupPayloadArea.hidden) {
        this.dom.backupPayloadArea.hidden = false;
        this.dom.backupPayloadArea.value = '';
        this.dom.backupPayloadArea.focus();
        this.showFeedback('Paste backup text and click Import again', 'success');
        return;
      }

      try {
        const text = this.dom.backupPayloadArea.value.trim();
        if (!text) return;
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object' && parsed.stats) {
          this.storage = {
            version: 5,
            stats: {
              currentStreak: Number(parsed.stats.currentStreak) || 0,
              maxStreak: Number(parsed.stats.maxStreak) || 0,
              lastCompletedDailyDate: parsed.stats.lastCompletedDailyDate || null,
              graceDaysRemaining: Number(parsed.stats.graceDaysRemaining) ?? 1
            },
            puzzles: parsed.puzzles || {}
          };
          this.saveSafeStorage();
          this.renderStats();
          this.showFeedback('Backup restored successfully!', 'success');
          this.dom.backupPayloadArea.hidden = true;
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        this.showFeedback('Invalid backup text data', 'error');
      }
    }

    handleHiveSpatialNav(e) {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();

      const active = document.activeElement;
      const id = active?.id;

      const navMap = {
        'cell-0': { ArrowRight: 'cell-1', ArrowDown: 'cell-2', ArrowLeft: 'cell-1' },
        'cell-1': { ArrowLeft: 'cell-0', ArrowDown: 'cellCenter', ArrowRight: 'cell-0' },
        'cell-2': { ArrowUp: 'cell-0', ArrowRight: 'cellCenter', ArrowDown: 'cell-4' },
        'cellCenter': { ArrowLeft: 'cell-2', ArrowRight: 'cell-3', ArrowUp: 'cell-0', ArrowDown: 'cell-4' },
        'cell-3': { ArrowLeft: 'cellCenter', ArrowUp: 'cell-1', ArrowDown: 'cell-5' },
        'cell-4': { ArrowUp: 'cell-2', ArrowRight: 'cell-5', ArrowLeft: 'cell-5' },
        'cell-5': { ArrowUp: 'cell-3', ArrowLeft: 'cell-4', ArrowRight: 'cell-4' }
      };

      const targetId = navMap[id]?.[e.key];
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) el.focus();
      }
    }

    openModal(modal) {
      if (!modal) return;
      this.lastFocusedElement = document.activeElement;
      modal.hidden = false;
      if (this.dom.appRoot) {
        const views = this.dom.appRoot.querySelectorAll('.view');
        views.forEach(v => v.setAttribute('aria-hidden', 'true'));
      }
      const firstBtn = modal.querySelector('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstBtn) firstBtn.focus();
    }

    closeModal(modal) {
      if (!modal) return;
      modal.hidden = true;
      if (this.dom.appRoot) {
        const views = this.dom.appRoot.querySelectorAll('.view');
        views.forEach(v => v.removeAttribute('aria-hidden'));
      }
      if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
        this.lastFocusedElement.focus();
      }
    }

    formatDate(dateStr) {
      if (!dateStr) return '';
      const [y, m, d] = dateStr.split('-');
      const date = new Date(+y, +m - 1, +d);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    loadSettings() {
      const fallback = {
        bgAnimation: true,
        haptics: true
      };
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            bgAnimation: parsed.bgAnimation !== false,
            haptics: parsed.haptics !== false
          };
        }
      } catch (e) {}
      return fallback;
    }

    saveSettings() {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      } catch (e) {
        console.warn('Unable to save settings:', e);
      }
    }

    loadSafeStorage() {
      const fallback = {
        version: 5,
        stats: {
          currentStreak: 0,
          maxStreak: 0,
          lastCompletedDailyDate: null,
          graceDaysRemaining: 1
        },
        puzzles: {}
      };

      try {
        let raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) raw = localStorage.getItem('spelling_bee_save_v4');
        if (!raw) return fallback;

        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return fallback;

        return {
          version: 5,
          stats: {
            currentStreak: Number(data.stats?.currentStreak) || 0,
            maxStreak: Number(data.stats?.maxStreak) || 0,
            lastCompletedDailyDate: data.stats?.lastCompletedDailyDate || null,
            graceDaysRemaining: Number(data.stats?.graceDaysRemaining) ?? 1
          },
          puzzles: (data.puzzles && typeof data.puzzles === 'object') ? data.puzzles : {}
        };
      } catch (err) {
        return fallback;
      }
    }

    saveSafeStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.storage));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
    }

    saveProgress() {
      if (!this.activePuzzle) return;
      if (!this.storage.puzzles[this.activePuzzle.date]) {
        this.storage.puzzles[this.activePuzzle.date] = { foundWords: [] };
      }
      this.storage.puzzles[this.activePuzzle.date].foundWords = [...this.foundWords];
      this.saveSafeStorage();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SpellingBeeApp());
  } else {
    new SpellingBeeApp();
  }
})();