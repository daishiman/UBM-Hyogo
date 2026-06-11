# Phase 6: テスト拡充（fail path / 回帰 guard / 境界値）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 6 / 13 |
| TASK_ID | `TASK-MEMBER-FORM-DATA-REFLECTION-001` |
| 前提 | Phase 5（実装）完了。TC-01〜12 が GREEN |
| 主担当 | Lane A / Lane B |
| テスト方針 | Phase 4 の正常系 RED test を GREEN 化した上で、fail path・回帰 guard・境界値を追加し堅牢性を上げる。命名規約は `*.spec.ts` のみ（不変条件 #8） |

## 目的

Lane A（qidMap 堅牢化）と Lane B（fail-silent 検知）について、Phase 4 で固定した正常系を超える fail path（部分充足・異常 raw・slug 衝突）、回帰 guard（schema sync 済み環境の従来挙動・成功/失敗判定の不変）、境界値（空 form・全 unknown ラベル）のテストを TC-XX 採番で追加し、修正の副作用ゼロを保証する。

## 実行タスク

### 1. 追加テスト一覧（TC-XX 採番・Phase 4 の TC-01〜12 に続く）

| TC | Lane | 区分 | テストファイル（`*.spec.ts`） | ケース名（`it` 文字列） | 検証内容 |
|----|------|------|------------------------------|------------------------|---------|
| TC-13 | A | fail path | `apps/api/src/forms/build-qid-map.spec.ts` | `partially populated schema_questions merges only present rows, raw fallback fills the rest` | 部分マージ |
| TC-14 | A | fail path | `packages/integrations/google/src/forms/mapper.spec.ts` | `rawFormToStableKeyMap skips items lacking questionId` | 異常 raw（questionId 無） |
| TC-15 | A | fail path | `packages/integrations/google/src/forms/mapper.spec.ts` | `duplicate raw titles produce a last-write-wins map per questionId (no crash)` | title 重複→slug 衝突 |
| TC-16 | A | 回帰 guard | `apps/api/src/forms/build-qid-map.spec.ts` | `fully populated schema_questions yields identical map to legacy schema-only behavior` | schema 済み環境の従来挙動不変 |
| TC-17 | A | 境界値 | `packages/integrations/google/src/forms/mapper.spec.ts` | `rawFormToStableKeyMap returns empty object for a form with no items` | 空 form |
| TC-18 | A | 境界値 | `packages/integrations/google/src/forms/mapper.spec.ts` | `all-unknown labels fall back to slugified stableKeys (never throws)` | 全項目 unknown ラベル（slug fallback） |
| TC-19 | B | 回帰 guard | `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | `Lane B guard does not break succeeded verdict when responses resolve normally` | 成功判定不変 |
| TC-20 | B | 回帰 guard | `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | `Lane B guard does not break failed verdict when client throws` | 失敗判定不変 |
| TC-21 | B | fail path | `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | `partially unmapped sync (some responses resolved) does NOT emit all_responses_unmapped` | 部分 unmapped で誤発火しない |
| TC-22 | B | 境界値 | `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | `zero processed responses (empty page) emits no mapping alert` | 処理 0 件で alert なし |

### 2. 各テストの入力・期待値仕様

#### TC-13: 部分充足のマージ（fail path）

- 入力: `schemaRows = [{ questionId: "q1", stableKey: "fullName" }]`、`raw` items = `q1: "お名前（フルネーム）"`, `q2: "ビジネス概要"`, `q3: "趣味・好きなこと"`。
- 期待: `buildQuestionIdToStableKey(schemaRows, raw)` = `{ q1: "fullName", q2: "businessOverview", q3: "hobbies" }`。
  - `q1` は schema 行採用、`q2`/`q3` は raw fallback で補完。
- 意義: schema_questions が一部のみ充足する中間状態でも欠落を取りこぼさない（RC-3 の段階復旧中も安全）。

#### TC-14: questionId 無の異常 raw（fail path）

- 入力: `raw` items = `{ title: "お名前（フルネーム）" }`（questionId 無）, `{ questionItem:{question:{questionId:"q2"}}, title: "ビジネス概要" }`。
- 期待: `rawFormToStableKeyMap(raw)` = `{ q2: "businessOverview" }`（questionId 無は除外・throw しない）。
- 根拠: `if (!qid || !item.title) continue;`。

