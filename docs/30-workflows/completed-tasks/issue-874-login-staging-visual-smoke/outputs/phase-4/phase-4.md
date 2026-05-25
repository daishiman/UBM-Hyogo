**[実装区分: 実装仕様書]**

# Phase 4: テスト作成 / 実行コマンドと期待結果

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `runtime_pending` |
| 入力 | Phase 1-3 |

## 1. テストケース一覧

| TC ID | 種別 | 入力 | 期待結果 |
|---|---|---|---|
| TC-LOCAL-01 | local playwright | `PLAYWRIGHT_EVIDENCE_DIR` 未設定 / local dev server | `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-11/screenshots/` に既存 8 PNG が上書きされる（再生成） |
| TC-LOCAL-02 | local playwright (改修前 baseline 検証) | 改修前 spec を `--list` | `EVIDENCE_DIR` の path が変わらないことを目視確認 |
| TC-STAGING-01 | staging smoke (正常系) | `PLAYWRIGHT_STAGING_BASE_URL=<staging>` + `PLAYWRIGHT_EVIDENCE_DIR=<task path>` + `--project=staging` + `--grep 'renders LoginCard\|captures mobile input'` | `outputs/phase-11/staging-screenshots/` に 7 PNG (input / sent / unregistered / rules-declined / deleted / error / input-mobile) / 0 fail / 0 flaky |
| TC-STAGING-02 | staging smoke (cold start) | warm-up なしで一発実行 | 初回が `Timeout` or `goto failed` → warm-up 後再実行で PASS |
| TC-SHELL-01 | shell helper (引数なし) | `bash scripts/run-login-staging-smoke.sh` | stderr に usage、exit code 1 |
| TC-SHELL-02 | shell helper (env のみ) | `PLAYWRIGHT_STAGING_BASE_URL=https://example.workers.dev bash scripts/run-login-staging-smoke.sh` | playwright が `--project=staging` で起動 |
| TC-SHELL-03 | shell helper (引数優先) | `bash scripts/run-login-staging-smoke.sh https://arg.workers.dev` + `PLAYWRIGHT_STAGING_BASE_URL=https://env.workers.dev` | `arg.workers.dev` が採用される |
| TC-SHELLCHECK | shellcheck | `shellcheck scripts/run-login-staging-smoke.sh` | exit 0 / 0 finding |
| TC-PNG-SIZE | evidence size guard | `find outputs/phase-11/staging-screenshots -name '*.png' -size +500k` | 0 件 |
| TC-PNG-COUNT | evidence count guard | `find outputs/phase-11/staging-screenshots -name 'login-*.png' \| wc -l` | 7 |

## 2. 実行コマンド suite

### 2-1. local 互換性確認

```bash
cd apps/web
mise exec -- pnpm exec playwright test playwright/tests/login-smoke.spec.ts \
  --grep 'renders LoginCard|captures mobile input' \
  --reporter=line
# 期待: 親 workflow 配下に既存 PNG が再生成、exit 0
ls -la ../../docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-11/screenshots/
```

### 2-2. shell helper 引数 / env バリデーション

```bash
# 引数 / env なし → usage + exit 1
bash scripts/run-login-staging-smoke.sh
echo "exit_code=$?"  # 期待: exit_code=1

# env のみ
PLAYWRIGHT_STAGING_BASE_URL="https://ubm-hyogo-web-staging.example.workers.dev" \
  bash scripts/run-login-staging-smoke.sh

# 引数優先
bash scripts/run-login-staging-smoke.sh "https://ubm-hyogo-web-staging.example.workers.dev"
```

### 2-3. shellcheck

```bash
shellcheck scripts/run-login-staging-smoke.sh
# 期待: exit 0 / 0 finding
```

### 2-4. staging smoke 本実行（user-gated・Phase 11 で実施）

