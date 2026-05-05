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

## Env-name contract alignment evidence（Auth / Mail / Magic Link）

05b-A auth mail env contract alignment（2026-05-01）の close-out feedback を反映。実装は既に `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` を使っているが、manual specs や provisioning runbook に provider 固有名が残る場合は、docs-only / NON_VISUAL の env-name contract task として扱う。

### 適用条件

- task type: `docs-only`
- visual evidence: `NON_VISUAL`
- 目的: env / secret / variable の canonical name を揃える
- 実 secret value、provider response、staging / production smoke は本タスクで記録しない

### evidence file 命名規則（`outputs/phase-11/`）

| ファイル | 役割 | PASS 条件 |
| --- | --- | --- |
| `env-name-grep.md` | stale name と canonical name の grep 結果 | 検索対象、expected canonical set、stale match の扱いを記録する |
| `secret-list-check.md` | Cloudflare Secret / Variable の name-only 確認 | 値を記録せず、必要 name の存在/未実行境界を分ける |
| `magic-link-smoke-readiness.md` | 下流 smoke の readiness 判定 | 実送信を実施せず、09a/09c 等の実行タスクへ委譲先を明記する |

`outputs/phase-11/main.md` から上記 3 ファイルへリンクし、Phase 12 の `phase12-task-spec-compliance-check.md` で実体確認する。template text にファイル名を書いただけでは PASS にしない。

### 境界

- `secret-list-check.md` は name-only evidence であり、secret value の一致や rotation 完了を保証しない
- `magic-link-smoke-readiness.md` は readiness であり、`POST /auth/magic-link` の実送信 PASS ではない
- stale provider name を歴史説明として残す場合は、新規 provisioning 禁止を明記する
- runtime provisioning / smoke / production readiness は `unassigned-task-detection.md` または既存 downstream workflow に routing する

### 必須チェック（env-name contract 系）

- [ ] canonical env set と stale env set を表で固定した
- [ ] stale env name の残存が historical / current / follow-up のどれか分類済み
- [ ] Secret と Variable の配置層を分けた
- [ ] secret value / token / provider dashboard response を evidence に転記していない
- [ ] `env-name-grep.md` / `secret-list-check.md` / `magic-link-smoke-readiness.md` の 3 ファイル実体を確認した

## Production migration runbook evidence（approval-gated / no production apply）

UT-07B-FU-03 production migration apply runbook（2026-05-02）の close-out feedback を反映。production D1 へ migration を適用するための runbook を formalize するが、実 apply は Phase 13 merge 後のユーザー承認付き別運用に残す task では、Phase 11 を **DOC_PASS** として閉じ、runtime PASS と混同しない。

### 適用条件

- task type: `docs-only` または `requirements / operations / runbook`
- visual evidence: `NON_VISUAL`
- 対象: D1 production migration / Cloudflare production operation / approval-gated operational runbook
- 実 production mutation は本タスクで実行しない

### evidence file 命名規則（`outputs/phase-11/`）

| ファイル | 役割 | PASS 条件 |
| --- | --- | --- |
| `structure-verification.md` | runbook root / phase files / artifacts parity の構造確認 | root `artifacts.json` と `outputs/artifacts.json` が同じ workflow state / Phase status を示す |
| `grep-verification.md` | runbook 内の対象 migration / DB / command / approval wording の文字列確認 | target migration、target DB、approval gate、禁止事項が grep で再発見できる |
| `staging-dry-run.md` | staging dry-run または operator gate の扱い | 実行済み / 未実行 / operator gate open を明示し、production apply PASS と書かない |
| `redaction-check.md` | secret / token / account id / raw production result の転記防止 | 値を記録せず、shape / path / command name だけを残す |

`outputs/phase-11/main.md` から上記 4 ファイルへリンクし、`outputs/phase-12/system-spec-update-summary.md` と `phase12-task-spec-compliance-check.md` で実体確認する。

### 境界

- `DOC_PASS` は「runbook と evidence 形式がそろった」状態であり、migration applied / production state changed / runtime smoke PASS ではない
- production apply execution は Phase 13 merge 後、ユーザー承認、fresh runtime evidence、対象 Issue / workflow を別に持つ
- `spec_created` runbook formalization は root workflow state を `completed` に昇格しない。Phase 1-12 artifact status は completed にできるが、Phase 13 は `blocked_until_user_approval` を維持する
- production state の正本仕様（D1 applied migration facts など）は fresh apply evidence がある task だけが更新する

### 必須チェック（production migration runbook 系）

- [ ] `structure-verification.md` / `grep-verification.md` / `staging-dry-run.md` / `redaction-check.md` の 4 ファイル実体を確認した
- [ ] `DOC_PASS` と runtime PASS の語彙を分離した
- [ ] production apply 未実行を `implementation-guide.md` と `system-spec-update-summary.md` に明記した
- [ ] Phase 13 が user approval gate のまま残っている
- [ ] secret value / token / account id / raw production output を evidence に転記していない

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

## D1 schema parity verification evidence（staging vs production）

> 起源: 09a-A staging deploy smoke execution 仕様書策定（2026-05-05）。production migration runbook
> evidence template に対し、「staging 適用後 / production 適用前」または「両適用後」での schema
> parity を機械検証する evidence セクションを追加する。

### 適用条件

