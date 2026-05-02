# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 7 |
| 状態 | spec_created |
| taskType | requirements / operations / runbook / implementation |
| subtype | production-migration-runbook |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. AC-1〜AC-20 を「検証方法 × 成果物パス × 状態」の 3 軸で完全トレースする。
2. 検証方法は bats テスト名 / grep / staging dry-run / runbook 章番号 / CI workflow job 名のいずれかに正規化する。
3. 成果物パスには「実装ファイル」と「仕様書セクション」の双方を併記する。
4. 状態語彙は `spec_created` / `executed` / `verified` のみを用い、本タスクは実装仕様書段階のため原則 `spec_created` を出発点とする。
5. 上流／下流 Phase の依存エッジを AC ごとに明示する。

## 目的

実装ファイル（`scripts/d1/{preflight,postcheck,evidence,apply-prod}.sh` / `scripts/cf.sh` 拡張 / `.github/workflows/d1-migration-verify.yml` / `scripts/d1/__tests__/*.bats` / `package.json` / `outputs/phase-05/main.md` Part A/B）と AC-1〜AC-20 が 1:N で完全に紐付き、Phase 11 で `verified` 化できる状態を保証する。本タスクはあくまで「実装仕様書」段階であり、production への実 apply は Phase 13 ユーザー承認後の別運用に分離する。

## 参照資料

- `index.md`（AC 一覧の正本）
- `artifacts.json`
- `phase-02.md`（runbook 構造 / 実装ファイル分割設計）
- `phase-04.md`（bats / CI gate / staging dry-run の検証戦略）
- `phase-05.md`（runbook Part A 文書 / Part B 実装スクリプト仕様）
- `phase-06.md`（failure 分岐 / exit code 規約）

## 入力

- index.md AC 一覧
- Phase 4 / 5 / 6 の成果物仕様
- 実装ファイル群（spec_created）

## AC × 検証方法 × 成果物 × 状態 マトリクス

