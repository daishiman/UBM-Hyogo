# Merge Conflict Cases (C-1 〜 C-7)

## ファイル分類

| 分類 | 例 | 衝突発生機序 |
| --- | --- | --- |
| 行独立 ledger | `LOGS.md` (旧) / `lessons-learned-*.md` | 同一末尾位置への append が常に衝突 |
| 構造体 ledger | `indexes/keywords.json` / `indexes/index-meta.json` | `totalKeywords` 等のカウンタ単純インクリメントで全 worktree 衝突 |
| 自動生成派生物 | hook で再生成される LOGS / index 群 | 派生物が tracked のため再生成タイミングで衝突 |
| index 役 ファイル | `SKILL.md` (A-3 後) | 別セクション編集なら通常 merge 成功、同一行なら通常通り conflict（許容） |
| fragment | `LOGS/<ts>-<branch>-<nonce>.md` | 別ファイルのため衝突しない（ファイル名衝突のみ意味的検知対象） |

## 施策適用前後マトリクス

| ケース | 対象 | 操作 | 適用前 | 適用後 (期待) | 衝突理由 (適用前) |
| --- | --- | --- | --- | --- | --- |
| C-1 | LOGS fragment | 2 wt が同秒・同 branch で fragment 生成 | nonce 欠如時はファイル名衝突 | nonce で一意化、衝突時は命名規約違反として検知（FAIL before commit） | nonce 欠如 |
| C-2 | LOGS fragment | 2 wt が異なる fragment を生成 | (旧)末尾追記で衝突 | 衝突なし (A-2) | 同一バイト位置 append |
| C-3 | `indexes/keywords.json` | 2 wt が hook で再生成 | カウンタ衝突 | git tree に出ず衝突 0 (A-1) | `totalKeywords` 値が異なる |
| C-4 | `LOGS.md` (B-1 適用、A-2 移行前) | 2 wt が末尾追記 | 末尾位置衝突 | `merge=union` で両追記保存 (B-1) | 同一行末位置 |
| C-5 | `SKILL.md` (A-3 後 index 役) | 2 wt が別セクション編集 | 高頻度衝突 | 別箇所なら通常 merge 成功、同一行なら通常 conflict（許容） | 1000 行で局所追記が密集 |
| C-6 | render script | 集約 view を生成 | （該当なし） | timestamp 降順で出力 | — |
| C-7 | 異常 fragment | timestamp 欠損 fragment を render | render 沈黙失敗 | エラー停止し file path を表示 | front matter 不正 |

## ケース詳細

### C-1 — fragment 名衝突検知

- 再現: 2 worktree で同一秒 + 同一 branch で `pnpm skill:logs:append` を実行
- 期待: nonce 部 (8〜12 hex) で一意化されるため通常は衝突しない。
  nonce 衝突が発生した場合は「**意味的に同時刻同一ブランチからの 2 件**」として
  ファイル名衝突を **検知** する（fail before commit）。

### C-2 — 通常並列 fragment 生成

- 再現: 異なる worktree から異なる timestamp で fragment 生成
- 期待: 別ファイルのため `git merge` でコンフリクトなし

### C-3 — gitignore 化 ledger の並列再生成

- 再現: A-1 適用後、2 worktree で hook 起動 → `keywords.json` 再生成
- 期待: tracked ではないため `git status` に出ず、merge にも現れない

### C-4 — merge=union による末尾追記併合

- 再現: A-2 移行前 / B-1 適用済の `LOGS.md` 末尾に 2 worktree が追記して merge
- 期待: 両方の追記行が結果ファイルに保存される（行順は merge driver 依存）

### C-5 — SKILL.md 分割後の通常 merge

- 再現: A-3 適用後、2 worktree が別 reference を編集
- 期待: 別ファイル編集のため衝突 0。同一行編集時は通常通り conflict（許容範囲、ledger 由来ではない）

### C-6 — render script 集約

- 再現: `pnpm skill:logs:render` 実行
- 期待: timestamp 降順、front matter 通り集約

### C-7 — 異常 front matter

- 再現: `timestamp` を欠いた fragment を fixture として配置し render
- 期待: `outputs/phase-2/fragment-schema.md` の Failure Rules に従い `render fails with file path`

## 判定基準

- 各ケースの「適用後」期待が満たされない場合、Phase 7 に差し戻し
- AC-5 / AC-6 のトレースは Phase 11 manual-smoke-log.md で照合
