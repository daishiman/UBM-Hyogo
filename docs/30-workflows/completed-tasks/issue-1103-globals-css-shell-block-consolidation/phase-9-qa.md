# Phase 9: 品質保証 — issue-1103 globals.css 重複 shell ブロック 1 本化

> **[実装区分: 実装仕様書 / NON_VISUAL]**

## 1. 本タスクの QA 観点（極小・重複ブロック削除のみ）

本タスクの code diff は `apps/web/src/styles/globals.css` の後発重複ブロック（1774-1904・130 行）の**削除のみ**であり、新しい振る舞い・新しい値を足さない。したがって QA は「削除が安全に成立しているか」「残存ブロック1（1642-1772）の値が無変更か」「build / token gate が緑か」の 3 軸に集約する。

byte 完全一致ブロックの削除であるため、cascade 上書きはゼロ・描画値は不変であり、視覚回帰の発生余地が原理的に存在しない（NON_VISUAL の妥当性根拠）。

## 2. 削除確認の合格基準 [Feedback FB-UI-02-1]

削除は「**git diff 上で後発重複ブロックの行削除のみ（git delete 相当）**」を PASS とする。本件は CSS ブロックの物理削除であり、削除後に以下の grep / diff でゼロ件・削除のみを証跡に残す。

### 削除前（事前検証 = AC-3）

```bash
# 削除前: parallel-01 ブロックが 2 回出現することを確認
grep -n 'data-shell="sidebar"' apps/web/src/styles/globals.css   # → 3 件（1708 / 1840 / 2306）

# 削除前: ブロック1（1642-1772）とブロック2（1774-1904）が byte 完全一致（diff 空）であることを証明
sed -n '1642,1772p' apps/web/src/styles/globals.css > /tmp/blk1.css
sed -n '1774,1904p' apps/web/src/styles/globals.css > /tmp/blk2.css
diff /tmp/blk1.css /tmp/blk2.css   # → 出力なし（空 = byte 一致）
```

### 削除後（事後検証）

```bash
grep -n 'data-shell="sidebar"' apps/web/src/styles/globals.css   # → 2 件（1708 系 + admin 派生 2306 系）
grep -c 'parallel-01 P1-1' apps/web/src/styles/globals.css       # → 1（1 本化確認 / AC-2）
git diff apps/web/src/styles/globals.css                          # → 後発ブロック 130 行の削除のみ（追加行ゼロ・AC-4）
```

## 3. QA チェックリスト（local 実行済み・実装後）

| # | チェック項目 | 合格基準 | 状態 |
| --- | --- | --- | --- |
| Q-1 | 削除前 byte 一致 | `diff` でブロック1 vs ブロック2 が空（AC-3） | 実装前に取得（implemented_local_evidence_captured 段階） |
| Q-2 | grep カウント（sidebar） | 削除後 `data-shell="sidebar"` = **2 件**（削除前 3 件・AC-1） | 実装後に取得 |
| Q-3 | grep カウント（parallel-01 1 本化） | `parallel-01 P1-1` = **1**（AC-2） | 実装後に取得 |
| Q-4 | diff は削除のみ | `git diff` が後発ブロック 130 行の行削除に閉じる・追加行ゼロ（AC-4） | 実装後に取得 |
| Q-5 | 残存ブロック値無変更 | ブロック1（1642-1772）の値・selector・順序に diff が出ない（AC-5） | 実装後に取得 |
| Q-6 | build PASS | `mise exec -- pnpm --filter @ubm-hyogo/web build` exit 0（AC-7） | 実装後に取得 |
| Q-7 | token gate PASS | token runtime gate（`tokens.runtime.spec.ts` / `verify-design-tokens`）緑・HEX 直書き増なし（AC-6） | 実装後に取得 |
| Q-8 | lint PASS | `mise exec -- pnpm --filter @ubm-hyogo/web lint` exit 0 | 実装後に取得 |

## 4. line budget / link / mirror parity の扱い

| 観点 | 本タスクでの扱い |
| --- | --- |
| line budget | **N/A**（CSS は機械削除のみで行数は減少方向。新規ファイル増なし） |
| link 整合 | **N/A**（doc 内の関数/定数参照を伴う変更ではない・対象は CSS ブロックの削除のみ） |
| mirror parity | **N/A**（本タスクは docs のみのワークフローで、skill mirror（`.agents/skills` ↔ `.claude/skills`）は非対象） |

## 5. 想定リスクと緩和

- **誤削除（先発ブロックを消す / 範囲外を巻き込む）**: 削除前に §2 の `diff` で byte 一致を確定し、削除後に `git diff` で「後発ブロック 130 行の削除のみ・追加行ゼロ」を再確認する（Q-1 / Q-4）。
- **視覚回帰**: byte 一致ブロックの削除は cascade 上書きがゼロのため原理的に発生しない。念のため build 成功（Q-6）で bundling 整合を確認する。
- **token gate 交絡**: 値・token を一切触らないため token gate fail の余地なし（Q-7）。万一 fail した場合は削除範囲が想定外に広がっていないか `git diff` で再検証する。