| AC | 内容（要約） | 検証方法 | 実装ファイル | 仕様書セクション | 状態 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | runbook が `outputs/phase-05/main.md` Part B に明記 | grep `^## Part B` / `test -e outputs/phase-05/main.md` | `outputs/phase-05/main.md` | phase-05 §Part B | spec_created |
| AC-2 | 4 ゲート境界（commit / PR / merge / user-approval）の明記 | grep `承認ゲート` / `--gate` / bats `runbook_gates.bats` | `outputs/phase-05/main.md` | phase-05 §Part A §1, §2, §7 | spec_created |
| AC-3 | 5 オブジェクト特定（schema_aliases / 2 UNIQUE index / backfill_cursor / backfill_status） | grep 全 5 シンボル / bats `objects_listed.bats` | `outputs/phase-05/main.md`, `scripts/d1/postcheck.sh` | phase-05 §Part A §3, §5 / phase-05 §Part B postcheck | spec_created |
| AC-4 | preflight 手順 + `scripts/d1/preflight.sh` | bats `preflight.bats` / staging dry-run job `preflight-staging` | `scripts/d1/preflight.sh` | phase-05 §Part B preflight | spec_created |
| AC-5 | apply コマンド + `scripts/d1/apply-prod.sh`（DRY_RUN サポート） | bats `apply_prod.bats` / staging job `apply-staging-dryrun` | `scripts/d1/apply-prod.sh` | phase-05 §Part B apply | spec_created |
| AC-6 | postcheck（read-only smoke）+ `scripts/d1/postcheck.sh` | bats `postcheck.bats` / staging job `postcheck-staging` | `scripts/d1/postcheck.sh` | phase-05 §Part B postcheck | spec_created |
| AC-7 | evidence 保存項目 + `scripts/d1/evidence.sh`（10 項目 / 2 出力先） | bats `evidence.bats` / grep `evidence_fields=` | `scripts/d1/evidence.sh` | phase-05 §Part B evidence | spec_created |
| AC-8 | failure handling 4 領域 × exit code 分岐 | bats `failure_paths.bats` / phase-06 FC-01〜14 | `scripts/d1/{preflight,apply-prod,postcheck}.sh` | phase-06 §FC table | spec_created |
| AC-9 | 本タスク内 production 実 apply 禁止 | grep `本タスクでは実行しない` / index §スコープ §含まない | `outputs/phase-05/main.md`, `index.md` | phase-05 §Part A §1, index §スコープ | spec_created |
| AC-10 | post-check は read-only 限定（destructive smoke 別承認） | bats `postcheck_readonly.bats`（write SQL 使用で fail） | `scripts/d1/postcheck.sh` | phase-05 §Part A §5, §8 / phase-06 FC-13/14 | spec_created |
| AC-11 | skill 検証 4 条件 PASS | Phase 9 集約マトリクス / Phase 10 final review | 仕様書全体 | phase-09 §評価サマリー | spec_created |
| AC-12 | redaction PASS（Token / API Key / Account ID 非記録） | grep gate `scripts/d1/__tests__/redaction.bats` / CI job `redaction-gate` | `scripts/d1/evidence.sh` redaction filter | phase-06 FC-15〜18 | spec_created |
| AC-13 | bats テスト全 PASS | `pnpm test:scripts` / CI job `bats-tests` | `scripts/d1/__tests__/*.bats` | phase-04 §bats 設計 | spec_created |
| AC-14 | CI gate `d1-migration-verify` green（staging dry-run） | GitHub Actions job `d1-migration-verify` 結果 | `.github/workflows/d1-migration-verify.yml` | phase-04 §CI gate | spec_created |
| AC-15 | `cf.sh d1:apply-prod` サブコマンド薄ラッパ追加 | bats `cf_sh_subcommand.bats` / grep `d1:apply-prod` | `scripts/cf.sh` | phase-05 §Part B cf.sh 拡張 | spec_created |
| AC-16 | `DRY_RUN=1` で apply スキップ動作 | bats `dry_run.bats`（mock wrangler 呼び出し 0 件確認） | `scripts/d1/apply-prod.sh` | phase-05 §Part B apply DRY_RUN | spec_created |
| AC-17 | exit code 規約（0/1/2/3/4/5/6）が runbook と実装で一致 | bats `exit_codes.bats` / grep code 表 | `scripts/d1/*.sh`, `outputs/phase-05/main.md` | phase-06 §exit code 表 | spec_created |
| AC-18 | `op run` 経由の Token 注入を維持（直接 `wrangler` 禁止） | bats `op_wrapper.bats`（`wrangler` 直接呼び出しを fail） / grep | `scripts/cf.sh`, `scripts/d1/apply-prod.sh` | phase-05 §Part B cf.sh 規約 | spec_created |
| AC-19 | `apps/api/migrations/0008_schema_alias_hardening.sql` 不変 | `git diff` チェック（CI job `migration-immutability`） | （read-only 参照） | phase-05 §Part A §3 / index §依存関係 | spec_created |
| AC-20 | `package.json` に `test:scripts` 追加 | `jq '.scripts."test:scripts"' package.json` ≠ null | `package.json` | phase-05 §Part B package.json | spec_created |

## 依存エッジ

