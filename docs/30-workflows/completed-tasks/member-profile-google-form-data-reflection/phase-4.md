# Phase 4: テスト作成（TDD RED）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 4 / 13 |
| TASK_ID | `TASK-MEMBER-FORM-DATA-REFLECTION-001` |
| 前提 | Phase 1（要件定義）・Phase 2（設計）・Phase 3（gate=PASS）完了 |
| 主担当 | Lane A / Lane B |
| テスト方針 | TDD RED — 実装前に失敗するテストを書く。Lane A/B の各 AC に対し 1:1 で RED test を割り当てる |
| テストファイル命名規約 | `*.spec.ts` のみ（不変条件 #8。`*.test.ts` は lefthook `block-test-suffix` と CI `verify-test-suffix` が reject する） |

## 目的

Lane A（qidMap 堅牢化＝schema_questions 非依存化）と Lane B（fail-silent 検知ガード）の受け入れ基準（AC-A1〜A4 / AC-B1〜B3）を、実装前に失敗する RED テストとして確定する。各テストは実行コマンド・ケース名・入力・期待値まで一意に記述し、後続実装者がテストを読むだけで実装対象の仕様を再現できる粒度にする。

## 実行タスク

### 1. RED test 一覧（TC-XX 採番）

| TC | Lane | AC | テストファイル（`*.spec.ts`） | ケース名（`it` 文字列） | 種別 | RED 理由（実装前に失敗する根拠） |
|----|------|------|------------------------------|------------------------|------|-----------------------------------|
| TC-01 | A | AC-A1 | `packages/integrations/google/src/forms/mapper.spec.ts`（既存に追加） | `exports deriveStableKey and STABLE_KEY_BY_LABEL as named exports` | export 存在 | 現状 `deriveStableKey`(89) と `STABLE_KEY_BY_LABEL`(53) は module-private。import が型エラー/undefined になる |
| TC-02 | A | AC-A1 | `packages/integrations/google/src/forms/mapper.spec.ts`（既存に追加） | `deriveStableKey normalizes known raw labels to canonical stableKey` | 正規化 | `deriveStableKey` が未 export のため呼べない |
| TC-03 | A | AC-A1 | `packages/integrations/google/src/forms/mapper.spec.ts`（既存に追加） | `deriveStableKey slugifies unknown labels and returns "unknown" for empty/undefined` | 境界 | 同上 |
| TC-04 | A | AC-A3 | `packages/integrations/google/src/forms/client.spec.ts`（既存に追加） | `defaultQuestionIdMap maps questionId to normalized stableKey, not raw title` | デフォルト qidMap | 現状 `defaultQuestionIdMap`(65-73) は `map[qid]=raw title` を返す。stableKey 正規化されていない |
| TC-05 | A | AC-A3 | `packages/integrations/google/src/forms/client.spec.ts`（既存に追加） | `rawFormToStableKeyMap derives stableKey from raw items via deriveStableKey` | helper | `rawFormToStableKeyMap` helper が未実装 |
| TC-06 | A | AC-A2 | `apps/api/src/forms/build-qid-map.spec.ts`（新規作成） | `builds raw-form fallback map when schema_questions lookup is empty` | fallback | qidMap builder が `index.ts` 内インライン closure で未抽出・未実装。schema 空時の fallback ロジックが存在しない |
| TC-07 | A | AC-A2 | `apps/api/src/forms/build-qid-map.spec.ts`（新規作成） | `merges schema rows over raw fallback (schema wins) when both present` | マージ戦略 | `{...fromRaw, ...fromSchema}` のマージが未実装 |
| TC-08 | A | AC-A4 | `packages/integrations/google/src/forms/mapper.spec.ts`（既存に追加） | `mapFormResponse resolves known stableKeys when given a valid qidMap` | 解決 | 既存テスト（mapFormResponse branch coverage）は qidMap を手書きで渡しているが、本ケースは「raw form 由来 qidMap で fullName 等の known stableKey が解決される」end-to-end を新規検証 |
| TC-09 | B | AC-B1 | `apps/api/src/jobs/sync-forms-responses.contract.spec.ts`（新規作成） | `emits SYNC_ALERTS qid_map_empty when questionIdToStableKey map has 0 entries` | alert | 空 qidMap 検知・`SYNC_ALERTS` 記録が未実装 |
| TC-10 | B | AC-B2 | `apps/api/src/jobs/sync-forms-responses.contract.spec.ts`（新規作成） | `counts fullyUnmappedResponses when a response has known=0 and raw answers>=1` | カウンタ | `fullyUnmappedResponses` サマリーフィールドが未実装 |
| TC-11 | B | AC-B2 | `apps/api/src/jobs/sync-forms-responses.contract.spec.ts`（新規作成） | `emits SYNC_ALERTS all_responses_unmapped when every processed response is fully unmapped` | alert | `all_responses_unmapped` alert が未実装 |
| TC-12 | B | AC-B3 | `apps/api/src/jobs/sync-forms-responses.contract.spec.ts`（新規作成） | `does not change succeeded/failed verdict nor cursor advancement when guard fires` | 非回帰 | ガードが sync 本体の成功/失敗判定を破壊しないことを保証（実装前は guard 自体が無く、追加時に回帰させない契約を固定） |

