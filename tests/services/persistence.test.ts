import { describe, it, expect, beforeEach } from 'vitest';
import {
  persistenceService,
  type GamePersistenceData,
  defaultPersistenceData,
} from '../../src/services/persistence';

describe('Phase 3: Persistence Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads default data when localStorage is empty', async () => {
    const data = await persistenceService.loadGameData();
    expect(data.version).toBe(1);
    expect(data.xp).toBe(0);
    expect(data.challenges).toEqual({});
    expect(data.unlockedAchievements).toEqual([]);
  });

  it('saves and loads game progress correctly', async () => {
    const testData: GamePersistenceData = {
      version: 1,
      xp: 450,
      unlockedHintIds: ['m1-h1'],
      challenges: {
        'mission-01': {
          challengeId: 'mission-01',
          completed: true,
          bestScore: 1400,
          stars: 3,
          actualSteps: 8,
          optimalSteps: 6,
          hintsUsed: 1,
          completedAt: new Date().toISOString(),
        },
      },
      unlockedAchievements: [{ id: 'first-race', unlockedAt: new Date().toISOString() }],
      lastUpdated: new Date().toISOString(),
    };

    await persistenceService.saveGameData(testData);
    const loaded = await persistenceService.loadGameData();

    expect(loaded.xp).toBe(450);
    expect(loaded.unlockedHintIds).toContain('m1-h1');
    expect(loaded.challenges['mission-01'].bestScore).toBe(1400);
    expect(loaded.unlockedAchievements[0].id).toBe('first-race');
  });

  it('exports valid formatted JSON and imports it successfully', async () => {
    const sample: GamePersistenceData = {
      version: 1,
      xp: 800,
      unlockedHintIds: [],
      challenges: {},
      unlockedAchievements: [],
      lastUpdated: new Date().toISOString(),
    };

    await persistenceService.saveGameData(sample);
    const jsonStr = await persistenceService.exportProgressJson();
    expect(typeof jsonStr).toBe('string');

    // Clear and re-import
    localStorage.clear();
    const imported = await persistenceService.importProgressJson(jsonStr);

    expect(imported.xp).toBe(800);
    const loaded = await persistenceService.loadGameData();
    expect(loaded.xp).toBe(800);
  });

  it('rejects invalid JSON string during import', async () => {
    await expect(persistenceService.importProgressJson('not a json')).rejects.toThrow(
      'Invalid JSON format'
    );
  });

  it('rejects JSON missing required schema properties', async () => {
    await expect(
      persistenceService.importProgressJson(JSON.stringify({ randomField: true }))
    ).rejects.toThrow('does not match the RaceLab schema');
  });

  it('clears progress back to empty state', async () => {
    await persistenceService.saveGameData({
      ...defaultPersistenceData,
      xp: 999,
    });
    await persistenceService.clearProgress();
    const fresh = await persistenceService.loadGameData();
    expect(fresh.xp).toBe(0);
  });
});
