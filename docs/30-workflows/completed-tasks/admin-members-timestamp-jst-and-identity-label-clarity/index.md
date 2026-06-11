# 会員管理「最終更新」JST化 + IDENTITY/DIAGNOSTICS 日本語ラベル化 タスク仕様書

- task_id: `admin-members-timestamp-jst-and-identity-label-clarity`
- 実装区分: **[実装区分: 実装仕様書]**（CONST_004 デフォルト。判定根拠は Phase 1 参照）
- taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `new`
- workflow_state: `implemented_local_evidence_captured`（apps/web 実装・focused Vitest・local Playwright 3 PNG 取得済み。commit・PR・staging 認証 visual は user-gated）
- スコープ: `apps/web`（admin 会員管理画面）のみ。API/D1/Form 非変更（不変条件 #1 #5・AC-10）
- SSOT: [shared-context.md](shared-context.md)

## 目的

staging `/(admin)/admin/members`（会員管理）で、非エンジニアの運営者が
**最終更新の日時**と**会員の本人情報・診断情報**を一目で読めるようにする:

1. 「最終更新」列を ISO 8601 生（`2026-06-09T10:34:19.996603Z`）から
   日本時間 `2026年6月9日 19:34:19`（年月日漢字・秒まで）へ。
2. 詳細ドロワーの IDENTITY / DIAGNOSTICS を英語キー名から
   **日本語ラベル主・英語キー併記**へ。真偽値は「はい/いいえ」へ。

## 根本原因（確定）

apps/web 表現層の表示変換欠如のみ（API/D1/Form 無罪）。詳細は [shared-context.md](shared-context.md) §2。

1. `MembersTable.tsx:161-163` がフォーマッタ未適用で ISO 直描画。
2. `MemberDrawer.tsx:236-253` が IDENTITY 英語キーをハードコード・bool は `String()`。
3. `MemberDiagnosticsPanel.tsx:55-79` が DIAGNOSTICS 英語ラベルをハードコード・bool は yes/no。
4. 英語キー→日本語ラベルの統一 SSOT が未存在。

## スコープ（本サイクル完結 = AC-1..AC-11）

| 柱 | 内容 | 主な変更ファイル |
| --- | --- | --- |
| 最終更新 JST 化 | `formatJstDateTimeWithSeconds` 新規 helper + 一覧列差し替え | `lib/format/datetime.ts` / `MembersTable.tsx` |
| 用語集 SSOT | IDENTITY/DIAGNOSTICS 英語キー→日本語ラベル + 真偽値日本語化 | `memberSystemFieldGlossary.ts`（新規） |
| IDENTITY 日本語化 | 日本語ラベル主+英語キー併記・真偽値日本語化・見出し日本語化 | `MemberDrawer.tsx` |
| DIAGNOSTICS 日本語化 | 同上・`boolLabel`→`formatBooleanJa` | `MemberDiagnosticsPanel.tsx` |
| テスト | helper / SSOT / 一覧列 / IDENTITY / DIAGNOSTICS の focused spec | `__tests__/*.spec.ts(x)` |

## スコープ外（baseline・別改善）

[shared-context.md](shared-context.md) §9 を正本: OOS-1（送信日時の秒化）/ OOS-2（監査ログ日時）/ OOS-3（DIAGNOSTICS 値の和訳）/ OOS-4（他 admin 一覧の日時）。
今サイクル完了の阻害要因ではなく独立改善（CONST_007 の先送りではない）。

## Acceptance Criteria

[shared-context.md](shared-context.md) §4 の AC-1..AC-11 を正本とする。

## Phase 構成

| Phase | 内容 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) |
| 2 | 設計（変更ファイル Before/After・責務境界） | [phase-2-design.md](phase-2-design.md) |
| 3 | 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) |
| 4 | テスト計画 | [phase-4-test-plan.md](phase-4-test-plan.md) |
| 5 | 実装手順 | [phase-5-implementation.md](phase-5-implementation.md) |
| 6 | テスト追加 | [phase-6-test-additions.md](phase-6-test-additions.md) |
| 7 | カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) |
| 8 | リファクタ | [phase-8-refactor.md](phase-8-refactor.md) |
| 9 | QA | [phase-9-qa.md](phase-9-qa.md) |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) |
| 11 | 手動テスト / スクリーンショット | [phase-11-manual-test.md](phase-11-manual-test.md) |
| 12 | ドキュメント同期 | [phase-12-documentation.md](phase-12-documentation.md) |
| 13 | commit / PR / release | [phase-13-pr.md](phase-13-pr.md) |

## 完了条件

AC-1..AC-11 が全 Phase に trace され、`artifacts.json` に `taskType` / `visualEvidence` / gates が記録され、
apps/web 表現層のみのスコープが維持され、実コード・focused tests・local visual evidence・Phase 12 strict outputs が揃っていること。
本サイクルで apps/web 実装、focused Vitest、local Playwright fixture screenshot まで完了した。
commit・push・PR と staging 認証 visual baseline は user-gated。
