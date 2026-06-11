# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 1 / 13 |
| TASK_ID | `TASK-MEMBER-FORM-DATA-REFLECTION-001` |
| 実装区分 | 実装仕様書（コード変更あり） |
| task 分類 | VISUAL（staging before/after 視覚証跡を Phase 11 で取得） |
| implementation_mode | `new` |
| 作成日 | 2026-06-10 |

## 目的

「Google Form に入力したのにメンバープロフィールに反映されない」問題の真因を確定し、恒久修正（堅牢化 + fail-silent 検知 + 復旧）の scope・受入基準・inventory を固定する。Phase 1-3 完了まで Phase 4 へ進まない。

## 実行タスク

本 Phase の実行ステップ:

1. P50 チェック（既実装確認）を実施し記録する
2. 真因 RC-1〜RC-4 を staging 実データ根拠付きで記録する
3. inventory（既存ファイル・命名規則・既存 spec 有無）を確定する
4. 受け入れ基準（AC）を本文に確定列挙し Phase 4 開始 gate を記す

### Step 0: P50 チェック（既実装確認）

| 確認項目 | 結果 |
|---------|------|
| current branch に実装が存在するか | No（fail-silent ガード・qidMap fallback は未実装） |
| upstream（dev/main）にマージ済みか | No。commit c073c59b8「会員データソース3層プレシデンス反映」は別問題（member_responses 個別列 INSERT 失敗）の修正で、本件 schema_questions 空起因の qidMap 全滅は**未対応** |
| 前提タスク完了済みか | 該当なし（独立タスク） |

→ `implementation_mode = new`。通常の RED/GREEN 実装フェーズとする。

### Step 1: 真因の確定記録（完了済み）

`outputs/phase-1/root-cause-evidence.md` に staging 実データ調査結果を記録する。要点は index.md §2 の通り（RC-1〜RC-4 + 因果連鎖 + fail-silent）。

### Step 2: inventory（既存コード命名規則・対象ファイル確定）

| 対象 | 確認結果（grep / ls） |
|------|----------------------|
| `mapper.ts` の stableKey 導出 | `deriveStableKey(label)` + `STABLE_KEY_BY_LABEL`（mapper.ts:53-92）。現状 **module-private**（未 export） |
| `mapFormSchema`（schema 側） | `deriveStableKey(item.title)` 使用（mapper.ts:118）= 正規化済み |
| `mapFormResponse`（response 側） | `questionIdToStableKey[questionId]` 使用（mapper.ts:179）= 外部注入 map に依存 |
| client デフォルト qidMap | `qidMapFn`（client.ts:84-91）・`defaultQuestionIdMap`（client.ts:65-73）とも `item.title` 生値を返す（非対称・潜在バグ） |
| 本番 qidMap | `apps/api/src/index.ts:175-186` が `listFieldsByVersion(revisionId)` で schema_questions を引く（空なら空 map） |
| `listFieldsByVersion` | `apps/api/src/repository/schemaQuestions.ts:85`。`revision_id` のみで引く（`_formId` 未使用） |
| sync サマリー | `runResponseSync`（sync-forms-responses.ts:131）戻り値はインライン `{ ..., writeCount }`（175/247/291/366）。`processResponse`（380）戻り値 `{ writeCount }`、`resp.unmappedQuestionIds`（429）既存 |
| SYNC_ALERTS 記録 | `env.SYNC_ALERTS.writeDataPoint({...})`。既存パターン `apps/api/src/jobs/cap-alert.ts:77-90` |
| 既存 spec | `mapper.spec.ts` / `client.spec.ts` / `index.spec.ts` **有**。`sync-forms-responses.contract.spec.ts` **無（新規作成）** |
| 命名規則 | TypeScript: camelCase 関数 / PascalCase 型 / kebab-case ファイル。spec は `*.spec.ts`（不変条件 #8、`*.test.ts` 禁止） |

### Step 3: 受け入れ基準（AC）の本文列挙

