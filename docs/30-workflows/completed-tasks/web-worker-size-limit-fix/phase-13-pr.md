# Phase 13: commit-pr-release

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
|------|-----|
| task_id | `web-worker-size-limit-fix` |
| base ブランチ | `dev`（既定） |
| Gate-C | `pending`（external ops は user-gated） |
| PR 本文の正本 | `.claude/commands/ai/diff-to-pr.md`（Phase 13 仕様） + 本 Phase 12 `implementation-guide.md` |

## 目的

Task A（next/og 撤去 + 静的 OG 画像化）と Task B（production minify 維持 + CI サイズ gate）の実装差分を PR 化し、staging deploy で Worker gzip サイズが 3072KiB（3MiB）上限を下回ることを検証可能にする。

## 実行タスク

1. 実装完了後、`git diff dev...HEAD --name-only` で PR 対象ファイルを確定する。
2. `implementation-guide.md` の Part2（Task A/B 変更ファイル・DoD）を PR 本文へ反映する。
3. `gh pr create --base dev` で PR を作成する。

## 参照資料

- `.claude/commands/ai/diff-to-pr.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-11/`（手動テスト証跡）

## 実行手順

1. `pnpm install --force` → `pnpm typecheck` → `pnpm lint` → `bash scripts/verify-pr-ready.sh` を実行する。
2. `scripts/check-worker-size.sh` をローカルで実行し gzip サイズが閾値内であることを確認する。
3. PR 本文を作成し PR を作成する。

## 多角的チェック観点（AIが判断）

- PR 差分に implementation_targets 9 ファイルが過不足なく含まれること。
- next/og 由来 wasm/font が bundle から消えていること（regression spec で 0 件 assert）。
- CI の size gate が両 deploy job で発火すること。

## サブタスク管理

| サブタスク | 区分 | 状態 |
|-----------|------|------|
| 品質検証 4 コマンド | quality | blocked（実装後） |
| PR 作成 | external_ops | blocked（user 承認まで） |

## 成果物

- PR URL
- `outputs/phase-13/pr-creation-result.md`（PR 作成後）

## 完了条件

- [ ] 品質検証 4 コマンドが PASS
- [ ] `scripts/check-worker-size.sh` が閾値内
- [ ] PR が `--base dev` で作成された

## タスク100%実行確認【必須】

- [ ] 実装差分が全件 PR に含まれた
- [ ] PR 本文が `implementation-guide.md` を反映した
- [ ] user 承認後に commit/push/PR/staging deploy を実行した

## blocked ルール（必須・厳守）

> **commit / push / PR 作成 / staging deploy は user 承認まで実行禁止（user-gated / Gate-C pending）。**
>
> - 本 Phase は `implemented_local_evidence_captured` であり、コードは未実装。
> - `git commit` / `git push` / `gh pr create` / `bash scripts/cf.sh deploy` は user が明示的に承認するまで実行しない。
> - Cloudflare 系 CLI は必ず `scripts/cf.sh` 経由（`wrangler` 直叩き禁止）。

## 次Phase

なし（最終 Phase）。
