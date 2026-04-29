# Lessons Learned — UT-06-FU-H D1 Health Endpoint (Phase 12 close-out)

> 2026-04-29 新規作成: UT-06-FU-H `GET /health/db` 実装の苦戦箇所を分離記録する。`lessons-learned-current-2026-04.md` への直接追記は L-UT06-001〜005 と責務が重なるため避け、follow-up 個別ファイルに分離する。
> 関連: `references/api-endpoints.md`（§UBM-Hyogo Health API）/ `references/environment-variables.md`（§HEALTH_DB_TOKEN）/ `docs/00-getting-started-manual/specs/01-api-schema.md`（§API health contract）/ `docs/30-workflows/ut-06-followup-H-health-db-endpoint/`
> 出典: `docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-12/`（implementation-guide / system-spec-update-summary / unassigned-task-detection / skill-feedback-report）

---

## L-HDBH-001: timing-safe 比較で `===` を使わない（user-controlled secret 比較の鉄則）

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | security / authentication / side-channel |
| 症状       | `presented === expected` を使うと文字列比較の早期 return で生じる時間差が caller に観測可能になり、token 推測攻撃の助けになる |
| 原因       | JavaScript の `===` は短絡評価で、最初の不一致 byte で抜ける。Node.js の `crypto.timingSafeEqual` は Cloudflare Workers の Edge runtime で使えないケースがある |
| 解決策     | length XOR + bitwise OR-accumulate で全 byte を必ず走査する自前 `timingSafeEqual(a, b)` を `apps/api/src/index.ts` に置く。`a.length ^ b.length` を mismatch 初期値に設定し、`b.length` 全長で `charCodeAt` の XOR を OR で蓄積する |
| 再発防止   | `health-db.test.ts` に短い token / 長い token / 完全一致 / 1 byte だけ違う token の 4 ケースを必ず置く。Workers 環境で `crypto.subtle.timingSafeEqual` が GA になるまでは自前実装を canonical にする |
| 関連タスク | UT-06-FU-H / Phase 02 擬似コード / Phase 12 implementation-guide Part 2.3 |

## L-HDBH-002: 401 / 403 の責務分離（WAF 外側 vs アプリ内側）

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | security / boundary design / Cloudflare WAF |
| 症状       | アプリ内で IP allowlist と rate limit を実装すると、WAF と二重判定になり、誤って 401 と 403 を取り違えるバグが起きる |
| 原因       | Cloudflare の構成では WAF allowlist / rate limit が Worker 到達前に発火する。Worker は「allowlist を通過した呼び出し」だけを見る前提で組むのが正しい |
| 解決策     | Worker は token 一致のみを判定し、token 欠落 / 不一致は **必ず 401**。WAF 外側 / rate limit block は **403**（Cloudflare WAF response そのまま）を返す。両者を 1 つのハンドラで再現しないこと |
| 再発防止   | API spec の status table に「WAF 外側 / rate limit」行を独立で書く。runbook（operator-runbook.md §3）でも WAF 設定と Worker 設定の責務境界を明記する |
| 関連タスク | UT-06-FU-H / Phase 12 system-spec-update-summary / `docs/00-getting-started-manual/specs/01-api-schema.md` §API health contract |

## L-HDBH-003: 503 fail-closed と Retry-After: 30 の不変条件

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | reliability / health endpoint / monitoring contract |
| 症状       | `HEALTH_DB_TOKEN` 未設定 / D1 binding 欠落 / `SELECT 1` 失敗を別 status で返すと、UptimeRobot や Cloudflare Analytics の閾値設定が分裂し、誤検知 / 見逃しの両方が起きる |
| 原因       | health endpoint は「DB が叩ける状態か」を二値で返す契約。token 未設定でも DB に触らずに 503 を返すべきで、500 系の internal error と混在させない |
| 解決策     | `HEALTH_DB_TOKEN` 未設定時は **DB に触らず 503 + `Retry-After: 30`** を返す（fail-closed）。D1 失敗時も同じ 503 + `Retry-After: 30`、body は `{ ok: false, db: "error", error: <Error.name> }` で揃える。`Error.name` のみ露出し `Error.message` は出さない |
| 再発防止   | `health-db.test.ts` に「token 未設定 → DB.prepare は呼ばれない」の spy assertion を必ず置く。`Retry-After: 30` の値は UT-08 monitoring の閾値と整合させ、変更時は両方更新する |
| 関連タスク | UT-06-FU-H / UT-08 monitoring-alert / Phase 02 擬似コード / Phase 12 implementation-guide Part 2.3 |

## L-HDBH-004: HEALTH_DB_TOKEN rotation を Phase 12 close-out 時点で formalize する

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | secrets management / operations / rotation SOP |
| 症状       | 新規 secret を Cloudflare Secrets に投入しただけでは rotation 周期が運用に組み込まれず、漏洩疑い時の SOP も未定義になる |
| 原因       | Cloudflare Secrets の rotation は CI / cron では強制できず、人間オペレーター主導の SOP を別タスクで起票しないと忘れる |
| 解決策     | Phase 12 unassigned-task-detection.md で `HEALTH_DB_TOKEN` rotation SOP を **REQUIRED formalize 候補**として記録し、`docs/30-workflows/unassigned-task/task-ut-06-fu-h-health-db-token-rotation-001.md` に分離する。1Password `op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN` を正本、90 日 rotation、漏洩時即時 rotation を契約として明記 |
| 再発防止   | 新規 secret を `references/environment-variables.md` に追記する際、rotation 周期 / 1Password vault path / 漏洩時 SOP を 1 行で書けない場合は formalize task を Phase 12 と同 wave で起票する |
| 関連タスク | UT-06-FU-H / `docs/30-workflows/unassigned-task/task-ut-06-fu-h-health-db-token-rotation-sop-001.md`（canonical）/ `references/environment-variables.md` §Cloudflare Workers / Google Forms 同期 |

---

## 関連参照

- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` — UBM-Hyogo Health API（UT-06-FU-H）契約
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md` — `HEALTH_DB_TOKEN` 配置・rotation 方針
- `docs/00-getting-started-manual/specs/01-api-schema.md` — `GET /health/db` 200/401/403/503 契約
- `docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-12/operator-runbook.md` — token 生成 / Secret 投入 / WAF 設定 / smoke 手順
- `apps/api/src/index.ts` — `/health/db` ハンドラ + `timingSafeEqual` 実装
- `apps/api/src/health-db.test.ts` — 9 ケース（200 / 401 / 503 境界 + timing-safe 比較）
