# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Schema alias apply hardening / 大規模 back-fill 再開可能化 (UT-07B) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-05-01 |
| 前 Phase | 8（DRY 化 / 仕様間整合） |
| 次 Phase | 10（最終レビューゲート） |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| タスク分類 | implementation（QA: 単体検証 / 統合検証 / 性能検証 / coverage / link） |

## 目的

implementation / NON_VISUAL タスクとしての品質保証を行う。本タスクは migration / repository / workflow / route / test の実コード更新を伴うため、契約文書としての網羅性に加えて **(1) 単体検証コマンド（typecheck / lint / vitest）の合否、(2) 統合検証コマンド（migration ↔ repository contract の `rg` 突合）の合否、(3) 性能検証（10,000+ 行 fixture の staging 実測の合否基準）、(4) coverage しきい値とゲート、(5) AC トレーサビリティ、(6) 不変条件 #5 遵守、(7) link 検証** の 7 観点で QA する。

Phase 11 の大規模実測 evidence で最終確認するが、Phase 9 では Phase 4 検証戦略 / Phase 7 AC マトリクス / Phase 8 DRY 化結果を照合し、CI / staging で実行する具体的なコマンドと合否基準を確定する。ここで合否基準を曖昧にすると Phase 11 evidence がブレ、Phase 10 GO/NO-GO 判定で「PASS と言い切れない」状態が発生する。

---

## 実行タスク

1. **単体検証コマンドの確定**: typecheck / lint / vitest の対象ファイルとコマンドを確定する（完了条件: `pnpm --filter @ubm-hyogo/api typecheck` / `lint` / `test` の 3 コマンドが mise exec ラッパー込みで記述、テスト対象 4 ファイル以上の網羅）。
2. **統合検証コマンドの確定**: migration ↔ repository contract の `rg` 突合コマンドを確定する（完了条件: `schema_questions` partial UNIQUE / `schema_diff_queue` カラム追加 / `__extra__:<questionId>` 命名 / `deleted_members` JOIN の 4 観点で突合 SQL/コマンドを記述）。
3. **性能検証の合否基準確定**: 10,000 / 50,000 / 100,000 行 fixture の staging D1 / Workers 実測の合否基準を確定する（完了条件: batch 数 / CPU 時間 / retry 回数 / `backfill.status` 推移の 4 軸で PASS / MINOR / MAJOR 閾値が表化）。
4. **coverage しきい値とゲートの確定**: vitest coverage の line / branch / function 各しきい値と、coverage-guard との関係を確定する（完了条件: 既存 `scripts/coverage-guard.sh` の `--changed` モード閾値と整合した形で記述）。
5. **AC トレーサビリティ表作成**: AC-1 〜 AC-10 が成果物 path × 該当セクションでトレース可能か確認する（完了条件: 10 AC × 成果物 × 該当セクションの 3 列表が完成、空セル 0）。
6. **苦戦箇所 3 件の AC 紐付け**: 起票.md §苦戦箇所 / Phase 1 苦戦箇所の 3 件すべてが AC または対策表に対応していることを確認する（完了条件: 3 件すべてに対応 AC 番号 or リスク対策表行が紐づく）。
7. **不変条件 #5 遵守チェック**: migration / repository / workflow / route すべてが apps/api 内に閉じていることを確認する（完了条件: `apps/web` から D1 binding 直接参照する経路が 0、`packages/shared` への配置は本タスクスコープ外で確定）。
8. **link 検証**: `outputs/phase-XX/*.md` / `index.md` / `artifacts.json` / 親タスク 07b dir / `aiworkflow-requirements/references/*` / GitHub Issue #293 のリンク切れ 0 を確認する（完了条件: 全リンク辿り でリンク切れ 0）。
9. **mirror parity / a11y 判定**: implementation / NON_VISUAL のため screenshot / WCAG は対象外であることを明記する（完了条件: 双方 N/A / 対象外と明記）。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-04.md | 検証戦略（test-strategy.md） |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-07.md | AC マトリクス |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-08.md | DRY 化済み単一正本 path |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/index.md | AC / 不変条件 / 主要参照 |
| 必須 | docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md | 起票仕様（苦戦箇所 3 件） |
| 必須 | apps/api/migrations/*.sql | 既存物理スキーマ + 新規 migration（partial UNIQUE / cursor カラム） |
| 必須 | apps/api/src/repository/schemaQuestions.ts | repository contract（pre-check + 二段防御） |
| 必須 | apps/api/src/workflows/schemaAliasAssign.ts | workflow（Stage 1 / Stage 2 分離） |
| 必須 | apps/api/src/routes/admin/schema.ts | route（202 retryable 応答） |
| 必須 | scripts/coverage-guard.sh | coverage しきい値の正本 |
| 参考 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/phase-09.md | QA 観点の参照事例 |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-09.md | QA 観点の参照事例 |

---

## 単体検証コマンド

```bash
# typecheck
mise exec -- pnpm --filter @ubm-hyogo/api typecheck

# lint
mise exec -- pnpm --filter @ubm-hyogo/api lint

# vitest（対象テスト）
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run \
  src/workflows/schemaAliasAssign.test.ts \
  src/repository/schemaQuestions.test.ts \
  src/services/aliasRecommendation.test.ts \
  src/routes/admin/schema.test.ts
```

| コマンド | 対象 | 期待 |
| --- | --- | --- |
| typecheck | `apps/api/**/*.ts` 全件 | エラー 0 |
| lint | `apps/api/**/*.ts` 全件（ESLint / Prettier 規約） | エラー 0 / warning 規約以下 |
| vitest workflow | `schemaAliasAssign.test.ts`（Stage 1 / Stage 2 分離・cursor 進行・idempotent） | 全 PASS |
| vitest repository | `schemaQuestions.test.ts`（pre-check + DB UNIQUE 二段防御） | 全 PASS |
| vitest service | `aliasRecommendation.test.ts`（既存テストへの regression 0） | 全 PASS |
| vitest route | `schema.test.ts`（HTTP 200 / 202 in_progress / 202 exhausted / 409 / 422 の 5 ケース） | 全 PASS |

---

## 統合検証コマンド

```bash
# migration ↔ repository contract 突合
rg "CREATE.*UNIQUE.*INDEX|schema_questions|stable_key" apps/api/migrations apps/api/src/repository