| AC | 上流 Phase | 下流 Phase |
| --- | --- | --- |
| AC-1 | Phase 2 | Phase 5 / 11 |
| AC-2 | Phase 1 | Phase 5 / 11 / 13 |
| AC-3 | UT-07B / Phase 2 | Phase 5 / 11 |
| AC-4 | Phase 2 / 4 | Phase 5 (Part B preflight) / 11 |
| AC-5 | Phase 2 / 4 | Phase 5 (Part B apply) / 11 |
| AC-6 | Phase 2 / 4 | Phase 5 (Part B postcheck) / 11 |
| AC-7 | Phase 2 | Phase 5 / 6 / 11 |
| AC-8 | Phase 6 | Phase 5 / 11 |
| AC-9 | Phase 1 / index | Phase 5 / 12 / 13 |
| AC-10 | Phase 2 | Phase 5 §8 / Phase 6 |
| AC-11 | Phase 4-7 | Phase 9 / 10 |
| AC-12 | Phase 4 | Phase 6 / 11 |
| AC-13 | Phase 4 bats 設計 | Phase 11 / CI |
| AC-14 | Phase 4 CI 設計 | Phase 11 / merge gate |
| AC-15 | Phase 2 cf.sh 拡張設計 | Phase 5 / 11 |
| AC-16 | Phase 4 bats DRY_RUN | Phase 5 / 11 |
| AC-17 | Phase 6 exit code 表 | Phase 5 / 11 |
| AC-18 | CLAUDE.md / U-FIX-CF-ACCT-01 | Phase 5 / 11 |
| AC-19 | UT-07B | Phase 5 / CI |
| AC-20 | Phase 2 | Phase 4 bats 起動 / 11 |

## Runtime / Documentation AC の確認タイミング

| AC | staging で確認（dry-run） | production で確認（実 apply） |
| --- | --- | --- |
| AC-4, AC-5, AC-6 | CI `d1-migration-verify` job + bats | **本タスクでは実施しない**（Phase 13 承認後の別運用） |
| AC-1, AC-3, AC-9 | Phase 5 完了時に grep / 文書整合性 | 同上 |
| AC-2 | Phase 5 完了時に文書品質確認 | 同上 |
| AC-7, AC-8, AC-10, AC-12 | Phase 5/6 完了時に bats / FC table | 同上 |
| AC-11 | Phase 9 集約マトリクス | Phase 10 final review |
| AC-13 | `pnpm test:scripts` ローカル + CI | 同（permanent gate） |
| AC-14 | PR の CI で gate | 同 |
| AC-15, AC-16, AC-17, AC-18, AC-20 | bats + grep | 同 |
| AC-19 | CI `migration-immutability` job | 同 |

> 本タスクは「実装 + 文書化」が責務であり、production 実 apply は Phase 13 承認後の別運用で行う。よって全 AC は **bats + CI gate + 文書品質 + staging dry-run** で `verified` 化可能。

## トレース PASS 判定

