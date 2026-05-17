declare function updateStableKey(questionId: string, stableKey: string): Promise<void>;

export async function applyAlias() {
  await updateStableKey("q1", "name");
}
