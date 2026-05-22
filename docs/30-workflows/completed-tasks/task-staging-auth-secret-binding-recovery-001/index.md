---
workflow_id: task-staging-auth-secret-binding-recovery-001
title: staging `AUTH_SECRET` binding 復旧（admin endpoint 全滅 / runtime smoke 500 真因対応）
状態: implemented_runtime_verified_pending_pr
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: new
created_at: 2026-05-22
owner: daishiman
canonical_root: docs/30-workflows/task-staging-auth-secret-binding-recovery-001
related:
  - workflow: docs/30-workflows/completed-tasks/task-runtime-smoke-admin-members-500-recovery-001 (誤診断 workflow / 参照のみ)
  - pr: "#854"
  - artifact: runtime-smoke-staging-26228634903
  - source: apps/api/src/middleware/require-admin.ts:104-107
---

[実装区分: 実装仕様書]

# staging `AUTH_SECRET` binding 復旧ワークフロー

## 1. 背景（真因）

backend-ci の `runtime smoke staging / smoke` job が継続 fail。

```
FAIL: admin-list http=500 contract=.members | type == "array"
```

artifact `runtime-smoke-staging-26228634903 / runtime-smoke.log` の実 body は次の通り。

```
status=500
body={"error":"auth misconfigured"}
```

これは `apps/api/src/middleware/require-admin.ts:104-107` の以下分岐で発火している。

```ts
const secret = c.env.AUTH_SECRET;
if (!secret) {
  return c.json({ error: "auth misconfigured" }, 500);
}
```

つまり staging worker `ubm-hyogo-api-staging` のランタイムで `c.env.AUTH_SECRET` が **falsy**（undefined または空文字）。`bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` は `AUTH_SECRET` を name として返す → secret **名は登録済みだが値が空 / 別環境登録 / binding 不一致** の疑い。

PR #854 (`fix(admin-members)`) はハンドラ側に defensive try/catch を追加したが、auth middleware で 500 が返るため**ハンドラに到達せず**、誤診断であった。

## 2. 影響範囲

- `apps/api/src/middleware/require-admin.ts` の `requireAdmin` / `requireAuth` を経由する **全 admin endpoint** が staging で全滅
  - `/admin/members`, `/admin/meetings`, `/admin/dashboard`, `/admin/audit`, `/admin/tags`, `/admin/schema`, `/admin/requests`, `/admin/identity-conflicts`
- `/me/*` member self-service も `createMeSessionResolver()` が `AUTH_SECRET` を読むため影響可能性あり（要検証）
- production 側の同一事象は未確認だが、同じ deploy パスを通るため verify 必要

## 3. 目的

- staging worker `ubm-hyogo-api-staging` の `AUTH_SECRET` ランタイム binding を回復し、`/admin/members` が 200 + `{members:[...]}` を返す
- 同事象の **構造的予防**（middleware 構造化ログ / env zod 検証 / CI gate / wrapper guard）を本サイクル内で完遂
- production 側の同一 drift を verify し、必要時に同手順で recovery

## 4. スコープ

- 含む（4 spec）
  - spec-01: 即時 recovery（staging + production の secret 再投入 + verify runbook）
  - spec-02: middleware 構造化ログ + `apps/api/src/env.ts` の AUTH_SECRET zod 必須検証
  - spec-03: CI gate（deploy 直後の auth-gate smoke）+ smoke script `auth misconfigured` 検知分岐
  - spec-04: `scripts/cf.sh` の secret put empty-value guard + 3 段チェック runbook 明文化
- 含まない
  - 新規 admin endpoint 追加・D1 schema 変更
  - Google Form 仕様変更
  - Auth.js 認証フロー本体の改修

## 5. 不変条件

1. Cloudflare 系 CLI は `bash scripts/cf.sh ...` のみ経由（直接 `wrangler` 禁止）
2. AUTH_SECRET の実値はドキュメント / ログに転記しない（length / boolean 検証のみ）
3. `.env` の中身を `cat` / `Read` / `grep` で表示しない
4. D1 への直接アクセスは `apps/api` に閉じる
5. test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）
6. `apps/web` 側 env 参照は `getEnv()` 経由のみ（本タスクは `apps/api` 側に閉じる）

## 6. spec 分割

| spec | 主担当ファイル | 概要 |
|------|----------------|------|
| spec-01 | `scripts/cf.sh`（呼出のみ）/ runbook | staging + production の `AUTH_SECRET` 再投入と verify |
| spec-02 | `apps/api/src/middleware/require-admin.ts`, `apps/api/src/env.ts` | falsy 時の構造化ログ + zod 必須検証 |
| spec-03 | `.github/workflows/backend-ci.yml`, `scripts/smoke/runtime-attendance-provider.sh` | deploy 直後 auth-gate smoke / `auth misconfigured` 検知分岐 |
| spec-04 | `scripts/cf.sh` | `secret put` empty-value guard + runbook 3 段チェック明文化 |

各 spec は `specs/spec-NN-*.md` に分離。本 workflow の Phase 4〜10 はこの 4 spec を**並列で**まとめて実装する前提で書かれている。

## 7. Phase 一覧

| Phase | ファイル | 概要 |
|------:|---------|------|
| 1 | phase-01.md | 真因確定・既知事実・unknown 列挙 |
| 2 | phase-02.md | 設計（recovery 手順 / 構造的予防 4 spec の責務分離） |
| 3 | phase-03.md | 影響範囲・依存マップ |
| 4 | phase-04.md | テスト戦略（middleware spec / contract spec / smoke test） |
| 5 | phase-05.md | 実装方針（4 spec 並列の差分単位） |
| 6 | phase-06.md | テスト拡充 |
| 7 | phase-07.md | ローカル検証（typecheck / lint / unit / smoke dry-run） |
| 8 | phase-08.md | staging 検証（secret 再投入 + curl + smoke 再実行） |
| 9 | phase-09.md | 品質保証（line budget / mirror parity / CI gate 通過） |
| 10 | phase-10.md | 最終レビュー（DoD 判定） |
| 11 | phase-11.md | evidence inventory（NON_VISUAL） |
| 12 | phase-12.md | Phase 12 6 成果物 |
| 13 | phase-13.md | PR 作成（user 明示承認後のみ） |

## 8. 既存 workflow との関係

- `docs/30-workflows/completed-tasks/task-runtime-smoke-admin-members-500-recovery-001/` を **誤診断 workflow** として位置付け、lessons-learned 追記 1 ファイル（`outputs/lessons-learned-auth-secret-true-cause.md`）を **同 workflow 内で完結**させる。新 workflow からは参照リンクのみ。

## 9. DoD（workflow 全体）

- 4 spec のローカル実装が完了し、focused api test / smoke shell test / cf.sh guard test / typecheck が pass
- staging worker で `curl -H "Authorization: Bearer $STAGING_ADMIN_BEARER" $STAGING_API_BASE/admin/members` が 200 + `{members:[...]}` を返す（user-gated）
- backend-ci `runtime smoke staging / smoke` が green（user-gated）
- production の AUTH_SECRET binding が verify 済み（必要時は同手順で recovery 完了、user-gated）
- `apps/api` ビルド成功
- Phase 12 の 6 成果物がすべて揃っている
