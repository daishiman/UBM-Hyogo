declare const db: {
  update(table: unknown): { set(values: unknown): Promise<void> };
};
declare const schemaQuestions: unknown;

export async function applyAlias() {
  await db.update(schemaQuestions).set({ stableKey: "name" });
}
