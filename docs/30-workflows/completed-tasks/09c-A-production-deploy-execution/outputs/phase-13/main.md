# Phase 13 Output: PR 作成 — 09c-A-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

> **判定行**: `PENDING_USER_APPROVAL`（PR 作成は user 承認後に実施。spec_created 段階では PR 未作成）

## 0. user approval gate（自動実行禁止）

| 項目 | 値 |
| --- | --- |
| 自動実行可否 | **不可** |
| approval 文言 | 後述 § 3 PR 作成前 checklist の全項目 PASS をユーザーへ提示し、明示的な「PR を作成してよい」承認を得る |
| approval 記録先 | `outputs/phase-11/user-approval-log.md` の Phase 13 セクション |
| reject 時の挙動 | PR 作成を中止し、本ファイルに reject 理由・日時を追記 |

## 1. PR タイトル命名規約

```
docs(09c-A): production deploy execution task spec
```

- prefix: `docs`（仕様書のみで実装差分なし）
- scope: `09c-A`
- subject: `production deploy execution task spec`
- 70 文字以内

## 2. PR description 構造（`outputs/phase-13/pr-template.md` 雛形）

`pr-template.md` には以下のセクションを必須配置（heading のみ skeleton 化、本文は本 PR 作成時に埋める）:

1. `## Summary`（4-6 bullet。本タスクが仕様書整備で production への mutation を含まないこと、Phase 11 evidence manifest を確定したこと、Phase 12 で 6 必須タスクを作成したことを明記）
2. `## Test plan`（lint / typecheck / Phase 11 判定行 / Phase 12 compliance 総合判定 / workflow_state 維持 / secret 不含有 / indexes drift なし）
3. `## Phase 11 evidence boundary`（VISUAL_ON_EXECUTION 運用の説明。本 PR では manifest のみ宣言）
4. `## Approval gates`（Phase 10 / 11 / 13 の承認境界）
5. `## Related`（**`Refs #353`** を使用、`Closes #353` を使わない理由を 1 段落で明記）
6. `## Invariants compliance`（#5 / #6 / #14 の COVERED + runtime PENDING）
7. `## Post-merge follow-up`（実 production execution operation / Phase 11 evidence の実値上書き / workflow_state 書き換え別 PR / spec 反映別 PR）
8. 末尾に `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

## 3. PR 作成前 checklist（10 項目）

| # | チェック項目 | 確認方法 |
| --- | --- | --- |
| 1 | commit が一連のセットでまとまっている | `git log --oneline origin/dev..HEAD` |
| 2 | `mise exec -- pnpm lint` exit 0 | コマンド実行 |
| 3 | `mise exec -- pnpm typecheck` exit 0 | コマンド実行 |
| 4 | secret 値が diff に含まれない | `git diff origin/dev...HEAD` で `<REDACTED:...>` パターン以外の token 検出ゼロ |
| 5 | redaction が evidence template に適用済み | `outputs/phase-11/main.md` § 3 mask 規約と整合 |
| 6 | placeholder と実測の境界が `outputs/phase-11/main.md` に記載 | 同 § 0 / § 8 を確認 |
| 7 | aiworkflow-requirements indexes drift がない | `pnpm sync:check` 出力を確認 |
| 8 | base branch が `dev`、head branch が作業ブランチ | `gh pr view` で確認 |
| 9 | 7 必須ファイル（Phase 12）すべて配置済み | `ls outputs/phase-12/` で 7 行 |
| 10 | issue #353 の現状把握 | `gh issue view 353` で reopen / close / 別 issue の状況を確認 |

全項目 PASS で user approval を要求。1 つでも FAIL があれば PR 作成を保留。

## 4. declared files の placeholder 規約（runtime evidence 未取得時）

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

placeholder ファイル冒頭に `PENDING_IMPLEMENTATION_FOLLOW_UP` または `blocked_until_user_approval` 判定行を必ず置く（本 PR 段階で実証跡として読まれる事故を防ぐ）。

## 5. `pr-template.md` / `pr-creation-result.md` の構造定義

### 5.1 `outputs/phase-13/pr-template.md`（実行時に埋める雛形）

- 上記 § 2 の 8 セクションが skeleton で配置される
- 各セクションは heading + bullet point の placeholder
- 本 PR 作成時に bullet point を実値で埋め、`gh pr create --body-file outputs/phase-13/pr-template.md` で渡す

### 5.2 `outputs/phase-13/pr-creation-result.md`（実行時に埋める雛形）

- 雛形に以下のフィールド:
  - `pr_url`: （未記入 / approval 後に埋める）
  - `pr_number`: （未記入）
  - `created_at`: （未記入）
  - `base_branch`: `dev`
  - `head_branch`: 作業ブランチ名（例: `feature/09c-A-production-deploy-execution`）
  - `approval_record`: `outputs/phase-11/user-approval-log.md` Phase 13 セクションへの相対 link
  - `commits_count`: （未記入）
  - `lines_changed`: （未記入）
  - `notes`: 任意の補足（reject / 再作成などの履歴）

## 6. Refs #353 を使う理由（`Closes` を使わない理由）

| 理由 | 説明 |
| --- | --- |
| 本 PR は仕様書整備のみ | issue #353 が要求する production deploy / smoke / 24h verification は本 PR マージ後の別 operation で完了する |
| 未実行 deploy が完了済みに見える事故防止 | `Closes` を使うと PR マージで自動 close され、未実行 deploy が完了したように見える |
| close は execution operation 完了後の別 PR で | 実 production execution operation 完了後の PR で `Closes #353` を付与する |

## 7. 完了条件（Phase 13）

- [ ] `outputs/phase-13/pr-template.md` 配置
- [ ] `outputs/phase-13/pr-creation-result.md` 配置（雛形）
- [ ] PR 作成前 checklist 10 項目すべて PASS
- [ ] **user approval gate 通過**（明示承認）
- [ ] PR URL が本ファイル § 8 および `pr-creation-result.md` に記録
- [ ] root `artifacts.json.metadata.workflow_state` = `spec_created`（書き換え禁止）
- [ ] root `artifacts.json.phases[].status` = `completed`（13 phase 分のみ更新）

## 8. PR 作成記録（実行時に追記）

| 項目 | 値 |
| --- | --- |
| PR URL | （PENDING_USER_APPROVAL） |
| PR number | （PENDING_USER_APPROVAL） |
| 作成日時 | （PENDING_USER_APPROVAL） |
| base branch | `dev` |
| head branch | （実行時に確定） |
| approval log | `outputs/phase-11/user-approval-log.md` Phase 13 セクション |

## 9. dev → main 昇格 PR の参考手順（別運用 / 本 PR スコープ外）

```bash
# 本 PR が dev に merge された後、別 operation で main 昇格 PR を作成する例
gh pr create \
  --base main \
  --head dev \
  --title "release: 09c-A production deploy execution task spec を main へ昇格" \
  --body "Wave 9c-fu の仕様書整備を main へ昇格。本 PR は実 production execution を含まない。"
```

CLAUDE.md ルールに従い、必須レビュアー 0 + CI gate 必須。直接 main へ push しない。
