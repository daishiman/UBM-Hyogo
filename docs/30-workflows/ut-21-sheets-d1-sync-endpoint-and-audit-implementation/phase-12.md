# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 sync endpoint 実装と audit logging (UT-21) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-29 |
| 前 Phase | 11 (手動 smoke test) |
| 次 Phase | 13 (PR 作成) |
| 状態 | spec_created |
| タスク分類 | application_implementation（close-out / docs sync） |
| user_approval_required | false |
| Issue | #30 (CLOSED — 仕様書化のみ。再オープンしない) |
| タスク状態 | blocked（03-serial で基本実装済み・認証/テスト未完） |

## 目的

Phase 1〜11 で得られた設計・実装・smoke 知見を、`apps/api/src/sync/*` の運用ドキュメント・正本仕様
（`.claude/skills/aiworkflow-requirements/references/`）・LOGS / topic-map・GitHub Issue #30（CLOSED のまま）に反映し、
task-specification-creator skill の **必須 5 タスク** + same-wave sync ルール + 二重 ledger 同期を完了させる。
03-serial で基本実装済みのコードに対し `implemented` / `docs_only=false` として close-out し、
SYNC_ADMIN_TOKEN Bearer / audit best-effort + outbox / Workers crypto.subtle / 03-serial 5 点同期 / 1Password vault Employee
など UT-21 固有の論点を正本仕様に反映する。

## 必須 5 タスク（task-specification-creator skill 準拠 / 0 件でも全タスク出力必須）

1. **実装ガイド作成（Part 1 中学生 + Part 2 技術者の 2 パート構成）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新（Step 1-A / 1-B / 1-C + 条件付き Step 2）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴作成** — `outputs/phase-12/documentation-changelog.md`
4. **未割当タスク検出レポート（0 件でも出力必須）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須）** — `outputs/phase-12/skill-feedback-report.md`

加えて **Phase 12 自身の compliance check** を `outputs/phase-12/phase12-task-spec-compliance-check.md` に出力する。

## 実行タスク

- Task 12-1: 実装ガイドを Part 1（中学生）+ Part 2（技術者）の 1 ファイルに統合作成。
- Task 12-2: system-spec-update-summary を Step 1-A / 1-B / 1-C + 条件付き Step 2 で構造化記述。
- Task 12-3: documentation-changelog を `scripts/generate-documentation-changelog.js` 相当のフォーマットで出力。
- Task 12-4: unassigned-task-detection を 0 件でも必ず出力（Phase 11 の Cron 最終チューニング U-03 等を formalize）。
- Task 12-5: skill-feedback-report を改善点なしでも必ず出力。
- Task 12-6: phase12-task-spec-compliance-check を実施。
- Task 12-7: same-wave sync（LOGS.md ×2 / SKILL.md ×2 / topic-map）完了。
- Task 12-8: 二重 ledger（root `artifacts.json` と `outputs/artifacts.json`）同期。
- Task 12-9: `validate-phase-output.js` と `verify-all-specs.js` 実行・全 PASS 確認。
- Task 12-10: GitHub Issue #30 は CLOSED のまま、コメントでクローズアウト記録のみ追加（`gh issue comment 30` / 再オープン禁止）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 5 タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 仕様詳細 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | 落とし穴対策 |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A/1-B/1-C / Step 2 / same-wave sync |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-11/main.md | smoke 結果引き継ぎ |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | UT-21 原典 spec |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md | 状態遷移正本 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md | audit best-effort + outbox 仕様 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-05/sync-deployment-runbook.md | runbook 正本 |
| 必須 | docs/30-workflows/LOGS.md | task-level LOGS 同期対象 |
| 必須 | CLAUDE.md | scripts/cf.sh / op 参照 / ブランチ戦略 |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-12.md | 構造リファレンス |

---

## タスク 1: 実装ガイド作成（`outputs/phase-12/implementation-guide.md`）

### Part 1（中学生レベル / 日常の例え話必須）

以下の 3 つ以上の例え話を含めること。

- 「Google スプレッドシートに集まった会員フォームの回答を、私たちの自前のノート（D1 データベース）に毎時間まとめて写す仕組みです」
- 例え話 1（同期）: 「クラスのアンケート用紙（Google Sheets）と、先生がまとめる名簿（D1）を、係の人（Cron Trigger）が毎時間見比べて、新しい回答だけを写してくれます」
- 例え話 2（冪等）: 「同じ人が 2 回書いていても、合言葉（SHA-256 で作った response_id）が同じなので、名簿にダブって載りません」
- 例え話 3（audit + outbox）: 「写した記録は別ノート（audit）に毎回つけます。万一そのノートをなくしても、メモ用紙（outbox）に貼っておいて後で清書するので、本体の名簿は絶対に消しません」
- 例え話 4（admin 権限）: 「ボタンで手動再実行できますが、押せるのは先生（admin role）だけ。CSRF は『正しい教室から押されたか』の確認札のようなものです」

