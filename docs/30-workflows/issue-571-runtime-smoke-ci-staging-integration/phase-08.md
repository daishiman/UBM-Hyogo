# Phase 8: DRY 化 — issue-571-runtime-smoke-ci-staging-integration

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 8 / 13 |
| 入力 | Phase 5 実装ランブック |
| 出力 | `outputs/phase-08/main.md`（重複検出 / 共通化判定 / 共通化しない判断根拠） |

## 目的

Phase 5 で追加・編集する成果物の **重複・類似コード**を洗い出し、共通化すべき箇所と共通化しない（KISS）箇所を判断根拠付きで確定する。

## 検出対象

### D-1. redact 処理の重複

| 場所 | 用途 |
| --- | --- |
| `scripts/smoke/redact.sh` | smoke runner 出力の redact |
| `scripts/smoke/ci-summary-post.sh` | Slack post message の redact |
| `.github/workflows/runtime-smoke-staging.yml` redaction grep step | grep gate（detect のみ、redact しない） |

**判定**: `ci-summary-post.sh` 内では `redact.sh` を **shell function ではなく外部スクリプトとしてパイプで呼ぶ**（`cat summary.json | bash scripts/smoke/redact.sh`）。重複コードを書かず、redact 規則を 1 か所（`redact.sh`）に集約する。

### D-2. 必須 env チェック

| 場所 | 用途 |
| --- | --- |
| `runtime-attendance-provider.sh` 冒頭 `:"${VAR:?...}"` 群 | 5 変数の存在チェック |
| `ci-summary-post.sh` の `SLACK_WEBHOOK_INCIDENT` チェック | 1 変数 |

**判定**: 1 行 `:"${VAR:?...}"` のみで完結する程度の重複は **共通化しない**（KISS）。共通 helper を作ると逆に可読性が下がる。

### D-3. exit code 規約

| 場所 | exit code |
| --- | --- |
| `runtime-attendance-provider.sh` | 0 / 1 / 2 |
| `ci-summary-post.sh` | 0 / 1 / 2 |

**判定**: 規約は両 script で共通（0=success, 1=domain failure, 2=usage/env error）にし、各スクリプト冒頭コメントに記す。**コード共通化はしない**（規約合意のみ）。

### D-4. workflow YAML の secret env 列挙

`runtime-smoke-staging.yml` の `env:` で 5 個の secret を列挙する箇所と、smoke step / Slack step で env 参照する箇所が分散。

**判定**: GitHub Actions の `env:` は job 単位で 1 か所に集約しているため重複なし。`::add-mask::` も 1 step に集約済み。**追加共通化しない**。

### D-5. ADR の評価表フォーマット

ADR 2 本（secret-injection / required-status-check）はいずれも「観点 × 案 × 採用判定」表を持つ。

**判定**: ADR 内容は別物（secret 注入経路 vs required check 昇格）のため **テンプレ化はしない**。フォーマット類似は OK（人間レビュー時の認知負荷を下げる）。

### D-6. 既存 `scripts/cf.sh` との関係

`runtime-attendance-provider.sh` は `cf.sh` を **使わない**（curl のみ）。`cf.sh` は wrangler ラッパーであり、CI 上の `gh` / `actions/checkout` だけで成立する smoke runner には不要。

**判定**: `cf.sh` を流用しない方針を維持（既存 issue-531 と整合）。

## 共通化サマリー

| ID | 共通化判定 | 根拠 |
| --- | --- | --- |
| D-1 | YES（redact.sh 流用） | redact 規則を 1 か所に集約 |
| D-2 | NO | 1 行で済む程度。共通化で可読性低下 |
| D-3 | 規約のみ共通 | コード共通化は不要 |
| D-4 | NO | YAML 内で既に 1 か所 |
| D-5 | NO | ADR 内容が別物 |
| D-6 | NO | smoke runner と CLI ラッパーの責務が異なる |

## 検証コマンド

```bash
SPEC_DIR=docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration
grep -q "D-1\|D-6" "$SPEC_DIR/outputs/phase-08/main.md"
# redact 重複が無い（redact 文字列が ci-summary-post.sh に直接書かれていないこと）
! grep -q '\[REDACTED\]' scripts/smoke/ci-summary-post.sh 2>/dev/null || echo "WARN: redact 直書き疑い"
```

## 完了条件（DoD）

- [ ] D-1〜D-6 の判定が確定
- [ ] redact 規則の重複が排除（D-1 = `redact.sh` パイプ流用）
- [ ] 過剰共通化していないことを判断根拠付きで明示
