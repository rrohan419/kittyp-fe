/** Client fallback when /ai/tip-of-the-day is unavailable. Same day → same tip. */
const FALLBACK_TIPS = [
  'Fresh water every day keeps pets happier — rinse bowls morning and night.',
  'A short play session before meals can reduce begging and support a healthy weight.',
  'Gentle petting and calm talk strengthen the bond you share with your companion.',
  'Sniff walks are enrichment: let curious noses explore at their own pace.',
  'Rotating toys weekly keeps playtime exciting without buying something new each day.',
  'A cozy resting spot away from noise helps pets recharge after busy days.',
  'Soft praise and treats make training feel like a game, not a chore.',
  'Regular brushing spreads love and catches early coat or skin changes.',
  'Cats often prefer elevated perches — a window seat can be their favorite TV.',
  'Dogs thrive on routine: consistent meal and walk times lower everyday stress.',
  'Puzzle feeders turn dinner into brain exercise and slow down gulping.',
  'A few minutes of floor time with toys burns energy and builds trust.',
  'Clean litter boxes and fresh bedding are small comforts that mean a lot.',
  'Hydration tip: some pets drink more from a quiet fountain than a still bowl.',
  'Celebrate small wins: a calm greeting, a finished meal, a restful nap.',
  'Sunbeam naps are a luxury — open curtains for natural light and warmth.',
  'Short training bursts (1–3 minutes) beat long drills for focus and fun.',
  'Carry water on longer outings — shared hydration breaks are bonding too.',
  'End the day with a quiet check-in: food, water, comfort, and a kind word.',
  'Thank your pet with a scratch in their favorite spot — they often return the love.',
];

/** Epoch-day index aligned with BE DailyPetTipService selection. */
export function tipOfTheDayFallback(date = new Date()): string {
  const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const epochDay = Math.floor(utcMidnight / 86_400_000);
  const index = ((epochDay % FALLBACK_TIPS.length) + FALLBACK_TIPS.length) % FALLBACK_TIPS.length;
  return FALLBACK_TIPS[index];
}
