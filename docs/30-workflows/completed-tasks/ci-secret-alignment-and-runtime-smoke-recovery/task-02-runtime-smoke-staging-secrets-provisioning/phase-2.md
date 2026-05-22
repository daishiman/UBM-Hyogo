# Phase 2: 設計レビュー（task-02 — readiness gate 配置と棄却案）

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` 確定 |
| 出力 | pre-check step の配置設計 / 棄却案の根拠 |

---

## 1. 設計方針: pre-check step を **workflow 側** に置く

`scripts/smoke/runtime-attendance-provider.sh` の中で readiness 判定するのではなく、`runtime-smoke-staging.yml` の job 序盤（`mask staging credentials` step の **直前**）に pre-check step を置く。

### 1.1 採用理由

| # | 観点 | workflow 側に置くと | smoke スクリプト内に置くと |
|---|------|---------------------|----------------------------|
| 1 | 早期 fail | ジョブ序盤で exit 1。setup / install / build を経る前に止まる | smoke 実行直前まで進む |
| 2 | runner ログに必要 secret 名 | `::error::` で `staging-runtime-smoke` env 名と不足 secret 名を runner ログに直接残せる | スクリプト stderr に依存。workflow ログでは混在する |
| 3 | env 名の明示 | `gh secret set <NAME> --env staging-runtime-smoke` を逐語で案内できる | スクリプト側からは env 名を知らない（job 環境変数として注入されるのみ） |
| 4 | smoke スクリプト本体 | 変更しない（不変条件 3 を満たす） | 変更必要 |
| 5 | 再現性 | workflow 単位で grep `verify required staging secrets` で gate 存在を機械検証可 | smoke スクリプト内部実装に依存 |

### 1.2 配置位置

```
jobs.smoke.steps:
  - actions/checkout            # 既存
  - verify required staging secrets   # ← 新規。mask credentials の直前
  - mask staging credentials    # 既存
  - run runtime smoke           # 既存
  - redaction grep gate         # 既存
  - upload evidence             # 既存
  - post failure summary to Slack # 既存（failure + summary artifact がある時のみ）
```

`mask staging credentials` の **直前** に置く理由: mask 自体は値が空でも失敗しないため、空のまま下流に進む余地を残してしまう。pre-check で空を検出し exit 1 するのが最短経路。

---

## 2. 棄却案

### 2.1 棄却 A: smoke スクリプトに implicit fail を残す

現状の `STAGING_API_BASE: STAGING_API_BASE is required` のまま、workflow 側を変えない案。

| 棄却理由 |
|---|
| runner ログに env 名 (`staging-runtime-smoke`) が出ず、解析者がスクリプトを読みに行かないと修正経路が分からない |
| 不足 secret が複数あるとき、最初の 1 件しか報告されない |
| 将来 smoke スクリプトに skip 分岐が混入したとき「PASS のように見える skip」を生む余地（不変条件 4 違反リスク） |

### 2.2 棄却 B: `workflow_call` 化して readiness 不足時に skip

`if: ${{ secrets.STAGING_API_BASE != '' }}` 等で job 自体を skip させる案。

| 棄却理由 |
|---|
| skip した job は GitHub UI 上 success 扱いとなり、PASS のように見える skip を生む（不変条件 4 違反） |
| solo 運用で誰も気付かないまま「ずっと smoke 実行されない」状態が継続するリスク |
| readiness 不足は「設定ミス」であり、設定ミスは明示 fail させて修正させるべき |

### 2.3 棄却 C: smoke スクリプト内に readiness gate を追加

`scripts/smoke/runtime-attendance-provider.sh` の冒頭に env 4 件の存在確認を入れる案。

| 棄却理由 |
|---|
| 不変条件 3（smoke スクリプト本体は触らない）違反 |
| §1.1 の観点 2-3（env 名の明示・runner ログの分かりやすさ）で workflow 側に劣る |
| 後続タスク（task-03..）で smoke スクリプトを再設計する場合、readiness gate も巻き込まれて移動する保守負荷 |

---

## 3. SLACK_WEBHOOK_INCIDENT を pre-check 必須対象から外す根拠

既存 `runtime-smoke-staging.yml` の通知 step は `failure() && hashFiles('ci-evidence/summary.json') != ''` の時だけ走る。つまり、pre-check で `ci-evidence/summary.json` が作られない失敗では Slack 通知 step 自体が実行されない。summary artifact 作成後の failure では `SLACK_WEBHOOK_INCIDENT` を fail-closed で要求する。

```yaml
- name: post failure summary to Slack
  if: ${{ failure() && hashFiles('ci-evidence/summary.json') != '' }}
  env:
    SLACK_WEBHOOK_INCIDENT: ${{ secrets.SLACK_WEBHOOK_INCIDENT }}
  run: |
    if [ -z "${SLACK_WEBHOOK_INCIDENT:-}" ]; then
      echo "::error::SLACK_WEBHOOK_INCIDENT is required for failure notification"
      exit 1
    fi
    bash scripts/smoke/ci-summary-post.sh ci-evidence
```

`SLACK_WEBHOOK_INCIDENT` は smoke 本体を始めるための必須 4 secret ではないため、pre-check 対象には含めない。一方で failure summary を Slack に送る段階では必須であり、runbook と helper は 5 secret inventory として投入・確認する。

---

## 4. 設計上の不変条件（実装計画の前提）

| # | 条件 | 担保方法 |
|---|------|---------|
| C-1 | secret 実値が docs / コミットに残らない | grep gate（phase-6 §3） |
| C-2 | smoke スクリプト本体は変更しない | inventory の対象外 / phase-3 §1 で逐語確認 |
| C-3 | pre-check step は idempotent（再実行で同結果） | 純粋に `[ -z ... ]` 評価のみ。副作用なし |
| C-4 | mask credentials の前に pre-check が走る | step 順序（phase-5 §1 で図解） |
| C-5 | `::error::` 出力は GitHub Actions log annotation 仕様準拠 | `::error::<message>` フォーマット使用 |

---

## 5. レビュー結論

採用案: **workflow 側に `verify required staging secrets` pre-check step を `mask staging credentials` の直前に配置**。`SLACK_WEBHOOK_INCIDENT` は既存 if-failure guard に委ねる。smoke スクリプト本体は不変。
