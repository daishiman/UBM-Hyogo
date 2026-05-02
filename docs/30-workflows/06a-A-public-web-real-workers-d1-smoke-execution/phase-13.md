# Phase 13: PR 作成 — 06a-A-public-web-real-workers-d1-smoke-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06a-A-public-web-real-workers-d1-smoke-execution |
| phase | 13 / 13 |
| wave | 6a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 更新日 | 2026-05-02 |
| taskType | implementation / spec-with-execution-runbook |
| visualEvidence | VISUAL_ON_EXECUTION |
| status | spec_created / pending-user-approval |

## 目的

Phase 1〜12 で生成した仕様書ファイル群を、user 承認 gate 後に commit / push / PR 作成へ進めるための手順を固定する。

PR 作成は `.claude/commands/ai/diff-to-pr.md` を **Phase 13 仕様の正本** として参照しつつ、本タスク固有の評価軸（VISUAL evidence・不変条件 #5/#6/#8/#14・`Refs #273` 表記）を満たす。

実 smoke 実行とアプリケーションコード変更は別 PR で対応する。本仕様書作成タスクでは commit / push / PR 作成を実行しない。

## ユーザー承認 gate

- 本 phase の commit / push / PR 作成は **user の明示的 GO 指示後にのみ実行**
- spec ファイル群が AC / outputs / index.md と整合していることを Phase 12 compliance check で確認済みであることが前提
- 本タスクは Issue #273（CLOSED）由来であり、Issue 再オープンは行わない。PR 本文は `Refs #273` 固定

## `diff-to-pr.md` ワークフローとの対応

`.claude/commands/ai/diff-to-pr.md` の各 Phase を本タスクへ写像する:

| diff-to-pr Phase | 本タスクでの実施内容 |
| --- | --- |
| Phase 0: リモート mainn 同期 | `git fetch origin main` → ローカル `main` を fast-forward → 作業ブランチで `git merge main` |
| Phase 1: 品質検証 | `pnpm install --force` / `pnpm typecheck` / `pnpm lint`（実 smoke 実行は対象外） |
| Phase 1.5: 未タスク自動クローズアウト | Phase 12 `unassigned-task-detection.md` を入力として確認 |
| Phase 2: 差分分析 / commit | spec ファイル群を 1 commit にまとめる。実コード差分は含めない |
| Phase 3: PR 本文生成 / PR 作成 | 後述「PR 本文テンプレ」を使用 |
| Phase 4: 補足コメント投稿 | evidence path の placeholder（実 smoke で埋める）と pending 一覧を補足コメントとして投稿 |
| Phase 5: CI 確認 | typecheck / lint / build / verify-indexes-up-to-date が green になることを確認 |

## 本 PR に含めない変更

| 種別 | 扱い |
| --- | --- |
| `apps/web/wrangler.toml` env 変更 | 既に staging / production の `PUBLIC_API_BASE_URL` と `API_SERVICE` が存在する。Phase 11 実 smoke で不足が判明した場合のみ別 PR |
| `apps/web/.dev.vars.example` 変更 | local 起動で不足が判明した場合のみ別 PR |
| `scripts/cf.sh` 変更 | 既存 wrapper は任意の wrangler args を受けられる。不足が判明した場合のみ別 PR |
| `.github/workflows/` 変更 | 本仕様書作成では不要 |

本 phase は仕様書差分の PR 手順だけを固定し、実コード差分は生成しない。

## commit 粒度の方針

solo 開発ポリシー / リニア履歴運用に従い、以下の粒度で 1〜3 コミットに分割する。

| グループ | 含めるファイル | コミットメッセージ案 |
| --- | --- | --- |
| 1 | `docs/30-workflows/06a-A-public-web-real-workers-d1-smoke-execution/` と aiworkflow inventory sync | `docs(06a-A-smoke-exec): add real workers d1 smoke execution spec (Refs #273)` |

> 1 コミットに集約しても良い。重要なのは `Refs #273` 表記、`Closes #273` 不使用、`--no-verify` 不使用、`git commit --amend` 不使用（新規 commit を作る方針）。

## push & PR 作成順序

