# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 10 / 13 |
| TASK_ID | `TASK-MEMBER-FORM-DATA-REFLECTION-001` |
| 前提 | Phase 9（品質保証）完了 = validation matrix 全 PASS |
| 主担当 | 全 Lane |
| 成果物 | `outputs/phase-10/final-review-result.md` |

## 目的

index.md §4 の全 AC（G1〜G3 / A1〜A4 / B1〜B3 / C1〜C4）を **1 件ずつ検証根拠付きで判定** し、MINOR（TECH-M-01 / TECH-M-02）の解決を確認した上で、Phase 11（手動テスト）へ進めるかの **blocker 判定** を下す。
「全体として OK」のような総括判定は禁止。AC 1 件ごとに合否と根拠を残す。

## 実行タスク

本 Phase の実行ステップ:

1. AC-G1〜G3（全体）を 1 件ずつ判定する
2. AC-A1〜A4 / AC-B1〜B3 / AC-C1〜C4 を 1 件ずつ検証根拠付きで判定する
3. MINOR（TECH-M-01 / TECH-M-02）の解決を確認する
4. blocker 判定と Phase 13 user-gated を明記する

### 1. AC 判定テーブル（全体: AC-G1〜G3）

| AC | 内容 | 検証根拠 | 判定 |
|----|------|---------|------|
| AC-G1 | 全 phase 仕様書が CONST_005 必須項目（変更ファイル・シグネチャ・入出力・テスト・実行コマンド・DoD）を満たす | phase-1〜10 の必須セクション存在確認 | PASS / FAIL |
| AC-G2 | 新規 D1 migration・Google Form schema 変更・cron 間隔変更を含まない | Phase 9 Q-7（migrations diff 空）+ diff 全体確認 | PASS / FAIL |
| AC-G3 | 全 Lane が 1 サイクル内完了スコープ（先送り無し） | Lane A/B/C すべて本サイクルで完了（TECH-M-02 を除く） | PASS / FAIL |

### 2. AC 判定テーブル（Lane A: qidMap 堅牢化）

| AC | 内容 | 検証根拠 | 判定 |
|----|------|---------|------|
| AC-A1 | `deriveStableKey` と `STABLE_KEY_BY_LABEL` が `mapper.ts` から named export | `grep -n "export.*deriveStableKey\|export.*STABLE_KEY_BY_LABEL" mapper.ts` | PASS / FAIL |
| AC-A2 | `index.ts` の `questionIdToStableKey` が schema_questions 空/欠落時に raw form fallback を返す | Phase 9 Q-4 GREEN + index.ts fallback マージの test | PASS / FAIL |
| AC-A3 | `client.ts` の default `qidMapFn`(84-91) と `defaultQuestionIdMap`(65-73) が `deriveStableKey` 経由（schema 側と対称） | Phase 8 R-1/R-2 統合確認 + client.spec GREEN | PASS / FAIL |
| AC-A4 | 正しい qidMap で `mapFormResponse` が known stableKey（`fullName` 等）を解決 | mapper.spec の unit test GREEN | PASS / FAIL |

### 3. AC 判定テーブル（Lane B: fail-silent 検知ガード）

| AC | 内容 | 検証根拠 | 判定 |
|----|------|---------|------|
| AC-B1 | qidMap 空（0 entry）時に warning ログ + `SYNC_ALERTS` 1 レコード（`kind="qid_map_empty"`） | sync-forms-responses.spec の空 qidMap test で alert spy 確認 | PASS / FAIL |
| AC-B2 | 1 response 全 unmapped（known 0 件かつ raw 1件以上）を検知し `fullyUnmappedResponses` をサマリーに含める | サマリー型拡張 + 全 unmapped test GREEN | PASS / FAIL |
| AC-B3 | 検知ガードが sync 本体の成功/失敗判定を破壊しない（非回帰）。閾値・挙動は phase-2 §3 で確定（非中断・warning + alert） | 回帰 test GREEN + phase-2 §3 閾値テーブル一致 | PASS / FAIL |

### 4. AC 判定テーブル（Lane C: 復旧 runbook + 診断）

| AC | 内容 | 検証根拠 | 判定 |
|----|------|---------|------|
| AC-C1 | `schema_questions` 充足診断手順（cf.sh read-only クエリ + 期待値 > 0）を runbook に記載 | runbook §診断 の存在確認 | PASS / FAIL |
| AC-C2 | 復旧手順（schema sync → schema_questions 検証 → response sync fullSync → answers_json/known 検証 → 詳細ページ確認）を順序付きで記載 | runbook §復旧手順 の 5 ステップ存在確認 | PASS / FAIL |
| AC-C3 | 既存 `__extra__:` 行のクリーンアップ要否判断を記載 | runbook §クリーンアップ判断（残存は無害・削除は別タスク）確認 | PASS / FAIL |
| AC-C4 | runbook が `cf.sh` ラッパー経由（`wrangler` 直呼び禁止）を厳守 | Phase 9 §3 `grep "wrangler " <runbook>` 出力空 | PASS / FAIL |

