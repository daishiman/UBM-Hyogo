# Phase 1: 要件定義（Issue #627 Composite setup action）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 起票日 | 2026-05-12 |
| 起票元 Issue | [#627](https://github.com/daishiman/UBM-Hyogo/issues/627) |
| 親 Issue | [#608](https://github.com/daishiman/UBM-Hyogo/issues/608) |
| 出典 backlog | `docs/30-workflows/e2e-quality-uplift/backlog.md` RB-02 |
| 担当 | solo (daishiman) |
| 対象 PR base | `dev` |
| feature branch | `feat/issue-627-composite-setup-action` |
| tier | standard（NON_VISUAL / CI infra） |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| scope | CI infra composite action |
| implementation_mode | `new`（`.github/actions/` 自体が未存在） |
| workflow_state | `implemented_local_runtime_pending` |

---

## 1. P50 pre-check（事前確認サマリ）

| 確認項目 | 結果 | 根拠 |
|---------|------|------|
| `.github/actions/` ディレクトリ | 未存在 | `ls .github/actions` 該当なし |
| `.github/workflows/lighthouse.yml` | 稼働中 | `name: lighthouse-ci` / setup-node@v4 + pnpm install を含む |
| `.github/workflows/e2e-tests.yml` | 稼働中 | 3 shard matrix + `e2e-tests-coverage-gate` 集約 job、setup-node 重複 2 箇所 |
| `.github/workflows/ci.yml` | 稼働中 | `ci` / `coverage-gate` / `workflow-shell-lint` で setup-node 重複 3 箇所 |
| `.github/workflows/pr-build-test.yml` | 稼働中 | `mise-action@v2` SHA pin / `mise exec -- pnpm install`（mise 系統） |
| Node / pnpm version 正本 | Node `24.15.0` / pnpm `10.33.2`（`.mise.toml`） | CLAUDE.md 開発環境セットアップ §1 |
| 採用条件（3a / 3b 稼働） | ✅ 充足 | index.md §1 |
| 親 backlog 進捗 | RB-01 完了済 / RB-02 が next | `docs/30-workflows/e2e-quality-uplift/backlog.md` |

---

## 2. scope

| in scope | out of scope |
|----------|-------------|
| `.github/actions/setup-project/action.yml` 新規作成（composite action） | `.github/actions/` 配下の他 composite 追加 |
| `lighthouse.yml` / `e2e-tests.yml` / `ci.yml` 計 6 job と `pr-build-test.yml` 1 job の setup ステップ置換 | branch protection contexts 追加・削除 |
| `pr-build-test.yml`（mise 系統）の `setup-strategy: mise` 入力経由置換 | `mise` と `setup-node` の統一（RB-05 候補） |
| composite action input `setup-strategy: setup-node \| mise`（既定 `setup-node`） | composite action での `pnpm install` 分割実行（install を呼び出し側に逃がす設計は採用しない） |
| `node-version` / `pnpm-version` input の既定値固定（`.mise.toml` 整合） | docs-only skip（RB-03 別タスク） |
| setup 重複行数の before / after 実測（Phase 11 evidence） | LHCI server 自前ホスティング（RB-04 別タスク） |

---

## 3. pre-conditions

- 3a Lighthouse CI / 3b E2E hard gate がそれぞれ `dev` で green run 実績を持つ。
- `.mise.toml` の Node `24.15.0` / pnpm `10.33.2` 正本値が現行 workflow と一致している。
- branch protection の required contexts が `ci` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate` / `build-test` / `workflow-shell-lint` であり、本 task で **一切変更しない**。
- `actions/checkout@v4` / `pnpm/action-setup@v4` / `actions/setup-node@v4` / `jdx/mise-action@v2` が現行 workflow で稼働している。

---

## 4. acceptance criteria

| # | 内容 |
|---|------|
| AC-627-1 | `.github/actions/setup-project/action.yml` が存在し、composite action structure / SHA pin gate が pass。workflow YAML は `actionlint` で violation 0 |
| AC-627-2 | `lighthouse` / `e2e` / `e2e-tests-coverage-gate` / `ci` / `coverage-gate` / `workflow-shell-lint` の各 setup ステップが `uses: ./.github/actions/setup-project` 1 行（+ optional `with:`）に置換される |
| AC-627-3 | `pr-build-test.yml` の `build-test` job が `uses: ./.github/actions/setup-project` with `setup-strategy: mise` で置換され、`mise exec -- pnpm install --frozen-lockfile` 等価動作 |
| AC-627-4 | workflow YAML の setup 関連削減行数が **70% 以上**（before/after 実測を `outputs/phase-11/evidence/setup-lines-delta.md` に保存） |
| AC-627-5 | draft PR で `ci` / `lighthouse-ci` / `e2e-tests-coverage-gate` / `build-test` / `coverage-gate` / `workflow-shell-lint` の全 required check が green |
| AC-627-6 | branch protection の required contexts が変更されていない（before / after の `gh api repos/.../branches/dev/protection \| jq '.required_status_checks.contexts'` 完全一致） |
| AC-627-7 | `setup-strategy: setup-node`（既定）/ `setup-strategy: mise` の 2 系統で同一 action.yml が動作する |

---

## 5. inventory（変更対象）

| path | 種別 | 行数目安 |
|------|------|---------|
| `.github/actions/setup-project/action.yml` | new | ≈ 80 行 |
| `.github/workflows/lighthouse.yml` | edit（setup 4 step → 1 step） | -10 行 |
| `.github/workflows/e2e-tests.yml` | edit（setup 4 step × 2 job → 1 step × 2） | -18 行 |
| `.github/workflows/ci.yml` | edit（setup 4 step × 3 job → 1 step × 3） | -25 行 |
| `.github/workflows/pr-build-test.yml` | edit（mise-action + install を composite 1 step に） | -5 行 |
| `docs/30-workflows/issue-627-composite-setup-action/outputs/phase-11/evidence/setup-lines-delta.md` | new（Phase 11） | — |

> `pnpm-lock.yaml` 更新なし。dependency 変更なし。

---

## 6. naming conventions

| 対象 | 命名 | 理由 |
|------|------|------|
| action directory | `.github/actions/setup-project` | プロジェクト全体の setup を表す動詞-名詞構成 |
| action filename | `action.yml`（GitHub composite 標準） | `action.yaml` でも動作するが `.yml` で統一 |
| action `name` | `Setup Project (Node + pnpm + install)` | log 表示で意図が読み取れる粒度 |
| input `setup-strategy` | `setup-node` \| `mise` | 既存 workflow の 2 系統と一致 |
| input `node-version` | string、既定 `'24.15.0'` | `.mise.toml` と完全一致 |
| input `pnpm-version` | string、既定 `'10.33.2'` | 同上 |
| input `install` | `'true'` \| `'false'`、既定 `'true'` | `pnpm install --frozen-lockfile` を呼ぶか |
| output `node-version` | resolved node version（log 用） | 検証容易性 |
| 呼び出し側 step `name` | `Setup project` | 統一表記 |

---

## 7. open questions

| # | 質問 | 暫定方針 |
|---|------|----------|
| Q-01 | composite action 内で `pnpm install --frozen-lockfile` を実行するか、呼び出し側に残すか | **内包する**（既定 `install: 'true'`）。`install: 'false'` で skip 可能にすることで `e2e-tests-coverage-gate` のような install 不要な集約 job も将来対応可 |
| Q-02 | `setup-node` 系統と `mise` 系統で cache key が衝突しないか | **setup-strategy 別の cache 戦略**を採用。`setup-node` は `cache: pnpm` を内部で指定、`mise` は `mise-action` の `cache: true` に委譲（Phase 3 で詳述） |
| Q-03 | action SHA pin を採用するか（`pr-build-test.yml` 現行と整合） | **採用する**。`actions/checkout` / `pnpm/action-setup` / `actions/setup-node` / `jdx/mise-action` を SHA pin（Phase 3 で確定） |
| Q-04 | `workflow-shell-lint` job も置換対象に含めるか（shellcheck の apt install と並存） | **含める**。setup-node ブロック部分のみを composite 化し、`apt-get install shellcheck` 等の job 固有 step はそのまま残す |

---

## 8. ローカル実行コマンド

```bash
# yaml lint
mise exec -- pnpm dlx yaml-lint .github/actions/setup-project/action.yml

# action lint
mise exec -- pnpm dlx actionlint -color .github/workflows/lighthouse.yml \
  .github/workflows/e2e-tests.yml .github/workflows/ci.yml .github/workflows/pr-build-test.yml

# before/after 行数差分
git diff --stat dev -- .github/workflows/lighthouse.yml .github/workflows/e2e-tests.yml \
  .github/workflows/ci.yml .github/workflows/pr-build-test.yml

# 任意: act によるローカル dry-run（push event）
act -W .github/workflows/ci.yml -j ci --dryrun
```

---

## 9. DoD（Phase 1 完了条件）

| # | 条件 |
|---|------|
| D-01 | scope / pre-conditions / AC-627-1..7 / inventory / naming が全て埋まっている |
| D-02 | open questions Q-01..Q-04 が暫定方針付きで列挙されている |
| D-03 | index.md §1.1 の重複 7 箇所と本 phase の inventory が一致している |
| D-04 | branch protection 不変条件（AC-627-6）が明示されている |
| D-05 | root `artifacts.json.metadata` と本 phase の `taskType` / `visualEvidence` / `scope` / `workflow_state` が一致している |

---

## Template Compliance Appendix

## メタ情報

- workflow: issue-627-composite-setup-action
- phase: 1
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented_local_runtime_pending

## 目的

Issue #627 の Composite setup action 導入について、scope / AC / inventory / naming / open questions を 1 ファイル内に確定させる。

## 実行タスク

- 採用条件（3a/3b 稼働・setup 重複実測）の充足確認を index.md から引き継ぐ。
- 6 job + mise 系統 1 job の setup ステップを集約する scope を確定する。
- AC を 7 件、open questions を 4 件、暫定方針付きで列挙する。
- branch protection 不変条件を明示する。

## 参照資料

- docs/30-workflows/issue-627-composite-setup-action/index.md
- .github/workflows/{lighthouse,e2e-tests,ci,pr-build-test}.yml
- docs/30-workflows/e2e-quality-uplift/backlog.md（RB-02）
- .claude/skills/task-specification-creator/references/phase-template-core.md

## 実行手順

1. index.md §1.1 から重複箇所を inventory に展開する。
2. AC を機械検証可能な形（grep / jq / gh api / `git diff --stat`）で記述する。
3. open questions を Phase 2-3 へ判定引き継ぎ可能な形で列挙する。

## 統合テスト連携

- NON_VISUAL phase のため Playwright 実行なし。actionlint / yamllint / list smoke / `gh api` 比較で代替する。
- 実 GHA 実行は Phase 9 / 11 で行い、evidence を `outputs/phase-11/` に保存する。

## 成果物

- 本 phase markdown
- Phase 11 で `setup-lines-delta.md` を作成

## 完了条件

- [x] 仕様記述済: 必須セクションが存在する。
- [x] 仕様記述済: coverage AC 適用: standard tier lines >= 70%（本タスク自体は NON_VISUAL のため既存 CI gate に委譲）。
- [x] 仕様記述済: 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] 仕様記述済: phase 本文のタスクを棚卸しした。
- [x] 仕様記述済: 未実行項目を PASS として扱っていない。
