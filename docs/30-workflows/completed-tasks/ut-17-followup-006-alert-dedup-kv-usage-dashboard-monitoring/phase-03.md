# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## 1. 目的

Phase 1-2 の設計を 3 系統（システム / 戦略・価値 / 問題解決）レビューで検証し、Phase 4 以降の実装着手 GO/NO-GO を確定する。

## 2. 入力

- `outputs/phase-01/requirements.md`
- `outputs/phase-01/kv-metric-availability.md`
- `outputs/phase-02/policy-design.md`
- `outputs/phase-02/schema-extension.md`
- `outputs/phase-02/staging-rollout-plan.md`
- `outputs/phase-02/review-checklist.md`

## 3. 成果物

| パス | 種別 | 内容 |
| --- | --- | --- |
| `outputs/phase-03/design-review.md` | 新規 | レビュー結果（観点別判定・GO/NO-GO）|
| `outputs/phase-03/alternatives-rejected.md` | 新規 | 棄却した代替案（Dashboard UI 手動 / Terraform / GraphQL pull）と棄却理由 |

## 4. レビュー観点

### 4.1 システム系

- IaC schema 拡張が既存 5 policy を壊さないこと（後方互換）
- `scripts/cf.sh alerts apply` の順序（webhook → policy）が KV policy 追加でも維持されること
- API Token scope 分離が崩れないこと（read-only CI で diff 可能）
- staging / production 双方の wrangler.toml に `ALERT_DEDUP_KV` binding が存在することの再確認

### 4.2 戦略・価値系

- 閾値設定が「過剰通知」「沈黙取りこぼし」の中庸か
- baseline 取得期間（最低 5 営業日）が運用負担として妥当か
- 既設 `ut-17-relay` webhook の発火頻度上限を侵害しないか（KV alert が頻発した場合のシナリオ）

### 4.3 問題解決系

- Cloudflare API が namespace filter をサポートしない場合の fallback 設計が明文化されているか
- `enabled: false` 初期 apply → `true` 再 apply の 2 段階運用で `apply --yes` 冪等性が保たれるか
- followup-005（KV error metrics）との責務境界が明確か

## 5. 判定基準

| 判定 | 条件 |
| --- | --- |
| GO | 全観点で blocker なし、4 条件評価で正の効果 > 負の副作用 |
| CONDITIONAL GO | namespace filter 不可だが「Account 全体に対する集計でも実用上問題なし」と判断できる場合 |
| NO-GO | namespace filter 不可かつ Account 内に複数 KV namespace が存在し誤通知不可避な場合 → GraphQL pull 監視へ pivot（別 follow-up 起票推奨） |

## 6. 関連変更ファイル

なし（レビュー文書のみ生成）

## 7. 完了条件 (DoD)

- [ ] `design-review.md` に 3 系統 × 9 観点の判定（GO/CONDITIONAL/NO-GO）が表で記録されている
- [ ] 総合判定が記録されている
- [ ] NO-GO の場合、別 follow-up タスク起票案が `alternatives-rejected.md` に提示されている
- [ ] CONDITIONAL GO の場合、Phase 5 で実装する制約条件（例: namespace filter なしを runbook で明示）がリスト化されている

## 8. 検証コマンド

なし（思考成果物）
