# Phase 6: テスト


## 目的

Issue #626 RB-01 の Phase 6 として、build output sharing 仕様の該当判断を固定する。
## メタ情報

| Phase | 値 |
| --- | --- |
| Phase | 6 |
| workflow | issue-626-rb01-share-build-output-lighthouse-pr-build |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## テスト一覧

| ID | 種別 | 対象 | コマンド | 期待結果 |
| --- | --- | --- | --- | --- |
| T-01 | actionlint | `pr-build-test.yml` | `mise exec -- actionlint .github/workflows/pr-build-test.yml` | exit 0 |
| T-02 | actionlint | `lighthouse.yml` 削除確認 | `test ! -f .github/workflows/lighthouse.yml && echo ok` | `ok` |
| T-03 | unit regression | patch script | `mise exec -- node --test scripts/__tests__/patch-next-standalone-instrumentation.test.mjs` | PASS |
| T-04 | typecheck | repo 全体 | `mise exec -- pnpm typecheck` | exit 0 |
| T-05 | lint | repo 全体 | `mise exec -- pnpm lint` | exit 0 |
| T-06 | dry-run PR | 本タスクの PR | `gh pr checks <PR>` | `build-test` PASS / `lighthouse-ci` PASS（PR 作成後の user-gated runtime evidence） |
| T-07 | duplication absent | dry-run PR | `gh run view --log <lighthouse-ci-run> \| grep -E "next build"` | 0 件（PR 作成後の user-gated runtime evidence） |
| T-08 | secret grep | local build | `grep -rE "(CLOUDFLARE_API_TOKEN\|AUTH_SECRET\|GITHUB_TOKEN\|SENTRY_AUTH_TOKEN)" apps/web/.next/ --exclude-dir=cache --exclude-dir=standalone` | secret value 0 件。`process.env.*` symbol 名の参照は許容し、evidence で分類する |
| T-09 | branch protection drift | `dev` / `main` | `for b in dev main; do gh api repos/daishiman/UBM-Hyogo/branches/$b/protection --jq '.required_status_checks.contexts'; done` | read-only current evidence で required context `lighthouse-ci` を確認。`build-test` は `lighthouse-ci.needs` dependency として確認。before/after diff は PR merge 後の user-gated runtime evidence |

## un-skip 不変条件

- すべての T-* を `skip` / `it.todo` で残さない
- T-06 / T-07 は dry-run PR でのみ観測可能。commit / push / PR が user-gated のため、本ローカル実装サイクルでは `PENDING_RUNTIME_EVIDENCE` として保存し、PR 作成後に `outputs/phase-11/` へ追記する

## テスト前提

- ローカルで `mise install` 済み（Node 24 / pnpm 10）
- `apps/web/.next` を一度クリーンにしてから `build` を実行（古い artifact の混入回避）

## 統合テスト連携

- NON_VISUAL CI workflow task. Integration evidence is represented by actionlint, typecheck, lint, focused regression, branch-protection read-only evidence, and PR runtime pending markers.

## 実行タスク

- [ ] この Phase の本文に記載した確認・設計・実装・検証項目を実行する。
- [ ] Phase 6 の結果を Phase 11 evidence または Phase 12 strict files に接続する。

## 参照資料

- Phase 5 (`phase-05.md`)
- `artifacts.json`
- `outputs/artifacts.json`

## 成果物

- `phase-06.md`
- Phase 6 の判断を反映した Phase 11 / Phase 12 evidence path

## 完了条件

- [ ] T-01 〜 T-05 / T-08 がローカルで PASS evidence 取得済
- T-06 / T-07 は PR 作成後の runtime evidence として pending 明示済
- T-09 は read-only current evidence を保存済。before/after diff は PR merge 後の runtime evidence として pending 明示済
