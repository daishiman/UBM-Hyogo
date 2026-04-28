# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 同期ジョブ実装 (UT-09) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-27 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | spec_created |
| タスク分類 | application_specification（PR creation / approval gate） |
| user_approval_required | **true** |

## 目的

Phase 1〜12 の成果物（仕様書 / 実装 / smoke 証跡 / docs sync）をまとめて PR を作成し、ユーザーの明示的な承認を経てレビュー → マージへ進める。承認ゲート前のいかなる commit / push / PR 作成も禁止し、approval を取得して初めて自動同期手順へ進む。

> **重要: このフェーズは user の明示的な承認なしに実行してはならない。**
> approval 取得前に commit / push / PR を作らない（厳守）。

## 承認ゲート（approval gate）【最優先 / 必須】

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 10 GO 判定 | `outputs/phase-10/go-no-go.md` が GO | 要確認 |
| Phase 11 manual evidence | 6 項目すべて採取済（または N/A 理由明記） | 要確認 |
| Phase 12 compliance check | 方針衝突が解消されるまで FAIL | BLOCKED |
| validate / verify スクリプト | exit code 0 | 要確認 |
| change-summary レビュー | user が変更内容を把握 | **user 承認待ち** |
| 機密情報の非混入 | SA JSON / Bearer / database_id 実値が無い | 要確認 |
| PR 作成実行 | **user の明示的な指示があった場合のみ実行** | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない**。

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得する）。
2. local-check-result（typecheck / lint / test / wrangler smoke）を実行・記録する。
3. change-summary（PR description 草案）を作成する。
4. user 承認後、ブランチ作成 → commit → push → PR 作成を実行する。
5. CI 確認と承認後マージの手順を記録する（マージ実行は user 操作）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-12/phase12-task-spec-compliance-check.md | 承認ゲート前提 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-11/main.md | 動作確認サマリー |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | PR タイトル / 説明根拠 |
| 必須 | CLAUDE.md | ブランチ戦略 / レビュー人数 |
| 参考 | docs/30-workflows/completed-tasks/ut-02-d1-wal-mode/phase-13.md | PR テンプレ参照 |

## 実行手順

### ステップ 1: 承認ゲート通過（user 承認必須）

1. Phase 10 GO 判定 / Phase 11 manual evidence / Phase 12 compliance check が PASS していることを確認する。現状は `task-ut09-direction-reconciliation-001.md` が未解決のため BLOCKED。
2. `validate-phase-output.js` / `verify-all-specs.js` が exit 0 であることを再確認する。
3. change-summary を user に提示し、**明示的な承認**を待つ。
4. 承認取得後にステップ 2 へ進む。承認が得られない場合はここで停止し、指摘事項を Phase 5 / 11 / 12 に差し戻す。

### ステップ 2: local-check-result（PR 前ローカル確認）

```bash
# 型チェック
mise exec -- pnpm typecheck

# Lint
mise exec -- pnpm lint

# 単体 / 結合テスト
mise exec -- pnpm test

# Cron 動作の最終確認（Phase 11 と同様）
cd apps/api
mise exec -- pnpm wrangler dev --test-scheduled --local &
sleep 3
curl -i -X POST 'http://localhost:8787/__scheduled?cron=0+*/6+*+*+*'
curl -i -X POST 'http://localhost:8787/admin/sync' \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"
kill %1
```

| チェック項目 | 期待値 | 記録先 |
| --- | --- | --- |
| typecheck | exit 0 | outputs/phase-13/main.md §local-check |
| lint | exit 0 | 同上 |
| test (unit / contract / integration) | 全 PASS | 同上 |
| wrangler smoke | scheduled / admin sync 200 | 同上 |
| `git status` で意図せぬ変更が無い | clean | 同上 |
| 機密情報チェック（grep -nE "ya29\.|-----BEGIN PRIVATE"） | 0 件 | 同上 |

### ステップ 3: change-summary（PR description 草案）

`outputs/phase-13/main.md` に以下構造で記述する。

#### 概要

UT-09 に基づき、`apps/api` に Cloudflare Workers Cron Trigger による Google Sheets → D1 定期同期ジョブを実装する。`POST /admin/sync`（手動再実行）/ `scheduled()`（Cron）の 2 経路を提供し、`SQLITE_BUSY` retry / write queue serialization / 短い transaction / batch-size 制限 / 二重実行防止 lock / A1 range 分割または chunk 処理 / 冪等 upsert を備える。

#### 動機

