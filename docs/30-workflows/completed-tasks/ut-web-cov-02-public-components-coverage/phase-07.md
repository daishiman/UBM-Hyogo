# Phase 7: AC マトリクス — ut-web-cov-02-public-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-02-public-components-coverage |
| phase | 7 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

`index.md` の AC を行、対象 7 component を列にした PASS/FAIL マトリクスと evidence path 対応表を確定する。

## CONST_005 必須項目

### 変更対象ファイル一覧

本 Phase は仕様書のみ。実装ファイルは Phase 5/6 で作成する 7 テストファイル + Phase 8 で作成する test-utils が evidence source となる。

### 主要な関数・型のシグネチャ

なし (集計 phase)。

### 入力・出力・副作用

- 入力: Phase 5/6 で作成した test の green/red 結果、`apps/web/coverage/coverage-summary.json`。
- 出力: 本 Phase の AC マトリクス。
- 副作用: なし。

### テスト方針

- 集計のみ。新規 test は追加しない。
- PARTIAL → PASS への昇格条件を明記。

### ローカル実行・検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
cat apps/web/coverage/coverage-summary.json | jq '.["apps/web/src/components/public/Hero.tsx"]'
cat apps/web/coverage/coverage-summary.json | jq '.["apps/web/src/components/feedback/EmptyState.tsx"]'
```

### DoD

- 全セルが PASS で埋まっていること。
- 各 evidence path が `apps/web/coverage/coverage-summary.json` の存在キーと一致していること。

## AC × Component マトリクス (PASS/FAIL)

| AC \ Component | Hero | MemberCard | ProfileHero | StatCard | Timeline | FormPreviewSections | EmptyState |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1: Stmts ≥85% | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-1: Lines ≥85% | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-1: Funcs ≥85% | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-1: Branches ≥80% | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-2: happy ケース 1 件以上 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-2: empty/null ケース 1 件以上 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-2: interaction/variant ケース 1 件以上 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-3: snapshot 不使用 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-4: regression なし (既存 test PASS) | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

> Phase 11 evidence で全対象 100% coverage / 40 files 288 tests PASS を確認済み。

## evidence path 対応表

| Component | テストファイル | coverage-summary.json key | Phase 11 evidence |
| --- | --- | --- | --- |
| Hero | apps/web/src/components/public/__tests__/Hero.test.tsx | apps/web/src/components/public/Hero.tsx | outputs/phase-11/evidence/coverage-summary.json |
| MemberCard | apps/web/src/components/public/__tests__/MemberCard.test.tsx | apps/web/src/components/public/MemberCard.tsx | outputs/phase-11/evidence/coverage-summary.json |
| ProfileHero | apps/web/src/components/public/__tests__/ProfileHero.test.tsx | apps/web/src/components/public/ProfileHero.tsx | outputs/phase-11/evidence/coverage-summary.json |
| StatCard | apps/web/src/components/public/__tests__/StatCard.test.tsx | apps/web/src/components/public/StatCard.tsx | outputs/phase-11/evidence/coverage-summary.json |
| Timeline | apps/web/src/components/public/__tests__/Timeline.test.tsx | apps/web/src/components/public/Timeline.tsx | outputs/phase-11/evidence/coverage-summary.json |
| FormPreviewSections | apps/web/src/components/public/__tests__/FormPreviewSections.test.tsx | apps/web/src/components/public/FormPreviewSections.tsx | outputs/phase-11/evidence/coverage-summary.json |
| EmptyState | apps/web/src/components/feedback/__tests__/EmptyState.test.tsx | apps/web/src/components/feedback/EmptyState.tsx | outputs/phase-11/evidence/coverage-summary.json |

## PARTIAL → PASS 昇格条件

- coverage-summary.json の該当 key の `statements.pct / lines.pct / functions.pct` が 85 以上、`branches.pct` が 80 以上。
- 当該 component の test suite が `0 failed`。
- regression: `mise exec -- pnpm --filter @ubm-hyogo/web test` 全体で `0 failed`。

## 計測コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
mise exec -- pnpm -r test:coverage   # ワークスペース横断 (regression 確認)
bash scripts/coverage-guard.sh --changed   # 変更スコープ guard
```

## 参照資料

- index.md の AC セクション
- Phase 4 / 5 / 6
- `apps/web/coverage/coverage-summary.json` (既存 baseline)

## 統合テスト連携

- 上流: 04a-parallel-public-directory-api-endpoints
- 下流: 09a-A-staging-deploy-smoke-execution

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- 未実装/未実測を PASS と扱わない (PENDING で残す)。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [x] refs を確認する
- [x] AC と evidence path を対応付ける
- [x] outputs/phase-07/main.md を作成する

## 成果物

- outputs/phase-07/main.md

## 完了条件

- マトリクスが全 component × 全 AC で埋まる構造になっている。
- evidence path が Phase 11 の出力先と一致している。
- 計測コマンドが index.md の AC を再現できる。

## タスク100%実行確認

- [x] この Phase の必須セクションがすべて埋まっている
- [x] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [x] deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 8 へ、共通 helper / fixture の抽出設計を引き渡す。