| AC | PASS 判定 | 根拠 |
| --- | --- | --- |
| AC-1 | PASS | Phase 5 §Part B が `outputs/phase-05/main.md` に書き下される設計 |
| AC-2 | PASS | Part A §2 承認ゲート + bats `runbook_gates.bats` |
| AC-3 | PASS | Part A §3, §5 で 5 オブジェクト全て / postcheck.sh で機械検証 |
| AC-4 | PASS | preflight.sh + bats `preflight.bats` + CI staging job |
| AC-5 | PASS | apply-prod.sh + bats `apply_prod.bats` + DRY_RUN サポート |
| AC-6 | PASS | postcheck.sh read-only + bats `postcheck.bats` |
| AC-7 | PASS | evidence.sh の 10 項目 / 2 出力先 + bats |
| AC-8 | PASS | exit code 分岐 + Phase 6 FC-01〜14 |
| AC-9 | PASS | index / Part A / phase-12 で重複明記 |
| AC-10 | PASS | postcheck.sh は SELECT/PRAGMA のみ / write SQL で fail させる bats |
| AC-11 | PASS | Phase 9 全 Phase 4 条件マトリクス |
| AC-12 | PASS | redaction filter + redaction.bats + CI gate |
| AC-13 | PASS | `pnpm test:scripts` が bats を起動 |
| AC-14 | PASS | `.github/workflows/d1-migration-verify.yml` job 群 |
| AC-15 | PASS | cf.sh `d1:apply-prod` サブコマンド薄ラッパ |
| AC-16 | PASS | apply-prod.sh の `DRY_RUN=1` 分岐 |
| AC-17 | PASS | exit code 表が runbook / *.sh / bats で 7 値完全一致 |
| AC-18 | PASS | cf.sh の op run 経由統一 / 直叩き禁止 grep |
| AC-19 | PASS | CI `migration-immutability` で `git diff` 検査 |
| AC-20 | PASS | package.json に `test:scripts` 追加 |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 実装ファイル / 仕様書 / AC が排他で重複なし。cf.sh 拡張と新規 d1/*.sh の責務分離明確 |
| 漏れなし | PASS | F1-F9（preflight / apply / postcheck / evidence / cf.sh wrapper / DRY_RUN / redaction / exit codes / failure handling）+ bats + CI gate + runbook + AC-1〜AC-20 が全網羅 |
| 整合性 | PASS | exit code / DRY_RUN / op run / scripts/cf.sh 規約 / wrangler.toml binding / D1 migrations 仕様と一致 |
| 依存関係整合 | PASS | UT-07B / U-FIX-CF-ACCT-01 完了済み、bats が CI で先に走る、CI gate green が PR merge の前提 |

## skill 検証チェックリスト（CONST_005 必須項目充足）

| 項目 | 充足 | 根拠 |
| --- | --- | --- |
| AC 通し番号連続性 | OK | AC-1〜AC-20 連番 |
| 検証方法明記 | OK | 全 AC に bats / grep / staging job / CI job のいずれか |
| 成果物パス（実装 + 仕様書） | OK | 全 AC で 2 軸併記 |
| 状態語彙正規化 | OK | `spec_created` のみ使用 |
| 上流 / 下流 Phase | OK | 依存エッジ表 |
| 4 条件評価 | OK | PASS × 4 |
| `task-specification-creator` フォーマット | OK | メタ / 実行タスク / 目的 / 入力 / 完了条件 / 苦戦想定 / 関連リンク / 成果物 セクション完備 |
| `aiworkflow-requirements` 整合 | OK | scripts/cf.sh / op run / wrangler.toml / D1 migrations 規約に整合 |

## 統合テスト連携

- 単体相当の bats（`scripts/d1/__tests__/*.bats`）を `pnpm test:scripts` から起動。
- 統合は CI `d1-migration-verify` workflow の staging dry-run job 群で担保。
- アプリ統合テスト（`apps/api` / `apps/web`）は本タスクで追加しない。

## 完了条件

- [ ] AC-1〜AC-20 が ID 付きで「検証方法 × 実装ファイル × 仕様書セクション × 状態」の 4 軸にトレースされている
- [ ] 各 AC の依存エッジ（上流 / 下流 Phase）が明示されている
- [ ] Runtime AC（AC-4〜AC-6）の確認は staging dry-run + bats のみで、production 実 apply は本タスク外であることが明示されている
- [ ] 4 条件評価 PASS × 4 が記録されている
- [ ] CONST_005 必須項目チェック表で全項目 OK
- [ ] AC-11 / AC-12 / AC-14 が Phase 11 完了直前 gate であることが明示されている

## 苦戦想定

**1. AC 数の拡張に伴う bats / CI job の網羅** — AC-13/14/15/16/17/18/20 は bats と CI job 名の対応関係が複雑化する。bats ファイル名と AC 番号の cross-reference を Phase 4 で固定し本 Phase で参照する。

**2. AC-19（migration ファイル不変）の検証コスト** — `git diff` ベースだが PR base 切替時に false positive が起こる。CI job では `git diff origin/main -- apps/api/migrations/0008_schema_alias_hardening.sql` を base 固定で実行する。

**3. AC-12（redaction）の疑陽性** — D1 migration hash / commit SHA が Token 正規表現に hit する。Phase 6 の許可 prefix リストを redaction filter で適用する。

## 関連リンク

- 上位 index: `./index.md`
- runbook 本体: `./phase-05.md`
- 異常系 / exit code: `./phase-06.md`
- DRY 判定: `./phase-08.md`
- 品質保証: `./phase-09.md`

## 成果物

- `outputs/phase-07/main.md`
