# e2e-tests.yml composite action 抽出 + paths filter + build artifact 共有 (RB-3b-01..04) - タスク指示書

## メタ情報

| 項目             | 内容                                                                                |
| ---------------- | ----------------------------------------------------------------------------------- |
| タスクID         | task-e2e-stage3b-rb-followup-composite-actions-001                                  |
| タスク名         | e2e-tests.yml composite action 抽出 + paths filter + build artifact 共有 (RB-3b-01..04) |
| 分類             | CI refactor / GitHub Actions composite / paths filter / build cache                 |
| 対象機能         | `.github/workflows/e2e-tests.yml` ほか CI workflow / composite action 新設           |
| 優先度           | MEDIUM                                                                              |
| 見積もり規模     | 中規模                                                                              |
| ステータス       | 未実施 (proposed)                                                                   |
| 親タスク         | e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate                              |
| サブタスク識別子 | 3b backlog (RB-3b-01..RB-3b-04)                                                      |
| taskType         | ci-refactor                                                                          |
| visualEvidence   | NON_VISUAL                                                                          |
| 発見日           | 2026-05-10                                                                          |
| 発見元           | 3b phase-13.md §残課題                                                              |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

3b（`e2e-tests-coverage-gate` hard gate 化）の Phase 13 で、PR-B のスコープ外として 4 件の backlog（RB-3b-01..RB-3b-04）が明示的に切り出された。これらは「3b PR-B を最小スコープで dev に merge する」ために意図的に保留されたもので、現状は phase-13.md 内で 1 行触れているだけで spec 化されていない。

| ID | 内容 |
|----|------|
| RB-3b-01 | composite action 抽出（checkout / setup pnpm / setup node / install / Playwright browsers） |
| RB-3b-02 | build artifact 共有（typecheck / lint / e2e / coverage で `.next` build 結果を再利用） |
| RB-3b-03 | `paths` filter による不要 run 抑止（docs-only PR で e2e を起動しない） |
| RB-3b-04 | shell helper 抽出（`scripts/coverage-gate-e2e.sh` 等の共通ロジック） |

### 1.2 問題点・課題

- `e2e-tests.yml` / `coverage.yml` / `lighthouse.yml` 等の workflow で**checkout / pnpm/action-setup / setup-node / pnpm install / playwright install** の同一ブロックが重複定義されている。`pnpm/action-setup@v4` の `version: 10.33.2` がハードコードされており、`.mise.toml`（pnpm `10.33.2`）との drift が起きやすい。`actions/setup-node@v4` の `node-version: 24.15.0` も同様。
- docs-only PR（例: `docs/30-workflows/unassigned-task/*.md` のみの差分）でも `e2e-tests.yml` が起動し、Playwright browsers のインストール（重い・100MB+）と E2E run（30 分上限）が走る。`paths` / `paths-ignore` filter が未設定。
- typecheck / lint / e2e の各 job が独立して `pnpm install` + `next build` を実施しており、CI 全体の wall time が線形に伸びている。`actions/cache` または `actions/upload-artifact` で build 結果を再利用すれば 30〜50% 短縮余地がある。
- `scripts/coverage-gate-e2e.sh` 等の shell helper に `set -euo pipefail` / `jq -r` / `awk` の同一前文が散在しており、helper 抽出 / 共通 lint（shellcheck）の単一窓口が未整備。

### 1.3 放置した場合の影響

- Node / pnpm のメジャー上げ（例: Node 26 / pnpm 11）時に**全 workflow を grep して個別に書き換える**必要があり、drift と取り残しが必発。`.mise.toml` を更新したのに workflow 側が古いまま走り続ける事故が現に起きやすい。
- docs-only PR でも 1 回 30 分の E2E run が走り続け、Actions 利用枠と PR feedback ループが圧迫される。
- 3a Lighthouse CI / 3c branch protection で同型の workflow を増やすたびに重複が拡大し、保守負債の指数増。
- 3b cycle の skill-feedback で挙がった「composite action 抽出は CI 全 workflow 共通の前提インフラ」という観察が、未着手のまま新 workflow（lighthouse / verify-indexes 等）に伝播してさらなる重複を生む。

