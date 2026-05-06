# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-07B-FU-01 schema alias back-fill queue/cron split |
| GitHub Issue | #361（CLOSED 維持 / `Refs #361`） |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-05-05 |
| 前 Phase | 8（DRY 化 / 仕様間整合） |
| 次 Phase | 10（最終レビューゲート） |
| 状態 | spec_created |
| taskType | implementation（条件付き：staging 10,000+ rows evidence で着手判断） |
| visualEvidence | NON_VISUAL |
| 実装区分 | **実装仕様書** |

## 目的

implementation / NON_VISUAL タスクとしての品質保証を行う。本タスクは `wrangler.toml` への Cloudflare Queue / Cron binding 追加、`apps/api/src/workflows/schemaAliasAssign.ts` の二段化 refactor、queue consumer / cron handler の新規追加、`apps/api/src/routes/admin/schema.ts` の `confirmed` / `backfill.status` 分離 response、`apps/api/src/repository/schemaDiffQueue.ts` への共通 helper 集約、route / workflow / queue consumer / cron handler / repository test 群の追加を伴うため、契約文書としての網羅性に加えて **(1) 単体検証コマンド（typecheck / lint / vitest）の合否、(2) 統合検証コマンド（contract ↔ コード ↔ `aiworkflow-requirements` の `rg` 突合）、(3) queue consumer のローカルテスト戦略、(4) cron handler のローカル検証、(5) coverage しきい値とゲート、(6) AC トレーサビリティ、(7) 不変条件 #5 遵守、(8) セキュリティ（PII / auth）、(9) link / mirror / a11y 判定** の 9 観点で QA する。

Phase 11 staging 10,000+ rows evidence による着手 gate 判定後に最終確認するが、Phase 9 では Phase 4 検証戦略 / Phase 7 AC マトリクス / Phase 8 DRY 化結果を照合し、CI / staging で実行する具体的なコマンドと合否基準を確定する。

---

## 実行タスク

1. **単体検証コマンドの確定**: typecheck / lint / vitest の対象ファイルとコマンドを確定する（完了条件: mise exec ラッパー込みで 3 コマンドが記述、テスト対象 4 ファイル網羅）。
2. **統合検証コマンドの確定**: contract ↔ コード ↔ `aiworkflow-requirements` の `rg` 突合コマンドを確定する（完了条件: `backfill_cpu_budget_exhausted` / `backfill.status` / `confirmed` の 3 観点で突合）。
3. **queue consumer のローカルテスト戦略確定**: miniflare queue mock / wrangler dev queue local mode を用いたローカル実行手順を確定する（完了条件: コマンド + 期待動作 + duplicate enqueue 抑止 / partial failure recovery を網羅）。
4. **cron handler のローカル検証戦略確定**: `wrangler dev --test-scheduled` 等で cron handler を手動 trigger する手順を確定する（完了条件: コマンド + 期待動作 + remaining-scan idempotent 動作確認）。
5. **coverage しきい値とゲートの確定**: vitest coverage の line / branch / function 各しきい値と `scripts/coverage-guard.sh --changed` 整合を確定する（完了条件: 4 ファイル個別しきい値 + coverage-guard 整合）。
6. **AC トレーサビリティ表作成**: AC-1 〜 AC-11 が成果物 path × 該当セクションでトレース可能か確認する（完了条件: 11 AC × 成果物 × 該当セクション 3 列表が完成、空セル 0）。
7. **不変条件 #5 遵守チェック**: queue consumer / cron handler を含む全実装が `apps/api/**` 配下に閉じることを `rg` で機械検証する（完了条件: `apps/web` から D1 binding / Queue binding 直接参照 0）。
8. **セキュリティ確認**: queue message に PII を含めない方針 + admin auth が consumer / cron 起動経路に必要かの確認（完了条件: queue message field に email / 個人識別子なし、consumer / cron は internal binding 経由で auth 必須化が不要であることを記述）。
9. **link / mirror parity / a11y 判定**: `outputs/phase-XX/*.md` / `index.md` / `artifacts.json` / 親タスク 07b dir / `aiworkflow-requirements/references/*` / Issue #361 のリンク切れ 0、mirror / a11y は N/A を明記（完了条件: リンク切れ 0、双方 N/A 明記）。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-04.md | 検証戦略 |
| 必須 | docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-07.md | AC マトリクス |
| 必須 | docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-08.md | DRY 化済み単一正本 path |
| 必須 | docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/index.md | AC / 不変条件 / 主要参照 |
| 必須 | apps/api/wrangler.toml | Queue / Cron binding 追加箇所 |
| 必須 | apps/api/src/workflows/schemaAliasAssign.ts | 二段化 refactor 対象 |
| 必須 | apps/api/src/routes/admin/schema.ts | response 分離対象 |
| 必須 | apps/api/src/repository/schemaDiffQueue.ts | 共通 helper 集約先 |
| 必須 | scripts/coverage-guard.sh | coverage しきい値の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | contract 突合対象 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | schema 突合対象 |
| 参考 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-09.md | QA 観点の参照事例 |

