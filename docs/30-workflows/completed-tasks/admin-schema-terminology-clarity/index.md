# admin-schema-terminology-clarity — 実装仕様書

> `/admin/schema`（スキーマ差分のレビュー）とその波及先の「スキーマ」「stableKey」「resolve」「revision」「CURRENT REVISION」「Bulk Resolve」等のエンジニア用語・英語表記を非エンジニア向けの平易な日本語へ統一し、意味のない内部 revisionId 生表示を隠す（apps/web 表現層のみ）。

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-ADMIN-SCHEMA-TERMINOLOGY-CLARITY-001 |
| 実装区分 | 実装仕様書（コード変更を伴う） |
| タスク種別 | UI task |
| visualEvidence | VISUAL / `staging_visual_pending_user_gate` |
| workflow_state | implemented_local_evidence_captured |
| implementation_mode | new |
| branch | feat/admin-schema-terminology-clarity |
| 設計正本 | [shared-context.md](./shared-context.md) |

## スコープ

- 含む: `apps/web` 表現層の表示文字列リネーム、revisionId 生表示の撤去、日付整形 helper 追加、対応する spec / Playwright 文字列の同 wave 更新。
- 含まない: API / D1 / Google Form / endpoint surface の変更、新規コンポーネント・primitive の追加、スタイル/トークンの変更。

## Phase 一覧

| Phase | 名称 | 出力 |
|-------|------|------|
| 1 | 要件定義 | [outputs/phase-1/phase-1.md](./outputs/phase-1/phase-1.md) |
| 2 | 設計 | [outputs/phase-2/phase-2.md](./outputs/phase-2/phase-2.md) |
| 3 | 設計レビューゲート | [outputs/phase-3/phase-3.md](./outputs/phase-3/phase-3.md) |
| 4 | テスト作成 | [outputs/phase-4/phase-4.md](./outputs/phase-4/phase-4.md) |
| 5 | 実装 | [outputs/phase-5/phase-5.md](./outputs/phase-5/phase-5.md) |
| 6 | テスト拡充 | [outputs/phase-6/phase-6.md](./outputs/phase-6/phase-6.md) |
| 7 | カバレッジ確認 | [outputs/phase-7/phase-7.md](./outputs/phase-7/phase-7.md) |
| 8 | リファクタリング | [outputs/phase-8/phase-8.md](./outputs/phase-8/phase-8.md) |
| 9 | 品質保証 | [outputs/phase-9/phase-9.md](./outputs/phase-9/phase-9.md) |
| 10 | 最終レビューゲート | [outputs/phase-10/phase-10.md](./outputs/phase-10/phase-10.md) |
| 11 | 手動テスト検証 | [outputs/phase-11/phase-11.md](./outputs/phase-11/phase-11.md) |
| 12 | ドキュメント更新 | [outputs/phase-12/phase-12.md](./outputs/phase-12/phase-12.md) |
| 13 | PR作成 | [outputs/phase-13/phase-13.md](./outputs/phase-13/phase-13.md) |

## 受入条件サマリ

AC-1〜AC-11 は [outputs/phase-1/phase-1.md](./outputs/phase-1/phase-1.md) を参照。

## 注意

- apps/web 実装・focused Vitest・typecheck・lint・verify:tokens・apps/api 非接触確認は本 wave で完了済み。
- authenticated staging 視覚証跡 / commit / push / PR は **ユーザー明示承認後のみ**実行する。
- 用語集 SSOT 3ファイルは技術名併記の正本として据置（[shared-context.md §2-10](./shared-context.md)）。
