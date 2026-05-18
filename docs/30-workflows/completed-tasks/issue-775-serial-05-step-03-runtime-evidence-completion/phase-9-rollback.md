# Phase 9: ロールバック

[実装区分: 実装仕様書]

## 1. ロールバックトリガ

| トリガ | 検出方法 |
|--------|---------|
| T1: Playwright spec が 3 回連続 fail | `playwright.log` の EXIT_CODE != 0 を 3 回 |
| T2: 不変ファイル diff が混入 | Phase 5 §3 スクリプトの 0 line 違反 |
| T3: PNG hash が再現性確認で異なる | Phase 5 §4 連続実行 hash 不一致 |
| T4: storageState が誤って staged された | `git status` で `apps/web/playwright/.auth/admin.json` 検出 |
| T5: production code 変更要求が判明 | spec/seed では吸収できないと判定 |

## 2. ロールバック手順

### 全戻し（T1-T3, T5）

```bash
# 1. 新規ファイル削除
git rm -f apps/web/playwright.admin-schema-diff.config.ts
git rm -f apps/web/playwright/tests/visual/admin-schema-diff.spec.ts
git rm -f apps/web/playwright/.auth/.gitignore
git rm -rf scripts/fixtures/serial-05-step-03

# 2. 新規 PNG 削除
DIR=docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots
git rm -f "$DIR"/admin-schema-diff-{added,changed,removed,unresolved}-{desktop,mobile}.png
git rm -f "$DIR"/admin-schema-diff-resolve-{success,409,422}.png
# legacy admin-schema-diff-list.placeholder.txt は保持

# 3. 編集 doc を origin/dev に復元
for f in \
  docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/manifest.json \
  docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence.md \
  docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/main.md \
  docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md \
  docs/30-workflows/completed-tasks/serial-05-step-03-followup-001-runtime-evidence-completion.md
do git checkout origin/dev -- "$f"; done

# 4. D1 cleanup
bash scripts/cf.sh d1 execute ubm-hyogo-db-local --local \
  --file=scripts/fixtures/serial-05-step-03/seed-cleanup.sql || true
```

### 部分戻し（T4: storageState 漏れ）

```bash
git rm --cached apps/web/playwright/.auth/admin.json
# .gitignore に `*` を追記して以後の混入を防ぐ
git commit -m "chore: untrack accidental storageState"
```

## 3. ロールバック後の処理

- 本 workflow root (`docs/30-workflows/issue-775-.../`) はそのまま残し、`artifacts.json.status` を `rolled_back` に更新
- ユーザーへエスカレーション（root cause + 次アクション提示）
- unassigned-task ファイルの `status: consumed` は **追記前であれば** 触らない。追記済の場合のみ frontmatter を削除して `pending` に復帰

## 4. D1 seed の副作用

seed-diff.sql は `seed-` prefix の id のみ使うため、cleanup SQL で確実に逆操作される。本番 D1 (`ubm-hyogo-db-prod` / `staging`) には触れない（`--local` フラグ必須）。
