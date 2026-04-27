# Phase 10 成果物: 最終レビュー (final-review.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 / Cloudflare R2 ストレージ設定 |
| Phase | 10 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |

## 1. AC 完全充足判定

| AC | 内容 | 証跡パス | 判定 |
| --- | --- | --- | --- |
| AC-1 | バケット命名 (`ubm-hyogo-r2-{prod,staging}`) | `outputs/phase-05/r2-setup-runbook.md` / `outputs/phase-08/refactor-decisions.md` | PASS |
| AC-2 | wrangler.toml `[[r2_buckets]]` | `outputs/phase-02/wrangler-toml-diff.md` / `outputs/phase-05/wrangler-toml-final.md` / `outputs/phase-08/dry-applied-diff.md` | PASS |
| AC-3 | API Token 最小権限（採用案D） | `outputs/phase-02/token-scope-decision.md` / `outputs/phase-05/r2-setup-runbook.md` | PASS |
| AC-4 | smoke test (PUT/GET) | `outputs/phase-05/smoke-test-result.md` / `outputs/phase-11/manual-smoke-log.md`（既存） | PASS |
| AC-5 | CORS 設定 JSON | `outputs/phase-02/cors-policy-design.md` / `outputs/phase-08/dry-applied-diff.md` | PASS（MINOR: 暫定 origin） |
| AC-6 | 無料枠モニタリング + UT-17 連携 | `outputs/phase-02/r2-architecture-design.md` (モニタリング章) | PASS（MINOR: UT-17 未着手） |
| AC-7 | バインディング名の下流公開 | `outputs/phase-05/binding-name-registry.md` | PASS |
| AC-8 | パブリック/プライベート + UT-16 連携 | `outputs/phase-02/r2-architecture-design.md` (アクセス方針章) / `outputs/phase-05/binding-name-registry.md` | PASS |

## 2. 4条件最終評価

| 条件 | 評価観点 | 根拠 Phase | 判定 |
| --- | --- | --- | --- |
| 価値性 | 将来のファイルアップロード実装が「設計待ち」で止まらない | Phase 1, 2, 3, 5 | PASS |
| 実現性 | 無料枠（10GB / Class A 1,000万 / Class B 1億）内で運用可能 | Phase 2, 3, 9 | PASS |
| 整合性 | 01b 命名・04 secret 経路・UT-16 / UT-17 と矛盾しない | Phase 7, 8, 9 | PASS |
| 運用性 | Token rotation / CORS 再設定 / バケット rollback が runbook に存在 | Phase 5, 6, 9 | PASS（MINOR: UT-17 通知未実装で月次手動） |

## 3. 指摘区分テーブル

| 指摘 ID | 内容 | 区分 | 対応 Phase | 未タスク化 |
| --- | --- | --- | --- | --- |
| M-1 | AllowedOrigins 暫定値（UT-16 完了後に差し替え要） | MINOR | Phase 12 implementation-guide | する（UT-16 タスク内で対応） |
| M-2 | UT-17 未着手で通知経路が未確定（月次手動運用） | MINOR | Phase 12 unassigned-task-detection.md | する（UT-17 タスク化済 / 連携待ち） |
| M-3 | Pre-commit hook（apps/web R2 混入検出）が未整備 | MINOR | Phase 12 unassigned-task-detection.md | する |
| M-4 | 実機 smoke / FC は将来タスクで再生（spec_created 境界） | MINOR | future-file-upload-implementation Phase 5/6/11 再生 | する |

> MINOR 4 件、MAJOR 0 件、BLOCKER 0 件。

## 4. 代替案再検討記録

| 代替案 | Phase 3 採否 | Phase 10 再評価 |
| --- | --- | --- |
| A: 環境別 2 バケット | 採用 | 維持 PASS |
| B: 1 バケット + prefix | 不採用 | 維持（環境分離の重要性に変化なし） |
| C: Token 既存拡張 | 不採用 | 維持（最小権限原則） |
| D: Token 専用作成 | 採用 | 維持 PASS |
| E: Public Bucket 全公開 | 不採用 | 維持（プライバシー観点） |
| F: プライベート + Presigned URL | 採用 | 維持 PASS |
| G: Cloudflare Analytics 直視（暫定） | 暫定採用 | UT-17 着手まで継続 |

## 5. 機密情報最終確認

- 全成果物で実 Account ID / 実 API Token / 実本番ドメインの直書きなし
- プレースホルダ統一: `<env-specific-origin>` / `<staging-origin>` / `<production-origin>`
- 1Password / Cloudflare Secrets / GitHub Secrets 経由の参照のみ

## 6. 不変条件確認

| 不変条件 | 維持状況 |
| --- | --- |
| 5: D1/R2 直接アクセスは apps/api のみ | PASS（apps/web/wrangler.toml 非変更） |
| 6: GAS prototype を本番仕様に昇格させない | PASS（GAS 由来コード非参照） |
| シークレット直書き禁止 | PASS |

## 7. 残存課題と委譲先

| 課題 | 委譲先 | 期限目安 |
| --- | --- | --- |
| 実バケット作成 / Token 発行 / CORS 適用 / smoke 実機 | future-file-upload-implementation | 実装着手時 |
| AllowedOrigins 実値差し替え | UT-16 タスク | UT-16 完了時 |
| 無料枠通知自動化 | UT-17 タスク | UT-17 完了時 |
| Pre-commit hook | unassigned-task-detection.md 経由で別タスク化 | 別タスク起票後 |

## 8. 完了条件チェック

- [x] AC-1〜AC-8 の判定が全 PASS
- [x] BLOCKER / MAJOR なし
- [x] MINOR 4 件の未タスク化方針が記載
- [x] 4条件全 PASS（運用性のみ MINOR 含む条件付き PASS）
- [x] 機密情報直書きなし
- [x] 不変条件 5 / 6 維持