# schema_diff_queue カラム追加 ↔ workflow 参照突合
rg "backfill_cursor|backfill_status|schema_diff_queue" apps/api/migrations apps/api/src/workflows

# __extra__:<questionId> 命名 ↔ workflow / route 参照突合
rg "__extra__|extraPrefix" apps/api/src/workflows apps/api/src/routes

# deleted_members JOIN ↔ workflow 参照突合
rg "deleted_members" apps/api/src/workflows apps/api/migrations

# 不変条件 #5 違反検出（apps/web から D1 binding 直接参照禁止）
rg "DB|D1Database|env\.DB" apps/web/src
```

| 観点 | 期待される grep 結果 | 不一致時の判定 |
| --- | --- | --- |
| partial UNIQUE index | migration 1 件・repository contract のコメントで参照 | MAJOR（DB 制約欠落） |
| `schema_diff_queue.backfill_cursor / backfill_status` | migration 1 件・workflow 参照あり | MAJOR（再開可能 back-fill 不成立） |
| `__extra__:<questionId>` | workflow / route で参照あり、命名規約と一致 | MINOR（命名 drift） |
| `deleted_members` JOIN | workflow back-fill SQL で JOIN 使用 | MINOR（soft-delete 漏れ） |
| 不変条件 #5（apps/web から D1 binding） | 0 件 | MAJOR（不変条件違反） |

---

## 性能検証の合否基準（staging D1 / Workers 実測）

> **fixture**: `response_fields` 10,000 / 50,000 / 100,000 行（`__extra__:Q###` 分布、`deleted_members` JOIN を 5% 含む）。Phase 2 large-scale-measurement-plan.md で確定した手順で投入。

### 計測軸 × 合否閾値

