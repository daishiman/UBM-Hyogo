# Phase 9: 品質検証 / Workspace-wide typecheck / lint / vitest / Coverage AC

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| Source | `outputs/phase-9/phase-9.md` |
| 区分 | 検証（実装変更なし。差し戻しのみ） |
| 想定所要 | 0.25 人日 |

## 目的

Phase 5-8 の差分が workspace 全体に regression を起こしていないことを、(a) workspace-wide typecheck、(b) workspace-wide lint、(c) workspace-wide vitest、(d) coverage-guard、(e) gate-metadata validator 再実行、の 5 ゲートで確認する。

## 実行タスク

- workspace-wide 5 ゲートを実行する。
- coverage AC を確認する。
- actionlint / shellcheck を再実行する。
- PR 差分の sanity check を実施する。

### 9.1 workspace-wide 5 ゲート実行

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test
mise exec -- pnpm gate-metadata:validate
bash scripts/coverage-guard.sh
```

すべて exit 0 を要求。

### 9.2 coverage AC 確認

| 対象 | 要件 |
| --- | --- |
| `packages/shared/src/gate-metadata/schema.ts` | Statements / Branches / Functions / Lines >= 80% |
| `scripts/gate-metadata/validate.ts` | 同上 |
| workspace 全体（既存パッケージ） | regression なし（既存 AC を維持） |

### 9.3 actionlint / shellcheck 再実行

```bash
actionlint .github/workflows/verify-gate-metadata.yml
shellcheck scripts/coverage-guard.sh   # 既存 file。回帰確認
```

### 9.4 PR 差分の sanity check

```bash
git diff dev...HEAD --name-only
# 期待差分:
#  - packages/shared/src/gate-metadata/schema.ts (new)
#  - packages/shared/src/gate-metadata/index.ts (new)
#  - packages/shared/src/gate-metadata/__tests__/schema.test.ts (new)
#  - packages/shared/src/index.ts (edit)
#  - scripts/gate-metadata/validate.ts (new)
#  - scripts/gate-metadata/__tests__/walk.test.ts (new)
#  - package.json (edit: script + deps)
#  - pnpm-lock.yaml (edit: deps)
#  - .github/workflows/verify-gate-metadata.yml (new)
#  - docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json (edit)
#  - docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/artifacts.json (edit)
#  - docs/30-workflows/issue-589-gate-metadata-structured-ledger/** (new spec dir)
#  - .claude/skills/task-specification-creator/references/phase12-checklist-definition.md (edit, Phase 12)
#  - .claude/skills/aiworkflow-requirements/references/gate-metadata.md (new, Phase 12)
#  - .claude/skills/aiworkflow-requirements/indexes/* (edit, Phase 12)
```

意図しない差分（無関係 file 混入）が無いこと。

## 変更対象ファイル

検証のみ。差し戻し時のみ Phase 5-8 ファイルへ最小修正。

## 入出力・副作用

- 入力: Phase 5-8 全成果物。
- 出力: `outputs/phase-9/phase-9.md`（5 ゲート stdout + coverage 数値 + diff name-only 抜粋）。
- 副作用: なし。

## テスト方針

既存テスト + 新規テスト全 green。新規テスト追加なし。

## ローカル実行・検証コマンド

§9.1 / §9.3 / §9.4 のコマンドをすべて実行し記録する。

## 統合テスト連携

- Phase 10 は本 Phase 5 ゲート全 exit 0 を前提に最終レビューを実施。
- Phase 13 PR push 時に CI 上で同等ゲートが再走する。

## 多角的チェック観点（AIが判断）

- **workspace 別 vitest 設定**: `packages/shared/vitest.config.ts` 上の include pattern が `__tests__/**/*.test.ts` を hit するか確認。
- **lock file drift**: pnpm-lock.yaml に無関係 upgrade や不要な追加依存が混入していないこと。

## サブタスク管理

- ST-1: §9.1 5 ゲート全 exit 0
- ST-2: §9.2 coverage AC 達成数値の記録
- ST-3: §9.3 actionlint / shellcheck 再実行
- ST-4: §9.4 PR 差分 name-only 検証
- ST-5: Phase 10 GO 判定

## 成果物

- `outputs/phase-9/phase-9.md`（stdout 抜粋 + coverage 数値表）。

## 完了条件（DoD）

- [ ] workspace-wide typecheck / lint / test / gate-metadata:validate / coverage-guard すべて exit 0。
- [ ] coverage Statements/Branches/Functions/Lines >= 80%（gate-metadata 関連 2 file）。
- [ ] actionlint / shellcheck exit 0。
- [ ] PR 差分に意図しない file 混入なし。

## タスク100%実行確認【必須】

- [ ] ST-1 ... ST-5 すべて完了
- [ ] `outputs/phase-9/phase-9.md` 生成済み
- [ ] Phase 10 着手 GO 判定済み

## 次Phase

[Phase 10: 最終レビュー](phase-10.md)

## 参照資料

- `docs/30-workflows/issue-589-gate-metadata-structured-ledger/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`
