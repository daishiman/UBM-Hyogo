# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 sync endpoint 実装と audit logging (UT-21) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-29 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | spec_created |
| タスク分類 | application_specification（PR creation / approval gate） |
| user_approval_required | **true** |
| Issue | #30 (CLOSED — 再オープンしない / `Refs #30` で参照のみ) |
| タスク状態 | blocked（SYNC_ADMIN_TOKEN Bearer ガード + Vitest + dev-prod Cron 分離が本 PR に含まれる前提） |

## 目的

Phase 1〜12 の成果物（仕様書 / 実装 / smoke 証跡 / docs sync）をまとめて PR を作成し、
**ユーザーの明示的な承認を経て** レビュー → マージへ進める。
承認ゲート前のいかなる commit / push / PR 作成も禁止し、approval を取得して初めて自動同期手順へ進む。
Issue #30 は CLOSED のまま扱い、PR body では `Refs #30` として参照する（`Closes #30` は使用しない）。

> **重要: このフェーズは user の明示的な承認なしに実行してはならない。**
> approval 取得前に commit / push / PR を作らない（厳守）。
> Claude Code は本 Phase の commit / push / `gh pr create` を **絶対に自走実行しない**。
> user が「PR を作ってよい」と明示的に指示した場合に限りステップ 4 を実行する。

## 承認ゲート（approval gate）【最優先 / 必須】

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 10 GO 判定 | `outputs/phase-10/go-no-go.md` が GO | 要確認 |
| Phase 11 manual evidence | 10 項目すべて採取済（または N/A 理由明記） | 要確認 |
| Phase 11 認可境界 4 パターン | admin OK / 401 / 403 ×2 すべて記録 | 要確認 |
| Phase 11 audit 失敗時 outbox 蓄積 | best-effort 方針証跡 | 要確認 |
| Phase 12 必須 6 成果物 | implementation-guide / system-spec-update-summary / changelog / unassigned-task / skill-feedback / compliance-check | 要確認 |
| Phase 12 compliance check | 全 PASS | 要確認 |
| Phase 12 same-wave sync | LOGS ×2 / SKILL ×2 / topic-map | 要確認 |
| Phase 12 二重 ledger 同期 | root + outputs の artifacts.json | 要確認 |
| Phase 12 Step 2 同期 | api-endpoints / database-schema / deployment-cloudflare / deployment-secrets-management | 要確認 |
| validate / verify スクリプト | exit code 0 | 要確認 |
| change-summary レビュー | user が変更内容を把握 | **user 承認待ち** |
| 機密情報の非混入 | SA JSON / Bearer / op:// 実値 / session cookie 値が無い | 要確認 |
| Issue #30 ステータス | CLOSED のまま / 再オープンしない | 要確認 |
| PR 作成実行 | **user の明示的な指示があった場合のみ実行** | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない**。
> user の承認は「PR を作ってください」のような明示的指示で取得する。曖昧な合意では実行しない。

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得する）。
2. local-check-result（typecheck / lint / test / wrangler smoke）を実行・記録する。
3. 機密情報 grep を実行する。
4. change-summary（PR description 草案）を作成する。
5. **user 承認後**、ブランチ作成 → コミット粒度ごとに commit → push → PR 作成を実行する。
6. CI 確認と承認後マージの手順を記録する（マージ実行は user 操作）。
7. main マージ後のクローズアウト動線を記録する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-12/phase12-task-spec-compliance-check.md | 承認ゲート前提 |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-11/main.md | 動作確認サマリー |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/index.md | PR タイトル / 説明根拠 |
| 必須 | CLAUDE.md | ブランチ戦略 / レビュー人数 / scripts/cf.sh ルール |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | UT-21 原典 spec |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-13.md | PR テンプレ参照 |

## 実行手順

### ステップ 1: 承認ゲート通過（user 承認必須）

1. Phase 10 GO 判定 / Phase 11 manual evidence (10 項目) / Phase 12 必須 6 成果物 + compliance check が PASS していることを確認する。
2. `validate-phase-output.js` / `verify-all-specs.js` が exit 0 であることを再確認する。
3. change-summary を user に提示し、**明示的な承認**を待つ。
4. 承認取得後にステップ 2 へ進む。承認が得られない場合はここで停止し、指摘事項を Phase 5 / 11 / 12 に差し戻す。