### 2. 各テストの入力・期待値仕様

#### TC-01: named export 存在

- import: `import { deriveStableKey, STABLE_KEY_BY_LABEL } from "./mapper";`
- 期待: `typeof deriveStableKey === "function"`、`STABLE_KEY_BY_LABEL` が `Record<string,string>` で `Object.keys(...).length > 0`。

#### TC-02: known ラベル正規化（テーブル駆動）

| 入力 label | 期待 stableKey |
|-----------|----------------|
| `お名前（フルネーム）` | `fullName` |
| `ビジネス概要` | `businessOverview` |
| `趣味・好きなこと` | `hobbies` |
| `最近ハマっていること` | `recentInterest` |
| `座右の銘・大切にしている言葉` | `motto` |
| `仕事以外の活動` | `otherActivities` |
| `ホームページへの掲載に同意しますか？` | `publicConsent` |
| `勧誘ルール・免責事項への同意` | `rulesConsent` |

- 実装: `it.each([...])` テーブル駆動。`expect(deriveStableKey(label)).toBe(expected)`。

#### TC-03: unknown ラベル slugify / 空入力

| 入力 label | 期待 stableKey |
|-----------|----------------|
| `Custom Question Title` | `custom_question_title` |
| `undefined`（未定義） | `unknown` |
| `""`（空文字） | `unknown` |

- 根拠: `slugify`(94-100) は空白を `_`、英数字以外を除去・小文字化・64 字 slice。`deriveStableKey(undefined)` は `"unknown"`(90)。

#### TC-04: `defaultQuestionIdMap` が stableKey を返す

- 入力 `RawForm`:
  ```
  { formId: "f", items: [
    { questionItem: { question: { questionId: "q1" } }, title: "お名前（フルネーム）" },
    { questionItem: { question: { questionId: "q2" } }, title: "ビジネス概要" },
    { questionItem: { question: { questionId: "q3" } } } // title 無 → skip
  ] }
  ```
- 期待: `defaultQuestionIdMap(raw)` = `{ q1: "fullName", q2: "businessOverview" }`（`q3` は title 無で除外）。
- RED: 現状は `{ q1: "お名前（フルネーム）", q2: "ビジネス概要" }`（生 title）を返すため `toEqual` で失敗する。

#### TC-05: `rawFormToStableKeyMap` helper

- import: `import { rawFormToStableKeyMap } from "./mapper";`（配置先は Phase 5 で `mapper.ts` named export に確定＝TECH-M-01）
- 入力: TC-04 と同じ `RawForm`。
- 期待: `{ q1: "fullName", q2: "businessOverview" }`。questionId 無の item は除外。

#### TC-06: schema_questions 空時の raw fallback

- 対象: Phase 5 で `index.ts` のインライン closure から抽出する named 関数 `buildQuestionIdToStableKey(schemaRows, raw)`（純関数。詳細は Phase 5 §Lane A）。
- 入力: `schemaRows = []`（schema_questions lookup が 0 行）、`raw` = TC-04 と同じ。
- 期待: `{ q1: "fullName", q2: "businessOverview" }`（raw fallback が機能）。
- RED: fallback ロジックが未実装のため空 `{}` になる（→ mapFormResponse で全 unmapped＝真因 RC-3 の再現）。

#### TC-07: マージ戦略（schema 優先）

- 入力: `schemaRows = [{ questionId: "q1", stableKey: "adminAliasFullName" }]`、`raw` = TC-04 と同じ。
- 期待: `{ q1: "adminAliasFullName", q2: "businessOverview" }`。
  - `q1` は schema 行が raw fallback を上書き（管理者調整 stableKey を尊重）。
  - `q2` は schema 行が無いため raw fallback で補完。
- 根拠: Phase 2 §2 のマージ戦略 `{...fromRaw, ...fromSchema}`。

#### TC-08: mapFormResponse end-to-end 解決

