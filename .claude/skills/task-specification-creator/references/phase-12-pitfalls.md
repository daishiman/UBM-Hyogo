# Phase 12 実行時によくある漏れ / 苦戦防止 Tips

> **Feedback ID 凡例**: 表中の `[Feedback N]` / `[Feedback W0-NN]` / `[UBM-NNN]` 等は [../LOGS.md](../LOGS.md) および [../SKILL-changelog.md](../SKILL-changelog.md) のエントリと 1:1 で紐づく。ID は append-only で再利用しない（旧 ID は changelog 側へ退避し、新規追加は採番済み末尾の次番号を使う）。

## Phase 12 実行時によくある漏れ

| 漏れパターン                                                                                                                                                         | 防止方法                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Step 1-C（関連タスクテーブル）を未実行                                                                                                                               | spec-update-workflow.md の「確認すべきファイル」表を実行前に必ず読む                                                                                                                                                                                                       |
| topic-map.md 未更新                                                                                                                                                  | 仕様書に新規セクション追加時は必ず topic-map.md のエントリも追加                                                                                                                                                                                                           |
| documentation-changelog.md が不完全                                                                                                                                  | 全Step（1-A/1-B/1-C/Step 2）の結果を個別に明記する（「該当なし」も記録）                                                                                                                                                                                                   |
| `system-spec-update-summary.md` を未作成で完了扱い                                                                                                                   | Phase 12成果物一覧と `outputs/phase-12/` 実体を1対1で突合し、不足ファイルは完了前に作成する                                                                                                                                                                                |
| LOGS.md が1ファイルのみ更新                                                                                                                                          | 必ず aiworkflow-requirements/LOGS.md と task-specification-creator/LOGS.md の両方                                                                                                                                                                                          |
| 完了タスクセクションが簡略形式                                                                                                                                       | spec-update-workflow.md のテンプレート（テスト結果サマリー + 成果物テーブル）に従う                                                                                                                                                                                        |
| `artifacts.json` と `outputs/artifacts.json` が不一致                                                                                                                | Phase 12完了前に2ファイルを同期し、completed成果物の参照切れを0件にする                                                                                                                                                                                                    |
| 設計タスクの workflow root を `completed` にしてしまう                                                                                                               | workflow root は `implementation_ready`、completed ledger は `spec_created` に分離する                                                                                                                                                                                     |
| Phase 10 MINOR指摘を未タスク化せず進行                                                                                                                               | **Phase 10レビュー前に** unassigned-task-guidelines.md を読み、MINOR判定→未タスク化ルールを確認                                                                                                                                                                            |
| 未タスク検出レポートで0件判定のまま未修正                                                                                                                            | Phase 10 MINOR指摘は必ず未タスク化の対象。「機能に影響なし」は不要判定の理由にならない                                                                                                                                                                                     |
| `task-workflow.md` の未タスクリンクが参照切れ                                                                                                                        | Step 1-E後に `verify-unassigned-links.js` を実行して `ALL_LINKS_EXIST` を確認する                                                                                                                                                                                          |
| **[Feedback 2]** Phase 12 着手時に `outputs/artifacts.json` と phase spec の artifact 名が照合されない                                                               | Phase 12 の **最初の作業**として `outputs/artifacts.json` と各 `phase-*.md` に記載されたartifact名を1対1で突合し、不一致があれば着手前に修正する                                                                                                                           |
| **[Feedback 3]** Phase 11 の UI task / docs-only task 判定がずれる                                                                                                   | Phase 1 で記録したタスク分類（UI task / docs-only task）を Phase 11 着手時に必ず参照する。分類が変わっていた場合は再判定を明示する                                                                                                                                         |
| **[Feedback W0-01]** shared 型追加で root `@repo/shared` に再エクスポートすると `SkillCategory` が衝突する                                                           | 新しい共有型は subpath export（例: `@repo/shared/types/skillCreator`）に閉じ、既存 root barrel は触らない。`phase-12-docs.md` と system spec の両方で公開経路を明記する                                                                                                    |
| **[Feedback P0-09-U1-1]** Phase 4 仕様書に private method テスト方針が未記載                                                                                         | `(facade as unknown as FacadePrivate)` キャストと public callback 経由テストの2択を Phase 4 仕様書に必ず明記する                                                                                                                                                           |
| **[Feedback P0-09-U1-2]** `improve()` フローの canUseTool 配線先（SDK callback vs `applyImprovement()`）が仕様書から読み取れない                                     | Phase 5 仕様書のタスク2に「canUseTool 適用可能範囲と制約」セクションを設け、`llmAdapter.sendChat()` 経由時は SDK callback 非適用と明記する                                                                                                                                 |
| **[Feedback BEFORE-QUIT-001]** Phase 11 が非 visual task なのに実地操作を要求してしまう                                                                              | Phase 11 では「実地操作不可」を明記し、自動テスト結果 + 既知制限リストを代替記録として残す                                                                                                                                                                                 |
| **[Feedback BEFORE-QUIT-002]** Phase 7 coverage が全ファイル一律指定だと局所検証の意図がぼやける                                                                     | Phase 7 では coverage の対象範囲を明示し、変更したファイル/ブロック以外を対象外として書く                                                                                                                                                                                  |
| **[Feedback BEFORE-QUIT-003]** Phase 12 の system-spec update で workflow-local と global sync が混在する                                                            | `documentation-changelog.md` で workflow-local 同期と global skill sync を別ブロックで記録する                                                                                                                                                                             |
| **[Feedback 4]** Phase 11 NON_VISUAL のとき manual-test-result.md の証跡メタが薄い                                                                                   | Phase 11 が NON_VISUAL の場合、`manual-test-result.md` のメタ情報に「証跡の主ソース（自動テスト名/件数）」と「スクリーンショットを作らない理由」を明記する。空メタでは reviewer が意図を読み取れない                                                                       |
| **[Feedback 5]** Phase 7 の coverage 目標が広域指定のとき変更行の保護確認が曖昧になる                                                                                | Phase 7 のカバレッジ目標が「全体 X%」など広域指定のとき、変更した関数/ブロックの line カバレッジと branch カバレッジの実測値を証跡に残す（例: `applyWorkflowSnapshot` 付近の line 100% / branch 100%）                                                                     |
| **[Feedback 6]** ViewType を追加した際に navigation 契約・store 型・既存テストの3点更新が漏れる                                                                      | `store/types.ts`（ViewType union）/ `skillLifecycleJourney.ts`（正規化関数・定数）/ renderView テスト を same-wave で更新し、`ui-ux-navigation.md` の ViewType テーブルも同時同期する。Phase 1 設計メモに「追加 ViewType: XYZ」を明示しておくと漏れが防げる                |
| **[FB-UI-02-1]** Phase 9 QA で「ファイル削除」を PASS 基準にすると stub 化タスクが FAIL 扱いになる                                                                   | Phase 9 の削除確認は「git delete されている OR `export {}` stub 化かつ live import ゼロのいずれか」を PASS とする。たとえば、廃止ファイルを stub 化した場合は `grep -rn "import.*廃止ファイル名" src/` でゼロ件を証跡に残す                                                |
| **[Feedback TASK-UI-04]** 実装完了後に `artifacts.json` status が `spec_created` / `in_progress` のまま放置される                                                    | 実装 Phase（Phase 5 or 最終実装 Phase）完了時に `complete-phase.js` を必ず実行し、status を `completed` に更新する。実装完了と仕様書ステータス更新は同一 wave で行う（後回しは乖離蓄積の主因）。有効値: `spec_created` / `in_progress` / `completed` / `phase12_completed` |
| **[Feedback W1-02b-1]** UI task の `screenshot-plan.json` が `mode: "NON_VISUAL"` のまま Phase 11 を迎えやすい                                                       | UI コンポーネント変更タスクでは `screenshot-plan.json` 生成時に `mode: "VISUAL"` をデフォルトにする。`phase11-capture-metadata.json` の `taskId` が現行タスク ID と一致するか Phase 11 着手前に確認する（`jq '.taskId' outputs/phase-11/phase11-capture-metadata.json`）   |
| **[Feedback W1-02b-2]** multi-step wizard 設計で「ステップ間の state ownership と引き渡し項目」が Phase 2 設計書に未記載                                             | Phase 2（設計）でウィザード / マルチステップ UI を設計する場合、「ステップ間 state 引き渡しテーブル」を必須セクションとして設ける。`smartDefaults` など推論値の反映タイミング（初回のみ / 都度上書き / ユーザー優先）は decision 欄で固定する                              |
| **[Feedback W1-02b-3]** `implementation-guide.md` の callback 名・props 名が実装と一致していない（identifier drift）                                                 | Phase 12 Task 12-6 で `implementation-guide.md` 内の識別子を現行コードで `grep` 確認する。スニペットは型定義・props interface から引用し、手書き snippets を避ける                                                                                                         |
| **[Feedback W1-02b-4]** renderer UI コンポーネントで node-only パッケージを直接 import し、Vite browser bundle が runtime error になる                               | renderer コンポーネントでは node-only パッケージ（`node-cron` 等）を直接 import しない。cron/schedule 検証は browser-safe ユーティリティに切り出す。Phase 11 capture 前に「ブラウザで実際に route を開く smoke test」を必須にする                                          |
| **[UBM-009]** 本番不可逆操作 task で docs-only template 整備を「本番完了」と誤読する | Phase 5 / Phase 11 が NOT EXECUTED の場合、index / artifacts / go-nogo は `docs-ready-execution-blocked` 等の状態にし、実デプロイ完了・本番稼働・下流解放を示す文言を使わない |
| **[UBM-010]** `capture-pending.png` 等の placeholder を Phase 11 screenshot evidence として扱う | PNG の存在だけで PASS にせず、実寸・内容・本番 URL・撮影日時・scenario ID を確認する。placeholder は `NOT EXECUTED` evidence として明記し、実 screenshot 必須タスクでは blocker にする |
| **[UBM-011]** smoke docs が未実装 endpoint（例: `/health/db`）を前提にする | Phase 12 で API 実装と smoke endpoint を突合し、未実装なら実行前ブロッカーまたは未タスクへ昇格する。docs 側の期待 JSON と実装の response shape も同時に確認する |
| **[UBM-012]** 本番デプロイ実行で `wrangler` 直接呼び出し / `wrangler login` ローカル OAuth が混入する | 実行前ブロッカー。Phase 5 / Phase 12 で deploy 系コマンド (`wrangler deploy` / `wrangler d1 ...` 等) を検出したら必ず `scripts/cf.sh` ラッパーへ強制集約する。`~/Library/Preferences/.wrangler/config/default.toml` 由来の OAuth トークンは禁止し、`.env` の `op://` 参照と `op run --env-file=.env` 経由の `CLOUDFLARE_API_TOKEN` 注入に一本化する。CLAUDE.md「Cloudflare 系 CLI 実行ルール」と整合させること |
| **[UBM-013]** Next.js 16 / Turbopack の worktree root 誤検出により別 worktree の `packages/*` が型チェック対象になる | `apps/web` を含むタスクでは `next.config.ts` に `outputFileTracingRoot` と `turbopack.root` を明示する（worktree 直下の絶対パス）。明示しないと親リポや別 worktree の `packages/shared/src/zod/*` が collected され、関係のない型エラーで build が落ちる。緊急回避で `typescript.ignoreBuildErrors = true` を入れる場合は Phase 12 で別 tsc gate（`pnpm typecheck` 単体）を必ずペアリングし、同 PR 内で解除予定を changelog に明記する |
| **[UBM-014]** API/NON_VISUAL タスクで外部依存の環境別挙動が混同される | Phase 9/12 では provider key 未設定時の development/test と production の挙動を分けて書く。例: mailer は dev/test no-op success、production 502 `MAIL_FAILED`。無料枠表だけでなく fail-open / fail-closed も記録する |
| **[UBM-015]** `apps/web` proxy 実装でコメントや docs が D1/API 境界を曖昧にする | `apps/web` では D1 直参照を禁止し、コメントも「API worker」「upstream auth API」など境界語を使う。`apps/api` 直書き文字列を lint-boundary が拾う場合は、Phase 5 runbook に許容/禁止パターンを明示する |
| **[UBM-016]** shared 型追加で barrel export の実体が docs より薄い/濃い | Phase 5 着手前に `rg "export .*types" packages/shared/src` を実行し、root export / subpath export / alias-only のどれかを決める。Phase 12 では「shared schema」なのか「補助 alias」なのかを正本仕様に明記する |
| **[UBM-017]** legacy umbrella close-out が浅い PASS で閉じる | direct 残責務 0 件、stale/current/historical 分類、責務移管表、旧 filename/register、逆リンクの扱いを Phase 12 evidence に明記する。逆リンクや stale 掃除を同 wave で閉じない場合は、`docs/30-workflows/unassigned-task/` に full template で formalize する。SubAgent の自己申告だけで PASS にせず、`git diff --stat`、7 ファイル実体、`audit-unassigned-tasks --target-file`、index 再生成、mirror parity の実測値で確認する |
| **[UBM-018]** `taskType=implementation × workflow_state=spec_created × docsOnly=true` の三併存ケースを完了扱い / completed 昇格してしまう | spec PR 段階の implementation 系タスク（D1 schema 設計 / API endpoint 設計 / shared 型契約設計 等）は実 DDL・実コードを混入させず docs のみで merge する。下記「三併存ケース集」の判定フローと NG/OK パターンに従い、workflow root は `spec_created` を据え置く。実装 PR で別途 `implemented` へ昇格させる 2 段階運用を Phase 1 / Phase 12 双方で確認する |
| **[UBM-019]** generated index / fragment LOGS を N/A と誤判定する | `topic-map.md` / `keywords.json` は手編集不要でも generator 実行証跡が必要。`LOGS.md` がなく `LOGS/` fragment 運用の場合は、記録先 fragment または workflow-local changelog を `system-spec-update-summary.md` に明記する |
| **[UBM-020]** Part 1 初学者説明に英語の技術語が残る | `sync layer`, `NON_VISUAL evidence`, `Cloudflare` などを使う場合は同じ文で日常語を補う。Phase 12 の最後に Part 1 本文だけを `rg -n "sync|evidence|Cloudflare|API|D1|Cron"` で確認する |
| **[UBM-021]** Phase 12 の `unassigned-task-detection.md` に `new unassigned task` と書いたまま実ファイルを作らない | `new unassigned task` は候補メモではなく formalize 宣言として扱う。同一 wave で `docs/30-workflows/unassigned-task/*.md` を作成し、`system-spec-update-summary.md` / `documentation-changelog.md` / compliance check に path を反映する。作らない場合は `baseline` / `duplicate` / `not needed` に分類し直す |
| **[UBM-022]** docs-only / NON_VISUAL infrastructure verification の Phase 11 completed を production 実測 PASS と誤読する | `implementation-guide.md` と compliance check に、Phase 11 completed は evidence template / runbook check の完了であり、Cloudflare route mutation、secret value verification、Logpush mutation、DNS cutover、Worker deletion を意味しないと明記する |
| **[UBM-023]** docs-only / spec_created でも起票元 unassigned の AC close-out / 後継 workflow path を同 wave で更新しないと再発する | Phase 12 で `docs/30-workflows/unassigned-task/<起票元>.md`（または `completed-tasks/<起票元>.md`）の AC 行と後継 workflow link を同 wave 更新する。`rg -n "<起票元タスクID>" docs/30-workflows` で参照網羅を確認し、quick-reference / resource-map / task-workflow-active / SKILL / LOGS と一括同期する。docs-only でも close-out 漏れは下流タスクの retry/offset canonical 不在を招くため必ず実施する（U-UT01-09 / 2026-04-30 由来） |
| **[UBM-024]** Phase 10 の `technical_go=true` を `user_approved=true` と混同して commit / push / PR を進める | `artifacts.json` / `outputs/phase-10/go-nogo.md` に `technical_go` と `user_approved` を明示的に分離して併記する。`technical_go=true` のみではユーザー承認取得まで commit / push / PR を一切実行しない。Phase 11/12 文書 close-out の進行と承認ゲートは独立フラグで管理する（U-UT01-09 docs-only-closeout-hardening 由来） |