---

## 苦戦箇所【記入必須】

| # | 苦戦箇所 | 影響範囲 | 緩和策 |
| --- | --- | --- | --- |
| 1 | Cloudflare Queue を local で実行する場合、miniflare の queue mock と本番 Queue の挙動差（visibility timeout / dead letter queue / max retries）が CI / staging / production で再現しない可能性 | Phase 9 / 11 | Phase 9 で miniflare mock を「契約検証」に限定し、staging で実 Queue による before/after evidence を Phase 11 で取得する戦略を明示。production 挙動の最終確認は Phase 11 staging 実測で代替 |
| 2 | Cron handler のローカル検証は `wrangler dev --test-scheduled` で手動 trigger 可能だが、production cron schedule の cron-string が間違っていても CI で検出できない | Phase 5 / 9 / 11 | Phase 5 wrangler-runbook で cron-string を Decision Log として固定し、Phase 9 で `rg "crons\s*=" apps/api/wrangler.toml` で staging / production の cron-string が一致することを機械検証。実 trigger は Phase 11 staging で確認 |
| 3 | coverage-guard の `--changed` モードは変更ファイルのみを対象にするため、queue consumer / cron handler が新規追加された場合、初回実行で「変更なし」と誤判定される可能性 | Phase 9 / pre-push hook | Phase 9 で「初回追加時は明示的に `--all` モードで実行する」手順を runbook に記述。新規ファイルの初回 coverage を `outputs/phase-09/main.md` に記録 |

---

## 単体検証コマンド

```bash
# typecheck
mise exec -- pnpm --filter @ubm-hyogo/api typecheck

# lint
mise exec -- pnpm --filter @ubm-hyogo/api lint

# vitest（対象テスト 4 ファイル）
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run \
  apps/api/src/workflows/schemaAliasAssign.test.ts \
  apps/api/src/workflows/schemaAliasBackfillBatch.test.ts \
  apps/api/src/routes/admin/schema.test.ts \
  apps/api/src/repository/schemaDiffQueue.test.ts
```

| コマンド | 対象 | 期待 |
| --- | --- | --- |
| typecheck | `apps/api/**/*.ts` 全件 | エラー 0 |
| lint | `apps/api/**/*.ts` 全件（ESLint / Prettier 規約） | エラー 0 / warning 規約以下 |
| vitest workflow（alias 確定） | `schemaAliasAssign.test.ts`（二段化後の Stage 1 alias 確定 + queue/cron job enqueue / schedule） | 全 PASS |
| vitest workflow（back-fill 継続） | `schemaAliasBackfillBatch.test.ts`（remaining-scan / idempotent / duplicate enqueue 抑止 / partial failure recovery / batch boundary） | 全 PASS |
| vitest route | `schema.test.ts`（HTTP 200 confirmed / 202 running / 202 exhausted / 409 / 422 + `confirmed` / `backfill.status` 分離） | 全 PASS |
| vitest repository | `schemaDiffQueue.test.ts`（共通 helper: `BackfillStatus` 型 / remaining-scan SQL / idempotent update） | 全 PASS |

