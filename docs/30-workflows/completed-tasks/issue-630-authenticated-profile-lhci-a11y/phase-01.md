# Phase 1 — 要件定義

## Phase 1 必須メタ

| 項目 | 値 |
| --- | --- |
| taskId | `issue-630-authenticated-profile-lhci-a11y` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `implemented-local-runtime-pending` |
| scope | `authenticated /profile LHCI a11y gate specification` |
| refsPolicy | `Refs #630`（Issue #630 は 2026-05-12T06:26:21Z に CLOSED 済み） |

## 目的

`/profile` の authenticated Lighthouse a11y 計測を LHCI に追加し、PR-to-`dev` gate で
accessibility >= 0.90 を担保する。現状 `lighthouserc.json` の `/profile` は unauth → /login redirect を
計測しているため、authenticated UI の a11y 劣化を検知できていない。

## 要件

- R-01: LHCI が `/profile` を authenticated 状態で計測できること（session cookie 注入）。
- R-02: accessibility score の hard gate >= 0.90 を維持。違反時 CI fail。
- R-03: 認証情報は test 専用の signed session JWT を使用し、実 user の secret を流用しない。
- R-04: session cookie / storageState ファイルは commit しない。
- R-05: 既存 unauth LHCI ジョブを壊さない（互換性維持）。
- R-06: Issue #630 は既に CLOSED のため、後続 PR は `Refs #630` で履歴接続する。

## 入力

- Issue #630 本文
- `apps/web/playwright/fixtures/auth.ts`（`signSessionJwt` 利用パターン）
- `lighthouserc.json`、`.github/workflows/lighthouse.yml`
- `docs/30-workflows/completed-tasks/3a-lighthouse-ci/` 配下 Phase 6/7/11 の Q-02 判断

## 成果物

- 仕様確定: authenticated LHCI 二段化方式・cookie 注入方式・assertion 値
- 受入 gate: accessibility >= 0.90

## DoD

- 上記 R-01〜R-06 を満たす設計が後続 Phase で導出可能であること