## 三併存ケース集（spec PR 段階の implementation 系タスク）

> 由来: UT-04 D1 データスキーマ設計 skill-feedback-report に基づく追加（2026-04-29）

### 判定フロー（テキスト）

```
Q1. taskType は implementation か？
  └─ Yes
      Q2. 実コード/DDL/migration を本 PR に混入するか？
        ├─ Yes → workflow_state=in_progress または completed、docsOnly=false（通常運用）
        └─ No  → docsOnly=true → workflow_state=spec_created（三併存ケース）
                  → 実装 PR で別途 implemented / completed へ昇格
```

### 典型例

| 例 | 三併存になる理由 |
| --- | --- |
| D1 schema 設計 PR（UT-04） | 既存 migration から current schema を抽出して仕様化する。実 DDL は実装 PR で `apps/api/migrations/` に投入 |
| API endpoint 設計 PR | OpenAPI / handler 契約を仕様化。実 handler / route は実装 PR で apps/api 配下に追加 |
| shared 型契約設計 PR | Zod schema / TypeScript 型の正本契約を仕様化。実 generator / barrel export は実装 PR |

### NG パターン

- workflow root を `completed` にして merge → 実装 PR と二重 close されて ledger 整合が崩れる
- `docsOnly=false` のまま merge → CI 側の implementation gate が誤発火する
- Step 2 を「実装が無いから N/A」と書き、根拠（既存正本参照 / 派生作業の別タスク化）を記載しない