| 計測軸 | 10,000 行（PASS） | 50,000 行（PASS） | 100,000 行（PASS） | MINOR | MAJOR |
| --- | --- | --- | --- | --- | --- |
| dryRun 応答時間 | < 5s | < 10s | < 20s | 20-30s | > 30s or timeout |
| apply 1 回応答時間 | < 5s | < 10s | < 20s | 20-30s | > 30s or timeout |
| retry 回数（`backfill.status='completed'` までの apply 回数） | 1 回 | 1-2 回 | 1-3 回 | 4-5 回 | > 5 回 or `failed` 多発 |
| 1 batch あたり UPDATE 行数 | 500 行 / batch（既定） | 同 | 同 | batch サイズ自動縮小発生 | 0 行で停止（cursor 不進行） |
| Workers CPU time（1 apply あたり） | < 30s（CPU 上限） | < 30s | < 30s（exhausted で 202 復帰可） | 30s 超過頻発 | 30s で異常終了（502 等） |
| `backfill.status` 推移 | `pending` → `in_progress` → `completed` | 同 | `exhausted` 経由可 | `failed` 1 回以上発生 | `failed` 連続 |

### 分岐判断（queue / cron 分離 follow-up 起票）

| 実測結果 | 判断 | アクション |
| --- | --- | --- |
| 100,000 行で 3 retry 以下に収束 | PASS | 本タスク内 cursor 方式で完結 |
| 100,000 行で 4-5 retry | MINOR | 本タスク内完結だが Phase 12 で「閾値モニタリング」を運用観測タスクへ申し送り |
| 100,000 行で > 5 retry / `failed` 多発 | MAJOR | 本タスクで queue / cron 分離を **実装するのではなく follow-up 起票**（Phase 10 ゲートで判定） |

---

## coverage しきい値とゲート

| 対象 | しきい値（line） | しきい値（branch） | しきい値（function） | 出典 |
| --- | --- | --- | --- | --- |
| `apps/api/src/workflows/schemaAliasAssign.ts` | ≥ 90% | ≥ 85% | ≥ 95% | 本 Phase 確定 |
| `apps/api/src/repository/schemaQuestions.ts` | ≥ 90% | ≥ 85% | ≥ 95% | 本 Phase 確定 |
| `apps/api/src/routes/admin/schema.ts`（変更分） | ≥ 85% | ≥ 80% | ≥ 90% | 本 Phase 確定 |
| 全 apps/api（changed-only） | `scripts/coverage-guard.sh --changed` 規定値準拠 | 同 | 同 | `scripts/coverage-guard.sh` |

```bash
# coverage 計測コマンド
mise exec -- pnpm --filter @ubm-hyogo/api test -- --coverage

# coverage-guard（pre-push と同等）
bash scripts/coverage-guard.sh --changed
```

> **ゲート方針**: 既存 `scripts/coverage-guard.sh` の `--changed` モードを正本とし、本 Phase ではしきい値を引き上げない（pre-push hook の挙動と整合）。本タスク独自に上記 3 ファイルの個別しきい値を Phase 11 evidence で記録する。

---

## AC トレーサビリティ表

