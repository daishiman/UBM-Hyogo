# Phase 6: テスト拡充 — issue-1198 admin-audit dead table CSS cleanup

## 1. 方針: 新規テスト追加は不要

本タスクは「未参照 CSS 3 ブロックの削除のみ」で、新しい振る舞い・分岐・fail path を一切導入しない。したがって fail path テストや新規ユニットテストの追加は不要。代わりに **削除後 grep gate** を回帰 guard として明文化する。

## 2. fail path / 回帰 guard の検討

| 想定 fail シナリオ | 検知手段（回帰 guard） | 期待 |
| --- | --- | --- |
| 削除範囲が広すぎて `.admin-audit-guide` 以降のカード系 CSS を巻き込んだ | `grep -n "admin-audit-guide\|admin-audit-card\|admin-audit-timeline\|admin-audit-applied-filters" apps/web/src/styles/globals.css` | **ヒット維持**（消えていたら過剰削除＝NG） |
| `.tbl` stale 前提を再導入した | `rg -n "\.tbl\b|tbl" apps/web/src/styles/globals.css apps/web/src apps/web/app --glob "*.{css,tsx,ts}"` | **0 件維持** |
| 旧 3 セレクタが削除しきれず残った | `grep -n "admin-audit-filter\|admin-audit-table-scroll\|admin-audit-table" apps/web/src/styles/globals.css` | **0 件** |
| カード UI の描画契約が壊れた | focused Vitest 2 本（AuditLogPanel.component / AuditLogCard） | **全 PASS** |

## 3. 削除後 grep gate（回帰 guard の正本）

shared-context §4 の削除後 grep を本タスクの回帰 guard とする。3 つの grep を一組で扱う:

```bash
# (1) 旧 3 クラスが globals.css から消えたこと（0 件）
grep -n "admin-audit-filter\|admin-audit-table-scroll\|admin-audit-table" \
  apps/web/src/styles/globals.css

# (2) 新規カード系 CSS のヒット維持（過剰削除の検知）
grep -n "admin-audit-guide\|admin-audit-card\|admin-audit-timeline\|admin-audit-applied-filters" \
  apps/web/src/styles/globals.css

# (3) .tbl stale 前提の非再導入（0 件維持）
rg -n "\.tbl\b|tbl" apps/web/src/styles/globals.css apps/web/src apps/web/app --glob "*.{css,tsx,ts}"
```

合格条件: (1) 0 件 / (2) ヒット維持 / (3) 0 件維持。これら 3 条件を「削除後 grep gate」として AC-2 / AC-3 の機械検証に充てる。

## 4. EMB-005-FB の観点（NON_VISUAL + 単一変更）

- 本タスクは **NON_VISUAL**（dead CSS は未適用＝視覚出力に影響なし）かつ **単一ファイル単一変更**（globals.css の 3 ブロック削除のみ）。
- このクラスのタスクは、新規 fail path テストを増やすよりも、(a) 既存 focused Vitest による回帰確認と (b) 削除後 grep gate による構造検証の 2 つで **Phase 6 段階で coverage 担保が完結する**。
- 振る舞いの追加がないため、新規テストでカバーすべき新コードパスが存在しない。Phase 6 で「削除後 grep gate を回帰 guard として明文化」することが、本タスクにおけるテスト拡充の実体となる。

## 完了条件

- [ ] 新規テスト追加が不要であることを明記した
- [ ] fail path / 回帰 guard を検討・整理した
- [ ] 削除後 grep gate（旧 3 クラス 0 件・カード系/`.tbl` 現行 0 件維持）を回帰 guard として明文化した
- [ ] EMB-005-FB の観点（NON_VISUAL + 単一変更は Phase 6 で coverage 担保可能）に触れた
