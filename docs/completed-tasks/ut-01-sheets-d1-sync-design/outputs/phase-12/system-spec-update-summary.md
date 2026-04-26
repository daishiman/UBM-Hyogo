# Phase 12 — システム仕様更新サマリ

## Step 1 完了記録

| Step | 内容 | 結果 |
|------|------|------|
| 1-A | 同期方式の決定（Cron Triggers pull方式） | 完了 |
| 1-B | sync_audit テーブル契約の確定 | 完了 |
| 1-C | エラーハンドリング・リトライポリシーの確定 | 完了 |
| 1-D | source-of-truth定義の明文化 | 完了 |
| 1-E | Sheets API Quota対処方針の確定 | 完了 |
| 1-F | バッチサイズ・ウェイトパラメータの確定 | 完了 |
| 1-G | AC-1〜AC-7のトレースマトリクス確認 | 完了 |

---

## Step 2 判定

### 2A: 上流仕様書の更新が必要か

| 対象仕様書 | 更新要否 | 理由 |
|-----------|---------|------|
| `docs/00-getting-started-manual/specs/08-free-database.md` | 不要 | 物理スキーマは既存 migration を正とし、本タスクでは新規 D1 schema を追加しない。 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 不要 | フォームスキーマ変更なし。 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 更新 | Sheets→D1 sync の current facts 導線を追加。 |
| `.claude/skills/aiworkflow-requirements/LOGS.md` / `SKILL-changelog.md` / `SKILL.md` | 更新 | UT-01 close-out と current facts を same-wave で記録。 |
| `.claude/skills/task-specification-creator/LOGS.md` / `SKILL-changelog.md` | 更新 | Phase 12 hardening feedback を記録。 |

**判定: 物理スキーマ更新は不要。ただし正本スキル導線と close-out 記録は必要。**

### 2A-2: 実コード・既存 migration との契約整合

| 項目 | Current authoritative fact | UT-01 反映 |
| --- | --- | --- |
| 手動同期 route | `POST /sync/manual` | implementation-guide を更新 |
| backfill route | `POST /sync/backfill` | implementation-guide を更新 |
| audit lookup route | `GET /sync/audit?limit=20` | implementation-guide に追加 |
| audit id | `run_id` | `run_id` 表記を廃止 |
| trigger field | `trigger_type` | `trigger` 表記を廃止 |
| status enum | `running` / `success` / `partial_failure` / `failure` | `failure` 表記を廃止 |
| row counts | `rows_fetched` / `rows_upserted` / `rows_skipped` | `rows_upserted` / `rows_upserted` 表記を廃止 |
| UPSERT | `ON CONFLICT(response_id) DO UPDATE` 方針 | `ON CONFLICT(response_id) DO UPDATE` を避ける方針へ補正 |

### 2B: タスク完了種別

| 項目 | 値 |
|------|----|
| タスク種別 | docs-only |
| 実装ステータス | spec_created |
| Phase 1-12 | completed |
| Phase 13 | pending（user_approval_required） |

**判定: `spec_created` として閉じる。Phase 13（PR作成）はユーザー承認待ち。**

## Step 1-A same-wave evidence

| 対象 | 結果 |
| --- | --- |
| root / outputs `artifacts.json` parity | 完了 |
| Phase 11 docs-only screenshot N/A evidence | 完了 |
| task index status | `spec_created` / Phase 1-12 completed |
| aiworkflow-requirements LOGS / changelog | UT-01 current facts 追記 |
| task-specification-creator LOGS / changelog | Phase 12 hardening 追記 |
