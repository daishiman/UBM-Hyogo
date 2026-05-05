// TODO(08b): 実装は Phase 11 manual smoke で活性化
// D1 local DB へ E2E 用の seed を流し込む helper

export type SeedSpec = {
  members: Array<{ id: string; status: 'active' | 'unregistered' | 'rules_declined' | 'deleted' }>
  meetings: Array<{ id: string; hasDeletedCandidate: boolean }>
  tagCategories: number
  adminUserId: string
}

export const DEFAULT_SEED: SeedSpec = {
  members: [
    { id: 'm-1', status: 'active' },
    { id: 'm-2', status: 'active' },
    { id: 'm-3', status: 'unregistered' },
    { id: 'm-4', status: 'rules_declined' },
    { id: 'm-5', status: 'deleted' },
  ],
  meetings: [
    { id: 'sess-1', hasDeletedCandidate: true },
    { id: 'sess-2', hasDeletedCandidate: false },
  ],
  tagCategories: 6,
  adminUserId: 'admin-1',
}

// TODO: scripts/cf.sh d1 execute を呼ぶ shell wrapper、または `wrangler d1 execute --local` 直接呼び出し
export async function applySeed(_spec: SeedSpec = DEFAULT_SEED): Promise<void> {
  // placeholder
}

export async function resetD1(): Promise<void> {
  // TODO: TRUNCATE 相当 (DELETE FROM members; ...)
}
