# Phase 11: NON_VISUAL evidence 収集

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| Source | `outputs/phase-11/main.md` |
| 区分 | evidence 収集（NON_VISUAL） |
| 想定所要 | 0.25 人日 |

## 目的

NON_VISUAL evidence template に従い、typecheck / lint / test / build / grep-gate のログを `outputs/phase-11/` 配下に揃え、PR 本文 / Phase 13 から参照可能にする。スクリーンショットは収集しない（visualEvidence=NON_VISUAL）。

## canonical paths

| パス | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 サマリ（実行コマンド一覧 + 各ログへのリンク） |
| `outputs/phase-11/typecheck.log` | `pnpm --filter @ubm/api typecheck` の出力 |
| `outputs/phase-11/lint.log` | `pnpm --filter @ubm/api lint` の出力 |
| `outputs/phase-11/test.log` | `pnpm --filter @ubm/api test src/audit-correlation` の出力 |
| `outputs/phase-11/coverage.log` | coverage summary（80%↑ を記録） |
| `outputs/phase-11/build.log` | `pnpm --filter @ubm/api build` の出力 |
| `outputs/phase-11/bats.log` | `bash scripts/audit-correlation/__tests__/*.bats` の出力 |
| `outputs/phase-11/shellcheck.log` | `shellcheck scripts/audit-correlation/*.sh` |
| `outputs/phase-11/actionlint.log` | `actionlint .github/workflows/audit-correlation-verify.yml` |
| `outputs/phase-11/grep-gate.log` | `grep-gate.sh` 実行結果（PII 検出 0 件） |
| `outputs/phase-11/high-alert-sample.json` | HIGH alert dry-run 出力（PII redacted） |

## 実行タスク

1. 上記コマンドをすべて実行し、stdout/stderr を tee で各ログに保存。
2. 各ログの末尾に `EXIT: 0` を確認。
3. `main.md` から各ログへの相対リンクを記載。
4. `high-alert-sample.json` は salt を `test-salt-do-not-use-in-prod` で生成した fixture 出力。実環境 salt は絶対に使わない。

## 実行コマンド（一括）

```bash
mise exec -- pnpm --filter @ubm/api typecheck 2>&1 | tee outputs/phase-11/typecheck.log
mise exec -- pnpm --filter @ubm/api lint 2>&1 | tee outputs/phase-11/lint.log
mise exec -- pnpm --filter @ubm/api test src/audit-correlation 2>&1 | tee outputs/phase-11/test.log
mise exec -- pnpm --filter @ubm/api test:coverage src/audit-correlation 2>&1 | tee outputs/phase-11/coverage.log
mise exec -- pnpm --filter @ubm/api build 2>&1 | tee outputs/phase-11/build.log
mise exec -- bash scripts/audit-correlation/__tests__/grep-gate.bats 2>&1 | tee outputs/phase-11/bats.log
shellcheck scripts/audit-correlation/*.sh 2>&1 | tee outputs/phase-11/shellcheck.log
mise exec -- pnpm dlx @rhysd/actionlint-runner@latest .github/workflows/audit-correlation-verify.yml 2>&1 | tee outputs/phase-11/actionlint.log
mise exec -- bash scripts/audit-correlation/run.sh \
  --github scripts/audit-correlation/fixtures/github-org-update-member.json \
  --cloudflare scripts/audit-correlation/fixtures/cloudflare-login-fail.json \
  --salt test-salt-do-not-use-in-prod \
  --out outputs/phase-11/high-alert-sample.json
mise exec -- bash scripts/audit-correlation/grep-gate.sh outputs/phase-11/high-alert-sample.json 2>&1 | tee outputs/phase-11/grep-gate.log
```

## evidence 検証

- [ ] 全ログの exit code が 0。
- [ ] `coverage.log` で coverage 数値または対象モジュール主要分岐の test inventory を記録。
- [ ] `grep-gate.log` で PII 検出 0 件。
- [ ] `high-alert-sample.json` の `severity === 'HIGH'`。

## 参照資料

- skill `task-specification-creator` の NON_VISUAL evidence template
- CLAUDE.md「PR 作成の完全自律フロー」

## 成果物

- `outputs/phase-11/main.md` + 上記 10 ファイル

## 完了条件（DoD）

- [ ] 11 種類の evidence ファイルがすべて存在。
- [ ] PR 本文から `outputs/phase-11/main.md` への相対リンクが貼れる状態。
- [ ] visualEvidence=NON_VISUAL のため、スクリーンショット項目を本文に**作らない**。