- 入力:
  ```
  raw form items から rawFormToStableKeyMap で qidMap = { q1: "fullName", q2: "businessOverview" } を生成し、
  mapFormResponse({
    raw: { responseId:"r1", respondentEmail:"x@example.com", lastSubmittedTime:"2026-06-10T00:00:00Z",
           answers: { q1:{textAnswers:{answers:[{value:"山田太郎"}]}},
                      q2:{textAnswers:{answers:[{value:"カフェ経営"}]}} } },
    formId:"f", revisionId:"rev-1", schemaHash:"sha-1",
    questionIdToStableKey: qidMap,
  })
  ```
- 期待: `out.answersByStableKey.fullName === "山田太郎"`、`out.answersByStableKey.businessOverview === "カフェ経営"`、`out.unmappedQuestionIds` は `[]`。
- 意義: RC-3 修正後に「会員入力が known stableKey として解決される」エンドツーエンド契約を固定（AC-A4）。

#### TC-09: 空 qidMap → `qid_map_empty` alert

- セットアップ: `SYNC_ALERTS` を `{ writeDataPoint: vi.fn() }` モック。`client.listResponses` は `questionIdToStableKey` を空に解決するスタブ（あるいは Lane B が参照する qidMapSize=0 を注入できる経路）を使う。in-memory D1 / repository モックで `runResponseSync` を 1 ページ実行。
- 期待: `SYNC_ALERTS.writeDataPoint` が `blobs[1] === "qid_map_empty"` を含むレコードで 1 回以上呼ばれる。sync の戻り `status` は `"succeeded"`（中断しない）。
- RED: `qid_map_empty` 検知・記録が未実装。

#### TC-10: `fullyUnmappedResponses` カウント

- セットアップ: 1 response に raw answer 2 件・known 0 件（qidMap 空 or 全 unmapped）。
- 期待: `runResponseSync(...)` の戻りサマリーに `fullyUnmappedResponses === 1`（および `qidMapSize` が定義されている）。
- RED: サマリーフィールド `fullyUnmappedResponses` / `qidMapSize` が `ResponseSyncResult` に未定義。

#### TC-11: 全 response unmapped → `all_responses_unmapped` alert

- セットアップ: 2 response すべて known 0 件・raw answer >=1 件。
- 期待: `SYNC_ALERTS.writeDataPoint` が `blobs[1] === "all_responses_unmapped"` で 1 回呼ばれる。`doubles` に `[qidMapSize, fullyUnmappedResponses, processedCount]`（Phase 2 §3 スキーマ）が含まれる。
- RED: 未実装。

#### TC-12: 非回帰（成功/失敗判定・cursor 不変）

- セットアップ A（正常）: known が解決される通常 response 1 件で `runResponseSync` 実行。
  - 期待: `status === "succeeded"`、`cursor` が highWater で前進、`SYNC_ALERTS` の `qid_map_empty`/`all_responses_unmapped` blob は呼ばれない。
- セットアップ B（既存失敗経路）: `client.listResponses` が throw する。
  - 期待: `status === "failed"`、`fail` ledger が呼ばれる挙動が従来通り（ガード追加で握り潰されない）。
- 意義: AC-B3。ガードが warning/alert 専用で、sync の成功/失敗判定と cursor 進行を一切変えないことを固定。

### 3. テストファイル作成方針

| ファイル | 区分 | 備考 |
|---------|------|------|
| `packages/integrations/google/src/forms/mapper.spec.ts` | 既存に追加 | TC-01/02/03/05/08。`describe("named exports for stableKey derivation")` ブロックを追加。既存 `describe` は変更しない |
| `packages/integrations/google/src/forms/client.spec.ts` | 既存に追加 | TC-04。`describe("defaultQuestionIdMap normalization")` を追加 |
| `apps/api/src/forms/build-qid-map.spec.ts` | **新規作成** | TC-06/07。Phase 5 で `index.ts` から抽出する `buildQuestionIdToStableKey` 純関数を対象にする |
| `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | **新規作成** | TC-09/10/11/12。既存 `sync-forms-responses.contract.spec.ts` とは別ファイル（contract spec は触らない） |

> `index.spec.ts`（既存）は別 workflow（admin-audit mount 回帰）専用のため**触らない**。qidMap fallback の単体検証は、`index.ts` のインライン closure を Phase 5 で純関数 `buildQuestionIdToStableKey` として抽出し、新規 `build-qid-map.spec.ts` で検証する（index.md §5 の `apps/api/src/index.spec.ts` 候補を本 phase で `build-qid-map.spec.ts` に確定。理由: closure のままでは単体テスト不能・`index.spec.ts` は別責務）。

### 4. 実行コマンド（RED 確認）

| 対象 | コマンド | RED 期待 |
|------|---------|---------|
| Lane A（mapper/client） | `mise exec -- pnpm --filter @ubm-hyogo/integrations-google test mapper client` | TC-01〜05/08 が FAIL（export 不在・生 title 返却） |
| Lane A（qidMap fallback） | `mise exec -- pnpm --filter @ubm-hyogo/api test build-qid-map` | TC-06/07 が FAIL（関数未抽出/fallback 未実装） |
| Lane B | `mise exec -- pnpm --filter @ubm-hyogo/api test sync-forms-responses` | TC-09〜12 が FAIL（alert/サマリー未実装） |

> filter の package 名は `package.json#name` を Phase 5 着手時に `grep -h '"name"' packages/integrations/google/package.json apps/api/package.json` で確定する。本 phase の matrix は responsibility（mapper/client/build-qid-map/sync-forms-responses のテスト名 substring）で実行できる形を正本とする。