- `taskType=implementation` または `runbook` で D1 migration apply を含む
- staging / production それぞれの D1 binding が利用可能（`bash scripts/cf.sh d1` 経由）
- target migration の applied / pending 状態を Phase 11 evidence として固定したい

### 目的

- staging と production の D1 schema が table / index / column 単位で一致していることの evidence 取得
- migration applied / pending count を Phase 11 で snapshot し、Phase 13 apply gate（G3）の前後で比較可能にする
- 差分検出時は production 側 follow-up を `unassigned-task` に自動発行することで silent drift を防ぐ

### evidence file 命名規則（`outputs/phase-11/`）

| ファイル | 役割 | 最小フォーマット |
| --- | --- | --- |
| `d1-migrations-list-staging.log` | staging D1 の applied / pending migration 一覧 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` の生出力（secret は redact） |
| `d1-migrations-list-production.log` | production D1 の applied / pending migration 一覧 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` の生出力 |
| `d1-schema-parity.md` | table / index / `PRAGMA table_info` の比較結果 | 比較対象 table 一覧、`diff` 結果、差分 0 件 or 差分内容 |
| `d1-applied-pending-count.md` | applied / pending 数値の記録 | staging applied=X / pending=Y、production applied=X' / pending=Y'、期待される delta |

### コマンド例

```bash
# 1. staging / production の applied migration list 取得
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \
  > outputs/phase-11/d1-migrations-list-staging.log
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production \
  > outputs/phase-11/d1-migrations-list-production.log

# 2. 各環境の table list を取得して比較
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" \
  > /tmp/staging-tables.txt
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" \
  > /tmp/production-tables.txt
diff -u /tmp/staging-tables.txt /tmp/production-tables.txt

# 3. 個別 table の column / type / NOT NULL / default を比較
for tbl in members responses admin_member_notes; do
  bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
    --command "PRAGMA table_info('${tbl}');" > /tmp/staging-${tbl}.txt
  bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
    --command "PRAGMA table_info('${tbl}');" > /tmp/production-${tbl}.txt
  diff -u /tmp/staging-${tbl}.txt /tmp/production-${tbl}.txt
done
```

> **値の転記禁止**: `PRAGMA table_info` 出力は schema shape のみ。`SELECT` で row data を取得して
> evidence に転記しないこと（PII / secret 流出防止）。

### applied / pending 数値の記録方法

`d1-applied-pending-count.md` に以下表形式で固定する:

```markdown
| 環境 | applied 数 | pending 数 | 最新適用 migration | 取得日時 |
| --- | --- | --- | --- | --- |
| staging | 14 | 0 | `0014_admin_notes_audit.sql` | 2026-05-05T10:24:49+09:00 |
| production | 13 | 1 | `0013_responses_index.sql` | 2026-05-05T10:24:49+09:00 |

期待される delta: production に `0014_admin_notes_audit.sql` を適用する必要あり（G3 apply gate 経由）。
```

### 差分検出時の対応（unassigned-task 自動発行）

| 検出パターン | 対応 |
| --- | --- |
| staging applied > production applied（pending migration 残） | `unassigned-task/task-d1-prod-parity-followup-001.md` を発行し、対象 migration ID / 想定 G3 ゲート / rollback 手順を記載 |
| staging と production の table / index 集合が一致しない | `d1-schema-parity.md` に差分明細を残し、差分発生原因（手動 ALTER / failed migration 等）を調査タスクとして発行 |
| `PRAGMA table_info` 結果の column 順序 / type 不一致 | column 単位の差分を unassigned-task に formalize し、production 側補正 migration を起票 |
| applied 数が同じだが latest migration ID が異なる | migration history 整合性監査タスクを発行（schema_migrations テーブル直接比較） |

### 完了条件（Phase 11 close-out）

- [ ] `d1-migrations-list-staging.log` / `d1-migrations-list-production.log` の 2 ファイルが `outputs/phase-11/` 直下に存在する
- [ ] `d1-schema-parity.md` で diff 結果（0 件 or 差分明細）が記録済
- [ ] `d1-applied-pending-count.md` に applied / pending 数値が staging / production の両方記録済
- [ ] 差分 0 件 **または** production 側 migration TODO が `unassigned-task/` に登録済（任意 ID 命名規則: `task-d1-prod-parity-followup-NNN.md`）
- [ ] secret value / row data / PII を evidence に転記していない（shape のみ）
- [ ] Phase 13 G3（D1 migration apply gate）への参照が `outputs/phase-11/main.md` に明記されている

### 境界

- 本 evidence は **schema parity の snapshot** であり、production への migration apply 完了 PASS ではない
- 実 production apply は Phase 13 G3 gate の user 承認後に実行し、apply 後 fresh GET を別 evidence
  （`outputs/phase-13/d1-applied-fresh-{env}.log`）として記録する
- staging が applied / production が pending の状態は正常な intermediate state であり、
  `d1-schema-parity.md` の `applied=mismatch_expected` セクションで明示する

## 関連

- `phase-11-guide.md`（base ガイド）
- `phase-12-documentation-guide.md`（implementation-guide.md 構成）
- 02c 実例: `docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/outputs/phase-11/`
- Cloudflare preflight 実例: `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-11/`
- Cloudflare CLI ラッパー: `scripts/cf.sh`（`CLAUDE.md` §Cloudflare 系 CLI 実行ルール）
- D1 parity 適用元: `docs/30-workflows/09a-A-staging-deploy-smoke-execution-task-spec/`
