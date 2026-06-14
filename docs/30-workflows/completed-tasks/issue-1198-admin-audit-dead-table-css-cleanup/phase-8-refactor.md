# Phase 8: リファクタリング — issue-1198 admin-audit dead table CSS cleanup

本タスク自体が dead code 除去のリファクタリングである。Phase 8 では追加の重複削除・命名整理・navigation drift 解消は行わず、変更範囲を `apps/web/src/styles/globals.css` の旧 audit テーブル系 dead CSS **3 ブロックの削除のみ**に厳密限定する。

## 1. リファクタリングの位置づけ

| 観点 | 内容 |
| --- | --- |
| 種別 | dead code 除去（未参照 CSS の物理削除） |
| 対象 | `apps/web/src/styles/globals.css` の `.admin-audit-filter` / `.admin-audit-table-scroll` / `.admin-audit-table` |
| 動機 | `/admin/audit` カード化（#1202）で未参照化した旧テーブル系 CSS が残置し、コード衛生（dead code 不在）の SSOT を侵している |
| 副作用 | なし（削除対象は未適用 CSS＝描画に 1px も影響しない・NON_VISUAL） |
| アンカー | 行番号は stale 前提。**セレクタ名**で範囲確定（[shared-context.md](shared-context.md) §1） |

## 2. 変更内容（[Feedback RT-03] Before/After テーブル）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `.admin-audit-filter` ブロック | `globals.css`（現行 `.admin-audit-filter` アンカー位置）に `display:grid` 等 5 プロパティの定義が残置 | 削除済み（定義消失） | カード化で `.admin-audit-applied-filters`（`AuditLogPanel.tsx:161`）へ置換済み。旧フィルタ grid は 0 参照の dead code |
| `.admin-audit-table-scroll` ブロック | `globals.css`（同上）に `overflow-x:auto` の定義が残置 | 削除済み（定義消失） | テーブル横スクロールはカード型タイムラインに不要。0 参照の dead code |
| `.admin-audit-table` ブロック | `globals.css`（同上）に `width/border-collapse/font-size` の定義が残置 | 削除済み（定義消失） | カード化で `.admin-audit-card` / `.admin-audit-timeline`（`AuditLogCard.tsx:32` / `AuditLogPanel.tsx:189`）へ置換済み。0 参照の dead code |
| `globals.css` 全体 | 旧テーブル系 3 ブロック（≒17 行・空行込み）が残存 | 3 ブロック削除済み・**カード系 CSS のみ残存** | dead code 純減。追加 0 行。差分は削除のみ |

## 3. 範囲外（本 Phase で実施しないリファクタリング）

| 項目 | 理由 |
| --- | --- |
| `.tbl` 汎用ユーティリティ（現行ヒットなし）の整理 | audit 専用ではなく他画面が使用中。本タスク対象外（[shared-context.md](shared-context.md) §6 不変条件） |
| `.admin-audit-guide` 以降のカード系 CSS の再編 | 現行 UI 使用中。無変更で保持（削除範囲を `.admin-audit-table` の `}` までに厳密限定） |
| 他の dead CSS 探索・一括削除 | スコープ拡大は CONST_007 違反。本タスクは 3 ブロックに閉じる単一サイクル |
| navigation / shell-config の drift 確認 | 表現層 CSS のみが対象。ナビ構造は不可侵 |

## 4. リファクタリング後の構造（期待形）

```
apps/web/src/styles/globals.css（@media ブロック内）
  保持: .schema-field-card.diff-removed { ... }   ← 直前・無変更
  （削除: .admin-audit-filter / .admin-audit-table-scroll / .admin-audit-table）
  保持: .admin-audit-guide { ... } 以降           ← 直後・カード UI 使用中
```

- `.schema-field-card.diff-removed` と `.admin-audit-guide` が空行 1 行で隣接する整形を保つ（[phase-2-design.md](phase-2-design.md) §3 手順 3）。

## 完了条件

- [ ] 変更内容を `対象/Before/After/理由` テーブルで記録（[Feedback RT-03]）
- [ ] 範囲を globals.css の 3 ブロック削除に限定（追加重複削除・navigation drift は対象外と明記）
- [ ] Before（3 dead ブロック残置）/ After（削除済み・カード系 CSS のみ残存）を明記
- [ ] アンカーをセレクタ名に固定（行番号 stale 前提）を確認
- [ ] 範囲外リファクタリング（`.tbl` / `.admin-audit-guide` / 他 dead CSS 探索）を明示
