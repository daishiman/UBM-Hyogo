# Phase 7: CI/CD 統合（`audit-correlation-verify.yml`）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| Source | `outputs/phase-7/phase-7.md` |
| 区分 | 実装（GitHub Actions） |
| 想定所要 | 0.5 人日 |

## 目的

Phase 4-6 の vitest / bats / grep-gate / shellcheck を CI で恒久実行し、PR / push 時に自動 verify する gate を構築する。

## 変更対象ファイル一覧

| パス | 種別 | 概要 |
| --- | --- | --- |
| `.github/workflows/audit-correlation-verify.yml` | 新規 | CI workflow |
| `.github/CODEOWNERS` | 編集 | `apps/api/src/audit-correlation/**` / `scripts/audit-correlation/**` の owner 追加 |

## 実行タスク

1. `.github/workflows/audit-correlation-verify.yml` を追加し、fixture-driven test / grep gate / shellcheck / actionlint を実行する。
2. `.github/CODEOWNERS` に audit-correlation owner を追加する。
3. branch protection required check は実設定せず、Phase 12 follow-up として記録する。
4. local actionlint と CODEOWNERS read-only validation を Phase 11 evidence に残す。

## workflow 仕様

トリガ:
- `pull_request` で `apps/api/src/audit-correlation/**` / `scripts/audit-correlation/**` / `.github/workflows/audit-correlation-verify.yml` の変更時。
- `push` で `main` / `dev` ブランチ。

ジョブ構成:

```yaml
name: audit-correlation-verify
on:
  pull_request:
    paths:
      - 'apps/api/src/audit-correlation/**'
      - 'scripts/audit-correlation/**'
      - '.github/workflows/audit-correlation-verify.yml'
  push:
    branches: [main, dev]
jobs:
  verify:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise exec -- pnpm install --frozen-lockfile
      - run: mise exec -- pnpm --filter @ubm/api typecheck
      - run: mise exec -- pnpm --filter @ubm/api lint
      - run: mise exec -- pnpm --filter @ubm/api test src/audit-correlation
      - name: bats tests
        run: |
          sudo apt-get install -y bats shellcheck
          mise exec -- bash scripts/audit-correlation/__tests__/grep-gate.bats
          mise exec -- bash scripts/audit-correlation/__tests__/runner-determinism.bats
      - name: shellcheck
        run: shellcheck scripts/audit-correlation/*.sh
      - name: actionlint
        uses: rhysd/actionlint@v1
```

## 必須 status check への登録

- branch protection（main / dev）に `audit-correlation-verify / verify` を必須 status check として将来追加（本タスクで設定変更まではしないが、Phase 12 で TODO として記録）。

## CODEOWNERS 更新

```
apps/api/src/audit-correlation/** @daishiman
scripts/audit-correlation/** @daishiman
.github/workflows/audit-correlation-verify.yml @daishiman
```

CLAUDE.md「Governance / CODEOWNERS」と整合。

## ローカル実行コマンド

```bash
# actionlint local
mise exec -- pnpm dlx @rhysd/actionlint-runner@latest .github/workflows/audit-correlation-verify.yml

# CODEOWNERS validation
gh api repos/daishiman/UBM-Hyogo/codeowners/errors
```

## テスト方針

- 自分自身の workflow を `actionlint` clean にする。
- PR を仮で立てて `audit-correlation-verify` が実行されることを目視確認（Phase 11 evidence で記録）。

## 参照資料

- CLAUDE.md「Governance / CODEOWNERS」
- 既存 `.github/workflows/verify-indexes.yml`（参考フォーマット）

## 成果物

- `.github/workflows/audit-correlation-verify.yml`
- `.github/CODEOWNERS` 更新
- `outputs/phase-7/phase-7.md`

## 完了条件（DoD）

- [ ] `actionlint` clean。
- [ ] CODEOWNERS errors 0 件（`gh api repos/.../codeowners/errors`）。
- [ ] PR で workflow が走り全 step green。
