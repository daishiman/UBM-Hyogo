# Phase 5: 実装ランブック

実装区分: 実装仕様書（CONST_005 の実行手順）

## 5.1 前提

- Phase 1〜4 が design_locked
- mise + pnpm 環境セットアップ完了（CLAUDE.md 参照）
- ブランチは feature/issue-369 系 (`spec/issue-369-attendance-write-operations` から派生)

## 5.2 順序固定 runbook

### Step 1 — branded type write 側展開（5 min）

1. `apps/api/src/repository/attendance.ts` を読み、既存 `addAttendance` / `removeAttendance` が write 正本として成立しているか確認
2. 新規 `AttendanceRecordId` helper は追加しない
3. `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` で型エラーが出ないことを確認

### Step 2 — 既存 write contract の正本化（15 min）

1. 新規 `AttendanceWriter` interface は追加しない
2. 既存 `addAttendance` / `removeAttendance` の duplicate / deleted member / session guard を確認する
3. 呼び出し側（`apps/api/src/routes/admin/*.ts`）を grep し、cast helper で対応:
   ```bash
   grep -rn "addAttendance\|removeAttendance" apps/api/src
   ```
4. typecheck PASS まで修正

### Step 3 — admin route 結線硬化（20 min）

1. `apps/api/src/routes/admin/attendance.ts` を Writer 経由に書き換え
2. `apps/api/src/routes/admin/meetings.ts` の `POST /meetings/:id/attendances` を `attended` true/false で `upsert` / `softRemove` に振り分け
3. 各 route で `app.use("/admin/*", adminGate)` の適用を確認（既存 / 05a 既定）
4. error mapping: `member_not_found` / `session_not_found` → 404, `deleted_member` → 422, `duplicate` → 409

### Step 4 — audit log 結線（10 min）

1. upsert 成功時 → `audit_log` に `action="attendance.add"`, `actor_email=c.get("adminContext").email`, `target_type="meeting"`, `target_id=sessionId`, `metadata={ memberId, by }`
2. softRemove 成功時 → 同様に `attendance.remove`
3. duplicate / not_found は audit log を発火しない（冪等経路）
4. `apps/api/src/routes/admin/audit.test.ts` の既存ケースが PASS することを確認

### Step 5 — 単体テスト追加（30 min）

`apps/api/src/repository/attendance.test.ts` に Phase 4 T1〜T8 を追加:
```bash
mise exec -- pnpm --filter @ubm-hyogo/api test attendance
```

### Step 6 — route テスト追加（30 min）

`apps/api/src/routes/admin/meetings.test.ts` / `attendance.test.ts` に Phase 4 T9〜T13 を追加:
```bash
mise exec -- pnpm --filter @ubm-hyogo/api test admin/meetings
mise exec -- pnpm --filter @ubm-hyogo/api test admin/attendance
```

### Step 7 — 統合テスト追加（20 min）

`apps/api/src/repository/__tests__/attendance-provider.test.ts` に Phase 4 T14, T15 を追加:
```bash
mise exec -- pnpm --filter @ubm-hyogo/api test attendance-provider
```

### Step 8 — 全体検査（10 min）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm build
mise exec -- pnpm --filter @ubm-hyogo/api test
```

### Step 9 — curl evidence 取得（15 min）

`apps/api` をローカル起動し、admin token を取得して 4 ケースを curl 実行、`outputs/phase-11/evidence/api-curl/` に保存:

```bash
# add ok
curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"memberId":"m1","attended":true}' \
  http://127.0.0.1:8787/admin/meetings/s1/attendances \
  | tee outputs/phase-11/evidence/api-curl/attendance-add-ok.json

# duplicate（同 body 再 POST）
curl -s -X POST ... | tee outputs/phase-11/evidence/api-curl/attendance-add-duplicate.json

# remove ok
curl -s -X POST ... -d '{"memberId":"m1","attended":false}' ... \
  | tee outputs/phase-11/evidence/api-curl/attendance-remove-ok.json

# session not found
curl -s -X POST ... .../meetings/s_deleted/attendances \
  | tee outputs/phase-11/evidence/api-curl/attendance-session-not-found.json
```

### Step 10 — admin UI smoke（10 min）

ローカル `apps/web` を起動し、admin meeting 詳細画面で attendance チェックボックスを ON/OFF 操作、画面が即時反映されることを確認。`outputs/phase-11/evidence/ui-smoke/admin-meeting-attendance-edit.md` にログ／スクリーンショット記録。

## 5.3 中断時の復旧手順

- Step 2 で typecheck エラーが連鎖した場合 → branded type cast helper を `_shared/brand.ts` 側に集約してから再開
- Step 5/6/7 で D1 fixtures 不足 → `apps/api/src/repository/__fixtures__/` を確認
- Step 9 で admin token 取得不可 → `apps/api/src/routes/admin/_test-auth.ts` 経由で integration auth 経路を使用

## 5.4 完了条件

- Step 1〜10 全完走
- Phase 4 test matrix 全 PASS
- curl evidence 4 件 + ui-smoke ログ取得済み
- 既存テスト regression なし
