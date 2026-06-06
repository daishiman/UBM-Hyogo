# Phase 9: 品質保証 — issue-1081-bulk-tag-real-d1-runtime-smoke

## 目的

静的品質・workflow lint・redaction・workspace quality gate を一括判定する検証コマンドと expected を固定する。
**real D1 接続は不要**（local test は stub）。staging 実走は Gate-B（user-gated）。

## 検証コマンドと expected

| コマンド | expected |
| -------- | -------- |
| `bash -n scripts/smoke/runtime-tag-bulk.sh && bash -n scripts/smoke/__tests__/runtime-tag-bulk.test.sh` | shell 構文 error なし |
| `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` | 全ケース（env guard / production guard / redaction / contract assertion / full runner stub）PASS |
| `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/runtime-smoke-staging.yml` | エラーなし |
| `pnpm smoke:test` | 既存 smoke test + `runtime-tag-bulk.test.sh` が PASS |
| `pnpm indexes:rebuild` | aiworkflow-requirements index rebuild が成功し、manual sync との不整合なし |
| `pnpm typecheck` | pass |
| `pnpm lint` | pass |
| `git diff --check` | whitespace error なし |

## secret redaction grep gate（手動確認手順）

CI artifact（`ci-evidence-bulk-tag/`）に対し、redaction が効いていることを確認する:

```bash
# bearer / cookie / slack webhook / token が evidence に残っていないこと
grep -rEl 'Cookie:|authorization:|Bearer [A-Za-z0-9_-]{20,}|hooks\.slack\.com/services/[A-Z0-9]|xox[bp]-' ci-evidence-bulk-tag/
# → 出力が空であること（非空なら gate FAIL）
```

local test では stub bearer（`e2e-bearer-secret`）が `runtime-smoke.log` / `summary.json` に残らないことを G-2 で固定する。

## 不変条件 parity チェック

| 不変条件 | 検証 |
| -------- | ---- |
| I-1 D1 直接アクセス禁止（apps/api 経由のみ） | runner は HTTP endpoint と `cf.sh d1 execute` 経由のみ。`apps/web` 由来コードに D1 binding を生やさない |
| I-2 平文 secret 禁止 / redact | redaction grep gate + G-2（stub bearer 非露出） |
| I-3 wrangler 直叩き禁止（cf.sh 経由） | `grep -n 'wrangler ' scripts/smoke/runtime-tag-bulk.sh` が 0 件（G-1） |
| I-4 production 誤実行禁止 | `staging` 固定 + production guard（FP-2/3/4・AC-6） |
| I-5 既存 API surface 不変 | 新 endpoint なし。`POST /admin/members/tags/bulk`（既存）のみ |
| I-6 real PII 非投入 / synthetic prefix | seed / cleanup SQL と runner payload が全て `e2e_test_issue1081_` prefix |
| 新規 test 命名 | shell test は `*.test.sh`（lefthook `block-test-suffix` は TS の `*.test.ts` 禁止を対象） |
| パッケージ名 | `@ubm-hyogo/api`（`@repo/api` を使わない） |

## 完了判定

- [x] 実行済み品質 gate の expected を固定
- [x] redaction grep gate の手動確認手順を明記
- [x] 不変条件 I-1〜I-6 + 命名 + パッケージ名 parity を固定