---

## 2. 何を達成するか（What）

### 2.1 目的

3b 由来の backlog RB-3b-01..RB-3b-04 を spec 化し、`e2e-tests.yml` を起点に composite action / build artifact 共有 / paths filter / shell helper の 4 軸で workflow を再構築する。CI 全体の保守負債を 3b cycle 直後に着地させ、3a / 3c / 後続 stage の workflow 追加コストを下げる。

### 2.2 最終ゴール（AC）

- **AC-RB3b-01**: `.github/actions/setup-pnpm-node/action.yml`（composite action）を新設し、`actions/checkout` / `pnpm/action-setup` / `actions/setup-node` / `pnpm install --frozen-lockfile` を 1 step に集約。pnpm / Node のバージョンは action 内で定数として持ち、`.mise.toml` と periodic に sync する verification step を含める（`mise current` を実行して expected と一致するか比較）。
- **AC-RB3b-02**: `.github/actions/build-web/action.yml`（または `.github/actions/build-cache/action.yml`）を新設し、`apps/web/.next` / `apps/web/.open-next` の build 結果を `actions/upload-artifact@v4` で job 間共有する。typecheck / lint / e2e / coverage の各 job がこの artifact を download して再利用する。`actions/cache` での `pnpm-store` キャッシュも合わせて整備。
- **AC-RB3b-03**: `e2e-tests.yml` の `on:` に `paths` filter を追加し、以下のいずれかの変更時のみ起動: `apps/web/**`, `apps/api/**`, `packages/**`, `scripts/e2e-mock-api*`, `scripts/coverage-gate-e2e.sh`, `.github/workflows/e2e-tests.yml`, `.github/actions/**`。docs-only / `.claude/skills/**` のみの PR では起動しない。ただし 3c で required check に登録されることを考慮し、`paths-ignore` ではなく `paths` ホワイトリスト + `paths-ignore` 補助の二段構えとし、docs-only PR でも GitHub Checks 上は `e2e-tests-coverage-gate` が `success`（または neutral）として記録される必要がある（`workflow_dispatch` での skip 互換 / または dummy job で名前を一致させる）。
- **AC-RB3b-04**: `scripts/lib/ci-shell-prelude.sh`（または `scripts/lib/coverage-utils.sh`）を新設し、`set -euo pipefail` / jq 安全呼出 / awk 比較の共通ロジックを集約。`scripts/coverage-gate-e2e.sh` を含む CI shell script から `source` する。`pnpm dlx shellcheck` を `.github/workflows/lint.yml`（または既存の lint workflow）に gate として追加。

### 2.3 検証エビデンス

- composite action 適用後、`gh workflow view e2e-tests` の各 step が「Setup pnpm + Node + install (composite)」1 step に集約されていることを観測
- pnpm / Node version の sync verification step が `.mise.toml` 改ざん dummy PR で fail することを観測
- docs-only PR（`docs/**` のみ変更）で `e2e-tests-coverage-gate` が起動しない（または neutral 終了）ことを `gh pr checks` で確認
- typecheck / lint / e2e の wall time 短縮（before/after の `gh run list --json` で比較）
- `shellcheck` violation 0 を CI artifact / log で観測

### 2.4 スコープ

#### 含むもの

- `.github/actions/setup-pnpm-node/action.yml` 新設
- `.github/actions/build-web/action.yml` 新設（または build cache 共有 step）
- `.github/workflows/e2e-tests.yml` を composite action 採用形に refactor
- `.github/workflows/coverage.yml` / `.github/workflows/lighthouse.yml` 等、関連 workflow への波及適用（影響範囲が小さい範囲で）
- `.github/workflows/e2e-tests.yml` `on.pull_request.paths` 設定
- `scripts/lib/ci-shell-prelude.sh`（または同等 helper）新設
- `scripts/coverage-gate-e2e.sh` の helper 利用へのリファクタ
- shellcheck gate を既存 lint workflow に追加

