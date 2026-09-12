(function () {
  'use strict';

  const CONFIG = {
    puzzleCsvPath: './puzzles.csv',
    anchorReleaseDate: '2026-09-08',
    releaseTimeZone: 'Europe/London'
  };

  const STORAGE_KEY = '86_SPELLING_BEE_DATA_V2';

  const RANK_TIERS = [
    { name: 'Barback', minPct: 0 },
    { name: 'Novice', minPct: 0.03 },
    { name: 'Pourer', minPct: 0.08 },
    { name: 'Line Bartender', minPct: 0.16 },
    { name: 'Mixologist', minPct: 0.26 },
    { name: 'Senior Mixologist', minPct: 0.40 },
    { name: 'Head Bartender', minPct: 0.55 },
    { name: 'Beverage Director', minPct: 0.70 },
    { name: 'Cocktail Legend', minPct: 0.85 }
  ];

  class ReleaseEngine {
    constructor() {
      this.status = 'INIT';
      this.errorMessage = '';
      this.currentRelease = null;
      this.vaultReleases = [];
      this.todayDateStr = '';
    }

    async initialize() {
      try {
        const csvText = await this.fetchCSV();
        const allRows = this.parseCSV(csvText);

        const timestamp = await this.fetchAuthoritativeTime();
        if (!timestamp) {
          throw new Error("Today's puzzle could not be verified.");
        }

        this.todayDateStr = this.getUkDateString(timestamp);
        this.classifyReleases(allRows, this.todayDateStr);
        this.status = 'READY';

      } catch (err) {
        this.status = 'ERROR';
        this.errorMessage = err.message || "Puzzle data could not be loaded.";
      }
    }

    async fetchCSV() {
      const res = await fetch(`${CONFIG.puzzleCsvPath}?cb=${Date.now()}`);
      if (!res.ok) throw new Error("Puzzle data could not be loaded.");
      return await res.text();
    }

    async fetchAuthoritativeTime() {
      try {
        const res = await fetch(`./index.html?cb=${Date.now()}`, { method: 'GET', cache: 'no-store' });
        const dateStr = res.headers.get('Date');
        if (!dateStr) return null;
        const ts = Date.parse(dateStr);
        return isNaN(ts) ? null : ts;
      } catch (e) {
        return null;
      }
    }

    getUkDateString(timestamp) {
      const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: CONFIG.releaseTimeZone,
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
      const parts = fmt.formatToParts(new Date(timestamp));
      const y = parts.find(p => p.type === 'year').value;
      const m = parts.find(p => p.type === 'month').value;
      const d = parts.find(p => p.type === 'day').value;
      return `${y}-${m}-${d}`;
    }

    parseCSV(text) {
      const rows = [];
      let currentRow = [];
      let currentCell = '';
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const nextC = text[i + 1];
        if (inQuotes) {
          if (c === '"' && nextC === '"') {
            currentCell += '"';
            i++;
          } else if (c === '"') {
            inQuotes = false;
          } else {
            currentCell += c;
          }
        } else {
          if (c === '"') {
            inQuotes = true;
          } else if (c === ',') {
            currentRow.push(currentCell);
            currentCell = '';
          } else if (c === '\n' || c === '\r') {
            if (c === '\r' && nextC === '\n') i++;
            currentRow.push(currentCell);
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
          } else {
            currentCell += c;
          }
        }
      }
      if (currentCell || text[text.length - 1] === ',') currentRow.push(currentCell);
      if (currentRow.length > 0) rows.push(currentRow);

      if (rows.length === 0) throw new Error("Empty CSV");
      const headers = rows[0].map(h => h.trim());
      if (headers[0] !== 'release_date') throw new Error("First column must be release_date");

      const data = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 1 && !row[0]) continue;
        if (row.length !== headers.length) throw new Error(`Row ${i} length mismatch`);
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = row[idx].trim(); });
        if (!/^\d{4}-\d{2}-\d{2}$/.test(obj.release_date)) throw new Error(`Invalid date format: ${obj.release_date}`);
        data.push(obj);
      }
      return data;
    }

    classifyReleases(puzzles, todayDate) {
      const currentRows = puzzles.filter(p => p.release_date === todayDate);
      if (currentRows.length === 0) throw new Error("Today's puzzle is not available.");
      if (currentRows.length > 1) throw new Error("Today's puzzle could not be verified.");

      this.currentRelease = this.mapToGameFormat(currentRows[0]);
      
      this.vaultReleases = puzzles
        .filter(p => p.release_date < todayDate)
        .sort((a, b) => b.release_date.localeCompare(a.release_date))
        .map(p => this.mapToGameFormat(p));
    }

    mapToGameFormat(row) {
      return {
        id: row.puzzle_id,
        release_date: row.release_date,
        title: row.title,
        curriculumCategory: row.curriculum_category,
        difficulty: row.difficulty,
        centerLetter: row.center_letter,
        outerLetters: [
          row.outer_letter_1, row.outer_letter_2, row.outer_letter_3, 
          row.outer_letter_4, row.outer_letter_5, row.outer_letter_6
        ],
        pangrams: row.pangrams.split(' ').filter(Boolean),
        cocktailWords: row.cocktail_words.split(' ').filter(Boolean),
        words: row.valid_words.split(' ').filter(Boolean)
      };
    }
  }

  class StorageManager {
    static getInitialData() {
      return {
        version: 2,
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
        puzzleProgress: {}
      };
    }

    static load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return this.getInitialData();
        const parsed = JSON.parse(raw);
        if (!parsed.version || parsed.version < 2) return this.getInitialData();
        return Object.assign(this.getInitialData(), parsed);
      } catch (err) {
        return this.getInitialData();
      }
    }

    static save(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        // Silent block for persistence errors
      }
    }
  }

  class CocktailBeeApp {
    constructor() {
      this.state = StorageManager.load();
      this.soundEnabled = this.state.soundEnabled;
      
      this.releaseEngine = new ReleaseEngine();
      this.activePuzzle = null;
      this.isCurrentPuzzleToday = true;

      this.activeInput = '';
      this.foundWords = [];
      this.score = 0;
      this.maxPossibleScore = 0;
      this.outerLettersShuffled = [];
      this.toastTimeout = null;

      this.initDom();
      this.initEventListeners();
      
      this.boot();
    }

    initDom() {
      this.dom = {
        errorScreen: document.getElementById('errorScreen'),
        errorMessageText: document.getElementById('errorMessageText'),
        retryBtn: document.getElementById('retryBtn'),
        mainMenuScreen: document.getElementById('mainMenuScreen'),
        gameplayScreen: document.getElementById('gameplayScreen'),

        menuTodayBadge: document.getElementById('menuTodayBadge'),
        menuDiffPill: document.getElementById('menuDiffPill'),
        menuThemeTitle: document.getElementById('menuThemeTitle'),
        menuCurriculumCategory: document.getElementById('menuCurriculumCategory'),
        menuStatusText: document.getElementById('menuStatusText'),
        menuStatusRank: document.getElementById('menuStatusRank'),
        playTodayBtn: document.getElementById('playTodayBtn'),
        openVaultMenuBtn: document.getElementById('openVaultMenuBtn'),
        vaultArchiveCountBadge: document.getElementById('vaultArchiveCountBadge'),
        menuSoundBtn: document.getElementById('menuSoundBtn'),
        menuSoundIcon: document.getElementById('menuSoundIcon'),
        menuSoundLabel: document.getElementById('menuSoundLabel'),
        menuHowToPlayBtn: document.getElementById('menuHowToPlayBtn'),
        menuStatsBtn: document.getElementById('menuStatsBtn'),

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
      this.dom.retryBtn.addEventListener('click', () => this.boot());

      this.dom.playTodayBtn.addEventListener('click', () => {
        this.mountPuzzle(this.releaseEngine.currentRelease, true);
        this.showScreen('game');
      });

      this.dom.openVaultMenuBtn.addEventListener('click', () => {
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

      this.dom.backToMenuBtn.addEventListener('click', () => this.showScreen('menu'));

      document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-close');
          const modal = document.getElementById(targetId);
          if (modal) this.closeModal(modal);
        });
      });

      this.dom.toggleDrawerBtn.addEventListener('click', () => {
        const isExpanded = this.dom.toggleDrawerBtn.getAttribute('aria-expanded') === 'true';
        this.dom.toggleDrawerBtn.setAttribute('aria-expanded', String(!isExpanded));
        this.dom.drawerContent.hidden = isExpanded;
      });

      this.dom.cellCenter.addEventListener('click', () => {
        if (this.activePuzzle) this.handleLetterInput(this.activePuzzle.centerLetter);
      });
      this.dom.outerCells.forEach(cell => {
        cell.addEventListener('click', () => {
          const char = cell.getAttribute('data-letter');
          if (char) this.handleLetterInput(char);
        });
      });

      this.dom.deleteBtn.addEventListener('click', () => this.handleDelete());
      this.dom.shuffleBtn.addEventListener('click', () => this.handleShuffle());
      this.dom.enterBtn.addEventListener('click', () => this.handleWordSubmit());

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

    async boot() {
      this.showScreen('loading');
      await this.releaseEngine.initialize();
      
      if (this.releaseEngine.status === 'ERROR') {
        this.dom.errorMessageText.textContent = this.releaseEngine.errorMessage;
        this.showScreen('error');
      } else {
        this.updateSoundDisplay();
        this.renderMenuTodayCard();
        this.showScreen('menu');
      }
    }

    showScreen(screen) {
      this.dom.errorScreen.hidden = true;
      this.dom.mainMenuScreen.hidden = true;
      this.dom.gameplayScreen.hidden = true;

      if (screen === 'error') this.dom.errorScreen.hidden = false;
      if (screen === 'menu') {
        this.renderMenuTodayCard();
        this.dom.mainMenuScreen.hidden = false;
      }
      if (screen === 'game') this.dom.gameplayScreen.hidden = false;
    }

    openModal(modal) {
      if (modal) modal.hidden = false;
    }

    closeModal(modal) {
      if (modal) modal.hidden = true;
    }

    toggleSound() {
      this.soundEnabled = !this.soundEnabled;
      this.state.soundEnabled = this.soundEnabled;
      StorageManager.save(this.state);
      this.updateSoundDisplay();
    }

    updateSoundDisplay() {
      const icon = this.soundEnabled ? '🔊' : '🔇';
      const label = this.soundEnabled ? 'SOUND ON' : 'SOUND OFF';
      this.dom.menuSoundIcon.textContent = icon;
      this.dom.menuSoundLabel.textContent = label;
      this.dom.gameSoundIcon.textContent = icon;
    }

    renderMenuTodayCard() {
      const puzzle = this.releaseEngine.currentRelease;
      this.dom.menuDiffPill.textContent = puzzle.difficulty.toUpperCase();
      this.dom.menuThemeTitle.textContent = puzzle.title;
      this.dom.menuCurriculumCategory.textContent = puzzle.curriculumCategory;

      const saved = this.state.puzzleProgress[puzzle.release_date];
      const maxPts = this.computeMaxScore(puzzle);

      if (saved && saved.foundWords && saved.foundWords.length > 0) {
        const score = saved.score || 0;
        const rank = this.computeRank(score, maxPts);
        this.dom.menuStatusText.textContent = `${saved.foundWords.length} words poured • ${score} pts`;
        this.dom.menuStatusRank.textContent = rank.name;
        this.dom.playTodayBtn.textContent = 'RESUME';
      } else {
        this.dom.menuStatusText.textContent = 'Ready for service';
        this.dom.menuStatusRank.textContent = 'Barback';
        this.dom.playTodayBtn.textContent = 'PLAY';
      }

      this.dom.vaultArchiveCountBadge.textContent = this.releaseEngine.vaultReleases.length;
    }

    mountPuzzle(puzzle, isToday = false) {
      this.activePuzzle = puzzle;
      this.isCurrentPuzzleToday = isToday;
      this.activeInput = '';

      this.maxPossibleScore = this.computeMaxScore(puzzle);
      const saved = this.state.puzzleProgress[puzzle.release_date] || { foundWords: [], score: 0 };
      this.foundWords = [...saved.foundWords];
      this.score = this.calculateWordsScore(this.foundWords, puzzle);

      this.outerLettersShuffled = [...puzzle.outerLetters];
      this.shuffleArray(this.outerLettersShuffled);

      this.dom.gameEditionBadge.textContent = isToday ? 'TODAY' : puzzle.release_date;
      this.dom.gameThemeTitle.textContent = puzzle.title;
      this.dom.gameCategoryTitle.textContent = puzzle.curriculumCategory;

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

    renderHiveCells() {
      this.dom.cellCenter.setAttribute('data-letter', this.activePuzzle.centerLetter);
      this.dom.cellCenter.querySelector('.cell-letter').textContent = this.activePuzzle.centerLetter;

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
        if (char === this.activePuzzle.centerLetter) {
          span.classList.add('char-center');
        }
        span.textContent = char;
        this.dom.wordInputDisplay.appendChild(span);
      }

      const cursor = document.createElement('span');
      cursor.className = 'cursor-beam';
      this.dom.wordInputDisplay.appendChild(cursor);
    }

    handleLetterInput(letter) {
      const allowed = [this.activePuzzle.centerLetter, ...this.activePuzzle.outerLetters];
      if (!allowed.includes(letter)) {
        this.showToast('Bad letter', true);
        return;
      }
      if (this.activeInput.length >= 19) return;
      this.activeInput += letter;
      this.renderInputDisplay();
    }

    handleDelete() {
      if (this.activeInput.length === 0) return;
      this.activeInput = this.activeInput.slice(0, -1);
      this.renderInputDisplay();
    }

    handleShuffle() {
      this.shuffleArray(this.outerLettersShuffled);
      this.renderHiveCells();
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
        this.showToast('Too short', true);
        return;
      }
      if (!word.includes(this.activePuzzle.centerLetter)) {
        this.showToast('Missing center letter', true);
        return;
      }
      if (this.foundWords.includes(word)) {
        this.showToast('Already poured', true);
        return;
      }
      if (!this.activePuzzle.words.includes(word)) {
        this.showToast('Not on the menu', true);
        return;
      }

      const isPangram = this.activePuzzle.pangrams.includes(word);
      const pts = (word.length === 4 ? 1 : word.length) + (isPangram ? 7 : 0);

      this.foundWords.push(word);
      this.score += pts;
      this.activeInput = '';

      this.saveCurrentProgress();
      this.updateCareerStats(pts, isPangram);

      if (isPangram) {
        this.showToast(`PANGRAM! +${pts} PTS!`, false, true);
      } else {
        this.showToast(`+${pts} pts`, false, false);
      }

      this.renderInputDisplay();
      this.renderRankLadder();
      this.renderFoundWordsList();
    }

    showToast(message, isError = false, isPangram = false) {
      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.dom.toastMessage.textContent = message;
      this.dom.toastMessage.className = 'toast-message show';

      if (isError) this.dom.toastMessage.style.background = '#b71c1c';
      else if (isPangram) this.dom.toastMessage.style.background = '#ffd700';
      else this.dom.toastMessage.style.background = 'var(--gold-sheen-2)';

      this.toastTimeout = setTimeout(() => {
        this.dom.toastMessage.className = 'toast-message';
        this.dom.toastMessage.style.background = '';
      }, 1900);
    }

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
        if (pct >= leftPercent) pip.classList.add('reached');
        this.dom.rankMarkers.appendChild(pip);
      });
    }

    renderFoundWordsList() {
      this.dom.foundCount.textContent = this.foundWords.length;
      if (this.foundWords.length === 0) {
        this.dom.foundPreview.textContent = 'None yet';
        this.dom.foundChipsGrid.innerHTML = '<span>No drinks poured yet.</span>';
        return;
      }

      this.dom.foundPreview.textContent = this.foundWords.slice(-3).reverse().join(', ');
      
      const sorted = [...this.foundWords].sort();
      this.dom.foundChipsGrid.innerHTML = '';
      
      sorted.forEach(w => {
        const isPangram = this.activePuzzle.pangrams.includes(w);
        const chip = document.createElement('span');
        chip.className = 'found-chip';
        chip.textContent = w;
        if (isPangram) {
          chip.style.borderColor = '#ffd700';
          chip.style.color = '#ffd700';
        }
        this.dom.foundChipsGrid.appendChild(chip);
      });
    }

    saveCurrentProgress() {
      this.state.puzzleProgress[this.activePuzzle.release_date] = {
        foundWords: this.foundWords,
        score: this.score,
        lastPlayedAt: Date.now()
      };
      StorageManager.save(this.state);
    }

    updateCareerStats(pointsEarned, isPangram) {
      const todayStr = this.releaseEngine.todayDateStr;
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
          if (diffDays === 1) stats.currentStreak += 1;
          else if (diffDays > 1) stats.currentStreak = 1;
        }
        stats.lastPlayedDate = todayStr;
        stats.gamesPlayed += 1;
        if (stats.currentStreak > stats.maxStreak) stats.maxStreak = stats.currentStreak;
      }
      StorageManager.save(this.state);
    }

    refreshStats() {
      const stats = this.state.stats;
      this.dom.statPlayed.textContent = stats.gamesPlayed;
      this.dom.statWords.textContent = stats.wordsFoundTotal;
      this.dom.statPangrams.textContent = stats.pangramsFoundTotal;
      this.dom.statPoints.textContent = stats.totalPoints;
      this.dom.statCurrentStreak.textContent = stats.currentStreak;
      this.dom.statMaxStreak.textContent = stats.maxStreak;
    }

    renderVaultArchive() {
      const releases = this.releaseEngine.vaultReleases;
      this.dom.vaultListContainer.innerHTML = '';

      if (releases.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'vault-empty-notice';
        empty.textContent = 'Vault is empty.';
        this.dom.vaultListContainer.appendChild(empty);
        return;
      }

      releases.forEach(puzzle => {
        const saved = this.state.puzzleProgress[puzzle.release_date];
        const wordsFound = saved ? saved.foundWords.length : 0;
        const total = puzzle.words.length;
        const isDone = wordsFound >= total;

        const card = document.createElement('div');
        card.className = 'vault-item-card';

        card.innerHTML = `
          <div class="vault-meta">
            <div class="vault-edition-row">
              <span class="vault-day-num">${puzzle.release_date}</span>
            </div>
            <span class="vault-theme-title">${puzzle.title}</span>
          </div>
          <div class="vault-status-badge">
            ${wordsFound > 0 ? `${wordsFound} / ${total}` : 'Unplayed'}
          </div>
        `;

        card.addEventListener('click', () => {
          this.closeModal(this.dom.vaultModal);
          this.mountPuzzle(puzzle, false);
          this.showScreen('game');
        });

        this.dom.vaultListContainer.appendChild(card);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.cocktailBeeApp = new CocktailBeeApp();
  });
})();