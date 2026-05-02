# Phase 13: 承認 + 実適用 + PR作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| visualEvidence | NON_VISUAL |
| 状態 | blocked_until_user_approval |

## 目的

ユーザーの **明示的な production apply 承認** を取得した後にのみ、`bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production` を実行し、apply 前後の evidence を取得する。push / PR 作成は production apply とは別の明示承認がある場合だけ実行する。

## 実行タスク

- Gate-A / Gate-B / Gate-C1 / Gate-C2 を直列に通し、承認前に production write / push / PR を実行しない。
- Phase 13 必須成果物 4 点を作成し、local checks / change summary / PR creation log を分離する。
- production apply evidence と repo publishing evidence を別ファイルで記録する。

## 承認ゲート（三段）

| ゲート | 内容 | 通過条件 |
| --- | --- | --- |
| Gate-A: Design GO | Phase 1-10 完了 | Phase 10 のチェックリスト全 PASS |
| Gate-B: User approval | production apply 実行可否 | ユーザーから「production D1 apply を実行してよい」旨のテキスト承認を `outputs/phase-13/user-approval.md` に記録 |
| Gate-C1: SSOT update draft | apply 後の文書更新 | apply 完了 + 全 evidence 取得 + SSOT applied marker の差分作成 |
| Gate-C2: Push & PR | git push / PR 作成 | Gate-C1 完了 + ユーザーから push / PR 作成の別承認 |

**Gate-A → Gate-B → Gate-C1 → Gate-C2 の順序を厳守する**。

## 実行手順

### Step 1: 承認取得

```text
outputs/phase-13/user-approval.md に以下を記録:
- 承認者
- 承認テキスト（原文）
- 承認日時 (ISO 8601)
- 対象 database / environment
```

### Step 2: 認証確認

`whoami` は Cloudflare state を変更しない read-only/auth preflight だが、本 workflow では Gate-B の後に実行して Runtime GO 条件を単純化する。

```bash
bash scripts/cf.sh whoami
# 失敗時は E-1 へ
```

### Step 3: apply 前 evidence 取得

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  | tee outputs/phase-13/migrations-list-before.txt
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" \
  | tee outputs/phase-13/tables-before.txt
```

判定:

- `0008_create_schema_aliases.sql` が unapplied であること（applied なら E-2）。
- unapplied migration が `0008_create_schema_aliases.sql` だけであること。`0008_schema_alias_hardening.sql` や `0009_*` など target 以外の pending migration があれば E-9 として NO-GO。
- `tables-before.txt` に `schema_aliases` が含まれないこと。

### Step 4: apply 実行

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  2>&1 | tee outputs/phase-13/migrations-apply.log
```

非ゼロ exit の場合は E-3 / rollback DDL を参照。

### Step 5: apply 後 evidence 取得

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  --command "PRAGMA table_info(schema_aliases);" \
  | tee outputs/phase-13/pragma-table-info.txt
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  --command "PRAGMA index_list(schema_aliases);" \
  | tee outputs/phase-13/pragma-index-list.txt
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  | tee outputs/phase-13/migrations-list-after.txt
```

判定:

- `pragma-table-info.txt` に必須 9 column が揃う（E-4）。
- `pragma-index-list.txt` に必須 3 index が揃う（E-5）。
- `migrations-list-after.txt` で `0008_create_schema_aliases.sql` が applied（E-6）。
- before / after の migration 差分が target 1件のみであること。

### Step 6: SSOT 更新ドラフト

`outputs/phase-12/system-spec-update-summary.md` のドラフトに基づき以下を更新する:

- `.claude/skills/aiworkflow-requirements/references/database-schema.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `docs/30-workflows/task-issue-191-production-d1-schema-aliases-apply-001/index.md`（workflow_state を `completed` へ）
- `docs/30-workflows/task-issue-191-production-d1-schema-aliases-apply-001/artifacts.json`（Phase 13 status `completed`）

コミットは Gate-C2 の push / PR 承認と同じ公開単位で実行する。承認前は差分作成と evidence 提示までに留める。

コミット粒度（推奨 5 単位）:

1. evidence ファイル群 (`outputs/phase-13/*`)
2. database-schema.md 更新
3. task-workflow-active.md 更新
4. workflow root index.md / artifacts.json 更新
5. Phase 12 outputs 確定（implementation-guide / documentation-changelog ほか）

### Step 7: push & PR 作成

Gate-C2 は production apply 完了後の別承認として扱う。ユーザーが push / PR 作成を明示承認するまでは、`outputs/phase-13/change-summary.md` までを提示して停止する。

```bash
git push -u origin docs/issue-359-production-d1-schema-aliases-apply-task-spec
gh pr create --title "docs: issue-359 production D1 schema_aliases apply task spec + apply" \
  --body-file outputs/phase-13/pr-body.md
```

PR body には以下を含める:

- 適用対象 / environment / 承認テキスト
- 適用前後 evidence 一覧と要約
- `Refs #359`（`Closes` は使用しない。Issue は closed のまま扱う）

## ロールバック

apply に失敗し runtime PASS が得られなかった場合は phase-06 の rollback DDL を提示し、破壊的操作は追加の明示承認があるまで実行しない。PR は作成せずユーザーへエスカレーションする。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| approval-gated pattern | `.claude/skills/task-specification-creator/references/phase-template-phase13.md` | 必須成果物 / 三役ゲート |
| exception design | `phase-06.md` | failure / rollback boundary |
| change draft | `outputs/phase-13/change-summary.md` | push / PR 前の提示資料 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| local checks | `outputs/phase-13/local-check-result.md` | Phase 13 着手前 / 適用後の local verification |
| change summary | `outputs/phase-13/change-summary.md` | ユーザー提示用変更要約 |
| PR info | `outputs/phase-13/pr-info.md` | PR 作成後の URL / CI |
| PR creation log | `outputs/phase-13/pr-creation-result.md` | push / PR 作成実行ログ |
| runtime evidence | `outputs/phase-13/user-approval.md`, `outputs/phase-13/migrations-*.txt`, `outputs/phase-13/pragma-*.txt` | production D1 apply evidence |

## 統合テスト連携

| 連携先 | 確認内容 | evidence |
| --- | --- | --- |
| Phase 12 | SSOT update draft を applied marker へ反映 | `outputs/phase-12/system-spec-update-summary.md` |
| GitHub PR | `Refs #359`、`Closes` 禁止、CI 結果記録 | `outputs/phase-13/pr-info.md` |

## 完了条件

- [ ] Gate-A / Gate-B / Gate-C1 / Gate-C2 を順序通り通過、または Gate-C2 承認待ちとして停止
- [ ] EV-13-1〜EV-13-7 が揃う
- [ ] SSOT 3 ファイルが更新されコミット済み
- [ ] PR が作成され `Refs #359` を含む
- [ ] 本Phase内の全タスクを100%実行完了

## 注意事項

- ユーザー承認なしに Step 2 以降を実行しない。
- 承認は本 phase の作業セッションごとに取得する（過去の承認を流用しない）。
- 失敗時の `--no-verify` 使用は禁止（CLAUDE.md ポリシー）。