- GitHub Issue: #11 (CLOSED) — UT-09: Sheets→D1 同期ジョブ実装
- admin-managed data の鮮度を運用コストゼロで維持する必要がある
- UT-01 / UT-02 / UT-03 / UT-04 が完了し、技術前提が揃った

#### 変更内容

**新規ファイル一覧（実装側 / 想定）**:

- `apps/api/src/sync/scheduled.ts`（Cron handler）
- `apps/api/src/sync/sync-service.ts`（pull→map→upsert 統括）
- `apps/api/src/sync/sheets-client.ts`（Sheets API v4 + pagination）
- `apps/api/src/sync/d1-repo.ts`（batch upsert + retry/backoff）
- `apps/api/src/sync/lock.ts`（`sync_locks` 制御）
- `apps/api/src/sync/log.ts`（`sync_job_logs` 記録）
- `apps/api/src/routes/admin-sync.ts`（`POST /admin/sync` + Bearer 検証）
- `apps/api/migrations/00XX_sync_job_logs_locks.sql`
- `apps/api/test/sync/*.spec.ts`

**修正ファイル一覧（想定）**:

- `apps/api/wrangler.toml`（`[triggers].crons` 追加 / dev 1h / main 6h）
- `apps/api/src/index.ts`（`scheduled` export / route 登録）
- `.dev.vars.example`（`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` / `SYNC_ADMIN_TOKEN`）
- `docs/30-workflows/LOGS.md` / `docs/30-workflows/02-application-implementation/LOGS.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` / `database-schema.md` / `deployment-cloudflare.md` / `topic-map.md`

#### 動作確認

- Phase 11 manual smoke 6 項目すべて PASS（`outputs/phase-11/manual-smoke-log.md`）
- 自動テスト: unit / contract / integration / authorization 全 PASS（Phase 9 サマリー転記）
- 二重実行テストで idempotency PASS

#### リスク・後方互換性

- **破壊的変更なし**（既存ルートに影響しない、新規ルート / 新規 D1 テーブル追加のみ）
- 新規 D1 テーブル: `sync_job_logs` / `sync_locks`（`members` は UT-04 既存）
- 新規 Cloudflare Secret: `GOOGLE_SHEETS_SA_JSON` / `SYNC_ADMIN_TOKEN` / `SHEETS_SPREADSHEET_ID`（dev / production それぞれ事前登録要）
- 後方互換性: 既存 API クライアントへの影響なし（admin route は新規追加）

### ステップ 4: PR 作成（user 承認後のみ）

```bash
# 現在のブランチが feat/<task> であることを確認
git status
git branch --show-current

# 必要なファイルを明示的に add（git add . は使わない）
git add apps/api/src/sync/ \
        apps/api/src/routes/admin-sync.ts \
        apps/api/migrations/ \
        apps/api/wrangler.toml \
        apps/api/test/sync/ \
        docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/ \
        docs/30-workflows/LOGS.md \
        docs/30-workflows/02-application-implementation/LOGS.md \
        .claude/skills/aiworkflow-requirements/references/

# コミット
git commit -m "$(cat <<'EOF'
feat(api): UT-09 Sheets→D1 cron sync job (Issue #11)

- Cloudflare Workers Cron Trigger による定期同期 + /admin/sync 手動経路
- sync_job_logs / sync_locks テーブル追加（D1 マイグレーション）
- SQLITE_BUSY retry / write queue serialization / batch upsert / pagination
- Phase 1〜12 の仕様書 + same-wave sync 完了

Closes #11
EOF
)"

# push
git push -u origin feat/<task-name>

# PR 作成
gh pr create \
  --title "feat(api): UT-09 Sheets→D1 cron sync job (Issue #11)" \
  --base dev \
  --head feat/<task-name> \
  --body "$(cat <<'EOF'
## 概要
UT-09 に基づき、apps/api に Cloudflare Workers Cron Trigger による Google Sheets → D1 定期同期ジョブを実装します。

## 動機
- GitHub Issue: #11 (UT-09: Sheets→D1 同期ジョブ実装)
- admin-managed data の鮮度を 6 時間以内で担保

## 変更内容
- 新規: apps/api/src/sync/* / routes/admin-sync.ts / migrations / test
- 修正: wrangler.toml (Cron) / index.ts / .dev.vars.example
- docs: ut-09 仕様書 13 Phase + LOGS / topic-map / references 反映

## 動作確認
- Phase 11 manual smoke 6 項目 PASS
- unit / contract / integration / authorization 全 PASS
- 二重実行 idempotency PASS

## リスク・後方互換性
- 破壊的変更なし（新規 route / 新規 D1 テーブル追加のみ）
- 新規 Secret 3 件は dev / production に事前登録済み

## 関連 Issue
Closes #11
EOF
)"
```

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `feat(api): UT-09 Sheets→D1 cron sync job (Issue #11)` |
| body | 概要 / 動機 / 変更内容 / 動作確認 / リスク・後方互換性 / 関連 Issue（上記参照） |
| reviewer | dev 向け: 1 名 / main 向け: 2 名（CLAUDE.md ブランチ戦略） |
| base | `dev`（推奨） → 後段で `main` へ昇格（main は 2 名レビュー） |
| head | `feat/<task-name>`（feature → dev → main） |
| labels | `area:api` / `task:UT-09` / `wave:1` |
| linked issue | #11 |

