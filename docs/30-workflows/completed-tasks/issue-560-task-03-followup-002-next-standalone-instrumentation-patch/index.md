# タスク仕様書: Issue #560 — task-03-followup-002 Next.js standalone instrumentation patch script の build pipeline 恒常化と regression test 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-560-task-03-followup-002-next-standalone-instrumentation-patch |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/560 |
| 起票元 source | `docs/30-workflows/completed-tasks/task-03-followup-002-next-standalone-instrumentation-patch-001.md`（旧 unassigned follow-up を completed-tasks 配下で保持。本仕様書を実行用一次正本として formalize） |
| 親タスク | `task-03-w2-par-sentry-workers-sdk-unify` (`docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md`) |
| 配置先 | `docs/30-workflows/issue-560-task-03-followup-002-next-standalone-instrumentation-patch/` |
| 作成日 | 2026-05-08 |
| 状態 | implemented-local |
| workflow_state | implemented-local |
| runtimeEvidence | local_command_pass_ci_pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装仕様書]** — `scripts/patch-next-standalone-instrumentation.mjs` の本実装（既存が未配置の場合は新規作成 / 既存が暫定配置の場合は責務文書化と CI gate 化を伴う改修）、regression test 追加、CI gate 配線、`open-next.config.ts` 経由の build pipeline 接続、`docs/runbooks/` への RUN BOOK 追加までを 1 サイクルで完了させる。CONST_004 に基づき docs-only ではなくコード変更を伴う実装仕様書として作成する。 |
| 親 Issue 状態維持 | `gh issue view 560` 実態は **`state: OPEN`**。ユーザー指示「クローズドのままタスク仕様書を作成」は実態に関わらず仕様書化を継続する意である旨を確認済み。Issue の close/reopen 操作は本タスクの責務外。 |
| 優先度 | medium |
| 規模 | medium |
| 想定 PR 数 | 1（patch script 本実装 + regression test + CI gate + RUN BOOK を同一サイクルに含める） |
| coverage AC | `scripts/patch-next-standalone-instrumentation.mjs` の単体テスト、および `pnpm --filter @ubm-hyogo/web build:cloudflare` 後 `.next/standalone/apps/web/.next/server/instrumentation.js` の存在 + `Sentry` / `register` 含有を assert する regression test が CI で PASS。 |

## GitHub label / tag（Claude Code / Codex 共有用）

| 用途 | 値 |
| --- | --- |
| Issue 参照 | `#560` (`Refs: #560` を PR 本文に必ず含める) |
| GitHub Issue labels（継承） | `priority:medium`, `type:improvement`, `scale:medium`, `status:unassigned`, `area:testing` |
| PR に付与する labels | `priority:medium`, `type:improvement`, `scale:medium`, `area:testing` |
| `gh pr create` 引数 | `--label priority:medium --label type:improvement --label scale:medium --label area:testing` |
| ブランチ名 | `feat/issue-560-next-standalone-instrumentation-patch` |
| PR タイトル | `feat(web): issue-560 next standalone instrumentation patch pipeline + regression test` |
| 親タスク参照 | `task-03-w2-par-sentry-workers-sdk-unify` |

## 目的

task-03 で導入済みの `scripts/patch-next-standalone-instrumentation.mjs`（Next.js standalone build 出力へ `.next/server/instrumentation.js`、source map、`.nft.json`、trace 内依存ファイルを物理 copy する workaround）を、build pipeline で恒常運用するために以下を確定する:

1. patch script の責務 / 入出力境界を `outputs/phase-12/implementation-guide.md` に文書化する
2. standalone build 後の `instrumentation.js` 存在 + Sentry register 含有を assert する regression test を CI で実行する
3. CI gate を web build job に組み込み、patch 適用漏れ時に build job を fail させる
4. Next.js / OpenNext upstream 追従 RUN BOOK（version bump 時の patch 妥当性再確認手順）を追加する
5. `cwd=apps/web` ハードコード前提を runbook 化し、外部呼び出しからの誤実行を防ぐ

## スコープ

### 含む

