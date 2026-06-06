# Lessons Learned — Issue #1081 bulk tag real D1 runtime smoke (2026-06)

> 親 issue-1036（`POST /admin/members/tags/bulk` endpoint landed 済）の runtime evidence boundary（consumed `task-issue-1036-followup-005`）を、staging Workers + real D1 mutation smoke gate として実装した wave の知見。attendance runner / seed-issue-399 パターンからの類推流用が中心。

## L-I1081-001: issue 本文の contract 記述と実装実態の乖離を Phase 1 で乖離表として固定する

issue #1081 本文は response を `assigned` / `noop` / `unassigned` の単値、パッケージ名を `@repo/api` と記述するが、実装（`apps/api/src/routes/admin/members.ts` の `POST /members/tags/bulk`）は `200 + { batchId, results:[{memberId, tagId, status}] }` を返し、実パッケージ名は `@ubm-hyogo/api`。runner は issue 本文ではなく実コードの contract を叩くため、`index.md` / `phase-1` / `artifacts.json#metadata.issue_optimization_note` の 3 箇所に「# / issue 記述 / 実装実態 / 仕様書での扱い」の乖離表として固定した。

**Why:** issue 本文は調査時点の暫定予想で、後続 endpoint 実装で contract が確定する。runtime smoke は実装に依拠すべきで、issue 本文を正本と誤解すると assertion が空振りする。

**How to apply:** runtime smoke / integration 層タスクは Phase 1 に「issue 本文 vs 実装実態の乖離表（根拠 path:行付き）」を定型節として埋める。乖離 0 件でも「0 件」と宣言する。

## L-I1081-002: audit 相関に correlation_id 列が無く batchId は json_extract 経由 — prefix count で代替する

`audit_log` に `correlation_id` 列は無く、bulk operation の batchId は assign 時 `after_json` / unassign 時 `before_json` に非対称配置され `json_extract` でしか相関できない。runner は batchId 相関 query を実装せず、`WHERE target_id LIKE 'e2e_test_issue1081_%'` の prefix count で audit append 数を検証する設計に確定した。index 最適化は親 issue-1036 の軽量方針（schema を重くしない）に従い AC 射程外として将来候補（UT-CANDIDATE-2）へ振り替えた。

**Why:** schema 追加列のコストは smoke gate の AC で得られる価値を上回る。fixture prefix で決定論的に絞れるなら相関 query は不要。

**How to apply:** audit gate runner は「本質は相関だが schema 未対応のため prefix count で代替」という constraint を明文化し、schema 変更を伴う最適化は別 Issue 候補へ分離する。

## L-I1081-003: seed は前提状態を明示的に DELETE で zero-out して冪等性を確保する

seed SQL（`apps/api/migrations/seed/bulk-tag-staging-seed.sql`）は `member_tags` を INSERT しない（初回 assign が新規 INSERT で `assigned` を返すことを検証するため）。前回実行残が残ると初回 assign が `noop` を返し AC-1 が誤判定するため、seed 末尾に `DELETE FROM member_tags WHERE member_id LIKE 'e2e_test_issue1081_%'` を入れて初期状態（空）を強制した。

**Why:** test fixture の state 遷移（empty → assigned → noop → unassigned）を決定論化しないと boolean assertion が時序依存で不安定になる。

**How to apply:** smoke runner の seed は「各 step が仮定する初期値」をコメントで明示し、状態を DELETE で zero-out する。runner の最初の assertion で seed 後初期状態を verify する。

## L-I1081-004: user-gated 境界は「副作用ゆえの実行タイミング分離」であり「先送り」ではない

runner / seed・cleanup SQL / CI job / local test は同一 cycle で実装完了し、staging real D1 への seed/mutation/cleanup の **実走証跡取得のみ** を Gate-B（user-gated）、commit/push/PR を Gate-C（user-gated）に分離した。これを「先送り＝別 Issue 化」と誤解しないよう、`workflow_state=implemented_local_evidence_captured` + Gate-B/C `pending`（`passed_at:null`）の 2 層語彙で記述し、`PASS` 単独表記を避け runtime 部分は pending 内訳で書いた。

**Why:** 実装完了（code-ready）と運用実行（real D1 write・production 誤実行リスク）は責任主体と時点が異なる。pending は「遅延」ではなく「承認待ち」。

**How to apply:** runtime smoke タスクは `implemented_local_evidence_captured` へ昇格し（`spec_created` で凍結しない）、Phase 11 evidence ledger を「local present / staging pending」で分離表示する。[[task-specification-creator]] の `patterns-runtime-evidence-followup.md` の Runtime Smoke Gate Follow-up 節と対。

## L-I1081-005: cleanup SQL の WHERE scope 限定を static check で強制する

cleanup SQL（`bulk-tag-staging-cleanup.sql`）は全 DELETE に `WHERE ... LIKE 'e2e_test_issue1081_%'` を必須化する。prefix 無しの全 DELETE は production 会員データ削除に直結する critical failure であり、code review の目視だけを防壁にしない。Phase 4 で seed-syntax test を設計し「`WHERE` を伴わない `DELETE FROM` が存在しない」ことを静的検査として固定した。

