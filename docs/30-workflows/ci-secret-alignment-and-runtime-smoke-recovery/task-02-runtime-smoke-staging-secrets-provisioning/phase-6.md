# Phase 6: 単体テスト / 静的検証（task-02）

| 項目 | 値 |
|------|----|
| 入力 | `phase-5.md` 実装完了 |
| 出力 | 静的検証ログ（`outputs/phase-11/evidence/yaml-syntax.log` / `grep-gate.log` 等の元データ） |

---

## 1. 静的検証スイート

| # | 検査 | コマンド | 期待 |
|---|------|---------|------|
| ST-1 | YAML 構文 | `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/runtime-smoke-staging.yml'))"` | exit 0 |
| ST-2 | pre-check step 件数 | `grep -c 'verify required staging secrets' .github/workflows/runtime-smoke-staging.yml` | `1` |
| ST-3 | actionlint | `pnpm dlx actionlint -color .github/workflows/runtime-smoke-staging.yml` | violation 0 |
| ST-4 | secret 実値 grep（docs 全体） | `grep -rE 'eyJ[A-Za-z0-9_-]{20,}\|sk_[A-Za-z0-9]{20,}\|hooks\.slack\.com/services/[A-Z0-9]{8,}' docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/` | 0 件（grep exit 1） |
| ST-5 | runbook 章立て | `grep -E '^## (目的\|必要 secret 一覧\|投入手順\|投入確認\|動作確認\|ローテーション運用\|禁止事項)' docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | 7 行 |
| ST-6 | 禁止事項に AI 言及 | `grep -F 'AI エージェントに' docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | 1 行以上 |
| ST-7 | smoke スクリプト不変 | `git diff origin/dev... -- scripts/smoke/runtime-attendance-provider.sh` | 空 |
| ST-8 | shellcheck（pre-check の run script 抜粋） | runbook 内の bash snippet を `shellcheck -s bash -` に流す（任意） | violation 0 |

---

## 2. 単体テスト方針

本 task は **shell の `[ -z ... ]` 評価 + GitHub Actions log annotation** が主役で、独立した unit test を書く合理性が薄い。代替として:

- **静的検証（§1）** で YAML / actionlint / grep gate を網羅。
- **runtime 観測**（phase-7 / phase-11）で失敗系・成功系を実 run で確認する。

→ unit test の追加は**実施しない**。

---

## 3. 実値混入 grep gate の根拠

### 3.1 検出対象パターン

| パターン | 例 | 意味 |
|---------|-----|------|
| JWT 形式（`eyJ` + 20+ base64url 文字） | （短い prefix のみ。20 文字以上の連続は記載しない） | JWT header の base64url prefix。bearer の典型形 |
| Stripe/Auth.js 系（`sk_` + 20+ 英数字） | （短い prefix のみ） | secret token の典型形 |
| Slack webhook（`hooks.slack.com/services/` + 8+ 大英数） | （path 部分は伏字） | Slack incoming webhook URL の path |

### 3.2 検出範囲

`docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/` 配下全体。runbook / spec / outputs を含む。

### 3.3 false positive 緩和

placeholder の `eyJ...` (3 文字 + `...`) は `{20,}` 量化子に達しないため検出されない。同じく `hooks.slack.com/services/...` の `...` も検出されない。これにより runbook に「形式の例」を書きつつ実値を書かない設計が両立する。

---

## 4. 静的検証ログの保存

すべての静的検証は CI 上ではなくローカル / PR の `Validate Build` job で完了させ、結果を `outputs/phase-11/evidence/` に下記名で保存する:

| ログ | 保存先 |
|------|--------|
| ST-1 出力 | `outputs/phase-11/evidence/yaml-syntax.log` |
| ST-3 出力 | `outputs/phase-11/evidence/actionlint.log` |
| ST-4 出力 | `outputs/phase-11/evidence/grep-gate.log` |

---

## 5. 通過条件

ST-1..ST-7 の全てが期待通り（ST-8 は任意）。1 件でも fail したら commit を進めず修正する。
