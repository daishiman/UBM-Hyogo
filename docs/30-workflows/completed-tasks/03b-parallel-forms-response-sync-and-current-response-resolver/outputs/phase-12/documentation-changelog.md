# documentation changelog

本タスク（03b）で追加・変更したドキュメント類の変更ログ。実コード差分は
`outputs/phase-10/main.md` の「実装ファイル一覧」を参照。

## 新規ドキュメント（本ワークフロー配下）

### タスク仕様書

| ファイル | 状態 |
|---------|------|
| `docs/30-workflows/03b-.../index.md` | 新規 |
| `docs/30-workflows/03b-.../artifacts.json` | 新規 |
| `docs/30-workflows/03b-.../phase-01.md` 〜 `phase-13.md` | 新規（13 ファイル） |

### outputs

| Phase | 新規ファイル |
|-------|-------------|
| phase-01 | `main.md` |
| phase-02 | `main.md`, `sync-flow.mermaid` |
| phase-03 | `main.md` |
| phase-04 | `main.md`, `test-matrix.md` |
| phase-05 | `main.md`, `sync-runbook.md`, `pseudocode.md` |
| phase-06 | `main.md`, `failure-cases.md` |
| phase-07 | `main.md`, `ac-matrix.md` |
| phase-08 | `main.md` |
| phase-09 | `main.md`, `free-tier-estimate.md`, `secret-hygiene.md` |
| phase-10 | `main.md` |
| phase-11 | `main.md`, `manual-evidence.md`, `curl-recipes.md`, `wrangler-checks.md` |
| phase-12 | `main.md`, `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, `phase12-task-spec-compliance-check.md` |

## 変更ドキュメント

`.claude/skills/aiworkflow-requirements/references/` 配下: API / database / Cloudflare / environment specs を更新（`system-spec-update-summary.md` 参照）。

## 関連ハンドオフ素材

| 用途 | パス |
|------|------|
| PR description 冒頭サマリ | `outputs/phase-12/implementation-guide.md` 冒頭 |
| PR description AC 表 | `outputs/phase-07/ac-matrix.md` |
| PR description 実装ファイル表 | `outputs/phase-10/main.md` 「実装ファイル一覧」 |
| 手動 smoke 証跡 | `outputs/phase-11/manual-evidence.md`（テンプレ。staging 担当が値を埋める） |
| curl コマンド集 | `outputs/phase-11/curl-recipes.md` |
| D1 確認 SQL 集 | `outputs/phase-11/wrangler-checks.md` |

## 文書ファイル数（最終）

- 新規 doc 合計: **31 ファイル**
  - 仕様書: index 1 + artifacts 1 + phase-01〜13 = 15
  - outputs: 16（上記 phases 表参照）
- 変更 doc 合計: 0
- 削除 doc 合計: 0

## specs/ 影響

なし。詳細は `system-spec-update-summary.md` 参照。

## 後続タスク向け参照リンク

| 後続 | リンクすべき素材 |
|------|----------------|
| 04a-parallel-public-directory-api-endpoints | `implementation-guide.md` の AC-1 / AC-9（current_response + is_deleted フィルタ） |
| 04b-parallel-member-self-service-api-endpoints | `implementation-guide.md` の current_response 切替挙動 |
| 04c-parallel-admin-backoffice-api-endpoints | `implementation-guide.md` + `curl-recipes.md`（admin endpoint expose 用） |
| 07a-parallel-tag-assignment-queue-resolve-workflow | 同期完了 trigger 設計（本タスク runResponseSync の return 値） |
| 07c-parallel-meeting-attendance-and-admin-audit-log-workflow | `is_deleted` 取扱い |
| 08b（E2E） | `__fixtures__/` 配下の fixture 群を流用 |