#### 含まないもの

- 既存 CI 全 workflow の一斉 composite 化（本タスクは 3b 由来 RB のスコープ。`UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP.md` 等の CI 全般 composite setup 系 spec とは別軸とし、最小重複で済むよう調整する）
- `pnpm/action-setup` / `actions/setup-node` のバージョン更新（drift 検出のみ。更新は別タスク）
- 3c branch protection の context name 変更
- Cloudflare Workers staging への deploy 系 workflow

### 2.5 成果物

- `.github/actions/setup-pnpm-node/action.yml`（新規）
- `.github/actions/build-web/action.yml`（新規）
- `.github/workflows/e2e-tests.yml`（edit / composite 採用）
- `.github/workflows/coverage.yml`（edit / composite 採用）
- `.github/workflows/lighthouse.yml`（edit / composite 採用、3a 完了後の場合）
- `scripts/lib/ci-shell-prelude.sh`（新規）
- `scripts/coverage-gate-e2e.sh`（edit / helper source）
- Phase 11 evidence: `outputs/phase-11/evidence/{wall-time-before.txt, wall-time-after.txt, paths-filter-skip.txt, mise-pnpm-drift-detect.txt, shellcheck-clean.txt}`

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 3b（`e2e-tests-coverage-gate` hard gate 化）が dev に merge 済み
- `task-e2e-stage3b-mock-api-fixture-coverage-001` と並行可（互いに別領域）
- `mise exec -- pnpm install` / `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が green

### 3.2 依存関係

- **depends-on**: `task-e2e-stage3b-e2e-tests-hard-gate-001`（3b 完了後に着手）
- **blocks**: 3a / 3c の workflow 追加コストを下げる前提インフラ。ただし 3c の required check 登録は本タスクと独立に進められる（context name は維持）。
- **関連**: `UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP.md`（CI 全般 composite setup / 別軸スコープ）/ `task-e2e-stage3b-mock-api-fixture-coverage-001`（独立）

### 3.3 composite action の構造（AC-RB3b-01）

```yaml
# .github/actions/setup-pnpm-node/action.yml
name: setup-pnpm-node
description: Checkout + pnpm 10.33.2 + Node 24.15.0 + pnpm install (frozen)
inputs:
  install:
    description: run pnpm install --frozen-lockfile
    required: false
    default: 'true'
runs:
  using: composite
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: 10.33.2
    - uses: actions/setup-node@v4
      with:
        node-version: 24.15.0
        cache: pnpm
    - name: Verify .mise.toml drift
      shell: bash
      run: |
        grep -E '^pnpm = "10\.33\.2"' .mise.toml || { echo "pnpm drift"; exit 1; }
        grep -E '^node = "24\.15\.0"' .mise.toml || { echo "node drift"; exit 1; }
    - if: ${{ inputs.install == 'true' }}
      shell: bash
      run: pnpm install --frozen-lockfile
