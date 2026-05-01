# Phase 11: 手動検証（NON_VISUAL 縮約 + 大規模実測 evidence）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Schema alias apply hardening / 大規模 back-fill 再開可能化 (UT-07B) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動検証（NON_VISUAL 縮約 + 大規模実測 evidence） |
| 作成日 | 2026-05-01 |
| 前 Phase | 10（最終レビューゲート） |
| 次 Phase | 12（ドキュメント更新） |
| 状態 | spec_created |
| タスク分類 | implementation（migration / repository / workflow / route / test を更新） |
| visualEvidence | NON_VISUAL |
| taskType | implementation |
| user_approval_required | false |
| GitHub Issue | #293（CLOSED のまま据え置き） |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由:
  - 対象は admin API + DB 系で、UI 追加なし。既存 admin schema UI の表示は影響を受けない範囲で運用する。
  - 一次証跡は CLI 実行ログ（`scripts/cf.sh d1` / `wrangler tail` 経由の Workers ログ / `vitest` 実行 stdout / `curl` HTTP レスポンス）であり、画面キャプチャを取得する対象が物理的に存在しない。
  - 検証対象は「DB constraint の reject 動作」「retryable HTTP contract の status / body 境界」「10,000 行以上 fixture の back-fill 完了 / 残件 idempotent retry」という **観測可能な数値・JSON ログ** に閉じる。
- 必須 outputs（NON_VISUAL 縮約テンプレ準拠 / 3 点固定 / artifacts.json 完全一致）:
  - `outputs/phase-11/main.md` — Phase 11 主成果物（検証結果サマリ / NON_VISUAL 発火条件 / 必須 outputs リンク / GO 判定）
  - `outputs/phase-11/manual-evidence.md` — 実コマンド出力（`scripts/cf.sh` / `vitest` / `curl` / `wrangler tail`）と 10,000 行実測ログの一次証跡
  - `outputs/phase-11/link-checklist.md` — 関連ドキュメント / migration / spec / Issue 双方向リンクの整合性チェック表
- **screenshot は不要**（NON_VISUAL のため `outputs/phase-11/screenshots/` ディレクトリ自体作成しない / false green 防止）。
- 適用テンプレ: `.claude/skills/task-specification-creator/references/phase-template-phase11.md` §「implementation / NON_VISUAL 縮約テンプレ」。
- 実測パイプライン: 10,000 行 fixture 投入 → alias apply → CPU budget 超過再現 → retryable response 確認 → 残件 retry idempotent 確認 → DB 物理制約 reject 再現。

## 目的

Phase 2〜10 で確定させた以下 4 軸を **staging D1 / Workers 実環境** で検証し、AC-1〜AC-7 の evidence を一次証跡として残す。

1. `schema_questions(revision_id, stable_key)` partial UNIQUE index による **同一 revision collision の DB 物理 reject** が成立する（AC-1）。
2. `backfill_cpu_budget_exhausted` retryable response が **HTTP status / body schema** の境界として固定されている（AC-4）。
3. **10,000 行以上**の `response_fields` fixture を staging D1 / Workers で実測し、batch 数 / CPU 時間 / retry 回数を採取する（AC-5）。
4. CPU budget 超過後の再実行で **残件のみ処理**され、idempotent に back-fill が完了する（AC-3）。

実装コミット範囲（migration / repository / workflow / route / test）の正しさは Phase 9 unit/route/workflow test で担保し、本 Phase は **実環境観測** に閉じる。

## 実行タスク

