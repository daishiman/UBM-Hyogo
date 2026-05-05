[実装区分: 実装仕様書]

# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-419-pages-project-dormant-delete-after-355 |
| phase | 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| 親 Issue | #355 (CLOSED) — `Refs #355` のみ使用、`Closes #355` 禁止 |

## 状態

`blocked_pending_user_approval`

`spec_created` サイクルでは Phase 13 の **commit / push / `gh pr create` を本仕様書作成サイクルで実行しない**。declared outputs は placeholder として skeleton 配置する。

## 目的

spec_created で確定したタスク仕様書の PR template を draft として宣言し、user 承認後の別 cycle で本作成（commit / push / PR）するためのフローを明確化する。runtime cycle（destructive Pages 削除）は **本 PR とさらに別 cycle** に分離する（二重承認 gate）。

## 入力

- Phase 10 設計レビュー結果
- Phase 12 implementation-guide.md / skill-feedback / unassigned-task-detection
- CLAUDE.md `## PR作成の完全自律フロー`

## 変更対象ファイル一覧（declared / placeholder）

| ファイル | 状態 |
| --- | --- |
| `outputs/phase-13/main.md` | placeholder（`blocked_pending_user_approval`） |
| `outputs/phase-13/pr-template.md` | drafted（PR タイトル / body / AC マトリクス / Test plan / Refs #355） |
| `outputs/phase-13/pr-creation-result.md` | blocked（user 承認後の別 cycle で URL を埋める） |

## PR タイトル（spec_created PR）

```
docs(issue-419): Cloudflare Pages dormant 削除運用タスク仕様書
```

> 注: 本 PR には **runtime 実行（Pages 削除）を含めない**。destructive ops は別 cycle に分離し、二重承認 gate を保つ。

## PR body 構成（template）

```markdown
## Summary

- Issue #419 (`Refs #355`) Cloudflare Pages dormant プロジェクト物理削除運用のタスク仕様書を作成
- Phase 01〜13 仕様書 + outputs skeleton（`PENDING_RUNTIME_EXECUTION`）を配置
- 親 Issue #355 が CLOSED のため `Refs #355` のみ使用、`Closes #355` 不使用

## AC マトリクス（仕様書側カバレッジ）

| AC | 要件 | 仕様書反映先 |
| --- | --- | --- |
| AC-1 | Workers cutover 完了確認 | Phase 11 `preflight-ac1-ac2.md` / `workers-pre-version-id.md` |
| AC-2 | Pages dormant 確認（custom domain detach） | Phase 11 `preflight-ac1-ac2.md` |
| AC-3 | dormant 観察期間 ≥ 2 週間 | Phase 11 `dormant-period-log.md` |
| AC-4 | user 明示承認 | Phase 11 `user-approval-record.md` |
| AC-5 | token-redacted evidence | Phase 11 `redaction-check.md` / Phase 12 redaction ルール |
| AC-6 | aiworkflow-requirements 更新 | Phase 12 `system-spec-update-summary.md`（実書き換えは runtime cycle） |

## Test plan（手動 gate）

- [ ] 仕様書 4 条件（矛盾なし / 漏れなし / 整合性 / 依存関係整合）レビュー
- [ ] `outputs/phase-11/` skeleton 8 ファイル実体確認
- [ ] `outputs/phase-12/` 7 ファイル実体確認
- [ ] `Refs #355` のみ使用 / `Closes #355` 不使用を本 PR description で確認
- [ ] CI: typecheck / lint / verify-indexes すべて green

## 注意

- 本 PR は **タスク仕様書のみ**。Cloudflare Pages の **物理削除は実行していない**。
- destructive runtime（Pages 削除）は user 明示承認後の別 cycle で実施する（二重承認 gate）。
- `bypassPermissions` モードでも runtime 削除を単独実行しない。

Refs #355
```

> `Closes #355` を **書かない**。親 Issue #355 は CLOSED 状態であり、再 close 動作を防ぐため。

## 二重承認 gate