### OK パターン

- `metadata.workflow_state=spec_created` / `metadata.docsOnly=true` を artifacts.json と outputs/artifacts.json で 2 重に明示
- documentation-changelog.md の Block A で `apps/api/migrations/` 等の実コードパス非混入を drift チェックに含める
- Step 2 N/A 判定例（`phase-12-spec.md` テンプレ参照）に従い、根拠 3 項目（スコープ / 既存正本 / 派生タスク）を必ず記載
- 実装 PR は別 wave で切り、本 spec PR が merge 後に `implemented` 昇格 PR を作成する

### Phase 12 close-out チェック

- [ ] `git diff --stat` で `apps/api/migrations/`, `apps/api/src/`, `packages/shared/src/`, `apps/web/src/` 等の実コード変更が 0 件
- [ ] `artifacts.json` / `outputs/artifacts.json` の `metadata.workflow_state` が `spec_created` で一致
- [ ] `metadata.docsOnly: true` が両 ledger に存在
- [ ] documentation-changelog.md に「`apps/api/migrations/*.sql` は本 PR に **非混入**」等の drift チェック節がある
- [ ] system-spec-update-summary.md の Step 1-B が `spec_created` 据え置き旨を明記し、`completed` への昇格を実装 PR に委譲している

> 旧フィードバック（W0-RV-001・SC-13-1/2・UBM-001〜008・FB-SDK-07-2/4）は [../SKILL-changelog.md](../SKILL-changelog.md) に移動済み。


