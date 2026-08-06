export const HABIT_PRESETS: { name: string; emoji: string }[] = [
  { name: "Drink 8 glasses of water", emoji: "💧" },
  { name: "Read for 20 minutes", emoji: "📖" },
  { name: "Meditate", emoji: "🧘" },
  { name: "Morning walk", emoji: "🚶" },
  { name: "Stretch", emoji: "🤸" },
  { name: "Journal", emoji: "📓" },
  { name: "No social media before noon", emoji: "📵" },
  { name: "8 hours of sleep", emoji: "😴" },
  { name: "Learn something new", emoji: "🧠" },
  { name: "Practice gratitude", emoji: "🙏" },
];

export const GAMES: {
  kind: "tree" | "space" | "cat" | "treehouse";
  title: string;
  tagline: string;
  emoji: string;
}[] = [
  { kind: "tree", title: "Grow a tree", tagline: "From a tiny seed to a blooming tree", emoji: "🌱" },
  { kind: "space", title: "Space mission", tagline: "Blast off and reach the target planet", emoji: "🚀" },
  { kind: "cat", title: "Raise a kitten", tagline: "Care for a kitten as it grows", emoji: "🐱" },
  { kind: "treehouse", title: "Build a treehouse", tagline: "Gather wood and build it plank by plank", emoji: "🏡" },
];
