export const FINE_TUNING_SETTINGS = Object.freeze({
  terrainResolution: { min: 16, max: 128, default: 64 },
  cloudResolution: { min: 24, max: 128, default: 48 },
  cloudHumidity: { min: 0, max: 100, default: 92 },
  cloudCeiling: { min: 16, max: 64, default: 32 },
  rainDensityThreshold: { min: 0, max: 100, default: 45 },
  terrainRecoveryLayers: { min: 0, max: 8, default: 2 }
});