#### TC-15: title 重複による slug 衝突（fail path）

- 入力: `raw` items = `{ questionId:"q1", title:"その他" }`, `{ questionId:"q2", title:"その他" }`（同一 title）。
- 期待: `rawFormToStableKeyMap` が questionId ごとに別エントリを持ち、両者とも `deriveStableKey("その他")`（同一 stableKey）にマップされる。map は questionId キーなので衝突せず `{ q1: <key>, q2: <key> }`。throw しない。
- 意義: 同一ラベルが複数 questionId に存在しても map がクラッシュせず、後段の `mapFormResponse` で同 stableKey に後勝ちで解決される挙動を明示。

#### TC-16: schema 済み環境の従来挙動不変（回帰 guard）

- 入力: `schemaRows` が raw の全 questionId を網羅（`q1→fullName, q2→businessOverview`）。
- 期待: `buildQuestionIdToStableKey(schemaRows, raw)` が「schema-only の従来 `Object.fromEntries(rows...)`」と完全一致。
  - 比較対象: テスト内で `legacy = Object.fromEntries(schemaRows.filter(r=>r.questionId).map(r=>[r.questionId, r.stableKey]))` を計算し `toEqual(legacy)`。
- 意義: AC-A2 のマージ `{...fromRaw, ...fromSchema}` が schema 充足時に raw fallback で挙動を変えないこと（既存環境の非回帰）。

#### TC-17: 空 form（境界値）

- 入力: `rawFormToStableKeyMap({ formId: "f" })`（items 無）。
- 期待: `{}`（throw しない）。

#### TC-18: 全項目 unknown ラベル（境界値）

- 入力: `raw` items = `{ questionId:"q1", title:"未知の質問A" }`, `{ questionId:"q2", title:"Unknown Question B" }`。
- 期待: 両者とも slugify 結果（`q1` → 日本語除去で `"unknown"` 系、`q2` → `"unknown_question_b"`）にマップされ、map が返る（throw しない）。`STABLE_KEY_BY_LABEL` 未登録ラベルは slug fallback される（AC-A1 の堅牢性）。
- 注: 日本語のみのラベルは `slugify` で英数字以外除去後 `"unknown"` になり得る。本ケースは「未登録でも例外を出さず slug にフォールバックする」契約の確認が主眼。

#### TC-19: 成功判定不変（回帰 guard）

- セットアップ: known が解決される通常 response 1 件、qidMapSize > 0。`SYNC_ALERTS` モック。
- 期待: `status === "succeeded"`、`fullyUnmappedResponses === 0`、`SYNC_ALERTS.writeDataPoint` が `qid_map_empty`/`all_responses_unmapped` blob で呼ばれない、`cursor` が highWater で前進。

#### TC-20: 失敗判定不変（回帰 guard）

- セットアップ: `client.listResponses` が throw。
- 期待: `status === "failed"`、`fail` ledger 経路が従来通り呼ばれる、mapping alert は呼ばれない（throw 前に到達しない／集計 0）。
- 意義: AC-B3。ガード追加が既存の失敗ハンドリング（239-256）を握り潰さない。

#### TC-21: 部分 unmapped で誤発火しない（fail path）

- セットアップ: 2 response のうち 1 件は known 解決・1 件は全 unmapped。`processed === 2`、`fullyUnmappedResponses === 1`。
- 期待: `all_responses_unmapped` alert は**発火しない**（条件 `fullyUnmappedResponses === processed` を満たさない）。`status === "succeeded"`。サマリー `fullyUnmappedResponses === 1` は記録される。
- 意義: 全件 unmapped（真因）と部分 unmapped（正常な一部 unknown）を誤検知しない閾値の正しさ。

#### TC-22: 処理 0 件で alert なし（境界値）

- セットアップ: `client.listResponses` が空ページ（`responses: []`）を返す。qidMapSize は任意。
- 期待: `processed === 0`、`all_responses_unmapped` は `processed > 0` ガードで発火しない。`qid_map_empty` は qidMapSize===0 のときのみ発火（処理 0 件でも空 qidMap 自体は警告対象＝schema 未投入の早期検知として妥当）。テストは qidMapSize > 0 を与え両 alert が発火しないことを確認する。
- 意義: 空ページで誤 alert を出さない（`processed > 0` ガードの存在確認）。

