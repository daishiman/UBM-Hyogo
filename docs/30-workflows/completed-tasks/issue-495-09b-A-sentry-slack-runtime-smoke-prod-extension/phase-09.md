# Phase 9: 品質保証 — issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 9 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

実装サイクルで route / test 変更が typecheck / lint / vitest / redaction grep / secret name-only check すべてに合格することを保証する。

## 検証観点

| Q-ID | 観点 | 検証方法 |
| --- | --- | --- |
| Q-01 | typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` PASS |
| Q-02 | lint | `mise exec -- pnpm --filter @ubm-hyogo/api lint` PASS |
| Q-03 | vitest focused | `mise exec -- pnpm exec vitest run apps/api/src/routes/admin/smoke-observability.test.ts` で T-01〜T-06 全 PASS |
| Q-04 | redaction grep | 対象 workflow outputs と実装差分に対する `rg -n 'hooks\.slack\.com/services/[A-Z0-9]+\|sentry\.io/[0-9]+/[0-9]+\|xox[bp]-' docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension apps/api/src/routes/admin/smoke-observability.ts apps/api/src/routes/admin/smoke-observability.test.ts` が 0 hit。fixture の Slack example URL は allowlist せず、必要なら分割文字列で保持 |
| Q-05 | secret name-only check | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` / `--env production` の出力に secret 名のみ表示（値出力なし） |
| Q-06 | artifacts.json と index.md の phase 列挙整合 | `jq '.phases[].phase'` と `rg 'phase-[0-9]+' index.md` |
| Q-07 | ファイル存在 | phase-01〜13.md / outputs/phase-NN/main.md（13 件 + 13 件 = 26 件） |
| Q-08 | AC trace 完備 | Phase 7 matrix で AC × evidence × Test ID × gate のセル欠損なし |
| Q-09 | DRY（Phase 8）の判定が PASS / FORWARD のみ | `outputs/phase-08/main.md` 確認 |

## 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm exec vitest run apps/api/src/routes/admin/smoke-observability.test.ts

# Q-04
rg -n 'hooks\.slack\.com/services/[A-Z0-9]+|sentry\.io/[0-9]+/[0-9]+|xox[bp]-' docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension apps/api/src/routes/admin/smoke-observability.ts apps/api/src/routes/admin/smoke-observability.test.ts

# Q-05
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production

# Q-06 / Q-07
jq '.phases[].phase' docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/artifacts.json
ls docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/phase-{01,02,03,04,05,06,07,08,09,10,11,12,13}.md
ls docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/outputs/phase-{01,02,03,04,05,06,07,08,09,10,11,12,13}/main.md
```

## 失敗時の戻り先

| Q-ID | 戻り先 | 対応 |
| --- | --- | --- |
| Q-01 / Q-02 | Phase 5 | 実装誤り修復 |
| Q-03 | Phase 4 / 5 | テスト追加 / 実装修正 |
| Q-04 | 該当 phase 即時 | redact 修正 |
| Q-05 | Phase 5 | secret 投入手順誤り |
| Q-06 / Q-07 | Phase 0（scaffold） | ファイル補修 |
| Q-08 | Phase 7 | matrix 更新 |
| Q-09 | Phase 8 | DRY 再判定 |

## 成果物

- `outputs/phase-09/main.md`（Q-01〜Q-09 判定表）

## 完了条件

- Q-01〜Q-09 全 PASS
- redaction grep / secret name-only check 0 不整合

## 次 Phase への引き渡し

Phase 10 へ: 全 PASS 宣言 / DEFER（あれば）。
