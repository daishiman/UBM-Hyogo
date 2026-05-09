# Phase 3: 設計 / production smoke スクリプト設計 / API URL 切替 / redact filter 拡張 / session 注入方式

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| Source | `outputs/phase-3/phase-3.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

production smoke 実行スクリプトの設計を確定する。具体的には:

- 既存 staging smoke スクリプトとの差分（API URL 切替 / redact filter 拡張 / session 注入）
- `PRODUCTION_API_URL` / `STAGING_API_URL` 取り違え検出 guard の関数シグネチャ
- redact filter の production 固有 pattern（`cf-ray` / `__Secure-*` / OAuth token / magic link / email / fullName）の正規表現
- session 注入方式 `read -s` + 直後 curl + `unset` パターンの bash 実装
- DI-bound evidence summary を抽出する jq filter の構造

## 実行タスク

詳細は `outputs/phase-3/phase-3.md` を正本とする。要点:

- スクリプト構成（entrypoint `run-smoke.sh` + helper `lib/api-url-guard.sh` / `lib/evidence-summary.sh` + filter `redact-filter-production.sh`）の設計
- `api-url-guard.sh` の guard 関数: `PRODUCTION_API_URL` が `^https://api\.<production-domain>` にマッチすること、`STAGING_API_URL` 値と等しくないことを検証し、不一致時 `exit 1`
- `redact-filter-production.sh` の sed/perl pipeline: staging filter の継承 + production 固有値（`cf-ray: [a-f0-9-]+` / `__Secure-[A-Za-z0-9_-]+=[^;]+` / OAuth state / magic link token / `<localpart>@` の局所部 / `"fullName":"[^"]+"`）を全て placeholder に置換
- session 注入: `read -s -p "session: " SESSION_COOKIE; trap 'unset SESSION_COOKIE' EXIT; curl ... -H "Cookie: $SESSION_COOKIE" | redact-filter-production.sh | jq <evidence-summary>`
- evidence-summary jq filter: `{endpoint, status, attendance_type: (.attendance | type), attendance_length: (.attendance | length? // null), top_keys_count: (keys | length)}` 形式で body 値を一切残さない
- error handling（HTTP 非 200 時の abort / redact filter hit 時の immediate fail）

## 統合テスト連携

Phase 4 で fixture（dummy production response）を使った dry-run test、Phase 10 で shellcheck / redact filter 0-hit assertion を実装する。Phase 11 で実 production を叩く際の guard が本 phase の設計に沿っていることを runbook（Phase 8）で gate する。

## 参照資料

- 既存 staging smoke スクリプト（`apps/api/scripts/runtime-smoke/`）
- `outputs/phase-1/phase-1.md`（不可侵条件）
- `outputs/phase-2/phase-2.md`（binding 差分 / endpoint surface）

## 成果物

- `outputs/phase-3/phase-3.md`

## 完了条件

- production smoke 4 スクリプトの関数シグネチャ・正規表現・jq filter・session 注入パターンが確定し、Phase 5-7 の実装が本 phase の設計のみを参照すれば足りる粒度で記述されている。