---

## 統合検証コマンド

```bash
# contract ↔ コード ↔ aiworkflow-requirements 突合
rg "backfill_cpu_budget_exhausted|backfill\.status|confirmed" apps/api/src docs .claude/skills/aiworkflow-requirements/references

# queue / cron binding ↔ wrangler.toml 突合
rg "\\[\\[queues\\.(producers|consumers)\\]\\]|\\[triggers\\]|crons\\s*=" apps/api/wrangler.toml

# 不変条件 #5 違反検出（apps/web から D1 / Queue binding 直接参照禁止）
rg "DB|D1Database|env\\.DB|env\\.SCHEMA_BACKFILL_QUEUE|env\\.SCHEMA_BACKFILL_CRON" apps/web/src

# response field 命名 ↔ workflow / route 参照突合
rg "confirmed|backfill\\.remaining|backfill\\.lastProcessedAt" apps/api/src
```

| 観点 | 期待される grep 結果 | 不一致時の判定 |
| --- | --- | --- |
| `backfill_cpu_budget_exhausted` / `backfill.status` / `confirmed` | apps/api / docs / aiworkflow-requirements の 3 箇所すべてに同一値で出現 | MAJOR（contract drift） |
| Queue / Cron binding | wrangler.toml の staging / production セクション双方に一致 | MAJOR（binding drift） |
| 不変条件 #5（apps/web から binding 参照） | 0 件 | MAJOR（不変条件違反） |
| response field 命名一致 | route / workflow / consumer すべてで同一命名 | MINOR（命名 drift） |

---

## queue consumer のローカルテスト戦略

```bash
# miniflare queue mock を用いた vitest 実行（既存）
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run \
  apps/api/src/workflows/schemaAliasBackfillBatch.test.ts

# wrangler dev で queue local mode を起動（手動検証）
mise exec -- wrangler dev --config apps/api/wrangler.toml --local --persist

# 別ターミナルから producer 経由でメッセージを enqueue
curl -X POST http://localhost:8787/admin/schema/aliases/apply -H "Content-Type: application/json" \
  -d '{"revisionId":"<rev>", "aliases":[...]}'
```

| 検証ケース | 確認内容 | 期待 |
| --- | --- | --- |
| duplicate enqueue 抑止 | 同一 `revisionId` + `batchId` を 2 度 enqueue | 2 度目は consumer 側で no-op（idempotent update により remaining 行 0 で early return） |
| partial failure recovery | consumer が中途で例外を投げる → message が retry される | 次回 consume 時に remaining-scan で残件のみ処理、duplicate write 0 |
| batch boundary | 1 batch 上限（既定 500 行）超過 | exhausted 応答後、次回 consume で remaining 残件を継続処理 |
| visibility timeout | consumer 処理が長時間かかった場合 | wrangler.toml の `visibility_timeout_ms` 設定が staging / production 一致 |

---

## cron handler のローカル検証戦略

