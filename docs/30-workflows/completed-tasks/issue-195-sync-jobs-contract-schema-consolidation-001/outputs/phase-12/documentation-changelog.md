# documentation-changelog

## docs/30-workflows/_design/sync-jobs-spec.md
**Before**: §1 メタ表のみ。runtime SSOT 配置の意思決定根拠がドキュメント化されていない。
**After**: §1 メタ表直下に「ADR-001 runtime SSOT 配置」セクション追加（Status: Accepted, Decision: apps/api 維持, Context / Rationale / Alternatives / Links 完備）。§2 / §3 / §5 に owner 表 (`sync-shared-modules-owner.md`) と runtime SSOT への 1-hop 参照リンクを追加。§9 変更履歴に 2026-05-04 行追加。

## docs/30-workflows/_design/sync-shared-modules-owner.md
**Before**: ledger.ts / sync-error.ts / index.ts の 3 行のみ。sync-jobs-schema.ts は表に存在せず。
**After**: 冒頭に `owner = 主担当 / co-owner = サブ担当` alias 行追加。owner 表に `apps/api/src/jobs/_shared/sync-jobs-schema.ts | 03a | 03b | 03a / 03b | sync_jobs runtime contract 正本…` 行追加。「解消済み未割当タスク」節に本タスク到達点を追記。

## .claude/skills/aiworkflow-requirements/references/database-schema.md
**Before**: `sync_jobs` 節は `_design/sync-jobs-spec.md` 参照済みだが pageToken 非該当 / PII 拒否 / owner 表境界の明示が弱い。
**After**: L57-59 に pageToken 説明 / PII＋email 形式拒否 / owner 表境界参照を追記。

## apps/api/src/jobs/_shared/sync-jobs-schema.ts
**Before**: `findPiiKeyPath` は key 名のみ検査。
**After**: `findPiiLeakPath` にリネーム、value 側の email 形式値も検出。エラーメッセージを `PII key/value: <path>=<email>` 形式に拡張。

## apps/api/src/jobs/_shared/sync-jobs-schema.test.ts
**Before**: `SYNC_JOB_TYPES` は定数同値断言、`SYNC_LOCK_TTL_MS` は乗算式断言、email 形式値ケースなし。
**After**: 文字列リテラル `["schema_sync","response_sync"]` 断言、`600000` 数値リテラル断言、`source: "a@example.com"` を拒否する新ケース追加。

## docs/30-workflows/unassigned-task/task-issue195-...md
**Before**: status: unassigned。
**After**: status: resolved / resolved-by / resolved-date / resolved-pr 追加。

## docs/30-workflows/_design/README.md
**Before**: `sync_jobs` contract consolidation を起票予定の未割当タスクとして表示。
**After**: 解消済みタスクとして `issue-195-sync-jobs-contract-schema-consolidation-001/` へ誘導し、`sync-jobs-spec.md` ADR-001 を current 登録物に追加。

## .claude/skills/aiworkflow-requirements/indexes/resource-map.md / quick-reference.md
**Before**: Issue #435 / `sync_jobs` runtime contract SSOT の検索導線なし。
**After**: resource-map と quick-reference に workflow / logical spec / owner table / runtime SSOT の導線を追加。

## .claude/skills/task-specification-creator/SKILL.md / references/phase12-skill-feedback-promotion.md
**Before**: runtime SSOT ADR + owner 表 + contract test 補強を同一 wave で閉じる際の artifacts parity / raw logs / discovery index / stale hub 同期 gate が明文化されていない。
**After**: 変更履歴と「Runtime SSOT governance close-out」ルールを追加し、Phase 11 raw logs、root/outputs artifacts parity、scope truth、resource-map / quick-reference、skill feedback 即時昇格を必須化。