| AC | 内容 | 対応成果物 | 該当セクション | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | `schema_questions(revision_id, stable_key)` の同一 revision collision が DB constraint + repository pre-check の二段防御で保証 | `outputs/phase-02/db-constraint-design.md` + `apps/api/migrations/00NN_schema_questions_partial_unique.sql` + `apps/api/src/repository/schemaQuestions.ts` | partial UNIQUE index DDL / pre-check ロジック | 仕様確定（Phase 11 で実コード PASS 確認） |
| AC-2 | 既存データ衝突検出 SQL と rollback 手順が Phase 5 runbook、UT-04 / 本 migration の適用順序が明示 | `outputs/phase-05/migration-runbook.md` / `outputs/phase-05/rollback-runbook.md` | 衝突検出 SQL / rollback / UT-04 順序関係 | 仕様確定 |
| AC-3 | alias 確定と back-fill 継続の状態が分離、CPU budget 超過後の再実行で残件のみ処理（idempotent） | `outputs/phase-02/resumable-backfill-design.md` + `apps/api/src/workflows/schemaAliasAssign.ts` | Stage 1 / Stage 2 分離 / cursor 進行 / idempotent 証明 | 仕様確定（Phase 11 で実測 PASS 確認） |
| AC-4 | `backfill_cpu_budget_exhausted` retryable failure が API contract、route test で境界が固定 | `outputs/phase-02/retryable-contract-design.md` + `outputs/phase-05/api-contract-update.md` + `apps/api/src/routes/admin/schema.test.ts` | HTTP 5 ケース / failure code | 仕様確定（Phase 11 で route test PASS 確認） |
| AC-5 | 10,000 行以上の `response_fields` fixture を staging D1 / Workers 実環境で実測、batch 数 / CPU 時間 / retry 回数が evidence | `outputs/phase-02/large-scale-measurement-plan.md` + `outputs/phase-11/manual-evidence.md` | 計測表テンプレート / 実測結果 | Phase 11 で確定予定 |
| AC-6 | 実 DB schema（`response_fields` カラム不在）と仕様書差分の吸収方針が明示 | Phase 1 main.md + `outputs/phase-05/migration-runbook.md` | 「07b 正本を継続採用」記述 | 仕様確定 |
| AC-7 | unit / route / workflow tests が collision / retryable failure / idempotent retry / CPU budget 超過を網羅 | `outputs/phase-04/test-strategy.md` + 各 test ファイル | テストケース一覧 | 仕様確定（Phase 11 で実行 PASS 確認） |
| AC-8 | 不変条件 #5（D1 直接アクセス apps/api 限定）違反 0 | 本 Phase（rg 検証） + index.md `不変条件への影響` | 不変条件 #5 セクション | 仕様確定（本 Phase で違反 0 確認） |
| AC-9 | 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き | `outputs/phase-10/go-no-go.md` | §4 条件最終判定 | Phase 10 で確定予定 |
| AC-10 | Phase 12 で 7 必須成果物確認 | `outputs/phase-12/*.md` | §7 必須成果物 | Phase 12 で確定予定 |

---

## 苦戦箇所 3 件の AC 紐付け

| # | 苦戦箇所（起票.md / Phase 1 より） | 対応 AC | 対応リスク対策 |
| --- | --- | --- | --- |
| 1 | `response_fields` に `questionId` / `is_deleted` カラム不在 | AC-6 | 「07b 正本（`__extra__:<questionId>` 命名 + `deleted_members` JOIN）を継続採用」を Phase 1 / Phase 5 で明示 |
| 2 | revision-scoped stableKey collision に対する DB UNIQUE index 未実装 | AC-1, AC-2 | partial UNIQUE index + 既存衝突検出 SQL + rollback の 2 段階 migration を Phase 2 / Phase 5 で確定 |
| 3 | 10,000 行以上の Workers CPU budget 実測未完 | AC-3, AC-5 | cursor 管理 + 202 retryable で再実行可、staging D1 / Workers で実測 evidence を Phase 11 で記録 |

> 苦戦箇所 3 件すべてが AC で吸収済み。漏れなし。

---

## 不変条件遵守チェック

| 不変条件 | 本タスクでの取り扱い | 違反有無 |
| --- | --- | --- |
| #1 実フォーム schema をコードに固定しすぎない | `__extra__:<questionId>` の取り扱いは 07b 既存方針を維持。新規ハードコードなし | 該当せず |
| #2 consent キー統一 | sync 系のため非該当 | 該当せず |
| #3 `responseEmail` system field | 非該当 | 該当せず |
| #4 admin-managed data 分離 | alias / stableKey 編集は admin operation。既存方針維持 | 該当せず（既存方針維持） |
| **#5 D1 への直接アクセスは `apps/api` に閉じる** | migration / repository / workflow / route すべて apps/api 配下。`apps/web` から D1 binding 直接参照する経路を発生させない。Phase 8 で shared 配置は follow-up 確定 | **遵守** |
| #6 GAS prototype 非昇格 | 関与せず | 該当せず |
| #7 MVP では Form 再回答が本人更新の正式経路 | 関与せず | 該当せず |

```bash
# 違反検出コマンド
rg "DB|D1Database|env\.DB" apps/web/src  # 期待: 0 件
```

---

## line budget 確認

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | 〜130 | 250 行以内 | PASS |
| phase-01.md | 〜200 | 250 行以内 | PASS |
| phase-02.md | 〜250 | 250 行以内 | PASS or MINOR（要実測） |
| phase-03.md | 〜200 | 250 行以内 | PASS |
| phase-08.md | 〜250 | 250 行以内 | PASS or MINOR（要実測） |
| phase-09.md | 〜250 | 250 行以内 | PASS or MINOR（要実測） |
| phase-10.md | 〜250 | 250 行以内 | PASS or MINOR（要実測） |
| phase-11.md | 大規模実測手順込み | 250 行以内 | MINOR 候補（outputs に詳細退避可） |
| phase-12.md | 7 必須成果物計画 | Phase 12 例外あり | PASS_WITH_EXCEPTION |
| phase-13.md | 〜80 | 250 行以内 | PASS（縮約） |