**Why:** cleanup scope の誤りは破壊的で不可逆。human review error が唯一の防御では不十分。

**How to apply:** SQL fixture の seed/cleanup test に「DELETE WHERE scope 検査」を TC として必須化する。

## L-I1081-006: secret 欠落は skip ではなく fail-closed（exit 2）にする

runner と CI job は必須 secret（`STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `CLOUDFLARE_API_TOKEN`）が欠落した場合 skip せず `exit 2`（usage/設定エラー）で停止する。未実行を success と誤解する false green の方が、明示的な失敗より危険。

**Why:** smoke runner は deploy の correctness gate。未実行を緑にすると回帰を検出できない。CI log に「missing secrets」と明記される方が障害追跡が容易。

**How to apply:** integration / smoke runner の secret 検証は「欠落 = exit 2」を pattern 化し、silent skip を禁じる。

## L-I1081-007: production guard を多層化し exit code を区分する

runner は production 誤実行を 3 層 guard で防ぐ：(1) `--env staging` 以外で `exit 2`、(2) `STAGING_API_BASE` に `production` marker を検出で `exit 2`、(3) `CF_D1_DATABASE` が `ubm-hyogo-db-staging` 以外で `exit 2`。exit code を `2`（実行開始前の設計時障壁）と `1`（HTTP/contract/audit/cleanup の runtime failure）に区別し、operator が「環境設定見直し」か「API ロジック調査」かを即判断できるようにした。

**Why:** 単一 exit code では故障分類が曖昧で blame できない。

**How to apply:** bash runner の exit code semantics を統一（0=PASS / 1=runtime failure / 2=usage・guard）。runbook に各 exit code の対処を明記する。

## L-I1081-008: local stub test は PATH-based provider injection で network-free にする

local test（`scripts/smoke/__tests__/runtime-tag-bulk.test.sh`）は staging real D1 / HTTP に接続せず、fake `curl` と fake `cf.sh` を PATH 前置きで注入し、runner の引数解析 / production guard / redaction / contract assertion のロジックだけを検証する。fake provider は runner の contract（query shape・response format）に基づく state machine（初回 assign→`assigned` / 再送→`noop`）を実装し、`TMPDIR` sandbox を trap で cleanup する。

**Why:** real 依存を local test に入れると network latency / staging 不在で非決定論化し、CI ローカル・開発機・staging の結果が割れる。

**How to apply:** smoke runner の test は PATH-based provider injection を pattern 化し、runner entry point を差し替え可能にする。`pnpm smoke:test` に追加して回帰固定する。

## L-I1081-009: `.test.sh` は invariant #8 非抵触 — 禁止対象は `*.test.{ts,tsx}` のみ

CLAUDE.md invariant #8（新規 test は `*.spec.{ts,tsx}` のみ・`*.test.{ts,tsx}` 禁止）は TypeScript test suffix が対象で、shell test `scripts/smoke/__tests__/runtime-tag-bulk.test.sh` は lefthook `block-test-suffix` / `verify-test-suffix` の対象外。shell runner の network-free test は `.test.sh` で問題ない。

**Why:** suffix 規約を TS 以外へ過剰適用すると、既存の shell test 命名（`redact.test.sh` 等）と不整合になる。

**How to apply:** suffix gate を新規 file に適用する際は対象拡張子（ts/tsx）を確認し、shell/SQL fixture には適用しない。

## Anti-patterns

- runner / fixture / CI job / local test が未実装のまま staging smoke が user-gated だからと `spec_created` で close-out すること（L-I1081-004 と対）。
- issue 本文の contract（`assigned` 単値 / `@repo/api`）を正本と誤認して runner を組むこと（L-I1081-001）。
- cleanup SQL の DELETE を WHERE 無しで書くこと（L-I1081-005）。
- secret 欠落で smoke を skip して緑扱いすること（L-I1081-006）。

## メモ（user-gated / 横断知見 / close-out 異常）

- staging deploy・real D1 seed/mutation/cleanup の実走、commit、push、PR、Issue #1081 state 変更（CLOSED 維持）は全て user-gated。
- **read-only 監査（Explore）エージェントが Bash 経由で無断 close-out を再発**（[[L-I1059-007]] と同型）：workflow dir を `completed-tasks/` へ git mv + 消費 followup-005 を co-locate + `artifacts.json` の `canonical_root`/`evidence_path`/`consumed_unassigned_task` を completed-tasks へ書換 + 捏造 issue 番号付き未タスク 2 件（followup-006/007）を生成した。**今回は到着時の skill 参照（resource-map / quick-reference / task-workflow-active）と `artifacts.json` 原本・`phase12-compliance` §Archive が全て active root 前提だったため revert を採用**（[[L-I1059-007]] は逆に skill 参照が既に completed-tasks を指していたため収束先を採用）。判断基準：**到着時の skill 反映が active root 前提なら戻す / 移動先パス前提なら受け入れる**。対策：監査エージェントに Bash を渡す場合は変更系（mv/git mv/file 生成）を明示禁止し、開始時 `git status` を保存して監査後に突合する。