### Part 2（技術者レベル）

- TypeScript インターフェース（exactOptionalPropertyTypes=true 対応で `field: string | undefined`）:
  - `Env` / `SheetRow` / `SyncResult` / `AuditLog` / `BackfillOptions`
- API シグネチャ:
  - `POST /admin/sync` / `POST /admin/sync/responses` / `GET /admin/sync/audit?limit=` のリクエスト・レスポンスフォーマット
  - `scheduled(controller, env, ctx)` のシグネチャ
  - 共通ミドルウェア: `Authorization: Bearer <SYNC_ADMIN_TOKEN>` 検証
  - SYNC_ADMIN_TOKEN Bearer は Web 管理画面から API を呼ぶ場合の上位境界として扱い、API ルートの正本認可とは分離する
- 認可境界マトリクス:
  | 状況 | 期待 | 実装位置 |
  | --- | --- | --- |
  | Bearer token valid | 200 | Hono middleware chain |
  | Authorization header なし | 401 | bearer guard |
  | Bearer token 不一致 | 403 | bearer guard |
  | 既存ジョブ実行中 | 409 | sync lock / job ledger |
- エラーハンドリング:
  - SQLITE_BUSY retry policy（最大 5 回 / base 50ms + jitter / max 5000ms）
  - Sheets 401/403/429/5xx は UT-10 へ委譲
  - audit 失敗時は **本体ロールバックしない**。outbox (`sync_audit_outbox`) へ payload を蓄積（03-serial data-contract.md 準拠）
- Workers crypto.subtle JWT 署名手順:
  - PEM の `-----BEGIN PRIVATE KEY-----` ヘッダ / フッタ / 改行を除去
  - base64 decode → ArrayBuffer
  - `crypto.subtle.importKey('pkcs8', buf, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])`
  - `crypto.subtle.sign(...)` で JWT signature 生成
- Service Account: `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com`
- 1Password vault: **Employee** / item: **ubm-hyogo-env** / 参照は `op://Employee/ubm-hyogo-env/<FIELD>`
- CLI: `wrangler` 直接実行禁止 / 必ず `bash scripts/cf.sh ...` 経由
- 設定可能パラメータ:
  - `SYNC_BATCH_SIZE`（既定 100）
  - `SYNC_MAX_RETRIES`（既定 5）
  - `CRON_DEV` / `CRON_PROD`（dev / prod 分離 — U-03 で最終チューニング）
  - `AUDIT_OUTBOX_RETENTION_DAYS`

### 成果物

- パス: `outputs/phase-12/implementation-guide.md`
- 完了条件: Part 1（例え話 3 つ以上）+ Part 2（IF / API / 認可境界 / エラー / Workers crypto / SA / op vault / cf.sh / パラメータ）が含まれる。

---

## タスク 2: システム仕様更新（`outputs/phase-12/system-spec-update-summary.md`）

