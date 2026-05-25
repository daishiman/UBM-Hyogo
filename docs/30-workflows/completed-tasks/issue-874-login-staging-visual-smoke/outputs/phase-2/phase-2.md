**[実装区分: 実装仕様書]**

# Phase 2: 設計 / 設計判断 / 実装順序

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `runtime_pending` |
| 入力 | Phase 1 (`outputs/phase-1/phase-1.md`) |
| 出力 | 本ファイル + Phase 3 への入力 |

## 1. 設計判断 1: `playwright.config.ts` を改変せず spec 側で env-override する

### 判断

`playwright.config.ts` は **無改変** とし、`apps/web/playwright/tests/login-smoke.spec.ts` の `EVIDENCE_DIR` 定数のみ `PLAYWRIGHT_EVIDENCE_DIR` を参照する 1 行差分に変更する。

### 根拠

| 観点 | config 側で吸収 | spec 側で env-override（採用） |
|---|---|---|
| 既存 staging project | 既に存在し variable も読む global rule あり | 同左を活かす（重複定義回避） |
| 影響範囲 | 全 spec の出力先が変わるため他 visual spec の baseline 衝突リスク | `login-smoke.spec.ts` 1 ファイルだけが local default を維持しつつ staging 時は別 path |
| 既存契約 | 全 project の出力ルートを動かす副作用 | local 実行は完全に従来通り（local baseline 維持） |
| 後方互換 | 一律変更でテスト fixture 配置の再編が必要 | 1 行追加のみ（最小差分） |

### 既定値式

```ts
const EVIDENCE_DIR = process.env.PLAYWRIGHT_EVIDENCE_DIR
  ? resolve(process.env.PLAYWRIGHT_EVIDENCE_DIR)
  : resolve(process.cwd(), "../../docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-11/screenshots");
```

local 既定値文字列は **既存のものを 1 字も変えない**（baseline 互換）。`resolve` の import は既存。

## 2. 設計判断 2: shell helper の責務範囲（実行のみ・deploy 含めない）

### 判断

`scripts/run-login-staging-smoke.sh` は **smoke 実行と evidence 出力先固定のみ** を責務とする。staging deploy (`scripts/cf.sh deploy ...`) は helper に含めず、user が事前に明示実行する。

### 根拠

| 観点 | deploy 込み helper | smoke のみ helper（採用） |
|---|---|---|
| 失敗の局所性 | deploy fail と smoke fail が同一スクリプト内で混在 | deploy / smoke を別ステップにし、原因切り分けが容易 |
| 副作用範囲 | 自動 deploy が走り、user 不在で staging を書き換える可能性 | smoke は read-only（POST mint cookie 等は spec の責務）、副作用最小 |
| CI 化適合性 | deploy 権限を CI が持つ前提が必要 | 既存 deploy フロー（user-gated）と整合 |
| 再実行コスト | 不要な deploy が毎回走る | smoke 単独で何度でも再試行可 |

### 棄却した代替案

- **案 A**: helper 内に `bash scripts/cf.sh deploy ...` を必須化 → user 承認動線を奪う / staging を意図しないタイミングで書き換える
- **案 B**: helper を Makefile target にする → 既存 `scripts/*.sh` パターンと不整合

## 3. 設計判断 3: staging evidence の物理 path

### 判断

staging evidence の保存先を `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots/` に固定する。local baseline は親 workflow `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-11/screenshots/` に存続させ、**物理的に別ディレクトリ** にする。

### 根拠

- AC-3 の「local baseline との目視 diff」を行う際、ディレクトリが分かれていれば左右比較がしやすい
- staging 環境の cold start / TTFB 差で微小なフォント描画差が出る可能性があり、local baseline を上書きしない原則を貫く
- 親 workflow が `completed-tasks/` に移動済みのため、本 task からは read-only 参照のみ。書き換えない

### ディレクトリ命名

- 既存 local: `outputs/phase-11/screenshots/` (親 workflow)
- 本 task: `outputs/phase-11/staging-screenshots/` (`screenshots` 名衝突を避け、staging 明示)

## 4. 設計判断 4: 実装順序

### 順序

1. **spec env-override 改修**: `apps/web/playwright/tests/login-smoke.spec.ts` の `EVIDENCE_DIR` 定数を `process.env.PLAYWRIGHT_EVIDENCE_DIR ?? <既存 local default>` 形式に置換
2. **local 互換性確認**: `pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/login-smoke.spec.ts` を `PLAYWRIGHT_EVIDENCE_DIR` 未設定で実行し、従来 path に PNG が出ることを確認
3. **shell helper 新規追加**: `scripts/run-login-staging-smoke.sh` を `set -euo pipefail` で実装、shellcheck clean
4. **staging deploy（user-gated）**: `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` を user が実行
5. **staging URL warm-up**: `curl -I "$PLAYWRIGHT_STAGING_BASE_URL/login"` で 200 OK を確認（cold start 解消）
6. **staging smoke 実行（user-gated）**: `bash scripts/run-login-staging-smoke.sh "$PLAYWRIGHT_STAGING_BASE_URL"` を user が実行し、PNG 7 件を生成
7. **PNG 検証**: `find outputs/phase-11/staging-screenshots -name '*.png' -size +0c -size -500k` で 7 件を確認
8. **目視 diff**: local baseline と staging evidence を並べて構造的回帰なしを確認
9. **consumed trace**: 親 workflow の `unassigned-task-detection.md` / unassigned-task spec を `consumed` 化

### 順序選定の根拠

