# Phase 11 — NON_VISUAL タスクの代替 evidence プレイブック

> **NOTE**: 本ガイドは docs-only / 実地操作不可なタスク向け。実環境（staging / 本番 / CI gate）での実走が必須な項目は本タスクで「保証できない範囲」として明示し、Phase 12 `unassigned-task-detection.md` 経由で実装 PR や運用フェーズへ申し送ること。
>
> 起源: 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary（2026-04-27）
> Feedback: skill-feedback-report.md #5 / #6
> 関連: aiworkflow-requirements `lessons-learned-02c-data-access-boundary.md` §L-02C-002 / §L-02C-003
> 適用実例: skill-ledger-a1-gitignore（2026-04-28、git 管理境界 / infrastructure governance シナリオ）

## 適用条件

以下を **同時に満たす** タスクで本ガイドを使う。

1. UI 差分なし（API repository / route / library / config / boundary tooling など）
2. staging 環境が未配備、または実フロー前提のシナリオが現環境で実行不能
3. phase-11.md の S-1 〜 S-N が wrangler / dep-cruiser バイナリ / 実フォーム / 実 D1 を要求している

## 代替 evidence の 4 階層

| 階層 | 代替手段 | 何を保証するか | 何を保証できないか（→ 申し送り先） |
| --- | --- | --- | --- |
| L1: 型 | `pnpm typecheck` | API signature / branded ID / 型レベル制約 | runtime 振る舞い |
| L2: lint / boundary | 自前 `lint-boundaries.mjs` / dep-cruiser config（バイナリ未導入なら設定だけ）/ ESLint boundaries plugin | import グラフの禁止辺 | 実行時 import / dynamic import |
| L3: in-memory test | miniflare D1 + vitest（`__tests__/_setup.ts`）+ fixture loader | repository 契約 / SQL / 不変条件 / ロールバック挙動 | network / Workers binding / 並列性 |
| L4: 意図的 violation snippet | わざと禁止 import を 1 ファイル足し、L2 が **error を返す** ことを確認 | 「赤がちゃんと赤になる」 | （これ自体は green 保証ではない） |

## 必須テンプレ: 「代替 evidence 差分表」

phase-11/main.md に以下を必ず含める。

```markdown
## 代替 evidence 差分表

| Phase 11 シナリオ | 元前提 | 代替手段 | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 | wrangler dev で D1 接続 | miniflare D1 + `__tests__/_setup.ts` | repository 契約・SQL | 09a staging smoke |
| S-2 | 実 admin user で auth flow | adminUsers fixture + `isActiveAdmin` unit test | gate 関数の真偽 | 05a 統合 |
| S-5 | dep-cruiser バイナリで violation 検出 | `.dependency-cruiser.cjs` 設定 + 自前 lint script | 静的禁止辺 | 09a CI gate |
| S-6 | 意図的 violation で red 確認 | 同上 + 一時 import を git stash 確認 | 「赤がちゃんと赤になる」 | （L2 で吸収済） |
| ...   | ...     | ...       | ...        | ... |
```

## 必須チェック

- [ ] 代替 evidence で **何を保証し**、**何を保証できないか** を上表で明示した
- [ ] 保証できない項目はすべて `unassigned-task-detection.md` に申し送り済
- [ ] L4（意図的 violation → red 確認）を 1 件以上実施した
- [ ] phase-11/manual-evidence.md に「NON_VISUAL のため screenshot 不要」を明記した
- [ ] phase-12/implementation-guide.md の §「やってはいけないこと」に boundary tooling 違反例を含めた

## やってはいけないこと

- 「staging 未配備のため Phase 11 をスキップ」と書いて済ませる
- 代替 evidence で **runtime 振る舞いまでカバーした** と主張する（型 / 静的解析の限界を超える主張は不可）
- L4（intentional violation）を省略する → boundary tooling が 0 件しか検出しなくても気付けない

## docs-only / governance 系タスクのテンプレ（manual-smoke-log.md / link-checklist.md）

UI 差分なし & コード変更なし（governance / branch protection / OIDC dry-run など）の場合、Phase 11 outputs は最小 3 点で構成する。

| ファイル | 役割 | 必須項目 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | NON_VISUAL 宣言 / 代替 evidence 差分表 / 申し送り先 | `visualEvidence: NON_VISUAL`、L1〜L4 結果サマリ、保証できない範囲 |
| `outputs/phase-11/manual-smoke-log.md` | 整合性検査ログ（`pnpm typecheck` / `pnpm lint` / `actionlint` / `verify-all-specs.js` 等の手元実行ログ） | 実行コマンド・終了コード・所要時間・実行者・実行日時 |
| `outputs/phase-11/link-checklist.md` | 仕様書内リンク・参照ドキュメントの dead link チェック | 対象リンク一覧 / 200 確認 / 補正したリンクの差分 |

