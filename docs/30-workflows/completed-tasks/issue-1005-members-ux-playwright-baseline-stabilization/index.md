<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: index -->

[実装区分: 実装仕様書]

# issue-1005 — /members UX clarity Playwright visual baseline 安定化

> Workflow root: `docs/30-workflows/completed-tasks/issue-1005-members-ux-playwright-baseline-stabilization/`
> Branch: `docs/issue-1005-members-ux-playwright-baseline-stabilization`
> 実装区分: 実装仕様書 (CONST_004) / taskType=implementation / visualEvidence=VISUAL
> 状態: `implemented_local_evidence_captured`
> 関連 Issue: #1005（GitHub 上の実 state は **OPEN**。`task-members-ux-playwright-baseline-stabilization-001`）

## 0. 調査サマリ（Issue 最適化の根拠）

本仕様書は「Issue #1005 が他タスクで既に解決済みか」をコードベース実態で調査した結論に基づく。

| 観点 | 調査結果 |
| ---- | -------- |
| Issue state | GitHub API 上は **OPEN**（`closedAt: null`）。ユーザー認識「クローズド」と乖離。本仕様書では state を変更しない（user-gated）。 |
| 対象 spec の存在 | `apps/web/playwright/tests/members-ux-clarity.spec.ts` は実在（4 viewport × 3 density × 2 state = 24 PNG）。 |
| Issue 作成後の修正有無 | spec の git 履歴は #1009（初回実装）のみ。**安定化の後続修正は入っていない** → 別タスクで解決されていない。 |
| runtime-notes 実態 | `completed-tasks/members-list-ux-clarity/outputs/phase-11/runtime-notes.md` に「first test in a fresh dev-server run hit a local mock/API warm-up race; ... missing mobile comfy PNGs were captured with a direct Playwright script」と現存記録。**warm-up race は未解消**。 |
| route / DOM marker 現存 | `/members` は `apps/web/app/(public)/members/page.tsx` に実在。spec 依存マーカー（`member-filters` / `filters-summary-mobile` / `filters-body` / `empty-state` / `pagination-meta`）も全て現存 → spec は現行コードに対し有効。 |
| **新規回帰（dir 移動由来）** | spec の `workflowRoot` は `docs/30-workflows/members-list-ux-clarity` をハードコードするが、workflow dir は `completed-tasks/members-list-ux-clarity` へ移動済み。**再実行すると誤った新規 dir に PNG / runtime-notes を書き込む path drift** が発生する。 |

**結論: Issue #1005 は未解決であり、実行が必要。** さらに完了タスク移動に伴う path drift 回帰も同時に解消する。本タスクは純粋にコード変更を伴うため `[実装区分: 実装仕様書]` とする（CONST_004 デフォルト）。

## 1. タスク概要

`apps/web/playwright/tests/members-ux-clarity.spec.ts` を、cold start（dev server 新規起動）でも安定して 24 state の visual evidence を direct-script 補完なしで生成できる状態へ整える。あわせて出力先 path drift を補正する。

根本原因と対策:

| ID | 根本原因 | 対策 |
| --- | -------- | ---- |
| RC-1 | route warm-up 不在。Next dev (`dev:webpack`) は on-demand compile のため、matrix 先頭テスト（mobile/comfy）が `/members` cold-compile に当たり per-test timeout を超過し flaky になる。 | `playwright.config.ts` に `isMembersUxClarityBaseline` flag を追加し、webServer ready URL を `${localBaseURL}/members` にして起動時に route compile を強制（既存 `isMembersPrototypeAlignment` と同型）。`webServer.timeout` も 180s に拡張し、spec 側にも `beforeAll` の明示 warm-up navigation を追加。 |
| RC-2 | 出力先 path drift。spec の `workflowRoot` が旧 active path（`members-list-ux-clarity`）固定で、移動後の `completed-tasks/...` を指していない。 | `workflowRoot` を `completed-tasks/members-list-ux-clarity` へ補正し、`process.env.MEMBERS_UX_EVIDENCE_DIR` override も許容。config の `EVIDENCE_DIR` 分岐も同 path へ整合。 |
| RC-3 | multi-project 冗長実行。spec が default の desktop-chromium / desktop-firefox / mobile-webkit 3 project で同名 24 PNG を 3 重に上書きし、flake 面と実行時間を増やす。 | evidence flag 未設定時は `fixtureGatedTestIgnore` で除外し、evidence run（argv / env flag）時は単一 project（desktop-chromium 相当）で 1 回だけ実行する。 |
| RC-4 | runtime-notes が direct-script 補完前提の記述。 | spec の `afterAll` runtime-notes 生成文言を「cold start で direct-script 補完不要」に更新し、出力先を補正後 path に固定。 |
| RC-5 | mobile filter summary click が cold-start hydration 直後に state 反映されず、`filters-body` が hidden のままになることがある。 | 実クリック後に `data-expanded=true` を待ち、visual baseline 取得目的の fallback として撮影状態を DOM 属性で固定する。toggle 挙動自体は component test で担保。 |

