# Phase 2: ドメイン分析（Issue #627 Composite setup action）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` |
| 出力 | composite action の入力/出力境界 / affected workflow inventory / setup-strategy 切替モデル |

---

## 1. ドメインモデル

`setup-project` は GitHub Actions の **composite action** として、CI workflow が共通して必要とする以下 4 要素のセットアップを 1 step に集約する責務を持つ。

| 要素 | 役割 |
|------|------|
| checkout 後の repo working tree | （前提：呼び出し側で `actions/checkout` 済み） |
| Node ランタイム | `setup-node` 系統 → `actions/setup-node@v4` / `mise` 系統 → `jdx/mise-action@v2` |
| pnpm CLI | `setup-node` 系統 → `pnpm/action-setup@v4` / `mise` 系統 → `mise` 経由 |
| 依存インストール | `pnpm install --frozen-lockfile`（または `mise exec -- pnpm install --frozen-lockfile`） |

> `actions/checkout` は composite に含めない。理由: `e2e-tests-coverage-gate` 等で `download-artifact` 前に `checkout` を済ませる順序や、`pr-build-test.yml` のように `ref: ${{ github.event.pull_request.head.sha }}` + `persist-credentials: false` といった checkout-specific input が存在し、composite 内に閉じ込めると柔軟性を失う。

---

## 2. 入出力境界（composite action interface）

### 2.1 inputs

| name | required | default | 説明 |
|------|----------|---------|------|
| `setup-strategy` | no | `'setup-node'` | `'setup-node'` または `'mise'`。`mise` 指定時は `jdx/mise-action@v2`（cache=true）に委譲し、Node / pnpm version は `.mise.toml` 正本値を採用 |
| `node-version` | no | `'24.15.0'` | `setup-strategy: setup-node` 時に `actions/setup-node` へ渡す。`mise` 時は無視 |
| `pnpm-version` | no | `'10.33.2'` | `setup-strategy: setup-node` 時に `pnpm/action-setup` へ渡す。`mise` 時は無視 |
| `install` | no | `'true'` | `'true'` のとき `pnpm install --frozen-lockfile`（mise の場合は `mise exec --` を前置）を実行 |
| `install-args` | no | `'--frozen-lockfile'` | 将来 `e2e-tests-coverage-gate` のような特殊ケース向け拡張点。MVP では既定値固定運用 |

> 全 input は string（boolean 入力は GitHub Actions の制約上 string で受けるのが正規）。

### 2.2 outputs

| name | value | 用途 |
|------|-------|------|
| `node-version` | 実際に resolve された Node version（`node --version` の値） | デバッグ / log 監査用 |
| `pnpm-version` | 実際に resolve された pnpm version（`pnpm --version` の値） | 同上 |
| `setup-strategy` | 採用 setup-strategy 文字列（入力をそのまま echo） | 呼び出し側で if 分岐したい場合の参照点 |

### 2.3 副作用

- `$GITHUB_PATH` に Node / pnpm が追加される。
- `$RUNNER_TEMP/setup-pnpm` 等 cache ディレクトリが副作用として作成される（`pnpm/action-setup` の標準動作）。
- `mise` 系統では `~/.local/share/mise` 配下にツールが展開される（`mise-action` 標準）。
- `pnpm install --frozen-lockfile` が `node_modules/` を作成する。

### 2.4 不変条件

- composite 自体は `working-directory` を変更しない（呼び出し側の cwd を尊重）。
- composite 内で `secrets.*` を一切参照しない（`pr-build-test.yml` の untrusted PR head 前提を維持）。
- `setup-strategy` 入力の値域は `setup-node` または `mise` の 2 値に限定し、不正値は `run: |` ガードで早期失敗させる。

---

## 3. affected workflow inventory（呼び出し側マッピング）

| workflow | job | 現行 setup step 数 | setup-strategy | install 必要 | composite 化後 step 数 | 備考 |
|---------|-----|-------------------|--------|-------------|----------------------|------|
| `lighthouse.yml` | `lighthouse` | 4（checkout + pnpm/action-setup + setup-node + install） | setup-node | true | 2（checkout + setup-project） | install:true 既定で十分 |
| `e2e-tests.yml` | `e2e`（matrix 3 shard） | 4 | setup-node | true | 2 | Playwright browser install は composite 後段に残す |
| `e2e-tests.yml` | `e2e-tests-coverage-gate` | 4 | setup-node | true | 2 | coverage gate script が `pnpm` 利用 |
| `ci.yml` | `workflow-shell-lint` | 3（pnpm/action-setup + setup-node + apt shellcheck）→ setup 部分のみ置換 | setup-node | false（install 不要） | 1（setup-project install:'false'） + 既存 shellcheck step | `install:'false'` で軽量化 |
| `ci.yml` | `ci` | 3（pnpm/action-setup + setup-node + install）+ `if:` ガード付き | setup-node | true | 1（setup-project、`if:` 維持） | step-level `if` は呼び出し側で維持 |
| `ci.yml` | `coverage-gate` | 3（pnpm/action-setup + setup-node + install）+ `if:` ガード付き | setup-node | true | 1（setup-project、`if:` 維持） | 同上 |
| `pr-build-test.yml` | `build-test` | 2（mise-action + install）+ checkout SHA pin | mise | true | 1（setup-project setup-strategy:'mise'） | SHA pin policy（UT-GOV-007）を composite 内で吸収 |

合計: setup 関連 step `4×3 + 4×1 + 3×3 + 2 = 27 step` → `2×4 + 1×3 + 1×1 = 12 step` 相当（checkout は別、概算）。
**setup 系 step 削減率: 約 55-70%**（最終実測は Phase 11 evidence）。

