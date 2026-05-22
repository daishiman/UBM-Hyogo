# Phase 1: 要件定義 / live wiring SSOT 確定 / GO 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| Source | `outputs/phase-1/phase-1.md` |
| 区分 | 設計（実装なし。salt rotation / fingerprintVersion またぎ / retry-after / 永続化選定の SSOT を確定） |
| 想定所要 | 0.5 人日 |

## 目的

Issue #516 の fixture-only correlation engine を Cloudflare Worker 上で live wiring する際の前提条件を確定する。親タスクで「salt rotation 手順」「fingerprintVersion またぎ運用」が後追いで Phase 8 governance に追加された手戻りを再発させないため、本 Phase で以下 5 点を SSOT として固定する: ①live wiring 固有の salt rotation 手順、②fingerprintVersion 1 → 2 またぎ運用、③Cloudflare Worker scheduled handler の `Retry-After` 制約方針、④D1 vs R2 永続化の選定、⑤internal token authz 仕様の前提。

## 実行タスク

1. **live wiring 固有の salt rotation 手順 SSOT 化**
   - `AUDIT_CORRELATION_SALT` は `bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT --config apps/api/wrangler.toml --env <staging|production>` で per-env に投入する。値の正本は 1Password `op://CloudflareSecurity/AuditCorrelationSalt/value`（per-env 別 item）。
   - rotation 手順: ①新 salt を 1Password に登録 → ②`scripts/cf.sh secret put` で staging に投入 → ③staging で 1 cron cycle（最低 15 分）dry-run → ④production に投入 → ⑤旧 salt 期間の finding は `fingerprintVersion` で識別可能なため、過去 finding の hash は再計算しない（不可逆受容）。
   - rotation 中は新旧 salt を同時運用しない（cron 2 回連続実行で hash 不一致 finding が発生し誤検知が増えるため）。

2. **fingerprintVersion またぎ運用 SSOT 化**
   - 現在の `FingerprintVersion` は `1` 固定（`apps/api/src/audit-correlation/types.ts` 参照）。本タスクでは値変更しない。
   - またぎ発生条件: hash algo 変更 / 入力組合せ変更 / salt namespace 変更のいずれか。本タスクでは algo/入力/namespace いずれも変更しないため version は `1` のまま。
   - D1 `audit_correlation_findings.fingerprint_version` 列に常に `1` を保存し、将来 version=2 に上げる際は別 follow-up で旧 version row との突合 SQL を runbook 化する（本タスク範囲外、runbook に「将来 version=2 に上げる際の手順」のみ追記）。
   - 旧 fingerprint と新 fingerprint の incident 突合は本タスクではサポートしない（FU-03 の責務）。

3. **Cloudflare Worker scheduled handler の `Retry-After` 制約方針**
   - Cloudflare Worker の `scheduled` handler は同期的 sleep が制限されており、`Retry-After` 指定の長時間 backoff は完了せずに timeout する。
   - 本タスク方針: GitHub `429` 応答時は親実装の `fetchGitHubAuditEvents` 内 exponential backoff（最大 3 回 / `baseBackoffMs` 既定値）に閉じる。3 回失敗時は throw して当該 cron cycle を失敗で終了させ、**次の cron cycle（15 分後）に持ち越す**。`setTimeout` での長時間待機 / 持続接続を作らない。
   - `wrangler.toml` の `[triggers] crons = ["*/15 * * * *"]` は本制約を前提とする（最大失敗継続時間 = 45 分 = 3 cron cycle 失敗）。
   - `ctx.waitUntil()` で persist / Slack 通知の非同期完了を保証するが、handler 自身は GitHub fetch 完了後すぐに return して invocation budget を圧迫しない設計とする。

4. **D1 vs R2 永続化選定**

   | 観点 | D1 | R2 |
   | --- | --- | --- |
   | 想定書き込み頻度 | 15 分 / 1 cron × 数件〜数十件 finding | 同左 |
   | 想定保持期間 | 90 日（incident 振り返り目的） | 90 日以上（オブジェクト保管） |
   | クエリ性能 | severity / fingerprint_hash_prefix で WHERE 検索 ◎ | object listing のみ △ |
   | 既存資産 | `apps/api` で D1 binding 既設 / migrations フロー既存 | R2 binding は未設定 |
   | redact-safe insert の検証容易性 | SQL row 単位で grep gate 適用容易 | object byte 列に対する grep gate 必要 |

   **判断: D1 を採用**。理由 = ①incident 振り返りで severity / fingerprint で絞った検索が必要、②`apps/api` 既存 D1 binding / migrations 資産を活用可能、③grep gate を row 単位で適用しやすい、④15 分 / 数件〜数十件の書き込み頻度は D1 free tier 上限（5M row writes/日）に対し十分余裕。

