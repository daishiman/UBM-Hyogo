# Phase 4: テスト戦略

## 既存 unit test の再確認（新規追加なし）

`apps/api/src/repository/__tests__/builder.test.ts` には既に以下の throw assertion が存在する:

- `builder.test.ts:192` — `buildMemberProfile` ctx に `attendanceProvider` 未注入時の throw
- `builder.test.ts:301` — `buildAdminMemberDetailView` ctx に `attendanceProvider` 未注入時の throw

両者とも `/attendanceProvider not bound/i` を期待しており **AC-4 は既に技術的に充足**。本タスクでは追加テストを書かず、Phase 8 / 11 で **PASS log の取得** を以て evidence 化する。

## 追加するテスト

### TC-RT-01（Phase 11 で取得）— route smoke contract

| 観点 | 期待 |
| --- | --- |
| GET /admin/members | HTTP 200 / JSON.body.members が array |
| GET /admin/members/:memberId | HTTP 200 / JSON.body.attendance が array |
| GET /admin/members/:memberId/attendance | HTTP 200 / JSON.body.records が array |
| GET /me/ | HTTP 200 / JSON.body.user.memberId が string |
| GET /me/profile | HTTP 200 / JSON.body.profile.attendance が array |
| GET /me/attendance | HTTP 200 / JSON.body.records が array |

実装は `scripts/smoke/runtime-attendance-provider.sh` の `request_json` 関数で route-specific `jq -e` filter を実行する。

### TC-RT-02 — secret leak 検査（Phase 11 grep-gate.log）

```bash
EVIDENCE_DIR=docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-11/evidence
{
  grep -R -E '(Set-Cookie:|authorization:|Bearer [A-Za-z0-9]|cf-_session=[A-Za-z0-9]|__Secure-authjs.*=[A-Za-z0-9])' "$EVIDENCE_DIR"/*.log || true
  grep -E '(responseEmail|fullName|editResponseUrl|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+)' "$EVIDENCE_DIR/runtime-smoke.log" || true
} | tee "$EVIDENCE_DIR/grep-gate.log"
```

期待: 出力 0 行（実値が混入していない）。

## ローカル検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/api build
bash scripts/cf.sh whoami
bash scripts/smoke/runtime-attendance-provider.sh staging
```

## 完了条件

- 上記 6 テスト観点が `outputs/phase-04/test-plan.md`（任意。本ファイルが正本でも可）に明文化
- 既存 throw assertion の line 番号が固定参照されていること
