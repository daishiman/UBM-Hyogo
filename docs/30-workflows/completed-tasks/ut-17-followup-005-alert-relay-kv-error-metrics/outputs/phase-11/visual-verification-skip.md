# Phase 11 成果物: NON_VISUAL 理由と代替 evidence 一覧

## NON_VISUAL 判定

本タスク（ut-17-followup-005-alert-relay-kv-error-metrics）は
**UI 変更を一切伴わない**ため、screenshot による視覚的検証は対象外とする。

### 判定根拠

| 観点 | 内容 |
| --- | --- |
| 変更対象 | `apps/api/src/routes/internal/alert-relay.ts`（internal route の構造化ログ emit 追加） |
| `apps/web` への変更 | **なし** |
| UI コンポーネント | 影響なし（route handler のみ） |
| ユーザー操作経路 | 影響なし（internal/* は Cloudflare Notification webhook 専用で人間が叩かない） |
| 視覚的成果物 | 存在しない（構造化ログは Workers Logs / tail 出力上のテキスト） |

よって `artifacts.json` の `visualEvidence` 値は `NON_VISUAL` とする。

---

## 代替 evidence 一覧（canonical path）

UI screenshot の代わりに、以下 4 種の local evidence を `outputs/phase-11/evidence/` 配下に
保存する。

| # | evidence | path | 取得コマンド |
| --- | --- | --- | --- |
| 1 | typecheck log | `outputs/phase-11/evidence/typecheck.log` | `mise exec -- pnpm typecheck` |
| 2 | lint log | `outputs/phase-11/evidence/lint.log` | `mise exec -- pnpm lint` |
| 3 | test log | `outputs/phase-11/evidence/test.log` | `mise exec -- pnpm --filter @ubm-hyogo/api test` |
| 4 | grep gate log | `outputs/phase-11/evidence/grep-gate.log` | helper export 不在 + 外部 import 不在 + `isolateId` module top 採番の grep |

### 取得コマンド一括

```bash
mkdir -p outputs/phase-11/evidence

mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-11/evidence/typecheck.log
mise exec -- pnpm lint 2>&1 | tee outputs/phase-11/evidence/lint.log
mise exec -- pnpm --filter @ubm-hyogo/api test 2>&1 | tee outputs/phase-11/evidence/test.log
{
  echo "## helper export gate";
  grep -nE "export.*logKvOperationError" \
    apps/api/src/routes/internal/alert-relay.ts \
    || echo "OK: no export";
  echo "";
  echo "## external import gate";
  grep -rn "logKvOperationError" apps/api/src \
    | grep -v "apps/api/src/routes/internal/alert-relay.ts" \
    | grep -v "apps/api/src/routes/internal/__tests__/alert-relay.spec.ts" \
    || echo "OK: no external import";
  echo "";
  echo "## isolateId module top gate";
  grep -nE "const isolateId\s*=\s*crypto\.randomUUID\(\)" \
    apps/api/src/routes/internal/alert-relay.ts;
} | tee outputs/phase-11/evidence/grep-gate.log
```

---

## 外部実施項目（user-gated / production deploy 後）

production deploy 後の Workers Logs での実 emit 確認は本サイクル外。
以下は Phase 13 PR 本文の Evidence セクションに追記する候補。

| 種別 | 期待 evidence | 取得タイミング | 取得方法 |
| --- | --- | --- | --- |
| 実 emit 確認 | Workers Logs に `{"event":"alert_relay_kv_op_failed",...}` 形式の 1 行 JSON が出力 | production deploy 後の月次 healthcheck（runbook §2 Step 4c） | `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \| grep alert_relay_kv_op_failed` |
| schema 整合 | 上記 tail 出力の JSON に 6 field（`event` / `op` / `errorClass` / `dedupeKeyHash` / `isolateId` / `ts`）が含まれる | 同上 | tail 出力を `jq` で field 確認 |
| しきい値妥当性 | 定常状態で直近 1 時間の emit 数が 10 件未満 | production deploy 後 7 日間 | tail 集計 |

> 上記 evidence は production deploy 後の手動 healthcheck で取得し、
> ut-17-alert-relay-monthly-healthcheck.log.md（runbook §4 で参照）に記録する。

---

## screenshots ディレクトリ

本タスクは NON_VISUAL のため `outputs/phase-11/screenshots/` ディレクトリを
**作成しない**。`.gitkeep` や placeholder PNG も配置しない。

---

## 完了条件チェックリスト

- [x] `artifacts.json` の `visualEvidence` が `NON_VISUAL` に設定されている
- [x] 本ファイル（visual-verification-skip.md）に NON_VISUAL 理由が明記されている
- [x] 代替 evidence 4 種が `outputs/phase-11/evidence/` 配下に保存されている
- [x] `outputs/phase-11/screenshots/` ディレクトリが **存在しない**
- [x] production deploy 後の外部実施項目が本ファイルに分離記載されている

---

## 参照

- `docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/phase-11.md`（本 Phase 仕様）
- `docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/index.md`（AC 定義）
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`（外部実施項目の取得手順）
- `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-11/visual-verification-skip.md`（フォーマット参考）
