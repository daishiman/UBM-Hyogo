# Phase 13 — PR 本文テンプレート

> ステータス: `implemented_local_evidence_captured`。base = `dev`。commit / push / PR は user 明示承認後のみ。

---

## タイトル案

```
feat(admin): /admin/audit 監査ログを非エンジニア向け日本語化 + フィルタ段階開示 + カード整列
```

---

## PR 本文（雛形）

### 背景

`/admin/audit`（監査ログ）は先行タスク（#1202）でカード型タイムライン + 目的・用語ガイド + appliedFilters 可視化 + エラー親切化へ刷新済み。しかし依然として **英語表記・技術キー名が UI に露出**（`action` / `actorEmail` / `targetType` / `admin.member.status_updated` / `auditId` 等）しており、非エンジニアの管理者には直感的でなかった。本 PR はその追従改善として「言葉の平易化（日本語化）+ 操作導線の段階化 + ブロック整列」を行う。

### 変更内容

データ取得（`GET /admin/audit`）・API・D1・Google Form schema・shared 型は不変のまま、表現層（`apps/web/src/components/admin/` + `globals.css`）のみを再構成:

- **C1 日本語化 + 用語集 SSOT 拡張**: `auditGlossary.ts` に `AUDIT_ACTION_LABELS` / `AUDIT_TARGET_TYPE_LABELS` / `AUDIT_FIELD_LABELS` と `describeAuditAction` / `describeAuditTargetType` / `describeAuditField` を追加。操作コード・対象種別・フィールド名を日本語表示し、未登録コードのみ raw fallback（情報欠落防止）。
- **C2 フィルタ段階開示**: フォームを「常時表示（操作の種類 / 実行者 / 期間×2 / 表示件数）+ `<details>`詳細な絞り込み（対象の種類 / 対象ID / 一括処理ID）」の 2 層へ。詳細フィルタに値があれば `<details open>`。
- **C3 カードブロック整列**: `.chip-row` の `flex-wrap`、用語集グリッド・カード meta グリッドの整列、`.admin-audit-filter-advanced`（details）スタイル追加。
- **API 契約維持**: `<input name>`（= query param キー）は英語のまま不変。UI 表示ラベルのみ日本語化。新規 primitive・新規 token・新規 endpoint はゼロ。

### 受入条件チェックリスト

- [ ] AC-1 フィルタフォーム全ラベル日本語化・`<input name>` 英語不変
- [ ] AC-2 フィルタ 2 層段階開示（詳細に値ありで open）
- [ ] AC-3 カード action / targetType 日本語表示・未登録のみ raw fallback
- [ ] AC-4 適用チップ日本語化・英語キー名露出 0
- [ ] AC-5 datalist placeholder / auditId ラベルの英語キー名解消
- [ ] AC-6 glossary SSOT に 3 ラベルマップ + 3 describe helper + raw fallback
- [ ] AC-7 カードブロック整列（chip-row wrap / グリッド）
- [ ] AC-8 OKLch トークンのみ（HEX 0 件・`verify:tokens` PASS）
- [ ] AC-9 API / D1 / Form / shared 型 diff 0 件・query param キー不変
- [ ] AC-10 新規 primitive 0 件
- [ ] AC-11 a11y 維持（label 関連付け / `<details>` キーボード / `aria-label` / WCAG AA）
- [ ] AC-12 既存機能温存（検索 / リセット / cursor / PII / JSON / エラー親切化）

### スクリーンショット（pending）

> 現時点では `outputs/phase-11/screenshots/` に PNG 実体なし。PR 作成時点でも未取得なら、このセクションは削除する（CLAUDE.md フロー準拠）。

| 状態 | 画像 |
| --- | --- |
| 画面全体（日本語化後・desktop） | `outputs/phase-11/screenshots/audit-page-full.png` |
| フィルタ閉（詳細な絞り込み初期状態） | `outputs/phase-11/screenshots/audit-filter-collapsed.png` |
| フィルタ開（詳細な絞り込み展開） | `outputs/phase-11/screenshots/audit-filter-expanded.png` |
| カード日本語ラベル | `outputs/phase-11/screenshots/audit-timeline-cards-ja.png` |
| 適用フィルタチップ整列 | `outputs/phase-11/screenshots/audit-applied-filters-chips.png` |
| モバイル幅 | `outputs/phase-11/screenshots/audit-page-mobile.png` |

### テスト結果

| コマンド | 結果 |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run ... auditGlossary/auditAppliedFilters/AuditLogPanel/AuditLogCard` | PASS（4 files / 57 tests） |
| `mise exec -- pnpm typecheck` | （最終検証で記録） |
| `mise exec -- pnpm lint` | （最終検証で記録） |
| `mise exec -- pnpm verify:tokens` | （最終検証で記録） |
| `git diff --name-only -- apps/api packages/shared` | （実装後・空） |

### スコープ外（本 PR では扱わない）

- CSV エクスポート / total 件数表示（新 endpoint 要・先行タスク Future scope）
- query param キー名の日本語化（API 契約のため不可）
- 監査ログ以外の admin 画面の同種改善（別タスク）
- 未登録 action コードの SSOT 網羅（DB 実データ調査要・出現時に追記）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
