---
phase: 8
title: DoD — Definition of Done
workflow_id: ut-cicd-composite-setup-rollout
status: completed
---

# Phase 8: DoD（Definition of Done）

[実装区分: 実装仕様書]

## 1. DoD チェックリスト

### コード差分

- [x] 対象 13 workflow すべてに `uses: ./.github/actions/setup-project` が含まれる
- [x] 対象 13 workflow から `uses: actions/setup-node@v4` の直書きが削除されている
- [x] 対象 13 workflow から `uses: pnpm/action-setup@v4` の直書きが削除されている
- [x] 対象 13 workflow から `pnpm install --frozen-lockfile` の単独 step が削除されている（composite action 内部に統合）
- [x] `.github/actions/setup-project/action.yml` には一切変更を入れていない
- [x] `apps/`, `packages/`, `docs/`（本 SW 配下以外）, `scripts/` に変更がない

### 検証コマンド (CONST_005)

```bash
# AC-1: composite action 経由の workflow 件数（既存 6 + 新規 13 = 18）
grep -l 'uses: ./.github/actions/setup-project' .github/workflows/*.yml | wc -l
# → 18

# AC-2: raw setup-node 残存件数
grep -l 'uses: actions/setup-node' .github/workflows/*.yml | wc -l
# → 0

# AC-3: raw pnpm/action-setup 残存件数
grep -l 'uses: pnpm/action-setup' .github/workflows/*.yml | wc -l
# → 0

# AC-4: install step 単独残存件数（参考）
grep -nE '^\s*run:\s*pnpm install --frozen-lockfile' .github/workflows/*.yml | wc -l
# → 0
```

### CI run

- [ ] PR run で Batch A の 6 workflow が全 success（Phase 13 user-gated）
- [ ] PR run で既存移行済み 5 workflow（`pr-build-test` / `e2e-tests` / `verify-stable-key-update` / `playwright-visual-full` / `playwright-visual-baseline-update`）が regression なし（Phase 13 user-gated）
- [ ] Batch B（monitoring 系 4 yaml）を `gh workflow run --ref <branch>` で各 1 回手動 trigger し全 success（Phase 13 user-gated）
- [ ] Batch C（deploy 系 2 yaml）を staging 経路で smoke 確認（`web-cd.yml` の staging job、`backend-ci.yml` staging job）（Phase 13 user-gated）

### evidence

- [x] `outputs/phase-11/grep-raw-setup-node-before.txt` 取得済（pre-edit）
- [x] `outputs/phase-11/grep-raw-setup-node-after.txt` 取得済（post-edit, 0 件）
- [x] `outputs/phase-11/grep-raw-pnpm-action-setup-before.txt` / `-after.txt` 取得済
- [x] `outputs/phase-11/workflow-diff.patch` 取得済
- [ ] `outputs/phase-11/ci-run-urls.md` に PR run URL / dispatch run URL を集約済（Phase 13 user-gated）

### Issue / PR

- [ ] PR base = `dev`（Phase 13 user-gated）
- [ ] PR 本文に Issue #284 link / 13 workflow 一覧 / AC verification 結果を記載（Phase 13 user-gated）
- [ ] PR merge 後に Issue #284 を close（`gh issue close 284`）（Phase 13 user-gated）

## 2. 関数/モジュール構造（CONST_005）

本タスクは関数追加を行わない。yaml 差し替えのみ。
影響する論理的 unit:

- 13 workflow の `jobs.<job_id>.steps[]` 配列
- 各 step の `uses` / `with` / `if` キー

## 3. 入出力（CONST_005）

| 種類 | 内容 |
|------|------|
| 入力 | 13 workflow の現行 yaml |
| 出力 | composite action 経由に置換された 13 yaml |
| 副作用 | GitHub Actions cache key が `'24'` 系 → `24.15.0` に変わる workflow がある（初回のみ cache miss） |

## 4. テスト方針（CONST_005, 再掲）

Phase 6 を参照。新規テストコードは追加しない。CI 実 run を正本検証とする。

## 5. CONST_007 遵守

13 workflow すべてを 1 サイクル内で完遂する。
中断・先送りした workflow がある場合は本 DoD を満たさない。

## 6. 統合テスト連携

| Phase | アクション |
|-------|------------|
| 8 | DoD を確定し Phase 11 evidence と紐付ける |
| 13 | PR merge 前に DoD 全項目を再確認 |

## 完了条件

- [x] §1 全項目チェック可能
- [x] §2〜§4 で CONST_005 必須項目が記載されている
- [x] §5 で CONST_007 遵守が宣言されている
