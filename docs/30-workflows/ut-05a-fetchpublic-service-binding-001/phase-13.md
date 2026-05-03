# Phase 13: PR 作成 — ut-05a-fetchpublic-service-binding-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-fetchpublic-service-binding-001 |
| task_id | UT-05A-FETCHPUBLIC-SERVICE-BINDING-001 |
| phase | 13 / 13 |
| wave | Wave 5 |
| mode | serial |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #387 (CLOSED) |
| execution_allowed | false until explicit_user_instruction |

## 目的

Phase 1〜12 の成果物（仕様書 + 実装差分 + staging/production evidence + system spec
更新差分）を 1 つの PR としてまとめ、CI gate / branch protection を経て main へ取り込む
準備を行う。**実行は user 明示指示後**。

## 実行タスク（user 明示指示後）

1. ブランチ命名:
   - 仕様書のみの段階: `docs/issue-387-ut-05a-fetchpublic-service-binding-task-spec`
   - 実 deploy 後 evidence は同ブランチに追加コミット、または
     `feat/ut-05a-fetchpublic-service-binding-evidence` を新規作成
2. `git status --porcelain` で未コミット変更を確認
3. evidence / spec / system spec / `apps/web/src/lib/fetch/public.ts` / `apps/web/wrangler.toml`
   差分をまとめてコミット
4. `gh pr create` で通常 PR 作成（CLAUDE.md「PR作成の完全自律フロー」に従う）
5. CI（typecheck / lint / verify-indexes / staged-task-dir-guard / coverage-guard）を確認
6. branch protection の `required_status_checks` を満たすことを確認
7. user が明示した場合だけ Issue #387 へ PR リンクをコメント（Issue は **CLOSED のまま**）

## 参照資料

- `CLAUDE.md`
- `docs/30-workflows/ut-05a-fetchpublic-service-binding-001/outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 自動実行禁止

- user 明示指示なしで `git commit` / `git push` / `gh pr create` を実行しない
- secret 値（CLOUDFLARE_API_TOKEN / OAuth token / cookie 値）を含む変更を含めない
- production deploy を本 PR で勝手に実行しない（Phase 11 で user 明示指示後にのみ実行）
- `--no-verify` の利用は禁止（hook が誤検知する場合は hook 自体を改善する）

## PR 本文要素

- 概要: `apps/web` `fetchPublic` を service-binding (`env.API_SERVICE.fetch(...)`) 経路に
  統一し staging/production `/` `/members` 500 を解消する
- 対応 Issue: #387（**CLOSED のまま**）
- 含むもの:
  - phase-01〜13 仕様書一式
  - `apps/web/src/lib/fetch/public.ts` 差分（service-binding + HTTP fallback）
  - `apps/web/wrangler.toml` 差分（`[[env.staging.services]]` / `[[env.production.services]]`）
  - 実 staging / production evidence（PASS 後）
  - aiworkflow-requirements indexes / `task-workflow-active.md` 差分
- 含まないもの:
  - secret 値
  - API 側ルーティング変更
  - session-resolve の経路変更
- スクリーンショット: `outputs/phase-11/` 配下に画像がある場合のみ参照（無い場合はセクションを設けない）

## CI / branch protection 観点

- `required_pull_request_reviews=null`（solo dev）
- `required_status_checks` を全て PASS させる
- `required_linear_history` / `required_conversation_resolution` 遵守
- coverage-guard / staged-task-dir-guard の merge skip 規則が誤発動しないこと

## サブタスク管理

- [ ] user 明示指示を得る
- [ ] CLAUDE.md「PR作成の完全自律フロー」に従って commit → push → PR 作成
- [ ] CI gate を確認
- [ ] outputs/phase-13/main.md に PR URL / CI 結果を記録

## 成果物

- `outputs/phase-13/main.md`（PR URL / CI 結果 / マージ可否）

## 完了条件

- PR が作成され CI が PASS
- 必要 status check が全て green
- Issue #387 の状態は CLOSED のまま
- secret 値や個人情報が PR diff に含まれていない

## タスク100%実行確認

- [ ] user 明示指示後にのみ実行している
- [ ] secret / 個人情報が含まれていない
- [ ] CI が PASS している
- [ ] Issue #387 が CLOSED のまま維持されている

## 完了後

- `task-workflow-active.md` 上の本タスク entry を `completed` に更新（実 deploy PASS 後のみ）
- `unassigned-task/task-05a-fetchpublic-service-binding-001.md` を
  `completed-tasks/` 配下に移動するかの判定（user 明示指示後）
- task-specification-creator skill / aiworkflow-requirements skill の indexes 更新差分を
  取り込む（必要時）
- 後続 `Refs #387` タスクの起票要否を unassigned-task-detection の結果で判定