> 超過時は分割候補を `outputs/phase-09/main.md` に記録し、PASS と誤記しない。

---

## link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| index.md × phase-XX.md | `Phase 一覧` 表 × 実ファイル | 完全一致 |
| phase-XX.md 内の `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| 起票 unassigned-task 参照 | `docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md` | 実在 |
| 親タスク 07b 完了 dir | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/**` | 実在 |
| 関連タスク参照 | UT-04 / 監視 follow-up / admin UI polling follow-up | UT-04 は実在、follow-up は「未起票（候補）」明記 |
| `aiworkflow-requirements` 正本 | `.claude/skills/aiworkflow-requirements/references/{api-endpoints,database-schema,task-workflow-active}.md` | 実在 |
| GitHub Issue link | Issue #293（CLOSED 維持） | 実在（close 状態のまま参照のみ） |

---

## mirror parity / a11y 判定（双方 N/A）

- **mirror parity**: 本タスクは `.claude/skills/aiworkflow-requirements/references/*` を **更新** するが、`.claude` 正本のみで `.agents` mirror への同期は本タスクスコープ外（`aiworkflow-requirements` skill が自動同期）。Phase 12 ドキュメント更新時に `pnpm indexes:rebuild` で indexes 再生成を実行する点のみ確認。
- **a11y**: 本タスクは admin API + DB 系で UI 追加なし（visualEvidence=NON_VISUAL）。WCAG 2.1 / a11y 観点は **対象外**。関連 a11y は本 contract を参照する admin UI 改修タスク（202 / retryable polling 対応）で行う。

---

## 実行手順

### ステップ 1: 単体検証コマンドの確定
- typecheck / lint / vitest（4 ファイル）の mise exec 込みコマンドを記述。
- 期待結果（全 PASS）を明記。

### ステップ 2: 統合検証コマンドの確定
- `rg` 突合 5 観点（partial UNIQUE / cursor カラム / `__extra__:` / `deleted_members` / 不変条件 #5）のコマンドを記述。

### ステップ 3: 性能検証の合否基準確定
- 10,000 / 50,000 / 100,000 行 × dryRun / apply / retry / CPU / `backfill.status` の合否表を作成。
- queue / cron 分離 follow-up 起票条件を明示。

### ステップ 4: coverage しきい値とゲート確定
- 3 ファイル個別しきい値 + `coverage-guard.sh --changed` 整合を記述。

### ステップ 5: AC トレーサビリティ表作成
- AC-1 〜 AC-10 を 10 行で表化。

### ステップ 6: 苦戦箇所 3 件の AC 紐付け
- 3 件すべてを AC または対策表に紐付け。

### ステップ 7: 不変条件 #5 遵守チェック
- `rg "DB|D1Database|env\.DB" apps/web/src` で 0 件を確認。

### ステップ 8: line budget / link / mirror / a11y
- 4 項目を順次確認、N/A / 対象外を明記。

### ステップ 9: outputs/phase-09/main.md に集約

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | AC トレーサビリティ + 性能検証合否基準 + 不変条件 #5 遵守 を GO/NO-GO の根拠に使用 |
| Phase 11 | 大規模実測 evidence の前提として性能合否基準 + 単体 / 統合検証コマンドを使用 |
| Phase 12 | implementation-guide.md / phase12-task-spec-compliance-check.md に QA 結果を転記 |
| 親タスク 07b 完了 | 07b 既存 test の regression 0 を本 Phase 単体検証で担保 |
| UT-04（関連） | partial UNIQUE migration 順序関係を Phase 5 runbook 経由で UT-04 に引き渡し |

---

## 多角的チェック観点

