# Phase 13: PR 作成 — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

判定根拠: 本 Phase は `gh pr create` 実行・CI gate 待機・PR description テンプレート提供を扱う。PR 作成は repo へ push される副作用を持つが、CONST_002 に従い**ユーザー指示があるまで実行しない**。本仕様書は PR 作成手順の記述のみを行い、Phase 13 自体では `gh pr create` / `git push` を発火させない。手順記述・テンプレ提供という artifact が repo にコミットされるため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-incident-runbook-slack-delivery |
| phase | 13 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |
| user_approval_required | true（PR 作成発火承認） |

## 目的

`.claude/commands/ai/diff-to-pr.md` 仕様および CLAUDE.md「PR作成の完全自律フロー」に準拠した PR を、本タスクの仕様書 + 実装差分（あれば）に対して作成するための完全手順・本文テンプレ・CI gate 待機方針・post-merge action を確定する。NON_VISUAL のため Visual Evidence セクションは省略する。

## 本タスクで扱う PR は 1 種類

本タスクは spec promotion task（既存 unassigned-task の昇格 + Phase 1-13 仕様書整備）として開始したが、CONST_009 に従い目的達成に必要な実コードも同一 PR で扱う。理由:

- runtime evidence (Phase 11) は `pending_runtime_evidence` 状態で本仕様書 PR には**含めない**契約とする
- 仕様書 + Phase 12 strict 7 outputs + Step 2 (`deployment-secrets-management.md`) + aiworkflow indexes 差分 + 09c Phase 11 share-evidence 置換 + `.github/workflows/incident-runbook-slack-delivery.yml` + `scripts/notify/*` が一つの PR にまとまる
- 実コードを分離すると workflow / CLI / evidence path の契約ズレをレビュー時に検出できないため、本 wave で実装も含める

> CONST_002 / 本仕様書作成タスクでは `gh pr create` / `git push` を**実行しない**。下記手順は user の明示指示時に実行するための reference。

## branch 名

既存ブランチを使用: **`docs/issue-349-incident-runbook-slack-delivery-task-spec`**

新規作成しない。`git branch --show-current` で本ブランチ上にいることを実行前に確認する。

## 1. 事前確認

```bash
git branch --show-current  # docs/issue-349-incident-runbook-slack-delivery-task-spec であること
git status --porcelain     # 仕様書 + Phase 12 outputs + skill 編集差分以外の変更がないこと
git fetch origin main
git log --oneline origin/main..HEAD  # 含まれるコミット確認
```

CLAUDE.md「PR作成の完全自律フロー」に準拠:

1. `git fetch origin main` → ローカル `main` を fast-forward
2. 作業ブランチに戻り `git merge main`
3. コンフリクトは CLAUDE.md の既定方針で解消
4. `mise exec -- pnpm install --force` → `pnpm typecheck` → `pnpm lint`
5. 失敗時は最大 3 回まで自動修復してコミット
6. `git status --porcelain` 空 / `git diff main...HEAD --name-only` で PR 含有ファイル一覧確定

## 2. PR タイトル（70 字以内）

```
docs(09c-incident-runbook-slack-delivery): Phase 1-13 spec + secret 正本追記
```

文字数: 65 文字（ASCII / 多バイト混在の見た目幅基準）。

## 3. PR 本文テンプレ（HEREDOC）

```markdown
## Summary

- 09c production deploy 後の incident response runbook を Slack bot で自動配信する workflow の Phase 1-13 実装仕様書を整備
- production / dry-run channel 分離 + GitHub environment `production-slack-delivery` 経由の二段配信を契約として定義
- evidence (`ts` / `channel` / `permalink`) を `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-*.json` に保存する schema 確定
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` に Slack secret 名（`SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` / `SLACK_INCIDENT_RUNBOOK_*_CHANNEL_ID`）と rotation 手順を追記
- 09c Phase 11 `share-evidence` placeholder を本タスク evidence への参照に置換

## 含まれる変更

- `docs/30-workflows/09c-incident-runbook-slack-delivery/phase-{01..13}.md`
- `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-{01..13}/main.md`（spec close-out 時の placeholder）
- `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（Slack secret セクション追記）
- `.claude/skills/aiworkflow-requirements/LOGS.md` / `.claude/skills/task-specification-creator/LOGS.md`（1 行 append）
- `.claude/skills/aiworkflow-requirements/indexes/`（`pnpm indexes:rebuild` 由来の drift 解消）
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md`（share-evidence 置換）
- `docs/30-workflows/unassigned-task/task-09c-incident-runbook-slack-delivery-001.md`（Canonical Status を `consumed` 化）

## runtime scope 外（別 approval wave）

