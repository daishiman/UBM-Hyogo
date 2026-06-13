# Phase 2: 設計

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-ADMIN-SCHEMA-TERMINOLOGY-CLARITY-001 |
| Phase | 2 / 13（設計） |
| 設計正本 | [shared-context.md](../../shared-context.md) |

## 目的

用語リネームと revisionId 非表示を、既存コンポーネント構造・DOM contract を壊さずに表現層へ適用する設計を確定する。新規コンポーネントは作らず、文字列置換と1つの helper 追加に限定することで、テスト破壊と回帰リスクを最小化する。

## 実行タスク

1. **既存コンポーネント再利用可否（FB-SDK-07-1）を確認**: 本タスクは新規 UI コンポーネント・新規 primitive を一切追加しない。既存 `Chip` / `AdminStat` / `ui-card` 等をそのまま使い、表示文字列のみ差し替える。これにより HIG/アクセシビリティ/トークン準拠を既存レベルで維持する。
2. **revisionId 非表示の設計**: `CurrentRevisionCard` / `RevisionAndAliasHistory` から `{revisionId}` `{hash}` の描画を削除する。データ取得（`safeServerFetch<FullDiff>`）と `diff` の構造は不変。描画層で「最新版」固定ラベルに置換する。
3. **日付整形 helper の設計**: `apps/web/src/lib/format/datetime.ts` に `formatJstDate(iso): string` を追加（[shared-context.md §3](../../shared-context.md)）。fail-soft（無効値→空文字）で、呼び出し側が空なら「取得: …」行ごと非表示にする。
4. **用語集の責務境界**: 技術名併記を残す唯一の場所＝用語集カード（schemaGlossary/schemaReviewTerms/schemaHistoryGlossary 由来表示）と定義する。それ以外の画面表示からは英語テクニカル用語を撤去する。
5. **DOM contract 保持の設計**: aria-label は文字列のみ変更し role/testid/構造は不変。`admin-kpi-card-schema` 等の testid・`href="/admin/schema"`・data 属性は変更しない。
6. **テスト同期の設計**: 表示文字列を変える各箇所に対応する spec の期待値を同 wave で更新する（[shared-context.md §4 テストファイル表](../../shared-context.md)）。

## 参照資料

- [shared-context.md §2（用語リネーム正本テーブル）/ §3（helper）/ §4（変更ファイル）/ §5（不変条件）](../../shared-context.md)
- `apps/web/src/lib/format/datetime.ts`（既存 `formatJstDateTime` を踏襲）
- `apps/web/src/components/ui`（`Chip` の tone API）

## 成果物

### 設計判断テーブル

| 論点 | 決定 | 理由 |
|------|------|------|
| 新規コンポーネント追加 | しない | 文言変更のみで足り、テスト破壊リスクを避ける |
| revisionId | 描画削除（データは保持） | ユーザーに意味がない内部 ID。隠すだけでロジック不変 |
| 日付表記 | 新 helper `formatJstDate`（date-only） | 既存 `formatJstDateTime` は時刻付きで CURRENT REVISION には冗長 |
| 英語テクニカル用語 | 用語集カード内のみ残す | 引き継ぎ・API 対応のため。画面本文からは撤去 |
| 用語集 SSOT 3ファイル | 据置 | 技術名併記の正本。日本語化すると API フィールド対応が失われる |
| aria-label | 文字列のみ変更 | DOM contract（role/testid）は保持しテスト破壊回避 |

### 状態所有権 / 責務境界

- データ層（`safeServerFetch` / `diff`）: 不変。所有権 = server component。
- 表現層（文字列・helper）: 本タスクの変更対象。所有権 = 各コンポーネント描画。
- 用語集 SSOT: 技術名併記の正本。所有権 = `schemaGlossary.ts` 他。

## 統合テスト連携

- 各表示文字列変更に対し focused vitest の期待値を同時更新（同 wave）。jsdom レンダリングで新文言の存在・旧文言の非存在を検証する。
- `formatJstDate` は単体テストで「有効 ISO→日本語日付」「null/undefined/無効→空文字」を検証する。
- revisionId 非表示は `page.spec.tsx` で「生 revisionId 文字列が DOM に存在しない」assert を追加して回帰防止する。

## 完了条件

- [ ] 新規コンポーネントを追加しない方針が確定している
- [ ] revisionId 描画削除（データ保持）の設計が確定している
- [ ] `formatJstDate` の signature と fail-soft 仕様が確定している
- [ ] 用語集を技術名併記の正本として据置とする責務境界が明記されている
- [ ] DOM contract 保持（testid/role/href 不変）の方針が確定している
- [ ] テスト同期方針が確定している