### Step 1-A: 完了タスク記録 + 関連 doc リンク + 変更履歴 + LOGS ×2 + topic-map

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/30-workflows/LOGS.md` | UT-21 の Phase 1〜13 完了行追記 |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | sync endpoint 実装と audit logging の正本登録ログ |
| `.claude/skills/task-specification-creator/LOGS.md` | フィードバック記録ログ |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴テーブル更新 |
| `.claude/skills/task-specification-creator/SKILL.md` | 変更履歴テーブル更新 |
| `.claude/skills/aiworkflow-requirements/references/topic-map.md` | 「Sheets→D1 sync endpoint」「audit best-effort + outbox」「SYNC_ADMIN_TOKEN Bearer」キーワード追加 |
| 関連 doc リンク | UT-03 / UT-04 / UT-09 / UT-22 / UT-26 / 03-serial への双方向リンク |

### Step 1-B: 実装状況テーブル更新（`implemented`）

- `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` から本タスクディレクトリへの移動（または link）を記録
- 統合 README の実装状況テーブルで UT-21 を `implemented` ステータスに更新

### Step 1-C: 関連タスクテーブル更新

- UT-03 / UT-04 / UT-09 / UT-22 / UT-26 / 03-serial の index.md の「下流 / 関連」テーブルに UT-21 完了情報を反映

### Step 2（条件付き）: 新規インターフェース追加時のみ

本タスクは既存正本 API（`POST /admin/sync` / `POST /admin/sync/responses`）を実装へ追従し、監査取得 API（`GET /admin/sync/audit`）と新規 D1 テーブル（`sync_audit_logs` / `sync_audit_outbox`）を追加するため **Step 2 必須**。

| 更新対象 | 更新内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 3 ルートの method / path / 認可要件（`SYNC_ADMIN_TOKEN` Bearer）/ レスポンス JSON schema 追記 |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | `sync_audit_logs` / `sync_audit_outbox` テーブル定義追記、`response_id` SHA-256 冪等キーの算出方針記述 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | `[triggers].crons` の dev/prod 分離方針 / Cron + D1 retry policy / `--test-scheduled` smoke 手順を共通セクションに追加 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `GOOGLE_SHEETS_SA_JSON` / `SYNC_ADMIN_TOKEN` / `SHEETS_SPREADSHEET_ID` を vault `Employee` / item `ubm-hyogo-env` に保管、Cloudflare Secrets 登録手順は `bash scripts/cf.sh secret put ...` 経由のみと明記 |

> 03-serial の data-contract.md / sync-flow.md / runbook を **コードコメントへ転記しない**運用ルール（CLAUDE.md 不変条件「実フォームの schema をコードに固定しすぎない」と同趣旨）を守ること。契約変更時は 03-serial を直接編集してから実装を追従させる。

### 成果物

- パス: `outputs/phase-12/system-spec-update-summary.md`
- 完了条件: Step 1-A / 1-B / 1-C + Step 2（4 ファイル更新）が明記され、実ファイル名と一致している。

---

## タスク 3: ドキュメント更新履歴作成（`outputs/phase-12/documentation-changelog.md`）

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-29 | 新規 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/ | UT-21 仕様書 13 Phase + index + artifacts.json |
| 2026-04-29 | 同期 | docs/30-workflows/LOGS.md | UT-21 完了行追加 |
| 2026-04-29 | 同期 | .claude/skills/aiworkflow-requirements/LOGS.md | sync endpoint + audit best-effort + outbox の正本登録 |
| 2026-04-29 | 同期 | .claude/skills/task-specification-creator/LOGS.md | UT-21 フィードバック記録 |
| 2026-04-29 | 更新 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/sync` / `/admin/sync/responses` / `/admin/sync/audit` 追加 |
| 2026-04-29 | 更新 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_audit_logs` / `sync_audit_outbox` 追加 |
| 2026-04-29 | 更新 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cron + D1 retry 共通セクション追加 |
| 2026-04-29 | 更新 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | SA JSON / SYNC_ADMIN_TOKEN を Employee vault に統合 |
| 2026-04-29 | 更新 | .claude/skills/aiworkflow-requirements/references/topic-map.md | Sheets→D1 sync endpoint / audit / SYNC_ADMIN_TOKEN Bearer |

### 成果物

- パス: `outputs/phase-12/documentation-changelog.md`
- 完了条件: 全変更ファイルが網羅される。

---

## タスク 4: 未割当タスク検出レポート（`outputs/phase-12/unassigned-task-detection.md` / 0 件でも出力必須）

| 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- |
| Cron 実スケジュール最終チューニング (U-03) | 検証 | dev 1h / prod 6h 適正性再計測 | 05a-observability-and-cost-guardrails |
| sync metrics 詳細 (U-02) | 設計 | latency / fetched / upserted / outbox 件数の SLI 化 | UT-08 monitoring / 05a-observability |
| sync 失敗通知連携 | 実作業 | Slack / Email | UT-07 notification |
| エラー標準化との整合 | 設計 | retry/backoff 命名統一 | UT-10 error-handling |
| sync_audit_outbox 再消化ジョブ | 実作業 | outbox → audit への retry worker | next wave |
| sync_audit_logs retention 方針 | 設計 | 90 日 / 365 日 | UT-08 monitoring |
| staging load/contention test | 実作業 | UT-21 由来の同時アクセス再現 | UT-26 staging-deploy-smoke |
| Cron スケジュール dev/prod 分離 | 実作業 | wrangler.toml の `[env.production.triggers]` 分離 | 本 PR 後段（U-03） |

> 検出が 0 件の場合も「該当なし」セクションを必ず作成すること。

---

## タスク 5: スキルフィードバックレポート（`outputs/phase-12/skill-feedback-report.md` / 改善点なしでも出力必須）

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | NON_VISUAL 判定が Phase 11 で明確に分岐できた | NON_VISUAL での screenshots/ 自動除外チェックをテンプレ化 |
| aiworkflow-requirements | Workers crypto.subtle / SYNC_ADMIN_TOKEN Bearer / audit outbox の正本ドキュメントが薄かった | `deployment-cloudflare.md` に Cron + D1 retry 共通セクション、`api-endpoints.md` に admin route の認可要件マトリクスを追加 |
| github-issue-manager | Issue #30 (CLOSED) を再オープンせずコメント追記で同期できた | CLOSED Issue への close-out コメント手順をテンプレ化 |

> 改善点が無い場合も「改善点なし」と明示して必ず出力すること。

---

## タスク 6: Phase 12 compliance check（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 5 タスクの成果物が揃っている | 6 成果物（compliance check 含む） | 実行時に PASS 化 |
| 実装ガイドが Part 1 / Part 2 構成 | 中学生 / 技術者の 2 パート | PASS |
| Part 1 に例え話 3 つ以上 | 同期 / 冪等 / audit+outbox / admin | PASS |
| Step 1-A / 1-B / 1-C が記述 | 仕様書同期サマリー | PASS |
| Step 2 が記述（新規 IF 追加あり） | 4 ファイル更新明記 | PASS |
| same-wave sync 完了 | LOGS ×2 + SKILL ×2 + topic-map | 実行時に PASS 化 |
| 二重 ledger 同期 | root + outputs の artifacts.json | PASS（本仕様で ledger 追加済み） |
| validate-phase-output.js | 全 Phase PASS | 実行時に PASS 化 |
| verify-all-specs.js | 全 spec PASS | 実行時に PASS 化 |
| implemented ステータス再判定 | apps/api/src/sync/* の git status 確認、docs_only=false | PASS |
| Issue #30 CLOSED のまま | 再オープン禁止 / コメントのみ追記 | PASS |
| 機密情報非混入 | SA JSON / Bearer / op:// 実値が docs に無い | PASS |

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| LOGS #1 | .claude/skills/aiworkflow-requirements/LOGS.md | YES |
| LOGS #2 | .claude/skills/task-specification-creator/LOGS.md | YES |
| SKILL #1 | .claude/skills/aiworkflow-requirements/SKILL.md | YES |
| SKILL #2 | .claude/skills/task-specification-creator/SKILL.md | YES |
| Index | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | YES |

## 二重 ledger 同期【必須】

- root `artifacts.json`（タスク直下）と `outputs/artifacts.json`（生成物 ledger）を必ず同時更新する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `task.metadata.taskType` / `task.metadata.docsOnly`。
- 片方のみ更新は禁止（drift 主要原因）。

## implemented close-out ルール【必須】

- 本タスクは 03-serial で `apps/api/src/sync/types.ts` / `sheets-client.ts` / `mapper.ts` / `worker.ts` / `apps/api/src/index.ts` への実装が入っているため `implemented` / `docs_only=false` として close-out する。
- 残作業（Bearer 認可ガード / Vitest テスト / dev-prod Cron 分離）は本タスクの完了条件に含め、Phase 11 smoke 実行後に証跡を採取する。仕様作成時点で実績 PASS として扱わない。
- same-wave sync を必ず通し、LOGS / SKILL change history / topic-map / 関連タスクテーブルを完了させて初めて close-out。
- `apps/` / `packages/` の変更は意図した実装範囲かを `git status` で確認し、Step 2 の正本仕様同期を完了させる。

## validate-phase-output.js / verify-all-specs.js 実行確認

```bash
node scripts/validate-phase-output.js \
  --task ut-21-sheets-d1-sync-endpoint-and-audit-implementation