```bash
# wrangler dev --test-scheduled で cron handler を手動 trigger
mise exec -- wrangler dev --config apps/api/wrangler.toml --local --test-scheduled

# 別ターミナルから __scheduled エンドポイントを叩く
curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

| 検証ケース | 確認内容 | 期待 |
| --- | --- | --- |
| remaining-scan idempotent | cron handler が `backfill.status='running'` 行のみ scan | 完了済み行を再処理しない |
| 複数 revision 並列対応 | 複数 revision の back-fill が同時 running | 各 revision が独立に進行、相互 block なし |
| cron schedule 妥当性 | `wrangler.toml` の `crons = ["*/5 * * * *"]` 等が staging / production 一致 | `rg "crons\s*=" apps/api/wrangler.toml` で確認 |

> **採用案分岐**: Phase 2 で Queue を採用した場合は queue consumer 戦略を主、cron は補助（dead letter / 取り残し回収）として運用。Cron を採用した場合は cron handler を主、queue は使用しない。両採用 (PARTIAL) の場合は Phase 5 wrangler-runbook で役割分担を明示。

---

## coverage しきい値とゲート

| 対象 | しきい値（line） | しきい値（branch） | しきい値（function） | 出典 |
| --- | --- | --- | --- | --- |
| `apps/api/src/workflows/schemaAliasAssign.ts` | ≥ 90% | ≥ 85% | ≥ 95% | 本 Phase 確定 |
| `apps/api/src/workflows/schemaAliasBackfillBatch.ts`（新規） | ≥ 90% | ≥ 85% | ≥ 95% | 本 Phase 確定 |
| `apps/api/src/routes/admin/schema.ts`（変更分） | ≥ 85% | ≥ 80% | ≥ 90% | 本 Phase 確定 |
| `apps/api/src/repository/schemaDiffQueue.ts`（共通 helper） | ≥ 90% | ≥ 85% | ≥ 95% | 本 Phase 確定 |
| 全 apps/api（changed-only） | `scripts/coverage-guard.sh --changed` 規定値準拠 | 同 | 同 | `scripts/coverage-guard.sh` |

```bash
# coverage 計測コマンド
mise exec -- pnpm --filter @ubm-hyogo/api test -- --coverage

# coverage-guard（pre-push と同等）
bash scripts/coverage-guard.sh --changed

