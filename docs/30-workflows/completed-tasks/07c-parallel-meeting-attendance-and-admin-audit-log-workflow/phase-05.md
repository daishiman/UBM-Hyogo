# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | completed |

## 目的

Phase 4 の verify suite を満たす実装手順を runbook + 擬似コードで記述する。本タスクは spec_created なのでコードは書かないが、後続実装者が手順通りに進めれば AC を満たす擬似コードと sanity check を残す。

## 実行タスク

- [ ] runbook (`outputs/phase-05/runbook.md`) を 6 ステップで記述
- [ ] Hono handler の擬似コードを 3 endpoint 分記述
- [ ] audit hook middleware の擬似コードを記述
- [ ] sanity check（curl + wrangler d1 execute）を runbook 末尾に記述

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | endpoint signature |
| 必須 | outputs/phase-04/main.md | verify suite |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler 操作 |

## runbook（6 ステップ）

### Step 1: D1 migration 確認

```bash
# 02b で migration 済みのはずだが確認
wrangler d1 migrations list ubm-hyogo-db --local
# 期待: member_attendance に uq_member_attendance を含む migration が apply 済み
# 未 apply なら 02b へ差し戻し
```

### Step 2: action enum と payload 型の扱い

07c の実装範囲では `packages/shared` へ新規 enum を追加しない。`apps/api/src/repository/_shared/brand.ts` の `auditAction()` brand と `auditLog.append()` を使い、attendance add/remove の action を `attendance.add` / `attendance.remove` に固定する。07a/07b/07c を横断する共通 enum は、既存 admin route の action 命名を揃える別タスクで扱う。

### Step 3: attendance route で audit append

```ts
await auditAppend(db, {
  actorId: asAdminId(authUser.memberId),
  actorEmail: adminEmail(authUser.email),
  action: auditAction("attendance.add"),
  targetType: "meeting",
  targetId: sessionId,
  before: null,
  after: toAttendanceResponse(result.row),
});
```

### Step 4: attendance endpoints 実装

```ts
// apps/api/src/routes/admin/attendance.ts
GET    /meetings/:sessionId/attendance/candidates
POST   /meetings/:sessionId/attendance
DELETE /meetings/:sessionId/attendance/:memberId
```

### Step 5: candidates resolver

```ts
// apps/api/src/repository/attendance.ts
listAttendableMembers(ctx, sessionId)
```

### Step 6: 既存 admin endpoints の扱い

既存 admin endpoints への audit hook 注入は 07c 実装範囲外。07c では attendance add/remove の audit を固定し、横断的な action enum / hook 共通化は別タスクで扱う。

| POST /admin/sync/responses | sync.responses.run | sync_job |

## sanity check

```bash
# 1. local D1 起動
pnpm --filter @ubm/api dev

# 2. attendance 1 回目（201 期待）
curl -X POST http://localhost:8787/admin/meetings/s1/attendance \
  -H "Cookie: ${ADMIN_SESSION}" \
  -H "Content-Type: application/json" \
  -d '{"memberId":"m1"}'

# 3. attendance 2 回目（409 期待）
curl -X POST http://localhost:8787/admin/meetings/s1/attendance \
  -H "Cookie: ${ADMIN_SESSION}" \
  -H "Content-Type: application/json" \
  -d '{"memberId":"m1"}'

# 4. audit_log 確認
wrangler d1 execute ubm-hyogo-db --local \
  --command="SELECT action, target_id FROM audit_log ORDER BY occurred_at DESC LIMIT 5"
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook の各ステップで起こりうる failure を異常系検証へ |
| Phase 7 | AC マトリクスの実装列に上記擬似コードをマッピング |
| 下流 08a | contract test が本 runbook の挙動を expect |

## 多角的チェック観点

- 不変条件 **#5** adminGate() を全 endpoint に必須付与（理由: 認可漏れ防止）
- 不変条件 **#6** D1 アクセスは repository / service 経由のみ（理由: apps/web から直接呼ばない）
- 不変条件 **#7** candidates resolver で `is_deleted=0` を WHERE（理由: 削除済み非表示）
- 不変条件 **#11** profile 編集 endpoint を実装しない（理由: route 一覧に含めない）
- 不変条件 **#15** DB UNIQUE + 409 + 既存 row 返却（理由: idempotent retry を可能に）
- a11y / 無料枠: 1 操作 2 writes、`audit_log` index で履歴 SELECT 高速

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | runbook 記述 | 5 | pending | 6 ステップ |
| 2 | 擬似コード記述 | 5 | pending | hook + 3 endpoint + resolver |
| 3 | sanity check 記述 | 5 | pending | curl + wrangler |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | runbook 本文 |
| ドキュメント | outputs/phase-05/runbook.md | step 詳細 |
| メタ | artifacts.json | phase 5 status |

## 完了条件

- [ ] runbook 6 ステップ記述
- [ ] 擬似コード（hook + 3 endpoint + resolver）記述
- [ ] sanity check が実行可能形式

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 5 を completed

## 次 Phase

- 次: Phase 6 (異常系検証)
- 引き継ぎ: 6 ステップ runbook、想定 failure
- ブロック条件: 擬似コード未完なら Phase 6 不可
