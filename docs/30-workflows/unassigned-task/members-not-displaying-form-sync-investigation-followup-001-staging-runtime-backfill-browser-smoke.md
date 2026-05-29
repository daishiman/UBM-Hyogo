---
governance_mutation_user_gate: true
mutation_commands:
  - "bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging"
  - "SYNC_ADMIN_TOKEN=<redacted> bash scripts/backfill-publish-state.sh --env staging --apply"
read_only_evidence_allowed_pre_gate: true
user_approval_marker: docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/outputs/phase-13/user-approval-gate-c-runtime-<timestamp>.md
issue_number:
998

# Members form sync investigation FU-001 — staging runtime / backfill / browser smoke

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | members-not-displaying-form-sync-investigation-fu-001-staging-runtime-backfill-browser-smoke |
| タスク名 | Gate-C staging runtime verification, backfill apply, and `/members` browser smoke |
| 分類 | follow-up / runtime verification / bugfix close-out |
| 対象機能 | Google Form response sync → `member_status.publish_state` → public members visibility |
| 優先度 | high |
| 規模 | medium |
| ステータス | unassigned |
| 発見元 | `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/outputs/phase-12/main.md` Gate-C pending |
| 発見日 | 2026-05-28 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`members-not-displaying-form-sync-investigation` では、Google Form 回答済み会員が `/members` に表示されない問題に対し、API 診断、`MEMBERS_AUTO_PUBLISH_ON_CONSENT` policy、sync-token diagnostics endpoint、dry-run default の backfill endpoint と scripts をローカル実装した。Phase 11/12 では focused tests、D1 contract tests、typecheck、build、script syntax が PASS し、Gate-B は完了している。

一方で、実際に staging Worker へ deploy し、staging D1 の既存 `member_status` を dry-run/apply し、`/members` の表示復旧を browser smoke で確認する Gate-C は user-gated として残っている。これは runtime 環境・secret・D1 mutation を伴うため、元ワークフロー内で自動実行していない。

### 1.2 問題点・課題

- ローカル実装は正しいが、staging deploy なしでは `MEMBERS_AUTO_PUBLISH_ON_CONSENT=true` と新 endpoint が実環境に反映されたことを証明できない。
- backfill dry-run だけでは既存 records の `publish_state='member_only'` が解消されず、`/members` 0 件の実症状が残る。
- browser smoke を取らないまま完了扱いにすると、API response は改善しても public members UI が復旧したか検証できない。

### 1.3 放置した場合の影響

- `/members` が空のまま運用され、Form 回答済み会員が公開ディレクトリに表示されない状態が継続する。
- 実装済み backfill endpoint が未実行のまま残り、次の担当者が「ローカル実装済み」と「runtime 未反映」の境界を再調査する必要がある。
- production flag enablement 判断に必要な staging evidence が不足する。

---

## 2. 何を達成するか（What）

### 2.1 目的

staging 環境で Gate-C を完了し、diagnostics/backfill/browser smoke の evidence を `members-not-displaying-form-sync-investigation` workflow に保存する。

### 2.2 最終ゴール

- staging deploy 後に `GET /admin/sync/diagnostics/forms-pipeline` が新 schema fields を返す。
- backfill dry-run で対象件数を確認し、user approval 後の apply で `candidates` が `applied` へ反映される。
- apply 後の diagnostics で `visiblePublicCount` が期待値へ増加する。
- `/members` browser smoke で会員表示が確認でき、before/after screenshot が保存される。

### 2.3 スコープ

#### 含む

- `apps/api` staging deploy。
- `scripts/diagnose-members-pipeline.sh --env staging` の pre/post 実行。
- `scripts/backfill-publish-state.sh --env staging --dry-run` の read-only evidence 取得。
- user approval marker 作成後の `scripts/backfill-publish-state.sh --env staging --apply` 実行。
- `/members` の before/after browser smoke screenshot と結果メモ作成。
- `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/outputs/phase-11/` への runtime evidence 保存。

#### 含まない

- production `MEMBERS_AUTO_PUBLISH_ON_CONSENT=true` 切替。
- production D1 backfill apply。
- commit、push、PR 作成。
- Google Form schema 変更、D1 migration 追加、public members UI の追加実装。

### 2.4 成果物

