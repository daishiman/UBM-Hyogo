# UT-R2-APP-WEB-BINDING-GUARD-001: apps/web R2 direct access guard

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-R2-APP-WEB-BINDING-GUARD-001 |
| タスク名 | apps/web R2 direct access guard |
| 優先度 | MEDIUM |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 検出元タスク | UT-12 Cloudflare R2 storage |

## 目的

R2 への直接アクセスを `apps/api` に閉じ、`apps/web` に `r2_buckets` binding や `R2_BUCKET` 参照が混入しないことを自動検出する。

## スコープ

- `apps/web/wrangler.toml` に `[[r2_buckets]]` / `R2_BUCKET` が含まれないことを検証する
- `apps/web/**` から R2 direct access 用の binding / SDK 呼び出しが追加されていないことを grep または lint で確認する
- pre-commit hook または CI job のどちらに置くかを決め、既存の検証パイプラインに統合する

## 完了条件

- [ ] `apps/web` R2 混入検出コマンドが定義されている
- [ ] CI または pre-commit で自動実行される
- [ ] `apps/api` 側の R2 利用は誤検出しない
- [ ] UT-12 の `outputs/phase-12/unassigned-task-detection.md` から参照可能

## 参照

| 種別 | パス | 用途 |
| --- | --- | --- |
| 上流 | `docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-10/review-decision.md` | M-3 申し送り |
| 上流 | `docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-12/unassigned-task-detection.md` | 未タスク検出元 |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | R2 は `apps/api` に閉じる方針 |
