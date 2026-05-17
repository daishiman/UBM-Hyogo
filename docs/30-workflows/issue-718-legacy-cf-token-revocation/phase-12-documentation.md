# Phase 12: ドキュメント更新

## メタ情報

- phase: 12 / documentation
- prev: phase-11-manual-test
- next: phase-13-pr

## 目的

正本仕様 `deployment-secrets-management.md` の inventory を既存 `CF_TOKEN_*` family と web-cd current runtime 名へ整合させ、本ワークフローの Phase 12 strict 7 outputs を作成する。

## 中学生レベル概念説明（Phase 12 必須項目）

### このタスクは何をしたのか

Cloudflare というクラウドサービスにアクセスするための「鍵（API トークン）」が、昔は 1 本だけあって、それでどこでも開けられる「マスターキー」になっていました。これは便利だけど、漏れたら大変です。

そこで:

1. バックエンドの鍵を「D1 用」「Workers 用」に分けた既存の名前へ切り替えた
2. その切り替えを戻してしまわないよう、テストを追加した
3. Web の鍵は今の正本名を残しつつ、中身が古いマスターキーではないことを人間だけが確認する手順にした
4. 古いマスターキーを Cloudflare のダッシュボードで「使えなくする（revoke）」作業は、人間の明示承認後にだけ実行する手順として分けた
5. 「今できたこと」と「まだ人間の承認が必要なこと」を正本のドキュメントに書いた

現時点では、バックエンドの切り替えとテスト追加は完了しています。古い鍵の物理失効、GitHub Secrets の変更、1Password の変更は、承認後に実行する未完了の運用ステップです。

### なぜ複雑だったのか

- 鍵そのものをコードに書くと AI 学習に混ざる事故が起きるので、鍵の値は絶対にどこにも残さず、識別子（名前）だけで扱った
- 鍵を消すタイミングを間違えると、デプロイが止まる。だから「新しい鍵で動くことを確認 → 古い鍵を消す」の順序を厳格に守った
- 検証の証拠（log）にも鍵の値が混ざらないよう、redaction（黒塗り）チェックを通した

## ドキュメント更新内容

### 12.1 `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

inventory 表に以下を反映:

| secret 名 | scope | 用途 | rotation policy |
|----------|------|------|---------------|
| `CF_TOKEN_D1_STAGING` / `CF_TOKEN_D1_PRODUCTION` | D1:Edit + Account Settings:Read | backend-ci D1 migration | 90 日 |
| `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` | Workers Scripts:Edit + Account Settings:Read | backend-ci Workers deploy | 90 日 |
| `CLOUDFLARE_API_TOKEN` | Workers Scripts:Edit + Account Settings:Read | web-cd environment-scoped deploy token current runtime 名 | 90 日。legacy account-scoped value は Issue #718 で revocation |

changelog 節に以下を追記:

```
- 2026-05-16: Issue #718 workflow spec を正本整合。backend-ci は `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` へ切替済み。
  web-cd は current runtime 名 `CLOUDFLARE_API_TOKEN` を維持し、legacy value revocation evidence を operator-only に分離。
  evidence: docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-11/
```

### 12.2 `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md`

ステータスを「Issue #718 に昇格済み / implemented-local-runtime-pending / revocation は Gate C pending」へ更新する。完了扱いは revocation evidence 取得後に限定する。

### 12.3 本ワークフローの `completed-tasks/` 移動準備

Phase 13 PR 内で revocation evidence 取得後に `completed-tasks/` へ移動する。spec_created 段階では移動しない。

## 成果物

- `outputs/phase-12/system-spec-update-summary.md`（deployment-secrets-management.md の更新点）
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `outputs/phase-12/unassigned-task-detection.md`（残課題があれば。ない場合は「該当なし」を明記）
- `outputs/phase-12/implementation-guide.md`（Phase 13 PR 本文生成用の要約）
- `outputs/phase-12/main.md`
- `outputs/phase-12/skill-feedback-report.md`

## 完了条件

- [ ] `deployment-secrets-management.md` の差分案がレビュー可能な状態
- [ ] unassigned-task 元仕様書のステータスが整合
- [ ] 中学生レベル概念説明セクションが本ファイルに記載済み（compliance check 項目）

## タスク100%実行確認【必須】

- [ ] 成果物 7 ファイル作成（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）
- [ ] redaction 漏れがないことを確認

## 次Phase

phase-13-pr.md