```

### 3.4 paths filter（AC-RB3b-03）

```yaml
on:
  pull_request:
    branches: [dev, main]
    paths:
      - apps/web/**
      - apps/api/**
      - packages/**
      - scripts/e2e-mock-api*
      - scripts/coverage-gate-e2e.sh
      - .github/workflows/e2e-tests.yml
      - .github/actions/**
      - pnpm-lock.yaml
      - package.json
  workflow_dispatch:
```

> 3c で required check に登録すると、paths filter で skip された PR は永久 pending になる罠がある。skip 時に neutral / success として check を記録する dummy job、もしくは `actions/required-status-check` 互換の構造を Phase 7 で確定する。

### 3.5 build artifact 共有（AC-RB3b-02）

```yaml
# 例: build job の出力
- uses: ./.github/actions/setup-pnpm-node
- run: pnpm --filter @ubm-hyogo/web build
- uses: actions/upload-artifact@v4
  with:
    name: web-build-${{ github.sha }}
    path: |
      apps/web/.next
      apps/web/.open-next
    retention-days: 1

# 後続 job
- uses: actions/download-artifact@v4
  with:
    name: web-build-${{ github.sha }}
    path: apps/web
```

### 3.6 shell helper（AC-RB3b-04）

```bash
# scripts/lib/ci-shell-prelude.sh
#!/usr/bin/env bash
set -euo pipefail

ci::require_jq() { command -v jq >/dev/null || { echo "jq missing"; exit 1; }; }

ci::lt_threshold() {
  local actual="$1" threshold="$2"
  awk -v p="$actual" -v t="$threshold" 'BEGIN { exit !(p+0 < t+0) }'
}
```

`scripts/coverage-gate-e2e.sh` から `source "$(dirname "$0")/lib/ci-shell-prelude.sh"` で利用する。

### 3.7 ローカル検証手順

```bash
mise exec -- pnpm dlx actionlint -color .github/workflows/e2e-tests.yml
mise exec -- pnpm dlx shellcheck scripts/coverage-gate-e2e.sh scripts/lib/ci-shell-prelude.sh
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 4. 受入基準

| # | 基準 | 確認方法 |
|---|------|---------|
| AC-RB3b-01 | composite action 抽出 + drift 検出 step | `.mise.toml` 改ざん dummy PR で composite step が fail |
| AC-RB3b-02 | build artifact 共有で wall time 短縮 | before/after `gh run list --json conclusion,startedAt,completedAt` |
| AC-RB3b-03 | docs-only PR で e2e が skip / neutral | `gh pr checks` で確認 |
| AC-RB3b-04 | shell helper 抽出 + shellcheck gate | `pnpm dlx shellcheck` violation 0 |

---

## 5. 苦戦箇所と将来の解決指針【記入必須】

### 5.1 paths filter と branch protection required check の罠

- `paths` filter で skip された workflow run は GitHub Checks 上に**現れない**ため、3c で required check に登録した PR は永久 pending になる。これは GitHub Actions 上で頻発する事故であり、3c が dev に merge された後に本タスクの paths filter を追加すると即座に dev / main の PR が全部 stuck する。
- 解決策は (a) skip 時にも check を記録する `if: github.event_name == 'pull_request'` ガードで always success を返す dummy job を生やす、(b) `paths` を `paths-ignore` に置き換えて「明らかに無関係」のものだけ除外する、(c) GitHub の「Require status checks to pass before merging」を branch protection rule で工夫する、のいずれか。Phase 4 設計で 3 案を比較し、3c spec が `e2e-tests-coverage-gate` を required にしている前提で **(a) dummy job 戦略**を第一候補とする。

### 5.2 `pnpm/action-setup` の version drift 検出

- composite action で `version: 10.33.2` を持つだけでは「`.mise.toml` を更新したのに action 側が古いまま」の drift を検出できない。`grep -E '^pnpm = "10\.33\.2"' .mise.toml` で値の literal 一致を強制する作りにすると、`.mise.toml` 側の version を上げた瞬間に CI fail で気付ける。
- 将来的には `mise current` の出力を JSON で比較する形が望ましいが、`mise` を CI runner にインストールするコストが見合わないため当面は grep ベースで十分。

### 5.3 build artifact 共有で `apps/web/.open-next` の絶対パス問題

- `@opennextjs/cloudflare` は build 時に absolute path を一部生成物に焼き込む傾向があり、別 job で download すると path mismatch を起こすケースがある（task-09a 系列の lessons）。`actions/upload-artifact@v4` の `path` には `.next` のみ含め、`.open-next` は deploy job 専用で再 build する設計が安全。Phase 4 でこの分離を必ず検討。
- `actions/cache` の key には `hashFiles('pnpm-lock.yaml')` を含め、lockfile 変更時のキャッシュ無効化を機械化する。

### 5.4 shell helper を CI と local で同居させる

- `scripts/lib/ci-shell-prelude.sh` を local script からも `source` できるようにすると、CI 環境固有の env（`GITHUB_ACTIONS`）に依存する分岐が混入しがち。helper 内で `[[ -n "${GITHUB_ACTIONS:-}" ]]` の if を増やしすぎると見通しが悪化する。
- 設計方針として helper には CI 非依存の汎用ロジック（jq 安全呼出 / 数値比較 / log prefix）のみを置き、CI 固有のロジック（`::warning::` annotation 等）は workflow 側 inline に留める。

### 5.5 RB-3b-01..04 の独立性と PR 分割

- 4 件は論理的に独立しているが、composite action（RB-01）を入れると他 3 件の差分が縮むため、**RB-01 → RB-02 → RB-03 → RB-04 の順で 4 PR に分割**するか、**1 PR で 4 件まとめる**かの判断が必要。本タスクは Phase 7 設計時に「1 PR スコープが 500 行を超えそうな場合は分割、そうでなければ 1 PR」という閾値で機械的に決める。3b PR-B が 1 PR で済んだ実績から、本タスクも 1 PR を第一候補とする。

---

## 6. 影響範囲

| パス | 変更内容 |
|------|---------|
| `.github/actions/setup-pnpm-node/action.yml` | 新規 |
| `.github/actions/build-web/action.yml` | 新規 |
| `.github/workflows/e2e-tests.yml` | major edit（composite 採用 + paths filter） |
| `.github/workflows/coverage.yml` | edit（composite 採用） |
| `.github/workflows/lighthouse.yml` | edit（composite 採用、3a 完了時） |
| `.github/workflows/lint.yml`（または同等） | edit（shellcheck gate 追加） |
| `scripts/lib/ci-shell-prelude.sh` | 新規 |
| `scripts/coverage-gate-e2e.sh` | edit（helper source） |

---

## 7. 不変条件

1. **`e2e-tests-coverage-gate` job 名 / context 名を変更しない**: 3c で required check に登録される文字列との完全一致を維持。
2. **Node 24 / pnpm 10 固定**: `.mise.toml` を正本とし、composite action がその literal と一致することを CI で検証。
3. **`wrangler` 直叩き禁止**: 本タスクは Cloudflare CLI 不要だが、副次的に必要となった場合は `bash scripts/cf.sh` 経由のみ。
4. **`apps/api` 既存 endpoint surface 不変**: 本タスクは CI / config / shell のみで API endpoint 変更を含まない。
5. **D1 直接アクセス禁止**: `apps/web` から D1 を叩く差分を生まない。
6. **OKLch トークン正本化**: 本タスクは UI を編集しない（NON_VISUAL）。
7. **CONST_007 single cycle**: Phase 11 evidence は canonical path 1 セットのみ。
8. **paths filter で required check が永久 pending にならない**: dummy job 戦略または等価戦略で必ず check を記録する。

---

## 8. 参照情報

- 仕様根拠: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/phase-13.md` §残課題 / §「composite action / build 共有 / paths filter / shell helper 抽出」
- 現状 workflow: `.github/workflows/e2e-tests.yml`
- 関連: `UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP.md`（CI 全般 composite setup / 別軸）
- 関連: `task-e2e-stage3b-mock-api-fixture-coverage-001`（独立で並行可）
- フォーマット参照: `docs/30-workflows/unassigned-task/task-e2e-stage3b-e2e-tests-hard-gate-001.md`
- 関連スキル: `task-specification-creator` / `aiworkflow-requirements`

---

## 9. 備考

- 本タスクは 3b 単独 PR-B では意図的にスコープアウトされた 4 件（RB-3b-01..04）の集約。3a Lighthouse CI / 3c branch protection と独立に実施可能だが、**3c が dev に merge された後に paths filter を入れると required check 永久 pending を引き起こす**ため、3c より**前**または**直後**に paths filter を導入する順序設計が必要。3c spec 側にも本タスクの存在を cross-reference として残す。
- `pnpm/action-setup` の version literal を action 内で複数箇所に書かないこと。drift 検出 step だけが `.mise.toml` の literal と突き合わせる単一窓口。
- composite action は GitHub Marketplace に公開しない（`.github/actions/` 配下に閉じる）。リポジトリ private と integrity を維持する。
