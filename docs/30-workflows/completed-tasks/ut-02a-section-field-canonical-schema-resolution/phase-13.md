# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-section-field-canonical-schema-resolution |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| Wave | 2+ |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（最終） |
| 状態 | pending |
| user_approval_required | true |

## 目的

local check → commit → push → PR 作成の最終ゲートを通す。**ユーザーの明示的な承認なく push / PR 作成を行ってはならない。** approval gate に違反した場合は revert 対応となる。

## approval gate（三役ゲート）

| ゲート | 内容 | 承認者 |
| --- | --- | --- |
| 1. user 承認 | 「PR 作成して」の明示指示 | ユーザー |
| 2. local-check-result | typecheck / lint / unit test / secret hygiene grep の PASS | 本 Phase |
| 3. push & PR | feature ブランチ push + `gh pr create` | 本 Phase（user 承認後のみ） |

## 依存境界

- 上流: Phase 12 の 7 成果物が揃い、compliance-check が PASS
- 上流: branch protection に従い、線形履歴 / 会話解決必須 / force-push 禁止を遵守
- 下流: PR merge 後、root workflow_state を `completed` に更新（実装完了後の場合）

## 実行タスク

- [ ] Task 13-1: user 承認待ち（明示指示の取得）
- [ ] Task 13-2: local check 実行 → `local-check-result.md` 記録
- [ ] Task 13-3: change-summary.md 作成
- [ ] Task 13-4: pr-template.md 作成
- [ ] Task 13-5: **user 承認後** push 実行
- [ ] Task 13-6: **user 承認後** `gh pr create` 実行
- [ ] Task 13-7: PR URL を artifacts.json または main.md に記録
- [ ] Task 13-8: artifacts.json の phase 13 status を completed に更新

## ブランチ情報

| 項目 | 値 |
| --- | --- |
| base | main |
| head | docs/issue-108-ut-02a-response-sections-fields-canonical-schema-task-spec |
| issue | #108 |
| close 動作 | `Refs #108`（**`Closes #108` は禁止** — issue は既にクローズ済みのため） |

## local-check-result.md（実測ログを記録）

```bash
# 1. 型チェック
mise exec -- pnpm typecheck

# 2. lint
mise exec -- pnpm lint

# 3. unit test（builder + metadata resolver の repository test）
mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared

# 4. evidence secret hygiene 再 grep
grep -iE '(token|cookie|authorization|bearer|secret)' \
  docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/outputs/phase-11/*.txt \
  docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/outputs/phase-11/*.md \
  || echo 'PASS'

# 5. fallback 残存確認（AC-2）
rg -n "stable_key.*label|heuristic|broad section|fallback" apps/api/src/repository/_shared/builder.ts || echo 'PASS (old fallback branch 0 hit)'

# 6. artifacts.json parity（手動 jq 確認）
jq '.phases[] | {phase, status, outputs}' \
  docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/artifacts.json
```

すべて PASS を `outputs/phase-13/local-check-result.md` に実測ログ付きで記録。

## change-summary.md

変更ファイル一覧（spec formalization PR を想定）:

- 新規ディレクトリ: `docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/`
  - `index.md`
  - `artifacts.json`
  - `phase-01.md` 〜 `phase-13.md`
  - `outputs/phase-01/` 〜 `outputs/phase-13/` 各種成果物（spec formalization path では template / planned evidence。実測 PASS と扱わない）
  - `outputs/phase-11/` 4 NON_VISUAL evidence + manual-test-result + main（implementation path で実測値へ更新）
  - `outputs/phase-12/` 7 成果物（spec formalization path では正本同期計画と root 単独 artifacts 宣言を記録）

実装が同 PR に含まれる場合（実装と spec を同梱する判断時）は以下を追加:
- `apps/api/src/repository/_shared/metadata.ts`（新規）
- `apps/api/src/repository/_shared/builder.ts`（fallback 削除）
- `apps/api/src/repository/_shared/builder.test.ts`（テスト整備）
- `apps/api/migrations/*.sql`（migration 採用時のみ）

### commit 粒度（5 単位推奨）

1. spec 群（index.md / artifacts.json / phase-01〜13.md）
2. outputs Phase 1〜10 群
3. outputs Phase 11 evidence 群
4. outputs Phase 12 docs 群（7 ファイル）
5. artifacts.json 最終確定（status 更新）

実装同梱時はさらに:
6. `metadata.ts` 新設
7. `builder.ts` fallback 削除 + test
8. migration（採用時のみ）

