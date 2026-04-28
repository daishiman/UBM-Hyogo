# Phase 8: DRY 化方針

## 1. 対象資産

| ファイル | 重複・冗長箇所 | 重要度 |
| --- | --- | --- |
| `apps/api/wrangler.toml` | `[vars]` の `SHEET_ID` / `FORM_ID` が production と staging で同値重複 | LOW |
| `apps/api/wrangler.toml` | `database_id` が wrangler.toml に直書き | LOW (機密度低) |
| `apps/api/wrangler.toml` | `[env.production]` 追加済みだがトップレベル production 設定と重複 | MEDIUM |
| `apps/web/wrangler.toml` | `pages_build_output_dir = ".next"` が OpenNext Workers 形式と非整合 | HIGH (UT-06 実行前ブロッカー) |
| ドキュメント全体 | wrangler コマンドが各 Phase outputs に散在 | LOW |

## 2. 方針

### 2.1 wrangler.toml の DRY 化方針

- **本タスク (UT-06) では構造変更しない**: 本番デプロイ実行が主目的のため、デプロイ直前の構成変更は避ける
- 改修候補は Phase 12 で `unassigned-task-detection.md` に別タスクとして記録
- 候補 (将来):
  1. `[env.production]` セクションとトップレベル設定の責務を整理し、重複を解消
  2. `[vars]` の `SHEET_ID` / `FORM_ID` を環境共通化 (両環境で同値の場合)
  3. `database_id` を CI/CD で注入する形に変更 (現状直書き)

### 2.2 ドキュメント DRY 化

- 共通 wrangler コマンドは `outputs/phase-08/deploy-runbook.md` に集約
- Phase 別 outputs は deploy-runbook.md を参照する形に整理
- 命名規則・binding マトリクスは `outputs/phase-02/env-binding-matrix.md` を一次正本とする

### 2.3 リスクと許容

| リスク | 許容方針 |
| --- | --- |
| トップレベル設定と `[env.production]` の重複 | 本番実行前に挙動一致を確認し、別タスクで整理 |
| database_id 直書き | 機密度低 (Cloudflare 内識別子)。Phase 9 で再評価 |
| `[vars]` 重複 | 同値であれば挙動に影響なし |

## 3. 改修判定基準

下記いずれかが該当する場合、別タスク化を即時実施:

1. production / staging で異なる値を持つべき変数を共通化している場合
2. 本来 Cloudflare Secrets で管理すべき値が `[vars]` に入っている場合
3. wrangler 標準動作と異なる挙動を期待している箇所がある場合

→ 現状はいずれも非該当。許容方針で進める。

## 4. 連携

- 本書は `outputs/phase-08/deploy-runbook.md` の前提となる
- Phase 12 `documentation-changelog.md` でルールアップデート (要否) を判定
