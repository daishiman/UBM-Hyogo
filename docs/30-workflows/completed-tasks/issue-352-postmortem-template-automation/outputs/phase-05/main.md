# Phase 05 — 実装ランブック

## 追加ファイル
| path | 役割 |
| --- | --- |
| `scripts/postmortem/generate-postmortem.ts` | CLI + pure 関数本体 |
| `scripts/postmortem/__tests__/generate-postmortem.test.ts` | unit tests |
| `docs/30-workflows/runbooks/postmortem/template.md` | 固定見出し markdown テンプレ |
| `docs/30-workflows/runbooks/postmortem/README.md` | 運用 runbook（生成手順 + follow-up issue 作成） |

## 編集ファイル
| path | 内容 |
| --- | --- |
| `package.json` | `scripts.postmortem:generate = "node --experimental-strip-types scripts/postmortem/generate-postmortem.ts"` |

## 実装手順
1. `template.md` を固定見出し（メタ情報 / Timeline / Impact / Detection / Response / Root Cause / Prevention / Follow-up Issues）で作成
2. `generate-postmortem.ts` に `validateInput` / `ensureEvidencePathExists` / `renderTemplate` / `generatePostmortem` / `loadTemplate` / `main` を実装
3. CLI は `node:util#parseArgs` で hyphenated long flags を受ける
4. `package.json` に pnpm script を追加
5. unit test を作成し `mise exec -- pnpm vitest run scripts/postmortem` で green
6. `README.md` に実行手順 + follow-up issue 作成スニペットを記述
7. `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` で gate 通過

## ローカル検証
```bash
mise exec -- pnpm postmortem:generate -- --help
mise exec -- pnpm vitest run scripts/postmortem
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```
