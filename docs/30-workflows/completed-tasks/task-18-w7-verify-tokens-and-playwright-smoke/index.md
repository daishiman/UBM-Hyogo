# タスク仕様書: task-18-w7 — verify-design-tokens + Playwright 17 URL routes smoke + visual baseline

[実装区分: 実装仕様書]

判定根拠: ソースタスク `docs/30-workflows/ui-prototype-alignment-mvp-recovery/08-regression/task-18-w7-solo-verify-tokens-and-playwright-smoke.md` は、`scripts/verify-design-tokens.ts`（新規 TypeScript script）/ `scripts/verify-design-tokens.test.ts`（Vitest）/ `apps/web/playwright/tests/full-smoke.spec.ts` ほか 4 本の visual spec / 既存 `apps/web/playwright/fixtures/auth.ts` の拡張 / `.github/workflows/verify-design-tokens.yml` / `.github/workflows/playwright-smoke.yml` / `apps/web/playwright.config.ts` / `package.json`（root）/ `apps/web/package.json` の **新規実装・編集**を伴う。さらに `apps/web/playwright/tests/visual/__screenshots__/` 配下に 4 PNG を baseline として commit し、GitHub branch protection の `required_status_checks.contexts` に 3 本の context を追加する運用変更まで含む。コード変更を伴う典型的な実装仕様書であり、CONST_004 のデフォルト（実装仕様書）に従う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-18-w7-verify-tokens-and-playwright-smoke |
| 由来 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/08-regression/task-18-w7-solo-verify-tokens-and-playwright-smoke.md`（同一ワークフローの最終 wave） |
| 配置先 | `docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/` |
| 作成日 | 2026-05-12 |
| 状態 | implemented_local_runtime_pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL（Playwright screenshot baseline は本タスクの evidence であり、UI 画面 reviewability そのものではない） |
| 想定 PR 数 | 1（本サイクル内で完了。CONST_007 に従い分割しない） |
| 想定工数 | 0.75〜1.0 人日 |
| ブランチ命名 | `feat/ui-mvp-task-18-regression-gate` |
| coverage AC | scripts に focused unit test を追加。リポジトリ閾値（lines ≥ 80%）は既存 gate に従う |
| Required Status Check | `verify-design-tokens / verify-design-tokens` / `playwright-smoke / smoke (chromium)` / `playwright-smoke / visual (chromium, 4 screens)` |

## 上位ゴール

`ui-prototype-alignment-mvp-recovery` ワークフローの最終 wave として、prototype（claude-design-prototype）と本番実装（apps/web）の **token / 画面 / 導線** が一致していることを CI で機械検証する gate を 1 PR で確立する。

1. (G1) 17 URL routes Playwright smoke: HTTP < 400、主要 landmark visible、axe-core `serious`/`critical` 0 件
2. (G2) verify-design-tokens: `09b-design-tokens.md §9 JSON` と `apps/web/src/styles/tokens.css` の literal 一致、`globals.css @theme inline` bridge 欠落 0
3. (G3) Visual regression baseline: `/login` / `/` / `/admin` / `/profile` の 4 画面で `maxDiffPixelRatio: 0.02`
4. (G4) Required status check 追加: 上記 3 context を `main` / `dev` の branch protection に登録

## スコープ（CONST_007 準拠 1 サイクル完了スコープ）

- 含む: scripts / e2e tests / playwright.config / fixtures / workflows / npm scripts / baseline screenshot / branch protection 追加申請 evidence の取得
- 含まない（理由を仕様書に明記して別タスク化）:
  - **完全な Visual Regression Suite（17 URL routes × 3 viewport）** — MVP 後の専用 visual regression workflow で実施。本タスク内完了が CI 時間・baseline flaky 観点で破綻するため、CONST_007 例外条件 1（独立した大規模スコープ）として分離。
  - **負荷試験 / Lighthouse CI** — 既存 `lighthouserc.json` healthcheck で別管理。

> 上記以外の項目は本サイクル内で完了させる。「分量が多い」「複雑」を理由とした分離は行わない。

## ディレクトリ構成

```
docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/
├── index.md                        # 本ファイル
├── artifacts.json                  # Phase 状態管理
├── phase-01.md                     # 要件定義 / Gate 整理
├── phase-02.md                     # ドメイン定義 / 用語 / 不変条件
├── phase-03.md                     # 設計（API / token diff / Playwright projects）
├── phase-04.md                     # テスト戦略
├── phase-05.md                     # テスト先行実装（RED）
├── phase-06.md                     # 本実装（GREEN）
├── phase-07.md                     # リファクタリング / 共通化
├── phase-08.md                     # 品質ゲート（typecheck / lint / unit / smoke / visual）
├── phase-09.md                     # 統合検証 / CI workflow drift 確認
├── phase-10.md                     # 最終レビュー / Required check 登録準備
├── phase-11.md                     # Evidence 収集（NON_VISUAL canonical paths）
├── phase-12.md                     # ドキュメント更新 / unassigned 検出 / コンプライアンス
├── phase-13.md                     # commit / PR / branch protection 反映（user approval 必須）
└── outputs/                        # 各 Phase の成果物（evidence / report / changelog）
```

## 参照（read-only）

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/08-regression/task-18-w7-solo-verify-tokens-and-playwright-smoke.md`（ソース仕様）
- `docs/00-getting-started-manual/specs/09b-design-tokens.md`（token value SSOT）
- `apps/web/src/styles/tokens.css` / `apps/web/src/styles/globals.css`（drift 検知対象、本タスクで値は変更しない）
- `apps/web/playwright.config.ts`（既存 projects 温存）
- `apps/web/playwright/fixtures/auth.ts`（既存 fixture 正本。新規 `apps/web/tests/e2e/fixtures/auth.ts` は作らない）
- `.github/workflows/e2e-tests.yml` / `.github/workflows/verify-indexes.yml`（命名規則整合）

## Refs ポリシー

`Refs #` 記法のみ。`Closes` / `Fixes` / `Resolves` は使わない（親 workflow のサブタスクであり Issue 自動 close を起こさないため）。