> **Claude Code は user 明示承認前にステップ 2 以降を実行しない**。
> ステップ 2 (typecheck/lint/test) は read-only 系だが、PR 作成 ワークフロー全体としての user 承認に紐付けて実行する。

### ステップ 2: local-check-result（PR 前ローカル確認）

```bash
# 型チェック (exactOptionalPropertyTypes=true 環境)
mise exec -- pnpm typecheck

# Lint
mise exec -- pnpm lint

# 単体 / 結合テスト (Vitest unit / contract / integration / authorization)
mise exec -- pnpm test

# Cron / sync エンドポイントの最終確認（Phase 11 と同様）
cd apps/api
mise exec -- pnpm wrangler dev --test-scheduled --local &
sleep 3
curl -i -X POST 'http://localhost:8787/__scheduled?cron=0+*+*+*+*'
curl -i -X POST 'http://localhost:8787/admin/sync' \
  -H "Cookie: authjs.session-token=$ADMIN_SESSION" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"
kill %1
```

| チェック項目 | 期待値 | 記録先 |
| --- | --- | --- |
| typecheck (exactOptionalPropertyTypes=true) | exit 0 | outputs/phase-13/local-check-result.md §local-check |
| lint | exit 0 | 同上 |
| test (unit / contract / integration / authorization) | 全 PASS | 同上 |
| wrangler smoke (scheduled + sync/manual) | 200 | 同上 |
| `git status` で意図せぬ変更が無い | clean | 同上 |

### ステップ 3: 機密情報 grep（必須）

```bash
# Service Account JSON / OAuth token / Bearer / op:// 実値の混入チェック
git diff --cached | grep -nE "ya29\.|-----BEGIN PRIVATE|ubm-hyogo-sheets-reader@.*credentials|sk-[A-Za-z0-9]{20,}|authjs\.session-token=[A-Za-z0-9]" || echo "OK: secret leak none"

# 1Password vault 実値（op:// 参照は OK だが解決済み実値は NG）
git diff --cached | grep -nE "GOOGLE_SHEETS_SA_JSON=.{50,}|SYNC_ADMIN_TOKEN=[A-Za-z0-9]{16,}" || echo "OK: env leak none"
```

- 期待: 0 件。
- 検出時: 即時停止 / Phase 12 secret hygiene セクションに差し戻し。`.env` 実値は CLAUDE.md 不変条件で禁止。

### ステップ 4: change-summary（PR description 草案）

`outputs/phase-13/local-check-result.md` に以下構造で記述する。

#### 概要

