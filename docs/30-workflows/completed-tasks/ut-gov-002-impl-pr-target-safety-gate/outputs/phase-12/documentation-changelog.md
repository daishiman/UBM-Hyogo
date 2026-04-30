# ドキュメント変更履歴

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 12 |
| 対象期間 | 2026-04-30 〜（spec_created 完成時点） |

## 凡例

- `A` = Added（新規追加）
- `M` = Modified（変更）
- `D` = Deleted（削除）

## 1. タスク仕様書 Markdown（13 Phase + index）

| 種別 | パス | 概要 |
| --- | --- | --- |
| A | `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/index.md` | タスク全体 index・AC・依存関係 |
| A | `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/artifacts.json` | Phase status / metadata 正本 |
| A | `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/phase-01.md` | Phase 1 要件定義 仕様書 |
| A | `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/phase-02.md` | Phase 2 設計 仕様書 |
| A | `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/phase-03.md` | Phase 3 設計レビュー 仕様書 |
| A | `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/phase-04.md` | Phase 4 テスト設計 仕様書 |
| A | `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/phase-05.md` | Phase 5 実装ランブック 仕様書 |
| A | `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/phase-06.md` | Phase 6 テスト拡充 仕様書 |
| A | `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/phase-07.md` | Phase 7 カバレッジ確認 仕様書 |
| A | `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/phase-08.md` | Phase 8 リファクタリング 仕様書 |
| A | `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/phase-09.md` | Phase 9 品質保証 仕様書 |
| A | `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/phase-10.md` | Phase 10 最終レビュー 仕様書 |
| A | `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/phase-11.md` | Phase 11 手動テスト 仕様書 |
| A | `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/phase-12.md` | Phase 12 ドキュメント更新 仕様書 |
| A | `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/phase-13.md` | Phase 13 完了確認 仕様書 |

## 2. Phase outputs（各 Phase の成果物）

| 種別 | パス | 概要 |
| --- | --- | --- |
| A | `outputs/phase-1/main.md` | 要件定義サマリ |
| A | `outputs/phase-2/main.md` | 設計サマリ |
| A | `outputs/phase-2/design.md` | 責務分離設計 |
| A | `outputs/phase-3/main.md` | 設計レビューサマリ |
| A | `outputs/phase-3/review.md` | "pwn request" 非該当 5 箇条 |
| A | `outputs/phase-4/main.md` | テスト設計サマリ |
| A | `outputs/phase-4/test-matrix.md` | T-1〜T-5 dry-run マトリクス |
| A | `outputs/phase-5/main.md` | 実装ランブックサマリ |
| A | `outputs/phase-5/runbook.md` | actionlint / yq / gh 実走手順 |
| A | `outputs/phase-5/static-check-log.md` | 静的検査ログ |
| A | `outputs/phase-6/main.md` | テスト拡充サマリ |
| A | `outputs/phase-6/failure-cases.md` | 失敗ケース集 |
| A | `outputs/phase-7/main.md` | カバレッジサマリ |
| A | `outputs/phase-7/coverage.md` | カバレッジ確認 |
| A | `outputs/phase-8/main.md` | リファクタリングサマリ |
| A | `outputs/phase-8/before-after.md` | リファクタ前後比較 |
| A | `outputs/phase-9/main.md` | 品質保証サマリ |
| A | `outputs/phase-9/quality-gate.md` | 品質ゲート |
| A | `outputs/phase-10/main.md` | 最終レビューサマリ |
| A | `outputs/phase-10/go-no-go.md` | go/no-go 判定 |
| A | `outputs/phase-11/main.md` | 手動テスト Phase メイン（本ドキュメント Phase 11 セット） |
| A | `outputs/phase-11/manual-smoke-log.md` | T-1〜T-5 smoke ログテンプレ（PENDING） |
| A | `outputs/phase-11/screenshots/README.md` | スクリーンショット取得計画と命名規約 |
| A | `outputs/phase-12/main.md` | Phase 12 サマリ |
| A | `outputs/phase-12/implementation-guide.md` | 実装ガイド（Part 1 / Part 2） |
| A | `outputs/phase-12/system-spec-update-summary.md` | システム仕様書更新サマリ |
| A | `outputs/phase-12/documentation-changelog.md` | 本ファイル |
| A | `outputs/phase-12/unassigned-task-detection.md` | 未割当タスク検出 |
| A | `outputs/phase-12/skill-feedback-report.md` | skill フィードバック |
| A | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 1〜11 準拠チェック |
| A | `outputs/verification-report.md` | 検証レポート（既存） |

## 3. 実 workflow ファイル（GitHub Actions）

| 種別 | パス | 概要 |
| --- | --- | --- |
| A | `.github/workflows/pr-target-safety-gate.yml` | `pull_request_target` triage 専用 workflow（PR head checkout なし、label / コメント操作のみ、`persist-credentials: false` 強制） |
| A | `.github/workflows/pr-build-test.yml` | `pull_request` build / test workflow（`permissions: { contents: read }` のみ、untrusted context） |

## 4. 時系列

```
2026-04-30
├─ 仕様書骨格（index.md / artifacts.json / phase-01〜13.md）作成
├─ Phase 1〜3 outputs 作成（要件・設計・設計レビュー）
├─ Phase 4〜5 outputs 作成（テストマトリクス・ランブック・実 workflow yml）
├─ Phase 6〜10 outputs 作成（失敗ケース・カバレッジ・リファクタ・品質保証・最終レビュー）
└─ Phase 11〜12 outputs 作成（手動テストテンプレ・ドキュメント更新）

Phase 13 以降（ユーザー承認後、本タスクの commit / push / PR は本サマリ時点で未実施）
└─ commit / push / PR / smoke 実走 / VISUAL evidence 撮影
```

## 5. 削除・破棄

なし（spec_created 段階のため、削除なし）。

## 参照

- `index.md`
- `artifacts.json`
- `outputs/verification-report.md`
