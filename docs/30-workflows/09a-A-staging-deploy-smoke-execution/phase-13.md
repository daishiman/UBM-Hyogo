# Phase 13: PR 作成 — 09a-A-staging-deploy-smoke-execution

[実装区分: 実装仕様書]

判定根拠: 本タスクで作成される PR は **2 種類**（仕様書 PR / 実行 PR）あり、いずれも repo へコミット・push される副作用を持つ。さらに `gh pr create` の実行・CI gate 待機を伴うため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09a-A-staging-deploy-smoke-execution |
| phase | 13 / 13 |
| wave | 9a-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

本タスクで生成される 2 種類の PR の作成手順・本文テンプレ・CI gate 待機方針を確定する。仕様書 PR は本ブランチで作成し、実行 PR は契約のみ規定し別タスク・別ブランチで作成する。

## 本タスクで扱う PR は 2 種類

1. **仕様書作成 PR（本ブランチ `docs/09a-A-staging-deploy-smoke-execution-task-spec` で出す PR）**
   - 内容: 仕様書 13 phase ファイル + outputs 13 main.md + 既存仕様書ディレクトリの整理（`docs/30-workflows/02-application-implementation/...`、`ci-test-recovery-coverage-80-2026-05-04/...`）
   - 範囲: deploy / smoke / evidence の **取得は行わない**
2. **実行 PR（別タスク・別ブランチ `feat/09a-A-staging-deploy-smoke-execution` で出す PR）**
   - 内容: Phase 11 で取得した 13 evidence + Phase 12 で更新した 8 ドキュメントの差分
   - 本仕様書では **契約のみ** 規定し、PR の作成・push は行わない

> **CONST_002 / 本仕様書作成タスクでは PR 作成・push を実行しない**。仕様書 PR の作成は別の `pnpm` / `/diff-to-pr` 起動セッションで実施する。

## 1. 仕様書作成 PR の手順

### 1-A. 事前確認

```bash
git branch --show-current  # docs/09a-A-staging-deploy-smoke-execution-task-spec であること
git status --porcelain     # 仕様書ファイル以外の変更がないこと
git fetch origin main
git log --oneline origin/main..HEAD  # 含まれるコミット確認
```

CLAUDE.md「PR作成の完全自律フロー」に準拠:
1. `git fetch origin main` → ローカル `main` を fast-forward
2. 作業ブランチに戻り `git merge main`
3. コンフリクトは CLAUDE.md の既定方針で解消
4. `mise exec -- pnpm install --force` → `pnpm typecheck` → `pnpm lint`
5. 失敗時は最大 3 回まで自動修復
6. `git status --porcelain` 空 / `git diff main...HEAD --name-only` で PR 含有ファイル一覧確定

### 1-B. PR タイトル例（70 字以内）

```
docs(09a-A): staging deploy smoke 実装仕様書 13 phase + outputs を整備
```

### 1-C. PR 本文テンプレ（HEREDOC）

```
## Summary
- 09a-A-staging-deploy-smoke-execution の Phase 1-13 実装仕様書を整備
- outputs/phase-01〜13/main.md を実行時 evidence 受け皿として再構成
- approval gate G1〜G4 / 13 evidence の保存先と命名規則を確定
- 09c production deploy への blocker 更新条件を契約として記述

## 含まれる変更
- docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-{11,12,13}.md を実装仕様書として書き換え
- docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-{01..13}/main.md を実行時 placeholder として再構成
- 既存仕様書ディレクトリの整理: `docs/30-workflows/02-application-implementation/...` / `ci-test-recovery-coverage-80-2026-05-04/...` 配下のうち本タスク参照経路と重複/陳腐化したファイルを削除。理由: 09a-A の正本パスを `docs/30-workflows/09a-A-staging-deploy-smoke-execution/` に一本化し、staging deploy smoke の参照点を 1 箇所に集約するため。これにより実行 PR で evidence をコミットする際の参照混乱を防ぐ

## Test plan
- [ ] `mise exec -- pnpm typecheck` が成功
- [ ] `mise exec -- pnpm lint` が成功
- [ ] `grep -R NOT_EXECUTED docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/` が 0 件（仕様書段階では placeholder のため `pending` 表記のみ）
- [ ] CLAUDE.md「PR作成の完全自律フロー」のチェックリストを満たす

## 関連 Issue / 後続タスク
- 後続: feat/09a-A-staging-deploy-smoke-execution（実行 PR）
- 09c blocker: docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md
- 親: docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 1-D. `gh pr create` コマンド例

```bash
gh pr create --base main --head docs/09a-A-staging-deploy-smoke-execution-task-spec \
  --title "docs(09a-A): staging deploy smoke 実装仕様書 13 phase + outputs を整備" \
  --body "$(cat <<'EOF'
## Summary
... (上記テンプレ全文)
EOF
)"
```

### 1-E. CI gate 待機方針

```bash
gh pr checks <PR_NUMBER> --watch  # 全 check が PASS / SKIP になるまで待つ
```

`required_status_checks`（typecheck / lint / verify-indexes-up-to-date 等）が green になるまで待機。失敗時は CLAUDE.md「PR作成の完全自律フロー」の「品質検証失敗時の自動修復」に従い、最大 3 回まで修復コミットを追加。

## 2. 実行 PR の契約（後続タスクが従うべき仕様）

### 2-A. branch 命名

`feat/09a-A-staging-deploy-smoke-execution`

### 2-B. PR タイトル例

```
feat(09a-A): staging deploy smoke 実測 evidence 13 件取得 + 09c blocker 更新
```

### 2-C. PR 本文テンプレ

```
## Summary
- ubm-hyogo-{api,web}-staging を deploy し、curl smoke / Playwright UI smoke / Forms sync / wrangler tail を実測
- 13 evidence を outputs/phase-11/evidence/ 配下に保存
- D1 schema parity（staging vs production）= diffCount=<N>
- 09c production deploy への blocker を「09a-A 完了済」に更新

