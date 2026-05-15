# Phase 6: 実装手順 — RB-3b-04（shell helper + shellcheck gate）

| 項目 | 値 |
|------|----|
| 対象 | `scripts/lib/ci-shell-prelude.sh`（new）/ `scripts/coverage-gate-e2e.sh`（edit）/ `scripts/coverage-guard.sh`（edit）/ `.github/workflows/lint-shell.yml`（new） |
| 想定所要時間 | 60 min |

---

## 1. 前提

- Phase 5 の commit が完了している
- `shellcheck` がローカルにインストール済（`brew install shellcheck`）
- `bash` 4 以上（macOS の `/bin/bash` は 3.2 のため `mise` で `bash` 5 を使うか Homebrew bash を利用）

---

## 2. 手順

### Step 6.1 — `scripts/lib/ci-shell-prelude.sh` の新規作成

1. Phase 3 §3 の最終形 bash をそのまま `scripts/lib/ci-shell-prelude.sh` として作成
2. `chmod 644` を確認（実行権限不要、source 専用）
3. ローカル smoke:
   ```bash
   bash -n scripts/lib/ci-shell-prelude.sh
   shellcheck --severity=warning scripts/lib/ci-shell-prelude.sh
   ```
   期待: いずれも exit 0

### Step 6.2 — `scripts/coverage-gate-e2e.sh` の refactor

1. 既存ファイルを開き、Phase 3 §4 の最終形に置換
2. 主要差分:
   - 冒頭 `set -euo pipefail` を削除
   - `source "$(cd ... )/lib/ci-shell-prelude.sh"` を追加
   - `echo "::error::xxx"` → `gh_error "xxx"`
   - `echo "::notice::xxx"` → `gh_notice "xxx"`
   - `awk` での threshold 比較を `awk_compare_ge` に置換
3. ローカル smoke（Phase 4 §6 の 3 ケース）

### Step 6.3 — `scripts/coverage-guard.sh` の refactor（最小差分）

1. 既存ファイルの冒頭 `set -euo pipefail` 行のみを削除し、prelude `source` 行に置換
2. **判定ロジック・関数・変数名は一切変更しない**
3. ローカル smoke:
   ```bash
   bash -n scripts/coverage-guard.sh
   shellcheck --severity=warning scripts/coverage-guard.sh
   mise exec -- pnpm vitest run scripts/coverage-guard.spec.ts
   ```
   期待: 全 exit 0 + spec green

### Step 6.4 — `.github/workflows/lint-shell.yml` の新規作成

1. Phase 3 §6 の最終形 YAML をそのまま新規作成
2. `actionlint .github/workflows/lint-shell.yml` 実行 → exit 0

### Step 6.5 — 既存全 `.sh` への shellcheck 適用（regression）

```bash
git ls-files -z 'scripts/*.sh' 'scripts/**/*.sh' | xargs -0 shellcheck --severity=warning --external-sources
```

期待: exit 0。violation 出現時は **最小修正** で対応:
- SC2086 (quote variables): `"$var"` で囲む
- SC2046 (quote command substitution): `"$(cmd)"` で囲む
- どうしても無視したい場合のみ、関数単位で `# shellcheck disable=SCxxxx` + 根拠コメント

### Step 6.6 — commit

```bash
git add scripts/lib/ci-shell-prelude.sh \
        scripts/coverage-gate-e2e.sh \
        scripts/coverage-guard.sh \
        .github/workflows/lint-shell.yml
# commit / push / PR は Phase 13 の user approval gate まで実行しない
```

---

## 3. 検証

| 観点 | コマンド | 期待 |
|------|---------|------|
| prelude 構文 | `bash -n scripts/lib/ci-shell-prelude.sh` | exit 0 |
| prelude 直接実行ガード | `bash scripts/lib/ci-shell-prelude.sh` | exit 2 + stderr に "must be sourced" |
| coverage-gate 79% | Phase 4 §6 で stub coverage 79% | exit 1 + `::error::` |
| coverage-gate 80% | Phase 4 §6 で stub coverage 80% | exit 0 + `::notice::` |
| coverage-guard 既存挙動 | `pnpm vitest run scripts/coverage-guard.spec.ts` | green |
| 全 .sh shellcheck | Step 6.5 のコマンド | exit 0 |
| lint-shell.yml | `actionlint` | exit 0 |

---

## 4. ロールバック手順

| 状況 | 対応 |
|------|------|
| `coverage-gate-e2e.sh` が CI で fail | `git revert` で本 commit を打ち消し → 旧 `set -euo pipefail` 直書きに戻す |
| `coverage-guard.spec.ts` が red | prelude `source` 行を一旦戻し、prelude 側 `umask 077` 等が spec の前提を破壊していないか調査 |
| 既存 `.sh` の shellcheck violation で本 PR が膨張 | 本サイクルで最小修正する。対象除外や別 issue 化は、外部依存などで同サイクル修正が技術的に破綻する場合のみユーザーにエスカレーションして判断する |

---

## 5. 完了条件

- [x] `ci-shell-prelude.sh` が source 専用ガード付きで実装
- [x] `coverage-gate-e2e.sh` が prelude を使う形に refactor 済
- [x] `coverage-guard.sh` が最小差分で prelude を source（既存 spec green）
- [x] `lint-shell.yml` が新設され CI runtime validation pending
- [x] `scripts/**/*.sh` 全体で shellcheck warning 0
