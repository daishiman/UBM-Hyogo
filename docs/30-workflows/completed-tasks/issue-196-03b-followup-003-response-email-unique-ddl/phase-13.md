# Phase 13: PR 作成

[実装区分: 実装仕様書 / NON_VISUAL]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `issue-196-03b-followup-003-response-email-unique-ddl` |
| phase | Phase 13 |
| status | `blocked_until_user_approval` |

## 目的

ユーザー承認後にのみ commit / push / PR 作成を実行する手順を定義する。

## 実行タスク

- PR 作成前の前提条件を確認する。
- CLOSED Issue #196 を `Refs #196` として扱う。
- 未実行 test plan を pending として記載する。

## 参照資料

- `phase-11.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- GitHub Issue #196

## 統合テスト連携

Phase 11 evidence が揃った後にのみ PR test plan を完了扱いにする。

## 状態

`blocked_until_user_approval`

> Phase 13 はユーザーの明示的な承認後にのみ実行する。本仕様書ではコミット・push・PR 作成を行わない。

## 前提条件（実行時チェック）

- [ ] Phase 1〜12 の `outputs/` 実体（または PENDING placeholder）が揃っている
- [ ] AC-1〜AC-6 / AC-8 / AC-9 が Phase 11 static evidence で確認済み
- [ ] `pnpm typecheck` / `pnpm lint` PASS
- [ ] SQL semantic diff = 0
- [ ] production D1 migration list を取得し、0001 / 0005 が applied のまま drift していないことを確認（外部接続のため Phase 13 承認時に実施）

## PR 作成手順

```bash
# 作業ブランチ確認
git branch --show-current   # docs/issue-196-response-email-unique-ddl-spec を期待

# main 同期
git fetch origin main
git merge origin/main       # コンフリクトは CLAUDE.md「コンフリクト解消の既定方針」に従う

# 変更確認
git status --short
git diff main...HEAD --name-only

# コミット（ユーザー承認後のみ）
git add .claude/skills/aiworkflow-requirements/references/database-schema.md \
        apps/api/migrations/0001_init.sql \
        apps/api/migrations/0005_response_sync.sql \
        docs/30-workflows/issue-196-03b-followup-003-response-email-unique-ddl/
git commit -m "$(cat <<'EOF'
docs(db): canonicalize response_email UNIQUE location in spec and DDL comments

Issue #196 / 03b-followup-003 spec drift fix. UNIQUE on response_email
exists at member_identities.response_email (apps/api/migrations/0001_init.sql:90),
not at member_responses. Update database-schema.md and add SQL comments
to make the canonical location explicit. No schema change.

Refs: https://github.com/daishiman/UBM-Hyogo/issues/196 (CLOSED)
EOF
)"

# push & PR
git push -u origin docs/issue-196-response-email-unique-ddl-spec
gh pr create --base main --title "docs(db): canonicalize response_email UNIQUE location (#196)" \
  --body "$(cat <<'EOF'
## Summary
- 03b Phase 12 検出表 #4 の spec ドリフト訂正
- `database-schema.md` に「正本 UNIQUE = `member_identities.response_email`」明示
- `0001_init.sql` に対応 DDL コメント追加（実 SQL は不変）
- `0005_response_sync.sql` 既存コメントの文言整合
- スキーマ変更なし、production / staging D1 への適用不要

## Issue
- Refs #196 (already CLOSED — keep as-is; do not reopen)

## Test plan
- [x] `pnpm typecheck` PASS (Phase 11 static evidence)
- [x] `pnpm lint` PASS (Phase 11 static evidence)
- [x] SQL semantic diff = 0 (Phase 11 static evidence)
- [ ] `cf.sh d1 migrations list` で 0001 / 0005 が `applied` のまま（production D1 接続を伴うため Phase 13 承認時に取得）
- [x] `grep "正本 UNIQUE"` が spec doc / 0001 / 0005 でヒット（Phase 11 static evidence）

## Notes
- Phase 12 で 03b 検出表 #4 の正本訂正を記録済み（completed-tasks 配下は改ざんせず本 workflow Phase 12 main.md にのみ記録）
- 既適用 migration への変更はコメントのみ。SQL semantics 不変は Phase 11 static evidence で確認済み。D1 migration 状態は production 接続を伴うため Phase 13 承認時に取得する
EOF
)"
```

## 完了条件

- [x] 上記コミット / push / PR 作成手順が再現可能
- [x] ユーザー承認前は実行されないことが明示
- [x] Issue #196 を再オープンせず PR description で参照する方針が確定

## 成果物

- `outputs/phase-13/main.md`: 本 PR 作成手順のコピー（実行時に PR URL 等を追記）
