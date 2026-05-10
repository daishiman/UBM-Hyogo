# Lessons Learned — task-13 Login Rebuild（2026-05-09）

> task: `task-13-login-rebuild`
> 関連 spec: `docs/30-workflows/task-13-login-rebuild/`、`docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md`、`docs/00-getting-started-manual/specs/13-mvp-auth.md`
> 関連 source: `apps/web/app/login/`、`apps/web/src/lib/url/login-query.ts`、`apps/web/src/lib/auth/magic-link-client.ts`、`apps/web/playwright/tests/login-smoke.spec.ts`、`apps/web/playwright.config.ts`
> 関連 reference: `references/workflow-task-13-login-rebuild-artifact-inventory.md`、`changelog/20260509-task-13-login-rebuild.md`、`LOGS/_legacy.md`、`docs/30-workflows/task-13-login-rebuild/outputs/phase-12/skill-feedback-report.md`

## 教訓一覧

### L-13-001: Phase 12 strict 7 outputs は `spec_created / VISUAL_ON_EXECUTION` であっても省略しない

- **背景**: task-13 は当初 `spec_created` 扱いで Phase 1-13 docs を出力していたが、`outputs/phase-12/` ディレクトリが欠落していたため後付けで `main.md` / `implementation-guide.md` / `phase12-task-spec-compliance-check.md` / `system-spec-update-summary.md` / `skill-feedback-report.md` / `unassigned-task-detection.md` / `documentation-changelog.md` の 7 ファイルを strict に補正した。`VISUAL_ON_EXECUTION` のため Phase 11 screenshot は実行時に生成する設計だが、Phase 12 文書は state とは独立して常に必須。
- **教訓**: workflow root state（`spec_created` / `implemented-local` / `implemented-local-runtime-pass`）と Phase 12 strict 7 出力義務は直交する。state を理由に Phase 12 文書を欠落させると、root/output `artifacts.json` parity と canonical state vocabulary の整合性チェックが事後修正になる。
- **将来アクション**: 新規 workflow を起票する Phase 1 段階で、Phase 12 出力 7 ファイルを placeholder（最低限の見出しのみ）として先置きし、Phase 12 到達時に内容を充填する。`task-specification-creator` の Phase 12 strict 7 outputs 規約は `LOGS/_legacy.md`（2026-05-09 task-13 entry）で明記済み。

### L-13-002: pnpm workspace の package command contract は `package.json#name` から discovery し、慣性 alias を信用しない

- **背景**: task-13 spec ドラフトには `pnpm --filter web typecheck` の形で gate コマンドが書かれていたが、実 workspace 名は `@ubm-hyogo/web` であり `--filter web` は no-op になる drift があった。`apps/web/package.json` を確認した時点で `pnpm --filter @ubm-hyogo/web typecheck` へ補正し、Phase 10 lint / typecheck / `verify-design-tokens` の 3 gate を正本化した。
- **教訓**: monorepo の filter alias は repo 履歴で変わる（`web` → scoped name 化など）。spec の gate command contract は文字列を写経せず、Phase 1 discovery で `package.json#name` を直接読む。
- **将来アクション**: `apps/web` / `apps/api` を扱う後続タスクは Phase 1 で `cat apps/<app>/package.json | jq .name` を実行し、その結果を Phase 10 gate コマンドへ embed する。`task-specification-creator` の Phase 10 テンプレに「workspace 名は `package.json` から read してから書く」を明示する選択肢あり。

### L-13-003: E2E locator contract は Phase 9 ではなく Phase 3 で固定し、UI 実装と同 wave で導出する

- **背景**: task-13 の Playwright smoke では `data-testid="login-card"` + `data-state` の 2 軸 locator を採用したが、当初の spec は Phase 9（E2E 設計）で初出だった。実装フェーズで「`LoginCard` props と locator が事後合意」になり、`role="alert"` for `rules_declined` derived state も Phase 8/9 を跨いで表記揺れが発生した。
- **教訓**: locator contract は UI 実装の DOM 構造と等価であるため、Phase 3（コンポーネント API 設計）で props と同じレイヤに固定する。Phase 9 で初出にすると、Phase 6（Vitest）/ Phase 8（accessibility）/ Phase 9（Playwright）が分散した locator を持ち、E2E 安定性が後付けの整合作業に依存する。
- **将来アクション**: 後続 UI rebuild タスク（task-12 / task-14 など）は Phase 3 component API spec に「locator contract（`data-testid` + `data-state` 等）」セクションを必須化する。`role="alert"` 等の ARIA derived state も同 Phase で固定し、Phase 8 accessibility 章は Phase 3 を参照する形に統一する。

### L-13-004: code diff が存在する `spec_created` workflow は `IMPLEMENTED_LOCAL_RUNTIME_PENDING` へ事前再分類する

- **背景**: task-13 は Phase 1-13 spec が docs-only として作成された状態で `apps/web/app/login/` 配下に実装 diff も並行して入り、`spec_created` のままでは「実装済みだが runtime evidence 未取得」状態を表現できなかった。最終的に `implemented-local / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING` の 4 軸で再分類し、staging smoke / production-equivalent runtime evidence / commit / push / PR を user approval gate に委ねた。
- **教訓**: workflow state vocabulary は「spec の存在」「local 実装の存在」「runtime evidence の存在」「user approval gate」の独立した 4 軸であり、`spec_created` を `implemented-local` に昇格させる契機は code diff の発生時点。事後再分類は task-workflow-active / artifact-inventory / changelog の同期を 3 重に発生させる。
- **将来アクション**: Phase 1 で `artifacts.json.metadata.visualEvidence` と code wave 予定を確認した時点で、code diff 発生 wave に `IMPLEMENTED_LOCAL_RUNTIME_PENDING` への遷移トリガを embed する。`runtime_pending_gate_type`（commit / push / PR の user approval 経路）を workflow metadata に明示するルール化は次回検討。

### L-13-005: Magic Link 失敗 URL transition と error query truncation は Phase 1 validation matrix に固定する

- **背景**: `apps/web/src/lib/url/login-query.ts` で error 文字列を 200 文字に切り詰める仕様は、実装段階で初めて定義された。`/login?state=error&error=<truncated>` の URL transition と error length cap は Phase 1 spec に未明示で、Vitest の `login-query.test.ts` 追加と並行して contract 化した。
- **教訓**: URL query parameter の長さ制約・truncation 規約は「セキュリティ + UX + 監視 ID 互換」の 3 軸を持つため、Phase 1 validation matrix に「query 名 / 最大長 / truncation 方針 / 受理側 parser の責務」を表として固定する。実装で発見されると Phase 6 test と Phase 8 accessibility が表記揺れする。
- **将来アクション**: 認証 / 状態遷移を含む後続 UI タスクは Phase 1 で「URL state machine」表（state value / required query / optional query / max length / truncation policy）を作る。`13-mvp-auth.md` への Magic Link error transition 追記は次回 spec 改訂候補。
