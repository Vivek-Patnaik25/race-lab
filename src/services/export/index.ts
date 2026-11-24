import {
  type CustomScenarioDefinition,
  validateCustomScenario,
} from '../../engine/scenarios/scenario-validator';

export interface ImportScenarioResult {
  success: boolean;
  scenario?: CustomScenarioDefinition;
  errors: string[];
}

/**
 * Serializes a custom scenario to formatted JSON without executing code.
 */
export function exportScenarioToJson(scenario: CustomScenarioDefinition): string {
  return JSON.stringify(scenario, null, 2);
}

/**
 * Safely parses and validates a custom scenario JSON string.
 * Strictly prevents code injection and non-standard properties.
 */
export function importScenarioFromJson(jsonStr: string): ImportScenarioResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return {
      success: false,
      errors: ['Failed to parse JSON: invalid syntax.'],
    };
  }

  const validation = validateCustomScenario(parsed);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  return {
    success: true,
    scenario: parsed as CustomScenarioDefinition,
    errors: [],
  };
}

/**
 * Browser file download helper for scenario JSON files.
 */
export function downloadScenarioFile(filename: string, scenario: CustomScenarioDefinition): void {
  try {
    const jsonStr = exportScenarioToJson(scenario);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.warn('Unable to trigger automatic download:', err);
  }
}