index.md §4 の AC-G1〜G3 / AC-A1〜A4 / AC-B1〜B3 / AC-C1〜C4 を本タスクの正本 AC とする（再掲省略・index.md を参照）。各 AC は Phase 10 で検証可能な粒度で定義済み。

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下を確認し、既存設計との整合性を確保する。

| 参照資料 | パス | 内容 |
|---------|------|------|
| database 仕様 | `.claude/skills/aiworkflow-requirements/references/database-*.md` | schema_questions / response_fields / member_responses の役割 |
| API/同期仕様 | `.claude/skills/aiworkflow-requirements/references/api-*.md` | sync パイプライン契約 |
| error-handling | `.claude/skills/aiworkflow-requirements/references/error-handling.md` | fail-silent を避ける方針 |
| API schema（正本） | `docs/00-getting-started-manual/specs/01-api-schema.md` | stableKey 一覧 |
| データ取得 | `docs/00-getting-started-manual/specs/03-data-fetching.md` | 反映フロー |

## 実行手順

1. P50 チェック結果を `outputs/phase-1/requirements.md` に記録する。
2. `outputs/phase-1/root-cause-evidence.md` に staging 実データクエリ結果（RC-1〜RC-4）を記録する。
3. `outputs/phase-1/spec-extraction-map.md` に system spec ↔ current code anchor の 1:1 対応を記録する（下記 4 系統以上）:
   - route owner: `apps/api/src/routes/admin/responses-sync.ts`
   - 同期本体: `apps/api/src/jobs/sync-forms-responses.ts`
   - stableKey 解決: `packages/integrations/google/src/forms/mapper.ts` / `client.ts` / `apps/api/src/index.ts`
   - 表示 view: `apps/api/src/view-models/public/public-member-profile-view.ts`
4. AC を本文に確定列挙し、Phase 4 開始 gate を記す。

## 統合テスト連携

- 後続 Phase 4 で `mapFormResponse` + qidMap の結合 unit test、`runResponseSync` の fail-silent 検知 integration test を設計する。
- staging 実機検証（復旧）は Phase 11 で user-gated 実施。

## 多角的チェック観点（AIが判断）

- **システム系**: 真の論点は「stableKey 解決が schema_questions という単一データソースに強結合し、それが空でも silent に通る」こと。依存関係: response sync → schema_questions（暗黙の前提）。責務境界: stableKey 解決ロジックが mapper（生ラベル正規化）と index.ts（D1 lookup）に二重化している。
- **戦略・価値系**: 価値 = 会員の実入力が確実に公開反映される（サービスの根幹）。コスト最大の部品 = 復旧手順（既存壊れデータの再投入）。堅牢化（fallback）は低コスト高価値。
- **問題解決系**: 仮説（schema_questions 空）を staging 実データで検証済み。優先順位: ①堅牢化で再発防止 → ②fail-silent 検知で可視化 → ③既存データ復旧。

## サブタスク管理

| ID | 内容 | Lane |
|----|------|------|
| P1-1 | P50 + inventory 記録 | 設計 |
| P1-2 | root-cause-evidence 記録 | 設計 |
| P1-3 | spec-extraction-map 作成 | 設計 |

## 成果物

- `outputs/phase-1/requirements.md`
- `outputs/phase-1/root-cause-evidence.md`
- `outputs/phase-1/spec-extraction-map.md`

## 完了条件

- [x] P50 チェック結果が記録されている
- [x] 真因 RC-1〜RC-4 が staging 実データ根拠付きで記録されている
- [x] inventory（既存ファイル・命名規則・既存 spec 有無）が確定している
- [x] AC が本文/index.md で番号付き列挙されている
- [x] spec-extraction-map に 4 系統以上の code anchor が記録されている

## タスク100%実行確認【必須】

- [x] Step 0〜3 を完遂した
- [x] 全成果物が `outputs/phase-1/` に存在する

## 次Phase

Phase 2（設計）— 3 lane topology・fail-silent 閾値・validation matrix を確定する。
