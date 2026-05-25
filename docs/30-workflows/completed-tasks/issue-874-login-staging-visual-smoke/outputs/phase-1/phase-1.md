**[実装区分: 実装仕様書]**

# Phase 1: 要件定義 / スコープ確定 / 既存実装インベントリ

## 0. メタ情報

| key | value |
|---|---|
| workflow root | `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/` |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| implementation_mode | `new`（新規 shell helper + 既存 spec の env-override 化） |
| source issue | https://github.com/daishiman/UBM-Hyogo/issues/874 |
| source followup id | FU-LOGIN-003 |
| parent workflow | `docs/30-workflows/completed-tasks/login-page-prototype-alignment/` |
| 状態 | `runtime_pending` |

## 1. 背景

親 workflow `login-page-prototype-alignment` 完了時の Phase 12 `unassigned-task-detection.md` で **FU-LOGIN-003: staging visual smoke 実行 + staging evidence 取得** が独立フォローアップとして検出された。local visual evidence 8 PNG は親 workflow で取得済みだが、Cloudflare Workers `dev` (staging) 環境を base URL とする visual smoke は未実行で、staging-specific evidence が存在しない。

`apps/web/playwright.config.ts` には既に `staging` project（`baseURL = PLAYWRIGHT_STAGING_BASE_URL`）と `PLAYWRIGHT_EVIDENCE_DIR` を読む global rule が存在するが、`apps/web/playwright/tests/login-smoke.spec.ts` の `EVIDENCE_DIR` 定数は親 workflow path にハードコードされており、staging 実行時に出力先を別 path へ振り分けられない。本 task でこの gap を最小差分で解消し、staging evidence 7 PNG を本 workflow 配下に取得する。

## 2. 現状コードインベントリ（実測）

| path | 役割 | 改修方針 |
|---|---|---|
| `apps/web/playwright/tests/login-smoke.spec.ts` | `/login` の 7 state visual smoke。`EVIDENCE_DIR` を親 workflow の `outputs/phase-11/screenshots` にハードコード | **`process.env.PLAYWRIGHT_EVIDENCE_DIR` を優先し、未設定時は既存 local 既定値を使う** 1 行差分。state 数・assertion・selector は無改変 |
| `apps/web/playwright.config.ts` | `staging` project (`baseURL = PLAYWRIGHT_STAGING_BASE_URL`) と `PLAYWRIGHT_EVIDENCE_DIR` global rule | **無改変**（既存実装で要件を満たす） |
| `scripts/run-login-staging-smoke.sh` | 該当ファイルなし | **新規作成**。`PLAYWRIGHT_STAGING_BASE_URL` / `PLAYWRIGHT_EVIDENCE_DIR` を export → `pnpm --dir apps/web exec playwright test playwright/tests/login-smoke.spec.ts --project=staging --grep 'renders LoginCard\|captures mobile input' --reporter=line` |
| `scripts/cf.sh` | Cloudflare CLI 実行ラッパー | **無改変**。staging deploy は本 helper の中で `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` を別途呼ぶか、user が事前実行 |
| `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-003-staging-visual-smoke.md` | 元 unassigned-task spec | **status を `pending` → `consumed`、canonical_workflow を本 workflow path に更新** |
| `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` | 親 workflow の Phase 12 detection レポート | **FU-LOGIN-003 行を `consumed by issue-874-login-staging-visual-smoke` に back-reference** |
| `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-11/screenshots/login-*.png` | local baseline (8 PNG, mobile 含む) | **無改変**。AC-3 の目視 diff 参照元として使用 |

新規作成対象:

| path | 役割 |
|---|---|
| `scripts/run-login-staging-smoke.sh` | staging visual smoke 実行ヘルパー（shellcheck clean） |
| `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots/login-{input,sent,unregistered,rules-declined,deleted,error,input-mobile}.png` | staging evidence 7 PNG |

## 3. 機能要件

