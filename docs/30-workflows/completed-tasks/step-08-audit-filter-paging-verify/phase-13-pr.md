# Phase 13: PR 作成（user 承認後のみ）

**[実装区分: 実装仕様書（verify_existing）]**

> commit / push / PR は **user の明示承認後のみ** 実行する（CONST_002）。本仕様書では「承認待ち blocked」状態と、承認後の実行手順を定義する。出力は `outputs/phase-13/pr-creation-result.md`。

## 1. 現在の gate 状態

| 項目 | 状態 |
|------|------|
| Gate-C（external_ops） | `pending` / `blocked_pending_user_approval`（artifacts.json phase 13 と整合） |
| commit / push / PR | user 明示承認まで未実行（CONST_002） |
| code 変更 | ゼロ（`apps/` 差分なし。NFR-5 / AC-4） |
| deploy 検証 | **不要**（コード変更ゼロ・diff scope は docs-only） |
| Issue mutation | user-gated（承認前に起票・close しない） |

> user が「PR 作成」「PR 出して」または同等の依頼をした時点で本 blocked を解除し、§3 を CLAUDE.md「PR 作成の完全自律フロー」準拠で完遂する。

## 2. PR 基本方針

| 項目 | 値 |
|------|----|
| base ブランチ | `dev`（既定。production リリース時のみ `main`） |
| 差分種別 | docs-only diff scope（workflow分類は `taskType: implementation` / `visualEvidence: NON_VISUAL`） |
| CI gate | docs-diff gate 中心（§4） |
| PR 本文 | `.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として参照。`outputs/phase-12/implementation-guide.md` の内容を反映 |
| スクリーンショット | なし（`outputs/phase-11/` に画像なし → スクリーンショット専用セクションを作らない） |

## 3. 承認後の実行手順（CLAUDE.md PR 完全自律フロー準拠）

```bash
# 1. dev 同期
git fetch origin dev
# ローカル dev を origin/dev へ fast-forward → 作業ブランチへ merge（conflict は CLAUDE.md 既定方針で自律解消）

# 2. 品質検証（4 コマンド）
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh   # docs-diff gate pre-flight

# 3. PR 差分一覧確認
git status --short                # workflow docs + aiworkflow sync のみ
git status --short -- apps packages # 空であること（NFR-5）
git diff -- apps packages         # 空であること（NFR-5）

# 4. PR 作成
gh pr create --base dev   # diff-to-pr.md + implementation-guide.md を本文に反映
```

| 手順 | 内容 | 失敗時 |
|------|------|--------|
| dev 同期 | `git fetch origin dev` → ローカル dev FF → 作業ブランチへ merge | conflict は CLAUDE.md コンフリクト解消既定方針で自律解消 + commit |
| 品質検証 | install --force / typecheck / lint / verify-pr-ready.sh | 最大 3 回まで自動修復しコミット（lint は `--fix` 先行） |
| 差分確認 | workflow docs + aiworkflow sync のみ / apps-packages 差分 0 | apps/ または packages/ に差分があれば NFR-5 違反 → Phase 12 へ差し戻し |
| PR 作成 | `gh pr create --base dev` | — |

## 4. CI gate（docs-diff / verify_existing）

| gate | 確認内容 | 期待 |
|------|---------|------|
| `verify-pr-ready.sh` | gate-metadata / phase12-compliance / indexes drift 一括 pre-flight | PASS |
| `gate-metadata:validate` | artifacts.json の zod schema 適合 | PASS |
| `verify:phase12-compliance` | canonical 9 headings / Phase 11 evidence 表 / workflow root scan | PASS |
| `indexes:rebuild` drift | `.claude/skills/aiworkflow-requirements/indexes` に drift なし | drift 0 |

> コード変更ゼロのため `apps/` ビルド・deploy 系 CI（playwright-smoke / verify-design-tokens の実 fail 判定）は本 PR の主 gate ではない。docs-diff gate 群が緑であることを完了根拠とする。

## 5. テスト実行方針

- テストコード実行は user 明示なしに本 PR 作成フローでは行わない（CLAUDE.md 規約）。既存テストの回帰実行は Phase 11（execute 時）の責務。

## 6. 出力成果物

| ファイル | 内容 |
|---------|------|
| `outputs/phase-13/pr-creation-result.md` | PR URL / 採用 base ブランチ（dev）/ 実行した自動修復 / 解消した conflict / 残課題の有無を 1 回記録 |

> 承認前は `pr-creation-result.md` を `status: blocked_pending_user_approval` の placeholder として保持し、PR URL 欄は空のままにする。

## 7. 完了条件（Phase 13 DoD）

- [ ] commit / push / PR が user 明示承認後のみ実行される旨（CONST_002）と現在の `blocked_pending_user_approval` 状態を明記した（§1）。
- [ ] 承認後手順を CLAUDE.md PR 完全自律フロー準拠（base=dev / install --force / typecheck / lint / verify-pr-ready.sh / git diff dev...HEAD / gh pr create --base dev）で定義した（§3）。
- [ ] docs-diff / verify_existing 向け CI gate（verify-pr-ready.sh / gate-metadata:validate / verify:phase12-compliance / indexes:rebuild drift）を中心に定義し、deploy 検証不要と明記した（§4）。
- [ ] コード変更ゼロのため deploy 検証不要・Issue mutation も user-gated と明記した（§1 / §4）。
- [ ] 出力 `outputs/phase-13/pr-creation-result.md` の記録項目を定義した（§6）。
- [ ] スクリーンショットがないためスクリーンショット専用セクションを作らない方針を明記した（§2）。
