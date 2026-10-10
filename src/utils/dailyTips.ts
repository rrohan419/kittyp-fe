/** Same tips shown to pet parents on the home screen. One tip per calendar day. */
const DAILY_TIPS = [
  'Fresh water daily keeps kidneys happier — refill bowls morning and night.',
  'A short play session before meals can reduce begging and support healthy weight.',
  'Check gums weekly: healthy pink color is a quick at-home wellness signal.',
  'Keep vaccine and deworming dates in your pet dashboard so boosters never slip.',
];

export function tipForToday(date = new Date()): string {
  return DAILY_TIPS[date.getDate() % DAILY_TIPS.length];
}
