# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-shared-types-and-ui-primitives-foundation |
| Wave | 0 |
| 実行種別 | serial |
| Phase 番号 | 7 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 6 (異常系検証) |
| 下流 Phase | 8 (DRY 化) |
| 状態 | completed |

## 目的

Phase 1 の AC-1〜AC-9、Phase 4 の verify suite、Phase 5 の runbook step、Phase 6 の failure case を一対一対応させ、未トレースの AC や test を可視化する。

## 実行タスク

1. AC × test × runbook step × failure case の 4 軸マトリクス作成
2. 未トレース項目を blocker としてリストアップ
3. 不変条件 #1/#5/#6/#8 が AC のいずれかに紐付いているか確認
4. outputs/phase-07/main.md 作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md AC 節 | AC-1〜AC-9 |
| 必須 | outputs/phase-04/test-matrix.md | test 項目 |
| 必須 | outputs/phase-05/runbook.md | step 一覧 |
| 必須 | outputs/phase-06/main.md | failure case |

## 実行手順

### ステップ 1: 4 軸マトリクス作成
### ステップ 2: 未トレース確認
### ステップ 3: 不変条件マッピング
### ステップ 4: outputs/phase-07/main.md 作成

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化の対象（重複 test / 重複 step）特定 |
| Phase 10 | GO/NO-GO で AC 全 PASS 確認 |
| Phase 12 | implementation-guide.md にマトリクスを転記 |

## 多角的チェック観点（不変条件参照）

- **#1**: AC-9 で型 4 層 export を保証
- **#5**: AC-3 で ESLint rule 動作を保証
- **#6**: AC-5 の primitive smoke で `localStorage` 呼び出しゼロを担保
- **#8**: AC-5 で Avatar hue 決定論性を smoke test

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 4 軸マトリクス | 7 | completed | 9 AC × N test |
| 2 | 未トレース確認 | 7 | completed | blocker 一覧 |
| 3 | 不変条件マッピング | 7 | completed | #1/#5/#6/#8 |
| 4 | outputs 作成 | 7 | completed | outputs/phase-07/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | AC マトリクス |
| メタ | artifacts.json | Phase 7 を completed |

## 完了条件

- [ ] AC-1〜AC-9 全てが test / runbook / failure case のいずれかに紐付き
- [ ] 未トレースの AC が 0 件（または blocker として記録）
- [ ] 不変条件 #1/#5/#6/#8 が AC に組み込まれている

## タスク 100% 実行確認【必須】

- [ ] 全 4 サブタスク completed
- [ ] outputs/phase-07/main.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 8（DRY 化）
- 引き継ぎ事項: 重複 test / 重複 runbook step → DRY 化対象
- ブロック条件: AC マトリクスに未トレース AC が残っている

## AC マトリクス

| AC | 内容 | Phase 4 test | Phase 5 step | Phase 6 failure case | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | `pnpm install` 成功 | scaffold-smoke | Step 1 | #8 (pnpm version) | - |
| AC-2 | `pnpm -w typecheck` exit 0 | typecheck × 4 package | Step 2,3,4,5,6 | #1,#2,#7 | #1 |
| AC-3 | `pnpm -w lint` exit 0 + RuleTester | lint + RuleTester | Step 6 | #3,#4 | #5 |
| AC-4 | `pnpm -w test` exit 0 | unit × tones / ids / primitives | Step 6 | #6,#7,#12,#13 | - |
| AC-5 | UI primitives 15 種 export | barrel export smoke | Step 5 | #11 | #6,#8 |
| AC-6 | tones.ts 2 関数 export | tones.test.ts | Step 5 | #6 | - |
| AC-7 | next.config.js が @opennextjs/cloudflare 対応 | scaffold-smoke | Step 5 | #10 | - |
| AC-8 | `GET /healthz` 200 `{"ok":true}` | scaffold-smoke (curl) | Step 4 | #9 | - |
| AC-9 | shared から MemberId/ResponseId/ResponseEmail/StableKey export | typecheck shared | Step 2 | #1 | #1 |

## 不変条件 ↔ AC マッピング

| 不変条件 | 該当 AC | 担保方法 |
| --- | --- | --- |
| #1 schema 固定回避 | AC-2, AC-9 | 型 4 層 placeholder + branded type |
| #5 apps/web → D1 禁止 | AC-3 | ESLint custom rule + RuleTester |
| #6 GAS prototype 非昇格 | AC-5 | primitive 内 localStorage 不使用 |
| #8 localStorage 非正本 | AC-5 | Avatar hue 決定論的算出 |

## 未トレース blocker

なし（全 AC が test + runbook + failure case に紐付き済み）。