1. `git status` / `git diff` / `git log -n 5 --oneline` で変更内容と直近コミットスタイルを確認（read-only）
2. `git fetch origin main` → ローカル `main` を fast-forward 同期 → 作業ブランチに戻り `git merge main`
3. コンフリクト発生時は CLAUDE.md「コンフリクト解消の既定方針」に従い解消 → `git add` / `git commit`
4. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` を実行（最大 3 回まで自動修復）
5. user GO を受領
6. 必要に応じて `git checkout -b feat/06a-A-public-web-real-workers-d1-smoke-execution`
7. `git add <仕様書ファイル + 必要 env ファイルを明示>` — `git add -A` / `git add .` は使わない
8. `git commit -m "$(cat <<'EOF' ... EOF\n)"` で HEREDOC 経由
9. `git push -u origin <branch>`
10. `gh pr create` で PR 作成（後述テンプレ使用）
11. `gh pr view --json url` で PR URL を user に返却
12. CI 完了確認（gh run list / gh run view）

## PR 本文テンプレ

```markdown
## Summary

- 06a public web の real Workers + Cloudflare D1 binding 経路を local / staging で実測する手順を仕様化
- 4 route family（/, /members, /members/[id], /register）の curl evidence + screenshot evidence を `outputs/phase-11/evidence/` に保存する VISUAL evidence 計画を確定
- `apps/web/wrangler.toml` に `PUBLIC_API_BASE_URL` を staging/production 環境別で定義し、localhost fallback を防止
- 実 smoke 実行 / system spec 反映は user 承認後の別 PR で実施（pending）

Refs #273

## 変更ファイル

(documentation-changelog.md の change-summary 抜粋を貼る)

## Test plan

- [ ] `pnpm install --force` 成功
- [ ] `pnpm typecheck` 成功
- [ ] `pnpm lint` 成功
- [ ] CI: typecheck / lint / build / verify-indexes-up-to-date すべて green
- [ ] Phase 12 compliance check が 7/7 OK
- [ ] `outputs/phase-12/phase12-task-spec-compliance-check.md` で確認

## Phase 11 実 smoke evidence（実行 = 別 PR）

実 smoke は user 承認後に Phase 11 runbook に従って実行する。本 PR では evidence ファイルは placeholder のみ。

- [ ] local-curl.log（Phase 11 Step 1-4）
- [ ] staging-curl.log（Phase 11 Step 2-3）
- [ ] local-screenshot-{root,members,member-detail,register}.png
- [ ] staging-screenshot-{root,members,member-detail,register}.png

## 不変条件チェック

- [x] #5 public/member/admin boundary: smoke 対象は public layer のみ
- [x] #6 apps/web から D1 直接アクセス禁止: implementation-guide で経路図を明示し、apps/web 内の `env.DB|D1Database` 0 件を grep 検証手順化
- [x] #8 localStorage/GAS prototype を正本にしない: `/register` 経路は Google Form responderUrl のみ参照
- [x] #14 Cloudflare free-tier: staging は Workers Free / D1 Free 範囲内、`scripts/cf.sh d1 info` で usage 確認可

## スクリーンショット

`outputs/phase-11/evidence/` に格納される予定の placeholder のみ。実画像は別 PR でコミット。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> `outputs/phase-11/` 配下に既に PNG が存在する場合は、CLAUDE.md「PR作成の完全自律フロー」の方針に従い、ある画像のみを参照する。存在しない場合はスクリーンショット項目自体を本文から省く。

## 禁止事項（再掲）

- `wrangler` 直接実行（必ず `bash scripts/cf.sh` 経由）
- `git commit --no-verify` / `git push --no-verify`
- `git commit --amend`（新規 commit を作る方針）
- `Closes #273` の使用（Issue は CLOSED 維持）
- Issue #273 再オープンを示唆する記述
- 実 secret 値・Cloudflare API token・D1 database internal id の commit
- `.env` 内容の `cat` / `Read`
- force push（特に `main` への force push は CLAUDE.md で明確に禁止）

## 仕様書の整合性最終確認（push 前）

- [ ] `index.md` outputs リストと実体ファイルが一致（Phase 11 actual evidence は planned evidence として除外）
- [ ] `outputs/phase-12/phase12-task-spec-compliance-check.md` が Phase 12 required files 7/7 OK
- [ ] `wrangler` 直接呼び出し例が仕様書内に存在しない（`scripts/cf.sh` 経由のみ）
- [ ] 実 secret 値 / Cloudflare API token / D1 database internal id が含まれていない
- [ ] `Closes #273` 表記が含まれていない（`Refs #273` のみ）
- [ ] Issue #273 再オープンを示唆する記述が含まれていない
- [ ] `git status --porcelain` が空（commit 漏れなし）
- [ ] `git diff main...HEAD --name-only` が PR に含めるファイル一覧として取得できている