## pr-template.md

```
title: docs(issue-108): UT-02A response_sections / response_fields canonical schema resolution task spec

body:
## Summary
- Issue #108 のタスク仕様書を `docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/` 配下に作成
- Phase 1〜13 + index.md + artifacts.json
- 02a builder.ts の fallback（broad section assignment / stable_key label / heuristic field kind）を canonical `MetadataResolver` 経由に置換する設計を確定
- public / member / admin 3 view が同一 metadata から導出される状態への移行ロードマップ
- schema drift（unknown stableKey）を repository 層で検知可能にする interface 設計

## Refs
Refs #108

（注: `Closes #108` は使用しない。issue は既にクローズ済みのため `Refs` のみ。）

## Plan
- [ ] Phase 1〜10 完了（要件 / 設計 / レビュー / テスト戦略 / runbook / 異常系 / AC マトリクス / DRY / QA / 最終レビュー）
- [ ] spec formalization path: Phase 11 evidence placeholder を実測 PASS と扱わない
- [ ] implementation path: Phase 11 で 4 NON_VISUAL evidence 取得（builder unit test / drift log / 3 view parity / index）
- [ ] Phase 12 documentation 7 ファイル
- [ ] Phase 13 PR 承認

## Test plan
- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] `mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared` PASS
- [ ] old fallback branch check PASS（`stable_key` resolver input references are allowed）
- [ ] secret hygiene grep 0 hit on outputs/phase-11/*

## Evidence
- outputs/phase-11/builder-unit-test-result.txt
- outputs/phase-11/drift-detection-log.md
- outputs/phase-11/three-view-parity-check.md
- outputs/phase-11/non-visual-evidence.md
- outputs/phase-13/local-check-result.md

## Invariants
- #1 実フォーム schema をコードに固定しすぎない（resolver 経由集約）
- #2 consent キーは `publicConsent` / `rulesConsent` に統一
- #3 `responseEmail` は system field
- #5 D1 直接アクセスは `apps/api` に閉じる
```

## branch protection 遵守

- 線形履歴: rebase merge / squash merge を使用、merge commit 経由禁止
- 会話解決必須: PR 内の全 conversation を resolved にしてから merge
- force-push 禁止: 既存 commit の上書き push 不可
- `--no-verify` 禁止: pre-commit / pre-push hook をスキップしない
- `--no-gpg-sign` 禁止

## rollback

- spec / docs のみ（実装非同梱）の PR の場合: PR revert で完全に戻る
- 実装同梱の場合: migration を含む commit を最後に置き、revert 単位を分離
- artifacts.json の更新は commit を分離し、revert 容易性を確保

## 統合テスト連携

- local-check-result.md の test 結果は Phase 11 の builder-unit-test-result.txt と一致すること（再実行による drift がない）
- change-summary.md は Phase 12 の compliance-check で確認した 7 ファイル + Phase 11 の 6 ファイルを網羅すること

## 多角的チェック観点

- **approval gate**: user 承認なしの push / PR を絶対に行わない
- **trace**: PR title / body の `Refs #108` 表記
- **safety**: `Closes #108` 禁止が template に明記されている
- **integrity**: branch protection 5 項目を全て遵守

## サブタスク管理

- Task 13-1 (user 承認待ち) は同期的にブロック
- Task 13-2 〜 13-4 は user 承認前に準備可能
- Task 13-5 / 13-6 は user 承認後にのみ実行
- Task 13-7 / 13-8 は PR 作成完了後

## 完了条件

- [ ] approval gate 三役すべて PASS
- [ ] PR URL 取得済み
- [ ] artifacts.json の phase 13 status を completed に更新
- [ ] root workflow_state を更新（実装完了 PR の場合: `completed`、spec only の場合: `spec_created` 据え置き）

## タスク100%実行確認【必須】

- [ ] 全実行タスク (13-1〜13-8) completed
- [ ] artifacts.json の phase 13 status を completed
- [ ] PR URL を artifacts.json か outputs/phase-13/main.md に記録
- [ ] PR template の `Refs #108` 表記確認、`Closes #108` 不在確認

## 次 Phase（close-out）

- 本 Phase 完了をもって、UT-02A response_sections / response_fields canonical schema resolution タスク仕様書の作成が closed-loop 化される
- PR merge 後の close-out: 03a 完成後に再度本タスクを `ready` → `implementing` → `verified` → `completed` の順に進める
- PR URL 受領 → close-out: artifacts.json の root `metadata.workflow_state` を更新（実装完了時のみ `completed`）
