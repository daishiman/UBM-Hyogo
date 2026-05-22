# Phase 7: AC マトリクス

| AC | 説明 | 検証フェーズ | 検証手段 | evidence |
| --- | --- | --- | --- | --- |
| AC-7-R1 | staging URL `/` および `/members` curl 200 | Phase 11 / Step 7 | `curl -sSf -w '%{http_code}'` | `outputs/phase-11/evidence/curl-staging.log` |
| AC-7-R2 | Sentry dashboard `environment:staging` 下で server runtime event ≥ 1 | Phase 11 / Step 7 | dashboard filter | `outputs/phase-11/evidence/sentry-staging-server-event.png` |
| AC-7-R3 | 同 dashboard で browser runtime event ≥ 1 | Phase 11 / Step 7 | dashboard filter | `outputs/phase-11/evidence/sentry-staging-browser-event.png` |
| AC-7-R4 | server / browser event の release tag が同一 deploy id を指す & 二重 init 違反なし | Phase 11 / Step 7 | dashboard 個別 event detail（release / runtime tag を確認） | screenshot 内の release 列 |
| AC-4-R1 | `apps/web/.open-next/worker.js` に `requestIdleCallback` 0 件 | Phase 11 / Step 8 | `rg -n 'requestIdleCallback' apps/web/.open-next/` | `outputs/phase-11/evidence/grep-gate-runtime.log` |
| AC-4-R2 | 同 artifact 内に `@sentry/nextjs` 0 件 | Phase 11 / Step 8 | `rg -n '@sentry/nextjs' apps/web/.open-next/` | 同上 |
| AC-S1 | DSN 値が repo / log / PR body / screenshot に残らない | Phase 11 / Phase 13 | `rg 'https://.*@.*[.]ingest[.]sentry[.]io'` + screenshot 目視 | `outputs/phase-11/evidence/dsn-leak-scan.log` |
| AC-G | G1〜G5 全 gate 通過記録 | Phase 11 / main.md | timestamp + owner approval text | `outputs/phase-11/main.md` |
| AC-V | parent task-03 メタ「状態」が `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` | Phase 12 | `git diff` で確認 | `outputs/phase-12/system-spec-update-summary.md` |
| FR-1 | env schema 5 キー parse 動作 | Phase 4 / Phase 5 / Phase 9 | vitest pass | `outputs/phase-09/main.md` |
| FR-2 | wrangler.toml staging / production vars | Phase 5 | `git diff apps/web/wrangler.toml` | `outputs/phase-05/main.md` |
| FR-3 | secret 投入完了 | Phase 11 / Step 5 | `cf.sh secret list` name 表示 | `outputs/phase-11/evidence/secret-list-staging.log` |
| FR-4 | curl 200（AC-7-R1 と同） | Phase 11 / Step 7 | 同上 | 同上 |
| FR-5 | server / browser event 受信（AC-7-R2/R3 と同） | Phase 11 / Step 7 | 同上 | 同上 |
| FR-6 | grep gate（AC-4-R1/R2 と同） | Phase 11 / Step 8 | 同上 | 同上 |
| FR-7 | 状態昇格（AC-V と同） | Phase 12 | 同上 | 同上 |
| NFR-1 | DSN 漏洩なし | Phase 11 / Phase 13 | rg + screenshot 確認 | `outputs/phase-11/evidence/dsn-leak-scan.log` |
| NFR-2 | 1Password item で env 分離 | Phase 5 / Step 5 | item 名確認 | runbook log |
| NFR-3 | G1〜G5 段階承認 | Phase 11 | timestamp 記録 | `outputs/phase-11/main.md` |
| NFR-4 | runtime evidence は本サイクル外で実施 | Phase 13 | この仕様書のみで commit、実 evidence は別 PR | PR meta |

## マトリクス充足判定

全 AC / FR / NFR に検証手段と evidence path が割り当てられている。Phase 11 完了時点で全行が PASS していることが本ワークフローの完了条件。
