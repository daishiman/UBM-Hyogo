# Phase 11: 視覚的検証（NON_VISUAL command evidence + Slack 着信 evidence）

[実装区分: 実装仕様書]

## 1. 目的

本タスクは NON_VISUAL（UI なし）だが、Phase 11 evidence は以下 2 系統で取得する:

1. **command evidence** — typecheck / lint / test / diff / apply の各 log（local + `--ci`）
2. **Slack 着信 evidence** — staging の検証用一時 policy または短時間負荷で `/internal/alert-relay` を通過し Slack staging チャネルに 1 件以上着信した記録

## 2. evidence canonical path

| カテゴリ | パス |
| --- | --- |
| typecheck | `outputs/phase-11/evidence/typecheck.log` |
| lint | `outputs/phase-11/evidence/lint.log` |
| test | `outputs/phase-11/evidence/test-alerts.log` |
| local diff | `outputs/phase-11/evidence/cf-alerts-diff.log` |
| CI diff | `outputs/phase-11/evidence/cf-alerts-diff-ci.log` |
| apply (1st/2nd) | `outputs/phase-11/evidence/alerts-apply.log` / `alerts-apply-2nd.log` |
| diff after apply | `outputs/phase-11/evidence/alerts-diff-after-apply.log` |
| Slack 着信 | `outputs/phase-11/evidence/slack-staging-delivery.md`（message URL or screenshot path）|
| alert-relay log | `outputs/phase-11/evidence/alert-relay-request.log` |
| KV baseline | `outputs/phase-11/evidence/kv-baseline.md`（短時間 smoke の観測値。5 営業日 baseline ではないことを明記）|

## 3. 擬似発火実行手順

Phase 10 Step 5 で選択した方式に従う。

### 3.1 方式 5a: 閾値極小化による発火

1. `infra/cloudflare-alerts/policies/workers-kv-writes-per-day.test.json`（テスト用一時 policy）を作成、`percentage: 0.001` / `enabled: true`
2. `apply --yes`（user 承認）
3. staging へ少量の KV write（healthcheck 経由でも可）→ 閾値を超えて発火
4. cf-webhook → `/internal/alert-relay` → Slack 着信を確認
5. テスト policy を削除し再 apply（冪等収束）
6. 本運用 policy は `enabled:false` に戻っていることを diff で確認

### 3.2 方式 5b: 負荷発火

1. `scripts/devops/kv-write-burst.sh`（Phase 7 で作成）で staging の `/internal/alert-relay` に重複 alert を多発させ、`ALERT_DEDUP_KV.put` を baseline 超過まで発生
2. 発火 → Slack 着信
3. 終了

## 4. 確認項目

- [ ] Slack staging チャネルに新 alert が日本語化整形済で 1 件以上届く
- [ ] `/internal/alert-relay` request ログに `cf-webhook-auth` 検証通過と Slack POST 2xx が記録される
- [ ] dedup window 内で 2 回目以降が抑止される（followup-002 の挙動維持確認）
- [ ] production 経路は無事象（policy 未適用のため 0 件着信、`enabled: false` のまま）

## 5. NON_VISUAL alternative evidence ルール準拠

UI なし NON_VISUAL タスクのため `references/phase-11-non-visual-alternative-evidence.md`（task-specification-creator skill）に従い:

- スクリーンショットの代替として log / message URL / API レスポンス JSON を保存
- placeholder log（`<dry-run>` のみで実行 evidence 無し）の PASS 化禁止
- evidence は tracked（`.gitignore` 対象外）の `.log` / `.md` を canonical とする

## 6. 完了条件 (DoD)

- [ ] §2 の evidence 9 種すべて取得済（NA があれば理由を `outputs/phase-11/evidence/skip-reasons.md` に明記）
- [ ] Slack 着信 evidence に message URL or screenshot path が記録されている
- [ ] dedup の 2 段階責務分離（Cloudflare → relay / relay → Slack）が観察記録に残っている
- [ ] kv-baseline 値が短時間 smoke の観測値として残り、5 営業日 baseline / `enabled:true` 本運用切替の根拠として誤用されないことが明記されている
