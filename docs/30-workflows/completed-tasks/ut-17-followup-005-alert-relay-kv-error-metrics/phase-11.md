# Phase 11: NON_VISUAL Evidence

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 名称 | NON_VISUAL evidence |
| タスク | alert-relay KV 操作エラーの observability 計測（構造化ログ emit） |
| タスクID | ut-17-followup-005-alert-relay-kv-error-metrics |
| Issue | #701（CLOSED / completed marked / close時点では実コード未実装・本workflowでlocal実装済み） |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL |
| 証跡の主ソース | local command evidence + `outputs/phase-11/visual-verification-skip.md` |
| screenshot を作らない理由 | 本サイクルの実装差分は `apps/api/src/routes/internal/alert-relay.ts`（internal route の構造化ログ emit 追加）と spec.ts と runbook のみ。`apps/web` への変更なし、UI が無いため視覚的検証は対象外 |

---

## 判定

UT-17-followup-005 は `apps/api/src/routes/internal/alert-relay.ts` への
構造化ログ emit 追加のみで、画面 UI を一切持たない。
よって視覚的検証（screenshot 取得）は不要。
Phase 11 の成果物は `outputs/phase-11/visual-verification-skip.md` を正本とする。

実 Workers Logs での emit 確認は本サイクル外（user-gated）であり、
production deploy 後の手動 monthly healthcheck（runbook §2 Step 4c）で取得する。

---

## 代替検証

UI が存在しない代わりに、以下で品質を担保する。

| 対象 | evidence | 内容 |
| --- | --- | --- |
| 構造化ログ helper | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | `KV.get` throw / `KV.put` throw 時の payload assertion + 成功時 warn 0 回 |
| schema 固定性 | 同 spec.ts | 6 field（`event` / `op` / `errorClass` / `dedupeKeyHash` / `isolateId` / `ts`）が固定 schema として PASS |
| `dedupeKeyHash` 再現性 | 同 spec.ts | 同一 dedupeKey に対し同一 hash が得られる assertion |
| typecheck | `outputs/phase-11/evidence/typecheck.log` | `mise exec -- pnpm typecheck` exit 0 |
| lint | `outputs/phase-11/evidence/lint.log` | `mise exec -- pnpm lint` exit 0 |
| test | `outputs/phase-11/evidence/test.log` | `mise exec -- pnpm --filter @ubm-hyogo/api test` 全 PASS |
| grep gate | `outputs/phase-11/evidence/grep-gate.log` | `logKvOperationError` の export なし / 外部 import なし / `isolateId` の module top 採番 |
| runbook 整合 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 「Step 4c: KV 操作エラーログの確認」セクション + schema 表 + grep 例 + しきい値 |

### canonical evidence path

```
outputs/phase-11/evidence/
  ├── typecheck.log    # mise exec -- pnpm typecheck
  ├── lint.log         # mise exec -- pnpm lint
  ├── test.log         # mise exec -- pnpm --filter @ubm-hyogo/api test
  └── grep-gate.log    # private 性 / 外部 import 不在 / module top 採番の grep 結果
```

### evidence 収集コマンド

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

### 外部実施項目（production deploy 後）

production deploy は user-gated のため、以下は本 Phase 完了時点では未取得でよい。
`visual-verification-skip.md` で「外部実施項目」として明示する。

| 種別 | 期待 evidence | 取得タイミング |
| --- | --- | --- |
| Workers Logs での実 emit | `bash scripts/cf.sh tail --env production --format pretty \| grep alert_relay_kv_op_failed` で 1 行 JSON が emit | production deploy 後の手動 monthly healthcheck |
| schema 整合確認 | 上記 tail 出力の JSON に 6 field（`event` / `op` / `errorClass` / `dedupeKeyHash` / `isolateId` / `ts`）が含まれる | 同上 |
| しきい値の妥当性確認 | 直近 1 時間の emit 数が定常で 10 件未満 | 同上 |

---

## 完了条件

- [x] `artifacts.json` の `visualEvidence` が `NON_VISUAL`
- [x] UI screenshot 不要理由を `outputs/phase-11/visual-verification-skip.md` に記録
- [x] `outputs/phase-11/evidence/{typecheck,lint,test,grep-gate}.log` 4 ファイル全て保存
- [x] Phase 12 implementation guide から Phase 11 skip evidence を参照
- [x] production Workers Logs の実 emit 確認は外部実施項目として分離
- [x] `screenshots/.gitkeep` や placeholder PNG を作成していない

---

## 参照

- `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-11.md`（フォーマット参考）
- `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-11/visual-verification-skip.md`（同上）
- `docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md`（原典）
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`（外部実施項目の参照先）

---

## 次 Phase 引き継ぎ事項

Phase 12 では、NON_VISUAL skip と local evidence（4 log）を PR 本文の evidence source として扱う。
production deploy 後の Workers Logs 実 emit 確認は Phase 13 PR 本文の Evidence セクション
（user-gated approval 後に追記）へ転記する。

## 目的

UI screenshot の代替として NON_VISUAL evidence を固定する。

## 実行タスク

- typecheck / lint / test / grep-gate の 4 evidence と NON_VISUAL skip 文書を確認する。

## 参照資料

- `outputs/phase-11/visual-verification-skip.md`
- `outputs/phase-11/evidence/`

## 成果物/実行手順

- `outputs/phase-11/visual-verification-skip.md` と 4 evidence log を Phase 12 へ引き継ぐ。

## 統合テスト連携

`outputs/phase-11/evidence/test.log` を integration evidence として扱う。
