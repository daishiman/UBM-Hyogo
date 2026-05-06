# Phase 13: PR 作成 — issue-353-09c-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-353-09c-production-deploy-execution |
| phase | 13 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 状態 | spec_created（PR 作成は user approval gate） |
| 承認 | **user approval 必須**（PR 作成は自動実行禁止） |

## 目的

Phase 1〜12 の成果物（仕様書 13 ファイル + outputs/phase-{01..13}/main.md 13 ファイル + Phase 12 の 6 必須タスク + Phase 11 manifest）を `feature/09c-A-production-deploy-execution`（または同等の作業ブランチ）にまとめ、`dev` 向け PR を作成する。本タスクは **production deploy 実行を含まない**。PR 作成自体が `user approval gate`（自動実行禁止）であり、実 production execution operation はマージ後の別 operation で行う。

## 参照資料

- `docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-12/main.md`
- `docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-11/user-approval-log.md`
- `docs/30-workflows/issue-353-09c-production-deploy-execution/artifacts.json`
- `.claude/skills/task-specification-creator/references/phase-template-phase13.md`

依存 Phase: Phase 1 / Phase 2 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12。

## PR 作成 user approval gate（自動実行禁止）

| 項目 | 値 |
| --- | --- |
| 自動実行可否 | **不可**（user 承認後に手動 `gh pr create` 実行） |
| approval 文言 | 後述 § 5 PR 作成前 checklist の全項目 PASS をユーザーへ提示 |
| approval 記録先 | `outputs/phase-11/user-approval-log.md` の Phase 13 セクション |
| reject 時の挙動 | PR 作成を中止。`outputs/phase-13/main.md` に reject 理由を記録 |

## PR タイトル命名規約

```
docs(09c-A): production deploy execution task spec
```

- prefix: `docs`（仕様書のみで実装差分なし）
- scope: `09c-A`
- subject: `production deploy execution task spec`
- 70 文字以内

## PR description テンプレート構造（`outputs/phase-13/pr-template.md`）

```markdown
## Summary
- 09c serial（runbook docs-only）の execution gate を埋める follow-up タスクの仕様書を整備
- 13 phase 仕様書 + outputs を `docs/30-workflows/issue-353-09c-production-deploy-execution/` 配下に配置
- Phase 11 evidence manifest（VISUAL 23 枚 / NON_VISUAL 17 ファイル / 24h metrics 8 枚）を確定
- Phase 12 で 6 必須タスク（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を作成
- 本 PR は **production への mutation を含まない**。実 deploy / D1 migration / release tag は user approval 取得後の別 operation で実施

## Test plan
- [ ] `mise exec -- pnpm typecheck`（変更なし想定で exit 0）
- [ ] `mise exec -- pnpm lint`（変更なし想定で exit 0）
- [ ] `outputs/phase-12/phase12-task-spec-compliance-check.md` の総合判定行 = `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
- [ ] `outputs/phase-11/main.md` の判定行 = `PENDING_RUNTIME_EVIDENCE`
- [ ] root `artifacts.json.metadata.workflow_state` = `spec_created`（書き換えなし）
- [ ] secret 値が PR diff に含まれない
- [ ] aiworkflow-requirements indexes drift がない（CI `verify-indexes-up-to-date` gate pass）

## Phase 11 evidence boundary
- 本 PR は **VISUAL_ON_EXECUTION 運用**。Phase 11 の VISUAL screenshot および runtime log は実 production execution operation で取得し、別 PR で `outputs/phase-11/` 配下に上書きする
- 本 PR では Phase 11 の evidence manifest（取得仕様）のみを宣言

## Approval gates
- Phase 10: 設計 GO 判定 user approval（本 PR マージ前に取得）
- Phase 11: production mutation（D1 apply / api deploy / web deploy / release tag push）の user approval（**別 operation**）
- Phase 13: 本 PR 作成の user approval（本 PR で取得）

## Related
- Refs #353（issue_number）

`Closes #353` ではなく `Refs #353` を使う理由:
- **GitHub Issue #353 is CLOSED. Use `Refs #353` only — do not include `Closes/Fixes/Resolves #353`.**
- issue #353 は既に CLOSED 状態であり、CLOSED のまま維持しなければならない。`Closes #353` / `Fixes #353` / `Resolves #353` の auto-close キーワードを PR body に含めると、マージ時に GitHub が close イベントを再発火させ履歴ノイズや再 open→close の事故につながるため禁止する。
- 本 PR は **仕様書整備**のみであり、issue #353 の実 execution（production deploy / smoke / 24h verification）は別 operation で実施する。trace 目的では `Refs #353` のみを使用する。

## Invariants compliance
- #5 public/member/admin boundary: COVERED（smoke 23 枚計画）/ runtime PENDING
- #6 apps/web → D1 直接禁止: COVERED（web bundle inspection 計画）/ runtime PENDING
- #14 Cloudflare free-tier: COVERED（24h verification timing 確定）/ runtime PENDING

## Post-merge follow-up
- 実 production execution operation（13 ステップ runbook の実行）
- Phase 11 evidence の実値上書き（同一パス）
- root `metadata.workflow_state` を `verified` / `implementation_complete_pending_pr` へ書き換える別 PR
- spec 15 / aiworkflow-requirements indexes への実反映 PR

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## PR 作成前 checklist