- `scripts/patch-next-standalone-instrumentation.mjs` の責務確定・改修（既存 workaround に `cwd` guard / `--verify-only` / regression test を追加）
- `apps/web/open-next.config.ts` `buildCommand` 経由の patch 起動経路の固定化（現行 `cwd=apps/web` 前提を script 内 guard で明示）
- regression test:
  - `scripts/__tests__/patch-next-standalone-instrumentation.test.mjs`（node --test）: fixture `.next/server` / `.next/standalone/apps/web/.next` 構造を使う単体テスト
  - CI workflow 内 post-build assertion（`apps/web/.next/standalone/apps/web/.next/server/instrumentation.js` 存在 + 文字列 `register` / `Sentry` 含有確認）
- `.github/workflows/pr-build-test.yml` の `build-test` job への `build:cloudflare` + `verify-web-instrumentation-patch` gate 追加（`web-cd.yml` の Pages deploy cutover は別タスク責務として本タスクでは変更しない）
- `docs/runbooks/next-standalone-instrumentation-patch.md` RUN BOOK 新規追加（Next.js / OpenNext upgrade 時の追従手順）
- aiworkflow-requirements skill の `references/` / `topic-map` / `keywords` 反映

### 含まない

- Sentry SDK 構成自体の変更（親タスク task-03 の責務）
- `apps/api` 側の instrumentation 追加（別 workflow 範囲）
- OpenNext / Next.js 本体への upstream PR 提出（runbook で trigger 条件のみ言及）
- production deploy（CI gate PASS 後のリリースは別段ゲート）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `task-03-w2-par-sentry-workers-sdk-unify` | patch 対象の `instrumentation.ts` / `@sentry/cloudflare` register を確定する側。task-03 が `__ubmSentryInitialized__` ガード仕様を凍結してから本タスクの assertion を書く |
| 上流 | `apps/web/open-next.config.ts` | patch script の起動 hook 配線先 |
| 上流 | 既存 `.github/workflows/` web build job | gate 注入先 |
| 下流 | `docs/runbooks/` | RUN BOOK 配置先 |
| 下流 | aiworkflow-requirements skill | upstream 追従手順の SSOT 反映先 |

## 不変条件 / 制約

1. **API contract 不変**: `apps/api` への影響禁止。patch は `apps/web` build artifact のみを対象とする。
2. **`cwd` 前提固定**: patch script は `process.cwd()` が `apps/web` であることを冒頭で assert し、それ以外なら `process.exit(1)` で fail。runbook にも同条件を記載する。
3. **silent failure 防止**: build success かつ `instrumentation.js` 不在のケースを CI で必ず fail させる（Sentry server event が届かない silent failure を構造的に排除）。
4. **secret 非接触**: patch script は環境変数 / シークレットを読まない（純粋な file copy + grep 検証）。
5. **secret hygiene**: regression test 出力に DSN / token を絶対に含めない。

## 成果物（最終）

- `scripts/patch-next-standalone-instrumentation.mjs`（既存改修: `cwd` guard / `--verify-only` / structured log）
- `scripts/__tests__/patch-next-standalone-instrumentation.test.mjs`（新規）
- `apps/web/open-next.config.ts`（buildCommand 経由 patch 起動の最終配線）
- `.github/workflows/pr-build-test.yml`（`build:cloudflare` + `verify-web-instrumentation-patch` step 追加）
- `docs/runbooks/next-standalone-instrumentation-patch.md`（新規 RUN BOOK）
- `outputs/phase-12/implementation-guide.md` ほか Phase 12 必須 7 ファイル
- aiworkflow-requirements `references/` 反映差分

## Phase 一覧

| Phase | 内容 | 状態 |
| --- | --- | --- |
| 1 | 要件定義 / GO 判定 / silent failure 排除条件確定 | completed |
| 2 | 既存実装の current state 調査 / patch 対象 path 確定 | completed |
| 3 | 設計（patch script API / CI gate 配線 / runbook 構成） | completed |
| 4 | テスト設計（unit + post-build assertion） | completed |
| 5 | テスト実装（RED） | completed |
| 6 | 本実装（GREEN）— patch script + open-next.config 配線 | completed |
| 7 | RUN BOOK 執筆 + CI workflow 編集 | completed |
| 8 | リファクタリング | completed |
| 9 | 品質保証（typecheck / lint / unit test） | completed |
| 10 | 最終レビュー / runtime-export / OpenNext artifact drift 検証 | completed |
| 11 | NON_VISUAL evidence 収集（CI gate fail/pass 双方の証跡） | completed |
| 12 | ドキュメント整備（必須 7 ファイル） | completed |
| 13 | PR 作成（user 承認後） | blocked_pending_user_approval |