1. staging D1 / Workers の前提状態確認（migration 適用順 / fixture 不在クリーンアップ）。
2. UT-04 既存 migration 適用 → 衝突解消 UPDATE → 本タスク partial UNIQUE index 追加の **2 段階順序** が staging で成立することを確認する。
3. 10,000 行 / 50,000 行 fixture の `response_fields` 投入と alias 確定→back-fill の実測。
4. CPU budget 超過時の `backfill_cpu_budget_exhausted` retryable response の HTTP status / body 一致確認。
5. 残件 retry の idempotent 性確認（同一 alias 適用で既処理行が二重更新されない）。
6. partial UNIQUE index による同一 revision collision の DB reject 再現（並列 INSERT に対する物理制約効果）。
7. 機密情報非混入 grep（実 database_id / token / 実会員データ漏洩 0 件）。
8. 上記 1〜7 の結果を `manual-evidence.md` / `link-checklist.md` / `main.md` に記録し、Phase 12 へ引き渡す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md | 起票仕様（AC-1〜AC-10） |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/index.md | 本タスクの目次・実行フロー |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-02/db-constraint-design.md | partial UNIQUE index 設計 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-02/resumable-backfill-design.md | 再開可能 back-fill state 設計 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-02/retryable-contract-design.md | retryable HTTP contract 設計 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-02/large-scale-measurement-plan.md | 10,000 / 50,000 行実測計画 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md | 2 段階 migration 手順 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md | rollback 手順 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/api-contract-update.md | retryable failure API contract |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-07/ac-matrix.md | AC × evidence 対応 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-10/go-no-go.md | GO 判定の前提 |
| 必須 | apps/api/migrations/*.sql | 実 migration（UT-04 既存 + 本タスク追加） |
| 必須 | apps/api/src/repository/schemaQuestions.ts | collision pre-check 実装 |
| 必須 | apps/api/src/workflows/schemaAliasAssign.ts | alias 確定 / back-fill / CPU budget 処理 |
| 必須 | apps/api/src/routes/admin/schema.ts | retryable failure 境界 route |
| 必須 | scripts/cf.sh | Cloudflare CLI ラッパー（D1 / Workers tail 実行） |
| 参考 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/phase-11.md | NON_VISUAL 縮約テンプレ第一適用例（docs-only 版） |
| 参考 | .claude/skills/task-specification-creator/references/phase-template-phase11.md | NON_VISUAL 縮約テンプレ |

## 実行手順

### ステップ 1: staging 前提状態の確認

```bash
# staging D1 接続確認 / 既存 migration 状態取得
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging

# schema_questions / response_fields / schema_diff_queue の現件数取得
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) AS n FROM schema_questions; \
             SELECT COUNT(*) AS n FROM response_fields; \
             SELECT COUNT(*) AS n FROM schema_diff_queue;"
```

- 期待: 既存 fixture と本タスク fixture が混線しない初期状態（または初期件数を baseline として記録）。
- 結果は `manual-evidence.md §1` に stdout 抜粋（実 database_id / 実会員 PII はマスク）。

### ステップ 2: 2 段階 migration 適用順序の確認

```bash
# Step 2-1: UT-04 既存 migration 適用済確認（state-only / no-op 想定）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging --dry-run

# Step 2-2: 衝突解消 UPDATE（既存データに同一 revision_id × stable_key 重複が無いことの SELECT）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT revision_id, stable_key, COUNT(*) c FROM schema_questions \
             WHERE stable_key IS NOT NULL AND stable_key NOT LIKE '\\_\\_extra\\_\\_:%' ESCAPE '\\' \
             GROUP BY revision_id, stable_key HAVING c > 1;"

# Step 2-3: partial UNIQUE index 追加 migration 適用
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
```

- 期待: 重複検出 SELECT で 0 件 → partial UNIQUE index 追加成功。
- 1 件以上検出された場合は Phase 5 rollback-runbook の衝突解消 UPDATE を先に実行し、再度 SELECT が 0 件であることを確認してから index 追加。
- 結果は `manual-evidence.md §2` に migration 適用前後の `migrations list` 差分を記録。

### ステップ 3: 10,000 / 50,000 行 fixture 投入 + alias 確定 + back-fill 実測

```bash
# fixture 投入スクリプト（Phase 5 で定義 / Phase 9 で repository test 化済の fixture 生成 SQL を再利用）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --file apps/api/test/fixtures/ut-07b-large-scale-10k.sql

bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) FROM response_fields WHERE revision_id = 'ut-07b-stage-10k';"

# Workers tail を別タブで起動
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging

# alias 確定 + back-fill リクエスト
curl -sS -X POST "$STAGING_API_BASE/admin/schema/aliases" \
  -H "Authorization: Bearer $STAGING_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"revisionId":"ut-07b-stage-10k","aliases":[{"questionId":"q-...","stableKey":"member_status"}]}' \
  -o /tmp/ut-07b-10k-resp.json -w "HTTP=%{http_code}\n"
```

- 採取項目（`manual-evidence.md §3` に表として記録）:

  | 観測指標 | 採取方法 | 期待値 |
  | --- | --- | --- |
  | 投入行数 | fixture 投入後 SELECT COUNT | 10,000 ± 0 / 50,000 ± 0 |
  | 1 リクエスト batch 数 | レスポンス body の `batches` フィールド | 設計値（Phase 2 で確定） |
  | CPU 時間（ms） | Workers tail の `cpuTime` / billing log | 設計予算内 or 超過時 retryable |
  | retry 回数 | retryable response 受領後の再 POST 回数 | idempotent 完了まで |
  | 完了時 `processed_offset` | DB SELECT | 10,000 / 50,000 と一致 |

### ステップ 4: `backfill_cpu_budget_exhausted` retryable response の境界確認

```bash
# CPU budget を意図的に超過させる fixture（50,000 行）で再実行
curl -sS -X POST "$STAGING_API_BASE/admin/schema/aliases" \
  -H "Authorization: Bearer $STAGING_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"revisionId":"ut-07b-stage-50k","aliases":[...]}' \
  -o /tmp/ut-07b-50k-resp.json -w "HTTP=%{http_code}\n"

cat /tmp/ut-07b-50k-resp.json | jq '.'
```

- 期待 HTTP status: `202`。CPU budget 枯渇は処理継続中の retryable state として扱い、インフラ障害を示す 5xx にはしない。
- 期待 body schema:

  ```json
  {
    "error": "backfill_cpu_budget_exhausted",
    "retryable": true,
    "processedOffset": <int>,
    "totalRows": <int>,
    "nextRetryAfterMs": <int>
  }
  ```

- 結果は `manual-evidence.md §4` に HTTP status / body / retry metadata の 3 点で記録。

### ステップ 5: 残件 retry idempotent 確認

```bash
# Step 4 で受け取った processedOffset を引き継いで再 POST（同一 revisionId / 同一 aliases）
curl -sS -X POST "$STAGING_API_BASE/admin/schema/aliases" \
  -H "Authorization: Bearer $STAGING_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"revisionId":"ut-07b-stage-50k","aliases":[...],"resumeFromOffset":<offset>}' \
  -o /tmp/ut-07b-50k-retry.json -w "HTTP=%{http_code}\n"

# 完了後の DB 状態確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) FROM response_fields \
             WHERE revision_id = 'ut-07b-stage-50k' AND stable_key = 'member_status';"
```

- 期待: 全件 50,000 が `member_status` で書き換え済 / 既処理行の二重更新が `audit_log` に発生していない。
- 結果は `manual-evidence.md §5` に処理 offset 推移と `audit_log` 行数で記録。

### ステップ 6: partial UNIQUE index による DB reject 再現

```bash
# 同一 revision_id × 同一確定 stable_key を直接 INSERT して制約違反を再現
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "INSERT INTO schema_questions(revision_id, stable_key, question_id) \
             VALUES ('ut-07b-stage-collide', 'member_status', 'q-A'), \
                    ('ut-07b-stage-collide', 'member_status', 'q-B');"
```

- 期待: 2 行目 INSERT が SQLite UNIQUE constraint failed で reject される。`__extra__:*` / NULL を対象とする INSERT が reject されないことも別 SQL で確認。
- 結果は `manual-evidence.md §6` に reject エラーメッセージとマッチする regex を記録。

### ステップ 7: 機密情報非混入 grep

```bash
rg -n -E "ya29\.|-----BEGIN PRIVATE|sk-[A-Za-z0-9]{20,}|[0-9a-f]{32}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" \
  docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/ \
  || echo "OK: no secrets"
```

- 期待: 0 件。検出時は即時停止し、該当 outputs を是正する。
- 実会員 PII（メールアドレス / 電話番号 / `responseEmail`）が混入していないことも目視で確認する。

### ステップ 8: walkthrough 結果記録

`outputs/phase-11/manual-evidence.md` 冒頭メタに以下を必ず明記する。

- 実行日時（UTC + JST）
- branch 名（`feat/issue-293-ut-07b-schema-alias-hardening-task-spec`）
- staging 環境名（`ubm-hyogo-db-staging` / staging Workers URL）
- screenshot を作成しない理由（NON_VISUAL / 観測対象が CLI / JSON ログのみ）
- 実 database_id / 実 token をマスクしている旨

| 検証観点 | コマンド / 確認手順 | 期待 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 前提状態 | ステップ 1 | baseline 取得 | 実行時採取 | PASS/FAIL |
| 2 段階 migration | ステップ 2 | UT-04 後に index 追加成功 | 実行時採取 | PASS/FAIL |
| 10k/50k 実測 | ステップ 3 | batch / CPU / retry 採取 | 実行時採取 | PASS/FAIL |
| retryable response | ステップ 4 | status / body schema 一致 | 実行時採取 | PASS/FAIL |
| idempotent retry | ステップ 5 | 残件のみ処理 / audit 重複 0 | 実行時採取 | PASS/FAIL |
| DB reject 再現 | ステップ 6 | UNIQUE 違反で reject | 実行時採取 | PASS/FAIL |
| 機密情報非混入 | ステップ 7 | 0 件 | 実行時採取 | PASS/FAIL |

## 代替 evidence 差分表（NON_VISUAL 必須）

| 検証シナリオ | 元前提（VISUAL タスク） | 代替手段（本タスク） | カバー範囲 | 保証外 / 申し送り |
| --- | --- | --- | --- | --- |
| S-1 DB constraint 効果 | 管理 UI のエラーバナー目視 | `scripts/cf.sh d1 execute` での INSERT reject | 物理制約の reject 確実性 | 管理 UI 文言（→ admin UI 別タスク） |
| S-2 retryable HTTP contract | UI での再試行ボタン挙動 | `curl -w` での status code 採取 / body jq 検査 | API 境界の状態コード / body schema | クライアント側 retry UX（→ 別タスク） |
| S-3 10,000 行実測 | UI 進捗バー目視 | Workers tail `cpuTime` + DB COUNT 推移 | back-fill 完了到達と CPU 時間 | UI 進捗表示（→ 別タスク） |
| S-4 idempotent retry | UI 二重実行抑制 | `audit_log` 行数 / processed_offset 推移 | 残件のみ処理される性質 | UI 上の重複ガード（→ 別タスク） |
| S-5 衝突 reject | 管理 UI の 409 表示 | DB UNIQUE 違反エラーの stderr 採取 | DB 層 reject の確実性 | UI エラー表示文言 |

> **NON_VISUAL のため screenshot 不要**。本表により「観測ログレベルで何を保証し、何を別タスクに委譲したか」を明示する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC matrix の evidence 列に本 Phase の証跡パスを記入 |
| Phase 9 | unit / route / workflow test 結果と本 Phase 実測結果を相互参照 |
| Phase 10 | GO 判定の前提として本 Phase の実測 PASS を確認 |
| Phase 12 | 実測で得た改善点 / 限界事象を `unassigned-task-detection.md` / `skill-feedback-report.md` に登録 |

## 多角的チェック観点

- **価値性**: 10,000 行以上の実測が CPU budget を恒常的に超える場合、queue / cron 分割を follow-up 起票するかどうかの判断材料が evidence として十分か。
- **実現性**: staging D1 / Workers / `scripts/cf.sh` だけで全シナリオが実行可能で、別途依存ツールが不要か。
- **整合性**: AC-1（DB constraint）/ AC-3（idempotent）/ AC-4（retryable contract）/ AC-5（10k 実測）が独立に PASS し得るか。
- **運用性**: 衝突解消 SQL / rollback 手順が staging で再現可能か（本番で同手順が使えるか）。
- **認可境界**: outputs に staging Cloudflare Secret 実値 / DB binding 実 ID / 実会員データが含まれていないか（不変条件 #5 の運用面）。
- **Secret hygiene**: ステップ 7 grep が 0 件であること。
- **Issue ライフサイクル**: GitHub Issue #293 が CLOSED のまま、本タスクで再 OPEN しない方針が `link-checklist.md` に明記されているか。
- **NON_VISUAL 整合**: `screenshots/` ディレクトリを誤って作成していないこと。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 前提状態確認 | 11 | spec_created | baseline 採取 |
| 2 | 2 段階 migration 順序確認 | 11 | spec_created | UT-04 → 本タスク index |
| 3 | 10k/50k fixture 実測 | 11 | spec_created | batch / CPU / retry 採取 |
| 4 | retryable response 境界確認 | 11 | spec_created | status / body / retry metadata |
| 5 | idempotent retry 確認 | 11 | spec_created | audit_log 重複 0 |
| 6 | UNIQUE reject 再現 | 11 | spec_created | partial index 効果 |
| 7 | 機密情報非混入 grep | 11 | spec_created | 0 件 |
| 8 | 結果記録（main / manual-evidence / link-checklist） | 11 | spec_created | 3 ファイル固定 |

## manual evidence（記録 placeholder）【必須】

| 項目 | コマンド / 手順 | 採取先 | 採取済 |
| --- | --- | --- | --- |
| 前提状態 baseline | ステップ 1 `d1 execute SELECT COUNT` | manual-evidence.md §1 | 実行時採取 |
| 2 段階 migration 適用 | ステップ 2 `d1 migrations apply` | manual-evidence.md §2 | 実行時採取 |
| 10k 実測 | ステップ 3 `curl` + Workers tail | manual-evidence.md §3 | 実行時採取 |
| retryable response | ステップ 4 `curl -w` + `jq` | manual-evidence.md §4 | 実行時採取 |
| idempotent retry | ステップ 5 `audit_log` 集計 | manual-evidence.md §5 | 実行時採取 |
| UNIQUE reject 再現 | ステップ 6 `d1 execute INSERT` | manual-evidence.md §6 | 実行時採取 |
| 機密情報非混入 | ステップ 7 `rg` | manual-evidence.md §7 | 実行時採取 |
| 参照リンク疎通 | ステップ 8 表 | link-checklist.md | 実行時採取 |

> 各セクションには「コマンド」「実行日時」「stdout 抜粋」「期待値との一致 / 不一致」を記録する。実 token / database_id（UUID） / 実会員 PII は必ずマスクする。

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | 本番 D1 への適用は本 Phase で実行しない | 本番投入 | Phase 13 PR merge 後の運用手順（migration-runbook 参照） |
| 2 | 50,000 行で恒常的に CPU budget 超過する場合の queue / cron 分割実装は本タスクスコープ外 | 大規模時の throughput | 実測結果次第で follow-up 起票（unassigned-task-detection に記録）|
| 3 | 管理 UI のエラー表示文言更新は対象外 | UI 表示整合 | admin UI 改修タスク or 別タスク |
| 4 | 監視アラート閾値改訂は対象外 | SLO / dashboard 整合 | UT-08 監視タスク連動 |
| 5 | NON_VISUAL のため screenshot 不要、CLI / JSON 一次証跡で代替 | 視覚証跡なし | manual-evidence.md / link-checklist.md で補完 |
| 6 | GitHub Issue #293 は CLOSED のまま、本タスクで再 OPEN しない | Issue ライフサイクル整合 | PR body / commit message では `Refs #293` のみ採用（Phase 13）|

## 成果物（NON_VISUAL 縮約 / 3 点固定）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | 検証結果サマリ / NON_VISUAL 発火条件 / 必須 outputs リンク / GO 判定 |
| ログ | outputs/phase-11/manual-evidence.md | 7 観点 + 10,000 行実測の一次証跡（CLI 出力 / curl レスポンス / Workers tail 抜粋） |
| 参照検証 | outputs/phase-11/link-checklist.md | 仕様書 ↔ 上流 ↔ 既存実装ファイル ↔ migration ↔ Issue #293 のリンク疎通表 |
| メタ | artifacts.json | Phase 11 状態の更新（`phases[10].status = completed`） |

> `outputs/phase-11/screenshots/` は作成しない（NON_VISUAL 整合 / false green 防止）。

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-evidence.md` / `link-checklist.md` の 3 ファイルが揃っている
- [ ] manual evidence テーブル 8 項目すべての採取列が完了（または各 N/A 理由が記載）
- [ ] 代替 evidence 差分表（S-1〜S-5）が記述され、保証範囲 / 保証外が明示されている
- [ ] ステップ 2 の 2 段階 migration 順序が PASS（衝突 0 → index 追加成功）
- [ ] ステップ 3 で 10,000 行 fixture の実測が完了し batch / CPU 時間 / retry 回数が記録されている
- [ ] ステップ 4 の retryable response の HTTP status / body schema が Phase 5 api-contract-update.md と一致
- [ ] ステップ 5 の idempotent retry が PASS（`audit_log` の二重更新 0 件）
- [ ] ステップ 6 の UNIQUE reject 再現が PASS
- [ ] ステップ 7 の機密情報非混入 grep が 0 件
- [ ] 既知制限が 6 項目以上列挙され、それぞれ委譲先または補足が記述されている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] GitHub Issue #293 が CLOSED のまま、再 OPEN 指示が文書に存在しない

## タスク 100% 実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物 3 ファイルが `outputs/phase-11/` 配下に配置される設計
- AC-1 / AC-3 / AC-4 / AC-5 の証跡採取手順が定義済み
- 本番 D1 への migration 適用が Phase 13 PR merge 後の運用に委譲される旨が明記
- artifacts.json の Phase 11 entry（`phase: 11`）が `completed` に更新可能な設計

## 次 Phase への引き渡し

- 次 Phase: 12（ドキュメント更新）
- 引き継ぎ事項:
  - 10,000 / 50,000 行実測の数値（batch 数 / CPU 時間 / retry 回数）を Phase 12 implementation-guide Part 2 に転記
  - retryable response の HTTP status / body schema を Phase 12 system-spec-update-summary の Step 1-A（aiworkflow-requirements / api-endpoints.md）に同期
  - 大規模時の queue / cron 分割の必要性判断結果を `unassigned-task-detection.md` に記録（必要なら follow-up 起票候補として明記）
  - 既知制限 #1（本番 D1 適用）/ #2（queue 分割）を Phase 12 に引き渡し
- ブロック条件:
  - manual evidence の 8 項目に未採取 / 未 N/A 化が残っている
  - 2 段階 migration / 10k 実測 / retryable response / idempotent retry / UNIQUE reject のいずれかが FAIL
  - `screenshots/` ディレクトリが誤って作成されている
  - 機密情報 grep で 1 件以上検出（→ 即時停止 / outputs 是正）