## 承認後の自動同期手順（user 操作）

PR 作成後の以下は **user の操作領域** とし、Claude は実行しない（指示があれば補助コマンドの提示のみ）。

```bash
# CI 確認
gh pr checks <PR番号>

# レビュー依頼
gh pr edit <PR番号> --add-reviewer <reviewer-id>

# user による承認後のマージ（user 操作）
gh pr merge <PR番号> --squash --delete-branch
```

- マージ後、`dev` から `main` への昇格 PR を別途作成する（main は 2 名レビュー）。
- マージ完了後、artifacts.json の全 Phase を `completed` に更新する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定を承認ゲートの前提として再利用 |
| Phase 11 | manual smoke 結果を PR の動作確認セクションに転記 |
| Phase 12 | documentation-changelog から変更ファイルリストを生成 |

## 多角的チェック観点

- 価値性: PR が Issue #11 を close し、AC-1〜AC-11 の証跡へリンクできているか。
- 実現性: local-check-result が typecheck / lint / test / smoke すべて PASS か。
- 整合性: change-summary が Phase 12 documentation-changelog と一致しているか。
- 運用性: PR description が dev → main 昇格時のレビュアーに必要十分な情報を含むか。
- 認可境界: コミット差分に Bearer token / SA JSON / database_id 実値が混入していないか（grep）。
- 後方互換性: 既存ルート / 既存テーブルに破壊的変更が無いことを diff レビューで再確認したか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート通過 | 13 | spec_created | **user 承認なし禁止** |
| 2 | local-check-result（typecheck/lint/test/smoke） | 13 | spec_created | 全 PASS |
| 3 | 機密情報 grep | 13 | spec_created | 0 件 |
| 4 | change-summary 作成 | 13 | spec_created | user 提示用 |
| 5 | branch / commit / push | 13 | spec_created | 承認後のみ |
| 6 | gh pr create | 13 | spec_created | base=dev / head=feat |
| 7 | CI 確認 | 13 | spec_created | gh pr checks |
| 8 | マージ手順記録（user 操作） | 13 | spec_created | Claude は実行しない |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | local-check-result + change-summary + PR テンプレ + 承認ログ |
| PR | user 承認後に作成 | UT-09 実装 PR（Issue #11 close） |
| メタ | artifacts.json | 全 Phase 状態の更新（マージ後 completed） |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む）
- [ ] local-check-result が typecheck / lint / test / smoke 全 PASS
- [ ] 機密情報 grep が 0 件
- [ ] change-summary が PR body と一致している
- [ ] PR が作成され Issue #11 に紐付いている（`Closes #11`）
- [ ] CI（`gh pr checks`）が green
- [ ] reviewer がブランチ戦略に従って指名されている（dev=1 / main=2）
- [ ] マージ後、artifacts.json の全 Phase が `completed`

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 承認ゲートが他のすべての手順より先行する設計になっている
- approval 取得前に commit / push / PR 作成しない方針が明文化されている
- マージ操作は user の領域として明確に分離されている
- artifacts.json の `phases[12].user_approval_required = true`、`status = spec_created`

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項:
  - PR マージ後、UT-26 staging-deploy-smoke で staging load/contention test（AC-8）を実施する
  - UT-07（通知基盤）/ UT-08（モニタリング）/ UT-10（エラーハンドリング標準化）の上流条件 fulfilled を伝達する
  - artifacts.json の `phases[*].status` を `completed` に更新（user マージ後）
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない
  - local-check-result のいずれかが FAIL（→ Phase 5 / 11 へ差し戻し）
  - 機密情報 grep で 1 件以上検出（→ 即時停止 / Phase 12 secret hygiene 再確認）