## Phase 12 苦戦防止Tips

> UT-STORE-HOOKS-COMPONENT-MIGRATION-001の経験に基づく（2026-02-12）

| Tips                                                     | 説明                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **事前に空欄チェックリストを作成**                       | documentation-changelog.mdにStep 1-A〜1-D + Step 2の各欄を空欄で事前作成し、逐次消化する                                                                                                                                                                             |
| **spec-update-workflow.mdを常に参照**                    | Phase 12開始時に必ず [spec-update-workflow.md](spec-update-workflow.md) を開き、チェックリストを確認                                                                                                                                                      |
| **「全Step確認前に完了と記載しない」厳守**               | P4パターン。全Stepの結果を個別に記録してから「Phase 12完了」とする                                                                                                                                                                                                   |
| **LOGS.md/SKILL.md は4ファイル更新**                     | aiworkflow-requirements/LOGS.md, task-specification-creator/LOGS.md, aiworkflow-requirements/SKILL.md, task-specification-creator/SKILL.md                                                                                                                           |
| **topic-map.md再生成はセクション変更時も**               | 新規追加だけでなく、セクション更新・削除時も `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` と `node .claude/skills/task-specification-creator/scripts/generate-index.js --workflow docs/30-workflows/{{FEATURE_NAME}} --regenerate` を実行 |
| **worktree環境でも `.claude` 正本を実更新する**          | worktree を理由に LOGS.md / SKILL.md / backlog / workflow の更新を先送りしない。`.agents/skills/` は `rsync` / `diff` で mirror parity を確認する                                                                                                                    |
| **並列エージェント完了後はファイルシステムで検証**       | P43/P59対策。エージェントがコンテキスト制限で応答不能になった場合、`git diff --stat` + `ls outputs/phase-*/` + `artifacts.json` のPhaseステータスで成果物の存在を確認する                                                                                            |
| **NON_VISUAL判定時は `screenshots/.gitkeep` を削除する** | `screenshots/` ディレクトリが空（PNG 0件）のまま残るとvalidator errorになる。NON_VISUAL判定で実スクリーンショットが不要な場合は `screenshots/.gitkeep` を削除してディレクトリごと除外する                                                                            |
| **worktree作成後は `pnpm install` を確認する**           | `esbuild` host/binary version drift により Vitest 起動前に停止することがある。worktree作成後は必ず `pnpm install` を実行してバイナリの整合を確保する                                                                                                                 |
