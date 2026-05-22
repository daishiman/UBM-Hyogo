# Phase 5: 環境準備・依存確認

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-4.md` |
| 出力 | actionlint / yamllint / act の導入確認 / lint 設定 / dry-run コマンド集 |
| 変更対象（本 Phase 時点） | lint 設定の整備のみ（composite 本体は Phase 6） |

---

## 0. 前提確認（着手前 必須チェック）

| # | チェック項目 | コマンド | 期待 |
|---|-------------|----------|------|
| P-01 | Phase 4 草案存在 | `test -f docs/30-workflows/issue-627-composite-setup-action/phase-4.md && echo OK` | `OK` |
| P-02 | Node / pnpm | `mise exec -- node -v && mise exec -- pnpm -v` | `v24.15.0` / `10.33.2` |
| P-03 | 既存 `.github/actions/` 不在 | `ls .github/actions/ 2>/dev/null \|\| echo MISSING` | `MISSING` |

---

## 1. 必須ツール

| # | ツール | 役割 | 導入経路 |
|---|--------|------|----------|
| T-01 | `actionlint` | GitHub Actions YAML の静的解析（expression / SHA / shellcheck 統合） | `pnpm dlx actionlint`（local）/ CI では `bash <(curl -sS .../download-actionlint.bash)`（既存 ci.yml と同じ） |
| T-02 | `yamllint` | 純粋 YAML 構文 / インデント / 末尾改行 | `pipx install yamllint` または `brew install yamllint` |
| T-03 | `jq` | YAML→JSON 変換不要・既存 phase でも使用 | macOS 標準 / `brew install jq` |
| T-04 | `act`（任意） | composite action のローカル smoke 実行（Docker） | `brew install act`。**任意採用**（Phase 8 で実 GHA 実行に代替可） |
| T-05 | `shellcheck` | composite 内 `shell: bash` step の静的解析（actionlint が内部で呼ぶ） | `brew install shellcheck` |

---

## 2. 導入確認コマンド

```bash
# actionlint
mise exec -- pnpm dlx actionlint -version
# 期待: バージョン文字列（例: 1.7.x）

# yamllint
which yamllint && yamllint --version
# 期待: pipx / brew 経由のパス + バージョン

# shellcheck
which shellcheck && shellcheck --version | head -3

# act（任意）
which act && act --version || echo "act not installed (optional)"
```

T-01 / T-02 / T-05 が未導入の場合は次節 §3 でセットアップする。T-04 (`act`) は無くても Phase 8 / 9 でカバーする。

---

## 3. 不在ツールの導入手順

### 3.1 actionlint（CI と同等を local に用意）

```bash
# 一時ディレクトリに DL（PATH 汚染なし）
mkdir -p .tmp/actionlint && cd .tmp/actionlint
bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)
./actionlint -version
```

> 既存 `ci.yml` (`workflow-shell-lint` job) と同じ DL 方式を local 自己検証でも使うことで CI とローカルの挙動差を最小化する。

### 3.2 yamllint

```bash
# macOS / Homebrew
brew install yamllint

# pipx 経由（Python 環境）
pipx install yamllint
```

### 3.3 shellcheck

```bash
brew install shellcheck
```

### 3.4 act（任意・Docker 必要）

```bash
brew install act
# Docker Desktop 起動済みであること
docker info >/dev/null 2>&1 && echo "docker OK"
```

---

## 4. yamllint 設定の確定

`.yamllint.yml` を**新規追加するかは Phase 6 で判断**する。本 Phase では既存設定有無の確認のみ行う。

```bash
test -f .yamllint.yml -o -f .yamllint -o -f .yamllint.yaml && echo PRESENT || echo MISSING
```

| 結果 | 対応 |
|------|------|
| `PRESENT` | 既存設定を採用。Phase 6 で `yamllint .github/actions/setup-project/action.yml` を実行 |
| `MISSING` | Phase 6 で composite action 検証のために minimal config を inline で渡す: `yamllint -d 'rules: {line-length: {max: 200}, document-start: disable}' .github/actions/setup-project/action.yml` |

---

## 5. dry-run コマンド集（Phase 6 / Phase 7 で使用）

```bash
# 5.1 composite action 単独 lint（Phase 6 後に実行）
node -e "const fs=require('fs'); const s=fs.readFileSync('.github/actions/setup-project/action.yml','utf8'); if (!s.includes(\"using: 'composite'\")) process.exit(1)"
yamllint -d 'rules: {line-length: {max: 200}, document-start: disable}' \
  .github/actions/setup-project/action.yml

# 5.2 呼出側 workflow 全件 lint（Phase 7 後に実行）
./.tmp/actionlint/actionlint \
  .github/workflows/lighthouse.yml \
  .github/workflows/e2e-tests.yml \
  .github/workflows/ci.yml \
  .github/workflows/pr-build-test.yml

# 5.3 grep gate（branch protection 不変の事前確認）
grep -E '^name:\s*ci$'                       .github/workflows/ci.yml
grep -E '^\s+name:\s*ci$'                    .github/workflows/ci.yml
grep -E '^name:\s*lighthouse-ci$'            .github/workflows/lighthouse.yml
grep -E '^name:\s*e2e-tests-coverage-gate$'  .github/workflows/e2e-tests.yml
grep -E 'name:\s*build-test'                 .github/workflows/pr-build-test.yml

