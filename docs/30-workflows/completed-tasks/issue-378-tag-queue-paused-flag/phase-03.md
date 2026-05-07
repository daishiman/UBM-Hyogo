# Phase 3: アーキテクチャ整合

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| タスク | issue-378-tag-queue-paused-flag |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | completed |


[実装区分: 実装仕様書]
判定根拠: env binding 追加・関数シグネチャ変更・テスト追加・runbook 新規作成を伴うため、コード変更が必須。

## 目的

env.ts / workflow / job / wrangler.toml 横断で不整合が生じないことを確認し、不変条件 #5 不変であることを示す。

## 影響範囲マップ

```
wrangler.toml ([vars] TAG_QUEUE_PAUSED)
        │
        ▼ Cloudflare Workers binding
apps/api/src/env.ts (Env interface)
        │
        ▼ 型として参照
apps/api/src/jobs/sync-forms-responses.ts
        │  parsePaused(env) を呼び出して boolean に変換
        ▼
apps/api/src/workflows/tagCandidateEnqueue.ts
        │  pause guard → 短絡 or 既存ロジック
        ▼
D1 (tag_assignment_queue) — paused 時は触らない
```

## 不変条件 #5 整合

- 編集対象は `apps/api` 配下と `apps/api/wrangler.toml` のみ。
- `apps/web` 配下に変更は発生しない（grep で確認）。
- D1 への直接アクセス点（`enqueueTagCandidate` 内 INSERT）は `apps/api` 内のままで境界変更なし。

## 不変条件 #13 整合

- pause guard は削除済み member skip より前段に位置するが、削除済み member skip ロジック自体は不変。
- `member_tags` への直接 INSERT 経路は本タスクで触らない。
- queue 停止 → 07a resolve workflow が消費する row が増えなくなるだけ。resolve 側は引き続き既存 row を処理する。

## 環境別設定

| 環境 | wrangler.toml セクション | default 値 |
| --- | --- | --- |
| development | `[vars]` | `TAG_QUEUE_PAUSED = "false"` |
| staging | `[env.staging.vars]` | `TAG_QUEUE_PAUSED = "false"` |
| production | `[env.production.vars]` | `TAG_QUEUE_PAUSED = "false"` |

緊急時は `wrangler secret put` や `--var` の一時 override ではなく、対象 env の `wrangler.toml` vars を `TAG_QUEUE_PAUSED = "true"` に変更して redeploy する。復旧時も同じ経路で `"false"` に戻す。

## 既存 caller 影響

`enqueueTagCandidate` 呼び出し箇所:

- production caller: `apps/api/src/jobs/sync-forms-responses.ts` — `parsePaused(env)` を boolean に変換し、第3引数へ渡す。
- test caller: `apps/api/src/workflows/tagCandidateEnqueue.test.ts` — 既存 caller は default `false` の後方互換を維持し、paused 専用 case は第3引数に `true` を渡す。
- caller 確認は `rg -n "enqueueTagCandidate\\(" apps/api/src` で production / test を分けて実施する。

## 実行タスク

- [x] Phase 3 の目的に沿って、本文で定義した確認・実装・検証を実施する。
- [ ] 関連する実コード、実仕様書、実スキル参照を同一サイクルで更新する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/issue-378-tag-queue-paused-flag/artifacts.json`

### 依存 Phase

- Phase 1: `phase-01.md`
- Phase 2: `phase-02.md`

## 成果物

- `docs/30-workflows/issue-378-tag-queue-paused-flag/phase-03.md`
- Phase 3 に対応する `outputs/phase-03/` 成果物

## 統合テスト連携

- [ ] NON_VISUAL のため、統合テストは `pnpm --filter @ubm-hyogo/api test` と focused Vitest evidence に集約する。
- [ ] runtime Cloudflare mutation は user approval gate の外では実行しない。

## 完了条件

- [x] Phase 3 の完了条件を満たす。

- 影響範囲マップが提示されている。
- 不変条件 #5 / #13 不変であることが論理的に示されている。
- 環境別 default 値が確定している。
- 既存 caller の grep 確認が phase-05 のチェック項目に入っている。
