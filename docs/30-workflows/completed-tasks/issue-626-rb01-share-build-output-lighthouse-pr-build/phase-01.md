# Phase 1: 要件定義と現状調査

## メタ情報

| Phase | 値 |
| --- | --- |
| Phase | 1 |
| workflow | issue-626-rb01-share-build-output-lighthouse-pr-build |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

`lighthouse.yml` と `pr-build-test.yml` の build 重複を排除する要件を確定し、現状実装の差分を取り切る。

## 入力

- `.github/workflows/lighthouse.yml`
- `.github/workflows/pr-build-test.yml`
- `lighthouserc.json`
- `docs/30-workflows/e2e-quality-uplift/backlog.md`（RB-01 行）
- Issue #626 本文

## アクション

1. `.github/workflows/lighthouse.yml` と `.github/workflows/pr-build-test.yml` を読み、`lighthouse.yml` の `pnpm --filter @ubm-hyogo/web build` と `pr-build-test.yml` の root `pnpm build`（web build を含む）の行番号と環境変数（特に `NODE_ENV`）を一覧化する。
2. `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` を read-only で取得し、`required_status_checks.contexts` に含まれる canonical job 名を控える（current required context は `lighthouse-ci` を含む。`build-test` は `lighthouse-ci.needs` の workflow-local dependency として扱う）。
3. 直近 10 件の PR で `build-test` と `lighthouse-ci` が両方 PASS していることを確認する: `gh run list --workflow=pr-build-test.yml --limit 10` / `gh run list --workflow=lighthouse.yml --limit 10`。
4. `actions/upload-artifact@v4` / `actions/download-artifact@v4` の現行 pinned SHA を `.github/workflows/` 配下の grep で確認する。

## 統合テスト連携

- NON_VISUAL CI workflow task. Integration evidence is represented by actionlint, typecheck, lint, focused regression, branch-protection read-only evidence, and PR runtime pending markers.

## 実行タスク

- [ ] この Phase の本文に記載した確認・設計・実装・検証項目を実行する。
- [ ] Phase 1 の結果を Phase 11 evidence または Phase 12 strict files に接続する。

## 参照資料

- `index.md`
- `artifacts.json`
- `outputs/artifacts.json`

## 成果物

- `phase-01.md`
- Phase 1 の判断を反映した Phase 11 / Phase 12 evidence path

## 完了条件

- [ ] 現行 build duplication が文書化されている（どの workflow のどの step に同等の build があるか）
- branch protection contexts に `lighthouse-ci` が登録され、`build-test` が `needs` dependency として接続されていることを確認した evidence をメモする
- `lighthouserc.json` の `url` 設定が `http://localhost:3000` 前提であり、build 後の `pnpm start` に依存することを再確認する

## 非機能要件

- untrusted PR fork セーフ性: `pr-build-test.yml` 既存の `permissions: {}` / `persist-credentials: false` / `secrets 非注入` を維持
- job `name:` は変更しない（`build-test` / `lighthouse-ci`）。required status context として current 実値に含まれるのは `lighthouse-ci`
- artifact retention は 7 日（現行 `lhci-report-${{ github.sha }}` と同等以下）

## 不変条件

- Lighthouse は `apps/web` の標準 `next build` 出力で動作する（OpenNext standalone ではない）
- `lighthouse.yml` の `pull_request: branches: [dev]` トリガ条件は、統合後の `lighthouse-ci` job `if: github.base_ref == 'dev'` として維持
