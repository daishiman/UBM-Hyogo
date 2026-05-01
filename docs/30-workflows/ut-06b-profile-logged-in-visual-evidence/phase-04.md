# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-30 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

manual smoke の evidence チェックリストを確定し、AC × evidence × 不変条件のトレース基盤を Phase 7 に渡す準備を行う。

## test 戦略

本タスクは **VISUAL manual smoke** で、自動 test は範囲外。代わりに以下の **3 種 verify** を行う:

1. **取得 verify**: 10 evidence files（6 screenshots + 3 DevTools txt + 1 diff）が `outputs/phase-11/evidence/` に物理存在し、Phase 11 補助 metadata 4 ファイルも存在
2. **内容 verify**: DevTools 出力（3 件）で `count: 0` が観測されている
3. **secret hygiene verify**: txt / diff / metadata には grep、png は目視で token / Cookie / Authorization 値が含まれないことを確認

## evidence チェックリスト（`outputs/phase-04/evidence-checklist.md` に詳細化）

| # | ファイル | 取得 | 内容 | hygiene |
| --- | --- | --- | --- | --- |
| 1 | M-08-profile.png | □ | logged-in 表示 | □ |
| 2 | M-09-no-form.png | □ | form 視覚的不在 | □ |
| 3 | M-09-no-form.devtools.txt | □ | `count: 0` | □ |
| 4 | M-10-edit-query-ignored.png | □ | `?edit=true` でも read-only | □ |
| 5 | M-10-edit-query-ignored.devtools.txt | □ | `count: 0` | □ |
| 6 | M-14-staging-profile.png | □ | staging logged-in | □ |
| 7 | M-15-edit-cta.png | □ | staging edit CTA | □ |
| 8 | M-16-localstorage-ignored.png | □ | localStorage 無視 | □ |
| 9 | M-16-localstorage-ignored.devtools.txt | □ | sanitized localStorage / DOM 観測 | □ |
| 10 | manual-smoke-evidence-update.diff | □ | 6 行 `pending` → `captured` | □ |

## coverage 目標

- evidence 取得率 100%（10 evidence files）
- DevTools / metadata 観測率 100%（3 txt + 4 Phase 11 補助 metadata）
- secret hygiene 違反 0 件（grep `(token|Cookie|Authorization|Bearer)` で hit 0）

## 実行タスク

- [ ] `outputs/phase-04/main.md` に test 戦略サマリ
- [ ] `evidence-checklist.md` を 10 evidence rows + hygiene 列で配置
- [ ] secret hygiene grep パターンを runbook 入力としてドラフト

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/evidence-naming.md | 命名 |
| 必須 | outputs/phase-03/main.md | 採用案 C |

## 完了条件

- [ ] evidence-checklist.md 配置
- [ ] coverage 目標明示
- [ ] secret hygiene grep パターン提示

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 4 を completed

## 次 Phase

- 次: Phase 5 (実装ランブック)
- 引き継ぎ: チェックリスト 11 件 + 3 列、grep パターン
