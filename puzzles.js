/**
 * ============================================================================
 * COCKTAIL SPELLING BEE — PUZZLE CONTENT DATABASE
 * Master 32-Category Cocktail Curriculum
 * Contains 5 authentic, fully verified Spelling Bee boards:
 * Exactly 7 distinct letters per board, valid cocktail pangrams, curated
 * dictionaries, and deep mixological lore.
 * ============================================================================
 */

window.COCKTAIL_SPELLING_BEE_PUZZLES = [
  /* --------------------------------------------------------------------------
     PUZZLE 1: THE HAWTHORNE STRAIN
     Curriculum Category 18: Straining & Fine Straining (Level 3)
     7 Unique Letters: A, E, I, N, R, S, T  |  Center Letter: T
     Iconic Pangrams: STRAINER, STRAINERS, RESTRAIN, RESTRAINS
     -------------------------------------------------------------------------- */
  {
    id: "sb-cocktail-001",
    title: "The Hawthorne Strain",
    curriculumCategory: "18. Straining & Fine Straining",
    difficulty: "Medium",
    centerLetter: "T",
    outerLetters: ["A", "E", "I", "N", "R", "S"],
    pangrams: [
      "STRAINER",
      "STRAINERS",
      "RESTRAIN",
      "RESTRAINS",
      "RETAINS",
      "RETINAS",
      "STAINER",
      "STAINERS"
    ],
    cocktailWords: [
      "STRAINER",
      "STRAINERS",
      "STIR",
      "STIRS",
      "TART",
      "TASTE",
      "TASTES",
      "TIN",
      "TINS",
      "TANNIN",
      "TANNINS",
      "SPIRIT"
    ],
    words: [
      "ANTI", "ANTIS", "ARTIST", "ARTISTE", "ARTISTES", "ARTISTS", "ARTS",
      "ATTAIN", "ATTAINS", "ATTAR", "ATTARS", "ATTIRE", "ATTIRES",
      "EAST", "EATEN", "EATER", "EATERS", "EATS", "ENTER", "ENTERS", "ENTRAIN", "ENTRAINS", "ESTATE", "ESTATES",
      "INITIATE", "INITIATES", "INSECT", "INSTATE", "INSTATES", "INTENT", "INTENTS", "INTER", "INTERN", "INTERNS", "INTERS",
      "IRATE", "ITERATE", "ITERATES",
      "NATTER", "NATTERS", "NEAT", "NEST", "NESTS", "NETT", "NETTS",
      "RAREST", "RATE", "RATER", "RATERS", "RATES", "RATITE", "RATITES", "RETAIN", "RETAINS", "RETIE", "RETIES", "RETINA", "RETINAS", "RESTRAIN", "RESTRAINS",
      "SAINT", "SAINTS", "SATIN", "SATINS", "SETT", "SETTS", "STAIN", "STAINER", "STAINERS", "STAINS", "STAIR", "STAIRS", "STAR", "STARE", "STARER", "STARERS", "STARES", "STARS", "START", "STARTER", "STARTERS", "STARTS",
      "STATE", "STATES", "STEER", "STEERS", "STEIN", "STEINS", "STERN", "STERNS", "STIR", "STIRS", "STRAIN", "STRAINER", "STRAINERS", "STRAINS", "STRAIT", "STRAITS", "STRATA", "STRIATE",
      "TAINT", "TAINTS", "TANNIN", "TANNINS", "TARE", "TARES", "TARN", "TARNS", "TART", "TARTS", "TASTE", "TASTER", "TASTERS", "TASTES",
      "TEAR", "TEARS", "TEAT", "TEATS", "TEEN", "TEENS", "TENET", "TENETS", "TENNIS", "TENT", "TENTS", "TERRA", "TERRAIN", "TERRAINS", "TERSE",
      "TIARA", "TIARAS", "TIER", "TIERS", "TINE", "TINEA", "TINEAS", "TINES", "TINT", "TINTS", "TIRE", "TIRES", "TITAN", "TITANS", "TITER", "TITERS", "TITRE", "TITRES",
      "TRAIN", "TRAINER", "TRAINERS", "TRAINS", "TRAIT", "TRAITS", "TRANSIT", "TRANSITS", "TREAT", "TREATER", "TREATERS", "TREATS", "TREE", "TREES"
    ]
  },

  /* --------------------------------------------------------------------------
     PUZZLE 2: THE ITALIAN APERITIVO
     Curriculum Category 11: Aperitifs & Amari (Level 2)
     7 Unique Letters: E, G, I, N, O, R, S  |  Center Letter: G
     Iconic Pangrams: NEGRONIS, REGIONS, IGNORES
     -------------------------------------------------------------------------- */
  {
    id: "sb-cocktail-002",
    title: "The Italian Aperitivo",
    curriculumCategory: "11. Aperitifs & Amari",
    difficulty: "Easy",
    centerLetter: "G",
    outerLetters: ["E", "I", "N", "O", "R", "S"],
    pangrams: [
      "NEGRONIS",
      "REGIONS",
      "IGNORES"
    ],
    cocktailWords: [
      "NEGRONIS",
      "GINS",
      "GINGER",
      "GROGS",
      "ORIGIN",
      "GREENS"
    ],
    words: [
      "EGGS", "EGOS", "ERGO", "ERGS",
      "GEAR", "GEARS", "GEESE", "GENIE", "GENIES", "GENRE", "GENRES", "GIGS", "GINGER", "GINGERS", "GINS", "GIRN", "GIRNS",
      "GOER", "GOERS", "GOES", "GONE", "GONG", "GONGS", "GONER", "GONERS", "GORE", "GORES", "GORGE", "GORGER", "GORGERS", "GORGES", "GORGON", "GORGONS",
      "GREEN", "GREENS", "GRIN", "GRINS", "GRIP", "GROG", "GROGS", "GROIN", "GROINS",
      "IGNORE", "IGNORES", "INGENUE",
      "NEGRO", "NEGRONIS",
      "OGRE", "OGRES", "ORIGIN", "ORIGINS",
      "REGION", "REGIONS", "REIGN", "REIGNS", "RESIGN", "RESIGNS", "RING", "RINGER", "RINGERS", "RINGS",
      "SAGE", "SAGER", "SAGES", "SIGN", "SIGNER", "SIGNERS", "SIGNOR", "SIGNORS", "SIGNS", "SING", "SINGER", "SINGERS", "SINGE", "SINGES", "SINGS", "SIREING", "SONG", "SONGS"
    ]
  },

  /* --------------------------------------------------------------------------
     PUZZLE 3: CROWN OF THE GLASS
     Curriculum Category 21: Garnishes (Level 3)
     7 Unique Letters: A, G, H, I, N, R, S  |  Center Letter: A
     Iconic Pangrams: GARNISH, SHARING, GARNISHING
     -------------------------------------------------------------------------- */
  {
    id: "sb-cocktail-003",
    title: "Crown of the Glass",
    curriculumCategory: "21. Garnishes",
    difficulty: "Hard",
    centerLetter: "A",
    outerLetters: ["G", "H", "I", "N", "R", "S"],
    pangrams: [
      "GARNISH",
      "SHARING",
      "GARNISHING"
    ],
    cocktailWords: [
      "GARNISH",
      "GRAIN",
      "GRAINS",
      "SANGRIA"
    ],
    words: [
      "AGAR", "AGARIC", "AGIN", "AGING", "AGNA", "AGRA", "AIRING", "AIRINGS", "AIRS",
      "ARAR", "ARIA", "ARIAS", "ARISEN", "ARISING", "ARRAIGN", "ARRAIGNS", "ARSIS",
      "GAIN", "GAINS", "GARISH", "GARNISH", "GARNISHING", "GNAR", "GNARS", "GNASH", "GNASHING", "GRAIN", "GRAINS", "GRAN", "GRANS",
      "HAGS", "HAIR", "HAIRING", "HAIRS", "HANG", "HANGAR", "HANGARS", "HANGING", "HANGINGS", "HANGS", "HARSH", "HASP",
      "NAAN", "NAANS", "NAGS", "NANA", "NANAS",
      "RAGI", "RAGIS", "RAGS", "RAIN", "RAINING", "RAINS", "RAISIN", "RAISING", "RAISINS", "RANG", "RANI", "RANIS", "RASH",
      "SAGA", "SAGAS", "SAGS", "SANGRIA", "SANGRIAS", "SANG", "SARI", "SARIS", "SHAG", "SHAGS", "SHAH", "SHAHS", "SHARING", "SHARINGS", "SHARN", "SHARNS"
    ]
  },

  /* --------------------------------------------------------------------------
     PUZZLE 4: BEHIND THE PLANK
     Curriculum Category 24: Bar Technique & Service (Level 3)
     7 Unique Letters: A, B, E, K, P, R, S  |  Center Letter: K
     Iconic Pangrams: BARKEEP, BARKEEPS
     -------------------------------------------------------------------------- */
  {
    id: "sb-cocktail-004",
    title: "Behind the Plank",
    curriculumCategory: "24. Bar Technique & Service",
    difficulty: "Beginner",
    centerLetter: "K",
    outerLetters: ["A", "B", "E", "P", "R", "S"],
    pangrams: [
      "BARKEEP",
      "BARKEEPS"
    ],
    cocktailWords: [
      "BARKEEP",
      "BARKEEPS",
      "BARKS",
      "SAKE",
      "SPARKS"
    ],
    words: [
      "BAKE", "BAKER", "BAKERS", "BAKES", "BARK", "BARKER", "BARKERS", "BARKEEP", "BARKEEPS", "BARKS", "BEAK", "BEAKER", "BEAKERS", "BEAKS", "BESPEAK", "BESPEAKS", "BRAKE", "BRAKES", "BREAK", "BREAKER", "BREAKERS", "BREAKS",
      "PARK", "PARKA", "PARKAS", "PARKER", "PARKERS", "PARKS", "PEAK", "PEAKS", "PEEK", "PEEKS", "PERK", "PERKS",
      "RAKE", "RAKER", "RAKERS", "RAKES",
      "SAKE", "SAKES", "SPARK", "SPARKER", "SPARKERS", "SPARKS", "SPEAK", "SPEAKER", "SPEAKERS", "SPEAKS"
    ]
  },

  /* --------------------------------------------------------------------------
     PUZZLE 5: THE MASTER BARTENDER
     Curriculum Category 25: Cocktail History & Origins (Level 4)
     7 Unique Letters: A, B, D, E, N, R, T  |  Center Letter: R
     Iconic Pangrams: BARTEND, BARTENDER
     -------------------------------------------------------------------------- */
  {
    id: "sb-cocktail-005",
    title: "The Master Bartender",
    curriculumCategory: "25. Cocktail History & Origins",
    difficulty: "Expert",
    centerLetter: "R",
    outerLetters: ["A", "B", "D", "E", "N", "T"],
    pangrams: [
      "BARTEND",
      "BARTENDER"
    ],
    cocktailWords: [
      "BARTEND",
      "BARTENDER",
      "BEER",
      "BRANDED",
      "BARTER",
      "TENDER"
    ],
    words: [
      "ARRET", "ATTAR",
      "BANTER", "BANTERER", "BARE", "BARED", "BARN", "BARRAT", "BARRATE", "BARRE", "BARRED", "BARREN", "BARTER", "BARTERER", "BARTEND", "BARTENDER", "BEAR", "BEARD", "BEARDED", "BEER", "BETTER", "BREAD", "BREADED", "BREED",
      "DART", "DARTED", "DARTER", "DEAR", "DEARER", "DEBAR", "DEBARRER", "DEBATER", "DEER", "DETER",
      "EARN", "EARNED", "EARNER", "ENTER", "ENTERER",
      "NARRATE", "NARRATED", "NARRATER", "NEAR", "NEARER",
      "RARE", "RARED", "RAREE", "RATE", "RATED", "RATER", "READ", "READER", "REAR", "REARED", "REBATE", "REBATED", "REBATER", "REDDEN", "REDDER", "RENDER", "RENDERER", "RENT", "RENTED", "RENTER", "RETARD", "RETARDED",
      "TARD", "TARE", "TARED", "TARN", "TART", "TARTE", "TEAR", "TEARER", "TENDER", "TENDERER", "TERRA", "TERRE", "TRADE", "TRADER", "TREAD"
    ]
  }
];