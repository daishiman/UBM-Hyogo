# Phase 5: 実装 (GREEN) — task-05a-form-preview-503-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-05a-form-preview-503-001 |
| phase | 5 / 13 |
| wave | 05a-bugfix |
| mode | sequential |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

staging `/public/form-preview` を 200 化する。**コード変更ゼロが第一選択** で、staging D1 への `schema_versions` レコード投入を主作業とする。env vars の整合と structured logging の追加を補助作業とする。

## 実行タスク

1. staging D1 状態を確認する。完了条件: `schema_versions` / `schema_questions` の件数を取得し、欠落原因を特定する。
2. `schema_versions` を投入する。完了条件: staging で `getLatestVersion(formId)` が non-null を返す。
3. env vars 整合を確認する。完了条件: `apps/api/wrangler.toml` の `[env.staging.vars]` に `GOOGLE_FORM_ID` / `FORM_ID` / `GOOGLE_FORM_RESPONDER_URL` が設定済みであることを確認。
4. （補助）structured logging を追加する。完了条件: 503 に至る前に `formId` / `manifest=null` を log し、再発時の root cause 特定を 1 分以内にする。
5. Phase 4 の TC-RED 群が GREEN 化することをローカルで確認する。

## 参照資料

- `apps/api/src/use-cases/public/get-form-preview.ts`
- `apps/api/src/repository/schemaVersions.ts`
- `apps/api/wrangler.toml`
- `scripts/cf.sh`（Cloudflare CLI ラッパー、wrangler 直接呼び出し禁止）
- `docs/00-getting-started-manual/specs/01-api-schema.md`

## 実行手順

- 対象 directory: `docs/30-workflows/task-05a-form-preview-503-001/`
- 本仕様書作成では実行しない。Phase 5 実装サイクルで `bash scripts/cf.sh` 経由で操作する。
- D1 直接投入は staging 限定。production への適用は Phase 9 release runbook で別途承認。

## 統合テスト連携

- 上流: Phase 4（RED）
- 下流: Phase 6（異常系拡充）, Phase 7（カバレッジ）, Phase 9（staging smoke）

## 多角的チェック観点

- #1 schema 固定禁止（migration ではなく動的取得経路を維持）
- #5 public boundary（auth 不要のまま）
- #6 D1 直接アクセスは `apps/api` 経由のみ
- 未実測（staging 200 の curl evidence 未取得）を PASS と扱わない

## サブタスク管理

- [ ] staging D1 の現状確認（select count(*) from schema_versions / schema_questions）
- [ ] 投入 SQL を確定する（migration 追加 or 直接 INSERT）
- [ ] env vars の差分確認
- [ ] structured logging 追加可否判定
- [ ] outputs/phase-05/main.md を作成する

## 成果物

- outputs/phase-05/main.md

## 完了条件

- staging `curl -i /public/form-preview` が **200** を返す evidence が記録される
- TC-RED-01〜03 が GREEN 化する手順が記録される
- rollback 手順（投入レコードの削除 SQL）が記録される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装・deploy・commit・push・PR を本仕様書作成では行っていない
- [ ] schema 固定（コードへの formId hardcode 等）を行っていない

## 次 Phase への引き渡し

Phase 6 へ、GREEN 化後の異常系（schema_questions 空 / choiceLabelsJson 不正 JSON）の検証要件を渡す。
