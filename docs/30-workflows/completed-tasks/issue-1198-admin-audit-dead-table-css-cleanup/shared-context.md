# Shared Context — issue-1198 admin-audit dead table CSS cleanup

全 Phase が参照する単一の事実源（SSOT）。本ファイルと現行コードが矛盾する場合は現行コードを優先し、本ファイルを訂正する。

## 1. 対象ファイルと削除単位（唯一の変更点）

| 項目 | 値 |
| --- | --- |
| 変更ファイル | `apps/web/src/styles/globals.css`（**新規/編集/削除 のうち「編集（行削除のみ）」**） |
| 削除セレクタ | `.admin-audit-filter` / `.admin-audit-table-scroll` / `.admin-audit-table` |
| 削除前位置（2026-06-13 実測） | 行 2023-2039（`.admin-audit-filter` 2023 / `.admin-audit-table-scroll` 2031 / `.admin-audit-table` 2035。終端 `}` は 2039） |
| 保持境界 | 削除後の `.admin-audit-guide`（現行 `globals.css:2023〜`）以降は **削除していない** |
| 削除行数 | 18 行の純減。追加 0 行 |

> 行番号は後続コミットでずれ得る。今回もセレクタ名で範囲を確定して削除した。

### 削除対象 CSS（現行ブロックの逐語スナップショット・実装時の照合用）

```css
  .admin-audit-filter {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    align-items: end;
    gap: var(--ubm-space-3);
    margin-bottom: 20px;
  }

  .admin-audit-table-scroll {
    overflow-x: auto;
  }

  .admin-audit-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
```

> この 3 ブロック（先頭 `.admin-audit-filter {` から `.admin-audit-table` の `}` まで）のみを削除する。直前の `.schema-field-card.diff-removed { ... }` と直後の `.admin-audit-guide { ... }` は無変更。

## 2. ゼロ参照証跡（AC-1 の根拠）

```bash
grep -rn "admin-audit-filter\|admin-audit-table" apps/web/src apps/web/app \
  --include="*.tsx" --include="*.ts"
```

- 期待: **0 行**（コンポーネント参照ゼロ）。
- 既知の唯一ヒット: `apps/web/playwright/tests/admin-schema-conflicts-audit.spec.ts:137` の `name: 'admin-audit-filtered.png'` は **Playwright スクリーンショットの出力ファイル名**であり CSS クラスセレクタ参照ではない。`.css` 定義行（globals.css 自身）も「参照」ではないため `--include` で除外する。

## 3. 保持すべき置換クラス（移行完了の裏取り）

| 概念 | 旧（削除） | 新（保持・使用中） | 使用箇所 |
| --- | --- | --- | --- |
| フィルタフォーム | `.admin-audit-filter` | `.admin-audit-applied-filters` | `AuditLogPanel.tsx:161` |
| 行レイアウト | `.admin-audit-table` / `.admin-audit-table-scroll` | `.admin-audit-card` / `.admin-audit-timeline` | `AuditLogCard.tsx:32` / `AuditLogPanel.tsx:189` |
| ガイド/用語 | （旧テーブルに付随） | `.admin-audit-guide` / `.admin-audit-glossary` | 現行カード UI |

## 4. 検証コマンド（全 Phase 共通・正本）

```bash
# AC-1: 削除前ゼロ参照証跡
grep -rn "admin-audit-filter\|admin-audit-table" apps/web/src apps/web/app --include="*.tsx" --include="*.ts"

# AC-2/AC-3: 削除後の定義消失 + 保持確認
grep -n "admin-audit-filter\|admin-audit-table-scroll\|admin-audit-table" apps/web/src/styles/globals.css     # 0 件期待（exit 1）
grep -n "admin-audit-guide\|admin-audit-card\|admin-audit-timeline\|admin-audit-applied-filters" apps/web/src/styles/globals.css  # ヒット維持期待
rg -n "\.tbl\b|tbl" apps/web/src/styles/globals.css apps/web/src apps/web/app --glob "*.{css,tsx,ts}"          # 0 件期待（現行ベースライン）

# AC-4: 静的検証
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens

# AC-5: 監査ログ focused Vitest 回帰確認
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx
```

## 5. 受入条件（AC）一覧

| ID | 内容 | 検証 |
| --- | --- | --- |
| AC-1 | 削除前に 3 セレクタの `.tsx`/`.ts` 参照が 0 件であることを grep で証跡化 | §4 AC-1 コマンド |
| AC-2 | `globals.css` から 3 ブロックを削除（`.admin-audit-guide` 以降は保持） | §4 AC-2 grep |
| AC-3 | 新規カード系 CSS は無変更、`.tbl` は現行 0 件を維持 | §4 AC-3 grep |
| AC-4 | typecheck / lint / verify:tokens すべて PASS（HEX 0 違反） | §4 AC-4 |
| AC-5 | 監査ログ focused Vitest が regression なく全 PASS | §4 AC-5 |
| AC-6 | diff は `globals.css` の 3 ブロック削除（純減）のみ・apps/api / D1 / Form 無変更 | `git diff --stat` |

## 6. 不変条件（再掲）

1. OKLch トークン正本維持。削除のみ＝HEX 混入リスク 0。
2. 削除前に grep で 0 参照を再確認（AC-1）。
3. 監査ログ focused Vitest は dead CSS 非依存 → テスト変更不要・回帰確認のみ。
4. D1 直接アクセス禁止・既存 API surface のみ。
5. 行番号ではなくセレクタ名で範囲確定（issue の 1602-1618 は stale）。

## 7. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| `.admin-audit-guide` 以降の新規カード系 CSS まで巻き込み削除 | 高（カード UI 崩れ） | 削除範囲を `.admin-audit-table` の `}`（行 2039）までに厳密限定。削除後 §4 AC-3 grep で保持確認 |
| `.tbl` 汎用クラスを誤削除し他画面に波及 | 高 | `.tbl` は現行コードに存在しない stale 前提だったため、本タスクで追加しない。削除後 rg 0 件を維持確認 |
| 行番号アンカーで誤った行を削除 | 中 | セレクタ名で `grep -n` 再取得してから削除 |
| 実は他 admin 画面が 3 クラスを参照していて視覚崩れ | 低 | 削除前 §4 AC-1 grep 0 件を証跡化 |
| OKLch トークン正本逸脱 | 低 | 削除のみで追加なし。`verify:tokens` で 0 違反確認 |
