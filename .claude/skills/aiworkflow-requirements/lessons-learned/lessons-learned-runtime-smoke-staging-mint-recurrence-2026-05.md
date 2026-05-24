---
name: Lessons Learned — runtime-smoke-staging 401 recurrence fix（bearer 鮮度ゲート / reason 細分化 / mint 自己検証）
description: 24h TTL 静的 bearer のサイレント失効による 401 再発を、smoke 前の鮮度ゲート・401 reason 二分・mint 署名後自己検証で構造的に排除した教訓集（実 secret/JWT は非記録、恒久化は user-gated）
type: project
---

# Lessons Learned — runtime-smoke-staging mint recurrence fix（2026-05-24）

> task id: `runtime-smoke-staging-mint-recurrence-fix`
> branch: `docs/runtime-smoke-staging-mint-recurrence-spec`
> wave: 2026-05-24 / implemented_local_evidence_captured / implementation / NON_VISUAL / runtime rerun user-gated
> canonical root: `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/`
> 関連 reference:
> - `reference/bearer-lifecycle-ssot.md`（bearer TTL / secret 同期不変条件 / reason ディシジョンツリーの唯一の正本）
> - `references/deployment-secrets-management.md`（auth freshness gate / mint secret invariant 同期先）
> - `references/task-workflow-active.md`（本 workflow 行）
> - `references/workflow-runtime-smoke-staging-mint-recurrence-fix-artifact-inventory.md`
> - `indexes/resource-map.md`（本 workflow 行）
> 関連 lessons-learned:
> - `lessons-learned-issue-531-runtime-smoke-attendance-provider-2026-05.md`（runtime smoke の route 契約 / 副作用 / evidence hygiene の前段教訓）
> - `lessons-learned-task-staging-auth-secret-binding-recovery-001-2026-05.md`（AUTH_SECRET binding 欠落 = 500 系の前段教訓）
> - `lessons-learned-runtime-smoke-staging-secrets-provisioning-2026-05.md`（secret provisioning runbook）

## サマリ

本 wave は `runtime-smoke-staging / smoke` の **24h TTL 静的 bearer がサイレント失効し、同じ 401 が周期的に再発する**構造を排除する改善サイクル。静的 fallback を即時撤去せず維持したまま（Option C）、(1) smoke 前の **bearer 鮮度ゲート**、(2) 401 の **reason 二分（expired / drift）**、(3) **mint 署名直後の自己検証 throw** を入れ、失効の事前検知・原因の一意特定・発行時の鍵不整合検出を成立させた。実 secret / JWT 値はコード・ログ・ドキュメントに一切残さない。mint path 恒久化（`STAGING_AUTH_SECRET` 投入）は user-gated。

## 教訓一覧

### L-RSMR-001: 同じ 401 でも復旧導線は真逆になる — `exp` で reason を二分する

- **背景**: `verifySessionJwt` は署名 mismatch でも `exp <= now` でも一様に `null` を返し、API は両方 401 `unauthorized` を返す。reason を一本化すると「bearer を再発行すべき（失効）」と「secret を再同期すべき（鍵不一致）」という**逆方向の復旧手順**が区別できず、誤対応で 401 がさらに長引く。
- **教訓**: 401 を `auth-token-expired`（`exp <= now`）と `auth-secret-drift`（`exp > now`）に二分する。判定は `bearer-freshness-gate.mts` の `explainAuthFailureFromBearer` が**署名検証なしで payload の `exp` のみ decode**して行う。decode 不能な token は `auth-secret-drift` の復旧導線へ寄せる。
- **適用条件**: HS256 session JWT を bearer に使う runtime smoke / probe 全般。
- **再利用方法**: reason 一覧と判定条件は `reference/bearer-lifecycle-ssot.md` §4 を正本 cite する。新 reason を増やす時は SSOT 表を先に更新してから shell の `case` を追加する。

### L-RSMR-002: 失効は「事後の body 分類」ではなく「事前の鮮度ゲート」で止める

- **背景**: 失敗 body の reason 分類だけでは、bearer が失効していても**実際に 401 を踏むまで気付けない**。24h TTL の静的 bearer は登録から 24 時間で必ず再失効するため、body 分類のみだと同じ 401 が周期的にサイレント再発する。
- **教訓**: smoke 実行**前**に、実際に使う bearer の `exp` を decode し、残り `< 21600 秒（6 時間）`（`FRESHNESS_THRESHOLD_SECONDS` で上書き可）または decode 不能なら workflow step を exit 非ゼロで **loud fail** させ smoke を実行しない。fail 時は SSOT §4 へ誘導する。
- **適用条件**: TTL を持つ静的 credential に依存するあらゆる定期 smoke。
- **再利用方法**: `classifyBearerFreshness` を CI の `verify bearer freshness` step として smoke step の前段に必ず挿入する。threshold は TTL の 1/4 を目安にする。