## Approval gate 取得記録
- G1 (api/web staging deploy): approved at <ISO> by <user>
- G2 (D1 migration apply): approved at <ISO> by <user>（pending=0 の場合は N/A）
- G3 (Forms sync): approved at <ISO> by <user>
- G4 (blocker 更新コミット): approved at <ISO> by <user>

## 必須 evidence 13 件
1. deploy/deploy-api-staging.log (sha256: ..., 取得 ...)
2. deploy/deploy-web-staging.log
3. curl/curl-public-* 7 種（healthz / members base/q/zone/status/tag/sort/density）
4. curl/curl-authz-* 3 種
5. screenshots/{public-members,login,me,admin}-staging.png
6. playwright/ HTML report + trace
7. forms/forms-schema-sync.log
8. forms/forms-responses-sync.log
9. d1/sync-jobs-staging.json
10. d1/audit-log-staging.json
11. wrangler-tail/api-30min.log（または取得不能理由テンプレ）
12. d1/d1-migrations-staging.log
13. d1/d1-schema-parity.json

## 09c blocker 更新差分
- docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md
- 主要変更: 「blocker: 09a-A 未実測」→「blocker: 09a-A 完了済 / 残課題: <列挙>」

## Test plan
- [ ] `pnpm typecheck` / `pnpm lint`
- [ ] `grep -R NOT_EXECUTED docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/` が 0
- [ ] secret / PII grep（Authorization / Bearer / メール正規表現）が 0
- [ ] artifacts.json の evidence 配列長が 13

## Visual Evidence
[VISUAL_ON_EXECUTION]
- screenshots/public-members-staging.png
- screenshots/login-staging.png
- screenshots/me-staging.png
- screenshots/admin-staging.png

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 2-D. 実行 PR の前提条件

- 仕様書 PR がマージ済（main に Phase 1-13 仕様書が反映済）
- `feat/09a-A-staging-deploy-smoke-execution` ブランチが main から fork されている
- 上記 4 approval gate の取得記録が PR 本文に貼られている
- 09c blocker 更新の diff が含まれている

## CLAUDE.md PR 作成完全自律フローへの準拠

両 PR とも以下を遵守:

1. `git fetch origin main` → ローカル main を ff
2. 作業ブランチで `git merge main` → コンフリクトは CLAUDE.md 既定方針で解消
3. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` を実行
4. 失敗時は最大 3 回まで自動修復してコミット
5. `git status --porcelain` 空 → `git diff main...HEAD --name-only` で PR 含有ファイル確定
6. PR 本文を上記テンプレで生成 → `gh pr create` HEREDOC で作成
7. `gh pr checks --watch` で CI 待機
8. PR URL / 採用ブランチ / 自動修復履歴 / 残課題を 1 回だけ報告

## 統合テスト連携

- 上流: Phase 12 ドキュメント更新差分
- 下流: 09c production deploy execution（実行 PR マージ後に開始可能）

## 多角的チェック観点

- 仕様書 PR と実行 PR の責務が物理的に分離されている
- 削除ファイル群の整理理由が PR 本文 ## 含まれる変更 セクションに 1 段落で明記されている
- approval gate 4 件の取得記録が実行 PR 本文に必ず残る契約になっている
- CI gate（typecheck / lint / verify-indexes-up-to-date）の green 確認が必須化されている
- secret / PII grep が PR 作成前チェックに入っている

## サブタスク管理

- [ ] 仕様書 PR の事前確認・本文テンプレ・gh コマンドが揃っている
- [ ] 実行 PR の契約（branch / 本文 / approval 記録 / 必須 evidence）が揃っている
- [ ] CLAUDE.md PR 作成完全自律フローに準拠している
- [ ] **本仕様書作成タスクでは PR 作成・push を実行しない**ことを明記

## 成果物

- `outputs/phase-13/main.md`
- 仕様書 PR の URL（後続セッションで作成され次第追記）
- 実行 PR の URL（後続タスクで作成され次第追記）

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 仕様書 PR / 実行 PR 双方の手順・本文テンプレ・CI gate 待機方針が文書化されている
- 削除ファイル群の整理理由が PR 本文に 1 段落で残っている
- CLAUDE.md PR 作成完全自律フローへの準拠が明記されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] **本 Phase で `gh pr create` / `git push` を実行していない**（CONST_002）
- [ ] 仕様書 PR と実行 PR の役割が混同されていない

## 次 Phase への引き渡し

Phase 完了後:
- 仕様書 PR 作成は別セッションで `/diff-to-pr` または手動で実施
- 実行 PR は別タスク `09a-A 実行` ブランチで本仕様書の契約に従って作成

## 実行タスク

- [ ] phase-13 の既存セクションに記載した手順・検証・成果物作成を実行する。

## 参照資料

- docs/30-workflows/09a-A-staging-deploy-smoke-execution/index.md
- docs/30-workflows/09a-A-staging-deploy-smoke-execution/artifacts.json