- `outputs/phase-11/diagnose-pre.json`
- `outputs/phase-11/backfill-dry-run.json`
- `outputs/phase-11/backfill-apply.json`
- `outputs/phase-11/diagnose-post.json`
- `outputs/phase-11/members-page-before.png`
- `outputs/phase-11/members-page-after.png`
- `outputs/phase-11/gate-c-runtime-summary.md`

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `SYNC_ADMIN_TOKEN` の staging 用 secret 値をユーザーが安全に提供できること。
- Cloudflare 操作は必ず `scripts/cf.sh` 経由で実行すること。
- apply 実行前に user approval marker を作成し、dry-run 結果と apply 対象件数を明示すること。

### 3.2 推奨アプローチ

1. deploy 前に `/members` の before screenshot を取得する。
2. staging deploy を実行し、新 route と `MEMBERS_AUTO_PUBLISH_ON_CONSENT=true` を反映する。
3. diagnostics pre と backfill dry-run を取得し、対象件数と skipped breakdown を確認する。
4. user approval marker を保存してから apply を実行する。
5. diagnostics post と `/members` after screenshot を取得し、`visiblePublicCount` と UI 表示の両方で復旧を確認する。
6. Gate-C summary を書き、Phase 11 evidence inventory の pending を present に更新する。

---

## 4. 実行手順

1. before screenshot:

```bash
# Browser / Playwright などで staging `/members` を開き、before screenshot を保存する。
```

2. staging deploy:

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

3. diagnostics pre:

```bash
SYNC_ADMIN_TOKEN=<redacted> bash scripts/diagnose-members-pipeline.sh --env staging \
  > docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/outputs/phase-11/diagnose-pre.json
```

4. backfill dry-run:

```bash
SYNC_ADMIN_TOKEN=<redacted> bash scripts/backfill-publish-state.sh --env staging --dry-run \
  > docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/outputs/phase-11/backfill-dry-run.json
```

5. user approval marker:

```bash
mkdir -p docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/outputs/phase-13
$EDITOR docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/outputs/phase-13/user-approval-gate-c-runtime-<timestamp>.md
```

6. backfill apply:

```bash
SYNC_ADMIN_TOKEN=<redacted> bash scripts/backfill-publish-state.sh --env staging --apply \
  > docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/outputs/phase-11/backfill-apply.json
```

7. diagnostics post:

```bash
SYNC_ADMIN_TOKEN=<redacted> bash scripts/diagnose-members-pipeline.sh --env staging \
  > docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/outputs/phase-11/diagnose-post.json
```

8. after screenshot and summary:

```bash
# staging `/members` を再読込し、after screenshot と gate-c-runtime-summary.md を保存する。
```

---

## 5. 完了条件チェックリスト

- [ ] staging deploy が成功している。
- [ ] diagnostics pre/post JSON が保存され、secret 値が含まれていない。
- [ ] dry-run の `candidates` / skipped breakdown を確認済み。
- [ ] user approval marker 作成後にのみ apply を実行している。
- [ ] apply 結果の `applied` が dry-run の期待値と整合している。
- [ ] post diagnostics で `visiblePublicCount` が増加、または対象なしの場合は理由が summary に記録されている。
- [ ] `/members` before/after screenshot が保存されている。
- [ ] commit、push、PR、production mutation を実行していない。

---

## 6. 検証方法

### 単体検証

```bash
pnpm --filter @ubm-hyogo/api typecheck
pnpm --filter @ubm-hyogo/api build
bash -n scripts/diagnose-members-pipeline.sh scripts/backfill-publish-state.sh
```

期待: すべて exit code 0。

### 統合検証

```bash
SYNC_ADMIN_TOKEN=<redacted> bash scripts/diagnose-members-pipeline.sh --env staging
SYNC_ADMIN_TOKEN=<redacted> bash scripts/backfill-publish-state.sh --env staging --dry-run
SYNC_ADMIN_TOKEN=<redacted> bash scripts/backfill-publish-state.sh --env staging --apply
SYNC_ADMIN_TOKEN=<redacted> bash scripts/diagnose-members-pipeline.sh --env staging
```

期待: `diagnosis` が H3 publish_state 停止を解消方向に示し、`visiblePublicCount` と `/members` 表示が一致する。

### ブラウザ検証

```bash
# staging `/members` の before/after screenshot を取得し、会員カードまたは一覧行が表示されることを確認する。
```