```bash
# (1) staging deploy
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

# (2) warm-up
STAGING_URL="https://ubm-hyogo-web-staging.example.workers.dev"
curl -sI "$STAGING_URL/login" | head -1
# 期待: HTTP/2 200

# (3) smoke
bash scripts/run-login-staging-smoke.sh "$STAGING_URL" 2>&1 \
  | tee docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-smoke.log
echo "exit_code=$?"  # 期待: exit_code=0

# (4) evidence 検証
find docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots \
  -name 'login-*.png' -type f | wc -l
# 期待: 7

find docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots \
  -name '*.png' -size +500k
# 期待: (空)
```

## 3. expected-result 表

| TC ID | exit code | stdout/stderr 期待 | 生成物 |
|---|---|---|---|
| TC-LOCAL-01 | 0 | `7 passed` (line reporter) | staging-target grep で local 既定 path に対象 7 PNG 再生成 |
| TC-STAGING-01 | 0 | `7 passed` | task path に 7 PNG |
| TC-SHELL-01 | 1 | stderr: `Usage: ...` | なし |
| TC-SHELL-02 | playwright 結果に従う | `--project=staging` 起動 log | task path に PNG |
| TC-SHELLCHECK | 0 | (空) | なし |
| TC-PNG-SIZE | - | - | 0 件 |
| TC-PNG-COUNT | - | `7` | - |

## 4. fail 時のトリアージ手順

| 症状 | 1 次切り分け | 2 次対応 |
|---|---|---|
| TC-LOCAL-01 で path が変わった | spec の env-override 既定値式を確認 | `process.env.PLAYWRIGHT_EVIDENCE_DIR` の truthy 判定漏れを修正 |
| TC-STAGING-01 で 7 未満 | `--reporter=line` log で fail state を特定 | mock route 不整合 / cookie 未設定なら spec の state setup を確認（Phase 5 §1 と連動） |
| TC-STAGING-02 で timeout | warm-up 不足 | `curl` で 200 が返るまで wait（最大 60 sec）した後再実行 |
| TC-SHELL-01 で exit 0 | 引数 / env 空判定漏れ | `[[ -z "$STAGING_URL" ]]` 条件と `: "${PLAYWRIGHT_STAGING_BASE_URL:-}"` の初期化を確認 |
| TC-SHELLCHECK で SC2086 | quoting 漏れ | `"$VAR"` を全展開箇所に追加 |
| TC-PNG-SIZE で >500KB の PNG | viewport 過大 / unrelated content 含む | spec の `clip` / `viewport` 設定を確認、必要なら最適化 |

## 5. evidence 配置先（Phase 11 で取得）

| evidence | path |
|---|---|
| local 互換ログ | `outputs/phase-11/evidence/local-compat.log` |
| shellcheck ログ | `outputs/phase-11/evidence/shellcheck.log` |
| staging smoke ログ | `outputs/phase-11/staging-smoke.log` |
| staging PNG | `outputs/phase-11/staging-screenshots/login-*.png` |
| 目視 diff メモ | `outputs/phase-11/evidence/visual-diff-note.md` |

## 6. テスト範囲（明示）

- **含む**: local 互換性 / shell helper 単体 / shellcheck / staging smoke / PNG 検証
- **含まない**: production 環境への smoke / 自動 pixel diff threshold / 他 route の visual smoke

## 7. Phase 4 完了条件

- [x] テストケース 10 件を列挙
- [x] 実行コマンド suite 4 ブロックを確定
- [x] expected-result 表を確定
- [x] fail 時のトリアージ手順を 6 種類記述
- [x] evidence 配置先を確定
- [x] テスト範囲を明示

## 8. 次 Phase への引き継ぎ

Phase 5 では本 Phase で確定したテストケースと実行コマンドを実装側から見た「実装ステップ」として再展開し、(a) spec 改修の正確な diff、(b) shell helper の最終形、(c) staging deploy 〜 smoke 実行までのチェーンを step-by-step で書き下す。
