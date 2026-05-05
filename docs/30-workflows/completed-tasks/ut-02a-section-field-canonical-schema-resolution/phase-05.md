# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-section-field-canonical-schema-resolution |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 2+ |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

Phase 4 までで確定した interface / 方式 / testcase に基づき、metadata.ts 新設 → generated static manifest baseline 生成 → builder.ts への resolver 引数追加 → 旧推測 fallback 削除 → テスト → migration（hybrid 採用時のみ）の Step 順を runbook.md に記録する。Cloudflare CLI は `bash scripts/cf.sh` ラッパー必須（wrangler 直接実行禁止）、D1 migration は `bash scripts/cf.sh d1 migrations apply` 経由とする。secret hygiene として `.env` 実値・API token を evidence に残さない原則を再確認する。

## 真の論点 (true issue)

- Step 順序に「fallback 削除」を後段に置くか前段に置くか（後段が安全：テスト pass を確認してから削除）
- migration 採否は Phase 3 で static manifest first choice 確定済み → Phase 5 では migration なしを既定とし、migration-plan.md は「hybrid 切替時の dry-run / rollback 手順」を将来用に記録
- shared zod / enum 拡張のタイミング（Phase 5 の先頭か末尾か）→ 先頭で固定し、builder 改修時に compile が壊れないようにする

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 4 testcase 一覧 | testcase / fixture | 実装順 |
| 上流 | Phase 3 確定方式 (static manifest) | 方式 | runbook 内容 |
| 連携 | `scripts/cf.sh` | Cloudflare CLI ラッパー | migration / D1 操作経路 |
| 連携 | 1Password (`.env` op 参照) | secret hygiene | evidence 記録ルール |
| 下流 | Phase 6 異常系 | 実装結果 | failure case 入力 |

## 価値とコスト

Phase 1 引用。Phase 5 は実装ランブック作成工数（コード実装は Phase 5 実行時、本 Phase 仕様書はランブック設計のみ）。

## 4 条件評価

Phase 1 引用。Step 順序が壊れた状態で test pass しない場合は手戻り。

## 実装 Step 順序（runbook.md 見出し定義）

| Step | 内容 | 検証 |
| --- | --- | --- |
| (a) | `packages/shared` の `field_kind` enum / zod に必要値（`consent` / `system` 等）を追加 | `mise exec -- pnpm typecheck` |
| (b) | `apps/api/src/repository/_shared/metadata.ts` を新設し、`MetadataResolver` interface と `Result<T, E>` 型を定義 | typecheck |
| (c) | static manifest を `metadata.ts` 内に embed し、`StaticManifestResolver` を既定実装として export | metadata.test.ts pass |
| (d) | `metadata.test.ts` を Phase 4 testcase に従って実装 | test pass |
| (e) | `builder.ts` の `buildSections()` / `buildFields()` に `resolver: MetadataResolver` 引数を追加（既存 fallback と並走） | typecheck + 既存 builder.test.ts pass |
| (f) | builder.test.ts を Phase 4 testcase で拡張 | test pass |
| (g) | builder.ts から旧推測 fallback 分岐（label 流用 / kind 推測 / broad section assignment）を削除 | `stable_key` 参照は resolver 入力として許可し、旧推測分岐が 0 件 |
| (h) | builder 呼び出し側 (public / member / admin repository) に resolver を注入 | typecheck + 周辺 test pass |
| (i) | `mise exec -- pnpm lint` / typecheck / unit test の最終確認 | 全 pass |
| (j) | (hybrid 採用時のみ) `apps/api/migrations/` に `response_fields.section_key` / `field_kind` 追加 migration を作成 | `bash scripts/cf.sh d1 migrations list` で確認 |
| (k) | (hybrid 採用時のみ) `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` の dry-run 手順を migration-plan.md に記載 | dry-run 結果記録 |

> Phase 3 で static manifest first choice 確定のため、Step (j)(k) は本タスクの実装スコープでは **実行しない**。migration-plan.md は将来 hybrid 切替時の参照ドキュメントとして残す。

## migration-plan.md 見出し定義

1. 適用条件（hybrid 方式へ切替時のみ）
2. 対象 D1 schema 変更（`response_fields.section_key` TEXT NULL / `response_fields.field_kind` TEXT NULL）
3. dry-run 手順（`bash scripts/cf.sh d1 migrations list` → `apply --env staging` で先行検証）
4. rollback 手順（migration ファイルの reverse SQL 同梱）
5. データ backfill 計画（03a の schema sync が初回実行時に書き込む前提）
6. secret hygiene（API token は op run 経由のみ・実値は記録しない）

## Cloudflare CLI 実行ルール（再掲・必須）

