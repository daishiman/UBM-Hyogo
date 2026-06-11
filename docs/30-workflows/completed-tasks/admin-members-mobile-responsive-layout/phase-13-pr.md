# Phase 13: PR 作成（user-gated）

## メタ情報

- task_id: `admin-members-mobile-responsive-layout`
- phase: 13 / 13
- 前提: Phase 1-12 完了 + 実装サイクル（F1-F4 landed）
- SSOT: [outputs/shared-context.md](outputs/shared-context.md)
- **状態: spec_created（commit / push / PR はユーザー明示承認後のみ・CONST_002）**

## 目的

実装サイクルで F1-F4 が landed した後、`dev` を base とする PR を作成する。本タスク（仕様書作成）では PR を作成しない。

## 実行タスク（実装サイクル完了後・user 承認後）

1. `git fetch origin dev` → ローカル `dev` を fast-forward 同期。
2. 作業ブランチ `feat/admin-members-mobile-responsive-layout` に `dev` をマージ（コンフリクトは CLAUDE.md の方針で解消）。
3. 品質検証（CLAUDE.md PR フロー 4 コマンド）:
   - `pnpm install --force`
   - `pnpm typecheck`
   - `pnpm lint`
   - `bash scripts/verify-pr-ready.sh`（phase12-compliance / gate-metadata / indexes drift）
4. `git diff dev...HEAD --name-only` で PR 対象ファイル確認（F1-F4 + 本 workflow docs）。
5. `gh pr create --base dev` で PR 作成。本文に実装ガイド要点 + screenshot（375/640/1280）参照を含める。

## 参照資料

| 参照資料 | パス |
| -------- | ---- |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` |
| Phase 11 evidence | `outputs/phase-11/manual-test-result.md` |
| PR フロー | `CLAUDE.md`（PR作成の完全自律フロー） |

## 実行手順

上記「実行タスク」の順。ただし **commit / push / PR はユーザーの明示承認後のみ実行**。

## 統合テスト連携

- PR 作成前に targeted vitest + Playwright（環境が許せば）が緑であることを確認。

## 多角的チェック観点（AIが判断）

- base ブランチは `dev`（production リリース時のみ `main`）。
- screenshot 証跡が揃っているか（VISUAL task）。

## サブタスク管理

| ID | 内容 | status |
| -- | ---- | ------ |
| PR-1 | dev 同期 + マージ | pending（user-gated） |
| PR-2 | 4 検証コマンド | pending |
| PR-3 | gh pr create --base dev | pending（user-gated） |

## 成果物

| 成果物 | パス |
| ------ | ---- |
| PR 作成結果 | `outputs/phase-13/pr-creation-result.md` |

## 完了条件

- [ ] 実装サイクルで F1-F4 が landed。
- [ ] 4 検証コマンド緑。
- [ ] ユーザー承認取得。
- [ ] PR 作成（`--base dev`）。

## タスク100%実行確認【必須】

- [ ] PR 作成（user-gated・本仕様書段階では未実施）

## 次Phase

なし（最終 Phase）。