- **価値性**: AC × 検証コマンド × 合否基準のトレーサビリティで Phase 11 evidence の質が確定。
- **実現性**: 既存 vitest / mise exec / `coverage-guard.sh` / `rg` のみで完結。新規ツール導入なし。
- **整合性**: 不変条件 #5 遵守を `rg` で機械検証。親タスク 07b との regression 0 を vitest で担保。
- **運用性**: 性能検証の合否基準により Phase 11 / 12 で「PASS と言い切れる」状態を確保。queue / cron 分離 follow-up 起票条件が明示。
- **認可境界**: admin endpoint のみ更新。public route への影響なし。
- **無料枠**: D1 storage 増分は `schema_diff_queue` カラム 2 つ（TEXT NULL）のみ、reads / writes は 10,000+ 行 fixture 投入時の一時的増加のみ（投入後削除可）。

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 単体検証コマンド確定（typecheck / lint / vitest） | 9 | spec_created | 4 テストファイル網羅 |
| 2 | 統合検証コマンド確定（rg 突合 5 観点） | 9 | spec_created | partial UNIQUE / cursor / `__extra__:` / `deleted_members` / 不変条件 #5 |
| 3 | 性能検証合否基準確定 | 9 | spec_created | 10K / 50K / 100K 行 × 6 軸 |
| 4 | coverage しきい値とゲート確定 | 9 | spec_created | 3 ファイル個別 + coverage-guard 整合 |
| 5 | AC トレーサビリティ表作成 | 9 | spec_created | AC-1〜AC-10 全件 |
| 6 | 苦戦箇所 3 件の AC 紐付け | 9 | spec_created | 全件対応 |
| 7 | 不変条件 #5 遵守確認 | 9 | spec_created | `rg apps/web/src` で 0 件 |
| 8 | line budget / link 検証 | 9 | spec_created | リンク切れ 0 / 超過は分割候補記録 |
| 9 | mirror parity / a11y 判定 | 9 | spec_created | 双方 N/A / 対象外 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリー（単体 / 統合 / 性能 / coverage / AC トレース / 不変条件 / link / mirror / a11y） |
| メタ | artifacts.json | Phase 9 状態の更新 |

---

## 完了条件

- [ ] 単体検証コマンド（typecheck / lint / vitest 4 ファイル）が mise exec 込みで記述
- [ ] 統合検証コマンド（rg 突合 5 観点）が記述
- [ ] 性能検証の合否基準（10K / 50K / 100K × 6 軸）が PASS / MINOR / MAJOR 閾値で表化
- [ ] coverage しきい値（3 ファイル個別 + coverage-guard 整合）が記述
- [ ] AC トレーサビリティ表に 10 AC 全件が成果物 path 付きで記述（空セル 0）
- [ ] 苦戦箇所 3 件すべてが AC または対策表に紐付き
- [ ] 不変条件 #5 違反 0（`rg apps/web/src` で D1 binding 参照 0 件）
- [ ] line budget は実測値で記録、超過ファイルは分割候補を明示
- [ ] link 検証でリンク切れ 0
- [ ] mirror parity / a11y が双方 N/A / 対象外と明記
- [ ] outputs/phase-09/main.md が作成済み

---

## タスク 100% 実行確認【必須】

- 全実行タスク（9 件）が `spec_created`
- 成果物 `outputs/phase-09/main.md` 配置予定
- 9 観点（単体 × 統合 × 性能 × coverage × AC × 苦戦箇所 × 不変条件 × link × mirror/a11y）すべて記述
- artifacts.json の `phases[8].status` が `spec_created`

---

## 次 Phase への引き渡し

- 次 Phase: 10（最終レビューゲート）
- 引き継ぎ事項:
  - AC トレーサビリティ表（Phase 10 GO/NO-GO 根拠）
  - 性能検証合否基準（Phase 11 実測 evidence の判定基準）
  - 不変条件 #5 遵守（最終判定の整合性根拠）
  - queue / cron 分離 follow-up 起票条件（100,000 行で > 5 retry / `failed` 多発時に MAJOR 判定）
  - mirror parity / a11y 双方 N/A / 対象外
- ブロック条件:
  - AC × 成果物のトレースに空セルが残る
  - 性能検証の合否閾値が曖昧（PASS / MINOR / MAJOR の境界が決まっていない）
  - 不変条件 #5 違反が検出される
  - coverage しきい値が `coverage-guard.sh` と整合しない
  - link 切れ / outputs path drift が検出される
