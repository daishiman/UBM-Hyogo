# タスク仕様書: Issue #504 — UT-07B-FU-01-FOLLOWUP schema alias back-fill 50k row extended fixture / staging stress trial

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-504-ut-07b-fu-01-followup-extended-fixture-50k |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/504 (CLOSED) |
| 起票元 source | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-extended-fixture-50k.md` |
| 親タスク | `UT-07B-FU-01-FOLLOWUP-extended-fixture-50k` |
| 親 workflow | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/` |
| 配置先 | `docs/30-workflows/issue-504-ut-07b-fu-01-followup-extended-fixture-50k/` |
| 作成日 | 2026-05-07 |
| 状態 | spec_created |
| workflow_state | spec_created |
| runtimeEvidence | pending（staging stress trial は user 承認後に実行） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装仕様書]** — 根拠: 「50,000 行 synthetic fixture の生成スクリプトと staging 投入スクリプトを `scripts/` 配下に新規追加し、10 trials の retry_count / CPU 時間 / DLQ 数 / `backfill.status` を観測する」を達成するには、bash / TypeScript スクリプトの新規実装と bats / vitest テスト追加が必須。docs-only では完了不能（CONST_004 デフォルト適用）。 |
| 親 Issue 状態維持 | **CLOSED のまま運用**（ユーザー指示）。本仕様書は historical traceability のための後追いドキュメント化。Issue 再オープンは行わない。 |
| 優先度 | low |
| 規模 | small |
| 想定 PR 数 | 1（fixture 生成 + 投入スクリプト + tests + runbook + SSOT 同期） |
| coverage AC | `scripts/schema-alias-backfill/` の bash ロジックは bats / shellcheck で SC0/lint clean、TypeScript 部分は `vitest run --changed` で PASS |

## GitHub label / tag（Claude Code / Codex 共有用）

このタスクの仕様書を Claude Code / Codex に渡してコード実装 → PR 作成を依頼する際は、必ず以下の label / コンテキストを併送すること。`artifacts.json` の `claudeCodeContext` セクションが正本。

| 用途 | 値 |
| --- | --- |
| Issue 参照 | `#504` (`Refs: #504` を PR 本文に必ず含める) |
| GitHub Issue labels（継承） | `priority:low`, `type:improvement`, `scale:small`, `status:unassigned`, `area:api`, `area:testing` |
| PR に付与する labels | `priority:low`, `type:improvement`, `scale:small`, `area:api`, `area:testing`（`status:unassigned` は PR には付けない） |
| `gh pr create` 引数 | `--label priority:low --label type:improvement --label scale:small --label area:api --label area:testing` |
| ブランチ名 | `feat/issue-504-ut-07b-fu-01-followup-extended-fixture-50k` |
| PR タイトル | `feat(test): issue-504 schema alias back-fill 50k row extended fixture / staging stress trial` |
| 親タスク参照 | `UT-07B-FU-01-FOLLOWUP-extended-fixture-50k` |

> **Claude Code / Codex 実行ガイド**: 仕様書を実行する際は、上記 label / context を Phase 13 の PR 作成プロンプトに必ず引き渡すこと。CLAUDE.md「PR 作成の完全自律フロー」と整合する。

## 目的

UT-07B-FU-01 で記録された未タスク候補「50,000+ row extended fixture」を正式化し、Queue 分割の効果上限と cursor semantics 採用判断の比較条件を 10,000 行から 50,000 行クラスへ拡張する。Phase 11 gate の after-that 項目を formal task に昇格させ、本番 50,000 行級 back-fill が発生した場合の予測不能な CPU budget exhausted ループを事前に排除する。

## スコープ

### 含む

