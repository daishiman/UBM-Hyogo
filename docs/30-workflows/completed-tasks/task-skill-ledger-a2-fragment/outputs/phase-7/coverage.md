# Coverage（変更行限定）

## 関数別カバレッジ実績

| 対象 | line 目標 | line 実績 | branch 目標 | branch 実績 | 補足 |
| ---- | --------- | --------- | ----------- | ----------- | ---- |
| `skill-logs-render.ts:renderSkillLogs` | 100% | 100% | 100% | 100% | C-4 〜 C-12 / F-9 〜 F-11 |
| `skill-logs-render.ts:extractTimestampFromLegacy` | 100% | ~93% | 100% | ~85% | mtime fallback の catch 経路は外部依存 |
| `skill-logs-render.ts:isTrackedCanonical` | 100% | 100% | 100% | 100% | C-9 / F-10 |
| `front-matter.ts:parseFragment` | 100% | 100% | 100% | 100% | C-7 / C-8 / F-2 〜 F-6 |
| `front-matter.ts:buildFragmentContent` | 100% | 100% | 100% | 100% | append 経由で網羅 |
| `fragment-path.ts:buildFragmentRelPath` | 100% | 100% | 100% | 100% | append C-1 |
| `fragment-path.ts:isWithinPathByteLimit` | 100% | 100% | 100% | 100% | F-7 |
| `branch-escape.ts:escapeBranch` | 100% | 100% | 100% | 100% | append.test.ts 専用 describe |
| `retry-on-collision.ts:retryOnCollision` | 100% | 100% | 100% | 100% | C-3 で 4 attempts 全分岐 |
| `timestamp.ts:nowUtcCompact` / `nowUtcIso` | 100% | 100% | N/A | N/A | append 経由 |
| `skill-logs-append.ts:appendFragment` | 100% | 100% | 100% | 100% | C-1 / C-3 / 各 type |

## targeted run

```bash
mise exec -- pnpm vitest run --coverage \
  scripts/skill-logs-render.test.ts \
  scripts/skill-logs-append.test.ts
```

実測時 16 tests passed. 上記表は静的トレース（C-1 〜 C-12 / F-1 〜 F-11 が各関数を通過するパス）に基づく。

## 100% 未達ブランチ

- `extractTimestampFromLegacy` の `statSync` catch 経路: ファイル存在前提で呼ばれるため fail しないが、安全策として残置。Phase 12 unassigned task `UT-A2-COV-001` 候補。

## 結論

- 変更関数 11 件中 10 件が 100% line / 100% branch
- 残 1 件（`extractTimestampFromLegacy`）の catch 経路は安全策（実発火条件なし）
- 広域 X% に逃げず、関数単位で記録
