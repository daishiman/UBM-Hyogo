# Phase 13: PR 作成 — issue-352-postmortem-template-automation

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-09c-postmortem-template-automation-001 |
| phase | 13 / 13 |
| wave | 09c-fu |
| mode | parallel（実依存は serial: 09c → 本タスク） |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| visualEvidenceClass | NON_VISUAL |
| priority | low |
| scale | small |
| GitHub Issue | #352 |
| user_approval_required | true |

## 目的

Phase 1〜12 の成果物（postmortem 生成スクリプト・template・runbook README・unit test・implementation-guide 他 Phase 12 ドキュメント群）を **user 明示承認後に限り** 1 PR として GitHub に提出する手順を定義する。

> **重要**: PR 作成は user approval gate であり、本仕様書だけでは自動実行されない。本仕様書作成タスク内では PR を作らない。実装フェーズで `/ai:diff-to-pr` を起動して完遂する。

## 適用前提

- Phase 1〜12 の仕様書が揃い、実装側 Phase 5 / 9 / 11 が PASS
- `outputs/phase-12/implementation-guide.md` に Part 1（中学生レベル 3 トピック）/ Part 2（C12P2-1〜C12P2-5）が記載済み
- `outputs/phase-12/` に 7 ファイル（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）が実体存在
- `pnpm postmortem:generate` の CLI smoke が Phase 11 で 1 件以上 PASS
- root `artifacts.json` と `outputs/artifacts.json` が parity を保っている
- GitHub Issue #352 の状態を確認済み（OPEN なら `closes #352`、CLOSED なら `reference #352`）

## 三役ゲート