```bash
# 認証確認
bash scripts/cf.sh whoami

# D1 migration 一覧
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production

# D1 migration 適用（hybrid 採用時のみ）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

`wrangler` を直接呼ぶことは禁止。`scripts/cf.sh` が op run 経由で `CLOUDFLARE_API_TOKEN` を 1Password から動的注入し、esbuild バージョン整合と Node 24 を保証する。

## secret hygiene（必須）

- `.env` 実値・API token・OAuth token を evidence (Phase 11) に絶対残さない
- `.env` の中身を `cat` / `Read` / `grep` で表示しない（op 参照のみだが慣性事故防止）
- evidence に貼る log は token 部分を `***` でマスクする
- `wrangler login` を使わず op 参照に一本化

## 実行タスク

- [ ] Step (a)〜(i) の順序を runbook.md に確定
- [ ] (j)(k) は将来用として migration-plan.md に記載（本タスクでは未実行）
- [ ] Cloudflare CLI ラッパー使用ルール再掲
- [ ] secret hygiene チェック項目を main.md に列挙
- [ ] 各 Step の検証コマンド（`mise exec --` 経由）を記載
- [ ] 周辺 repository (public / member / admin) への resolver 注入手順
- [ ] 失敗時の rollback（git revert / D1 migration reverse）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/resolver-interface.md | 実装対象 interface |
| 必須 | outputs/phase-04/test-matrix.md | testcase 一覧 |
| 必須 | scripts/cf.sh | Cloudflare CLI ラッパー |
| 必須 | CLAUDE.md §シークレット管理 | secret hygiene ルール |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 migration 制約 |

## 実行手順

### ステップ 1: Step 順序の runbook.md 化

- 上記 Step (a)〜(i) を runbook.md に列挙し、各 Step に検証コマンドと期待出力を記載。

### ステップ 2: migration-plan.md の将来用記述

- hybrid 切替時の dry-run / rollback / backfill 手順を migration-plan.md に保存。

### ステップ 3: Cloudflare CLI ルール / secret hygiene の main.md 集約

- `scripts/cf.sh` 使用例と禁止事項を main.md に集約。

### ステップ 4: rollback 手順

- builder.ts の fallback 削除後に問題発生した場合の git revert 手順、および (hybrid 採用時の) migration reverse SQL 適用手順を main.md に記載。

### ステップ 5: 周辺 repository 注入箇所の特定

- 本 Phase では実装は行わないが、注入対象ファイル一覧（public / member / admin repository）を main.md に列挙し、Step (h) の作業範囲を明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 異常系（resolve 失敗 / alias 失敗 / migration 失敗）の追試 |
| Phase 9 | typecheck / lint / unit test / coverage gate |
| Phase 11 | builder-unit-test-result.txt / drift-detection-log.md 取得 |

## 多角的チェック観点

- Step 順序が「test pass → fallback 削除」の順になっているか
- shared zod / enum 拡張が他タスク breaking change にならないか
- Cloudflare CLI 直接実行（wrangler）が runbook に紛れ込んでいないか
- secret hygiene が evidence 取得手順に統合されているか
- Phase 1 不変条件 #1 / #2 / #3 / #5 が Step ごとにどう守られるか記録されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Step 順序確定 | 5 | pending | runbook.md |
| 2 | migration-plan.md 将来用記述 | 5 | pending | hybrid 切替時用 |
| 3 | Cloudflare CLI ルール集約 | 5 | pending | main.md |
| 4 | secret hygiene チェック | 5 | pending | main.md |
| 5 | rollback 手順 | 5 | pending | main.md |
| 6 | 周辺 repository 注入箇所列挙 | 5 | pending | main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | Phase 5 主成果物（Step 順 / Cloudflare CLI / secret hygiene / rollback） |
| ドキュメント | outputs/phase-05/runbook.md | 実装 Step (a)〜(i) 詳細 |
| ドキュメント | outputs/phase-05/migration-plan.md | hybrid 切替時の D1 migration dry-run / rollback 手順 |
| メタ | artifacts.json | phase 5 status |

## 完了条件

- [ ] Step (a)〜(i) 順序確定
- [ ] migration-plan.md に hybrid 切替時手順記載
- [ ] Cloudflare CLI ラッパー使用ルール再掲
- [ ] secret hygiene チェック項目記載
- [ ] rollback 手順記載
- [ ] 周辺 repository 注入箇所列挙

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（test fail / migration 失敗 / secret 漏洩）対応記述
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 5 を completed

## 次 Phase

- 次: Phase 6 (異常系検証)
- 引き継ぎ: 確定 Step 順 / migration-plan.md / rollback 手順
- ブロック条件: Step 順 or rollback 手順未完なら Phase 6 不可
