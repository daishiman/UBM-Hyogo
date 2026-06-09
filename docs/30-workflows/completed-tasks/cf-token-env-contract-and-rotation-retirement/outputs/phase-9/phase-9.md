# Phase 9: 品質保証 — cf-token-env-contract-and-rotation-retirement

## 目的

A1〜A5 / B1〜B4 の実装が landed した後に実行する検証コマンドと各合格基準を一括定義する。本タスクは CI / インフラ層のため、TypeScript（型 / lint / Vitest）・bash 構文・GitHub Actions lint・mirror parity・削除参照 stale ゼロ検証を網羅する。E2E / Playwright / visual baseline は対象外（NON_VISUAL）。

> 本サイクルは `implemented_local_evidence_captured`。本 phase は本実行サイクルで実行した検証手順と合格基準を記録する。実走ログは `outputs/phase-11/evidence/` に保存済み。

## 検証コマンド一括と合格基準

| # | コマンド | 検証内容 | 合格基準 |
| - | -------- | -------- | -------- |
| 1 | `pnpm typecheck` | 新 verifier `verify-runtime-smoke-secret-contract.mts` を含む全 TS の型整合 | exit 0。型エラー 0 件。新 verifier の `export` 関数シグネチャ（`extractWorkflowSecrets` / `extractProvisionedSecrets` / `detectSecretContractViolations`）が型解決される |
| 2 | `pnpm lint` | 新規 / 変更ファイルの lint 規約適合 | exit 0。違反 0 件。`pnpm lint --fix` で自動修正可能な違反は修正済み・残違反 0 |
| 3 | `pnpm vitest run scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts` | 新 verifier の純関数 unit test（A4） | 全 test PASS・fail 0・skip 0。`missing_provision` を「`CLOUDFLARE_API_TOKEN` 未 provision 時に検出 / provision 後に非検出」の二値で検証する test を含む |
| 4 | `pnpm exec tsx scripts/smoke/verify-runtime-smoke-secret-contract.mts` | drift gate の実走（A3 main）。`runtime-smoke-staging.yml` の全消費 secret ⊆ provisioned ∪ documented legacy exemptions | exit 0（A1 で `CLOUDFLARE_API_TOKEN` が provisioned に追加済みのため PASS）。stderr に violation 出力なし。トークン値を一切読まない（name のみ）ことを実装で担保（AC-8） |
| 5 | `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/runtime-smoke-staging.yml .github/workflows/verify-runtime-smoke-secret-contract.yml` | 変更 / 新規 workflow の YAML / shell-in-yaml lint | exit 0。actionlint 指摘 0 件。degrade step の bash（配列・`GITHUB_OUTPUT` 追記）・`if:` 式・`paths` 構文が valid |
| 6 | `bash -n scripts/smoke/provision-staging-secrets.sh` | provision script の bash 構文チェック（A1 編集後） | exit 0。構文エラー 0。`SECRETS` 配列追加行が valid |
| 7 | `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` | skill mirror parity（`.claude` と `.agents` の同期） | 差分出力なし（IDENTICAL）。`.agents/skills` が `.claude/skills` への symlink の場合は parity 自明 |

## 削除ファイルへの stale 参照ゼロ検証（FB-UI-02-1）

`cf-token-rotation-reminder.yml`（B1 削除）への参照が残っていないことを検証する。

| 検証 | コマンド | 合格基準 |
| ---- | -------- | -------- |
| 削除 workflow への stale 参照 | `grep -rn "cf-token-rotation-reminder" . --exclude-dir=node_modules --exclude-dir=.git` | **削除 PASS 基準（FB-UI-02-1）= 次のいずれか**: (a) `git rm` により当該ファイルが削除済みかつ他ファイルからの参照ヒット 0 件、OR (b) 残ヒットが「retired tombstone / runbook 内の撤廃履歴記述」のみ（=正当な歴史記録）で、現役の workflow / script / required-check 設定からの参照は 0 件 |
| 旧 runbook → 新 runbook 誘導 | `grep -rn "cf-token-provisioning-and-revocation-runbook" docs/30-workflows/operations` | 旧 `cf-token-rotation-runbook.md` の tombstone から新 runbook への誘導リンクが 1 件以上ヒット（B3 整合） |

> stale 参照判定の運用注意: `grep` ヒットが 0 でなくても、それが「撤廃を記録する tombstone / runbook / log の歴史記述」であれば PASS。NG となるのは「削除済み workflow を現役として参照する CI 設定 / required status check / `uses:` / `workflow_call`」が残る場合のみ。

## 検証順序（本実行サイクル）

1. `pnpm typecheck` → `pnpm lint`（静的・最速で全体破壊を検出）
2. `pnpm vitest run ...`（純関数 unit）→ `pnpm exec tsx ...`（gate 実走）
3. `actionlint ...` → `bash -n ...`（workflow / shell 構文）
4. `grep -rn "cf-token-rotation-reminder"`（削除 stale 参照ゼロ）
5. `diff -qr ...`（mirror parity）

各コマンドが exit 0 / 合格基準を満たすまで進み、失敗時は最小差分で修復して再実行する。

## 対象外（明示）

| 項目 | 理由 |
| ---- | ---- |
| Playwright / visual baseline | NON_VISUAL タスク。UI 変更なし |
| 実 D1 への seed / cleanup 実走 | staging D1 副作用を伴うため user-gated（Phase 13 / operational）。本 phase の静的検証には含めない |
| 実 `gh secret set` による環境投入 | secret 投入は user-gated operational 手順（runbook B2）。本 phase では provision script の構文と SECRETS 配列の正当性のみ検証 |
| `verify-mint-env-contract` 系の再実行 | 無改変（AC-7）のため本タスクで再検証不要 |

## 完了条件

- [ ] 検証コマンド7種（typecheck / lint / vitest / tsx 実走 / actionlint / bash -n / mirror parity）と各合格基準を表で定義した。
- [ ] 削除 `cf-token-rotation-reminder.yml` への stale 参照ゼロを `grep -rn` で検証する FB-UI-02-1 削除 PASS 基準（git delete OR 参照0/歴史記述のみ）を明示した。
- [ ] AC-8（verifier は name のみ・トークン値非読取）の検証点を #4 に紐づけた。
- [ ] 対象外項目（visual / 実 D1 / 実 secret 投入 / mint gate）を明示した。

> 注: 本 phase は implemented_local_evidence_captured のためコマンド実走は伴わず、チェックボックスは本実行サイクルでの達成項目を表す。