UT-21 (GitHub Issue #30, CLOSED) に基づき、03-serial-data-source-and-storage-contract で確定した sync 契約に従い
`apps/api/src/sync/*` 配下に Sheets→D1 同期エンドポイントと audit logging を実装する。
`POST /admin/sync` / `POST /admin/sync/responses` / `GET /admin/sync/audit` の 3 ルートと Cloudflare Cron Trigger 経由の `scheduled()` を提供し、
SYNC_ADMIN_TOKEN Bearer の 認可、SQLITE_BUSY retry、SHA-256 冪等キー (`response_id`)、
audit best-effort + outbox（本体ロールバックなし）、Workers crypto.subtle による RS256 JWT 署名を備える。

#### 動機

- GitHub Issue: #30 (CLOSED) — UT-21: Sheets→D1 sync endpoint 実装と audit logging
- 03-serial で「contract-only / docs-only」原則を貫いたため、phase-12 で sync コード本体の不在が unassigned-task (U-04) として検出された
- 03-serial の data-contract / sync-flow / runbook を実装で追従させ、契約と実装の境界を解消する

#### 変更内容

**実装ファイル一覧（03-serial で先行実装済み + 本 PR で残作業を投入）**:

- `apps/api/src/sync/types.ts`（Env / SheetRow / SyncResult / AuditLog 型 — exactOptionalPropertyTypes=true 対応）
- `apps/api/src/sync/sheets-client.ts`（Workers crypto.subtle 製 RS256 JWT + Sheets API v4 fetch）
- `apps/api/src/sync/mapper.ts`（COL 定数 / mapRowToSheetRow / generateResponseId SHA-256 冪等キー）
- `apps/api/src/sync/worker.ts`（runSync / runBackfill / upsertRow / writeAuditLog + outbox）
- `apps/api/src/sync/middleware.ts`（**本 PR 新規**: SYNC_ADMIN_TOKEN Bearer ガード）
- `apps/api/src/index.ts`（`POST /admin/sync` / `POST /admin/sync/responses` / `GET /admin/sync/audit` ルート + middleware 適用）
- `apps/api/test/sync/*.spec.ts`（**本 PR 新規**: 冪等性 / audit best-effort / 認可境界 Vitest）
- `apps/api/wrangler.toml`（`[triggers].crons` の dev / production 分離）

**ドキュメント / 仕様書**:

- `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/`（Phase 1〜13 + index + outputs）
- `docs/30-workflows/LOGS.md`（UT-21 完了行追加）
- `.claude/skills/aiworkflow-requirements/LOGS.md` / `SKILL.md` / `references/api-endpoints.md` / `database-schema.md` / `deployment-cloudflare.md` / `deployment-secrets-management.md` / `indexes/topic-map.md`
- `.claude/skills/task-specification-creator/LOGS.md` / `SKILL.md`

**Cloudflare Secrets 登録（user 操作 / `bash scripts/cf.sh secret put` 経由）**:

- `GOOGLE_SHEETS_SA_JSON`（vault: Employee, item: ubm-hyogo-env）
- `SYNC_ADMIN_TOKEN`
- `SHEETS_SPREADSHEET_ID`

#### 動作確認

- Phase 11 manual smoke 10 項目 PASS（実行後）（`outputs/phase-11/manual-smoke-log.md`）
- 認可境界パターン PASS（実行後）（admin OK / 401 / 403 ×2）
- audit 失敗時 outbox 蓄積 PASS（実行後）（best-effort 方針証跡）
- 冪等性 + SQLITE_BUSY 回避 PASS（実行後）
- 自動テスト: unit / contract / integration / authorization 全 PASS（実行後に Phase 9 サマリー転記）

#### リスク・後方互換性

- **破壊的変更なし**（既存ルートに影響しない、新規ルート / 新規 D1 テーブル追加のみ）
- 新規 D1 テーブル: `sync_audit_logs` / `sync_audit_outbox`（`member_responses` は UT-04 / UT-22 既存）
- 新規 Cloudflare Secret: 上記 3 件（dev / production それぞれ事前登録要 / `bash scripts/cf.sh` 経由）
- 03-serial 契約との 5 点同期チェック PASS

### ステップ 5: コミット粒度・branch / commit / push（user 承認後のみ）

コミット粒度は以下の単位で分離し、レビューしやすい順に積む。

| # | コミット | 含むファイル |
| --- | --- | --- |
| 1 | `feat(api): UT-21 sync middleware (SYNC_ADMIN_TOKEN Bearer )` | apps/api/src/sync/middleware.ts |
| 2 | `feat(api): UT-21 register /sync/* routes with admin guard` | apps/api/src/index.ts |
| 3 | `chore(api): UT-21 split cron schedule for dev/production` | apps/api/wrangler.toml |
| 4 | `test(api): UT-21 Vitest for runSync idempotency / audit outbox / authz` | apps/api/test/sync/*.spec.ts |
| 5 | `docs(workflows): UT-21 phase 1-13 specifications` | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/ |
| 6 | `docs(skills): UT-21 same-wave sync (LOGS x2 / SKILL x2 / topic-map / references)` | .claude/skills/** + docs/30-workflows/LOGS.md |

```bash
# 現在のブランチが feat/ut-21-sheets-d1-sync-endpoint-and-audit-implementation であることを確認
git status
git branch --show-current

# 例: 1 番目のコミット
git add apps/api/src/sync/middleware.ts
git commit -m "$(cat <<'EOF'
feat(api): UT-21 sync middleware (SYNC_ADMIN_TOKEN Bearer )

Auth.js セッション検証 → admin role チェック → CSRF token → Bearer の
4 段階を Hono middleware として集約し /sync/* ルート全体に適用する。

Refs #30
EOF
)"

# ... 残りの 5 コミットも同様に粒度ごとに作成

# push (user 操作後のみ)
git push -u origin feat/ut-21-sheets-d1-sync-endpoint-and-audit-implementation
```

### ステップ 6: PR 作成（user 承認後のみ）

```bash
gh pr create \
  --title "feat(api): UT-21 Sheets→D1 sync endpoint と audit logging (Refs #30)" \
  --base dev \
  --head feat/ut-21-sheets-d1-sync-endpoint-and-audit-implementation \
  --body "$(cat <<'EOF'
## Summary

- UT-21: Sheets→D1 sync endpoint (`POST /admin/sync` / `POST /admin/sync/responses` / `GET /admin/sync/audit`) と Cron `scheduled()` を実装
- SYNC_ADMIN_TOKEN Bearer の 認可ガード、audit best-effort + outbox（本体ロールバックなし）、SHA-256 冪等キー、Workers crypto.subtle による RS256 JWT 署名
- 03-serial-data-source-and-storage-contract の data-contract / sync-flow / runbook と 5 点同期済み

## Test plan

- [ ] `mise exec -- pnpm typecheck` が exit 0（exactOptionalPropertyTypes=true）
- [ ] `mise exec -- pnpm lint` が exit 0
- [ ] `mise exec -- pnpm test`（unit / contract / integration / authorization）全 PASS
- [ ] `wrangler dev --test-scheduled` + `/__scheduled` POST で scheduled が 200
- [ ] `/admin/sync` を Bearer token valid で 200、各欠落で 401/403/403/401 を確認
- [ ] `/admin/sync/responses` で `trigger_type='backfill'` の audit 行が記録される
- [ ] `/admin/sync/audit?limit=10` で直近 audit が JSON 取得できる
- [ ] 二重実行で `member_responses` 重複なし（SHA-256 response_id 一意制約）
- [ ] audit テーブル一時 rename テストで主データはコミット、`sync_audit_outbox` に蓄積
- [ ] `git diff` に SA JSON / Bearer / op:// 解決済み実値が混入していない
- [ ] Cloudflare Secrets (`GOOGLE_SHEETS_SA_JSON` / `SYNC_ADMIN_TOKEN` / `SHEETS_SPREADSHEET_ID`) を `bash scripts/cf.sh secret put ...` で dev / production に登録

## Linked Issue

Refs #30 (CLOSED — 仕様書化のため再オープンせず参照のみ)

## Risk / 後方互換性

- 破壊的変更なし（新規ルート / 新規 D1 テーブル追加のみ）
- 03-serial 契約との 5 点同期 PASS

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `feat(api): UT-21 Sheets→D1 sync endpoint と audit logging (Refs #30)` |
| body | Summary / Test plan / Linked Issue / Risk（上記 HEREDOC） |
| reviewer | solo 開発のため 0（CLAUDE.md ブランチ戦略・CI gate のみで保護） |
| base | `dev`（推奨） → 後段で `main` へ昇格 PR を別途作成 |
| head | `feat/ut-21-sheets-d1-sync-endpoint-and-audit-implementation` |
| labels | `area:api` / `task:UT-21` / `wave:1` |
| linked issue | #30（`Refs #30` のみ。`Closes #30` は使用しない / Issue は CLOSED のまま） |

## 承認後の自動同期手順（user 操作）

PR 作成後の以下は **user の操作領域** とし、Claude は実行しない（指示があれば補助コマンドの提示のみ）。

```bash
# CI 確認
gh pr checks <PR番号>

# user による承認後のマージ（user 操作）
gh pr merge <PR番号> --squash --delete-branch
```

## main マージ後のクローズアウト動線

1. `dev` → `main` 昇格 PR を作成（solo 運用のため reviewer 0 / CI gate + 線形履歴で保護）。
2. main マージ後、artifacts.json の全 Phase を `completed` に更新（root + outputs の二重 ledger 同期）。
3. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` で Cloudflare Workers production にデプロイ（`wrangler` 直接実行禁止）。
4. production で `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` で `sync_audit_logs` / `sync_audit_outbox` のマイグレーションを適用。
5. production で 1h 程度 Cron 観測し、`sync_audit_logs` に行が積まれていることを `bash scripts/cf.sh d1 execute ...` で確認。
6. Issue #30 は **CLOSED のまま**。クローズアウト記録は Phase 12 で追加済みのコメントで完了とする。
7. UT-26 staging-deploy-smoke へ「contention test 実施」を引き継ぐ。
8. UT-07 通知 / UT-08 monitoring / UT-10 error-handling / 05a-observability の上流条件 fulfilled を伝達する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定を承認ゲートの前提として再利用 |
| Phase 11 | manual smoke 結果（10 項目 + 認可 4 + outbox + 冪等）を PR の動作確認セクションに転記 |
| Phase 12 | documentation-changelog から変更ファイルリストを生成 |

## 多角的チェック観点

- 価値性: PR が UT-21 の実装空白（U-04）を解消し、Phase 11 証跡へリンクできているか。
- 実現性: local-check-result が typecheck / lint / test / smoke すべて PASS か。
- 整合性: change-summary が Phase 12 documentation-changelog と一致しているか。
- 運用性: PR description が dev → main 昇格時の reviewer / CI gate に必要十分な情報を含むか。
- 認可境界: コミット差分に Bearer / SA JSON / op:// 解決済み実値が混入していないか（grep）。
- 後方互換性: 既存ルート / 既存テーブルに破壊的変更が無いことを diff で再確認したか。
- Issue 整合: `Closes #30` を使わず `Refs #30` で参照しているか（Issue を再オープンしていないか）。
- CLI 規約: `wrangler` 直接実行ではなく `bash scripts/cf.sh` 経由になっているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート通過 | 13 | spec_created | **user 明示承認必須** |
| 2 | local-check-result（typecheck/lint/test/smoke） | 13 | spec_created | 全 PASS |
| 3 | 機密情報 grep | 13 | spec_created | 0 件 |
| 4 | change-summary 作成 | 13 | spec_created | user 提示用 |
| 5 | コミット粒度ごとに commit | 13 | spec_created | 6 コミット予定 |
| 6 | branch / push | 13 | spec_created | 承認後のみ |
| 7 | gh pr create | 13 | spec_created | base=dev / head=feat / `Refs #30` |
| 8 | CI 確認 | 13 | spec_created | gh pr checks |
| 9 | マージ手順記録（user 操作） | 13 | spec_created | Claude は実行しない |
| 10 | main マージ後クローズアウト動線 | 13 | spec_created | deploy + migrations + observation |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/local-check-result.md | local-check-result + change-summary + PR テンプレ + 承認ログ + クローズアウト動線 |
| PR | user 承認後に作成 | UT-21 実装 PR（`Refs #30` / Issue は CLOSED のまま） |
| メタ | artifacts.json | 全 Phase 状態の更新（マージ後 completed） |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む）
- [ ] local-check-result が typecheck / lint / test / smoke 全 PASS
- [ ] 機密情報 grep が 0 件
- [ ] change-summary が PR body と一致している
- [ ] PR が作成され Issue #30 に `Refs #30` で紐付いている（Issue は CLOSED のまま）
- [ ] CI（`gh pr checks`）が green
- [ ] コミット粒度が 6 単位で分離されている
- [ ] マージ後、artifacts.json の全 Phase が `completed`
- [ ] main マージ後のクローズアウト動線（deploy / migrations / observation）が記録されている
- [ ] `wrangler` 直接実行が一切無く、`bash scripts/cf.sh` 経由のみ

## タスク100%実行確認【必須】

- 全実行タスク（10 件）が `spec_created`
- 承認ゲートが他のすべての手順より先行する設計になっている
- approval 取得前に commit / push / PR 作成しない方針が明文化されている
- マージ操作・production deploy は user の領域として明確に分離されている
- Issue #30 を CLOSED のまま扱い、`Closes #30` を使わず `Refs #30` で参照する設計になっている
- artifacts.json の `phases[12].user_approval_required = true`、`status = spec_created`

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項:
  - PR マージ後、UT-26 staging-deploy-smoke で staging load/contention test を実施する
  - UT-07（通知）/ UT-08（モニタリング）/ UT-10（エラーハンドリング標準化）/ 05a-observability の上流条件 fulfilled を伝達する
  - artifacts.json の `phases[*].status` を `completed` に更新（user マージ後）
  - production の `sync_audit_outbox` 監視ジョブを next wave で設計する
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない（厳守）
  - local-check-result のいずれかが FAIL（→ Phase 5 / 11 へ差し戻し）
  - 機密情報 grep で 1 件以上検出（→ 即時停止 / Phase 12 secret hygiene 再確認）
  - Issue #30 を誤って再オープン / `Closes #30` で誤って再 close を試みた
  - `wrangler` 直接実行が混入した（→ `scripts/cf.sh` 経由に修正）
