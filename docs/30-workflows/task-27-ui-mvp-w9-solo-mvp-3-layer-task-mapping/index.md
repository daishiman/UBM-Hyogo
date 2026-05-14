# task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping

> ワークフロー: `task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping`
> Wave: W9 solo（`task-23` 完了が前提・直列実行）
> 担当: 単一実装者（solo dev）
> implementation_mode: `verify_existing`（task-01〜22 完了済み + task-23/24/25 検証結果を mapping）
> task classification: docs-only task（成果物は単一 markdown matrix）
> visual classification: NON_VISUAL（UI/UX 変更なし）

---

## 概要

MVP recovery の戦略目標である「**公開 / 会員 / 管理 / 共通 の 4 層**」と全 22 タスク（task-01〜22）の対応関係を可視化する mapping matrix を作成し、business goal（19 routes）と実装 task の整合性を保証する。

戦略レベル（3 層）から実装タスクへの**逆引き正本**を提供することで、「全タスク完了 ≠ 19 routes 動作」のギャップ検出と、層単位での品質状況集約を可能にする。

### 対応 routes 群

| 層 | route 数 | routes |
|----|---------|--------|
| 公開層 | 6 | `/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms` |
| 会員層 | 2 | `/login`, `/profile` |
| 管理層 | 8 | `/(admin)/admin`, `/(admin)/admin/{members,tags,meetings,schema,requests,identity-conflicts,audit}` |
| 共通層 | 3 | `error.tsx`, `not-found.tsx`, `loading.tsx` |

### 関与度 4 分類（matrix セル値）

| 値 | 意味 |
|----|------|
| 必須 | 当該層の routes 動作に必須のタスク（不在時に層全体が機能不全） |
| 強関与 | 当該層の品質・UX を強く左右するタスク（不在時に層の主機能が劣化） |
| 軽関与 | 当該層に部分的・補助的に影響するタスク |
| 無関係 | 当該層に直接の影響を持たないタスク |

---

## Phase 一覧

| Phase | 名称 | ステータス |
|-------|------|------------|
| 1 | 要件定義 | spec_created |
| 2 | 設計 | spec_created |
| 3 | 設計レビュー | spec_created |
| 4 | テスト作成（検証スクリプト設計） | spec_created |
| 5 | 実装（mapping matrix 生成） | spec_created |
| 6 | テスト拡充 | spec_created |
| 7 | カバレッジ確認 | spec_created |
| 8 | リファクタリング | spec_created |
| 9 | 品質保証 | spec_created |
| 10 | 最終レビュー | spec_created |
| 11 | 手動テスト（NON_VISUAL） | spec_created |
| 12 | ドキュメント更新 | spec_created |
| 13 | PR 作成 | blocked（ユーザー承認待ち） |

---

## 不変条件

1. mapping は **double-entry matrix**（タスク → 層）+（層 → タスク）の両方向で記載する
2. 各層について「必須 / 強関与 / 軽関与 / 無関係」の **4 分類**でラベリングする
3. task-23 の `VERIFICATION-STATUS.md` で WARN / FAIL になったタスクが**どの層に影響するか**を明示する
4. 既存実装の書き換えはしない（**read-only mapping**）
5. 出力 markdown は GFM table、**22 task × 4 layer = 88 セルすべて**を埋める（空欄禁止）
6. 成果物 `MVP-3LAYER-TASK-MAPPING.md` の配置先は `docs/30-workflows/ui-prototype-alignment-mvp-recovery/MVP-3LAYER-TASK-MAPPING.md`（本ワークフロー外）
7. 本ワークフロー（task-27）の root には Phase 仕様書のみを置く

---

## 依存関係

| 種別 | タスク | 状態 |
|------|--------|------|
| upstream（必須） | task-23（VERIFICATION-STATUS matrix） | 完了必須 |
| upstream（推奨） | task-24（invariant audit） | 完了が望ましい |
| upstream（推奨） | task-25（smoke coverage matrix） | 完了が望ましい |
| reference | task-01〜task-22（全 22 実装タスク） | 完了済み |
| downstream | なし（戦略整合性確認の最終 gate） | — |

---

## 主要成果物

| パス | 役割 |
|------|------|
| `outputs/phase-1/requirements.md` | スコープ・対象 22 タスク一覧・4 層定義・4 分類ルール |
| `outputs/phase-2/design.md` | matrix の双方向構造 / セル評価アルゴリズム / WARN/FAIL 集約方法 |
| `outputs/phase-3/design-review.md` | Phase 2 設計のゲート判定 |
| `outputs/phase-4/test-plan.md` | 88 セル埋め忘れ・双方向一致・WARN/FAIL 集約整合チェック |
| `outputs/phase-5/implementation-notes.md` | mapping 生成手順と各セル分類根拠ログ |
| `outputs/phase-6/test-additions.md` | 「未分類」セル 0 件保証 / 双方向 cross-check |
| `outputs/phase-7/coverage.md` | 88 セル + 双方向 matrix の埋まり率 100% 証跡 |
| `outputs/phase-8/refactor.md` | matrix 表現最適化（脚注 / 層別集約セクション） |
| `outputs/phase-9/qa.md` | line budget / GFM 構文 / 参照リンク健全性 |
| `outputs/phase-10/final-review.md` | acceptance criteria 判定 |
| `outputs/phase-11/manual-test-result.md` | NON_VISUAL 宣言 + 自動代替証跡 |
| `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル）+ Part 2（技術者向け） |
| `outputs/phase-12/system-spec-update-summary.md` | 仕様同期サマリー |
| `outputs/phase-12/documentation-changelog.md` | Step 1-A/1-B/1-C/Step 2 の判定記録 |
| `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（0 件でも出力必須） |
| `outputs/phase-12/skill-feedback-report.md` | skill 改善点記録（改善なしでも出力必須） |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 root evidence |
| `MVP-3LAYER-TASK-MAPPING.md`（外部配置） | **本タスク最終成果物**（88 セル double-entry matrix） |

---

## Phase 仕様書

- [phase-1-requirements.md](./phase-1-requirements.md)
- [phase-2-design.md](./phase-2-design.md)
- [phase-3-design-review.md](./phase-3-design-review.md)
- [phase-4-test-plan.md](./phase-4-test-plan.md)
- [phase-5-implementation.md](./phase-5-implementation.md)
- [phase-6-test-additions.md](./phase-6-test-additions.md)
- [phase-7-coverage.md](./phase-7-coverage.md)
- [phase-8-refactor.md](./phase-8-refactor.md)
- [phase-9-qa.md](./phase-9-qa.md)
- [phase-10-final-review.md](./phase-10-final-review.md)
- [phase-11-manual-test.md](./phase-11-manual-test.md)
- [phase-12-documentation.md](./phase-12-documentation.md)
- [phase-13-pr.md](./phase-13-pr.md)
