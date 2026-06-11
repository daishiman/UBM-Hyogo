# Phase 1 — 要件定義

> 正本: [shared-context.md](./shared-context.md)。本書は要件を確定する。

## 1. 実装区分

**[実装区分: 実装仕様書]**（CONST_004 デフォルト）。
- 判定根拠: 目的（監査ログ画面を「読める・目的が分かる」状態にする / `reduce` クラッシュを止める）はいずれも **apps/web のコード変更なしには達成不可能**。新規 React コンポーネント・純関数・CSS・防御ガード・回帰テストを伴う。docs-only の例外条件に該当しない。

## 2. タスク分類

| 項目 | 値 |
|------|-----|
| タスク種別 | UI task（VISUAL） |
| implementation_mode | `new`（RED/GREEN） |
| 主スコープ | `/(admin)/admin/audit`（監査ログ UI/UX） |
| 副スコープ | `/(admin)/admin/tags/catalog`（reduce エラー防御） |
| API 変更 | なし（既存 endpoint surface のみ） |

## 3. 背景・課題（ユーザー報告 staging）

`https://ubm-hyogo-web-staging.../admin/audit` で:
1. 監査ログの UI/UX が「めちゃくちゃ見にくい」。表・情報が過密で、ここで何がしたいのかが分からない。
2. コンソールに `TypeError: Cannot read properties of undefined (reading 'reduce')`（`error.boundary.caught`, scope: admin）。

## 4. 真因（調査確定）

- **案件1（UI/UX）**: `apps/web` 表現層の情報設計欠如。API は zod 検証 + PII redact + cursor pagination で堅牢（無罪）。`appliedFilters` は型・API に存在するが UI 未表示。結果は4列テーブルで過密。目的説明・用語ガイドが皆無。
- **案件2（reduce エラー）**: `TagCatalogPanel.tsx:44/71/164` が props 防御ガードを欠き、`safeServerFetch` の `result.data` が期待 shape でないとき `items.reduce` でクラッシュ。admin 共通 error boundary で別画面でも表面化。
- 詳細・行番号は shared-context §3 参照。

## 5. ユーザー意思決定（AskUserQuestion 確定）

| 問 | 決定 |
|----|------|
| 結果表示の改善 | **カード型タイムラインに刷新** |
| 目的の明確化 | **目的説明＋用語ガイドを常時表示** |
| reduce エラーの扱い | **今回サイクルで一緒に修正**（catalog 防御ガード） |

## 6. スコープ

### 含む
- 監査ログ結果のカード型タイムライン化（Lane A）
- `appliedFilters` 可視化（Lane A）
- 目的・用語ガイド常時表示（Lane B）
- エラーメッセージ親切化 + datalist 拡充（Lane B）
- `TagCatalogPanel` 防御ガード + 回帰 spec（Lane C）

### 含まない（shared-context §7）
- OOS-1 total 件数表示（API 変更必要）
- OOS-2 エクスポート（独立スコープ）
- OOS-3 catalog→redirect 統合（別WF）
- OOS-4 旧テーブル CSS 削除（Phase 8 で参照確認後判定）

## 7. 受入条件

shared-context §6（AC-1〜AC-10）を正とする。

## 8. 命名規則（既存コードベース分析）

| 対象 | 規則 | 例 |
|------|------|-----|
| React コンポーネント | PascalCase `.tsx` | `AuditLogCard.tsx`, `AuditPurposeGuide.tsx` |
| 純関数/データモジュール | camelCase `.ts` | `auditAppliedFilters.ts`, `auditGlossary.ts`, `auditErrorMessage.ts` |
| テスト | `*.spec.{ts,tsx}`（`*.test.*` 禁止） | `AuditLogCard.spec.tsx` |
| CSS クラス | kebab + BEM風 `__` | `.admin-audit-card`, `.admin-audit-card__head` |
| data 属性 | `data-component` / `data-testid` | `data-component="audit-purpose-guide"` |

既存 exported 純関数（`maskAuditJson` 等）の命名・シグネチャは維持（AC-7）。

## 9. P50 前提確認チェック

| 確認項目 | 結果 |
|---------|------|
| current branch に実装が存在するか | No（仕様書作成のみ。ローカル実装は完了） |
| upstream にマージ済みか | No |
| 前提タスク完了済みか | 該当なし（独立タスク） |

→ `implementation_mode: new`。Phase 4 = TDD RED 設計、Phase 5 = 新規実装手順。

## 10. テスト対象ファイル事前列挙（targeted run・SIGKILL 回避）

shared-context §8 の vitest 対象6ファイルを Phase 4 で確定。全件 `pnpm test` ではなく対象指定で実行する。

## 11. carry-over 確認

`git log --oneline -5` の直近は #1176（attendance dashboard UX）/#1183（member data source）等。本タスクと重複なし。新規 workflow として開始。
