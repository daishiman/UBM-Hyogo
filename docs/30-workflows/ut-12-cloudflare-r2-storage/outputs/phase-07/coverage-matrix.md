# Phase 7 成果物: カバレッジマトリクス (coverage-matrix.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 7 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |

## 1. AC × 検証項目トレース

| AC | 内容 | 検証項目 | 担当 Phase | 証跡パス | 充足状態 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | バケット命名 (`ubm-hyogo-r2-{prod,staging}`) | 命名規約定義 / 命名衝突確認 / バケット作成 runbook | Phase 2, 4, 5 | `outputs/phase-02/r2-architecture-design.md` / `outputs/phase-04/precheck-checklist.md` (#11) / `outputs/phase-05/r2-setup-runbook.md` | PASS（spec 定義完了） |
| AC-2 | wrangler.toml `[[r2_buckets]]` バインディング | wrangler.toml 追記差分 / dry-run / DRY 化 | Phase 2, 4, 5, 8 | `outputs/phase-02/wrangler-toml-diff.md` / `outputs/phase-04/precheck-checklist.md` (#7,#8) / `outputs/phase-05/wrangler-toml-final.md` / `outputs/phase-08/dry-applied-diff.md` | PASS |
| AC-3 | API Token 最小権限 | Token 案比較 / 採用案D / Rotation 手順 / 権限不足テスト | Phase 2, 5, 6 | `outputs/phase-02/token-scope-decision.md` / `outputs/phase-05/r2-setup-runbook.md` (ステップ3) / `outputs/phase-06/anomaly-test-cases.md` (FC-02) | PASS |
| AC-4 | smoke test (PUT/GET) | smoke test 手順 / staging 実行 / 手動 smoke | Phase 5, 11 | `outputs/phase-05/smoke-test-result.md` / `outputs/phase-11/manual-smoke-log.md` | PASS（spec として手順定義 / 実機は将来再生） |
| AC-5 | CORS 設定 JSON | CORS JSON 設計 / 適用ログ / 違反時テスト | Phase 2, 5, 6 | `outputs/phase-02/cors-policy-design.md` / `outputs/phase-05/cors-config-applied.json.md` / `outputs/phase-06/anomaly-test-cases.md` (FC-01) | PASS（MINOR: 暫定 origin） |
| AC-6 | 無料枠モニタリング + UT-17 連携 | 閾値定義 / 仕様確認 / UT-17 連携 TODO | Phase 2, 6 | `outputs/phase-02/r2-architecture-design.md` (モニタリング章) / `outputs/phase-06/anomaly-test-result.md` (FC-03) | PASS（MINOR: UT-17 未着手） |
| AC-7 | バインディング名の下流公開 | binding-name-registry.md / 正本化 | Phase 5 | `outputs/phase-05/binding-name-registry.md` | PASS |
| AC-8 | パブリック/プライベート選択基準 + UT-17 連携 | アクセス方針 / Public Bucket 検討 / UT-16 申し送り | Phase 2, 5 | `outputs/phase-02/r2-architecture-design.md` (アクセス方針章) / `outputs/phase-05/r2-setup-runbook.md` (ステップ8) / `outputs/phase-05/binding-name-registry.md` | PASS |

## 2. AC × FC（異常系）対応

| AC | 関連 FC | カバー観点 |
| --- | --- | --- |
| AC-2 | FC-04 | バインディング typo 検出 |
| AC-3 | FC-02 | 権限不足 Token 検出 |
| AC-5 | FC-01 | CORS 違反 preflight |
| AC-6 | FC-03 | 無料枠超過仕様 |
| AC-7 | FC-04 | binding-name-registry 正本性 |
| 不変条件 5 | FC-05 | apps/web 混入検出 |
| 運用性 | FC-06 | ロールバック実機 |

## 3. Phase 別カバー範囲

| Phase | カバーする AC |
| --- | --- |
| Phase 1 | AC-1〜AC-8（要件定義として全 AC を Phase 紐付け） |
| Phase 2 | AC-1, AC-2, AC-3, AC-5, AC-6, AC-8（設計） |
| Phase 3 | 全 AC のレビュー判定 |
| Phase 4 | AC-1, AC-2, AC-3, AC-5（事前検証） |
| Phase 5 | AC-1〜AC-8（セットアップ実行） |
| Phase 6 | AC-2, AC-3, AC-5, AC-6, AC-7（異常系） |
| Phase 7 | 全 AC のトレース |
| Phase 8 | AC-1, AC-2, AC-5（DRY 化） |
| Phase 9 | 全 AC の品質検証 |
| Phase 10 | 全 AC の最終判定 |
| Phase 11 | AC-4（手動 smoke） |
| Phase 12 | 全 AC（ドキュメント同期） |

## 4. 充足状態サマリ

| 状態 | 件数 | AC |
| --- | --- | --- |
| PASS | 6 | AC-1, AC-2, AC-3, AC-4, AC-7, AC-8 |
| PASS（MINOR 申し送りあり） | 2 | AC-5（暫定 origin）, AC-6（UT-17 未着手） |
| MAJOR | 0 | - |
| BLOCKER | 0 | - |

## 5. 完了条件チェック

- [x] AC-1〜AC-8 の全行に検証項目・担当 Phase・証跡パス・充足状態が記載
- [x] AC × FC 対応が記録
- [x] Phase 別カバー範囲が一覧化
- [x] 充足状態サマリが TBD なし
