// Shared behavior defaults and per-animal state helpers.
export const ANIMAL_BEHAVIOR_DEFAULTS = Object.freeze({
  hungerRate: 0.24,
  thirstRate: 0.32,
  hungryThreshold: 50,
  thirstyThreshold: 50,
  foodIntakeRate: 16,
  drinkIntakeRate: 22,
  hungerFatal: 100,
  thirstFatal: 100,
  hungerDamageRate: 0.8,
  thirstDamageRate: 1,
  maxHealth: 100,
  ageRate: 0.016,
  lifespanMin: 12,
  lifespanMax: 20,
  decisionInterval: 2.5
});

export function resolveAnimalDefinition(species) {
  const behavior = Object.freeze({
    ...ANIMAL_BEHAVIOR_DEFAULTS,
    ...(species.behavior || {})
  });
  return Object.freeze({ ...species, behavior });
}

export function createAnimalState(resolvedSpecies, random = Math.random, time = 0) {
  const behavior = resolvedSpecies.behavior;
  const lifespanMin = behavior.lifespanMin;
  const lifespanMax = Math.max(lifespanMin, behavior.lifespanMax);

  return {
    hunger: 0,
    thirst: 0,
    health: behavior.maxHealth,
    maxHealth: behavior.maxHealth,
    age: 0,
    lifespan: lifespanMin + random() * (lifespanMax - lifespanMin),
    social: { partnerId: null, conversationUntil: 0 },
    action: 'idle',
    decision: { nextAt: time, interval: behavior.decisionInterval },
    family: { parentIds: [], offspringIds: [], protectedBy: null },
    pregnancy: { pregnant: false, otherParentId: null, dueAt: null }
  };
}

export function updateAnimalNeeds(animal, profile, delta) {
  const behavior = profile.behavior || profile;
  const elapsed = Math.max(0, Number.isFinite(delta) ? delta : 0);

  animal.hunger = Math.min(100, Math.max(0, animal.hunger + behavior.hungerRate * elapsed));
  animal.thirst = Math.min(100, Math.max(0, animal.thirst + behavior.thirstRate * elapsed));
  animal.age += behavior.ageRate * elapsed;

  if (animal.hunger >= behavior.hungryThreshold) {
    animal.health = Math.max(0, animal.health - behavior.hungerDamageRate * elapsed);
  }
  if (animal.thirst >= behavior.thirstyThreshold) {
    animal.health = Math.max(0, animal.health - behavior.thirstDamageRate * elapsed);
  }

  return animal;
}

export function hasFatalNeeds(animal, profile) {
  const behavior = profile.behavior || profile;
  return animal.health <= 0 ||
    animal.hunger >= behavior.hungerFatal ||
    animal.thirst >= behavior.thirstFatal ||
    animal.age >= animal.lifespan;
}