## 失敗時の対応

| 事象 | 対応 |
| --- | --- |
| pre-commit hook 失敗 | 原因を修正し **新規コミット** で再 commit（amend 禁止） |
| `pnpm typecheck` / `pnpm lint` 失敗 | 最大 3 回まで自動修復し、修復差分を新規コミット。`pnpm lint --fix` を最初に試行 |
| CI fail | 失敗ジョブログを `gh run view <id> --log-failed` で確認し、別コミットで修正 push（force push 禁止） |
| コンフリクト | CLAUDE.md「コンフリクト解消の既定方針」に従い解消（package.json / lockfile / source / docs の方針表参照） |

いずれの場合も Issue #273 を再オープンしない。

## CI gate との関係

- branch protection の `required_status_checks` には typecheck / lint / build / verify-indexes-up-to-date 等が含まれる
- 仕様書のみ変更でも上記は走るため、push 前に local check を通す
- `verify-indexes-up-to-date` は `.claude/skills/aiworkflow-requirements/indexes` の drift を検知。本 PR で skill 改修を行う場合は `pnpm indexes:rebuild` を事前実行

## ブランチ戦略との整合

- 本 PR は feature ブランチ → `dev` または `main` への通常 PR
- CLAUDE.md ブランチ戦略どおり solo 運用ポリシー（必須レビュアー数 0 / CI gate のみ保護）
- `required_status_checks` / `required_linear_history` / `required_conversation_resolution` を満たすように push 前に local check を通す
- force push / `--no-verify` 使用は禁止

## 多角的チェック観点

- #5 public/member/admin boundary: PR 本文の経路図が apps/web → apps/api → D1 で閉じているか
- #6 apps/web から D1 直接アクセス禁止: PR diff に `apps/web/**` から `D1Database` / `env.DB` への新規 import がないか
- #8 localStorage / GAS prototype を正本にしない: 仕様書 / runbook / changelog で GAS prototype を参照対象から除外しているか
- #14 Cloudflare free-tier: 追加 secret / binding が free tier で動作可能か

## サブタスク管理

- [ ] `outputs/phase-13/main.md` を作成
- [ ] `outputs/phase-13/local-check-result.md`（pnpm install / typecheck / lint の結果記録テンプレ）
- [ ] `outputs/phase-13/change-summary.md`（変更ファイル一覧）
- [ ] `outputs/phase-13/pr-template.md`（上記 PR 本文テンプレを `Refs #273` 付きで完成）
- [ ] user 承認 gate を通過したか確認
- [ ] CI green を確認

## 成果物

- `outputs/phase-13/main.md`
- `outputs/phase-13/local-check-result.md`
- `outputs/phase-13/change-summary.md`
- `outputs/phase-13/pr-template.md`

## 実行タスク

この Phase の実行タスクは本文中のタスク表、検証手順、またはチェックリストに記載済み。

## 完了条件

- [ ] 4 ファイルが `outputs/phase-13/` 配下に実体存在
- [ ] `outputs/phase-13/pr-template.md` が `Refs #273` 表記で完成
- [ ] user 承認後、PR URL が返却済み
- [ ] CI（branch protection 必須 status check）が green に到達
- [ ] 不変条件 #5 / #6 / #8 / #14 chk が PR 本文で明示されている
- [ ] Phase 11 実 smoke evidence は別 PR で対応する旨が PR 本文に明記

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスク `06a-followup-001` の復活ではなく VISUAL モード follow-up gate になっている
- [ ] 仕様書段階で実装、deploy、commit、push、PR を実行していない（実行は user GO 後）

## 次 Phase（PR マージ後）

- spec_created → executed への移行は別タスク化。`outputs/phase-12/system-spec-update-summary.md` の pending 解除 PR を別途切る
- Phase 11 evidence の実ログ・screenshot 保存は実 smoke 実行時に別 PR でコミット
- 後続 PR でも `Refs #273` 表記を維持し、Issue 再オープンは行わない

## 参照資料

- `.claude/commands/ai/diff-to-pr.md`（Phase 13 ワークフロー正本）
- `CLAUDE.md`「PR作成の完全自律フロー」セクション
- `docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/phase-13.md`（NON_VISUAL 版の比較対照）
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
