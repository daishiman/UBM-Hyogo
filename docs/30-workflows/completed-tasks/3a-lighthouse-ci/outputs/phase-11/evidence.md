# Phase 11 evidence — Lighthouse CI 導入（NON_VISUAL）

| 項目 | 値 |
|------|----|
| 実装サイクル | 2026-05-09 |
| visualEvidence | NON_VISUAL（UI 変更なし。`.github/workflows/` と root config のみ） |
| UI screenshot | なし（UI 変更なし） |
| LHCI report screenshot | `runtime_pending`（PR-A 実行後に `lhci-report-{root,members,profile,login}.png` を保存） |

## 取得済 evidence

| # | 種別 | パス | 結果 |
|---|------|------|------|
| E-01 | grep gate G-01..G-06 | `outputs/phase-7/grep-gate-evidence.log` | 全 hit（URL count = 4） |
| E-02 | lhci healthcheck | `pnpm exec lhci healthcheck --config=./lighthouserc.json` | Healthcheck passed |
| E-03 | jq lighthouserc 構文 | local run | OK |
| E-04 | typecheck (workspace 全体) | `pnpm typecheck` | 全 5 workspace 通過 |
| E-05 | Q-02 local 判定 | `outputs/phase-7/lhci-profile-q02-judgement.md` | K-01 仮採用（PR runtime scores pending） |

## lhci healthcheck 出力

```
Healthcheck passed.
```

`GitHub token not set` が出る場合は、本タスクで採用しない `LHCI_GITHUB_APP_TOKEN` の警告であり、`index.md` token 要件「不採用」と整合する。

## 実 CI run（PR-A 起票後に取得予定）

PR-A `feat/lighthouse-ci` を `dev` 向けに起票した時点で `lighthouse-ci` job が起動し、4 routes の LHR スコアが `.lighthouseci/` artifact に出力される。本レビューサイクルでは PR / push を行わないため、以下は未取得の runtime evidence として扱う。

- `outputs/phase-11/pr-a-url.txt`
- `outputs/phase-11/pr-a-lighthouse.log`
- `outputs/phase-11/lhci-scores.json`
- `outputs/phase-11/lhci-report-root.png`
- `outputs/phase-11/lhci-report-members.png`
- `outputs/phase-11/lhci-report-profile.png`
- `outputs/phase-11/lhci-report-login.png`
- `outputs/phase-11/lighthouse-fail.log`
- `outputs/phase-11/registered-contexts.txt`
