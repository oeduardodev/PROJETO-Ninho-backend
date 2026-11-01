const profiles = [
  { name: "Ana Silva", handle: "ana_silva" },
  { name: "Camila Oliveira", handle: "camila_oliveira" },
  { name: "Lucas Santos", handle: "lucas_santos" },
  { name: "Mariana Costa", handle: "mariana_costa" },
] as const;

export function getDefaultProfile(userId: string) {
  const seed = Number.parseInt(userId.replace(/-/g, "").slice(0, 8), 16);
  const profile = profiles[seed % profiles.length];
  return {
    name: profile.name,
    handle: `${profile.handle}_${seed % 90000 + 10000}`,
  };
}
