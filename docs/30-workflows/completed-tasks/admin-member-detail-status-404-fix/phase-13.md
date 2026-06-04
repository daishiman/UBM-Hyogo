# Phase 13: PR 作成（ユーザーゲート）

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。本 workflow は local 実装済み。commit・push・PR 作成・remote D1 migration apply・staging deploy は全て **ユーザー明示承認後のみ**実行する（CONST_002）。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | admin-member-detail-status-404-fix |
| Phase | 13（PR 作成・統合） |
| workflow_state | **implemented_local_evidence_captured** |
| base ブランチ | `dev`（既定。`main` への直接 PR は行わない） |
| 作業ブランチ | `fix/admin-member-detail-status-404`（`origin/dev` = `bd0393a29` 起点） |
| 分類 | NON_VISUAL（`apps/api` + D1 migration のみ。`apps/web` 無変更 = AC-8） |

## 目的

本 workflow の成果（apps/api の F-1〜F-5 実装 + 仕様ドキュメント）を `dev` への PR として統合するための手順を確定する。本 wave では PR を**作成しない**。全アクションはユーザーゲートであることを明記する。

## 実行タスク（全てユーザーゲート）

### 13.1 ユーザーゲート境界（CONST_002）

| アクション | 境界 | 備考 |
|-----------|------|------|
| 実コード実装（F-1〜F-5 + 補テスト） | **完了** | local implementation evidence captured |
| `git commit` / `git push` | **ユーザーゲート** | ユーザー明示承認後のみ |
| `gh pr create --base dev` | **ユーザーゲート** | base=dev 固定。production リリース時のみ `--base main` |
| remote D1 migration 0024 apply（`bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` 等） | **ユーザーゲート** | staging / production とも個別承認 |
| staging deploy（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`） | **ユーザーゲート** | apps/api のみ。apps/web は無変更のため deploy 不要 |
| GitHub Issue 起票（MINOR-FUT-1 / MINOR-FUT-2 の未タスク化） | **ユーザーゲート** | `unassigned-task-detection.md` 参照 |

### 13.2 PR 作成手順（ユーザー承認後に実施）

1. local evidence（`mise exec -- pnpm typecheck` / `pnpm lint` / 対象 vitest D1 config GREEN）を確認する。
2. AC-8 確認: `git diff --name-only dev...HEAD | grep -c '^apps/web/'` が 0 であること。
3. `bash scripts/verify-pr-ready.sh`（docs-only gate pre-flight）と `verify-phase12-compliance` を通過させる。
4. PR 本文は `.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として扱い、`outputs/phase-12/implementation-guide.md` の主要見出しを反映する。
5. `gh pr create --base dev` で作成（ユーザー承認後）。

### 13.3 migration apply の順序（ユーザー承認後）

- migration 0024 は `INSERT OR IGNORE` で冪等のため、deploy 前後どちらでも適用可。ただし backfill の効果は apply 後に発生するため、staging で「これまで 404 だった orphan 会員が 200 で開ける」確認（Phase 11 §11.3）は apply 後に行う。
- production への apply は staging 確認後に別途ユーザー承認を得る。

## 参照資料

- Phase 5（実装方針）/ Phase 11 §11.3（staging 実機確認手順）
- `.claude/commands/ai/diff-to-pr.md`（PR 本文 Phase 13 仕様）
- `outputs/phase-12/implementation-guide.md` / `outputs/phase-12/unassigned-task-detection.md`

## 成果物

- 本ファイル（Phase 13: PR / migration apply / deploy のユーザーゲート手順）

## 統合テスト連携

- 本 Phase は user-gated external ops の出口。13.2 の手順 1-2 は Phase 5 §5.8 / Phase 9 の検証コマンドと整合する。
- migration 0024 の staging apply 後に Phase 11 §11.3 の end-to-end 確認を行い、AC-1〜AC-7 の実機証跡を `manual-test-result.md` に追記する。

## 完了条件

- [x] PR / commit / push / migration apply / deploy / Issue 起票を全てユーザーゲートと明記した
- [x] base=dev を既定とし `main` 直接 PR を行わないと明記した
- [x] PR 作成手順（typecheck/lint/vitest/AC-8 確認 → verify-pr-ready → gh pr create）を確定した
- [x] migration 0024 apply の順序・冪等性・production 承認分離を記録した
