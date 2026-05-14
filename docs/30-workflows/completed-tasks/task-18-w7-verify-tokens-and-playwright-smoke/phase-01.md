# Phase 1: 要件定義 / Gate 整理 / 真の論点

## 目的

`ui-prototype-alignment-mvp-recovery` ワークフローの最終 wave として、token drift 検知・17 URL routes smoke・4 画面 visual baseline の 3 本柱を 1 PR で確立する要件を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- 現行 Playwright topology と task metadata を確認し、Phase 1 の gate 入力を確定する。

| Task | 内容 |
| --- | --- |
| 1-1 | 17 URL routes 一覧（公開 6 / 会員 2 / 管理 8 / 共通 1）と auth 区分を確定する |
| 1-2 | Required status check 3 本の context 名（GitHub Actions の workflow name / job name 結合形）を確定する |
| 1-3 | Visual baseline 採取環境（ubuntu-latest / Desktop Chrome / viewport 1280x800）を確定する |
| 1-4 | 既存 Playwright projects（`desktop-chromium` / `firefox` / `mobile-webkit`）と新規 projects の `testMatch` 完全分離方針を確定する |
| 1-5 | `artifacts.json.metadata.visualEvidence = NON_VISUAL` を確定し、Phase 11 縮約テンプレを発火対象とする |

## 真の論点

1. **論点1: token literal 一致のみで semantic 検証（contrast）まで踏み込むか**
   結論: 本タスクは literal 一致のみ。contrast 検証は別 visual regression workflow（MVP 後）で扱う。CONST_007 例外条件 1（独立した大規模スコープ）。
2. **論点2: smoke の cross-browser 範囲**
   結論: 必須 = chromium のみ。firefox / webkit は nightly 任意。CI 時間と baseline flaky 抑制のため。
3. **論点3: visual baseline の commit 方針**
   結論: 4 PNG を `apps/web/playwright/tests/visual/__screenshots__/**` に **commit する**。正本 baseline は ubuntu-latest の workflow artifact から取り込み、mac ローカル採取は暫定確認に限る。
4. **論点4: auth fixture の session token**
   結論: `E2E_ADMIN_SESSION_TOKEN` / `E2E_MEMBER_SESSION_TOKEN` を GitHub Secrets 経由で注入。ローカルは `.env` の op 参照のみ。prod 値域は使用禁止。
5. **論点5: workflow 命名（既存との衝突回避）**
   結論: 既存 `.github/workflows/e2e-tests.yml`（functional）と職掌分離するため、新規は `verify-design-tokens.yml` / `playwright-smoke.yml`。重複トリガを張らない。

## Gate decision table

| 判定 | 条件 | 結論 |
| --- | --- | --- |
| 着手可 | task-02..17 の deliverable が `apps/web` に揃い、`apps/web/src/styles/tokens.css` / `globals.css @theme inline` が存在 | Phase 2 へ |
| 着手不可 | 17 URL routes のうち未実装 route が 1 つでも残る | 該当 task の完了まで blocked |
| token 正本変更 | 09b §9 JSON を意図的に更新 | 同一 PR で `tokens.css` / `globals.css` を同期し drift 0 を確認 |

## 4 条件評価

| 条件 | 内容 |
| --- | --- |
| 価値 | MVP の回帰防止 gate を CI に固定し、prototype と実装の drift を機械検知 |
| 実現 | scripts 2 本 + e2e specs 5 本 + workflows 2 本 + config edit で完結 |
| 整合 | 既存 Playwright projects / workflows と職掌分離。既存 hook / lefthook を変更しない |
| 運用 | 失敗時は CI artifact（playwright-report / visual diff）で 1 次切り分け可能 |

## 確定要件

- 17 URL routes（公開 `/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms` / 会員 `/login`, `/profile` / 管理 `/admin`, `/admin/members`, `/admin/tags`, `/admin/meetings`, `/admin/schema`, `/admin/requests`, `/admin/identity-conflicts`, `/admin/audit` / 共通 `/__not_found_canary`）
- 4 visual baseline route: `/login` / `/` / `/admin` / `/profile`
- Required status check 3 本（`verify-design-tokens / verify-design-tokens` / `playwright-smoke / smoke (chromium)` / `playwright-smoke / visual (chromium, 4 screens)`）
- baseURL は `PLAYWRIGHT_BASE_URL` → `PLAYWRIGHT_STAGING_BASE_URL` → `http://localhost:3000` の優先順位

## artifacts.json metadata

```json
{
  "taskType": "implementation",
  "visualEvidence": "NON_VISUAL",
  "workflow_state": "implemented_local_runtime_pending"
}
```

## 完了条件

- [ ] 17 URL routes 一覧確定（本ファイル §確定要件）
- [ ] visualEvidence = NON_VISUAL を artifacts.json に記入
- [ ] Required status check 名 3 本確定
- [ ] Gate decision table 確定

## 実行タスク

| Task | 内容 |
| --- | --- |
| 1-A | 現行 `apps/web/playwright.config.ts` の `testDir: ./playwright/tests` と既存 fixture を確認する |
| 1-B | 17 URL routes / 4 baseline routes / 3 required context 名を確定する |
| 1-C | `artifacts.json` の `taskType` / `visualEvidence` / `runtimeEvidenceBoundary` を Phase 11/13 evidence path と同期する |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| ソース仕様 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/08-regression/task-18-w7-solo-verify-tokens-and-playwright-smoke.md` | task-18 元要求 |
| Playwright config | `apps/web/playwright.config.ts` | 現行 testDir / projects / evidence dir |
| task type 判定 | `.claude/skills/task-specification-creator/references/task-type-decision.md` | implementation / NON_VISUAL 判定 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 1 仕様 | `phase-01.md` | 要件・gate・状態語彙 |
| artifact metadata | `artifacts.json` | `taskType=implementation` / `visualEvidence=NON_VISUAL` |

## 統合テスト連携

Phase 1 では実行しない。Phase 4 で対象 spec と 1 行コマンドを固定し、Phase 8〜11 で tracked `.txt` evidence として取得する。
