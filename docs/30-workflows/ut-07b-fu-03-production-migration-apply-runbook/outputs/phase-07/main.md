# Phase 7 成果物: AC マトリクス（実装仕様書版）

## 概要

UT-07B-FU-03 は実装ファイル群（`scripts/d1/{preflight,postcheck,evidence,apply-prod}.sh` / `scripts/cf.sh` 拡張 / `.github/workflows/d1-migration-verify.yml` / `scripts/d1/__tests__/*.bats` / `package.json` / `outputs/phase-05/main.md` Part A/B）と AC-1〜AC-20 のトレースを担う実装仕様書。

## AC × 検証方法 × 成果物 × 状態 マトリクス

| AC | 内容 | 検証方法 | 実装ファイル | 仕様書セクション | 状態 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | runbook が `outputs/phase-05/main.md` Part B に明記 | grep `^## Part B` / `test -e` | `outputs/phase-05/main.md` | phase-05 §Part B | spec_created |
| AC-2 | 4 ゲート境界明記 | grep `承認ゲート` / bats `runbook_gates.bats` | `outputs/phase-05/main.md` | phase-05 §Part A §1,§2,§7 | spec_created |
| AC-3 | 5 オブジェクト特定 | grep / bats `objects_listed.bats` | `outputs/phase-05/main.md`, `scripts/d1/postcheck.sh` | phase-05 §Part A §3,§5 | spec_created |
| AC-4 | preflight + `scripts/d1/preflight.sh` | bats `preflight.bats` / CI job `preflight-staging` | `scripts/d1/preflight.sh` | phase-05 §Part B preflight | spec_created |
| AC-5 | apply + `scripts/d1/apply-prod.sh` | bats `apply_prod.bats` / CI job `apply-staging-dryrun` | `scripts/d1/apply-prod.sh` | phase-05 §Part B apply | spec_created |
| AC-6 | postcheck + `scripts/d1/postcheck.sh` | bats `postcheck.bats` / CI job `postcheck-staging` | `scripts/d1/postcheck.sh` | phase-05 §Part B postcheck | spec_created |
| AC-7 | evidence 10 項目 + `scripts/d1/evidence.sh` | bats `evidence.bats` | `scripts/d1/evidence.sh` | phase-05 §Part B evidence | spec_created |
| AC-8 | failure handling 4 領域 | bats `failure_paths.bats` / Phase 6 FC table | `scripts/d1/*.sh` | phase-06 §FC table | spec_created |
| AC-9 | 本タスク内 production 実 apply 禁止 | grep / index §スコープ | `outputs/phase-05/main.md`, `index.md` | phase-05 §Part A §1 | spec_created |
| AC-10 | post-check read-only 限定 | bats `postcheck_readonly.bats` | `scripts/d1/postcheck.sh` | phase-05 §Part A §5,§8 | spec_created |
| AC-11 | 4 条件 PASS | Phase 9 / Phase 10 | 仕様書全体 | phase-09 §評価サマリー | spec_created |
| AC-12 | redaction PASS | bats `redaction.bats` / CI job `redaction-gate` | `scripts/d1/evidence.sh` | phase-06 FC-15〜18 | spec_created |
| AC-13 | bats 全 PASS | `pnpm test:scripts` / CI job `bats-tests` | `scripts/d1/__tests__/*.bats` | phase-04 §bats | spec_created |
| AC-14 | CI gate `d1-migration-verify` green | GitHub Actions | `.github/workflows/d1-migration-verify.yml` | phase-04 §CI gate | spec_created |
| AC-15 | `cf.sh d1:apply-prod` 薄ラッパ | bats `cf_sh_subcommand.bats` | `scripts/cf.sh` | phase-05 §Part B cf.sh | spec_created |
| AC-16 | `DRY_RUN=1` で apply スキップ | bats `dry_run.bats` | `scripts/d1/apply-prod.sh` | phase-05 §Part B DRY_RUN | spec_created |
| AC-17 | exit code 規約（0/1/2/3/4/5/6） | bats `exit_codes.bats` | `scripts/d1/*.sh`, `outputs/phase-05/main.md` | phase-06 §exit code 表 | spec_created |
| AC-18 | `op run` 経由 Token 注入維持 | bats `op_wrapper.bats` | `scripts/cf.sh`, `scripts/d1/apply-prod.sh` | phase-05 §Part B cf.sh 規約 | spec_created |
| AC-19 | `0008_schema_alias_hardening.sql` 不変 | CI job `migration-immutability` | （read-only 参照） | phase-05 §Part A §3 | spec_created |
| AC-20 | `package.json` に `test:scripts` 追加 | `jq` で確認 | `package.json` | phase-05 §Part B package.json | spec_created |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 実装ファイル / 仕様書 / AC が排他で重複なし |
| 漏れなし | PASS | F1-F9 + bats + CI gate + runbook + AC-1〜AC-20 が網羅 |
| 整合性 | PASS | exit code / DRY_RUN / op run / cf.sh / wrangler.toml / D1 migrations 仕様と一致 |
| 依存関係整合 | PASS | UT-07B / U-FIX-CF-ACCT-01 完了済み、CI gate が PR merge の前提 |

## CONST_005 必須項目チェック

| 項目 | 充足 |
| --- | --- |
| AC 連番（1〜20） | OK |
| 検証方法明記 | OK |
| 成果物 2 軸（実装 + 仕様書） | OK |
| 状態語彙 | OK |
| 上流 / 下流 Phase | OK |
| 4 条件評価 | OK |

## 関連リンク

- 仕様書: `../../phase-07.md`
- index: `../../index.md`
- runbook 本体: `../phase-05/main.md`
