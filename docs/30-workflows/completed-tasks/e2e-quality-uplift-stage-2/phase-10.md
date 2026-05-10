# Phase 10: 最終レビュー

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-09 |
| 対象 | sub-task 2a / 2b / 2c / 2d 統合 |

---

## 1. 受け入れ基準（index.md §受け入れ基準）の最終確認

| # | 基準 | 状態 |
|---|------|------|
| 1 | 4 ファイル追加で `pnpm test:e2e` green | Phase 5 §5 / Phase 9 §1 |
| 2 | 各 route に成功系 + 失敗系 1 つ以上 | Phase 4 §3 / Phase 6 §4 |
| 3 | admin-only 認可境界が member / anonymous の 2 ロール分岐 | Phase 6 §1 |
| 4 | `page.route()` mock で D1 直接アクセスなし | Phase 9 §3 |
| 5 | contract test が 7 endpoint shape 網羅 | Phase 4 §3.4 |
| 6 | critical smoke 100% / line cov >= 70% | Phase 7 §3 / §4 |

---

## 2. 4-condition gate（Phase 3）再確認

| # | 条件 | 状態 |
|---|------|------|
| C1 | 単一責務（CONST_007） | OK |
| C2 | 不変条件遵守 | OK（Phase 9 §3 で grep gate 確認） |
| C3 | 受け入れ基準が観測可能 | OK |
| C4 | 依存（Stage 1）明示 | OK |

---

## 3. レビュー観点（5 軸）

| 軸 | 確認項目 | 状態 |
|----|---------|------|
| 設計 | spec 構造が既存 admin-pages.spec.ts と一貫 | OK |
| テスト | mock counter / race / 認可の決定論性 | OK |
| 品質 | flaky 防止策（Phase 9 §2） | OK |
| 文書 | Phase 1-13 一貫 / open question 全解消 | OK |
| リスク | Stage 3 持越し 3 件が phase-12 未タスクへ | OK |

---

## 4. 開いている課題

| # | 内容 | 受け先 |
|---|------|-------|
| 1 | cascade preview API 実装 → 2c-2 有効化 | Stage 3 |
| 2 | line cov 70% 未達時の追加 unit test | Stage 3 |
| 3 | `DeleteBodyZ` を `packages/shared` 移管（任意） | Stage 3 |

> 上記 3 件は **本 Stage 内では blocker ではない**（spec 範囲外 or 後続 Stage の責務）。

---

## 5. Phase 10 完了判定

> **GO — Stage 2 spec 一式完成**

- 受け入れ基準 6 件すべて満たす設計
- 4-condition gate 維持
- Open question 6 件全解消
- 残課題は Stage 3 へ確実に申し送り

---

## 6. 次 Phase

| Phase | 内容 |
|-------|------|
| 11 | 手動テスト（3 層評価 + screenshot canonical 名管理） |
| 12 | ドキュメント更新（Task 1〜5 全完了 / implementation guide Part 1/2） |
| 13 | PR 作成（base = `dev`） |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-2
- phase: 10
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 2 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