> `workflow-shell-lint` の `apt-get install shellcheck` / `Download actionlint` 等は composite 化対象外（責務分離）。

---

## 4. setup-strategy 切替モデル

```mermaid
flowchart TD
  A[caller workflow] -->|setup-strategy input| B{setup-strategy == 'mise'?}
  B -- yes --> C[jdx/mise-action@v2 cache=true]
  C --> D[mise exec -- pnpm install --frozen-lockfile]
  B -- no --> E[pnpm/action-setup@v4 version=pnpm-version]
  E --> F[actions/setup-node@v4 node-version cache=pnpm]
  F --> G[pnpm install --frozen-lockfile]
  D --> H[outputs.node-version / pnpm-version / setup-strategy]
  G --> H
```

| 観点 | setup-node 系統 | mise 系統 |
|------|-----------------|----------|
| Node 解決 | input `node-version` | `.mise.toml` |
| pnpm 解決 | input `pnpm-version` | `.mise.toml` |
| cache | `actions/setup-node` の `cache: pnpm`（key = `pnpm-lock.yaml` ハッシュ） | `mise-action` の `cache: true`（mise tool dir） |
| 想定呼び出し元 | 内部 PR / push (trusted context) | untrusted PR head（fork PR 含む）= `pr-build-test.yml` |
| secrets 接触 | 一般的に許容 | **禁止**（composite 内で `secrets.*` 参照しない原則） |

---

## 5. 境界外（composite に含めない範囲）

| 項目 | 理由 |
|------|------|
| `actions/checkout` | 呼び出し側で SHA / ref / persist-credentials を個別指定する必要がある |
| Playwright browser install | matrix variable 依存（`desktop-chromium` / `desktop-firefox` / `mobile-webkit`）で呼び出し側 step 固有 |
| `pnpm --filter @ubm-hyogo/web build` 等の app build | workflow ごとに対象 filter / config が異なる |
| `shellcheck` / `actionlint` ダウンロード | `workflow-shell-lint` 専用 |
| coverage gate / lhci autorun の実行 | 呼び出し側 job の本体ロジック |

---

## 6. リスク・トレードオフ

| risk | 影響 | 緩和策 |
|------|------|--------|
| composite 内で `setup-node` と `mise` を if 分岐すると log が分かりにくくなる | デバッグ困難化 | `outputs.setup-strategy` を log 出力する。step name に setup-strategy を含める |
| composite action の `inputs.setup-strategy` 値域違反 | silent fallback で setup-node 系統が動いてしまう | composite 最初に `run: |` で値域チェック exit 1 |
| SHA pin 値が陳腐化 | security drift / dependabot 不整合 | `dependabot.yml`（既存）の `package-ecosystem: github-actions` で自動 PR 監視 |
| `e2e-tests-coverage-gate` で `actions/setup-node` の cache 復元失敗 | install 時間が増加 | cache miss は許容（hard failure ではない）。`cache: pnpm` 維持 |
| `ci.yml` の step-level `if: steps.ready.outputs.value == 'true'` を composite に持ち込めない | composite が無条件に install してしまう | step-level `if` を呼び出し側で維持（composite 自体には `if` を入れない） |

---

## 7. DoD（Phase 2 完了条件）

| # | 条件 |
|---|------|
| D-01 | inputs / outputs / 副作用 / 不変条件が全て表化されている |
| D-02 | affected workflow inventory が 7 job 全て埋まり、置換前後の step 数差分が概算されている |
| D-03 | setup-strategy 切替モデルが flowchart で図示されている |
| D-04 | 境界外項目（5 件）が明示されている |
| D-05 | リスク 5 件全てに緩和策が 1 対 1 で紐付いている |

---

## Template Compliance Appendix

## メタ情報

- workflow: issue-627-composite-setup-action
- phase: 2
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented_local_runtime_pending

## 目的

composite action `setup-project` の入出力境界・setup-strategy 切替モデル・affected workflow inventory を確定し、Phase 3 アーキテクチャ設計のインプットを提供する。

## 実行タスク

- inputs / outputs / 副作用 / 不変条件を表化する。
- 影響を受ける 7 job の置換前後 step 数を実測ベースで算出する。
- setup-strategy 切替（setup-node / mise）を flowchart で示し cache 戦略の違いを明記する。
- composite の境界外項目を 5 件列挙する。

## 参照資料

- phase-1.md（本サブタスク内）
- .github/workflows/{lighthouse,e2e-tests,ci,pr-build-test}.yml
- .mise.toml（Node / pnpm 正本値）
- docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/outputs/phase-2/design.md §3.2（untrusted context 原則）

## 実行手順

1. phase-1.md の AC-627-2..3 から inputs 設計を逆引きする。
2. 4 workflow の YAML を読み 7 job の現行 setup step を棚卸しする。
3. setup-strategy 切替の flowchart と cache 戦略表を作成する。
4. composite 境界外項目を責務分離原則で確定する。

## 統合テスト連携

- NON_VISUAL phase のため Playwright 実行なし。Phase 8 で actionlint / yamllint / list smoke を実行する。
- 実 GHA 実行は Phase 9 / 11 で draft PR ベースに実施する。

## 成果物

- 本 phase markdown
- Phase 3 への inputs/outputs インターフェース引き継ぎ

## 完了条件

- [x] 仕様記述済: 必須セクションが存在する。
- [x] 仕様記述済: coverage AC 適用: standard tier lines >= 70%（本タスク自体は NON_VISUAL）。
- [x] 仕様記述済: 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] 仕様記述済: phase 本文のタスクを棚卸しした。
- [x] 仕様記述済: 未実行項目を PASS として扱っていない。
