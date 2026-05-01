# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-section-field-canonical-schema-resolution |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 2+ |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

Phase 3 で確定した interface / static manifest first choice 方式に対し、5 観測軸 (section 重複なし / consent 誤判定なし / label 露出なし / drift 検知 / alias 失敗 fallback) × testcase のマッピングを設計する。unit test ファイルを `apps/api/src/repository/_shared/builder.test.ts` / `metadata.test.ts` に分割し、AC-3〜AC-7 を test-matrix.md で trace する。`@repo/shared` Mock provider との契約テストは int-test-skill 適用範囲外（D1 binding 依存 repository は対象外）のため省略する。

## 真の論点 (true issue)

- 5 観測軸を unit test だけでカバーできるか（NON_VISUAL タスクのため screenshot 取得は対象外）
- builder.test.ts と metadata.test.ts の責務分離（builder = wiring / metadata = resolver 単体）
- drift 検知テストで `Result.err` の伝搬と未分類 section 隔離の両方を確認する手段
- 03a 未完成下で alias queue フック呼び出しを mock する方式

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 3 確定設計 | interface / 方式 | testcase |
| 上流 | Phase 1 AC-1〜10 | 検証対象 | testcase trace |
| 下流 | Phase 5 実装ランブック | testcase 一覧 | 実装順 |
| 下流 | Phase 11 NON_VISUAL evidence | builder unit test 結果 | builder-unit-test-result.txt |

## 価値とコスト

Phase 1 引用。Phase 4 はテスト設計工数のみ。

## 4 条件評価

Phase 1 引用。Phase 4 では各 testcase が 5 観測軸を網羅しているかで再確認。

## 5 観測軸 × testcase 設計

| 観測軸 | testcase | 配置ファイル | 紐付く AC |
| --- | --- | --- | --- |
| section 重複なし | 1 field が複数 section に同時所属しない（property test 風に複数 stable_key で確認） | builder.test.ts | AC-3 |
| consent 誤判定なし | `publicConsent` / `rulesConsent` が `field_kind=consent` に解決される | metadata.test.ts | AC-4 |
| consent 誤判定なし（境界） | text や select の stable_key が consent に誤分類されない | metadata.test.ts | AC-4 |
| label 露出なし | label NULL のとき `stable_key` が露出せず resolver の `resolveLabel` 経由で canonical label が返る | metadata.test.ts | AC-5 |
| drift 検知 | canonical schema 未登録の stable_key で `Result.err({ kind: "unknownStableKey" })` が返る | metadata.test.ts | AC-6 |
| drift 検知（builder 統合） | resolver 失敗時に builder が「未分類 section」へ隔離する | builder.test.ts | AC-6 |
| alias 失敗 fallback | aliasQueueAdapter の dryRun が失敗しても resolver が `Result.err({ kind: "aliasFailed" })` で表現する | metadata.test.ts | AC-7 |
| alias 未提供 fallback | aliasQueueAdapter 未提供時は static manifest だけで解決 | metadata.test.ts | AC-7 |

## test-matrix.md 見出し定義

1. AC-3〜AC-7 × 上記 testcase のクロス表
2. 各 testcase の前提データ（fixture stable_key 一覧）
3. expected vs actual の表現方法
4. coverage 目標（変更行 90% / Phase 9 で gate）

## 実行タスク

- [ ] 5 観測軸 × testcase 表の確定
- [ ] builder.test.ts / metadata.test.ts の責務分離方針確定
- [ ] fixture stable_key（`q_section1_company_name` / `publicConsent` / `rulesConsent` / `responseEmail` 等）の決定
- [ ] drift 検知 testcase で `Result.err` 表現と未分類 section 隔離の両方を観測
- [ ] alias queue フック mock 方式（vitest mock or in-memory adapter）
- [ ] coverage 目標 90% を Phase 9 へ引き継ぎ
- [ ] integration test スコープ判定（int-test-skill 適用範囲外と確認 → 省略を明記）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/resolver-interface.md | testcase 設計の入力 |
| 必須 | outputs/phase-03/main.md | 確定設計 |
| 必須 | apps/api/src/repository/_shared/builder.ts | テスト対象 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | fixture stable_key 源泉 |
| 参考 | int-test-skill (skill リファレンス) | integration test 適用判定 |

## 実行手順

### ステップ 1: 5 観測軸 × testcase 確定

- 上記表を test-matrix.md に転記。各 testcase の expected を明記。

### ステップ 2: ファイル責務分離

- `metadata.test.ts`: resolver 単体（resolveSectionKey / resolveFieldKind / resolveLabel / drift / alias）
- `builder.test.ts`: resolver と builder の wiring（buildSections / buildFields / 未分類 section 隔離）

### ステップ 3: fixture 決定

- canonical fixture を最低 1 set 決定（6 section / 31 question を網羅する縮約版）。

### ステップ 4: integration test 判定

- int-test-skill のスコープを確認し、本 task は D1 binding 依存 repository ではなく resolver 単体テストで完結するため integration test 不要と main.md に記録。

### ステップ 5: coverage 目標

- 変更行 90% を Phase 9 で gate 化。Phase 4 では目標値だけを記録。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | testcase 順序を runbook に反映 |
| Phase 9 | coverage 90% gate |
| Phase 11 | builder-unit-test-result.txt 取得手順 |

## 多角的チェック観点

- 5 観測軸が AC-3〜AC-7 を漏れなく覆っているか
- consent / system / text / select の field_kind 分類が網羅されているか
- drift 検知が `Result.err` 表現と隔離挙動の両方で観測されるか
- 03a 未完成下での alias queue mock が実装可能か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 5 観測軸 × testcase 確定 | 4 | pending | test-matrix.md |
| 2 | ファイル責務分離 | 4 | pending | builder/metadata test |
| 3 | fixture 決定 | 4 | pending | 縮約版 schema |
| 4 | integration test 判定 | 4 | pending | 省略明記 |
| 5 | coverage 目標 | 4 | pending | 90% |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | Phase 4 主成果物 |
| ドキュメント | outputs/phase-04/test-matrix.md | AC × testcase クロス表 |
| メタ | artifacts.json | phase 4 status |

## 完了条件

- [ ] 5 観測軸 × testcase 表完了
- [ ] builder.test.ts / metadata.test.ts 責務分離確定
- [ ] fixture stable_key 決定
- [ ] AC-3〜AC-7 が test-matrix.md で trace 完了
- [ ] integration test 省略の根拠記載
- [ ] coverage 90% 目標記載

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（drift 検知 / alias 失敗 / migration 失敗）テスト網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 4 を completed

## 次 Phase

- 次: Phase 5 (実装ランブック)
- 引き継ぎ: testcase 一覧 / fixture / 責務分離 / coverage 目標
- ブロック条件: 5 観測軸 × testcase 未完なら Phase 5 不可