### 5. MINOR 解決確認

| MINOR ID | 指摘内容 | 解決状況の根拠 | 判定 |
|----------|---------|---------------|------|
| TECH-M-01 | `rawFormToStableKeyMap` の配置先（`mapper.ts` か `client.ts`）が未確定 | Phase 8 R-3 で単一配置に確定済み | 解決 / 未解決 |
| TECH-M-02 | 旧 `__extra__:` 行クリーンアップを別タスク化するか runbook 注記で済ますか | Phase 10/12 判定。AC-C3 で「残存は無害・削除は別タスク」と runbook 明記 → 別タスク化要否は Phase 12 で未タスク判定 | 解決 / Phase 12 持越（許容） |

> TECH-M-02 は phase-3 で「解決確認 = Phase 12（未タスク判定）」と定義されているため、本 Phase では runbook 注記で済ませた事実を記録し、別タスク要否の最終判断を Phase 12 へ送るのが正規挙動。これは AC-G3（先送り無し）違反ではない（クリーンアップは表示に無害で本タスクの修正目的外）。

### 6. Blocker 判定

| 判定項目 | 内容 |
|---------|------|
| AC FAIL の有無 | G/A/B/C のうち FAIL が 1 件でもあれば **Phase 11 へ進めない（blocker）** |
| MINOR 未解決の有無 | TECH-M-01 未解決は blocker。TECH-M-02 は Phase 12 持越が許容 |
| Phase 13 blocked 条件 | commit / PR / deploy / staging mutation は user 明示承認まで blocked（phase-3 §4 継続） |
| 最終判定 | 全 AC PASS かつ TECH-M-01 解決 → Phase 11 進行可 / それ以外 → 差し戻し |

## 参照資料

| 参照 | パス |
|------|------|
| AC 正本 | `index.md` §4 |
| MINOR 追跡 | `phase-3.md` §3 |
| Lane B 閾値 | `phase-2.md` §3 |
| QA 実測 | `outputs/phase-9/qa.md` |
| coverage 実測 | `outputs/phase-7/coverage.md` |
| refactor 結果 | `outputs/phase-8/refactor.md` |

## 実行手順

1. §1〜§4 の各 AC を 1 件ずつ、検証根拠（test 結果・grep・diff・runbook セクション存在）に紐付けて PASS/FAIL を確定する。
2. §5 で TECH-M-01 / TECH-M-02 の解決状況を記録する。
3. §6 で blocker 判定を下す。FAIL または TECH-M-01 未解決があれば差し戻し先 Phase を明記する。
4. `outputs/phase-10/final-review-result.md` に全判定テーブルと最終 blocker 判定を記録する。

## 統合テスト連携

- 本 Phase は新規 test を実行せず、Phase 7（coverage）/ Phase 9（QA）の実測結果を AC 判定の根拠として参照する。
- AC-B1/B2 の判定は Lane B の異常系 test（qidMap 空 / 全 unmapped）の GREEN を必須根拠とする（正常系のみでは不可）。

## 多角的チェック観点（AIが判断）

- **1 件ずつ判定の徹底**: AC を束ねて「概ね達成」とすると、fail-silent 検知（AC-B1/B2）のような「異常時しか効かない」要件の検証漏れが起きる。各 AC に独立根拠を必須化する。
- **negative AC の優先**: AC-G2（migration 非変更）・不変条件 #1（表現層非接触）は「やっていないこと」の確認であり、Phase 9 の diff 空 gate を根拠に厳格判定する。
- **MINOR の正しい送り先**: TECH-M-02 を無理に本 Phase で潰そうとすると不要なデータ削除タスクが混入する。phase-3 の定義通り Phase 12 の未タスク判定へ送るのが整合的。

## サブタスク管理

| ID | 内容 | Lane |
|----|------|------|
| P10-1 | AC-G/A/B/C を 1 件ずつ判定 | 全 |
| P10-2 | MINOR（TECH-M-01/M-02）解決確認 | 全 |
| P10-3 | blocker 判定 + 差し戻し要否 | 全 |

## 成果物

- `outputs/phase-10/final-review-result.md`

## 完了条件

- [x] AC-G1〜G3 / A1〜A4 / B1〜B3 / C1〜C4 が 1 件ずつ検証根拠付きで判定されている
- [x] TECH-M-01 が解決済みと確認されている
- [x] TECH-M-02 の扱い（runbook 注記 + Phase 12 持越）が記録されている
- [x] blocker 判定が下され、FAIL があれば差し戻し先 Phase が明記されている
- [x] Phase 13（commit/PR/deploy/mutation）が user-gated として blocked であることが再確認されている

## タスク100%実行確認【必須】

- [x] §1〜§6 を完遂した
- [x] `outputs/phase-10/final-review-result.md` が存在する
- [x] 全 AC PASS かつ TECH-M-01 解決（または差し戻し判定が明記）

## 次Phase

Phase 11（手動テスト）— Lane C の復旧 runbook に沿って staging で復旧を実施し、公開メンバー詳細の before/after 視覚証跡を取得する（user-gated）。
