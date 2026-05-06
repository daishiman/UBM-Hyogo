# Phase 02 — 設計

## モジュール構成
- `scripts/postmortem/generate-postmortem.ts`
  - `validateInput(raw)` — CLI raw 入力 → `PostmortemInput | { ok: false; reason }`
  - `ensureEvidencePathExists(path)` — directory + `main.md` の実在チェック
  - `renderTemplate(template, input)` — `{{key}}` placeholder 置換（pure）
  - `generatePostmortem(input, template)` — 上記の合成（pure）
  - `loadTemplate()` — `docs/30-workflows/runbooks/postmortem/template.md` を read
  - `main(argv)` — CLI entry。exit code は `0 | 1 | 2`

## 入力検証
- `RELEASE_RE = /^v\d+\.\d+\.\d+$/`
- `COMMIT_RE = /^[0-9a-f]{7,40}$/`
- `ISO8601_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/`

## CLI 仕様
```
pnpm postmortem:generate -- \
  --release vX.Y.Z --commit <sha> \
  --evidence <09c-phase-11-dir> \
  --rollback-evidence <rollback-md> \
  --occurred-at <iso8601> \
  [--detected-at <iso8601>] [--resolved-at <iso8601>] \
  [--severity <label>] [--out <path>]
```
- `--out` 省略時は stdout に書き出す（pipeline / dry-run 用）
- `--out` 指定時はファイル書き出し失敗で exit code 2

## テンプレート設計
固定見出し（順序保証）:
1. メタ情報 / 2. Timeline / 3. Impact / 4. Detection / 5. Response /
6. Root Cause / 7. Prevention / 8. Follow-up Issues

placeholder: `{{release}} {{commit}} {{evidencePath}} {{rollbackEvidencePath}} {{occurredAt}} {{detectedAt}} {{resolvedAt}} {{severity}}`

## 冪等性
- `Date.now()` / `process.env` / `Math.random()` を使用しない
- 時刻は CLI 引数で受け、同一引数 → 同一 markdown