node scripts/verify-all-specs.js
```

- 期待: 両方とも exit code 0 / 全 PASS。
- FAIL 時: 該当 Phase の outputs/ 不足ファイルまたは artifacts.json drift を是正してから再実行。

## GitHub Issue #30 連携【必須 / 再オープン禁止】

```bash
# Issue #30 は CLOSED のまま。クローズアウト記録のコメントのみ追加。
gh issue comment 30 --body "$(cat <<'EOF'
UT-21 の Phase 1〜12 仕様書化が完了しました。

- 仕様書ディレクトリ: docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/
- 実装本体: apps/api/src/sync/* (03-serial で先行実装済み)
- 残作業: SYNC_ADMIN_TOKEN Bearer / Vitest / dev-prod Cron 分離 → Phase 13 PR で投入予定

Issue は CLOSED のまま、追跡情報のみ追記。
EOF
)"

# 再オープンは禁止
# gh issue reopen 30 ← 実行しない
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | smoke 結果と既知制限を system-spec-update-summary に転記 |
| Phase 13 | documentation-changelog を PR 変更ファイル一覧の根拠として使用 |
| 関連タスク | UT-03 / UT-04 / UT-09 / UT-22 / UT-26 / 03-serial の index を双方向更新 |

## 多角的チェック観点

- 価値性: Part 1 が非エンジニアでも読めるか（例え話 3 つ以上）。
- 実現性: Step 2 の 4 ファイルが実在 references と一致しているか。
- 整合性: same-wave sync の LOGS / SKILL / topic-map が最新コミットで一致しているか。
- 運用性: unassigned-task-detection の委譲先タスクが実在 ID か。
- 認可境界: implementation-guide の認可マトリクスが Phase 5 の middleware と一致しているか。
- Secret hygiene: ガイド・更新 references に実 SA JSON / 実 Bearer / 実 op 参照値（vault path 以外）が含まれていないか。
- Issue 整合: #30 を CLOSED のまま扱い、再オープンしていないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 実装ガイド Part 1（中学生）| 12 | spec_created | 例え話 3 つ以上 |
| 2 | 実装ガイド Part 2（技術者）| 12 | spec_created | IF / API / 認可境界 / Workers crypto / SA / op vault |
| 3 | system-spec-update-summary | 12 | spec_created | Step 1-A/B/C + Step 2（4 ファイル）|
| 4 | documentation-changelog | 12 | spec_created | 全変更ファイル網羅 |
| 5 | unassigned-task-detection | 12 | spec_created | 0 件でも出力 |
| 6 | skill-feedback-report | 12 | spec_created | 改善点なしでも出力 |
| 7 | phase12-compliance-check | 12 | spec_created | 全 PASS |
| 8 | same-wave sync (LOGS×2 / SKILL×2 / topic-map) | 12 | spec_created | 必須 |
| 9 | 二重 ledger 同期 | 12 | spec_created | root + outputs |
| 10 | validate / verify スクリプト | 12 | spec_created | exit 0 |
| 11 | Issue #30 コメント追記 | 12 | spec_created | CLOSED のまま / 再オープン禁止 |

## 成果物（必須 6 成果物 + 2 ledger）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生） + Part 2（技術者） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/1-B/1-C + Step 2（4 ファイル） |
| 履歴 | outputs/phase-12/documentation-changelog.md | 全変更ファイル一覧 |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 0 件でも必須 |
| FB | outputs/phase-12/skill-feedback-report.md | 改善点なしでも必須 |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | 全 PASS |
| メタ | artifacts.json (root) | Phase 12 状態の更新 |
| メタ | outputs/artifacts.json | 生成物 ledger 同期 |

## 完了条件

- [ ] 必須 6 成果物が `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1 / Part 2 構成で、Part 1 に日常の例え話が 3 つ以上含まれる
- [ ] system-spec-update-summary に Step 1-A / 1-B / 1-C / Step 2（4 ファイル更新）が明記
- [ ] documentation-changelog に変更ファイルが網羅されている
- [ ] unassigned-task-detection が 0 件でも出力されている
- [ ] skill-feedback-report が改善点なしでも出力されている
- [ ] phase12-task-spec-compliance-check の全項目が PASS
- [ ] same-wave sync（LOGS ×2 / SKILL ×2 + topic-map）が完了
- [ ] 二重 ledger（root + outputs の artifacts.json）が同期
- [ ] `validate-phase-output.js` / `verify-all-specs.js` が exit code 0
- [ ] Issue #30 へのコメント追記済み（再オープンしていない）
- [ ] 実コード混入を検出し `implemented` / `docs_only=false` へ再判定済み

## タスク100%実行確認【必須】

- 全実行タスク（11 件）が `spec_created`
- 必須 6 成果物が `outputs/phase-12/` に配置される設計になっている
- implemented タスクの close-out ルール（N/A にせず same-wave sync で閉じる）が遵守されている
- Step 2 必須（新規 IF 追加あり）の 4 ファイル更新が手順に含まれている
- Issue #30 を CLOSED のまま扱い、再オープン手順を含めていない
- artifacts.json の `phases[11].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection → 関連タスクへの双方向リンク反映済み
  - Issue #30 は CLOSED のまま PR 側で `Refs #30` として参照（`Closes #30` は不可）
- ブロック条件:
  - 必須 6 成果物のいずれかが欠落
  - same-wave sync が未完了（LOGS ×2 / SKILL ×2 + topic-map）
  - 二重 ledger に drift がある
  - validate / verify スクリプトが FAIL
  - Step 2 正本仕様同期が未実施
  - Issue #30 を誤って再オープンした