- 実 Slack dry-run / production 投稿
- GitHub Secrets / Variables / Environments の実作成・変更
- production delivery approval と evidence commit

## Test plan

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] `mise exec -- pnpm indexes:rebuild` 後 drift 0（`verify-indexes-up-to-date` CI gate green）
- [ ] `rg -n -e 'xox[abp]-[A-Za-z0-9-]{20,}|Bearer [A-Za-z0-9._-]{20,}' docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/` が 0 hit（real token leak）
- [ ] `rg -F "NOT_EXECUTED" docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md` が 0 hit
- [ ] CLAUDE.md「PR作成の完全自律フロー」のチェックリストを満たす
- [ ] `.github/workflows/incident-runbook-slack-delivery.yml` / `scripts/notify/*` の実装差分が仕様と一致

## CONST 遵守確認

- CONST-RUN-01: token 値は本 PR description / 仕様書 / log のいずれにも記載なし
- CONST-RUN-02: production channel 直配信経路なし（dryrun → approval → production の二段のみ）
- CONST_002: PR 作成自体は user 明示指示時のみ
- CONST_007: Phase 11 / Phase 12 で先送り無し（runtime evidence は Phase 11 別 wave で取得する契約）
- UBM-018 境界: `workflow_state=spec_created` / `taskType=implementation-spec` / `docs_only=false` を維持。実装コード混入なし
- UBM-029 (CLOSED issue): Issue #349 は CLOSED のまま `Refs` のみで参照（`Closes` 不使用）

## 関連 Issue

- Refs #349（CLOSED のまま spec promotion）

## 後続タスク

- 実装 PR: `feat/09c-incident-runbook-slack-delivery-impl-001`（spec PR merge 後）
- 実行 PR: `feat/09c-incident-runbook-slack-delivery-runtime-001`（実装 PR merge 後、Phase 11 runtime evidence 取得 wave）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 4. `gh pr create` コマンド例

```bash
gh pr create --base main --head docs/issue-349-incident-runbook-slack-delivery-task-spec \
  --title "docs(09c-incident-runbook-slack-delivery): Phase 1-13 spec + secret 正本追記" \
  --body "$(cat <<'EOF'
## Summary
... (上記テンプレ全文)
EOF
)"
```

> 実行は user 明示指示後のみ。本仕様書では発火しない。

## 5. CI gate 待機方針

```bash
gh pr checks <PR_NUMBER> --watch
```

`required_status_checks`:

- `typecheck`（pnpm typecheck）
- `lint`（pnpm lint）
- `verify-indexes-up-to-date`（aiworkflow indexes drift 0）
- `verify-codeowners`（CODEOWNERS 構文）

すべて green になるまで待機。失敗時は CLAUDE.md「PR作成の完全自律フロー」の「品質検証失敗時の自動修復」に従い、最大 3 回まで修復コミットを追加（`--no-verify` 禁止 / `--amend` 禁止）。

## 6. PR 作成前チェックリスト

- [ ] `git status --porcelain` が空
- [ ] `git diff main...HEAD --name-only` が PR 含有ファイル一覧として取得済
- [ ] `outputs/phase-12/` 配下に 7 strict ファイルが実体配置済（artifacts.json 宣言と一致）
- [ ] `outputs/phase-11/` 配下に screenshot 画像なし（NON_VISUAL）
- [ ] `outputs/phase-12/implementation-guide.md` の主要見出しと PR Summary が整合
- [ ] real token leak grep 0 hit（テスト用 fake marker は対象外）
- [ ] aiworkflow indexes drift 0
- [ ] 09c Phase 11 `NOT_EXECUTED` 0 hit

## 7. レビュー観点

| # | 観点 | 確認 |
| --- | --- | --- |
| L1 | secret hygiene | token 値・channel id の実値が本 PR diff にない |
| L2 | CONST 遵守 | CONST-RUN-01〜05 / CONST_002 / CONST_007 / UBM-018 / UBM-029 |
| L3 | aiworkflow indexes drift 0 | `verify-indexes-up-to-date` CI green |
| L4 | 境界整合 | `workflow_state=spec_created` / `taskType=implementation-spec` / `docs_only=false` / 実装コード混入 0 |
| L5 | CLOSED issue 参照 | `Closes #349` を含まず、`Refs #349` のみ |
| L6 | scope 整合 | `apps/` / `packages/` / `.github/workflows/incident-runbook-slack-delivery.yml` 不在 |
| L7 | 09c share-evidence 置換適用 | `NOT_EXECUTED` 0 hit |
| L8 | Phase 12 strict 7 outputs 実体 | artifacts.json 宣言名と 1:1 |

## 8. マージ条件