# 新規ファイル初回追加時は --all モードで明示実行
bash scripts/coverage-guard.sh --all
```

> **ゲート方針**: 既存 `scripts/coverage-guard.sh` の `--changed` モードを正本とし、新規 consumer / cron handler 初回追加時のみ `--all` 明示実行で初回 baseline を取得する。

---

## AC トレーサビリティ表

| AC | 内容 | 対応成果物 | 該当セクション | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | staging 10,000+ rows fixture と既存 API（dryRun/apply/retry）の before evidence | `outputs/phase-04/test-strategy.md` + `outputs/phase-11/before-evidence.md` | fixture 作成手順 / before 実測 | Phase 11 で確定 |
| AC-2 | Queue vs Cron 採用判断が trade-off 表で根拠付き | `outputs/phase-02/queue-vs-cron-decision.md` | trade-off 表 / 採用案決定 | 仕様確定 |
| AC-3 | alias 確定と back-fill 継続の責務分離 | `outputs/phase-02/workflow-split-design.md` + `apps/api/src/workflows/schemaAliasAssign.ts` | Stage 1 / Stage 2 分離 | 仕様確定（Phase 11 で実コード PASS 確認） |
| AC-4 | API response が `confirmed` と `backfill.status` を区別 | `outputs/phase-02/api-contract-design.md` + `apps/api/src/routes/admin/schema.test.ts` | HTTP 4 ケース | 仕様確定（Phase 11 で route test PASS 確認） |
| AC-5 | remaining-scan + idempotent update で batch 処理 | `outputs/phase-02/workflow-split-design.md` + `apps/api/src/repository/schemaDiffQueue.ts` | remaining-scan SQL / idempotent update helper | 仕様確定 |
| AC-6 | Cloudflare binding が staging/production/CI/runbook で一致 | `outputs/phase-05/wrangler-runbook.md` + `apps/api/wrangler.toml` | binding 表 / CI variables | 仕様確定（Phase 11 で実機確認） |
| AC-7 | route/workflow/repository tests が duplicate/partial failure を網羅 | `outputs/phase-04/test-strategy.md` + 各 test ファイル | テストケース一覧 | 仕様確定（Phase 11 で実行 PASS 確認） |
| AC-8 | staging after evidence で CPU budget exhaustion 収束 | `outputs/phase-11/after-evidence.md` | after 実測 | Phase 11 で確定 |
| AC-9 | 不変条件 #5 違反 0 | 本 Phase（rg 検証）+ index.md | 不変条件 #5 セクション | 仕様確定（本 Phase で違反 0 確認） |
| AC-10 | 4 条件評価が全 PASS | `outputs/phase-10/go-no-go.md` | §4 条件最終判定 | Phase 10 で確定 |
| AC-11 | Phase 12 で 7 必須成果物 + aiworkflow-requirements 同期 | `outputs/phase-12/*.md` | §7 必須成果物 | Phase 12 で確定 |

---

## 不変条件遵守チェック

| 不変条件 | 本タスクでの取り扱い | 違反有無 |
| --- | --- | --- |
| #1 実フォーム schema をコードに固定しすぎない | `__extra__:<questionId>` の取り扱いは 07b 既存方針を維持 | 該当せず |
| #4 admin-managed data 分離 | alias 編集は admin operation。既存方針維持 | 該当せず |
| **#5 D1 への直接アクセスは `apps/api` に閉じる** | wrangler.toml binding / queue consumer / cron handler / repository / workflow / route すべて apps/api 配下 | **遵守** |
| #7 MVP では Form 再回答が本人更新の正式経路 | 関与せず | 該当せず |

```bash
# 違反検出コマンド
rg "DB|D1Database|env\\.DB|SCHEMA_BACKFILL_QUEUE" apps/web/src  # 期待: 0 件
```

---

## セキュリティ確認

| 観点 | 確認内容 | 判定 |
| --- | --- | --- |
| Queue message PII 混入禁止 | message field は `{ revisionId, batchId, enqueuedAt }` のみ。email / member 個人識別子を含めない | PASS（Phase 2 message schema で確定） |
| Cron handler の auth 不要性 | Cloudflare cron は internal trigger（外部 HTTP 入口を経由しない）ため、admin auth 不要 | PASS |
| Queue consumer の auth 不要性 | Cloudflare queue consumer も internal binding 経由のため、admin auth 不要 | PASS |
| route layer apply API の auth | 既存 admin auth を維持（変更なし） | PASS |
| message タンパリング耐性 | Cloudflare Queue は internal binding でのみ produce 可、外部 enqueue 不可 | PASS |
| log への PII 漏洩 | consumer / cron 内 `console.log` で member email / token を出力しない方針 | Phase 5 runbook に明記、Phase 11 で staging log 監査 |

---

## link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| index.md × phase-XX.md | `Phase 一覧` 表 × 実ファイル | 完全一致 |
| phase-XX.md 内の `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| 親タスク 07b 完了 dir | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/**` | 実在 |
| `aiworkflow-requirements` 正本 | `.claude/skills/aiworkflow-requirements/references/{api-endpoints,database-schema,task-workflow-active}.md` | 実在 |
| GitHub Issue link | Issue #361（CLOSED 維持 / `Refs #361`） | 実在（close 状態のまま参照のみ） |
| 関連 follow-up タスク参照 | UT-07B-FU-02 / FU-03,04 / 監視 | 起票済みは link、未起票は「未起票（候補）」明記 |

---

## mirror parity / a11y 判定（双方 N/A）

- **mirror parity**: 本タスクは `.claude/skills/aiworkflow-requirements/references/*` を **更新** するが、`.claude` 正本のみで `.agents` mirror への同期は本タスクスコープ外。Phase 12 ドキュメント更新時に `pnpm indexes:rebuild` で indexes 再生成を実行。
- **a11y**: 本タスクは admin API + DB + Workers binding 系で UI 追加なし（visualEvidence=NON_VISUAL）。WCAG 2.1 / a11y 観点は **対象外**。関連 a11y は UT-07B-FU-02（admin UI retry/progress）で対応。

---

## line budget 確認

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | 〜170 | 250 行以内 | PASS |
| phase-08.md | 〜260 | 250 行以内 | MINOR（要実測・分割候補は outputs に退避可） |
| phase-09.md | 〜260 | 250 行以内 | MINOR（同上） |
| phase-10.md | 〜250 | 250 行以内 | PASS or MINOR |

> 超過時は分割候補を `outputs/phase-09/main.md` に記録し、PASS と誤記しない。

---

## 実行手順

### ステップ 1: 単体検証コマンドの確定
- typecheck / lint / vitest（4 ファイル）の mise exec 込みコマンドを記述。

### ステップ 2: 統合検証コマンドの確定
- `rg` 突合 4 観点（contract / binding / 不変条件 #5 / 命名）のコマンドを記述。

### ステップ 3: queue consumer ローカルテスト戦略確定
- miniflare mock + wrangler dev queue local mode の手順を記述。

### ステップ 4: cron handler ローカル検証戦略確定
- `wrangler dev --test-scheduled` 手順を記述。

### ステップ 5: coverage しきい値確定
- 4 ファイル個別しきい値 + `coverage-guard.sh --changed` / `--all` 整合を記述。

### ステップ 6: AC トレーサビリティ表作成
- AC-1 〜 AC-11 を 11 行で表化。

### ステップ 7: 不変条件 #5 遵守チェック
- `rg apps/web/src` で 0 件を確認方針記述。

### ステップ 8: セキュリティ確認
- queue message PII 不混入 / consumer / cron auth 不要性 / message タンパリング耐性 / log PII を確認。

### ステップ 9: link / mirror / a11y 判定
- リンク切れ 0、mirror / a11y 双方 N/A 明記。

### ステップ 10: outputs/phase-09/main.md に集約

---

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | AC × 検証コマンド × 合否基準のトレーサビリティで Phase 11 evidence の質を確定 |
| 実現性 | PASS | 既存 vitest / mise exec / `coverage-guard.sh` / `rg` / `wrangler dev` のみで完結。新規ツール導入なし |
| 整合性 | PASS | 不変条件 #5 を `rg` で機械検証。親タスク 07b との regression 0 を vitest で担保 |
| 運用性 | PASS | queue consumer / cron handler のローカル検証手順、staging 実測との橋渡しが明示 |

---

## 多角的チェック観点

- **価値性**: AC × 検証コマンド × 合否基準のトレーサビリティで Phase 11 evidence の質が確定。
- **実現性**: 既存ツールチェーンで完結。
- **整合性**: 不変条件 #5 遵守を `rg` で機械検証。
- **運用性**: 性能検証は Phase 11 staging 10,000+ rows evidence に委譲し、本 Phase ではローカル検証戦略のみ確定。
- **認可境界**: admin endpoint のみ更新。consumer / cron は internal binding。
- **無料枠**: D1 storage / Queue 新規利用量は staging fixture 投入時の一時的増加のみ（投入後削除可）。
- **着手 gate 連携**: Phase 11 着手 gate が NO-GO の場合は本 Phase の検証コマンドは実行不要、PARTIAL の場合は採用範囲のみ実行。

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 単体検証コマンド確定（typecheck / lint / vitest 4 ファイル） | 9 | spec_created | 4 テストファイル網羅 |
| 2 | 統合検証コマンド確定（rg 突合 4 観点） | 9 | spec_created | contract / binding / 不変条件 #5 / 命名 |
| 3 | queue consumer ローカルテスト戦略確定 | 9 | spec_created | miniflare mock + wrangler dev |
| 4 | cron handler ローカル検証戦略確定 | 9 | spec_created | `--test-scheduled` |
| 5 | coverage しきい値とゲート確定 | 9 | spec_created | 4 ファイル個別 + coverage-guard 整合 |
| 6 | AC トレーサビリティ表作成 | 9 | spec_created | AC-1〜AC-11 全件 |
| 7 | 不変条件 #5 遵守確認 | 9 | spec_created | `rg apps/web/src` で 0 件 |
| 8 | セキュリティ確認（PII / auth / log） | 9 | spec_created | queue message PII 不混入 |
| 9 | link / mirror / a11y 判定 | 9 | spec_created | リンク切れ 0 / 双方 N/A |
| 10 | outputs/phase-09/main.md 作成 | 9 | spec_created | 全項目集約 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリー（単体 / 統合 / queue / cron / coverage / AC トレース / 不変条件 / セキュリティ / link / mirror / a11y） |
| メタ | artifacts.json | Phase 9 状態の更新 |

---

## 受入条件 / 完了条件チェックリスト

- [ ] 単体検証コマンド（typecheck / lint / vitest 4 ファイル）が mise exec 込みで記述
- [ ] 統合検証コマンド（rg 突合 4 観点）が記述
- [ ] queue consumer ローカルテスト戦略（miniflare + wrangler dev）が記述
- [ ] cron handler ローカル検証戦略（`--test-scheduled`）が記述
- [ ] coverage しきい値（4 ファイル個別 + coverage-guard 整合）が記述
- [ ] AC トレーサビリティ表に 11 AC 全件が成果物 path 付きで記述（空セル 0）
- [ ] 不変条件 #5 違反 0（`rg apps/web/src` で binding 参照 0 件方針）
- [ ] セキュリティ確認（queue message PII 不混入 / auth 不要性 / log PII）完了
- [ ] link 検証でリンク切れ 0
- [ ] mirror parity / a11y が双方 N/A / 対象外と明記
- [ ] outputs/phase-09/main.md が作成済み

---

## タスク 100% 実行確認【必須】

- 全実行タスク（10 件）が `spec_created`
- 成果物 `outputs/phase-09/main.md` 配置予定
- 9 観点（単体 × 統合 × queue × cron × coverage × AC × 不変条件 × セキュリティ × link/mirror/a11y）すべて記述
- artifacts.json の `phases[8].status` が `spec_created`

---

## 次 Phase への引き渡し

- 次 Phase: 10（最終レビューゲート）
- 引き継ぎ事項:
  - AC トレーサビリティ表（Phase 10 GO/NO-GO 根拠）
  - 単体 / 統合 / queue / cron 検証コマンド一覧（Phase 11 staging 実測の前段検証）
  - 不変条件 #5 遵守（最終判定の整合性根拠）
  - セキュリティ確認（queue message PII 不混入 / auth 不要性 / log PII）
  - 着手 gate 判定の前提（Phase 11 evidence の合否基準は Phase 4 で確定済み）
  - mirror parity / a11y 双方 N/A / 対象外
- ブロック条件:
  - AC × 成果物のトレースに空セルが残る
  - queue consumer / cron handler のローカル検証戦略が未確定
  - 不変条件 #5 違反が検出される
  - coverage しきい値が `coverage-guard.sh` と整合しない
  - link 切れ / outputs path drift が検出される
  - queue message に PII が含まれる設計が残る

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | AC トレーサビリティ + 不変条件 #5 遵守 + セキュリティ確認 を GO/NO-GO の根拠に使用 |
| Phase 11 | staging 10,000+ rows before/after evidence の前提として単体 / 統合 / queue / cron 検証コマンドを使用 |
| Phase 12 | implementation-guide.md / phase12-task-spec-compliance-check.md に QA 結果を転記 |
| 親タスク 07b 完了 | 07b 既存 test の regression 0 を本 Phase 単体検証で担保 |
| UT-07B-FU-02（関連） | response field 命名（`confirmed` / `backfill.*`）の正本を引き渡し |
