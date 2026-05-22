# Phase 11: 手動 staging runtime evidence

> visualEvidence: NON_VISUAL（5 点テキスト evidence が主証跡 / Sentry dashboard screenshot は VISUAL 補助）
> 状態語彙: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（本仕様書作成時点）→ Phase 11 完了で `RUNTIME_VERIFIED` 候補

## 1. evidence canonical path

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | テキスト | G0〜G5 通過記録（owner approval timestamp 付） |
| `outputs/phase-11/evidence/preflight-g0.log` | ログ | parent task-03 実装ファイル / env / wrangler / cf.sh 実在確認 |
| `outputs/phase-11/evidence/secret-list-staging.log` | ログ | `cf.sh secret list --env staging` 出力（DSN value は表示されない） |
| `outputs/phase-11/evidence/deploy-staging.log` | ログ | `cf.sh deploy --env staging` 出力（version id 含む） |
| `outputs/phase-11/evidence/curl-staging.log` | ログ | `/` / `/(public)/members` の HTTP code |
| `outputs/phase-11/evidence/sentry-staging-server-event.png` | 画像（VISUAL 補助） | dashboard server event 一覧 |
| `outputs/phase-11/evidence/sentry-staging-browser-event.png` | 画像（VISUAL 補助） | dashboard browser event 一覧 |
| `outputs/phase-11/evidence/grep-gate-runtime.log` | ログ | `requestIdleCallback` / `@sentry/nextjs` 各 0 件 |
| `outputs/phase-11/evidence/dsn-leak-scan.log` | ログ | `rg 'https://.*@.*[.]ingest[.]sentry[.]io' .` 0 件 |

## 2. G0〜G5 multi-stage approval gate

| Gate | 内容 | 承認者 | 通過条件 | 失敗時 |
| --- | --- | --- | --- | --- |
| G0 | preflight | Claude Code / owner | parent task-03 実装ファイル（`instrumentation.ts` / `instrumentation-client.ts` / `capture.ts`）と task-02 env 基盤が実在。加えて G1 前に 1Password vault/item の存在を確認 | FAIL 時は G1 へ進まず、親 task-03 を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` のまま維持。1Password 未 provisioning は UT-Sentry-Provisioning で解消 |
| G1 | staging secret 投入承認 | owner（user） | `op://UBM-Hyogo/Sentry Web DSN (staging)/dsn` が存在し、`cf.sh secret list --env staging` で `SENTRY_DSN_WEB` name 表示 | secret value が表示された場合 abort（cf.sh 仕様違反） |
| G2 | staging deploy 承認 | owner（user） | `cf.sh deploy --env staging` exit 0 + version id 取得 | deploy 失敗 → rollback → 親 task-03 への regression 検討 |
| G3 | curl + Sentry event 観測承認 | owner（user） | curl 200 × 2 + dashboard server event ≥1 + browser event ≥1 | event 不足 → phase-06 EX-1/EX-3/EX-4/EX-9 切り分け |
| G4 | grep gate 再走承認 | owner（user） | `requestIdleCallback` 0 件 + `@sentry/nextjs` 0 件 | 違反 → 親 task-03 へ regression（本タスク保留） |
| G5 | 状態昇格 + commit/PR 承認 | owner（user） | parent task-03 メタ更新 + Phase 12 全タスク完了 + 一時 throw revert 確認 | revert 漏れ等あれば再 gate |

## 3. main.md フォーマット

```
# Phase 11 main

## G0 preflight
- timestamp: YYYY-MM-DDTHH:MM:SS+09:00
- parent task-03 file: present
- instrumentation.ts: present
- instrumentation-client.ts: present
- capture.ts: present
- env/wrangler/cf.sh: present
- log: evidence/preflight-g0.log
- result: PASS

## G1 secret 投入承認
- approver: <user>
- timestamp: YYYY-MM-DDTHH:MM:SS+09:00
- staging secret list: see evidence/secret-list-staging.log
- result: PASS

## G2 staging deploy 承認
- timestamp: ...
- version id: <id>
- deploy log: evidence/deploy-staging.log
- result: PASS

## G3 curl + Sentry event 観測承認
- timestamp: ...
- curl `/`: 200
- curl `/members`: 200
- Sentry server event count (window 30min): N (>=1)
- Sentry browser event count: M (>=1)
- release tag identical: yes
- screenshot: evidence/sentry-staging-{server,browser}-event.png
- result: PASS

## G4 grep gate 再走承認
- timestamp: ...
- requestIdleCallback hits: 0
- @sentry/nextjs hits: 0
- log: evidence/grep-gate-runtime.log
- result: PASS

## G5 状態昇格 + commit/PR 承認
- timestamp: ...
- parent task-03 状態: PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED
- 一時 throw revert: confirmed (rg 'force_error' apps/web/src = 0)
- DSN leak scan: 0
- result: PASS
```

## 4. PASS 判定

G0〜G5 すべて PASS で `runtime-verified` 状態に到達し、Phase 12 へ進行可。1 gate でも FAIL の場合は本ワークフローを `runtime-pending` のまま据え置き、原因タスク（親 task-03 / task-02）へ regression として戻す。

## 5. 2026-05-08 実行サイクルでの実体化

本サイクルでは G0 preflight、local quality gate、OpenNext `worker.js` grep gate、DSN leak scan までを実体化した。G1 以降は 1Password `UBM-Hyogo` vault / `Sentry Web DSN (staging|production)` item が未 provisioning のため実行していない。したがって以下は deferred evidence として path を予約し、runtime PASS とは扱わない。

- `outputs/phase-11/evidence/secret-list-staging.log`
- `outputs/phase-11/evidence/deploy-staging.log`
- `outputs/phase-11/evidence/curl-staging.log`
- `outputs/phase-11/evidence/sentry-staging-server-event.png`
- `outputs/phase-11/evidence/sentry-staging-browser-event.png`
