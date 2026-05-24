# [#98] [UT-R2-APP-WEB-BINDING-GUARD-001] apps/web R2 direct access guard

## メタ情報

```yaml
issue_number: 98
title: [UT-R2-APP-WEB-BINDING-GUARD-001] apps/web R2 direct access guard
state: OPEN
priority: 中
scale: -
category: 改善
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/98
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 目的

R2 への直接アクセスを `apps/api` に閉じ、`apps/web` に `r2_buckets` binding や `R2_BUCKET` 参照が混入しないことを自動検出する。

## スコープ

- `apps/web/wrangler.toml` に `[[r2_buckets]]` / `R2_BUCKET` が含まれないことを検証
- `apps/web/**` から R2 direct access 用の binding / SDK 呼び出しが追加されていないことを grep または lint で確認
- pre-commit hook または CI job のどちらに置くかを決め、既存の検証パイプラインに統合

## 完了条件

- [ ] `apps/web` R2 混入検出コマンドが定義されている
- [ ] CI または pre-commit で自動実行される
- [ ] `apps/api` 側の R2 利用は誤検出しない
- [ ] UT-12 の `outputs/phase-12/unassigned-task-detection.md` から参照可能

## 参照

- 上流: `docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-10/review-decision.md` (M-3 申し送り)
- 上流: `docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-12/unassigned-task-detection.md` (未タスク検出元)
- 正本仕様: `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` (R2 は `apps/api` に閉じる方針)
