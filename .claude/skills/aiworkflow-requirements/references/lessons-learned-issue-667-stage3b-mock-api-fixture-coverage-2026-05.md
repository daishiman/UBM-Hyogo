# Lessons Learned — issue-667-stage3b-mock-api-fixture-coverage (2026-05)

> 親 workflow: `docs/30-workflows/completed-tasks/issue-667-stage3b-mock-api-fixture-coverage/`
> 元 unassigned task: `docs/30-workflows/completed-tasks/task-e2e-stage3b-mock-api-fixture-coverage-001.md`
> 実装対象: `scripts/e2e-mock-api.mjs` / `packages/contracts/` / `scripts/__tests__/e2e-mock-api.contract.spec.ts`

## L-667-001: workflow 名 discovery 義務 — 仕様起草前に grep 必須

**Symptom**: 仕様起草段階で CI workflow 名を `unit-tests.yml` と仮定して spec に書き込んだが、リポジトリ実態は `ci.yml` であり drift が発生。仕様後段で CI step 追加先パスを書き直すコストが発生した。

**Root cause**: `.github/workflows/` 配下を grep せずに「よくある命名」で仮定した。仕様書は SSOT になるため、ファイル名仮定が後段で固着する。

**Action / 再発防止**:
- 仕様 Phase 1（contracts / surface 確定）の前に **必ず** `ls .github/workflows/` と `grep -rn 'name:' .github/workflows/` を実行し、対象 workflow ファイル名と job 名を spec に転記する。
- task-specification-creator 側の Phase 1 チェックに「CI workflow 名 discovery 済み」を含める運用とする。

## L-667-002: contracts topology を Phase 1 で確定する

**Symptom**: 「contracts パッケージを作る」とだけ決めて実装に入り、tsup TS build にするか zod-only `.mjs` にするかで Phase 6 直前まで揺れた。mock runtime (`scripts/e2e-mock-api.mjs`) が plain node `.mjs` で動く制約を見落とすと build chain が増えて手戻りする。

**Root cause**: パッケージ topology（依存・モジュール形式・export 形）を Phase 1 で固定する習慣がなかった。

**Action / 再発防止**:
- contracts / shared 系新規パッケージを起こす wave では Phase 1 で以下を確定する:
  - 依存（zod のみ / 他パッケージへの依存可否）
  - モジュール形式（plain ESM `.mjs` / tsup TS build / dual）
  - export 形（barrel + named / 直接 path import）
- 今回の確定値は `[[contracts-package-ssot]]` を SSOT として参照する。

## L-667-003: `implemented_local_runtime_pending` state の必要性

**Symptom**: 既存 state vocab は `spec_created` / `implemented` / `completed` のみで、「local では contract spec 28 tests PASS / GitHub Actions runtime は PR を上げないと検証不能」という中間状態を表現できなかった。inventory の state 欄に書く文言がブレた。

**Root cause**: solo 開発で commit/push/PR を明示承認制にしている運用上、「local 完了 / runtime 未検証」という時間幅が必ず発生するが、これに対応する語彙が未整備だった。

**Action / 再発防止**:
- inventory / artifacts.json で **`implemented_local_runtime_pending`** を中間 state として採用する。
- `completed` への遷移条件は「GitHub Actions の対応 job が PR で green」と明文化する。
- 本 lesson を後続 workflow の inventory テンプレに反映する。

## L-667-004: dispatcher 順序 grep gate

**Symptom**: `/admin/identity-conflicts/:id/merge` を後から追加した際、誤って `/admin/` startsWith 分岐より後ろに置いてしまい、E2E が「200 だが空 body」を返した。原因特定に時間を要した。

**Root cause**: dispatcher は exact-match → regex → startsWith の順で書かないと、startsWith が regex を吸う構造的バグになる。順序制約がコメントだけだと回帰しやすい。

**Action / 再発防止**:
- `scripts/e2e-mock-api.mjs` の dispatcher block に対する **grep gate** を Phase 11 evidence として残す（`outputs/phase-11/evidence/dispatcher-grep.txt`）。
- 順序ルールは `[[mock-api-dispatcher-pattern]]` に SSOT 化。新規 endpoint 挿入 PR では、本 SSOT を参照して挿入位置を決定する。
- `safeJson` ラッパーで parse 失敗を HTTP 500 + `zodIssues` に変換することで、順序崩れによる「形が違う 200」を E2E ログから即検出可能にする。

## Cross-link

- `[[workflow-issue-667-stage3b-mock-api-fixture-coverage-artifact-inventory]]`
- `[[contracts-package-ssot]]`
- `[[mock-api-dispatcher-pattern]]`
- `[[lessons-learned-task-spec-2d-contract-stage-2-2026-05]]`
