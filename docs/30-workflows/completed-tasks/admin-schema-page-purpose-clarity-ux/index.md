# admin-schema-page-purpose-clarity-ux

/ admin/schema（Form schema 差分レビュー）ページの「目的・操作の流れ・得られる結果」を直感的に伝える UI/UX 改善の実装仕様書。

- **taskId**: `TASK-ADMIN-SCHEMA-PAGE-PURPOSE-CLARITY-UX-001`
- **status**: `implemented_local_evidence_captured`（apps/web 実装・focused tests・typecheck/lint/token gate・local desktop/mobile runtime screenshot 取得済み。commit・PR・staging visual baseline は user-gated）
- **branch**: `feat/admin-schema-page-purpose-clarity-ux`（dev tip 基準）
- **relatedIssue**: なし（staging 観察起点）
- **visualEvidence**: VISUAL
- **SSOT**: [`_shared-context.md`](_shared-context.md)

## 真因（apps/web 表現層のみ）

機能は完成済み。問題は**目的・流れ・成果を伝える情報設計と用語の欠如**。`page.tsx` の header description 1 文＋専門用語（stableKey/resolve/revision）の説明なし露出＋統計/ステータスの意味と次アクション不明＋割り当て後の下流結果が示されない（詳細は SSOT §2 RC-1..5）。

## 解決方針（ユーザー確定）

- 説明 UI: 流れ図＋用語の言い換え＋結果プレビュー（常時表示・コンパクト）
- 用語: やさしい日本語を主・技術名を併記
- 3 レーン: A=目的説明/オンボーディング・B=操作の意味/結果プレビュー・C=統計/履歴の文脈化＋CSS

不変条件: 既存 API surface のみ・新規 endpoint/D1/Form 変更禁止・OKLch トークン正本・新規プリミティブ 0。

## Phase 一覧

| Phase | 名称 | status | 出力 |
| --- | --- | --- | --- |
| 1 | 要件定義 | completed | [phase-1](outputs/phase-1/phase-1.md) |
| 2 | 設計 | completed | [phase-2](outputs/phase-2/phase-2.md) |
| 3 | 設計レビュー（Gate-A PASS） | completed | [phase-3](outputs/phase-3/phase-3.md) |
| 4 | テスト作成 | completed | [phase-4](outputs/phase-4/phase-4.md) |
| 5 | 実装手順 | completed | [phase-5](outputs/phase-5/phase-5.md) |
| 6 | テスト拡充 | completed | [phase-6](outputs/phase-6/phase-6.md) |
| 7 | カバレッジ確認 | completed | [phase-7](outputs/phase-7/phase-7.md) |
| 8 | リファクタリング | completed | [phase-8](outputs/phase-8/phase-8.md) |
| 9 | 品質保証 | completed | [phase-9](outputs/phase-9/phase-9.md) |
| 10 | 最終レビュー | completed | [phase-10](outputs/phase-10/phase-10.md) |
| 11 | 手動テスト（VISUAL） | completed | [phase-11](outputs/phase-11/phase-11.md) |
| 12 | ドキュメント更新 | completed | [phase-12](outputs/phase-12/main.md) |
| 13 | PR作成 | pending_user_approval | [phase-13](outputs/phase-13/phase-13.md) |

## 変更対象ファイル（実装時）

| パス | 種別 |
| --- | --- |
| `apps/web/src/components/admin/SchemaPurposeExplainer.tsx` | 新規 |
| `apps/web/src/components/admin/schemaGlossary.ts` | 新規 |
| `apps/web/app/(admin)/admin/schema/page.tsx` | 編集 |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 編集（表示追加のみ） |
| `apps/web/src/styles/globals.css` | 編集（OKLch） |
| 上記の `*.spec.{ts,tsx}` テスト 4 本 | 新規/編集 |

## CI ゲート（正本 = `bash scripts/verify-pr-ready.sh`）

1. `verify:phase12-compliance` → ok
2. `gate-metadata:validate` → ERROR 0
3. `indexes:rebuild` drift 0
