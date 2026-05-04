# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-399-admin-queue-resolve-staging-visual-evidence |
| phase | 05 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implementation-prepared |

## ステップ

### Step 1: schema discovery（必須前提）

```bash
rg -n "admin_member_notes|member_status|deleted_members|audit_log" apps/api/migrations apps/api/src
```

本 workflow は D1 schema 変更を禁止するため、seed 由来行は既存ID列の synthetic prefix `ISSUE399-` で識別する。`seeded_for` カラムや ALTER migration は採用しない。

### Step 2: seed SQL 作成

- `apps/api/migrations/seed/issue-399-admin-queue-staging-seed.sql`
- `apps/api/migrations/seed/issue-399-admin-queue-staging-cleanup.sql`

cleanup SQL の代表シグネチャ:

```sql
DELETE FROM audit_log WHERE target_id LIKE 'ISSUE399-%' OR actor_email = 'issue399-seed@example.invalid';
DELETE FROM deleted_members WHERE member_id LIKE 'ISSUE399-%';
DELETE FROM admin_member_notes WHERE note_id LIKE 'ISSUE399-%';
DELETE FROM member_status WHERE member_id LIKE 'ISSUE399-%';
```

### Step 3: shell script 作成

#### `scripts/staging/seed-issue-399.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
ENV="${CLOUDFLARE_ENV:-}"
if [ "$ENV" != "staging" ]; then
  echo "ERROR: CLOUDFLARE_ENV must be 'staging' (got: $ENV)" >&2
  exit 1
fi
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --file apps/api/migrations/seed/issue-399-admin-queue-staging-seed.sql
```

#### `scripts/staging/cleanup-issue-399.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
ENV="${CLOUDFLARE_ENV:-}"
if [ "$ENV" != "staging" ]; then
  echo "ERROR: CLOUDFLARE_ENV must be 'staging' (got: $ENV)" >&2
  exit 1
fi
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --file apps/api/migrations/seed/issue-399-admin-queue-staging-cleanup.sql
# verify
RESULT_NOTES=$(bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --remote --json \
  --command "SELECT count(*) AS c FROM admin_member_notes WHERE note_id LIKE 'ISSUE399-%';")
RESULT_MEMBERS=$(bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --remote --json \
  --command "SELECT count(*) AS c FROM member_status WHERE member_id LIKE 'ISSUE399-%';")
echo "$RESULT_NOTES" | grep -q '"c":0' || { echo "ERROR: admin_member_notes cleanup incomplete" >&2; exit 1; }
echo "$RESULT_MEMBERS" | grep -q '"c":0' || { echo "ERROR: member_status cleanup incomplete" >&2; exit 1; }
```

### Step 4: runbook 作成

`docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/runbook.md` に以下を記述:

1. 1Password から admin 認証情報を取得（ファイル / docs に値を残さない）
2. staging URL `https://web-staging.ubm-hyogo.workers.dev/admin/requests` にアクセス
3. seed 投入: `CLOUDFLARE_ENV=staging bash scripts/staging/seed-issue-399.sh`
4. 7 状態を順次取得（番号付きファイル名で `outputs/phase-11/screenshots/` に保存）
5. redaction 適用 → `redaction-check.md` に全件 PASS 記録
6. `phase11-capture-metadata.json` を作成
7. seed 撤去: `CLOUDFLARE_ENV=staging bash scripts/staging/cleanup-issue-399.sh`
8. 撤去後に Empty state を再取得（`06-empty-state.png`）

### Step 5: screenshot 取得

今回の実体化範囲では Playwright 補助 script は作らず、`runbook.md` の手動手順を正本にする。将来 `scripts/staging/capture-issue-399.mjs` を追加する場合は、同一サイクルで実ファイル・テスト・実行例を追加してから文書参照する。

### Step 6: 親 workflow 反映

`docs/30-workflows/completed-tasks/04b-followup-004-admin-queue-resolve-workflow/outputs/phase-12/implementation-guide.md` の "Visual evidence" セクションに以下を追記:

```markdown
- staging visual evidence: [issue-399 outputs/phase-11/screenshots](../../../../issue-399-admin-queue-resolve-staging-visual-evidence/outputs/phase-11/screenshots/)
- capture metadata: [phase11-capture-metadata.json](../../../../issue-399-admin-queue-resolve-staging-visual-evidence/outputs/phase-11/phase11-capture-metadata.json)
```

## ローカル検証コマンド

```bash
pnpm exec vitest run scripts/staging/__tests__/seed-issue-399.test.ts scripts/staging/__tests__/cleanup-issue-399.test.ts apps/api/migrations/seed/__tests__/issue-399-seed-syntax.test.ts
```

## 完了条件 (DoD)

- [ ] 上記 Step 1〜6 が完了し、focused Vitest が green
- [ ] staging seed 投入 / 実 screenshot 取得 / cleanup は user 承認付き staging runtime cycle で実施する境界を明記

## 目的

Phase 05 の判断と成果物境界を明確にする。

## 実行タスク

- Phase 05 の入力、実装状態、runtime pending 境界を確認する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)

## 成果物

- `outputs/phase-05/main.md`

## 統合テスト連携

- Focused Vitest は Phase 09 の品質 gate に集約する。
