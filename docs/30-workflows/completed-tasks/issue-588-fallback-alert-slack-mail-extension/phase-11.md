# Phase 11: 証跡 (NON_VISUAL evidence)

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | completed |

## evidence canonical path

```
outputs/phase-11/evidence/
├─ typecheck.log        ← mise exec -- pnpm typecheck の出力
├─ lint.log             ← mise exec -- pnpm lint の出力
├─ test.log             ← vitest run の出力（focused suite PASS）
├─ build.log            ← 該当する場合のみ（本タスクは build 影響なしのため空ファイル可）
├─ grep-gate.log        ← redaction grep / secret grep
└─ secret-grep.txt      ← webhook URL 実値・1Password URI 値が outputs/ に含まれないことの 0 件証跡
```

## 取得コマンド

```bash
cd docs/30-workflows/issue-588-fallback-alert-slack-mail-extension/outputs/phase-11/evidence

# typecheck
mise exec -- pnpm typecheck 2>&1 | tee typecheck.log

# lint
mise exec -- pnpm lint 2>&1 | tee lint.log

# focused test
mise exec -- pnpm vitest run scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts 2>&1 \
  | tee test.log

# secret grep — webhook 実値が outputs 配下に混入していないこと、1Password URI は正本参照として分類することを確認
{
  echo "## hooks.slack.com production URL grep"
  grep -rn "hooks.slack.com/T[A-Z0-9]" docs/30-workflows/issue-588-fallback-alert-slack-mail-extension/outputs/ || echo "(0 hits)"
  echo "## 1Password URI reference grep (allowed canonical references, not values)"
  grep -rn "op:/" docs/30-workflows/issue-588-fallback-alert-slack-mail-extension/outputs/ || echo "(0 hits)"
} > secret-grep.txt

# redaction grep — implementation の通知系 path に PII pattern が出ていないこと
{
  rg -n "userId=[^\[]" scripts/cf-audit-log/observation/fallback-rate-alert.ts || echo "(0)"
  rg -n "tenantId=[^\[]" scripts/cf-audit-log/observation/fallback-rate-alert.ts || echo "(0)"
} > grep-gate.log
```

## fixture (dry-run 用)

`outputs/phase-11/fixture/` に hourly snapshot JSON を 3 件配置（fallbackRate 0.06 / 0.07 / 0.08 連続）。実値は本仕様書添付ではなく実装時に作成する。

## evidence PASS 条件

- [x] typecheck exit 0
- [x] lint exit 0
- [x] test exit 0、focused suite の全 test が PASS line にある
- [x] secret-grep.txt が production Slack webhook URL 0 件と 1Password URI 正本参照の分類を記録
- [x] dry-run 実行ログで `[dry-run] notification payload: {...}` が確認できる
- [x] notification payload JSON 内に 32+ hex / userId= / tenantId= / Bearer / hooks.slack.com URL が**含まれない**

## state vocabulary

- 実装完了 + 既存 evidence 取得済み → `implemented-local-runtime-pending` (local PASS 5 点)
- production runtime（fallback rate 連続超過の発火）は本タスクでは検証不能（実環境で 5% 連続超過を意図的に発生させない）
- → 最終 state: `IMPLEMENTED_LOCAL_RUNTIME_PENDING`（spec / unit test / dry-run 全 PASS、production 実発火は次回 incident 発生時に検証）

## 出力

- `outputs/phase-11/main.md`
- `outputs/phase-11/evidence/*.log`
- `outputs/phase-11/evidence/secret-grep.txt`
