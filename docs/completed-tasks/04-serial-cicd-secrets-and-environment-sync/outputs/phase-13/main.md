# Phase 13: PR 作成手順書

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR作成 |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新) |
| 状態 | pending（ユーザー承認待ち） |

---

> **重要: このフェーズはユーザーの承認なしに実行してはならない。**
> index.md の完了判定条件 5 を参照すること。
> 承認を受けたうえで、以下の手順に従って PR を作成すること。

---

## 事前確認チェックリスト

PR 作成前に以下を全て確認すること。

- [ ] Phase 10 の GO/NO-GO 判定が GO になっている
- [ ] Phase 11 の smoke test が全項目 PASS（または SKIP に理由あり）
- [ ] Phase 12 の全成果物ファイルが作成済み
- [ ] `outputs/phase-12/phase12-task-spec-compliance-check.md` の総合判定が PASS
- [ ] リポジトリに平文 `.env` ファイルが存在しない
- [ ] ユーザーから明示的な承認を得た

---

## PR 作成コマンド

```bash
# 1. 現在のブランチを確認
git branch

# 2. 変更をステージング（docs/ 以下のみ）
git add docs/04-serial-cicd-secrets-and-environment-sync/outputs/

# 3. コミット
git commit -m "docs(04-cicd-secrets): Phase 10-13 成果物ドキュメントを追加"

# 4. リモートへ push
git push origin HEAD

# 5. PR 作成
gh pr create \
  --title "docs(04-cicd-secrets): CI/CD secrets 環境同期 Phase 10-13 成果物" \
  --body "$(cat <<'EOF'
## Summary

- Phase 10: 最終レビュー書（AC 全項目 PASS 判定表・GO/NO-GO 判定）
- Phase 11: 手動 smoke テスト結果書・確認ログテンプレート・リンクチェックリスト
- Phase 12: システム仕様書更新サマリー・実装ガイド・変更履歴・未割り当てタスク検出・スキルFB・準拠チェック
- Phase 13: PR 作成手順書（本ファイル）

## 受入条件

- AC-1: runtime secret / deploy secret / public variable の置き場が一意 → PASS
- AC-2: dev / main の trigger が branch strategy と一致 → PASS
- AC-3: local canonical は 1Password Environments → PASS
- AC-4: web と api の deploy path が分離 → PASS
- AC-5: secret rotation / revoke / rollback の runbook がある → PASS

## Test plan

- [ ] Phase 11 の link-checklist.md で全ファイルの存在を確認した
- [ ] Phase 11 の manual-smoke-log.md に実施記録を記入した
- [ ] Phase 12 の phase12-task-spec-compliance-check.md の総合判定が PASS

🤖 Generated with Claude Code
EOF
)"
```

---

## PR タイトルと本文テンプレート

### タイトル

```
docs(04-cicd-secrets): CI/CD secrets 環境同期 Phase 10-13 成果物
```

### 本文テンプレート

```markdown
## Summary

- Phase 10: 最終レビュー書（AC 全項目 PASS 判定表・GO/NO-GO 判定）
- Phase 11: 手動 smoke テスト結果書・確認ログテンプレート・リンクチェックリスト
- Phase 12: システム仕様書更新サマリー・実装ガイド・変更履歴・未割り当てタスク検出・スキルFB・準拠チェック
- Phase 13: PR 作成手順書（本ファイル）

## 受入条件

| AC | 判定 |
| --- | --- |
| AC-1: secret placement が一意 | PASS |
| AC-2: trigger が branch strategy と一致 | PASS |
| AC-3: 1Password Environments が local canonical | PASS |
| AC-4: web/api の deploy path が分離 | PASS |
| AC-5: rotation/revoke/rollback runbook がある | PASS |

## Test plan

- [ ] Phase 11 の link-checklist.md で全ファイルの存在を確認した
- [ ] Phase 11 の manual-smoke-log.md に実施記録を記入した
- [ ] Phase 12 の phase12-task-spec-compliance-check.md の総合判定が PASS
- [ ] リポジトリに平文 .env が存在しないことを確認した

🤖 Generated with Claude Code
```

---

## CI 確認チェックリスト

PR 作成後、以下の CI ジョブが全て成功していることを確認すること。

| CI ジョブ | 期待結果 | 確認方法 |
| --- | --- | --- |
| lint | PASS | `gh pr checks` |
| typecheck | PASS | `gh pr checks` |
| test | PASS | `gh pr checks` |
| （その他 workflow が追加された場合） | PASS | `gh pr checks` |

```bash
# CI 確認コマンド
gh pr checks [PR番号]
```

---

## close-out チェックリスト

PR マージ後に以下を実施すること。

- [ ] `artifacts.json` の全 Phase 状態を `completed` に更新する
- [ ] `index.md` の状態を `completed` に更新する
- [ ] ワークツリーを削除する（不要な場合）
  ```bash
  git worktree remove .worktrees/task-20260426-202226-wt-2
  ```
- [ ] 下流タスク（05a / 05b）の担当者に本タスク完了を通知する
- [ ] `unassigned-task-detection.md` の U-02（secret 名照合）を 05a/05b 着手時に実施する

---

## 注意事項

- PR のマージ先は `dev` ブランチとすること（branch strategy 参照）
- `main` へのマージは staging 確認後に別途 PR を作成する
- secret の実値は PR 本文・コメントに絶対に記載しない