## 2. スコープ (CONST_005 + CONST_007: 1 サイクル完了)

本タスクは本サイクル内で実装・検証・正本同期まで完了する。分割・先送りはしない。

### 2.1 変更対象ファイル

| 種別 | パス | 概要 |
| ---- | ---- | ---- |
| 編集 | `apps/web/playwright.config.ts` | `isMembersUxClarityBaseline` flag 追加 / EVIDENCE_DIR 分岐 / ready URL `/members` / webServer command 分岐 / timeout 180s / fixtureGatedTestIgnore |
| 編集 | `apps/web/playwright/tests/members-ux-clarity.spec.ts` | `workflowRoot` path 補正 + env override / `beforeAll` warm-up navigation / mobile filter expansion fallback / runtime-notes 文言更新 |

### 2.2 非スコープ

- staging deploy / staging visual baseline 更新（Gate-C, user-gated）
- production data backfill
- `/members` API の schema / query contract 変更（INV-1）
- `members-list-ux-clarity` の UI component 内部実装変更
- OKLch design tokens 変更（INV-4）
- GitHub Issue #1005 の state 変更（user-gated）

## 3. 不変条件

1. INV-1: 既存 API endpoint surface のみ利用。新 endpoint / D1 schema / Google Form 仕様変更禁止。
2. INV-2: OKLch token 正本維持。HEX 直書き禁止。
3. INV-3: 新 primitive を生やさない。
4. INV-4: `apps/web` から D1 直接アクセス禁止。
5. INV-5: 新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）。本タスクは既存 `.spec.ts` の編集のみで新規ファイルを増やさない。
6. INV-6: `127.0.0.1:8888` 等ローカル限定 endpoint の `apps/web/src` 焼き込み禁止。

## 4. Gate 構成 (artifacts.json)

| Gate | 内容 | evidence |
| ---- | ---- | -------- |
| Gate-A | spec_review (Phase 1-3 完了) | `phase-3-design-review.md` |
| Gate-B | implementation_review (Phase 4-11 完了 / cold-start 24 PNG 取得) | `outputs/phase-11/manual-test-result.md` |
| Gate-C | external_ops (commit / push / PR (dev base) / staging visual baseline) | `outputs/phase-13/pr-creation-result.md` |

Gate-A/B はローカル実装・検証で通過済み。Gate-C（commit / push / PR / staging visual baseline / Issue state 変更）のみ user-gated。

## 5. 成果物一覧 (Phase 1-13)

| ファイル | 役割 |
| -------- | ---- |
| `index.md` | (本書) タスク総括 + 調査結論 |
| `artifacts.json` | task metadata + gates A/B/C + phases 1-13 |
| `phase-1-requirements.md` | 要件（根本原因 RC-1〜RC-4 / AC） |
| `phase-2-design.md` | config / spec 差分設計 |
| `phase-3-design-review.md` | 代替案比較・採用根拠 |
| `phase-4-test-plan.md` | 検証計画（cold-start run / PNG 数 / typecheck） |
| `phase-5-implementation.md` | 実装手順 (CONST_005 必須項目を完備) |
| `phase-6-test-additions.md` | 追加検証 step |
| `phase-7-coverage.md` | coverage / 実行カバレッジ方針 |
| `phase-8-refactor.md` | リファクタ方針 |
| `phase-9-qa.md` | QA チェックリスト |
| `phase-10-final-review.md` | 最終レビュー |
| `phase-11-manual-test.md` | cold-start visual evidence 取得手順（24 PNG） |
| `phase-12-documentation.md` | Phase 12 ドキュメント同期入口（strict 7 は `outputs/phase-12/`） |
| `phase-13-pr.md` | PR 作成手順 (dev base) |
| `outputs/phase-12/*` | strict 7（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check） |

## 6. DoD

- [ ] workflow root 直下に Phase 1-13 が配置されている
- [ ] artifacts.json が canonical schema（Gate-A/B passed、Gate-C pending、metadata.workflow_state=implemented_local_evidence_captured）で配置されている
- [ ] Phase 5 が CONST_005 必須項目（変更対象ファイル / 関数・差分方針 / 入出力・副作用 / テスト方針 / ローカル実行コマンド / DoD）を完備
- [ ] Phase 11 が cold-start 24 PNG 取得手順を含む
- [ ] Phase 12 strict 7 が `outputs/phase-12/` に配置され canonical 9 headings 準拠
- [ ] Phase 13 が dev base PR である旨を明記
