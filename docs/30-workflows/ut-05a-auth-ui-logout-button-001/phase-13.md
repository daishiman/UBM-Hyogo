[実装区分: 実装仕様書]

# Phase 13: PR 作成 — ut-05a-auth-ui-logout-button-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-auth-ui-logout-button-001 |
| phase | 13 / 13 |
| wave | Wave 5 follow-up |
| mode | parallel |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| execution_allowed | false until explicit_user_instruction |

## 目的

Phase 1〜12 の成果物（仕様書 + 実装差分 + Phase 11 実測 evidence + system spec 更新差分）を
1 つの PR としてまとめ、CI gate / branch protection を経て main へ取り込む準備を行う。
**実行は user 明示指示後**。

## 実行タスク（user 明示指示後）

1. ブランチ命名:
   - 実装差分を含む段階: `feat/ut-05a-auth-ui-logout-button`
2. `git status --porcelain` で未コミット変更を確認
3. spec / 実装 / Phase 11 evidence をまとめてコミット
4. CLAUDE.md「PR作成の完全自律フロー」に従って `gh pr create` で通常 PR 作成
5. CI（typecheck / lint / verify-indexes / staged-task-dir-guard / coverage-guard）を確認
6. branch protection の `required_status_checks` を満たすことを確認
7. user が明示した場合のみ Issue #386 へ PR リンクをコメント（Issue は CLOSED のまま）

## 参照資料

- CLAUDE.md
- docs/30-workflows/ut-05a-auth-ui-logout-button-001/outputs/phase-12/phase12-task-spec-compliance-check.md
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md

## 自動実行禁止

- user 明示指示なしで `git commit` / `git push` / `gh pr create` を実行しない
- secret / session token を含む変更を含めない
- `--no-verify` を使用しない（hook が誤検知する場合は hook 自体を改善）

## PR 本文要素

- 概要: ログイン後 UI のログアウトボタン追加 + M-08 evidence 取得
- 対応 Issue: #386（CLOSED のまま）
- 含むもの:
  - phase-01〜13 仕様書
  - `apps/web` 配下の SignOutButton / MemberHeader / layout / sidebar 編集
  - Vitest unit test / manual smoke evidence（Playwright E2E は認証済 storage state が整った場合のみ任意追加）
  - Phase 11 evidence (`outputs/phase-11/...`)
  - system spec 更新差分
- 含まないもの:
  - Auth.js endpoint / middleware の変更
  - secret / token 値
  - 公開ルート向けの sign-out UI
- スクリーンショット: `outputs/phase-11/screenshots/before-signout-profile.png`,
  `outputs/phase-11/screenshots/before-signout-admin.png`,
  `outputs/phase-11/screenshots/after-signout.png`（実 smoke PASS 後）

## CI / branch protection 観点

- `required_pull_request_reviews=null`（solo dev）
- `required_status_checks` を全て PASS
- `required_linear_history` / `required_conversation_resolution` 遵守
- `--no-verify` 利用禁止

## サブタスク管理

- [ ] user 明示指示を得る
- [ ] CLAUDE.md「PR作成の完全自律フロー」に従って commit → push → PR 作成
- [ ] CI gate を確認
- [ ] outputs/phase-13/main.md に PR URL / CI 結果を記録

## 成果物

- outputs/phase-13/main.md（PR URL / CI 結果 / マージ可否）

## 完了条件

- PR が作成され CI が PASS
- 必要 status check が全て green
- Issue #386 の状態は CLOSED のまま
- secret / 個人情報が PR diff に含まれていない

## タスク100%実行確認

- [ ] user 明示指示後にのみ実行している
- [ ] secret / 個人情報が含まれていない
- [ ] CI が PASS している

## 完了後

- 05a-followup-google-oauth-completion Phase 11 M-08 の状態更新が反映されているか再確認
- task-specification-creator skill / aiworkflow-requirements skill の indexes 更新差分を取り込む（必要時）
- 後続 `Refs #386` タスクの起票要否を unassigned-task-detection の結果で判定
