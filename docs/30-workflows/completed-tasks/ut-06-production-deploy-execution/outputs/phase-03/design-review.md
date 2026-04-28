# Phase 3: 設計レビュー結果

## 1. レビュー対象

- `outputs/phase-02/deploy-design.md`
- `outputs/phase-02/rollback-runbook.md`
- `outputs/phase-02/env-binding-matrix.md`

## 2. レビュー観点と結果

| 観点 | 確認内容 | 結果 | コメント |
| --- | --- | --- | --- |
| AC 網羅 | AC-1〜AC-8 が全て Phase 5/6/11 に責務割当済 | PASS | Phase 1 マッピングと整合 |
| 不可逆操作の前置き | D1 バックアップ (AC-7) が migrations apply の前に組み込まれている | PASS | deploy-design.md §2 Step 1 → Step 2 |
| ロールバック手順 | Workers / D1 / 部分失敗シナリオ別に手順整備 | PASS | rollback-runbook.md §1〜§4 |
| binding 整合性 | 本番 D1 binding `DB` が apps/api のみに閉じる | PASS | env-binding-matrix.md §1 (CLAUDE.md 不変条件 5) |
| シークレット | ランタイムは Cloudflare Secrets / CI/CD は GitHub Secrets が明示 | PASS | env-binding-matrix.md §1 |
| 形式整合 | apps/web Pages 形式 vs OpenNext Workers 形式 | MINOR | 本タスクでは現状を尊重・別タスク化を明示 |
| 環境変数 | production / staging の境界が wrangler.toml と整合 | PASS | env-binding-matrix.md §2 §3 |
| 命名規則 | kebab-case / `ubm-hyogo-{purpose}-{env}` パターン | PASS | env-binding-matrix.md §1 |
| 中断・再開 | 各ステップの失敗ハンドリングが明示 | PASS | deploy-design.md §5 |

## 3. 4 条件再評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | Wave 1 infra first deploy 完了が後続 UT-08 / UT-09 / 02-application-implementation 解放のクリティカルパス |
| 実現性 | PASS | package/lockfile の wrangler version / mise 固定環境で再現性あり |
| 整合性 | MINOR (条件付き PASS) | OpenNext Workers 形式整合は別タスク化で合意必要。本タスク GO 判定の条件として明示 |
| 運用性 | PASS | バックアップ → 適用 → デプロイ → smoke → ロールバックのフローが整備済 |

## 4. 指摘事項と対応

| # | 指摘 | 重要度 | 対応 |
| --- | --- | --- | --- |
| 1 | apps/web `pages_build_output_dir = ".next"` が OpenNext Workers 形式と非整合 | MINOR | 別タスクへ切り出し。本タスク Phase 12 unassigned-task-detection.md に記録 |
| 2 | `[env.production]` セクション不在 (apps/api) | MINOR | Phase 8 DRY 化で明示化を検討 |
| 3 | database_id が wrangler.toml に直書き | LOW | Phase 8 / Phase 9 で扱い方針確定 |
| 4 | 初回適用失敗時の DROP SQL が未準備 | MEDIUM | Phase 4 preflight で `restore-empty.sql` 雛形を準備する旨を明記 |
| 5 | staging リハーサル未実施 | MEDIUM | docs-only モードのため未実施。実行時に Phase 6 で実施必須 |

## 5. GO/NO-GO 判定 (Phase 3 暫定)

- **判定:** 条件付き GO
- **条件:**
  1. apps/web 形式整合の課題が Phase 12 で別タスク化として記録される
  2. Phase 4 preflight で `restore-empty.sql` 雛形が準備される
  3. 実行時には staging リハーサルを Phase 6 として完了する
  4. Phase 4 production-approval.md で運用責任者・レビュアー・delivery 担当の承認が得られる

## 6. 次フェーズ引き継ぎ

- 本書の指摘 #4 (DROP SQL 雛形) を Phase 4 preflight-checklist.md に項目化
- 本書の指摘 #1 を Phase 12 unassigned-task-detection.md に項目化
- 本書の指摘 #2 #3 を Phase 8 dry-config-policy.md に項目化
- 全 PASS / MINOR 状態を Phase 4 verify-suite-result.md の前提として参照