5. **internal token authz 仕様の前提**
   - `POST /internal/audit-correlation/run` は `Authorization: Bearer <AUDIT_CORRELATION_INTERNAL_TOKEN>` を必須とする。token 値は 1Password `op://CloudflareSecurity/AuditCorrelationInternalToken/value`（per-env 別 item）の正本のみで管理。
   - `getEnv(c).AUDIT_CORRELATION_INTERNAL_TOKEN` と request header の比較は **timing-safe 比較**（長さチェック後に `crypto.subtle` または定数時間比較）で実装する。`===` 直接比較は禁止。
   - 401 応答 body に token の prefix / length を出さない。`{ "error": "unauthorized" }` のみ返す。
   - scheduled handler は同一 entry `runCorrelation()` を呼ぶが、scheduled invocation には internal token を要求しない（Worker 内部の `scheduled` event は外部認証経路を通らない）。route 経由のみ token 検証する。

6. **GO/NO-GO 判定**
   - GO 条件: 上記 5 項目（salt rotation 手順 / version またぎ / retry-after 方針 / 永続化選定 / internal token 仕様）が文書化され、Phase 2 アーキテクチャ設計に進める状態。
   - NO-GO 条件: ①salt rotation 手順に新旧同時運用が混入、②`Retry-After` 長時間 sleep を許容してしまう、③D1 / R2 のいずれにも grep gate が適用できない、④internal token を timing-safe 比較しない。

## 変更対象ファイル

本 Phase は設計のみで実装ファイル変更なし。次フェーズ以降の前提を `outputs/phase-1/phase-1.md` に記録する。

## 入出力・副作用

- 入力: 親 #516 の `apps/api/src/audit-correlation/{types,redact,correlate,github-fetch}.ts` の既存契約 / 起票元仕様 / CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」。
- 出力: `outputs/phase-1/phase-1.md`（決定事項箇条書き）。
- 副作用: なし（ドキュメント生成のみ）。

## テスト方針

本 Phase はテストコード追加なし。後続 Phase 4 で本 Phase の決定（salt rotation 後の hash 連続性 / version=1 固定 / D1 redact-safe insert / internal token timing-safe 比較）を契約テスト化する。

## ローカル実行・検証コマンド

```bash
# 1Password の正本 item 存在確認（値は表示しない）
op item get AuditCorrelationSalt --vault CloudflareSecurity > /dev/null && echo OK
op item get AuditCorrelationInternalToken --vault CloudflareSecurity > /dev/null && echo OK
op item get GitHubAuditPAT --vault CloudflareSecurity > /dev/null && echo OK
op item get SlackAuditIncidentWebhook --vault CloudflareSecurity > /dev/null && echo OK

# Cloudflare CLI ラッパー疎通
bash scripts/cf.sh whoami

# 親実装の存在前提確認
test -f apps/api/src/audit-correlation/correlate.ts && echo OK
test -f apps/api/src/audit-correlation/types.ts && echo OK
```

## 統合テスト連携

- Phase 2 はモジュール配置とデータフローを本 Phase の SSOT に整合させる。
- Phase 3 は internal token timing-safe 比較 / D1 schema / Slack payload schema を本 Phase の SSOT 上で確定する。
- Phase 4 は本 Phase の SSOT を契約テストとして実装（version=1 固定 / D1 redact-safe insert / internal token authz / Slack payload redact 検査）。

## 参照資料

- 起票元: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-01-live-audit-correlation-endpoint.md`
- index: `docs/30-workflows/issue-553-live-audit-correlation-endpoint/index.md`
- 親 Phase 1: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/phase-01.md`
- Cloudflare Workers Cron Triggers `wrangler.toml [triggers]`
- Cloudflare Workers `scheduled` handler / `ctx.waitUntil` 制約
- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」「`apps/api` env アクセス不変条件」

## 成果物

- `outputs/phase-1/phase-1.md` に以下を記録:
  - 決定事項 1: salt rotation 手順（per-env 投入順序 / 新旧同時運用禁止 / 過去 finding hash 再計算しない）
  - 決定事項 2: fingerprintVersion = `1` 固定（本タスクでは変更しない）/ 将来 version=2 突合は FU-03 範囲
  - 決定事項 3: Worker scheduled handler は同期 sleep 禁止、`429` は最大 3 回 backoff のみ、失敗は次 cron cycle に持ち越し
  - 決定事項 4: 永続化先 = D1（理由含む選定根拠）
  - 決定事項 5: internal token authz = `Authorization: Bearer` + timing-safe 比較、scheduled handler は token 不要
  - 決定事項 6: GO 判定根拠

## 完了条件（DoD）

- [ ] live wiring 固有の salt rotation 手順（per-env 投入順序・新旧同時運用禁止）が文書化されている。
- [ ] fingerprintVersion を本タスクで `1` 固定とすることと、version=2 へのまたぎが FU-03 の責務であることが明記されている。
- [ ] Cloudflare Worker scheduled handler の `Retry-After` 制約方針（最大 3 回 backoff / 次 cron cycle 持ち越し / 同期 sleep 禁止）が確定している。
- [ ] 永続化先を D1 とする選定根拠（書き込み頻度 / クエリ性能 / 既存資産 / grep gate 容易性）が表形式で記述されている。
- [ ] internal token authz が `Authorization: Bearer` + timing-safe 比較で、scheduled handler は token 不要である旨が明記されている。
- [ ] Phase 2 着手の GO 判定根拠が記載されている。