`link-checklist.md` は補助成果物であり、最小 3 点の欠落判定には含めない。ただし governance task で関連 task / Issue / applied evidence path を多く参照する場合は作成を推奨する。

### Approval-gated implementation の JSON evidence

Phase 13 のユーザー承認後に不可逆 API を実行する NON_VISUAL implementation では、Phase 11/12 の JSON と Phase 13 の実測 JSON を分離する。

| evidence | Phase 12 まで | Phase 13 承認後 |
| --- | --- | --- |
| `branch-protection-payload-*.json` などの PUT payload | 完全 payload template / reserved path | 適用前 GET から再生成した実行 payload |
| `current-*.json` / `applied-*.json` | placeholder として扱う。成功証跡にしない | fresh GET output として AC evidence にできる |
| `drift-check.md` | 検査観点と未実行境界 | actual GET と仕様の比較結果 |
| `manual-verification-log.md` | 承認待ち / 実行禁止の明示 | 実行コマンド、exit code、確認者、日時 |

### NON_VISUAL × docs-only に該当する典型タスク

- governance（branch protection / required status checks 変更）
- `pull_request_target` safety gate（OIDC / `workflow_run` 含む dry-run）
- audit log / runbook の追記のみ
- API-only route 追加（例: attendance add/remove の Vitest smoke で request/response/error/audit を固定し、visual は 08b/09a へ委譲）
- skill / spec の再構築（`spec_created` で CLOSED Issue を reopen しないケース）

これらは Phase 11 で UI screenshot を出さない代わりに、上記 3 点で「整合性検査が走り、リンクが生きており、保証外を `unassigned-task-detection.md` に申し送った」ことを記録する。

適用実例: UT-GOV-002 pr-target-safety-gate-dry-run（2026-04-29）。

## Cloudflare Workers production preflight evidence template（docs-only infrastructure verification）

UT-06-FU-A production route / secret / observability preflight（2026-04-30）の close-out feedback を反映。`apps/web` / `apps/api` を OpenNext Workers へ移行する際の **production runbook 検証**は、UI 差分なし・コード差分最小・実 production 環境への mutation 不可という条件で行うため、本テンプレートを Phase 11 evidence の最小構成として固定する。

### 適用条件

- task type: `docs-only` または `infrastructure-verification`
- target: Cloudflare Workers production environment（`apps/web/wrangler.toml` / `apps/api/wrangler.toml` の `--env production`）
- 実環境への mutation（route 切替 / secret put / legacy worker delete）は**本タスク範囲外**として `unassigned-task-detection.md` に申し送る
- Phase 11 では「runbook 形式の preflight 手順 + format snapshot」を整え、実走 PASS は staging / production cutover タスクへ委譲する

### Evidence 型スケッチ（implementation-guide.md L31-43 から参照）

`outputs/phase-12/implementation-guide.md` の Evidence Contract セクションに以下相当を必ず記載し、Phase 11 evidence ファイル群はこの型を満たすフォーマットで記述する。

```ts
type VerificationResult = "PASS" | "FAIL" | "TBD_APPROVED_VERIFICATION";

interface WorkerPreflightEvidence {
  workerName: string; // 例: "ubm-hyogo-web-production"
  routeTarget: VerificationResult;            // 軸 1: route inventory / custom domain
  secretKeyParity: VerificationResult;        // 軸 2: secret keys parity（key 名のみ。値は出力禁止）
  observabilityTarget: VerificationResult;    // 軸 3: observability（tail / logpush / analytics）
  legacyWorkerDisposition: "retain" | "separate-approval-required"; // 軸 4: legacy worker 処分
}
```

### 4 軸 evidence

| 軸 | 何を保証するか | 何を保証できないか |
| --- | --- | --- |
| 1. route inventory | `wrangler.toml` の `routes` / `custom_domain` 宣言と現行 production の route 一覧の format snapshot 一致 | route 切替が実際に production traffic を flip する保証 |
| 2. secret keys parity | `secrets` の **key 名集合**（値は出力禁止）と production secret 一覧の parity | 値の一致 / rotation / TTL |
| 3. observability target | `tail` 出力 / logpush dataset / analytics binding が runbook 想定先に向くこと | 実トラフィック下での log 欠損ゼロ |
| 4. legacy worker disposition | 旧 Worker（例: GAS proxy / 旧 deploy unit）の `retain` / `separate-approval-required` 判定 | 実際の delete / rename 完了 |

