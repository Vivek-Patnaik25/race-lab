/**
 * Local-First Persistence Service
 * Complies with Section 9 of Product Specification.
 */

export interface StoredChallengeProgress {
  challengeId: string;
  completed: boolean;
  bestScore: number;
  stars: 1 | 2 | 3;
  optimalSteps: number;
  actualSteps: number;
  hintsUsed: number;
  completedAt: string;
}

export interface GamePersistenceData {
  version: number;
  xp: number;
  unlockedHintIds: string[];
  challenges: Record<string, StoredChallengeProgress>;
  unlockedAchievements: Array<{ id: string; unlockedAt: string }>;
  lastUpdated: string;
}

const STORAGE_KEY_V1 = 'racelab:v1:gamedata';
const SESSION_PREFIX = 'racelab:session:';
const CURRENT_VERSION = 1;

export const defaultPersistenceData: GamePersistenceData = {
  version: CURRENT_VERSION,
  xp: 0,
  unlockedHintIds: [],
  challenges: {},
  unlockedAchievements: [],
  lastUpdated: new Date().toISOString(),
};

export const persistenceService = {
  /**
   * Saves the user's overall game progress to localStorage.
   */
  async saveGameData(data: GamePersistenceData): Promise<void> {
    try {
      const payload: GamePersistenceData = {
        ...data,
        version: CURRENT_VERSION,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(payload));
    } catch (e) {
      console.warn('RaceLab: unable to persist to localStorage (quota or privacy mode):', e);
    }
  },

  /**
   * Loads the user's progress. Migrates or creates default if missing.
   */
  async loadGameData(): Promise<GamePersistenceData> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_V1);
      if (!raw) return { ...defaultPersistenceData };

      const parsed = JSON.parse(raw) as Partial<GamePersistenceData>;
      if (!parsed || typeof parsed !== 'object') {
        return { ...defaultPersistenceData };
      }

      // Schema migration if version changes in the future
      return {
        version: CURRENT_VERSION,
        xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
        unlockedHintIds: Array.isArray(parsed.unlockedHintIds) ? parsed.unlockedHintIds : [],
        challenges:
          parsed.challenges && typeof parsed.challenges === 'object' ? parsed.challenges : {},
        unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
          ? parsed.unlockedAchievements
          : [],
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };
    } catch (e) {
      console.warn('RaceLab: failed to parse persisted data, using defaults:', e);
      return { ...defaultPersistenceData };
    }
  },

  /**
   * Exports full game state as formatted JSON string for backup/sharing.
   */
  async exportProgressJson(): Promise<string> {
    const data = await this.loadGameData();
    return JSON.stringify(data, null, 2);
  },

  /**
   * Validates and imports a JSON backup string into localStorage.
   */
  async importProgressJson(jsonString: string): Promise<GamePersistenceData> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new Error('Invalid JSON format for backup file.');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Backup data must be a valid JSON object.');
    }

    const typed = parsed as Partial<GamePersistenceData>;
    if (typeof typed.xp !== 'number' || !typed.challenges) {
      throw new Error('Backup data does not match the RaceLab schema specification.');
    }

    const validated: GamePersistenceData = {
      version: CURRENT_VERSION,
      xp: typed.xp,
      unlockedHintIds: Array.isArray(typed.unlockedHintIds) ? typed.unlockedHintIds : [],
      challenges: typed.challenges as Record<string, StoredChallengeProgress>,
      unlockedAchievements: Array.isArray(typed.unlockedAchievements)
        ? typed.unlockedAchievements
        : [],
      lastUpdated: new Date().toISOString(),
    };

    await this.saveGameData(validated);
    return validated;
  },

  /**
   * Clears game data and resets to initial fresh state.
   */
  async clearProgress(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY_V1);
    } catch {
      // Ignored
    }
  },

  /**
   * Saves a standalone named simulation session.
   */
  async saveSession(id: string, data: unknown): Promise<void> {
    try {
      localStorage.setItem(`${SESSION_PREFIX}${id}`, JSON.stringify(data));
    } catch {
      // Ignored
    }
  },

  /**
   * Loads a standalone simulation session.
   */
  async loadSession(id: string): Promise<unknown | null> {
    try {
      const item = localStorage.getItem(`${SESSION_PREFIX}${id}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
};
