# task-25-ui-mvp-w8-par-routes-smoke-coverage

> ワークフロー: `task-25-ui-mvp-w8-par-routes-smoke-coverage`
> 親ワークフロー: `ui-prototype-alignment-mvp-recovery`
> Wave: W8 par（task-23 / task-24 / task-26 と並列実行可能）
> 種別: **docs-only / NON_VISUAL / verify_existing**

## メタ情報

| 項目 | 値 |
|------|----|
| Task ID | `task-25-ui-mvp-w8-par-routes-smoke-coverage` |
| Implementation Mode | `verify_existing`（既存 spec を起点に matrix 化、新規テストコード追加は task 外） |
| タスク種別 | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| Task Classification | docs-only / NON_VISUAL |
| 目的 | MVP recovery 対象の現行 17 URL smoke entries + 2 component surfaces × {status / DOM / token / a11y / interaction} 5 軸の Playwright smoke coverage matrix を明文化する |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |
| 依存（upstream） | task-18（CI gate 完了済み）, task-11〜17, task-20/21（routes 実装完了済み） |
| 依存（downstream） | なし（独立完結） |
| ブランチ命名 | `feat/ui-mvp-task-25-routes-smoke-coverage` |

## Phase 一覧

| Phase | 名称 | 状態 |
|-------|------|------|
| 1 | 要件定義 | spec_created |
| 2 | 設計 | spec_created |
| 3 | 設計レビュー | spec_created |
| 4 | テスト作成（targeted: matrix 整合確認） | spec_created |
| 5 | 実装（matrix 文書作成 = diff check） | spec_created |
| 6 | テスト拡充（matrix 完全性確認） | spec_created |
| 7 | カバレッジ確認（17 URL smoke + 2 component surfaces × 5 軸） | spec_created |
| 8 | リファクタリング（重複除去） | spec_created |
| 9 | 品質保証（line budget / link / mirror parity） | spec_created |
| 10 | 最終レビュー | spec_created |
| 11 | 手動テスト（NON_VISUAL evidence） | spec_created |
| 12 | ドキュメント更新（strict 7 成果物） | spec_created |
| 13 | PR 作成（ユーザー明示承認後） | blocked |

## Phase Links

- [Phase 1](phase-01.md)
- [Phase 2](phase-02.md)
- [Phase 3](phase-03.md)
- [Phase 4](phase-04.md)
- [Phase 5](phase-05.md)
- [Phase 6](phase-06.md)
- [Phase 7](phase-07.md)
- [Phase 8](phase-08.md)
- [Phase 9](phase-09.md)
- [Phase 10](phase-10.md)
- [Phase 11](phase-11.md)
- [Phase 12](phase-12.md)
- [Phase 13](phase-13.md)

## 不変条件

1. 既存 `apps/web/playwright/tests/` 配下の smoke / visual spec を起点に正本化（新規テストコード追加は task 外）
2. coverage matrix は 17 URL smoke entries + 2 component surfaces × {status / DOM / token / a11y / interaction} 5 軸で記載し、URL smoke と component-only surface を混同しない
3. 各 route の最小 assertion を Playwright API spec（`page.locator` / `expect.toHaveScreenshot` 等）で記述
4. 既存 4 visual baseline（login / public-top / admin-dashboard / profile）との関係を明示
5. task-18 の `playwright-smoke / smoke (chromium)` と `playwright-smoke / visual (chromium, 4 screens)` を CI gate として参照

## 関連リンク

- 親 SCOPE: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md`
- 主成果物: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- 上流 task-18: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/08-regression/task-18-w7-solo-verify-tokens-and-playwright-smoke.md`
- 既存 smoke spec: `apps/web/playwright/tests/full-smoke.spec.ts`
- 既存 visual spec: `apps/web/playwright/tests/visual/{login,public-top,admin-dashboard,profile}.spec.ts`
