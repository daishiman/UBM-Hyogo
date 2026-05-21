---
workflow_id: task-runtime-smoke-admin-members-500-recovery-001
title: runtime smoke `admin-list` http=500 復旧（GET /admin/members staging）
状態: runtime_pending
taskType: implementation
visualEvidence: NON_VISUAL
created_at: 2026-05-21
owner: daishiman
canonical_root: docs/30-workflows/task-runtime-smoke-admin-members-500-recovery-001
related:
  - run: backend-ci #507
  - pr: "#853"
  - smoke_runner: scripts/smoke/runtime-attendance-provider.sh
---

# runtime smoke `admin-list` http=500 復旧ワークフロー

## 1. 背景
PR #853（alert-relay isolateId 修正）の backend-ci ジョブ `runtime smoke staging / smoke` が以下で fail。

```
FAIL: admin-list http=500 contract=.members | type == "array"
```

`scripts/smoke/runtime-attendance-provider.sh staging` の第 1 route `GET $STAGING_API_BASE/admin/members` が 500 を返した。PR の主題（alert-relay）と無関係な staging 側 regression と推定。

## 2. 目的
- `GET /admin/members` staging で 200 + `.members` array を返す状態へ復旧する
- 同一 smoke が CI 連続 PASS することを担保する
- 再発予防のため、500 系の root cause（DB schema drift / SQL / view zod）を分離して fix する

## 3. スコープ
- 含む: `apps/api/src/routes/admin/members.ts` の `GET /members` ハンドラ、依存リポジトリ・middleware、staging D1 schema 整合確認、smoke runner の error visibility 強化
- 含まない: 他 5 route (`admin-detail` / `admin-attendance` / `me-*`) の追加修正、production 同等変更（必要時は別タスクに分離）

## 4. Phase 1 entry path topology
- `apps/api/src/routes/admin/members.ts:215-306`（`app.get("/members")`）
- `apps/api/src/repository/_shared/db.ts` / `_shared/brand.ts` / `_shared/builder.ts`
- `apps/api/src/middleware/require-admin.ts`, `middleware/repository-providers.ts`
- `packages/shared/src/.../AdminMemberListViewZ`
- `scripts/smoke/runtime-attendance-provider.sh:184`

## 5. 不変条件
- D1 への直接アクセスは `apps/api` に閉じる
- `getEnv()` 経由以外で `process.env` 参照禁止（`apps/web` 側のみ規約だが staging diag では遵守）
- Cloudflare 系 CLI は `bash scripts/cf.sh ...` のみ（直接 `wrangler` 禁止）

## 6. Phase 一覧
| Phase | ファイル | 概要 |
|------:|---------|------|
| 1 | phase-01.md | 要件・現状把握・unknown 列挙 |
| 2 | phase-02.md | 設計（root cause 仮説マトリクス・検証順序） |
| 3 | phase-03.md | 影響範囲・依存マップ |
| 4 | phase-04.md | 実装方針（変更ファイル・関数シグネチャ） |
| 5 | phase-05.md | テスト戦略 |
| 6 | phase-06.md | 実装手順（差分単位） |
| 7 | phase-07.md | ローカル検証 |
| 8 | phase-08.md | staging 検証（smoke 再実行） |
| 9 | phase-09.md | リリース戦略 |
| 10 | phase-10.md | 監視・観測（再発検知） |
| 11 | phase-11.md | evidence inventory |
| 12 | phase-12.md | 完了確認・compliance |
| 13 | phase-13.md | PR 作成・close-out |
