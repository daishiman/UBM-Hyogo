# Phase 12 — ドキュメント / Skill 反映

## 反映先

| Skill / Doc | 反映内容 |
|------------|---------|
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | issue-976 entry 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | admin server-fetch service-binding 行追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 本 workflow path entry |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | dated エントリ |
| `.claude/skills/aiworkflow-requirements/LOGS/<date>-issue-976-admin-fetch-service-binding.md` | summary |
| `.claude/skills/aiworkflow-requirements/lessons-learned/L-ADMSB-001-005.md` | 後述 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-976-admin-fetch-service-binding-artifact-inventory.md` | inventory(本サイクル成果物) |
| `.claude/skills/task-specification-creator/patterns-lessons-and-pitfalls.md` | 末尾「Admin server-fetch service-binding 統一パターン」節 |

## 新規 Lessons Learned 候補

- **L-ADMSB-001**: 同一 Cloudflare アカウントの `*.workers.dev → *.workers.dev` 外向き HTTP fetch は loopback 404 を返す。Worker 間通信は service-binding を最優先する
- **L-ADMSB-002**: public fetch と admin fetch の経路非対称(public 側のみ service-binding 採用)は中規模アプリで頻発する。両者を symmetric に保つ regression gate を持つこと
- **L-ADMSB-003**: per-route の "narrow warn / fixture fallback" だけで 404 を抑えると、症状緩和に終始し根本原因が温存される
- **L-ADMSB-004**: service-binding 経由でも `x-internal-auth` / `cookie` ヘッダは Request init.headers で透過する。subrequest として API Worker の middleware が通常通り評価する
- **L-ADMSB-005**: env accessor (`getPublicFetchEnv()`) が `API_SERVICE` と test/Playwright runtime flag を expose していれば、wrangler.toml の `[[services]]` 追加 + 1 関数差替えだけで root fix できる

## canonical 9 headings(Phase 12 main / strict 7)

- (本仕様書は Phase 12 strict7 出力 main は実装後 `outputs/phase-12/main.md` で生成)