## 参照資料

| 参照 | パス |
|------|------|
| 既存 mapper テスト | `packages/integrations/google/src/forms/mapper.spec.ts` |
| 既存 client テスト | `packages/integrations/google/src/forms/client.spec.ts` |
| 既存 sync contract テスト | `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` |
| alert 記録の writeDataPoint 形式 | `apps/api/src/jobs/cap-alert.ts`（68-95） |
| normalize-response（known/unknown 分離） | `apps/api/src/jobs/mappers/normalize-response.ts` |
| 設計（閾値・SYNC_ALERTS スキーマ） | `phase-2.md` §3 |

## 統合テスト連携

- Lane A: TC-08 が `rawFormToStableKeyMap`（TC-05）→ `mapFormResponse` の結合点を検証し、Lane A の単体修正が end-to-end で known 解決に効くことを保証する。
- Lane B: TC-09〜12 は `runResponseSync` を in-memory D1 / repository モックで駆動し、Phase 2 §5 validation matrix の `pnpm --filter <api> test sync-forms-responses` をそのまま再利用する。

## 多角的チェック観点（AIが判断）

- **RED の純度**: 各 TC は「実装前に失敗する根拠」列で必ず未実装点に紐付く。export 追加・helper 追加・サマリー拡張・alert 記録のいずれかが欠けると FAIL する設計。
- **責務境界**: Lane A のテストは純関数（`deriveStableKey` / `rawFormToStableKeyMap` / `buildQuestionIdToStableKey`）に閉じ、D1 非依存。Lane B のテストのみ `runResponseSync` を駆動し I/O をモック化する。
- **非回帰の明示**: TC-12 がガード追加による成功/失敗判定・cursor 進行の不変（AC-B3）を契約として固定する。
- **命名規約**: 全テストファイルが `*.spec.ts`（不変条件 #8）。新規 `*.test.ts` を作らない。

## サブタスク管理

| ID | 内容 | Lane | 成果物 |
|----|------|------|--------|
| P4-A1 | TC-01〜03/05/08 を `mapper.spec.ts` に追加（RED 確認） | A | test-plan.md |
| P4-A2 | TC-04 を `client.spec.ts` に追加（RED 確認） | A | test-plan.md |
| P4-A3 | TC-06/07 を `build-qid-map.spec.ts` 新規作成（RED 確認） | A | test-plan.md |
| P4-B1 | TC-09〜12 を `sync-forms-responses.contract.spec.ts` 新規作成（RED 確認） | B | test-plan.md |

## 成果物

- `outputs/phase-4/test-plan.md`（本 phase の TC 一覧・入力/期待値・RED 実行ログを格納）

## 完了条件

- [x] TC-01〜TC-12 の一覧表（ファイル・ケース名・入力・期待値・実行コマンド）が記述されている
- [x] 各 TC に「実装前に失敗する根拠」が明記されている
- [x] 新規テストファイル（`build-qid-map.spec.ts` / `sync-forms-responses.contract.spec.ts`）が `*.spec.ts` 命名規約に従う
- [x] Lane A/B の RED 実行コマンドが Phase 2 validation matrix と整合している
- [x] TC-12 が AC-B3（非回帰）を契約として固定している

## タスク100%実行確認【必須】

- [x] 1〜4 を完遂した
- [x] TC-01〜TC-12 が AC-A1〜A4 / AC-B1〜B3 を 1:1 以上でカバーしている
- [x] `*.test.ts` を新規作成していない（不変条件 #8）
- [x] `outputs/phase-4/test-plan.md` が存在する

## 次Phase

Phase 5（実装）— 本 phase の RED test を GREEN にする最小実装を行う。TECH-M-01（`rawFormToStableKeyMap` 配置先）を Phase 5 で確定する。
