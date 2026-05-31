<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 8 -->

[実装区分: 実装仕様書]

# Phase 8 — リファクタ

## 1. リファクタ方針

本タスクは2ファイル（`apps/web/playwright.config.ts` / `apps/web/playwright/tests/members-ux-clarity.spec.ts`）のみを変更する小規模安定化であり、大規模リファクタは非対象とする。以下の「既存規約への整合」観点のみ適用する。

## 2. 整理観点

| # | 対象 | 整理内容 |
| - | ---- | -------- |
| R-1 | `playwright.config.ts` の flag 命名 | 追加する `isMembersUxClarityBaseline` を既存 `is*` flag 群（`isMembersPrototypeAlignment` など）と同じ camelCase / 真偽判定の記述スタイルに揃える。flag 定義は既存 flag 群と同一ブロックに隣接配置する |
| R-2 | `playwright.config.ts` の EVIDENCE_DIR 分岐 | EVIDENCE_DIR を解決する三項チェーンへ、`isMembersUxClarityBaseline` 分岐を既存分岐の並び順（flag 定義順と同順）に合わせて追加する。新たな分岐スタイルを発明しない |
| R-3 | `playwright.config.ts` の webServer ready URL | ready URL の `/members` 化は既存 `isMembersPrototypeAlignment` の `/login` 先行例と同じ三項記述パターンに揃える |
| R-4 | `members-ux-clarity.spec.ts` の path 解決 | evidence 保存先 path を `process.env.MEMBERS_UX_EVIDENCE_DIR !== undefined ? resolve(...) : join(...)` の単一式へ集約する。path 文字列を複数箇所へ重複させない（マジック文字列の単一化） |
| R-5 | `workflowRoot` 定数 | `docs/30-workflows/completed-tasks/members-list-ux-clarity` を1箇所の定数に保持し、screenshots / runtime-notes 双方の path をその定数から導出する |

## 3. 非対象（手を入れない）

- `expandFiltersIfCollapsed` の hydration retry（3回）ロジックは**現状維持**。リトライ回数・待機・marker 探索を変更しない。
- VIEWPORTS / DENSITIES / STATES の matrix const は単一 spec 内 const のまま維持し、共通 helper module へ切り出さない（YAGNI / INV-5）。
- screenshot 命名規約 `members-ux-clarity-${density}-${state}-${viewport}.png` を変更しない。
- `mask: [data-role=pagination-meta]` / `fullPage: true` を変更しない。

## 4. 適用ルール

- 機能変更なし（既存 run の挙動を変えない）。
- リファクタは typecheck / lint が GREEN のまま実施する。
- 1 PR / 1 サイクル内で完結する（CONST_007）。

## DoD

- [ ] flag 命名・配置を既存 `is*` 群へ整合する方針が記録されている
- [ ] EVIDENCE_DIR 分岐の追加位置が既存順序に揃う方針が記録されている
- [ ] spec の path 解決を単一式へ集約する方針が記録されている
- [ ] `expandFiltersIfCollapsed` retry に手を入れない旨が明記されている
