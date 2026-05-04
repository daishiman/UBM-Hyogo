# Phase 13: PR 作成 — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 13 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 実装区分

[実装区分: 実装仕様書]

本タスクは admin meetings 機能の follow-up 実装を含むため、CONST_005 必須項目を満たす実装仕様書として作成する。

## 目的

user approval を得て PR を作る手順、local check 結果、change summary、PR template を確定する。

## 実行タスク

1. user approval gate を確認する。完了条件: 承認なしには push / PR を行わない宣言が記録される。
2. local-check-result（typecheck / lint / test の実行ログ要約）を貼る。完了条件: 失敗時の rollback ステップがある。
3. change-summary（変更ファイル一覧 / 追加 endpoint / 追加 D1 table / 追加 UI route）を書く。完了条件: artifacts.json と一致する。
4. PR template を書く（タイトル / Summary / Test plan / 関連 Issue / Co-Authored-By）。完了条件: `gh pr create --base dev` を踏む順序が決まる。

## 参照資料

- CLAUDE.md（ブランチ戦略 / Git Safety Protocol）
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-11/main.md

## 実行手順

- 対象 directory: docs/30-workflows/06c-E-admin-meetings/
- 本仕様書作成では PR を作らない。実装後の PR 作成は user approval 後に `gh pr create` を踏む。
- `--no-verify` を使わない。hook 失敗時は新規 commit で修正する。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #13 audit log
- #15 Auth session boundary
- secret / cookie 値が PR 本文・diff・スクリーンショットに混入しないか。

## サブタスク管理

- [ ] user approval gate を明記する
- [ ] local-check-result を書く
- [ ] change-summary を書く
- [ ] PR template を書く
- [ ] outputs/phase-13/main.md を作成する

## 実装仕様 (CONST_005)

### PR 本文要件（`.claude/commands/ai/diff-to-pr.md` 準拠）

PR 本文は以下を必須項目として含む:

1. **Summary**（3-5 行で「なぜ」を中心に記述）
2. **変更ファイル一覧**: `git diff main...HEAD --name-only` の結果をそのまま貼る
3. **追加 endpoint 一覧**: PATCH /api/admin/meetings/:id、GET /api/admin/meetings/:id/export.csv、論理削除エンドポイント
4. **AC マトリクスへのリンク**: `outputs/phase-04/ac-matrix.md` 等
5. **手動 smoke evidence へのリンク**: `outputs/phase-11/manual-smoke-log.md`
6. **スクリーンショット参照**: `outputs/phase-11/screenshots/` 配下の 5 枚（list / create / edit / attendance / csv-button）。`outputs/phase-11/` に png/jpg/jpeg/gif/webp が無い場合はスクリーンショットセクションを作らない。
7. **Test plan**: チェックリスト形式
8. **Co-Authored-By**: `Claude Opus 4.7 <noreply@anthropic.com>`

### user approval gate（必須）

- artifacts.json の `phase-13.user_approval_required` が `true`
- ユーザー承認前に `gh pr create` を実行することを禁止する宣言を `outputs/phase-13/main.md` に明記
- 承認 → push → `gh pr create --base dev` の順序を守る

### 実行前チェック（PR 作成直前）

```bash
git status --porcelain                     # 空であること
git diff main...HEAD --name-only           # PR 含めるファイル一覧取得
mise exec -- pnpm typecheck                # green
mise exec -- pnpm lint                     # green
mise exec -- pnpm test --filter @ubm-hyogo/api  # green
mise exec -- pnpm test --filter @ubm-hyogo/web  # green
mise exec -- pnpm build                    # green
pnpm sync:check                            # origin/main / origin/dev との drift 確認
```

### gate / 禁止事項

- **gate**: user_approval_required: true
- **禁止**:
  - ユーザー承認前の `gh pr create` 実行
  - `--no-verify` の使用（hook 失敗時は新規 commit で修正）
  - main / dev への force push
  - secret / cookie / API token 値を PR 本文・diff・スクリーンショットに含めること
- **solo dev policy**: reviewer 0、CI gate（required_status_checks）/ 線形履歴 / force-push 禁止 で品質保証

### evidence path

- `outputs/phase-13/main.md`（PR 作成手順インデックス）
- `outputs/phase-13/pr-template.md`（`gh pr create --body` にそのまま流せる雛形）
- `outputs/phase-13/local-check-result.md`（typecheck / lint / test / build のログ要約）
- `outputs/phase-13/pr-url.md`（PR 作成後に URL を記録）

### DoD（CONST_005）

- user approval 取得後に `gh pr create --base dev` を実行
- PR URL 取得済み
- CI 全 green（typecheck / lint / test / build / verify-indexes / coverage gate）
- reviewer 0（solo dev）でも CI gate のみで保護されることを確認
- secret 混入の最終チェック完了

## 成果物

- outputs/phase-13/main.md
- outputs/phase-13/pr-template.md（PR 本文の雛形）
- outputs/phase-13/local-check-result.md
- outputs/phase-13/pr-url.md（実行後）

## 完了条件（CONST_005 強化版）

- [x] user approval gate が明文化される
- [x] local check が green であることが前提条件として書かれる
- [x] PR template が `gh pr create --body` にそのまま流せる粒度になる
- [x] secret 混入リスクの最終チェック項目がある
- [x] PR URL が evidence に記録される
- [x] CI 全 green が確認される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 仕様書作成段階で PR を作成していない

## 次 Phase への引き渡し

なし（最終 phase）。user approval が降りた段階で実装担当が PR を作成する。