| # | ゲート | 通過条件 | タイミング |
| --- | --- | --- | --- |
| 1 | user 承認ゲート | `outputs/phase-13/change-summary.md` を提示し、user の明示承認文言を取得 | 必ず最初 |
| 2 | ローカル品質検証ゲート | `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `pnpm vitest run scripts/postmortem` 全 PASS | ゲート 1 後 |
| 3 | push / PR 作成ゲート | commit → push → `gh pr create` | ゲート 2 後 |

## 変更サマリー（PR に含めるファイル群）

| 区分 | パス | 種別 |
| --- | --- | --- |
| 実装 | `scripts/postmortem/generate-postmortem.ts` | 新規 |
| 実装テスト | `scripts/postmortem/__tests__/generate-postmortem.test.ts` | 新規 |
| template | `docs/30-workflows/runbooks/postmortem/template.md` | 新規 |
| runbook | `docs/30-workflows/runbooks/postmortem/README.md` | 新規 |
| package | `package.json` | 編集（`scripts.postmortem:generate` 追加） |
| 仕様 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 編集（postmortem 参照リンク追記） |
| workflow 仕様書 | `docs/30-workflows/issue-352-postmortem-template-automation/{index.md,artifacts.json,phase-01..13.md,outputs/**}` | 新規 |
| Phase 12 outputs | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | 新規 |
| Phase 13 outputs | `outputs/phase-13/{main,change-summary,local-check-result,pr-creation-result,pr-info}.md` | 新規 |

## ブランチ

| 項目 | 値 |
| --- | --- |
| ブランチ命名 | `feat/issue-352-postmortem-template-automation` |
| 派生元 | `dev`（最新を取り込み済み） |
| merge target | `dev`（staging 検証後 `dev → main`。本タスクは運用ツールのため staging deploy 不要、CI gate のみで判定） |

## 実行手順

### 1. 変更サマリー提示と user 承認取得（ゲート 1）

`outputs/phase-13/change-summary.md` に以下を記載し、user に提示する:

- 追加 / 変更ファイル一覧（上記「変更サマリー」表）
- 影響範囲: `scripts/postmortem/` と `docs/30-workflows/runbooks/postmortem/` の新規追加 / `package.json` への script 追加 / `15-infrastructure-runbook.md` への参照リンク追記のみ。`apps/api` `apps/web` への影響なし
- evidence path: `outputs/phase-11/main.md`（CLI smoke 結果）
- rollback 手順: 1 commit を `git revert` で戻すだけで原状復帰（`apps/api` `apps/web` 触らないため互換性問題なし）

user の明示承認文言（例: 「PR 作成して OK」）を取得してから次に進む。承認なしで push / PR 作成へ進まない。

### 2. ローカル品質検証（ゲート 2）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run scripts/postmortem
mise exec -- pnpm postmortem:generate -- --release v0.0.0 --commit deadbee \
  --evidence docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/ \
  --rollback-evidence /tmp/dummy-rollback.md \
  --occurred-at 2026-05-05T00:00:00Z
```

結果を `outputs/phase-13/local-check-result.md` に記録（コマンド / exit code / 経過時間）。1 つでも fail があれば該当 Phase に差し戻す。

### 3. commit / push（ゲート 3 前半）

- commit 単位は **論理的に 1 つ** にまとめて良い（運用ツール / docs の追加が中心で互いに依存）。
- commit メッセージ例: `feat(postmortem): add generate-postmortem CLI and runbook template (#352)`
- `--no-verify` は使わない。lefthook の pre-commit / pre-push hook を通常通り通す。
- `git push -u origin feat/issue-352-postmortem-template-automation`

### 4. PR title 案

```
feat(postmortem): add generate-postmortem CLI and runbook template
```

### 5. PR 本文テンプレート

````markdown
## Summary
- `scripts/postmortem/generate-postmortem.ts` を追加し、`pnpm postmortem:generate` 経由で blame を含まない postmortem markdown を決定論的に生成する CLI を実装
- `docs/30-workflows/runbooks/postmortem/template.md` と `README.md` を新規追加。template 見出しは timeline / impact / detection / response / root cause / prevention / follow-up issues に固定し、構造的に blame 表現を排除（S1）
- 09c Phase 11 evidence path を必須入力化し、欠落時は exit 1（S2）。runbook 本文は置換せず参照リンクのみ追加（S3）
- `package.json` に `scripts.postmortem:generate` を追加（S5）。`Date.now()` 等の非決定要素を使わず冪等（S4）

## Changes

### scripts
- `scripts/postmortem/generate-postmortem.ts`（pure 関数 `generatePostmortem(input)` + CLI 層 `main(argv)`）
- `scripts/postmortem/__tests__/generate-postmortem.test.ts`（冪等性 / 7 見出し順序 / blame regex 0 件 / バリデーション / evidence 不在）

### docs
- `docs/30-workflows/runbooks/postmortem/template.md`（7 見出し固定 / placeholder 二重波括弧）
- `docs/30-workflows/runbooks/postmortem/README.md`（実行手順 / follow-up issue 起票 gh CLI スニペット）
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`（rollback 後の postmortem 生成手順への参照リンク追記。本文置換なし）
- `docs/30-workflows/issue-352-postmortem-template-automation/`（仕様書 13 phase + outputs）

### package
- `package.json`（`scripts.postmortem:generate` 追加）

## Test plan
- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] `mise exec -- pnpm vitest run scripts/postmortem` PASS（unit line 80%+ / branch 60%+）
- [ ] `mise exec -- pnpm postmortem:generate -- ...` CLI smoke で exit 0 + 7 見出し含む markdown 出力
- [ ] grep gate: `rg -n 'who is responsible|blame|fault|責任' scripts/postmortem docs/30-workflows/runbooks/postmortem` で 0 件
- [ ] `coverage-guard` PASS

## Invariants
- `apps/api` / `apps/web` への変更なし（不変条件 #4 / #5 / #11 への影響なし）
- 既存 incident response runbook / 09c Phase 6 本文への編集なし（S3）

## 関連 issue
- closes #352
  ※ Issue #352 が既に CLOSED の場合は `reference #352` に書き換えること。
````

### 6. gh pr create コマンド例（手動 fallback）

```bash
gh pr create \
  --title "feat(postmortem): add generate-postmortem CLI and runbook template" \
  --base dev \
  --head feat/issue-352-postmortem-template-automation \
  --body "$(cat <<'EOF'
## Summary
- pnpm postmortem:generate で blame を含まない postmortem markdown を決定論的に生成する CLI を追加
- runbooks/postmortem/template.md と README.md を新規追加（7 見出し固定）
- 09c Phase 11 evidence path を必須入力化（S2）、runbook 本文置換なし（S3）

## Test plan
- [ ] pnpm typecheck PASS
- [ ] pnpm lint PASS
- [ ] pnpm vitest run scripts/postmortem PASS
- [ ] pnpm postmortem:generate CLI smoke PASS
- [ ] grep gate（blame 候補語 0 件）

## Invariants
- apps/api / apps/web 触らず、既存 runbook 本文も編集なし

## 関連 issue
- closes #352

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

> 推奨は `/ai:diff-to-pr` 起動。手動 fallback として上記を残す。

### 7. PR コメント追加

`/ai:diff-to-pr` Phase 5.5 / 5.6 に従い:

- `outputs/phase-12/implementation-guide.md` 全文（Part 1 / Part 2）を本文または PR コメントに含める
- スクリーンショット: 本タスクは `visualEvidence: NON_VISUAL` のため **添付不要**（PR 本文に Screenshots セクションを作らない）

### 8. CI 確認

```bash
gh pr checks <PR番号>
gh pr view <PR番号> --json mergeStateStatus,statusCheckRollup
```

確認対象 CI:

- `typecheck`
- `lint`
- `vitest`（unit + coverage）
- `coverage-guard`
- `verify-indexes-up-to-date`（aiworkflow-requirements indexes drift 0 件確認）

CI 全 PASS を `outputs/phase-13/pr-info.md` に記録。

### 9. post-merge action

- post-merge action: **なし（CI のみ）**
- 本タスクは `apps/api` `apps/web` を触らないため、staging deploy / production deploy は不要
- merge 後は `dev → main` PR を別途作成する標準フローに合流（本仕様書の責務外）

### 10. blocked placeholder

- PR 作成前に **user approval が必要**。承認なしで push / `gh pr create` を実行しない。
- 承認が得られない場合、本 Phase は `outputs/phase-13/main.md` に「blocked: awaiting user approval」と記録して停止する。

## pre-PR チェックリスト

- [ ] `git status --porcelain` 空（または PR に含める変更のみ）
- [ ] `git diff main...HEAD --name-only` 取得済み（PR に含めるファイル一覧の漏れなし確認）
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm vitest run scripts/postmortem` PASS（line 80%+ / branch 60%+）
- [ ] `pnpm postmortem:generate` CLI smoke PASS（exit 0 + 7 見出し）
- [ ] grep gate（`who is responsible` `blame` `fault` `責任` 0 件）
- [ ] `outputs/phase-12/implementation-guide.md` に Part 1 / Part 2 両方が存在
- [ ] artifacts.json `phase12Outputs` と `outputs/phase-12/` 実体 7 ファイルが 1:1 一致
- [ ] root `artifacts.json` と `outputs/artifacts.json` の parity 維持
- [ ] solo dev policy（`required_pull_request_reviews=null`）維持
- [ ] CI gate 通過確認

## 成果物

| 成果物 | パス | 必須 |
| --- | --- | --- |
| 集約 | `outputs/phase-13/main.md` | ✅ |
| 変更サマリー | `outputs/phase-13/change-summary.md` | ✅ |
| ローカル検証ログ | `outputs/phase-13/local-check-result.md` | ✅ |
| PR 作成ログ | `outputs/phase-13/pr-creation-result.md` | ✅ |
| PR 情報 | `outputs/phase-13/pr-info.md` | ✅ |

## 完了条件

- [ ] user 明示承認取得
- [ ] ローカル品質検証 4 種（install / typecheck / lint / vitest）全 PASS
- [ ] CLI smoke PASS（exit 0 + 7 見出し）
- [ ] PR title が確定文言で作成
- [ ] PR body に Summary / Changes / Test plan / Invariants / 関連 issue（`closes #352` または `reference #352`）が含まれる
- [ ] `implementation-guide.md` が PR 本文またはコメントに投稿
- [ ] CI 全 PASS（typecheck / lint / vitest / coverage-guard / verify-indexes-up-to-date）
- [ ] post-merge action 不要（CI のみ）であることが PR 本文または `pr-info.md` に明記
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 仕様書作成タスクでは PR 作成を実行しない（user approval gate を必ず通過する設計）
- [ ] 実装フェーズで本仕様に従い `/ai:diff-to-pr` を起動する前提を明記
- [ ] solo dev policy（`required_pull_request_reviews=null` / `required_status_checks` で品質担保）と整合
- [ ] Issue #352 の状態に応じて `closes` / `reference` を切り替える運用が PR 本文テンプレに明記されている
- [ ] CONST_007: 「別 PR で対応」「次サイクルで」等の先送り表現を本仕様書に書いていない

## 次 Phase への引き渡し

Phase 完了 へ、PR URL、CI 結果、`outputs/phase-13/pr-info.md` の path、Issue #352 のクローズ / 参照状態を渡す。本タスクの `completed-tasks/` 配下への移動は本仕様書段階では行わず、PR merge 後に標準クローズアウトフローで実施する。
