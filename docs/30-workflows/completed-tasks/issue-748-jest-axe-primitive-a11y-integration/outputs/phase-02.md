# Phase 2 — 現状調査・stale 確認

[実装区分: 実装仕様書]

## 2.1 issue stale 判定

issue #748 は 2026-05-15 起票 / 2026-05-16 CLOSED。CLOSED 理由はコミット履歴に明示されておらず、`grep`/`rg` による現行コード調査の結果、本対応は **未実装** である。

### 確認コマンドと結果（2026-05-17 実施）

```bash
# (1) primitive spec に axe import がない
rg "jest-axe|axe-core|toHaveNoViolations" apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx
# → ヒット 0 件
```

```bash
# (2) 依存は存在
rg '"jest-axe"|"@types/jest-axe"' apps/web/package.json
# → 2 件ヒット
```

```bash
# (3) 既存 admin spec の axe 利用 pattern
rg -l "jest-axe" apps/web/src
# → BulkActionBar / MembersTable / RecentActionsTable / MembersFilters / KpiGrid のみ
```

```bash
# (4) vitest setupFiles / expect.extend 未使用
rg "toHaveNoViolations|expect.extend" apps/web vitest.config.ts
# → ヒット 0 件
```

```bash
# (5) admin の violations 判定 pattern
rg -n "results.violations" apps/web/src/features/admin/components/__tests__/
# → 既存パターン: expect(results.violations).toHaveLength(0)
```

## 2.2 対象 primitive と現状の proxy assertion

| primitive | ファイル | 現行 proxy assertion |
| --- | --- | --- |
| FormField | `apps/web/src/components/ui/FormField.tsx` | `aria-invalid` / `aria-describedby` / `role="alert"` の id 一致 |
| EmptyState | `apps/web/src/components/ui/EmptyState.tsx` | `role="status"` 存在確認 |
| Pagination | `apps/web/src/components/ui/Pagination.tsx` | `nav[aria-label="pagination"]`、disabled 時クリック非発火 |
| Icon | `apps/web/src/components/ui/Icon.tsx` | `aria-hidden` 切替、`role="img"` + `aria-label`、size px 値 |
| Breadcrumb | `apps/web/src/components/admin/Breadcrumb.tsx` | `nav[aria-label="breadcrumb"]`、`aria-current="page"`、separator `aria-hidden` |

## 2.3 削除可能 / 残置すべき assertion の分類

| カテゴリ | 例 | 扱い |
| --- | --- | --- |
| 一般的 a11y 違反（axe で検出可能） | 「`role` 属性が存在する」「`aria-label` がある」 | **削除可** — axe が代替 |
| 固有契約値の確認（axe では捕捉不能） | `aria-current="page"` の値、`aria-describedby` と `id` の参照関係、Icon の `size` ごとの px 値 | **残置** — primitive 固有契約 |
| 振る舞い contract | `onNext` / `onPrev` 発火条件、required ↔ アスタリスク表示 | **残置** — a11y と無関係の機能 contract |

## 2.4 結論

- 本タスクは **実行が必要**。
- 既存 admin pattern と揃え、`expect.extend` 非使用・`configureAxe` での rule baseline 明示の方針が最も影響範囲が小さい。