- `scripts/schema-alias-backfill/generate-50k-fixture.ts` 新規（PII を含まない synthetic な 50,000 行を `schema_diff_queue` 投入対象 row 構造で出力する）
- `scripts/schema-alias-backfill/seed-staging-50k.sh` 新規（`scripts/cf.sh d1 execute --env staging` をラップし、bulk INSERT を実行。production env では即時 abort するガード付き）
- `scripts/schema-alias-backfill/cleanup-staging-50k.sh` 新規（trial 後の D1 write quota 圧迫を防ぐ DELETE スクリプト）
- `scripts/schema-alias-backfill/run-stress-trial.sh` 新規（10 trials を順次実行し retry_count / CPU 時間 / Queue 投入数 / DLQ 数 / `backfill.status` を JSON で stdout に出力）
- `scripts/schema-alias-backfill/__tests__/generate-50k-fixture.test.ts` 新規（vitest: dedupe_key 重複ゼロ / 50,000 行ちょうど生成 / synthetic data 性検証）
- `scripts/schema-alias-backfill/__tests__/seed-staging-50k.bats` 新規（bats: production env abort / `--env staging` 必須 / dry-run 出力決定論性）
- `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/extended-fixture-50k-evidence.md` 新規（runtime pending placeholder。10 trials の数値 evidence は user gate 後に redaction 確認済で追記）
- `docs/runbooks/schema-alias-backfill-50k-stress-trial.md` 新規（manual fallback runbook）
- `.claude/skills/aiworkflow-requirements/references/schema-alias-backfill-runbook.md` に 50k stress trial 導線を追加（SSOT）
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json` 編集（新 reference を index に追加）

### 含まない

- 本番投入（staging only。production への bulk INSERT は permanent ban）
- API contract 変更
- cursor semantics 実装そのもの（別 follow-up）
- `apps/api/src/workflows/schemaAliasBackfillBatch.ts` の挙動変更（observation のみ。改変なし）
- `apps/api/src/repository/schemaDiffQueue.ts` の改変（既存 query を read-only で利用）
- 0014 migration の改変
- Cloudflare Queue / DLQ の作成（user 承認イベント前提）
- commit / push / PR 作成（Phase 13 で user 承認後）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `ut-07b-fu-01-schema-alias-backfill-queue-cron-split`（runtime PASS または 10,000 行 staging trial 完了） | 50k trial の前提となる baseline evidence |
| 上流 | staging D1 (`ubm-hyogo-db-prod` `--env staging`) と Cloudflare Queue / DLQ | trial 実行先。user 承認後に利用可 |
| 上流 | `apps/api/src/workflows/schemaAliasBackfillBatch.ts` / `apps/api/src/repository/schemaDiffQueue.ts` | observation 対象。改変はしない |
| 下流 | cursor semantics 採用判断 follow-up | 本タスクの evidence を比較 input として参照 |
| 下流 | aiworkflow-requirements `schema-alias-backfill-runbook` | SSOT 反映先 |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| `scripts/cf.sh` が認証済 | `bash scripts/cf.sh whoami` |
| 親 workflow の Phase 11 evidence が存在 | `test -f docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/gate-decision.md` |
| 親 workflow の unassigned-task 検出ファイルが存在 | `test -f docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md` |
| 観測対象の workflow / repository コードが存在 | `test -f apps/api/src/workflows/schemaAliasBackfillBatch.ts && test -f apps/api/src/repository/schemaDiffQueue.ts` |
| `bats` / `shellcheck` / `vitest` が利用可能 | `which bats shellcheck && pnpm -w exec vitest --version` |

## 苦戦箇所・知見（unassigned-task 仕様から継承）

1. **production 誤投入の構造的リスク**: bulk INSERT スクリプトは write 操作のため、`scripts/cf.sh d1 execute` の `--env` 引数を一切受け付けず `--env staging` を hard-code するか、引数 `production` を受け取った瞬間 abort する二重ガードが必須。
2. **PII / token / 実 ID redaction**: synthetic 採番ルール（例: `dedupe_key = sha256("ubm-test-fixture-50k-${index}")` の prefix）を fixture 生成側で固定し、evidence 出力側でも `rg "@gmail|@senpai-lab|token|secret"` の no-match を CI gate にする。
3. **dedupe_key 重複ゼロ**: 50,000 行を一意に保つため、生成スクリプトは index ベースの確定的採番（PRNG ではなく counter）を採用する。
4. **D1 write quota 圧迫**: trial 後の cleanup を必ず実行する。cleanup を Phase 11 gate の close-out 条件に含める。
5. **observation のみ**: 本タスクは workflow / repository コードを改変しない。改変が必要と判断した場合は別 follow-up を起票する。
6. **10 trials の決定論性**: trial 間の干渉を避けるため、各 trial 開始前に Queue depth を 0 に戻すクリーニング手順を runbook に明記。

## 想定変更ファイル一覧

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `scripts/schema-alias-backfill/generate-50k-fixture.ts` | 新規 | 50,000 行 synthetic row を JSON / SQL で出力 |
| `scripts/schema-alias-backfill/seed-staging-50k.sh` | 新規 | `scripts/cf.sh` 経由で staging へ bulk INSERT |
| `scripts/schema-alias-backfill/cleanup-staging-50k.sh` | 新規 | trial 後 fixture 削除 |
| `scripts/schema-alias-backfill/run-stress-trial.sh` | 新規 | 10 trials を順次実行し JSON evidence を stdout 出力 |
| `scripts/schema-alias-backfill/__tests__/generate-50k-fixture.test.ts` | 新規 | vitest: 採番 / 件数 / synthetic 性 |
| `scripts/schema-alias-backfill/__tests__/seed-staging-50k.bats` | 新規 | bats: production abort / dry-run |
| `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/extended-fixture-50k-evidence.md` | 新規 | 10 trials の数値 evidence |
| `docs/runbooks/schema-alias-backfill-50k-stress-trial.md` | 新規 | manual fallback runbook |
| `.claude/skills/aiworkflow-requirements/references/schema-alias-backfill-runbook.md` | 新規 or 編集 | SSOT に 50k stress trial 導線追加 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | 新 reference を index に追加 |

## Phase 構成（13 Phase）

| Phase | 目的 | 状態 |
| --- | --- | --- |
| [1](phase-01.md) | 要件定義 / GO 判定 / 採番ルール SSOT 確定 | spec_created |
| [2](phase-02.md) | fixture row 構造設計 / dedupe_key 採番ルール / synthetic data ポリシー | spec_created |
| [3](phase-03.md) | スクリプト I/F 設計（generate / seed / cleanup / run-stress-trial） | spec_created |
| [4](phase-04.md) | 統合テスト設計（vitest / bats / production abort scenario） | spec_created |
| [5](phase-05.md) | fixture 生成スクリプト実装（`generate-50k-fixture.ts`） | spec_created |
| [6](phase-06.md) | seed / cleanup スクリプト実装（`seed-staging-50k.sh` / `cleanup-staging-50k.sh`） | spec_created |
| [7](phase-07.md) | stress trial driver 実装（`run-stress-trial.sh` / JSON evidence schema） | spec_created |
| [8](phase-08.md) | runbook 実装（`docs/runbooks/schema-alias-backfill-50k-stress-trial.md`） | spec_created |
| [9](phase-09.md) | SSOT 反映（aiworkflow-requirements `schema-alias-backfill-runbook.md` / indexes） | spec_created |
| [10](phase-10.md) | 単体テスト実装（vitest / bats / shellcheck） | spec_created |
| [11](phase-11.md) | runtime evidence 取得（staging 10 trials / redaction 検証） — user gate | spec_created |
| [12](phase-12.md) | implementation guide / SSOT 更新 / unassigned 検出 / skill feedback / compliance | spec_created |
| [13](phase-13.md) | commit / PR 作成（user gate） | spec_created |

## Outputs 導線

| Phase | Output |
| --- | --- |
| 1 | [outputs/phase-1/phase-1.md](outputs/phase-1/phase-1.md) |
| 2 | [outputs/phase-2/phase-2.md](outputs/phase-2/phase-2.md) |
| 3 | [outputs/phase-3/phase-3.md](outputs/phase-3/phase-3.md) |
| 4 | [outputs/phase-4/phase-4.md](outputs/phase-4/phase-4.md) |
| 5 | [outputs/phase-5/phase-5.md](outputs/phase-5/phase-5.md) |
| 6 | [outputs/phase-6/phase-6.md](outputs/phase-6/phase-6.md) |
| 7 | [outputs/phase-7/phase-7.md](outputs/phase-7/phase-7.md) |
| 8 | [outputs/phase-8/phase-8.md](outputs/phase-8/phase-8.md) |
| 9 | [outputs/phase-9/phase-9.md](outputs/phase-9/phase-9.md) |
| 10 | [outputs/phase-10/phase-10.md](outputs/phase-10/phase-10.md) |
| 11 | [outputs/phase-11/main.md](outputs/phase-11/main.md) |
| 12 | [outputs/phase-12/main.md](outputs/phase-12/main.md) |
| 13 | [outputs/phase-13/phase-13.md](outputs/phase-13/phase-13.md) |

## 完了条件（DoD: タスク全体）

- [ ] `scripts/schema-alias-backfill/generate-50k-fixture.ts` が 50,000 行ちょうどの synthetic row を決定論的に生成する（dedupe_key 重複ゼロ）
- [ ] `seed-staging-50k.sh` / `cleanup-staging-50k.sh` が production env 引数を即時 abort する二重ガード付きで動作する
- [ ] `run-stress-trial.sh` が 10 trials を順次実行し、各 trial の retry_count / CPU 時間 / Queue 投入数 / DLQ 数 / `backfill.status` を JSON で stdout 出力する
- [ ] vitest / bats / shellcheck / `pnpm typecheck` / `pnpm lint` がすべて clean
- [ ] runbook と SSOT に 50k stress trial 導線が追加され、aiworkflow-requirements の indexes に反映
- [ ] 親 workflow の `outputs/phase-11/extended-fixture-50k-evidence.md` に 10 trials の数値 evidence が redaction 済で記録される（user gate 後）
- [ ] `rg "@gmail|@senpai-lab|token|secret" docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/` が no-match
- [ ] PR に `priority:low` / `type:improvement` / `scale:small` / `area:api` / `area:testing` label が付与され、本文に `Refs: #504` が含まれる

## 参照情報

- 起票元: `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-extended-fixture-50k.md`
- 親 workflow Phase 11 gate: `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/gate-decision.md`
- 親 workflow Phase 12 unassigned-task 検出: `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md`
- 観測対象 workflow: `apps/api/src/workflows/schemaAliasBackfillBatch.ts`
- 観測対象 repository: `apps/api/src/repository/schemaDiffQueue.ts`
- Cloudflare ラッパー: `scripts/cf.sh`