| Gate | 対象 | 承認形態 |
| --- | --- | --- |
| Gate 1 | spec_created PR（本 Phase 13） | PR review approve（solo dev では self-merge 前のレビュー確認） |
| Gate 2 | runtime cycle（Pages 削除実行） | PR comment / Issue comment で user による明示承認文言（AC-4） |

Gate 1 通過 ≠ Gate 2 通過。spec PR が merge されても削除は実行されない。

## PR 作成承認後のフロー（CLAUDE.md `## PR作成の完全自律フロー` 準拠）

1. `git fetch origin main` → ローカル `main` を fast-forward 同期
2. 作業ブランチに main をマージ、コンフリクト解消
3. `mise exec -- pnpm install --force && pnpm typecheck && pnpm lint`
4. 失敗時は最大 3 回まで自動修復
5. `git status --porcelain` 空 / `git diff main...HEAD --name-only` で PR 同梱ファイル確定
6. PR 本文に `outputs/phase-12/implementation-guide.md` Part 1 / Part 2 を反映
7. `gh pr create --base main --title "docs(issue-419): ..." --body "$(cat <<'EOF' ... EOF)"`
8. PR URL を `outputs/phase-13/pr-creation-result.md` に記録

## 禁止事項

- `--no-verify` 使用禁止
- force push 禁止
- 本 PR ブランチ上で `bash scripts/cf.sh pages project delete` を実行しない（runtime は別 cycle）
- PR description / commit message に `Closes #355` を書かない
- staging seed / 削除実行 / aiworkflow-requirements 書き換えを spec PR に混在させない

## 関数・型・モジュール

無し（PR 作成オペレーションのみ）。

## 入出力・副作用

- 入力: spec_created で確定した Phase 01〜12 成果物
- 出力: `outputs/phase-13/` placeholder 3 ファイル（runtime cycle で URL / 結果が埋まる）
- 副作用: spec_created サイクル内では無し。user 承認後の cycle で `gh pr create` 実行。

## テスト方針

- CI（typecheck / lint / verify-indexes）が green であること
- PR description の AC マトリクスが Phase 11 / 12 declared outputs を網羅していること

## ローカル実行コマンド

```bash
# spec_created サイクル：placeholder 配置のみ
mkdir -p outputs/phase-13
# main.md / pr-template.md / pr-creation-result.md を skeleton 化

# user 承認後（別 cycle）
git fetch origin main
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
gh pr create --base main --title "docs(issue-419): Cloudflare Pages dormant 削除運用タスク仕様書" --body "..."
```

## 完了条件（DoD checklist）

### spec_created サイクル（本サイクル）

- [ ] `outputs/phase-13/main.md` placeholder 配置
- [ ] `outputs/phase-13/pr-template.md` に PR タイトル / body / AC マトリクス / Test plan / Refs #355 が drafted
- [ ] `outputs/phase-13/pr-creation-result.md` blocked 状態で skeleton 配置
- [ ] commit / push / `gh pr create` を **実行しない**ことが明記
- [ ] 二重承認 gate（spec PR + runtime cycle）が明文化

### user 承認後 cycle

- [ ] `gh pr create` で PR URL 取得
- [ ] CI 全 green
- [ ] PR URL を `outputs/phase-13/pr-creation-result.md` に記録

## 実行タスク（spec_created）

1. `outputs/phase-13/main.md` を `state: blocked_pending_user_approval` で placeholder 配置。
2. `outputs/phase-13/pr-template.md` に PR タイトル / body の draft を確定。
3. `outputs/phase-13/pr-creation-result.md` を `state: blocked` で skeleton 配置。
4. 二重承認 gate と `Refs #355` 限定運用を明記する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)
- CLAUDE.md `## PR作成の完全自律フロー`
- 親 Issue: #355 (CLOSED)

## 成果物

- `outputs/phase-13/main.md`（他 2 ファイルは draft / blocked）

## 統合テスト連携

- 本 Phase は PR 作成 declared のため focused Vitest は不要。
