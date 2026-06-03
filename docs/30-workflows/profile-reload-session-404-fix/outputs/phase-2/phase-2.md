# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

Phase 1 で確定した真因（ルート解決層 404）と AC-1〜AC-8 を、3 タスク（T01/T02/T03）の責務・スコープ境界・状態所有権・参照仕様へ落とし込む。既存コンポーネント再利用可否（FB-SDK-07-1）を確認する。

## 実行タスク

### 2.1 真の論点と因果

- **真の論点**: 「`/profile` リロードで `/me` が 404 になる」現象の主問題は 2 系統に分かれる。
  1. **UX 系**: 生の技術エラー（`fetchAuthed failed: 404`）をユーザーに露出している（AC-1/AC-2）。
  2. **ルート解決系**: `/me` 成功系に 404 が無いのに 404 が返る ＝ マウント/末尾スラッシュの解決層問題で、回帰検知の盲点（マウント未検証の contract テスト）と派生欠陥（proxy の `/me/` 生成）がある（AC-4/AC-5/AC-6）。
- **因果ループ（バランス）**: 解決層が 404 を返す → SC が `!ok` 分岐 → 生エラー露出。UX 防御だけでは「ユーザーがマイページを使えない」根本は残るため、解決層の許容（AC-4）と再発検知（AC-5）を同サイクルで閉じる。
- **責務境界（状態所有権）**:
  - ルート解決（trailing-slash 正規化）= `apps/api`（route owner）の責務。
  - upstream URL 構築（末尾スラッシュ無し）= `apps/web` proxy の責務。
  - error code → 表示文言/CTA の写像 = `apps/web` UI（`/profile` + `SectionError`）の責務。
  - これらを混在させない（API が UX を持たない、proxy が表示を持たない）。

### 2.2 タスク分解とスコープ境界

| タスク | 含む | 含まない |
|--------|------|----------|
| T01 (api) | 全 route 共通の trailing-slash 正規化 middleware 追加 / フルアプリ・マウント統合テスト追加 | `/me` ハンドラのロジック変更・レスポンス shape 変更・D1 変更 |
| T02 (web proxy) | `/api/me/[...path]` の upstream URL 構築の末尾スラッシュ抑止 + テスト | proxy の認証・cookie 透過ロジック変更 |
| T03 (web UI) | `/profile` の `/me` error code 分岐 / `SectionError` に optional CTA props 追加 / 文言写像 + テスト | `/me/profile` 側の挙動（既存 `notFound()` 維持）・新規コンポーネント新設 |

### 2.3 既存コンポーネント再利用可否（FB-SDK-07-1）

| 対象 | 再利用 | 方針 |
|------|--------|------|
| `SectionError` | ✅ 拡張再利用 | `actionHref?` / `actionLabel?` の optional props を追加。既存呼び出し（`retryHref` のみ）は後方互換。新規 primitive は作らない |
| `safeServerFetch` の error code（`MEMBER_SESSION_404`） | ✅ 再利用 | 既存の `codePrefix`_`<status>` 規約をそのまま判定に使用 |
| `AuthRequiredError` redirect 経路 | ✅ 不変 | AC-3 のため変更しない |
| Hono middleware パターン | ✅ 踏襲 | `app.use("*", ...)` で正規化 middleware を追加（既存 `securityHeaders` / `corsFromEnv` と同列） |

### 2.4 状態所有権 / 実行状態テーブル

| レイヤ | 所有する状態 | 本タスクでの変更 |
|--------|--------------|------------------|
| API route 解決 | path → handler のマッチ | trailing-slash を正規化して 404 を回避（追加のみ） |
| web proxy | upstream URL 文字列 | 末尾スラッシュ抑止（文字列構築の修正） |
| web `/profile` SC | `meResult`（`SafeResult<MeSessionResponse>`） | `meResult.error.code` で表示分岐を追加 |
| `SectionError` | 表示のみ（状態なし） | CTA props 追加 |

### 2.5 ライブラリ選定 / semantics 実測確認

- 新規ライブラリ採用なし。Hono の trailing-slash 挙動は Phase 1 で実測済（`/me`→200 / `/me/`→404）。正規化の実装方式は Phase 3 で 308 redirect と内部 rewrite を比較する。

## 完了条件

- [x] 3 タスクの責務・スコープ境界・含まない範囲を確定
- [x] 既存コンポーネント再利用可否を判定（新規 primitive なし）
- [x] 状態所有権テーブルを確定
- [x] 因果ループ・責務境界を明示

## 成果物

- `outputs/phase-2/phase-2.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | `/me` 解決 / session 境界 |
| UI/UX | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | エラー表示 / 導線の方針 |

- `outputs/phase-1/phase-1.md`（AC・真因）

## 統合テスト連携

Phase 4 で各タスクの I/O 契約とテスト期待値を表に落とし込み、Phase 5 で実装仕様書本体（task-01..03）へ展開する。
