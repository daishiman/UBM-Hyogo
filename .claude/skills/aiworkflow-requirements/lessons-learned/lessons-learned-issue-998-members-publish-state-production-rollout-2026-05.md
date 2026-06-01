# Lessons Learned — issue-998 members publish_state production rollout

> 対象 workflow: `docs/30-workflows/completed-tasks/issue-998-members-publish-state-production-rollout/`
> 記録日: 2026-05-30
> 区分: runtime-ops + task-spec / VISUAL_ON_EXECUTION
> 関連 Issue: #998（CLOSED。PR 文脈は `Refs #998` のみ）

## 要約

staging で検証済みの members auto-publish policy を production へ展開する rollout。実装本体は `apps/api/wrangler.toml` の production `MEMBERS_AUTO_PUBLISH_ON_CONSENT="true"` のみで、auto-publish policy / Forms sync job / diagnostics / backfill endpoint / public filter / ops scripts は既存実装を再利用する。config 変更 + 既存滞留 record の backfill + runtime smoke を Gate-C で user-gated 実行する点が要点。

## Lessons

### L-I998PROD-001 — Flag 変更と backfill は両輪。config だけでは既存 record が昇格しない

- **Why**: flag を ON にしても、既存 record の `publish_state` は `member_only` のまま。flag 後の新規 sync からのみ昇格するため、既存滞留分の復旧には backfill apply が別途必須。
- **How to apply**: config-only 変更で安心せず、backfill dry-run → approval → apply の 3 段を直列実行。既存 record が升格しなければ `candidates=0` を確認し、別原因（H1 ingest / H2 identity / H4 schema）を suspect する。

### L-I998PROD-002 — D1 backup は apply 前に取得し、コミット対象外に保管

- **Why**: backfill apply は `member_status` の一括 UPDATE で不可逆。誤りや admin override 誤公開（R-02）が生じても backup なしでは復旧不能。
- **How to apply**: Task C の step 0 で `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup-YYYYMMDD.sql` を実行し、SQL は repo 外（user 手許）に保存。summary には path のみ記録する。

### L-I998PROD-003 — backfill は admin override（`publish_state='hidden'`）を上書きしない保証が最優先

- **Why**: privacy 事故の最大リスク。hidden member や明示的 admin override が backfill で強制公開されてはならない。
- **How to apply**: dry-run の `skipped.adminExplicit` 件数を事前確認し、apply 後に対象 member の hidden 維持を spot check。`decidePublishState` / `isAdminOverrideStatus` のロジックが green であることを前提にする。

### L-I998PROD-004 — staging 実績比で candidates が乖離したら apply 中止 → user escalate

- **Why**: staging と production で record 数・分布が異なれば backfill 件数が想定外になりうる。自動 apply で誤数を確定させず判断権をユーザーへ返す。
- **How to apply**: dry-run JSON の `candidates` を staging 実績の `applied` と比率比較し、10〜20% 以上の乖離なら approval marker で中止＋ escalation を記録する。

### L-I998PROD-005 — deploy 失敗・worker 異常時の rollback 手順を deploy 前に用意

- **Why**: Cloudflare deploy が bundle 互換性（OpenNext / Workers）で失敗、または新 worker が runtime 500 を返す可能性がある。
- **How to apply**: deploy log と version id を summary に控え、異常時は `bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/api/wrangler.toml --env production` を実行。Phase 9 R-05 と Task C rollback table を正本にする。

### L-I998PROD-006 — evidence 保存後に secret redaction grep を必須実行

- **Why**: backfill / diagnose 出力 JSON・log に `SYNC_ADMIN_TOKEN` / `CLOUDFLARE_API_TOKEN` が混入すると、repo・AI コンテキスト・security audit で expose される。
- **How to apply**: `outputs/phase-11/` 保存直後に `rg 'SYNC_ADMIN_TOKEN|CLOUDFLARE_API_TOKEN' outputs/phase-11 outputs/phase-13` がゼロ件であることを検証。script 内は `<redacted>` 記載に統一する。

### L-I998PROD-007 — Issue #998 は CLOSED 維持、PR 文脈は `Refs #998` のみ

- **Why**: 原 issue はローカル診断・API 実装で CLOSED 済み。本 workflow は production rollout の runbook 化に過ぎず、reopen してはならない。
- **How to apply**: commit / PR body に `Refs #998` のみ記載し、Issue state mutation はしない。production runtime ops（deploy / backfill）完了後の close もユーザー明示承認まで待つ（Phase 13 user-gated）。関連: [[project_issue956_h1_ingest_recovery_skill_sync]] と同じ closed-issue runbook パターン。