期待: after screenshot で public members が 1 件以上表示される。0 件が正しい場合は diagnostics の `totals` / breakdown で根拠を説明する。

---

## 7. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| staging deploy が runtime 互換性で失敗する | 高 | deploy log を保存し、`apps/api` build/typecheck green との差分を `gate-c-runtime-summary.md` に記録する |
| `SYNC_ADMIN_TOKEN` をログに出す | 高 | token は環境変数で渡し、script 出力に token が含まれないことを `rg '<token-prefix>|SYNC_ADMIN_TOKEN' outputs/phase-11` で確認する |
| dry-run と apply の間に D1 state が変わる | 中 | apply 直前に dry-run timestamp と candidate count を approval marker に記録し、差分が大きい場合は再 dry-run する |
| admin override された hidden member を公開してしまう | 高 | `skipped.adminExplicit` と `updated_by != system:*` の policy evidence を確認し、apply 後に hidden override が維持されていることを spot check する |
| API diagnostics は改善するが `/members` UI は空のまま | 中 | browser smoke を必須成果物にし、UI 側の別原因があれば新規 follow-up として切り出す |

---

## 8. 参照情報

- `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/outputs/phase-12/main.md`
- `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/phase-11-evidence-inventory.md`
- `apps/api/src/routes/admin/sync-backfill-publish-state.ts`
- `apps/api/src/routes/admin/sync-diagnostics.ts`
- `apps/api/src/lib/policies/auto-publish.ts`
- `scripts/diagnose-members-pipeline.sh`
- `scripts/backfill-publish-state.sh`

---

## 9. 備考

このタスクは Phase 13 の commit/push/PR とは独立している。runtime evidence を先に取得しても、コミットや PR 作成はユーザーの明示指示があるまで実行しない。

## 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/artifacts.json`
- 症状: Gate-B は local verified だが Gate-C は pending で、Phase-12 完了と runtime 完了を混同しやすい。
- 参照: `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/outputs/phase-12/main.md`
- 対策: 本タスクでは Phase-12 完了を前提に、Gate-C runtime evidence だけを扱う。Phase 13 commit/PR は含めない。

- 対象: `apps/api/src/jobs/sync-forms-responses.ts`
- 症状: `MEMBERS_AUTO_PUBLISH_ON_CONSENT` は sync 時の新規/更新 records に効くが、既存 records は backfill apply しないと公開状態が変わらない。
- 参照: `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/outputs/phase-12/implementation-guide.md`
- 対策: deploy 後に diagnostics だけで終えず、dry-run/apply/post diagnostics/browser smoke を一連の gate として扱う。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| runtime mutation をユーザー承認なしに実行する | frontmatter の `governance_mutation_user_gate=true` を守り、apply 前に approval marker を作る |
| evidence JSON に secret や token が混入する | scripts は token を表示しない前提だが、保存後に redaction grep を実行する |
| `/members` 0 件が別原因で残る | diagnostics breakdown と browser smoke を照合し、UI/API 別原因なら本タスク内で実装せず follow-up 化する |

## 検証方法

### 単体検証

```bash
pnpm --filter @ubm-hyogo/api typecheck
pnpm --filter @ubm-hyogo/api build
bash -n scripts/diagnose-members-pipeline.sh scripts/backfill-publish-state.sh
```

期待: すべて exit code 0。

### 統合検証

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
SYNC_ADMIN_TOKEN=<redacted> bash scripts/diagnose-members-pipeline.sh --env staging
SYNC_ADMIN_TOKEN=<redacted> bash scripts/backfill-publish-state.sh --env staging --dry-run
SYNC_ADMIN_TOKEN=<redacted> bash scripts/backfill-publish-state.sh --env staging --apply
SYNC_ADMIN_TOKEN=<redacted> bash scripts/diagnose-members-pipeline.sh --env staging
```

期待: deploy 成功、dry-run/apply の件数整合、post diagnostics の `visiblePublicCount` 改善、`/members` after screenshot で表示復旧。

## スコープ

### 含む

- staging deploy / diagnostics / backfill dry-run / approval 後 apply / browser smoke。
- Gate-C runtime evidence の保存。
- Phase 11 evidence inventory の pending → present 更新。

### 含まない

- production flag enablement。
- production D1 mutation。
- commit / push / PR。
- 新規 API、D1 migration、UI 実装追加。
