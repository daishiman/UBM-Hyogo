# Phase 08 — DRY 化

## 重複排除した抽象
- `required(raw, key)` — undefined / 空白 trim を一元化
- `PLACEHOLDERS` 配列 + `reduce` — placeholder 置換を hand-rolled 個別 replace から脱却
- `RELEASE_RE` / `COMMIT_RE` / `ISO8601_RE` を module top-level 定数化（regex の再生成回避）

## 単一責務分離
- I/O（`loadTemplate` / `ensureEvidencePathExists` / `writeFileSync` / `process.std*`）と pure 関数を厳密に分離
- pure 関数は `template: string` を引数で受ける（`loadTemplate` 副作用を test から隠蔽）

## 不要抽象の除去
- 1 度しか呼ばれない単機能の helper は inline 化
- `parseCliArgs` の値転写は `node:util#parseArgs` のオプション定義で完結

## 影響範囲
- 既存 module / spec への影響なし（`scripts/postmortem/` 配下のみ）