### L-RSMR-003: mint は署名直後に自己検証し、不整合なら token を露出せず throw する（AC-4）

- **背景**: mint した JWT の署名鍵が検証鍵と食い違うと、形式は正しいのに staging で 401（`auth-secret-drift`）になる。発行時に検出できないと、CI の smoke 段階まで問題が遅延する。
- **教訓**: `mint-staging-bearers.mts` は署名直後に `verifySessionJwt` で round-trip 自己検証し、`null` なら**token 文字列を一切出力せず** throw する。これにより鍵不整合を発行時点で fail-fast にできる。
- **適用条件**: 検証側と別環境 secret で JWT を発行するすべての mint helper。
- **再利用方法**: throw 経路の test は `@ubm-hyogo/shared` を `vi.mock` で `verifySessionJwt=null` 固定して網羅する（`mint-staging-bearers-self-verify.spec.ts` / M-3）。実鍵に依存せず fail-path を deterministic に検証できる。

### L-RSMR-004: bearer / 鍵の hygiene — fail メッセージにも実値を出さない

- **背景**: 鮮度ゲートや自己検証の fail メッセージに JWT 文字列や鍵を載せると、CI ログ・evidence・SSOT 経由で secret が露出する。
- **教訓**: loud fail メッセージは `label` と `secondsRemaining` のみ。SSOT・runbook・artifact inventory には**構造と手順だけ**を書き、実 secret 値・実 JWT・署名鍵は 1Password / GitHub 環境 secret / Cloudflare secret に閉じる。
- **適用条件**: 外部 credential を扱うすべての smoke / mint / probe ドキュメントとログ。
- **再利用方法**: `deployment-secrets-management.md` の secret hygiene 節に「fail メッセージは label + remaining のみ」を明示済み。issue-531 L-ISSUE531-004（summary-only evidence）と同じ hygiene 系列として cite する。

### L-RSMR-005: 静的 fallback は即時撤去せず、恒久化は段階的に（Option C）

- **背景**: 24h bearer 依存の恒久対策は mint path の有効化だが、`STAGING_AUTH_SECRET` の投入は 1Password → `gh secret set` を要する user-gated 操作。fallback を先に撤去すると、投入前に smoke が完全に不能になる。
- **教訓**: 静的 fallback を維持したまま鮮度ゲートでサイレント再発だけ止める（Option C）。恒久化（mint path、TTL=600s 毎回発行）は SSOT §6 の手順に従い、secret 投入後に fallback を不要化する。secret 投入・runtime rerun・commit・push・PR は user-gated として spec 作成 wave では実行しない。
- **適用条件**: 失効する credential を恒久対策へ移行する全 case（移行期間に旧経路を残す必要がある時）。
- **再利用方法**: SSOT §6 の 3 ステップ導線を正本にする。fallback 撤去（stale-reference 物理削除）は mint path の runtime PASS evidence が出た後の別 wave に回す。

### L-RSMR-006: ローカル未導入の lint ツールは parse + 手動確認で代替し、CI を正本にする

- **背景**: `.github/workflows/runtime-smoke-staging.yml` を編集したが `actionlint` がローカル未インストールで実行できなかった。
- **教訓**: YAML parse（構文）+ step 依存・`if:` 条件の手動確認で代替し、`actionlint` 相当の最終判定は CI 側に委ねる。ローカル green の主張に actionlint を含めず、未実施を明記する。
- **適用条件**: ローカルに無い lint / 静的解析ツールが対象ファイルにある時。
- **再利用方法**: phase 検証ログに「actionlint: ローカル未導入、YAML parse + 手動確認で代替、最終判定は CI」と残す。

## 関連 promotion

- aiworkflow-requirements skill 側 SSOT 反映: `reference/bearer-lifecycle-ssot.md`（新規）+ `deployment-secrets-management.md`（auth freshness gate / mint invariant 追記）。reason 4 値・TTL・secret 同期不変条件を正本化済み。
- task-specification-creator skill 側: docs-only / implementation 再判定規則に従い実コードへ反映（テンプレ改修依頼なし）。
- SKILL.md changelog entry 候補: `v2026.05.24-runtime-smoke-staging-mint-recurrence-fix`。
