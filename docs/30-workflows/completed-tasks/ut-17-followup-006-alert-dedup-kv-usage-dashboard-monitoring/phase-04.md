# Phase 4: タスク分解

[実装区分: 実装仕様書]

## 1. 目的

Phase 5-12 の実装作業を独立サブタスク単位で分解し、並列実行可能なものと直列依存があるものを明示する。CONST_007 に従い全サブタスクは今回サイクル内で完了させる。

## 2. 入力

- `outputs/phase-03/design-review.md`（GO 判定）
- `outputs/phase-02/policy-design.md`
- `outputs/phase-02/quota-base-diff.md`
- `outputs/phase-02/schema-extension.md`

## 3. 成果物

| パス | 種別 | 内容 |
| --- | --- | --- |
| `outputs/phase-04/task-breakdown.md` | 新規 | サブタスク T1-T8 の責務・依存関係・並列可否 |

## 4. サブタスク

| ID | 名称 | 主担当ファイル | 依存 | 並列可 |
| --- | --- | --- | --- | --- |
| T1 | `quota-base.json` への KV quota 追加 | `infra/cloudflare-alerts/quota-base.json` | なし | T2-T4 と並列可 |
| T2 | KV policy JSON 作成（`workers-kv-writes-per-day.json` 他） | `infra/cloudflare-alerts/policies/workers-kv-*.json` | Phase 1-2 結論 | T1 と並列可 |
| T3 | schema 拡張（必要時のみ） | `infra/cloudflare-alerts/schema/policy.schema.json` | Phase 2 結論 | T1-T2 と並列可 |
| T4 | lib 側 canonicalize / api-client 適合確認 | `infra/cloudflare-alerts/lib/canonicalize.ts` / `api-client.ts` | T3 | T5 へ直列 |
| T5 | テスト追加（load / canonicalize / diff / api-client） | `infra/cloudflare-alerts/lib/__tests__/*.spec.ts` | T1-T4 | 単一 PR 内直列 |
| T6 | README 更新（policy 一覧表） | `infra/cloudflare-alerts/README.md` | T1-T2 | T7 と並列可 |
| T7 | runbook 更新 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | T1-T2 | T6 と並列可 |
| T8 | staging apply + 擬似発火 evidence | （実行のみ・コード変更なし） | T1-T6 完了 | 直列・user 承認後 |

## 5. ブロッカー判定

- T2/T3 は Phase 1 で KV alert_type が確定していないと着手不能 → Phase 1 NO-GO ならタスク全停止
- T8 は user 承認必須（staging Cloudflare API 書き込み + Slack staging チャネル疑似発火）

## 6. 完了条件 (DoD)

- [ ] サブタスク T1-T8 が責務・依存・並列可否で表化されている
- [ ] CONST_007 違反（先送り）が無いことを確認する一文が記録されている
- [ ] T8 の user-gated 性質が明示されている
