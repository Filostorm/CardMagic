// UUID generation, extracted from App.tsx so any module can use it without
// depending on the root entry file. Prefers the platform crypto UUID and falls
// back to a v4-shaped string when unavailable.
export function createUuid(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();

  if (randomUuid) {
    return randomUuid;
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const value = Math.floor(Math.random() * 16);
    const nibble = character === "x" ? value : (value & 0x3) | 0x8;
    return nibble.toString(16);
  });
}