- 上記 L1〜L8 すべて PASS
- CI gate（typecheck / lint / verify-indexes-up-to-date / verify-codeowners）すべて green
- branch protection（solo 運用ポリシー: `required_pull_request_reviews=null`）に従い必須 reviewer なし。CI green + conversation resolved + linear history 維持で merge 可

## 9. post-merge action

| # | アクション | コマンド / 操作 |
| --- | --- | --- |
| P1 | Issue #349 に PR link comment | `gh issue comment 349 --body "Spec promoted via PR #<PR_NUMBER>. Issue remains CLOSED. Refs only."` |
| P2 | Issue #349 を**再 open しない**（UBM-029） | 操作なし。CLOSED のまま維持 |
| P3 | aiworkflow-requirements indexes が main で green であることを再確認 | `gh workflow view verify-indexes.yml` |
| P4 | 後続 implementation PR の準備（別 wave） | `git switch main && git pull && git switch -c feat/09c-incident-runbook-slack-delivery-impl-001` |
| P5 | `outputs/phase-13/main.md` に PR URL / merge SHA を追記 | 別セッションで Phase 13 close-out 記録 |

## CLAUDE.md PR 作成完全自律フローへの準拠

1. `git fetch origin main` → ローカル main を ff
2. 作業ブランチで `git merge main` → コンフリクト解消（CLAUDE.md 既定方針）
3. `pnpm install --force` / `pnpm typecheck` / `pnpm lint`
4. 失敗時は最大 3 回まで自動修復
5. `git status --porcelain` 空 → `git diff main...HEAD --name-only` 確定
6. PR 本文を上記テンプレで生成 → `gh pr create` HEREDOC で作成
7. `gh pr checks --watch` で CI 待機
8. PR URL / 採用ブランチ / 自動修復履歴 / 残課題を 1 回だけ報告

## NON_VISUAL のため screenshot セクション省略

本タスクは NON_VISUAL のため PR description に Visual Evidence セクションを**置かない**。`outputs/phase-11/screenshots/` 配下に画像も生成しない。

## 多角的チェック観点

- 仕様書 PR と将来の実装 PR / 実行 PR の責務が物理的に分離されている
- token / channel id 実値が本 PR の diff・description のいずれにも含まれない
- CLOSED Issue #349 への `Refs` 限定方針が PR 本文に明記されている
- aiworkflow indexes drift 0 が CI gate で機械検証されている
- CONST_002（user 明示指示まで PR 作成発火しない）が遵守されている

## サブタスク管理

- [ ] 事前確認 6 項目を完了
- [ ] PR タイトル / 本文テンプレ確定
- [ ] PR 作成前チェックリスト 8 項目を完了
- [ ] `gh pr create` は user 明示指示まで保留
- [ ] post-merge action P1〜P5 を `outputs/phase-13/main.md` に記録

## 統合テスト連携

- 上流: Phase 12 ドキュメント更新差分
- 下流: 実装 PR (`feat/09c-incident-runbook-slack-delivery-impl-001`) → 実行 PR (`feat/09c-incident-runbook-slack-delivery-runtime-001`)

## 成果物

- `outputs/phase-13/main.md`
- 仕様書 PR の URL（user 指示で作成され次第追記）

## 完了条件 (DoD)

- [ ] PR タイトル / 本文 / `gh pr create` コマンド / CI gate 方針が文書化されている
- [ ] 三併存ケース（UBM-018）整合とCLOSED Issue 参照（UBM-029）方針が明記されている
- [ ] CLAUDE.md PR 作成完全自律フローに準拠
- [ ] **本 Phase で `gh pr create` / `git push` を実行していない**（CONST_002）
- [ ] post-merge action（Issue #349 への comment / 再 open しない）が記載されている
- [ ] NON_VISUAL のため Visual Evidence セクション省略を明記

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 仕様書 PR と実装 PR / 実行 PR の役割が混同されていない
- [ ] CONST_002 / CONST_007 / UBM-018 / UBM-029 を遵守

## 次 Phase への引き渡し

Phase 完了後（user 明示指示後）:

- 仕様書 PR 作成は別セッションで `/diff-to-pr` または手動で実施
- 実装 PR は別タスク・別ブランチで本仕様書の契約に従って作成
- 実行 PR（runtime evidence wave）は実装 PR merge 後に開始

## 参照資料

- `docs/30-workflows/09c-incident-runbook-slack-delivery/index.md`
- `docs/30-workflows/09c-incident-runbook-slack-delivery/artifacts.json`
- `docs/30-workflows/09c-incident-runbook-slack-delivery/phase-{10,11,12}.md`
- `.claude/commands/ai/diff-to-pr.md`
- `CLAUDE.md`「PR作成の完全自律フロー」「solo-dev branch protection」