# 5.4 SHA pin 確認（pr-build-test の checkout / mise-action）
grep -E 'b4ffde65f46336ab88eb53be808477a3936bae11' .github/workflows/pr-build-test.yml
grep -E '5083fe46898c414b2475087cc79da59e7da859e8' .github/workflows/pr-build-test.yml

# 5.5 setup 重複の残存有無（Phase 7 後は composite 以外で `pnpm install --frozen-lockfile` が消える想定）
grep -RInE 'pnpm install --frozen-lockfile' .github/workflows/ \
  | grep -v 'setup-project'
# 期待: hit 0（または composite 内部の install step のみ）
```

---

## 5.5 act によるローカル composite smoke（任意）

```bash
# pr-build-test 相当を local container で実行
act pull_request \
  --workflows .github/workflows/pr-build-test.yml \
  --container-architecture linux/amd64 \
  --job build-test

# lighthouse 相当
act pull_request \
  --workflows .github/workflows/lighthouse.yml \
  --container-architecture linux/amd64 \
  --job lighthouse
```

> Apple Silicon では `--container-architecture linux/amd64` が必須。`act` が未導入なら Phase 9 の draft PR run に代替する。

---

## 6. 依存追加の有無

| 区分 | 値 |
|------|----|
| `package.json` への追加依存 | **なし**（`actionlint` / `yamllint` は dev ツール、リポジトリ依存に含めない） |
| `pnpm-lock.yaml` 更新 | **なし** |
| 新規 secret / variable | **なし** |
| 新規 environment | **なし** |

---

## 7. lint 設定ファイル追加方針

| ファイル | 追加 | 理由 |
|---------|------|------|
| `.github/actionlint.yaml` | **追加しない** | リポ全体で actionlint config は未使用。既存設定温存を優先（CONST_004） |
| `.yamllint.yml` | **追加しない**（既存があれば採用） | composite 単体 lint は §4 の inline config で代替可 |
| `.github/dependabot.yml` 更新 | **対象外** | composite 内 actions のバージョン管理は別タスク（RB-06 候補） |

---

## 8. CI 上の追加 gate

本タスクで新規追加する CI gate は **なし**。既存 `workflow-shell-lint` job 内の `Actionlint workflow syntax` step に composite action ファイルを追加するかは Phase 6 の編集差分で扱う（最小差分原則）。

| 既存 gate | 追加対応 |
|----------|----------|
| `workflow-shell-lint` の `actionlint` step | `.github/actions/setup-project/action.yml` を引数列に追加（Phase 6 §X） |

---

## 9. DoD（Phase 5 完了条件）

| # | 条件 |
|---|------|
| D-01 | actionlint / yamllint / shellcheck がローカルで実行可能 |
| D-02 | §5 の dry-run コマンドが Phase 6 / Phase 7 で再利用可能な形で確定 |
| D-03 | 依存追加 / secret 追加が **発生しない**ことを §6 / §7 で確認 |
| D-04 | `pr-build-test.yml` の SHA pin（checkout / mise-action）が §5.4 で grep 可能なこと |

---

## 10. 引き継ぎ（Phase 6 へ）

| 項目 | 内容 |
|------|------|
| 作成ファイル | `.github/actions/setup-project/action.yml`（Phase 4 §3 YAML） |
| 検証コマンド | §5.1（単体 lint） |
| Edit 対象 | `.github/workflows/ci.yml` 内 `actionlint` 引数（任意） |

---

## Template Compliance Appendix

## メタ情報

- workflow: issue-627-composite-setup-action
- phase: 5
- task classification: implementation / NON_VISUAL (CI infra)
- coverageTier: standard
- workflow_state: implemented_local_runtime_pending

## 目的

composite action 実装 / 置換に必要な lint / smoke ツール（actionlint, yamllint, shellcheck, act）の導入確認と dry-run コマンド集を Phase 6 / Phase 7 に引き継ぐ。

## 実行タスク

- 必須ツール T-01..T-05 を確定。
- ローカル導入確認・不在時の導入手順を提示。
- yamllint 設定ポリシーを確定。
- dry-run コマンド §5.1..§5.5 を集約。
- 依存追加 / secret 追加なしを明文化。

## 参照資料

- docs/30-workflows/issue-627-composite-setup-action/phase-4.md
- .github/workflows/ci.yml（既存 actionlint step）
- .github/workflows/pr-build-test.yml（SHA pin 例）

## 実行手順

1. P-01..P-03 で前提確認。
2. §2 で導入確認、§3 で不在時の導入手順。
3. §4 で yamllint config 方針確定。
4. §5 で dry-run コマンドを Phase 6 / Phase 7 用に集約。

## 統合テスト連携

- act 利用は任意。draft PR 上での実 GHA run（Phase 9）が正本検証経路。

## 成果物

- 本 phase markdown
- §5 dry-run コマンド集

## 完了条件

- [x] 仕様記述済: 必須セクションが存在する。
- [x] 仕様記述済: coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL）。
- [x] 仕様記述済: 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] 仕様記述済: phase 本文のタスクを棚卸しした。
- [x] 仕様記述済: 未実行項目を PASS として扱っていない。