| ID | 要件 |
|---|---|
| FR-1 | `login-smoke.spec.ts` の `EVIDENCE_DIR` は `PLAYWRIGHT_EVIDENCE_DIR` 環境変数が設定されていればその絶対パス化された値を、未設定なら従来 local 既定値 (`../../docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-11/screenshots`) を使う |
| FR-2 | `scripts/run-login-staging-smoke.sh` は第 1 引数 (`$1`) または環境変数 `PLAYWRIGHT_STAGING_BASE_URL` を受け取り、空なら usage を出力して exit 1 |
| FR-3 | `run-login-staging-smoke.sh` は `PLAYWRIGHT_EVIDENCE_DIR` を `apps/web` 基準の `../../docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots` に固定し、task workflow 配下へ解決させる |
| FR-4 | `run-login-staging-smoke.sh` は `pnpm --dir apps/web exec playwright test playwright/tests/login-smoke.spec.ts --project=staging --grep 'renders LoginCard\|captures mobile input' --reporter=line` を実行し、staging 対象 7 screenshot test のみに限定する |
| FR-5 | staging 実行で `outputs/phase-11/staging-screenshots/` に 7 PNG (`login-input.png` / `login-sent.png` / `login-unregistered.png` / `login-rules-declined.png` / `login-deleted.png` / `login-error.png` / `login-input-mobile.png`) が生成される |
| FR-6 | 既存 local 実行ルート（`pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/login-smoke.spec.ts`）は **無改変** であり、`PLAYWRIGHT_EVIDENCE_DIR` 未設定時に従来 path へ書き出す |
| FR-7 | 親 workflow `unassigned-task-detection.md` の FU-LOGIN-003 行 / unassigned-task spec の status を `consumed` に更新する |

## 4. 非機能要件

| ID | 要件 |
|---|---|
| NFR-1 | 既存 `playwright.config.ts` への変更を行わない（既に `staging` project と `PLAYWRIGHT_EVIDENCE_DIR` を持つ） |
| NFR-2 | `run-login-staging-smoke.sh` は `set -euo pipefail` と shellcheck clean を満たす |
| NFR-3 | CLAUDE.md の Cloudflare CLI 実行ルール遵守。`wrangler` 直接呼び出しを script 内に書かない（必要時は `scripts/cf.sh` 経由） |
| NFR-4 | staging evidence PNG は各 ≤ 500KB を期待値とし、ファイルサイズ超過時は Phase 11 レポートで原因を要約 |
| NFR-5 | `apps/web` から D1 直接アクセス禁止 / 新規 API endpoint 追加禁止の原則を維持 |
| NFR-6 | 新規 test ファイル禁止 (`*.spec.{ts,tsx}` 既存改修のみ)。spec 改修は 1 行 env-override 差分のみで state assertion は触らない |
| NFR-7 | 1 サイクル内完了（CONST_007）。spec 改修 → shell helper 追加 → staging deploy → smoke 実行 → evidence 取得 → consumed trace を 1 PR で完結 |

## 5. 受け入れ基準（AC）

- AC-1: staging URL に対し `login-smoke.spec.ts --project=staging --grep 'renders LoginCard\|captures mobile input' --reporter=line` が 0 fail / 0 flaky / 7 passed で完走
- AC-2: staging evidence 7 PNG が `outputs/phase-11/staging-screenshots/` に保存、各 non-empty かつ ≤ 500KB
- AC-3: local baseline との目視 diff で構造的回帰なし（OKLch token 差分 / typography / spacing の崩れがない）
- AC-4: `login-smoke.spec.ts` の `EVIDENCE_DIR` が `PLAYWRIGHT_EVIDENCE_DIR` で env-override 可能、local 既定値は従来通り
- AC-5: `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-003-staging-visual-smoke.md` の status が `consumed`、`docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` の FU-LOGIN-003 行が `consumed by issue-874-login-staging-visual-smoke` に同期
- AC-6: staging deploy は `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` 経由・user 承認後の実行記録あり（Phase 11 evidence に exit code log）
- AC-7: production smoke は本 task のスコープ外。別 followup 化を Phase 12 unassigned に明記

## 6. スコープ確定

### 含む

- `apps/web/playwright/tests/login-smoke.spec.ts` の `EVIDENCE_DIR` env-override 化 1 行差分
- `scripts/run-login-staging-smoke.sh` 新規追加
- staging deploy → smoke 実行 → staging evidence 7 PNG 取得
- 親 workflow `unassigned-task-detection.md` の FU-LOGIN-003 consumed 化
- `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-003-staging-visual-smoke.md` の `status: consumed` 更新

