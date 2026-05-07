# Phase 2: 設計（既存 runbook 再確認） — ut-07b-fu-04-production-migration-apply-execution

[実装区分: 実装仕様書（operations verification + evidence writing）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 2 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #424 (CLOSED) |

## 目的

UT-07B-FU-03 が産み出した production migration apply runbook を「FU-04 として実行する立場」で再確認し、preflight → duplicate apply prohibition → optional read-only post-check → evidence 保存 → system spec 同期の sequence を本仕様書内に固定する。runbook の再設計は行わない。

## 実行タスク

1. FU-03 artifact inventory と consumed unassigned task を読み、runbook 前提と current repo 実体を把握する。完了条件: 主要ステップが本仕様書に転記されている。
2. 対象 DB 名 `ubm-hyogo-db-prod`、対象 environment `production`、対象 migration `0008_schema_alias_hardening` の三点が runbook と本仕様書で一致していることを確認する。
3. `bash scripts/cf.sh` wrapper の責務を再確認する（`op run` で 1Password から token 動的注入 / `ESBUILD_BINARY_PATH` 解決 / `mise exec` で Node 24・pnpm 10 保証）。
4. preflight / duplicate apply prohibition / post-check の各ステップで取得すべき evidence を列挙する。
5. forward-fix 方針（D1 は physical rollback 不可）を runbook と整合する形で本仕様書に記載する。

## 設計要点

### 実行 sequence（runbook 由来）

```
[1] bash scripts/cf.sh whoami
       ↓ (auth OK)
[2] bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
       ↓ (0008_schema_alias_hardening が既適用 fact と整合)
[3] ユーザー明示承認の取得・記録（Phase 11 user-approval-record.md）
       ↓
[4] FORBIDDEN - duplicate production migration apply is not executed
       ↓ (no-op prohibition evidence)
[5] bash scripts/d1/postcheck.sh ubm-hyogo-db-prod --env production
       ↓ (hardening 2 columns expected)
[6] redacted evidence 保存
       ↓
[7] aiworkflow-requirements already-applied verification boundary 同期（Phase 12）
```

### evidence 保存設計

- 各 CLI 出力は **stdout / stderr を結合せず明確に分離** して保存
- token / Account ID / cookie / OAuth 値 / raw PII を含む行は redaction 対象
- ファイル shape は `# command / # exit / # stdout (redacted) / # stderr (redacted) / # timestamp (UTC)` の 5 セクション固定

### rollback 設計

- D1 は physical rollback 不可のため、duplicate apply は禁止する
- FAIL 時の対処: forward-fix migration または正本 fact correction の判断をユーザーにエスカレーションし、本タスクは現状を evidence に記録して `BLOCKED` で完結
- `schema_aliases` table / UNIQUE indexes は `0008_create_schema_aliases.sql` の責務であり、本タスクの hardening post-check から外す

## 参照資料

- docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md
- .claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md
- apps/api/migrations/0008_schema_alias_hardening.sql
- scripts/cf.sh

## 多角的チェック観点

- runbook と本仕様書で DB 名 / env / migration 名が完全一致しているか
- wrapper 経由ルール（CLAUDE.md）に違反していないか
- forward-fix 方針が明記されているか
- evidence shape が後工程 Phase 11 で再現可能か

## サブタスク管理

- [ ] runbook phase-05 main.md の主要ステップを転記
- [ ] DB / env / migration 三点一致確認
- [ ] evidence shape 5 セクションを定義
- [ ] forward-fix 方針を文書化
- [ ] outputs/phase-02/main.md を作成

## 成果物

- outputs/phase-02/main.md

## 完了条件

- runbook 由来の実行 sequence が本仕様書内で再現されている
- DB / env / migration の三点一致が確認されている
- evidence shape と forward-fix 方針が確定している

## タスク100%実行確認

- [ ] runbook 再設計に踏み込んでいない
- [ ] secret 値を含めていない
- [ ] forward-fix 方針が明記されている

## 次 Phase への引き渡し

Phase 3 へ、実行 sequence / evidence shape / forward-fix 方針を渡す。
## 統合テスト連携

既適用 path では integration test を追加しない。`scripts/d1/*` の既存 contract と `references/database-schema.md` の production ledger fact を照合対象にする。