### コマンドラッパー強制

- **必ず `bash scripts/cf.sh` 経由で実行**する。`wrangler` を直接呼ばない（OAuth トークンのローカル保持 / 1Password 経由 secret 注入 / esbuild バージョン整合 / `mise exec --` の Node 24 保証のため）
- 値の出力が伴うコマンド（`wrangler secret list` の値、`wrangler tail` の生 PII など）は evidence ファイルに**転記しない**。key 名・dataset 名・route pattern 等の **shape のみ**を記録する
- 例:

```bash
# 認証
bash scripts/cf.sh whoami

# route / secret / tail（key 名のみ抽出）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production --dry-run
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production | jq '[.[].name]'
bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production --format json
```

### evidence file 命名規則（`outputs/phase-11/`）

| ファイル | 役割 | 4 軸との対応 |
| --- | --- | --- |
| `outputs/phase-11/route-snapshot.md` | route / custom domain inventory format snapshot | 軸 1 |
| `outputs/phase-11/secret-keys-snapshot.md` | secret **key 名集合**の parity（値は記録禁止） | 軸 2 |
| `outputs/phase-11/tail-sample.md` | tail / logpush / analytics binding の出力 shape sample | 軸 3 |
| `outputs/phase-11/legacy-worker-disposition.md` | 旧 Worker の `retain` / `separate-approval-required` 判定 | 軸 4 |
| `outputs/phase-11/manual-verification-log.md` | コマンド実行ログ（コマンド・終了コード・所要時間・実行者・実行日時） | 全軸 |
| `outputs/phase-11/grep-integrity.md` | runbook と実 config の grep 整合（route / secret key / dataset 名の文字列照合） | 全軸 |
| `outputs/phase-11/runbook-walkthrough.md` | preflight runbook を文書上で 1 周通読した walkthrough 記録 | 全軸 |

7 ファイルすべてを `outputs/phase-11/` 直下に置き、`outputs/phase-11/main.md` から index リンクする。

### 「evidence template 完了 ≠ production 実測 PASS」の境界

本テンプレートで Phase 11 を completed にできるのは「**evidence template が揃い**、preflight runbook が文書上整合している」状態までである。以下は本タスクの保証外で、必ず `unassigned-task-detection.md` 経由で staging cutover / production cutover / legacy worker disposal タスクへ申し送る:

- production route の実切替・traffic flip
- secret 値の rotation / put / delete
- legacy worker の delete / rename / traffic drain
- 実トラフィック下での tail / logpush 欠損ゼロ確認
- `WorkerPreflightEvidence` 各軸の実 production 値での `PASS` 判定（template 完了時点では `TBD_APPROVED_VERIFICATION` を許容する）

`outputs/phase-12/implementation-guide.md` と `outputs/phase-12/system-spec-update-summary.md` の双方に「Phase 11 completed = evidence template 完了であり、production 実測 PASS ではない」と明記する。compliance-check では `WorkerPreflightEvidence` 4 軸が `PASS` で確定済みであるかを問わず、template 整合と申し送り先の存在で PASS を判定する。

### 必須チェック（Cloudflare preflight 系）

- [ ] `WorkerPreflightEvidence` 型を `implementation-guide.md` に転記した
- [ ] 4 軸（route / secret keys / observability / legacy disposition）の evidence file を `outputs/phase-11/` に配置した
- [ ] `bash scripts/cf.sh` ラッパー経由で実行し、`wrangler` 直接実行は 0 件である
- [ ] secret **値** / 生 PII / OAuth token / API token を evidence に転記していない（key 名・dataset 名・shape のみ）
- [ ] 「evidence template 完了 ≠ production 実測 PASS」の境界を `implementation-guide.md` と `system-spec-update-summary.md` の双方に明記した
- [ ] 保証外項目（実切替 / secret rotation / legacy delete）を `unassigned-task-detection.md` に申し送った

## 関連

- `phase-11-guide.md`（base ガイド）
- `phase-12-documentation-guide.md`（implementation-guide.md 構成）
- 02c 実例: `docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/outputs/phase-11/`
- Cloudflare preflight 実例: `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-11/`
- Cloudflare CLI ラッパー: `scripts/cf.sh`（`CLAUDE.md` §Cloudflare 系 CLI 実行ルール）
