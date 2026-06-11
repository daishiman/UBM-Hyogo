# Phase 12 — ドキュメント更新（概要）

> SSOT: [`../../shared-context.md`](../../shared-context.md) を正本とする。

- **taskId**: `ISSUE-222-SEARCH-QUERY-PARSER-SHARED`
- **実装区分**: refactoring / NON_VISUAL / implemented_local_evidence_captured
- **implementation_mode**: `new`
- **workflow_state**: `implemented_local_evidence_captured`（実装・検証完了。commit・PR は user-gated）
- **関連 issue**: #222（CLOSED のまま・再オープンしない）

## 概要

公開メンバー検索（`/members`）の query 正規化規約が `apps/api` と `apps/web` の 2 箇所で独立に再定義され drift しうる状態を解消する。真に重複しているプリミティブ（zone/status/sort/density の値集合・`TAG_LIMIT`/`Q_LIMIT`/`LIMIT` 境界・q 正規化・tag 正規化・limit clamp）を新規 `packages/shared/src/public-search` に SSOT 化し、`apps/api/src/_shared/search-query-parser.ts` と `apps/web/src/lib/url/members-search.ts` を import へ切替える。

issue #222 原案の「parser 全体移設＋薄ラッパ＋400」は現コードに不適合のため、**共通プリミティブ抽出**へ最適化（parser は web/api で責務が異なる）。不正値は silent fallback（200）で、issue AC-3 の「400」は古い記述として是正。`parsePublicMemberQuery` / `parseSearchParams` / `toApiQuery` の挙動は変更前と完全一致（contract 不変）。

## Phase 12 成果物リンク（implementation-guide 以下 6 点 + 本ハブ）

| # | ファイル | 内容 |
|---|----------|------|
| 1 | [`implementation-guide.md`](./implementation-guide.md) | Part 1（中学生向け・共有ノートの例え話）+ Part 2（型 / シグネチャ / import 例 / エラーハンドリング / エッジケース / 設定可能定数） |
| 2 | [`system-spec-update-summary.md`](./system-spec-update-summary.md) | Step 1-A/1-B/1-C/Step 2 判定 + shared 型追加 4 点同期 |
| 3 | [`documentation-changelog.md`](./documentation-changelog.md) | 全 Step 結果 + workflow-local / global skill sync 別ブロック |
| 4 | [`unassigned-task-detection.md`](./unassigned-task-detection.md) | current 0 件 + baseline 参考 + 関連タスク差分確認 |
| 5 | [`skill-feedback-report.md`](./skill-feedback-report.md) | 3 観点固定 + CLOSED issue 運用 / AC 読み替え判断の記録 |
| 6 | [`phase12-task-spec-compliance-check.md`](./phase12-task-spec-compliance-check.md) | canonical 9 見出し逐語 + 4 条件 verdict（CI gate 対象） |

## Phase 12 strict 7 成果物一覧

| # | ファイル | 状態 |
|---|----------|------|
| 1 | `outputs/phase-12/main.md` | present |
| 2 | `outputs/phase-12/implementation-guide.md` | present |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | present |
| 4 | `outputs/phase-12/documentation-changelog.md` | present |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | present |
| 6 | `outputs/phase-12/skill-feedback-report.md` | present |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## 実装スコープ（今回サイクルで投入済み）

| 種別 | パス |
|------|------|
| 新規（pure module） | `packages/shared/src/public-search/search-query-primitives.ts` |
| 新規（barrel） | `packages/shared/src/public-search/index.ts` |
| 新規（unit test） | `packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts`（SP-01〜SP-12） |
| 編集（package exports） | `packages/shared/package.json`（`"./public-search"` subpath 追加） |
| 編集（api 切替） | `apps/api/src/_shared/search-query-parser.ts`（shared import 置換・I/O 不変） |
| 編集（web 切替） | `apps/web/src/lib/url/members-search.ts`（shared import 置換・公開 API 不変） |

## 完了サマリー / 境界

- NON_VISUAL のため Phase 11 screenshot 不要。代替証跡 = 自動テスト（SP-01〜SP-12 + 既存 api/web 回帰）+ typecheck + lint。
- D1 schema / API endpoint / Google Form / design tokens は変更なし。
- コード実装・focused vitest・typecheck・lint は完了。commit・push・PR・Issue mutation は user-gated。