### 含まない（明示的に後回し / 別タスク）

- production 環境への visual smoke（別 followup として独立）
- `playwright.config.ts` への staging project 追加（既存実装で充足）
- visual diff の自動 threshold 設定（目視 diff のみ）
- 他 route（`/members` 等）の staging visual smoke
- D1 schema / Google Form 仕様 / Auth.js handler の変更

### 正本順位

1. 本仕様書および `index.md`
2. `apps/web/playwright.config.ts`（staging project と `PLAYWRIGHT_EVIDENCE_DIR` global rule）
3. 親 workflow `login-page-prototype-alignment` の Phase 12 unassigned-task-detection.md
4. CLAUDE.md（Cloudflare CLI 実行ルール / 新規 test ファイル禁則）

## 7. タスク分類記録

| 観点 | 判定 |
|---|---|
| UI task / docs-only task | **UI task**（visual evidence を staging で取得） |
| Phase 11 mode | **VISUAL**（Playwright screenshot 取得） |
| P50 チェック | 現 branch に未実装 → `implementation_mode: "new"` |
| 命名規則 | shell script は kebab-case (`run-login-staging-smoke.sh`)、evidence PNG は state 名 kebab-case（既存 spec の出力名と一致） |

## 8. 実装モード判定の根拠

- `scripts/run-login-staging-smoke.sh` は現存しない → `new` モード
- spec 改修は env-override 1 行のみで、state 数・assertion は触らない → 既存契約 (local baseline) 互換を保つ最小差分

## 9. リスクと初期対策

| リスク | 影響 | 対策 |
|---|---|---|
| staging URL 未設定で smoke が空走 | 0 PNG / false PASS | `run-login-staging-smoke.sh` で `PLAYWRIGHT_STAGING_BASE_URL` 必須化、未設定時 exit 1 |
| `EVIDENCE_DIR` 改修で local 既定値が壊れて既存 baseline 上書き事故 | local snapshot が staging で上書きされる | 既定値式 (`process.env.PLAYWRIGHT_EVIDENCE_DIR ?? <local default>`) を 1 行で実装、Phase 4 で env 未設定ケースを vitest/playwright dry-run で確認 |
| Cloudflare staging が cold start で初回 TTFB 超過 → flaky | smoke fail / 再実行 | Phase 11 の準備手順で「smoke 実行前に staging URL を 1 回 warm up」を必須化 |
| staging session cookie / CSRF が `dev` 環境特有値で local と異なる | unregistered / rules_declined state が再現せず PNG が input 状態のまま | Phase 5 の staging deploy 後に `mock` ルートまたは fixture cookie の利用可否を確認、対応 PNG は spec が provide する mock state route を再利用 |
| staging deploy 直前の last green commit と本 branch の diff が大きく smoke が回帰 | false fail | Phase 5 で staging deploy 前に `git log origin/dev..HEAD` を確認し、無関係な大規模 diff を含めない |

## 10. Phase 1 完了条件

- [x] taskType / visualEvidence / implementation_mode を確定（implementation / VISUAL / new）
- [x] 既存ファイル / 新規ファイル 11 件のインベントリと改修方針を明示
- [x] FR-1〜FR-7 / NFR-1〜NFR-7 / AC-1〜AC-7 を列挙
- [x] スコープの「含む」「含まない」を明示
- [x] 正本順位を確定
- [x] タスク分類（UI task / VISUAL / new）を記録
- [x] 実装モードを `new` と判定し根拠を記載
- [x] 初期リスク 5 件と対策を列挙

## 11. 次 Phase への引き継ぎ

Phase 2 では本 Phase で確定したインベントリと FR/NFR/AC を入力として、(a) `playwright.config.ts` 改修ではなく spec env-override で対処する設計判断、(b) shell helper の責務範囲（実行のみ・deploy 含めない）、(c) staging evidence path 配置 (`outputs/phase-11/staging-screenshots/`)、(d) 実装順序「spec 改修 → shell helper → staging deploy → smoke → evidence → consumed trace」の設計判断を文書化する。
