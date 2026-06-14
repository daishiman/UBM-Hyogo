# Phase 2: 設計 — issue-1198 admin-audit dead table CSS cleanup

## 1. 既存コンポーネント再利用可否（FB-SDK-07-1）

新規 UI 実装ゼロ。削除のみ。再利用すべき既存資産は現行カード UI の CSS（`.admin-audit-guide` / `.admin-audit-card*` / `.admin-audit-applied-filters` / `.admin-audit-timeline`）であり、これらは **無変更で保持**する。新規 primitive / クラスは生やさない（CLAUDE.md UI prototype alignment §不変条件 3）。

## 2. 変更トポロジ（唯一の変更点）

```
apps/web/src/styles/globals.css
  └─ @media ブロック内の隣接 3 セレクタを削除
       削除: .admin-audit-filter { ... }           (現行 2023-2029)
       削除: .admin-audit-table-scroll { ... }      (現行 2031-2033)
       削除: .admin-audit-table { ... }             (現行 2035-2039)
       保持: .schema-field-card.diff-removed { ... } (直前・無変更)
       保持: .admin-audit-guide { ... } 以降        (直後・カード UI 使用中)
```

- 状態所有権: CSS のみ。TS/TSX/型/データフローは一切触れない。
- 副作用: なし（削除対象は未参照＝レンダリングツリーに 1px も影響しない）。

## 3. 削除手順の設計（実行済み・再検証手順）

1. **削除前 grep（AC-1）**: `grep -rn "admin-audit-filter\|admin-audit-table" apps/web/src apps/web/app --include="*.tsx" --include="*.ts"` を実行し 0 件を証跡化。
2. **位置の再取得**: `grep -n "admin-audit-filter\|admin-audit-table-scroll\|admin-audit-table" apps/web/src/styles/globals.css` で現在の行を確認（行番号は stale 前提で都度取得）。
3. **削除**: `.admin-audit-filter {` の行から `.admin-audit-table` ブロックの閉じ `}` までを削除。`.admin-audit-table` の直後の空行 1 行も併せて除去し、`.schema-field-card.diff-removed` ブロックと `.admin-audit-guide` ブロックが空行 1 行で隣接する整形を保つ。
4. **削除後 grep（AC-2/AC-3）**: 旧 3 セレクタ 0 件 / 新規カード系ヒット維持 / `.tbl` 0 件維持を確認。

> 編集手段は Edit ツールの厳密一致（[shared-context.md](shared-context.md) §1 の逐語スナップショットを `old_string` に使用）を推奨。行範囲指定の sed 等は行ズレで誤削除リスクがあるため避ける。

## 4. validation path 設計

| 検証 | コマンド | 期待 |
| --- | --- | --- |
| 静的型 | `mise exec -- pnpm typecheck` | PASS（CSS 削除は型に無影響） |
| lint | `mise exec -- pnpm lint` | PASS |
| トークン | `mise exec -- pnpm verify:tokens` | in sync / HEX 0 違反 |
| 回帰（focused） | `vitest run ... AuditLogPanel.component.spec.tsx AuditLogCard.spec.tsx` | 全 PASS |
| 差分純減 | `git diff --stat apps/web/src/styles/globals.css` | 削除行のみ・追加 0 |

## 5. SubAgent lane（本タスクは極小のため lane 分割不要）

削除は単一ファイル単一箇所のため並列 lane は不要。実装は直列 1 lane（削除 → 検証）で完結する。

## 6. 因果・境界の確認

- 強化ループ: dead CSS 削除 → CSS ファイル縮約 → 次回の参照判定 grep が定義ノイズを減らし誤判定リスク低下。
- バランスループ: 削除範囲を誤ると `.admin-audit-guide` 以降のカード UI が崩れる → §3 手順 4 の grep で即検知し巻き戻し。
- 責務境界: 表現層（CSS）のみ。Engine/Service/API/D1 は不可侵。

## 7. 設計判断の固定

| 論点 | 判断 |
| --- | --- |
| 削除アンカー | セレクタ名（行番号は stale） |
| 削除範囲下限 | `.admin-audit-filter {`（行頭） |
| 削除範囲上限 | `.admin-audit-table { ... }` の閉じ `}` |
| `.tbl` | 対象外（汎用ユーティリティ・他画面使用） |
| テスト追加 | なし（dead CSS は非テスト対象・既存 2 本で回帰確認） |
| 視覚証跡 | NON_VISUAL（未適用 CSS の削除＝描画不変） |

## 完了条件

- [x] 再利用可否（新規ゼロ・既存カード CSS 保持）固定
- [x] 変更トポロジ（globals.css 1 箇所）確定
- [x] 削除手順（grep → 位置取得 → 削除 → grep）を再検証可能な粒度で記述
- [x] validation path 5 検証確定
- [x] 因果ループ・責務境界記述
