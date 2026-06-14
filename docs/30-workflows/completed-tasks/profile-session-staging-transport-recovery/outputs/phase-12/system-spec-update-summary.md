# Phase 12: システム仕様更新サマリ（system-spec-update-summary）

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 12 / 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

本ワークフローの仕様（transport 多層防御 + 観測性統合）が既存システム仕様・skill reference へ与える影響を Step 1-A / 1-B / 1-C / Step 2 の手順で個別に記録し、workflow-local sync と global skill sync を分離して管理する。本サイクルは `implemented_local_runtime_pending`（local 実装・focused 検証済み）。

## Step 1-A: 完了タスク記録 / 既存システム仕様（specs/）への影響評価

| 仕様 | 影響 | 結果 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md`（`/me` レスポンス項目） | **`/me` の path・レスポンス shape・status 体系は不変**（AC-7・apps/api 非接触）。chain は Response を無加工で返す | 仕様変更なし |
| `docs/00-getting-started-manual/specs/02-auth.md`（session / 認証境界） | `session-guard` の 401/410 判定・redirect 経路は不変。fail-closed は T01 の `environmentExplicit` 方式で**強化方向に維持**（非 local で localhost 非到達） | 仕様変更なし |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md`（session 境界） | session 境界・authGateState は不変 | 仕様変更なし |
| `docs/00-getting-started-manual/specs/08-free-database.md`（D1 構成） | D1 schema・アクセス境界（apps/api に閉じる）は不変 | 仕様変更なし |

Step 1-A 結論: **`/me` 契約不変のため既存 specs への文面変更は該当なし**。変更はすべて `apps/web` の transport/env 内部実装と `scripts/` の read-only 診断に閉じる。

## Step 1-B: 実装状況テーブル（implemented_local_runtime_pending）

| 項目 | 状況 |
| --- | --- |
| 実装状況 | **`implemented_local_runtime_pending`**（local apps/web + script 実装と focused 検証は完了。staging deploy・authenticated screenshot・commit・PR は user-gated） |
| 実装ファイル（編集済み） | `apps/web/src/lib/env.ts`（編集・T01/T02）/ `apps/web/src/lib/fetch/transport.ts`（編集・T01/T03）/ `apps/web/src/lib/fetch/authed.ts`（編集・T03）/ `apps/web/src/lib/server-fetch/safe-fetch.ts`・`apps/web/src/lib/fetch/errors.ts`（T01 統合 のみ）/ `scripts/diagnose-profile-session.sh`（編集・T04） |
| テストファイル（focused 追加・実行済み） | `apps/web/src/lib/__tests__/env.spec.ts` / `apps/web/src/lib/fetch/transport.spec.ts` / `apps/web/src/lib/fetch/authed.spec.ts` / `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` / `apps/web/app/(member)/profile/page.spec.tsx` |
| apps/api 非接触 | `apps/api/**` は read-only。S3 確定時の根治のみ `unassigned-task/task-api-worker-hard-error-root-fix.md`（CONST_007 例外①） |
| 実行記録 | focused Vitest 5 spec（env/transport/authed/safe-fetch/profile page）と `bash -n scripts/diagnose-profile-session.sh`、診断 dry run は local PASS。staging deploy/復旧検証は user-gated |

## Step 1-C: 関連タスク更新 / skill reference（aiworkflow-requirements）への影響評価

| 参照 | 影響 | 結果 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（active ledger） | 本ワークフローを same-wave で登録 | same-wave 更新済み |
| 前身 WF `completed-tasks/profile-session-fetch-failure-investigation` | F-1〜F-3 の確定により H 仮説を S1〜S4 へ精緻化。MT-A〜MT-D は本 WF Phase 11 RT-A〜RT-D に統合 | 前提引き継ぎを artifact inventory に記録 |
| 観測性ブランチ WF `profile-session-transport-observability-fail-closed` | T01 で必要成果を本 WF branch へ統合し、本 WF の PR が当該成果を dev へ届ける（個別 PR は立てない・Phase 13 で明記） | 既存 WF への文面変更なし |
| `.claude/skills/aiworkflow-requirements/indexes/*` | 新規 architectural pattern を導入しない（既存 transport/env アクセサの内部堅牢化） | indexes rebuild 済み |

## Step 2: 新規 interface / 型定義の追加（判定）

判定: **新規 interface 追加 = 有**（ただし API/IPC surface は不変・`apps/web` 内部のみ）。

```ts
// apps/web/src/lib/fetch/transport.ts（SSOT §2 主要シグネチャを逐語転記）
export interface ApiTransportChainEnv extends ApiTransportEnv {
  publicBaseUrl?: string | undefined; // NEXT_PUBLIC_API_BASE_URL（staging/production の最終 fallback）
}
export function resolveApiTransportChain(env: ApiTransportChainEnv): ApiTransport[]; // 長さ>=1 or throw（非local・候補0）
export async function fetchViaApiTransportChain(
  chain: ApiTransport[],
  path: string,
  init?: RequestInit,
): Promise<Response>; // ApiTransportError 時のみ次候補（GET/HEAD のみ）。最後も throw なら ApiTransportError を rethrow
```

### 判断根拠（1 行明記）

- 追加されるのは **`apps/web` 内部の transport chain 関数と env 内部 helper のみ**で、`/me` の API/IPC surface（path・shape・status 体系）と `fetchAuthed` / `getAuthEnv` の公開契約は不変のため、`/me` API surface は不変だが、workflow active ledger・quick-reference・resource-map・artifact inventory・changelog へ same-wave 登録した。

## workflow-local sync

| 対象 | 状況 |
| --- | --- |
| `outputs/phase-{9,10,11,12,13}/*`（本 wave 生成分） | 本 wave で生成（present） |
| `outputs/phase-11/manual-test-result.md` | 本 wave で生成（present・RT-A〜RT-D + S1〜S4 判定フロー） |
| `artifacts.json` / `outputs/artifacts.json` | `cmp -s ...` exit 0、phase status / `workflow_state = implemented_local_runtime_pending` を byte-identical に保持 |
| `unassigned-task/task-api-worker-hard-error-root-fix.md` | 本 wave で配置（present） |

## global skill sync

| 対象 | 状況 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/workflow-profile-session-staging-transport-recovery-artifact-inventory.md` | same-wave 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map,topic-map}.md` / `keywords.json` | same-wave 更新・rebuild |

## 完了条件

- [x] Step 1-A（既存 specs 影響: `/me` 契約不変のため変更なし）を記録
- [x] Step 1-B（実装状況テーブル: implemented_local_runtime_pending）を記録
- [x] Step 1-C（関連タスク / skill reference 影響: same-wave sync）を記録
- [x] Step 2（新規 interface: chain 関数あり・API surface 不変の判断根拠 1 行）を記録
- [x] workflow-local sync と global skill sync を別ブロックで記録

## 成果物

- `outputs/phase-12/system-spec-update-summary.md`（本ファイル）

## 参照資料

- `index.md`（不変条件・正本順位）
- `_shared-context.md` §2（主要シグネチャ）/ §3（スコープ）/ §6（既存 WF との関係）
- `outputs/phase-3/phase-3.md`（不変条件 非侵襲レビュー）
