---
phase: 4
title: データ契約 — 13 workflow の現行 setup input 表
workflow_id: ut-cicd-composite-setup-rollout
status: completed
---

# Phase 4: データ契約

[実装区分: 実装仕様書]

## 1. composite action input 契約（再掲）

| input | type | default | rollout 時の値 |
|-------|------|---------|----------------|
| `setup-strategy` | `node-setup \| mise` | `node-setup` | 原則 `node-setup`。`web-cd.yml` は `mise` |
| `install` | `'true' \| 'false'` | `'true'` | 原則 `'true'`。`post-release-dashboard.yml` は `'false'` |
| `node-version` | string | `24.15.0` | default に集約（明示指定なし） |
| `pnpm-version` | string | `10.33.2` | default に集約 |
| `working-directory` | string | `.` | default に集約 |
| `cache` | string | `pnpm` | default に集約 |

## 2. 13 workflow の現行入力（before）と置換後（after）

凡例: `nv` = node-version, `pv` = pnpm-version, `wd` = working-directory

| # | workflow | job | nv (before) | pv (before) | cache (before) | wd (before) | install (before) | rollout 後の上書き |
|---|----------|-----|-------------|-------------|----------------|-------------|------------------|---------------------|
| 1 | `verify-gate-metadata.yml` | (default) | `24.15.0` | `10.33.2` | `pnpm` | `.` | `pnpm install --frozen-lockfile` | なし（all default） |
| 2 | `verify-indexes.yml` | (default) | `'24'` | `10.33.2` | `pnpm` | `.` | 同上 | なし |
| 3 | `web-cd.yml` | staging | `'24'` | 10.33.2 via mise | n/a | `.` | `mise exec -- pnpm install --frozen-lockfile` | `setup-strategy: mise` |
| 3 | `web-cd.yml` | production | `'24'` | `10.33.2` | `pnpm` | `.` | 同上 | なし |
| 4 | `validate-build.yml` | (default) | `'24'` | `10.33.2` | `pnpm` | `.` | 同上（`if:` 条件あり） | composite action ステップに `if:` 継承 |
| 5 | `d1-migration-verify.yml` | (default) | `24` | `10.33.2` | `pnpm` | `.` | 同上 | なし |
| 6 | `verify-esbuild.yml` | (default) | `24.15.0` | `10.33.2` | `pnpm` | `.` | 同上 | なし |
| 7 | `cloudflare-alerts-drift.yml` | validate | `"24.15.0"` | `10.33.2` | `"pnpm"` | `.` | 同上 | なし |
| 7 | `cloudflare-alerts-drift.yml` | diff | `"24.15.0"` | `10.33.2` | `"pnpm"` | `.` | 同上 | なし |
| 8 | `backend-ci.yml` | staging | `'24'` | `10.33.2` | `pnpm` | `.` | 同上 | なし |
| 8 | `backend-ci.yml` | production | `'24'` | `10.33.2` | `pnpm` | `.` | 同上 | なし |
| 9 | `cloudflare-analytics-export.yml` | (default) | `"24.15.0"` | `10.33.2` | `pnpm` | `.` | 同上 | なし |
| 10 | `lighthouse.yml` | (default) | `24.15.0` | `10.33.2` | `pnpm` | `.` | 同上 | なし |
| 11 | `post-release-dashboard.yml` | (default) | `'24'` | `10.33.2` | disabled | `.` | install なし | `install: 'false'`, `cache: ''` |
| 13 | `verify-phase12-compliance.yml` | (default) | `'24'` | `10.33.2` | `pnpm` | `.` | 同上 | なし |

## 3. node-version 値の正規化

| 現行値 | 解釈 | composite action default `24.15.0` への置換可否 |
|--------|------|---------------------------------------------------|
| `24.15.0` / `"24.15.0"` | 完全一致 | 可（明示指定不要） |
| `'24'` / `24` | actions/setup-node が semver 最新 (24.x) を解決 | 可（24.15.0 に固定されるが、現行 24.x cache key で hit ロス可能性あり） |

### cache key 影響

actions/setup-node の cache key は `setup-node-${platform}-${arch}-${node-version}-...` の形式。

- `'24'` → `24.x` 系の cache key
- `24.15.0` → `24.15.0` の cache key

両者は別 key になるが、cache miss しても 1 回目の install で再生成されるため機能影響なし。初回 PR run のみ install が約 30s 増える可能性あり（リスク表 phase-09 で再掲）。

## 4. 入出力契約の不変条件

- composite action 経由で得られる Node binary は actions/setup-node が PATH 設定済み
- composite action 経由で得られる pnpm binary は pnpm/action-setup が PATH 設定済み
- `pnpm install --frozen-lockfile` は composite action 内部で実行されるため、移行後の workflow 側に install step を残してはいけない（重複 install になる）

## 5. 統合テスト連携

| Phase | アクション |
|-------|------------|
| 4 | 13 yaml の現行値を表で固定 |
| 5 | 表に基づき yaml ごとに diff snippet を作成 |

## 完了条件

- [ ] composite action input 契約が §1 に再掲されている
- [ ] 13 yaml の before/after 入力が §2 に列挙されている
- [ ] node-version 正規化方針が §3 に明記されている
