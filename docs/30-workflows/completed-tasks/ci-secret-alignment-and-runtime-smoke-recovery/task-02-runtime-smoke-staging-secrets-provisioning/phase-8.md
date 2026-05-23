# Phase 8: リファクタリング判断（task-02 — smoke スクリプト本体は触らない）

| 項目 | 値 |
|------|----|
| 入力 | `phase-7.md` 結合テスト通過 |
| 出力 | リファクタリング不要の根拠 / 触らない理由 |

---

## 1. リファクタリング候補と判断

| 候補 | 採否 | 根拠 |
|------|------|------|
| `scripts/smoke/runtime-attendance-provider.sh` 内部の readiness 判定追加 | 不採用 | 不変条件 3。phase-2 §1.1 / §2.3 で workflow 側に置く合理性を結論済 |
| pre-check step のロジックを `scripts/ci/verify-staging-secrets.sh` として外出し | 不採用 | 4 件の `[ -z ... ]` 評価のみで複雑度が低い。外出しすると逆に YAML / shell の二重メンテになる |
| pre-check 対象 secret 名を YAML matrix 化 | 不採用 | 4 件固定で増減なし。可読性が下がる |
| `SLACK_WEBHOOK_INCIDENT` も pre-check 必須化 | 不採用 | phase-2 §3 で best-effort と決定済 |
| runbook を 2 ファイル（`secret-provisioning.md` + `rotation.md`）に分割 | 不採用 | rotation 手順は数行で本体 runbook §ローテーション運用 に内包できる |

---

## 2. smoke スクリプト本体を触らない理由（不変条件 3 の補強）

| # | 観点 | 詳細 |
|---|------|------|
| R-1 | スコープ境界 | 本 task は「readiness 不足を CI 上で明示 fail させる」。smoke 経路の動作変更は扱わない |
| R-2 | 影響範囲 | smoke スクリプトは production endpoint には未到達でも staging で参照されている。本 task の修正で smoke ロジックが動くことは禁忌 |
| R-3 | テスト負荷 | smoke スクリプトを触ると runtime 観測の差分検出範囲が広がり、本 task のテスト境界（pre-check 自体の動作）から逸脱する |
| R-4 | レビュー粒度 | workflow YAML 編集 + runbook 新規 のみであれば PR diff が小さく、レビュー / rollback が容易（phase-10 §3） |
| R-5 | 後続タスクとの分離 | smoke 経路の再設計が必要なら別 task として起票する（task-03+ で扱う） |

---

## 3. リファクタリングの保留事項（後続タスク向けメモ）

| 項目 | 状態 | 対応先 |
|------|------|-------|
| smoke スクリプトの引数 validation を共通化 | 保留 | 別 task |
| readiness gate を他 workflow（`web-cd.yml` 等）にも展開 | 保留 | task-01 完了後に統一指針として検討 |
| `gh secret set` の冪等化スクリプト | 保留 | 1Password CLI と整合させる必要があり、別 task |

---

## 4. リファクタリング不要の結論

本 task はリファクタリング対象なし。実装差分は **workflow YAML +18 行 + runbook 新規** のみ。phase-9 の品質ゲートに進む。
