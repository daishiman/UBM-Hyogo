# Phase 1: 要件定義・GO 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| タスク | issue-378-tag-queue-paused-flag |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | completed |


[実装区分: 実装仕様書]
判定根拠: env binding 追加・関数シグネチャ変更・テスト追加・runbook 新規作成を伴うため、コード変更が必須。

## 目的

`TAG_QUEUE_PAUSED` env flag を導入し、Forms sync から発生する candidate enqueue を緊急停止できる経路を確立する。
本 phase では受入条件・不変条件整合・default 方針を確定し、後続 phase の前提を fix する。

## 入力情報

- 元 unassigned task: `docs/30-workflows/unassigned-task/task-issue-109-tag-queue-pause-flag-001.md`
- GitHub Issue #378（CLOSED）
- 関連完了タスク: `docs/30-workflows/completed-tasks/issue-109-ut-02a-tag-assignment-queue-management/`

## 要件 (受入条件)

| ID | 内容 |
| --- | --- |
| AC-1 | env binding `TAG_QUEUE_PAUSED?: string` を `apps/api/src/env.ts` の `Env` interface に追加する。default は **disabled = enqueue 有効**。 |
| AC-2 | flag が `"true"` のとき、`enqueueTagCandidate` は INSERT を発行せず、`{ enqueued: false, reason: "paused" }` を返す。 |
| AC-3 | 停止時に skip reason `paused` を含む structured log を出力する。 |
| AC-4 | runbook を `docs/30-workflows/runbooks/tag-queue-pause.md` に新規作成し、緊急停止 / 復旧手順を明文化する。 |
| AC-5 | unit test（flag 未設定 / `"false"` / `"true"` の 3 ケース + log spy assertion）が PASS する。 |
| AC-6 | 不変条件 #5（D1 直接アクセスは apps/api 内）と #13（削除済み member は skip / `member_tags` 直接 INSERT 禁止）を遵守する。 |

## default 方針

- env 未設定 → enqueue 有効（false 扱い）。
- env `"false"`（任意の case）→ enqueue 有効。
- env `"true"`（lower case 完全一致）→ enqueue 停止。
- env その他文字列（例: `"1"`, `"True"`, `"yes"`）→ **enqueue 有効**（厳格 parse、誤設定で停止しないことを優先）。

## 不変条件整合

- 不変条件 #5: 編集対象は `apps/api` 配下と `wrangler.toml` のみ。`apps/web` への影響なし。
- 不変条件 #13: 本タスクは enqueue 経路を停止するだけで、`member_tags` への書込みパスは触らない。削除済み member skip ロジックも変更しない（pause guard はその前段に置く）。

## visualEvidence

`NON_VISUAL`。UI 変更なし。evidence は unit test PASS log / grep / runbook 実体で構成する。

## GO 判定

GO。受入条件は明確、変更範囲も小規模（5 ファイル + runbook 1 件）、不変条件の violation はなし。

## 実行タスク

- [x] Phase 1 の目的に沿って、本文で定義した確認・実装・検証を実施する。
- [ ] 関連する実コード、実仕様書、実スキル参照を同一サイクルで更新する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/issue-378-tag-queue-paused-flag/artifacts.json`

## 成果物

- `docs/30-workflows/issue-378-tag-queue-paused-flag/phase-01.md`
- Phase 1 に対応する `outputs/phase-01/` 成果物

## 統合テスト連携

- [ ] NON_VISUAL のため、統合テストは `pnpm --filter @ubm-hyogo/api test` と focused Vitest evidence に集約する。
- [ ] runtime Cloudflare mutation は user approval gate の外では実行しない。

## 完了条件

- [x] Phase 1 の完了条件を満たす。

- 受入条件 6 件が phase-07 AC マトリクスにトレース可能になっている。
- default 方針が確定している。
- visualEvidence = NON_VISUAL が確定している。
- GO 判定が明示されている。