| # | チェック項目 | 確認方法 |
| --- | --- | --- |
| 1 | commit が一連のセットでまとまっている | `git log --oneline origin/dev..HEAD` で確認 |
| 2 | `mise exec -- pnpm lint` exit 0 | コマンド実行 |
| 3 | `mise exec -- pnpm typecheck` exit 0 | コマンド実行 |
| 4 | secret 値が diff に含まれない | `git diff origin/dev...HEAD` で `<REDACTED:...>` パターン以外の token 検出ゼロ |
| 5 | redaction が evidence template に適用済み | `outputs/phase-11/main.md` § 3 の mask 規約に整合 |
| 6 | placeholder と実測の境界が `outputs/phase-11/main.md` に記載 | 同 § 0 / § 8 を確認 |
| 7 | aiworkflow-requirements indexes drift がない | `pnpm sync:check` 出力を確認 |
| 8 | base branch が `dev`、head branch が作業ブランチ | `gh pr view` で確認 |
| 9 | 7 必須ファイル（Phase 12）すべて配置済み | `ls outputs/phase-12/` で 7 行 |
| 10 | issue #353 の現状把握 | `gh issue view 353` で reopen / close / 別 issue の状況を確認 |

全項目 PASS で user approval を要求。1 つでも FAIL があれば PR 作成を保留。

## declared files の placeholder 規約（runtime evidence 未取得時）

| ファイル種別 | 本 PR でのファイル状態 | runtime 取得後の状態 |
| --- | --- | --- |
| `outputs/phase-11/main.md`（manifest） | 実体（本 PR で完成） | 変更なし |
| `outputs/phase-11/user-approval-log.md` | placeholder（heading のみ skeleton） | execution 時に承認実値で上書き |
| `outputs/phase-11/upstream-green-evidence.md` | placeholder（skeleton） | execution 着手時に citation で上書き |
| `outputs/phase-11/smoke-{public,member,admin}.md` | placeholder（heading のみ） | smoke 実行時に実値で上書き |
| `outputs/phase-11/invariants.md` | placeholder（heading のみ） | invariant 検証時に実値で上書き |
| `outputs/phase-11/24h-verification-summary.md` | placeholder（heading のみ） | T+24h で実値で上書き |
| `outputs/phase-11/{cf-whoami,d1-migrations-*,api-deploy,web-build,web-deploy,release-tag}.{txt,log}` | placeholder 配置済み（pending 判定のみ） | execution 時に実値で上書き |
| `outputs/phase-11/d1-backup-placeholder.md` | placeholder 配置済み | execution 時に SQL dump または meta JSON を追加 |
| screenshot 群（`smoke-screenshots/` / `24h-metrics-screenshots/`） | README のみ配置（false green 防止 / placeholder PNG 禁止） | execution 時に PNG を新規追加 |

placeholder ファイル冒頭に `PENDING_RUNTIME_EVIDENCE` または `blocked_until_user_approval` 判定行を必ず置き、本 PR 段階で実証跡として読まれる事故を防ぐ。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| Phase 13 index | `outputs/phase-13/main.md` | PR 作成 user approval gate と blocked 理由 |
| PR template | `outputs/phase-13/pr-template.md` | `Refs #353` のみを使う PR body skeleton |
| PR result skeleton | `outputs/phase-13/pr-creation-result.md` | user approval 後の PR URL / 実行ログ予約欄 |

## 実行タスク（本 PR 作成手順）

| # | サブタスク | 完了条件 |
| --- | --- | --- |
| T1 | `outputs/phase-13/pr-template.md` を本仕様書 § 「PR description テンプレート構造」に沿って配置 | テンプレ全文が記載 |
| T2 | `outputs/phase-13/pr-creation-result.md` を雛形配置（実 PR URL は execution 時に追記） | skeleton 配置 |
| T3 | PR 作成前 checklist 全 10 項目を確認 | 全 PASS |
| T4 | user approval 文言を提示 | `outputs/phase-11/user-approval-log.md` Phase 13 セクションに記録 |
| T5 | 承認後 `gh pr create --base dev --title "docs(09c-A): production deploy execution task spec" --body-file outputs/phase-13/pr-template.md` 実行 | PR URL 取得 |
| T6 | PR URL を `outputs/phase-13/pr-creation-result.md` に記録 | PR URL 行が埋まる |
| T7 | root `artifacts.json.phases[].status` を 13 phase 分 `completed` に更新（`metadata.workflow_state` は `spec_created` 維持） | git diff で確認 |

## 完了条件

- [ ] `outputs/phase-13/pr-template.md` 配置
- [ ] `outputs/phase-13/pr-creation-result.md` 配置（実 PR URL は user approval 後）
- [ ] PR 作成前 checklist 10 項目すべて PASS
- [ ] **user approval gate 通過**（自動実行禁止）
- [ ] PR URL が `outputs/phase-13/main.md` および `pr-creation-result.md` に記録
- [ ] root `artifacts.json.metadata.workflow_state` = `spec_created`（書き換え禁止）
- [ ] root `artifacts.json.phases[].status` = `completed`（13 phase 分）

## タスク 100% 実行確認

- [ ] PR 作成は user approval 後に実施
- [ ] Refs #353 を使用、`Closes/Fixes/Resolves #353` を使わない（issue #353 は CLOSED のまま維持。理由を PR body に明記）
- [ ] secret 値が PR diff に含まれない
- [ ] runtime evidence pending 境界が PR body に明記

## 次 Phase

なし（本 Phase 13 が最終）。Post-merge follow-up は実 production execution operation で行う。
