# Phase 07: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-skill-ledger-a2-fragment |
| Phase | 7 |
| タスク種別 | implementation（refactoring） |
| visualEvidence | NON_VISUAL |
| workflow | implementation |

## 目的

変更した関数 / ブロックの line / branch カバレッジを実測し、概念ではなく数値で品質を担保する。**広域指定（全体 X%）に逃げず、変更行（本タスクで触る関数）に絞って実測値を残す**（FB-Feedback 5 対応）。

## カバレッジ対象（変更行に限定）

| 対象 | line 目標 | branch 目標 |
| ---- | --------- | ----------- |
| `scripts/skill-logs-render.ts:renderSkillLogs` | 100% | 100% |
| `scripts/skill-logs-render.ts:extractTimestampFromLegacy`（private） | 100% | 100% |
| `scripts/skill-logs-render.ts:parseFrontMatter` | 100% | 100% |
| `scripts/skill-logs-append.ts:generateFragmentPath` | 100% | 100% |
| `scripts/skill-logs-append.ts:generateNonce` | 100% | N/A（条件分岐なし） |
| `scripts/skill-logs-append.ts:appendFragment` | 100% | 100% |
| `scripts/skill-logs-append.ts:retryOnCollision` | 100% | 100%（retry 0 / 1 / 2 / 3 全分岐） |

## 実行タスク

- vitest coverage を targeted で実行：
  ```bash
  mise exec -- pnpm vitest run --coverage scripts/skill-logs-render.test.ts scripts/skill-logs-append.test.ts
  ```
- 上記対象関数の line / branch カバレッジ実測値を `outputs/phase-7/coverage.md` に表として記録。
- 100% 未達がある場合は不足ブランチを列挙し、Phase 6 へ追加テスト要求として記録する（Phase 6 差戻 OR Phase 7 内で追加）。
- dependency edge の coverage を可視化：
  - Append → fragment file system → Render → stdout / file 経路
  - Legacy bridge（`_legacy.md` mtime / 本文 heuristic）
  - CI guard（`git grep`）→ writer 経路の閉ループ
- 概念 / dependency edge / 数値の 3 軸で `outputs/phase-7/main.md` を構成する。

## 参照資料

- Phase 4 `outputs/phase-4/test-matrix.md`
- Phase 6 `outputs/phase-6/failure-cases.md`
- Phase 5 `outputs/phase-5/runbook.md`

## 成果物

- `outputs/phase-7/main.md`（concern / dependency edge / 数値の 3 軸サマリー）
- `outputs/phase-7/coverage.md`（変更行に限定した line / branch カバレッジ実測表）

## 統合テスト連携

coverage 計測は単体テストレベルで完結。

## 完了条件

- [ ] 対象関数 7 件すべての line / branch カバレッジ実測値が coverage.md に記載。
- [ ] 100% 未達があれば不足ブランチ・追加テスト方針が main.md に明記。
- [ ] dependency edge 図（append → render → stdout / `_legacy` bridge / CI guard）が main.md に記載。
- [ ] 広域指定（全体 X%）に逃げていない（FB-Feedback 5 対応）。
- [ ] artifacts.json の Phase 7 status と整合。
