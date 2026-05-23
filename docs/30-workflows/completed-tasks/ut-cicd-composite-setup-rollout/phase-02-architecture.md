---
phase: 2
title: アーキテクチャ — composite action surface と 13 workflow の差異整理
workflow_id: ut-cicd-composite-setup-rollout
status: completed
---

# Phase 2: アーキテクチャ

[実装区分: 実装仕様書]

## 1. composite action surface (`.github/actions/setup-project/action.yml`)

### inputs

| input | default | 役割 |
|-------|---------|------|
| `setup-strategy` | `node-setup` | `node-setup`（actions/setup-node + pnpm/action-setup） or `mise`（jdx/mise-action） |
| `install` | `'true'` | `pnpm install --frozen-lockfile` を実行するか |
| `node-version` | `24.15.0` | actions/setup-node に渡す Node 版 |
| `pnpm-version` | `10.33.2` | pnpm/action-setup に渡す pnpm 版 |
| `working-directory` | `.` | install 時の作業ディレクトリ |
| `cache` | `pnpm` | actions/setup-node の cache 戦略 |

### outputs

| output | 役割 |
|--------|------|
| `node-version` | `node -v` の実測 |
| `pnpm-version` | `pnpm -v` の実測 |
| `setup-strategy` | 実際に適用した strategy |

### 内部 step 構成

1. `setup-strategy` の値検証
2. `pnpm/action-setup@v4` (node-setup path)
3. `actions/setup-node@v4` (node-setup path)
4. `jdx/mise-action@v2` (mise path)
5. `pnpm install --frozen-lockfile` （`install=true` のとき）

## 2. setup-strategy の判定基準

13 workflow は既存挙動を保つため、原則 `node-setup`、`web-cd.yml` のみ `mise` strategy を採用する。

| 条件 | strategy |
|------|----------|
| `.github/workflows/` の中で `actions/setup-node` + `pnpm/action-setup` を直書きしており、後続 step が `pnpm` を直接使う | `node-setup` |
| 後続 step が `mise exec -- pnpm ...` を使う | `mise` |
| 元 workflow が install step を持たない | `node-setup` + `install: 'false'` + `cache: ''` |

> `web-cd.yml` は install 後の build step も `mise exec` を使うため、`jdx/mise-action` を消す代わりに `setup-project` の `mise` path へ集約する。`post-release-dashboard.yml` は install なし挙動を保持するため cache も空文字で無効化する。

## 3. 13 workflow の現行 setup ブロック差異

### 完全に同じパターン（cache: pnpm / install: --frozen-lockfile / node-version: 24 系）

ほぼ全 13 workflow が同パターン。差分は以下の軸に集約される:

| 軸 | バリエーション | 対象 workflow |
|----|----------------|---------------|
| `node-version` 表記 | `24.15.0` / `'24'` / `24` / `"24.15.0"` | 全 13 yaml で混在 |
| `cache` 表記 | `pnpm` / `"pnpm"` | 数 yaml で quoted |
| install 経路 | `pnpm install ...` / `mise exec -- pnpm install ...` / install なし | `web-cd.yml` は mise、`post-release-dashboard.yml` は install なし |
| install step に `if:` 条件 | あり / なし | `validate-build.yml` のみ `if: steps.ready.outputs.value == 'true'` |
| job 数（同パターン setup を複数 job に含む） | 1 / 2 / matrix | `web-cd.yml`, `cloudflare-alerts-drift.yml`, `backend-ci.yml` が 2 job、`ci.yml` は matrix shard |

### 全 13 yaml に共通する非対象 step（残置）

setup 直後の以下 step は composite action 化のスコープ外。手を入れない:

- `verify-gate-metadata.yml`: Install actionlint
- `d1-migration-verify.yml`: Install bats
- `verify-esbuild.yml`: verify:node-arch
- `web-cd.yml`: build-time placeholder env を渡す Deploy step

## 4. 置換の論理形

```yaml
# AFTER (共通テンプレ)
- uses: actions/checkout@v4
- uses: ./.github/actions/setup-project
  with:
    setup-strategy: node-setup
    install: 'true'
```

非 default 上書きが必要なケース:

| ケース | 必要な input 上書き |
|--------|--------------------|
| install step に `if:` 条件あり (`validate-build.yml`) | composite action 全体に `if:` を付与し、`install: 'true'` をそのまま使う |
| `web-cd.yml` | `setup-strategy: mise` を明示 |
| `post-release-dashboard.yml` | `install: 'false'` と `cache: ''` を明示 |

## 5. 影響範囲

- `.github/workflows/*.yml` × 13 のみ
- composite action 自体は変更なし
- 既存 cache（GitHub Actions cache）は composite action 経由でも同じ key を生成するため hit 継続

## 6. 統合テスト連携

| Phase | アクション |
|-------|------------|
| 2 | 13 yaml の差異を表 3 で整理 |
| 5 | 各 yaml の前後 diff snippet を実装ガイドに記載 |
| 11 | gh workflow view 出力を evidence として保存 |

## 完了条件

- [ ] composite action inputs/outputs が表 1 に列挙されている
- [ ] strategy 判定基準が表 2 に明記されている
- [ ] 13 yaml の差異軸が表 3 に整理されている
- [ ] 置換テンプレが §4 に記載されている
