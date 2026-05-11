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

### 追記 (2026-05-11): grep gate 正規表現の self-test evidence

grep gate の正規表現自体が壊れていないこと（正例で hit、負例で hit しない）を機械検証する。次のコマンドを `outputs/phase-6/evidence/grep-gate-selftest.log` に保存する。

```bash
# 正例: ヒットするべき pattern を hit させる（shell 展開で実行時のみマッチ文字列を生成し、docs 本文には残さない）
echo "eyJ$(printf 'a%.0s' $(seq 1 25))" | grep -E 'eyJ[A-Za-z0-9_-]{20,}' && echo OK
# 負例: docs に残る placeholder はヒットしてはならない
echo 'eyJ.REDACTED.example' | grep -E 'eyJ[A-Za-z0-9_-]{20,}' || echo OK
```

> **注意**: 正例は意図的に shell 展開で生成する（`eyJ` の直後に `a` を 25 文字並べた文字列を実行時に作る）。これにより本 docs / phase-6.md 自身は QG-4 grep gate のパターンにマッチせず、self-test 例示と secret 漏洩検出を両立する。負例は `eyJ.REDACTED.example` のように `.` を含めることで `[A-Za-z0-9_-]` クラス外の文字を間に挟み、`{20,}` 量化子に到達しないように設計する。

期待:

- 正例: `eyJ` の後に `a` が 25 文字続いた合計 28 文字（`eyJ` + `a`×25）が出力され、続いて `OK` が出力される（exit 0）。期待文字列を docs に直書きすると本ファイルが grep gate に検出されてしまうため、長さで表現する。
- 負例: grep が hit せず `OK` のみが出力される（grep exit 1 を `||` で吸収）。

出力先: `outputs/phase-6/evidence/grep-gate-selftest.log`。本 self-test が失敗した場合は ST-4 の正規表現を修正してから commit に進む。

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