### 3. テストファイル別の追加ブロック

| ファイル | 追加 TC | 追加 `describe` ブロック例 |
|---------|--------|---------------------------|
| `packages/integrations/google/src/forms/mapper.spec.ts` | TC-14/15/17/18 | `describe("rawFormToStableKeyMap edge cases")` |
| `apps/api/src/forms/build-qid-map.spec.ts` | TC-13/16 | `describe("buildQuestionIdToStableKey merge edge cases")` |
| `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | TC-19/20/21/22 | `describe("Lane B fail-silent guard non-regression and boundaries")` |

### 4. 実行コマンド

| 対象 | コマンド | 期待 |
|------|---------|------|
| Lane A（mapper） | `mise exec -- pnpm --filter @ubm-hyogo/integrations-google test mapper` | TC-14/15/17/18 GREEN |
| Lane A（fallback） | `mise exec -- pnpm --filter @ubm-hyogo/api test build-qid-map` | TC-13/16 GREEN |
| Lane B | `mise exec -- pnpm --filter @ubm-hyogo/api test sync-forms-responses` | TC-19〜22 GREEN |
| 全体 | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` | エラー 0 |

## 参照資料

| 参照 | パス |
|------|------|
| Phase 4 正常系 TC | `phase-4.md` §1 |
| Phase 5 実装差分（unmapped 判定・alert 条件） | `phase-5.md` §3 |
| mapper（slugify / deriveStableKey） | `packages/integrations/google/src/forms/mapper.ts`（89-100） |
| sync 失敗ハンドリング | `apps/api/src/jobs/sync-forms-responses.ts`（238-256） |

## 統合テスト連携

- Lane A: TC-13（部分マージ）と TC-16（充足時不変）が `buildQuestionIdToStableKey` のマージ戦略を両端から固定し、段階復旧中・復旧後ともに安全であることを保証する。
- Lane B: TC-19/20 が成功/失敗判定の不変（AC-B3）を、TC-21/22 が閾値の誤発火防止を保証する。

## 多角的チェック観点（AIが判断）

- **fail path の網羅**: 部分充足（TC-13）・questionId 欠落（TC-14）・slug 衝突（TC-15）が「throw しない・取りこぼさない」を共通契約として確認。
- **回帰の二重固定**: Lane A は TC-16（schema 充足時の挙動同一性）、Lane B は TC-19/20（verdict 不変）で、修正の副作用ゼロを別観点から二重に固定。
- **閾値の誤検知防止**: TC-21（部分 unmapped）と TC-22（0 件）が、全件 unmapped という真因シグナルだけを拾う閾値設計の正しさを保証。
- **命名規約**: 全追加テストが `*.spec.ts`。新規 `*.test.ts` を作らない（不変条件 #8）。

## サブタスク管理

| ID | 内容 | Lane |
|----|------|------|
| P6-A1 | TC-14/15/17/18 を `mapper.spec.ts` に追加 | A |
| P6-A2 | TC-13/16 を `build-qid-map.spec.ts` に追加 | A |
| P6-B1 | TC-19/20/21/22 を `sync-forms-responses.contract.spec.ts` に追加 | B |

## 成果物

- `outputs/phase-6/test-additions.md`（追加 TC 一覧・入力/期待値・実行ログ）

## 完了条件

- [x] TC-13〜TC-22 の一覧（ファイル・ケース名・入力・期待値）が記述されている
- [x] fail path（部分充足・questionId 欠落・slug 衝突）が網羅されている
- [x] 回帰 guard（schema 充足時の挙動不変・成功/失敗判定の不変）が固定されている
- [x] 境界値（空 form・全 unknown ラベル・0 件処理）が網羅されている
- [x] 全追加テストが `*.spec.ts` 命名規約に従う

## タスク100%実行確認【必須】

- [x] 1〜4 を完遂した
- [x] TC-13〜TC-22 が fail path / 回帰 guard / 境界値を網羅している
- [x] `*.test.ts` を新規作成していない（不変条件 #8）
- [x] `outputs/phase-6/test-additions.md` が存在する

## 次Phase

Phase 7（カバレッジ確認）— Lane A/B の追加テスト後カバレッジを測定し、未到達分岐の有無を確認する。
