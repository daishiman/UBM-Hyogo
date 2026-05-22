# Phase 9: 不変条件・契約整合性検査

## 検査項目

### 1. apps/api source 不改修

```bash
git diff main -- apps/api/src/ | head -1
```

期待: 出力 0（apps/api/src/ 配下に改修なし）

### 2. D1 binding 直接アクセス禁止

```bash
grep -RnE '(D1Database|env\.DB)\.' scripts/smoke/ 2>&1 | tee outputs/phase-09/d1-direct-access.log
```

期待: 0 行

### 3. wrangler 直接呼び出し禁止

```bash
grep -RnE '\bwrangler\b' scripts/smoke/ 2>&1 | tee outputs/phase-09/wrangler-direct-call.log
```

期待: 0 行（`scripts/cf.sh` 経由のみ許可）

### 4. production smoke の code path 到達不能

```bash
grep -nE '"production"|prod' scripts/smoke/runtime-attendance-provider.sh
```

期待: env 引数の reject 文脈でのみ出現する。実 URL や bearer に production が hardcode されていない

### 5. route inventory 網羅性

`outputs/phase-02/route-inventory.md` のルート一覧と `apps/api/src/routes/admin/members.ts` / `apps/api/src/routes/me/index.ts` の `app.(get|post|put|delete|patch)` 行数が一致。

```bash
ROUTE_COUNT_SRC=$(grep -E '^\s*app\.(get|post|put|delete|patch)\(' apps/api/src/routes/admin/members.ts apps/api/src/routes/me/index.ts | wc -l | tr -d ' ')
echo "src route count: $ROUTE_COUNT_SRC"
# inventory.md と突合
```

### 6. Acceptance Criteria 到達確認

| AC | 検証方法 |
| --- | --- |
| AC-1 | `outputs/phase-02/route-inventory.md` の存在と src 突合 |
| AC-2 / AC-3 | `outputs/phase-11/evidence/runtime-smoke.log` の route label / contract / count summary grep |
| AC-4 | `outputs/phase-11/evidence/test.log` の throw assertion PASS |
| AC-5 | `outputs/phase-11/evidence/grep-gate.log` が non-leak PASS または空 |
| AC-6 | runtime smoke PASS 前は親タスク index.md diff なし。PASS 後のみ state update diff |
| AC-7 | typecheck/lint/test/build/grep-gate ログ全 PASS |
| AC-8 | Phase 12 7 ファイル実体確認 |
| AC-9 | Phase 13 user 承認待ち状態 |

## 完了条件

- 全ての検査ログが `outputs/phase-09/` に保存済み
- 各検査が期待結果と一致