- spec 改修 → local 互換性確認（手順 1-2）を deploy 前に終わらせる理由: 既存 local baseline を壊さないことを最初に保証
- deploy（手順 4）を smoke（手順 6）の手前に置く理由: smoke 対象が最新コミット由来であることを担保
- consumed trace（手順 9）を最後にする理由: evidence 取得完了を確認してから親 workflow に back-reference を残す

## 5. shell helper contract

### `scripts/run-login-staging-smoke.sh`

```bash
#!/usr/bin/env bash
# Usage: bash scripts/run-login-staging-smoke.sh <staging-base-url>
#   or:  PLAYWRIGHT_STAGING_BASE_URL=<url> bash scripts/run-login-staging-smoke.sh

set -euo pipefail

STAGING_URL="${1:-${PLAYWRIGHT_STAGING_BASE_URL:-}}"
if [[ -z "$STAGING_URL" ]]; then
  echo "ERROR: staging URL not provided" >&2
  echo "Usage: bash scripts/run-login-staging-smoke.sh <staging-base-url>" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_DIR="../../docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots"
mkdir -p "$EVIDENCE_DIR"

export PLAYWRIGHT_STAGING_BASE_URL="$STAGING_URL"
export PLAYWRIGHT_EVIDENCE_DIR="$EVIDENCE_DIR"
export PLAYWRIGHT_SKIP_WEB_SERVER=1

cd "$REPO_ROOT"
pnpm --dir apps/web exec playwright test \
  playwright/tests/login-smoke.spec.ts \
  --project=staging \
  --grep 'renders LoginCard|captures mobile input' \
  --reporter=line
```

| 要素 | 設計 |
|---|---|
| arg / env | `$1` 優先 → `PLAYWRIGHT_STAGING_BASE_URL` fallback → 未設定で exit 1 |
| evidence dir | `apps/web` 基準の相対 path を `PLAYWRIGHT_EVIDENCE_DIR` で spec に渡し、task workflow 配下へ解決させる |
| web server | `PLAYWRIGHT_SKIP_WEB_SERVER=1` で staging 実行時の local server 起動を抑止 |
| pnpm cwd | `--dir apps/web` で web workspace に限定 |
| grep | `renders LoginCard\|captures mobile input` で staging evidence 対象 7 screenshot test のみに限定 |
| reporter | `line`（CI / 人間判読の両立） |
| shellcheck | `set -euo pipefail`、quoted variables、`[[ ]]` 比較で SC2086 / SC2034 fail なし |

## 6. spec 改修の差分設計

### 改修前（実測）

```ts
const EVIDENCE_DIR = resolve(
  process.cwd(),
  "../../docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-11/screenshots",
);
```

### 改修後

```ts
const EVIDENCE_DIR = process.env.PLAYWRIGHT_EVIDENCE_DIR
  ? resolve(process.env.PLAYWRIGHT_EVIDENCE_DIR)
  : resolve(
      process.cwd(),
      "../../docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-11/screenshots",
    );
```

差分は 2 行のみ。`resolve` import / `state` 配列 / `expect` 群は無改変。

## 7. テスト戦略の概要（Phase 4 で詳細化）

| ケース | 期待 |
|---|---|
| TC-LOCAL-01 | `PLAYWRIGHT_EVIDENCE_DIR` 未設定 + local 実行 → 既存 local path に PNG 7 件生成 |
| TC-STAGING-01 | `PLAYWRIGHT_EVIDENCE_DIR=<staging-path>` + `--project=staging` + `--grep 'renders LoginCard\|captures mobile input'` + 有効 URL → `outputs/phase-11/staging-screenshots/` に 7 PNG |
| TC-SHELL-01 | `bash scripts/run-login-staging-smoke.sh` を引数 / env なしで実行 → exit 1 + usage 出力 |
| TC-SHELL-02 | `bash scripts/run-login-staging-smoke.sh <valid-url>` → playwright が `--project=staging` で起動 |
| TC-SHELLCHECK | `shellcheck scripts/run-login-staging-smoke.sh` → 0 finding |

## 8. ライブラリ semantics と依存

| 観点 | 判定 |
|---|---|
| 新規 npm dependency | **追加しない** |
| 新規 shell tool | **追加しない**（既存 `mise` / `pnpm` のみ使用） |
| `playwright.config.ts` 改修 | **行わない** |
| `wrangler` 直接呼び出し | **禁止**。staging deploy は `scripts/cf.sh` 経由 |

## 9. ステップ間 state 引き渡し

shell helper → playwright test 間の引き渡しは `PLAYWRIGHT_STAGING_BASE_URL` / `PLAYWRIGHT_EVIDENCE_DIR` の 2 環境変数のみ。helper exit 後にこれらは消える（ファイル化しない）。

## 10. Phase 2 完了条件

- [x] `playwright.config.ts` 改変せず spec 側 env-override で対処する設計判断を文書化
- [x] shell helper の責務範囲（実行のみ・deploy 含めない）を確定
- [x] staging evidence path (`outputs/phase-11/staging-screenshots/`) を固定
- [x] 実装順序 9 ステップを明示
- [x] shell helper の contract（arg / env / exit code / shellcheck）を確定
- [x] spec 改修の差分（2 行）を確定
- [x] テスト戦略の概要を提示

## 11. 次 Phase への引き継ぎ

Phase 3 では本 Phase で確定した設計判断（config 不変 / shell helper 責務 / evidence path 分離）と実装順序について「矛盾なし / 漏れなし / 整合性あり / 依存関係整合」の 4 条件で Phase 4 進行可否を判定する。特に local 既定値文字列の保持と staging deploy の user-gated 性が満たされているかを確認する。
