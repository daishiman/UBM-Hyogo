# Phase 6: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 公開 members list の fields 一括取得 N+1 防止 (issue-1059) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト拡充 |
| 作成日 | 2026-06-02 |
| 状態 | completed |
| 前 Phase | 5 (実装) |
| 次 Phase | 7 (カバレッジ確認) |
| タスク種別 | implementation / NON_VISUAL |

## 目的

Phase 4 の happy path に加え、fail path・エッジケース・回帰 guard を追加し、batch 化が
出力不変性を壊さないことを多角的に担保する。

## 追加テストケース

### repository（`responseFields.repository.spec.ts`）

| ID | ケース | 期待 |
| --- | --- | --- |
| RV-E1 | `listFieldsByResponseIds(ctx, [])`（空配列） | `[]` を返し DB に問い合わせない |
| RV-E2 | 複数 response_id（一部存在しない id を含む） | 存在する id 分のフラット配列のみ返る。順序非依存で内容一致 |
| RV-E3 | 単一 response_id | 単数 `listFieldsByResponseId` と同一行集合を返す（等価性） |

### use-case（`list-public-members.spec.ts`）

| ID | ケース | 期待 |
| --- | --- | --- |
| UC-E1 | `memberRows` 空（公開 member 0 件） | `listFieldsByResponseIds` は空配列入力で DB 非アクセス。`items=[]`・pagination 整合 |
| UC-E2 | ある member の fields が 0 件 | 当該 member は `byKey` 空 → 既定値（fullName 等は空文字、ubmZone/ubmMembershipType は null）。before と同値 |
| UC-E3 | 複数 member で値が混線しないこと（F-2 回帰） | member A/B が各々の `current_response_id` の値を正しく引き当てる。取り違えゼロ |
| UC-E4 | `expand=tags` 併用 | tags（member_id キー）と fields（response_id キー）が独立して正しく合流する |
| UC-R1 | 既存 happy path テスト群 | 全て GREEN を維持（出力形状・値の回帰 guard / AC-4） |

## fields クエリ回数の回帰 guard（AC-3）

- use-case テストで `listFieldsByResponseIds` を spy し、member 件数 N（例: 3, 10）に対して
  **呼び出し回数が常に 1**（空のときは 0）であることを assert する。
- 旧実装（per-member ループ）に戻すと N 回呼ばれてこのテストが FAIL する = 回帰検出が働く。

## 実行タスク

1. repository の fail/edge テスト（RV-E1〜E3）を追加する（完了条件: 全 PASS）。
2. use-case のエッジ・F-2 回帰テスト（UC-E1〜E4）を追加する（完了条件: 全 PASS）。
3. fields クエリ回数 ≦ 1 の回帰 guard（AC-3）を追加する（完了条件: N=3/10 で呼び出し 1 回を assert）。
4. 既存 happy path（UC-R1）が GREEN を維持することを確認する（完了条件: 回帰なし）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-04.md | happy path テスト設計 |
| 必須 | apps/api/src/repository/__tests__/responseFields.repository.spec.ts | repository テスト拡充先 |
| 必須 | apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts | use-case テスト拡充先 |
| 参考 | apps/api/src/repository/__fixtures__/members.fixture.ts | `RESPONSE_FIELDS_R001` 等 fixture |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| テスト | responseFields.repository.spec.ts | RV-E1〜E3 追加 |
| テスト | list-public-members.spec.ts | UC-E1〜E4 + AC-3 回帰 guard 追加 |
| ドキュメント | outputs/phase-06/main.md | 追加テスト件数と PASS 記録 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | エッジケースを含む coverage 測定対象に渡す |
| Phase 9 | 回帰 guard の存在を QA チェックの根拠に渡す |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] repository fail/edge テスト（RV-E1〜E3）が全 PASS
- [ ] use-case エッジ・F-2 回帰テスト（UC-E1〜E4）が全 PASS
- [ ] fields クエリ回数 ≦ 1 の回帰 guard（AC-3）が追加され PASS
- [ ] 既存 happy path（UC-R1）が GREEN を維持

## タスク100%実行確認【必須】

- 全実行タスク（4 件）が完了
- 追加テストが対象 spec ファイルに配置済み
- artifacts.json の `phases[5].status` が完了時に更新される

## 次 Phase への引き渡し

- 次 Phase: 7 (カバレッジ確認)
- 引き継ぎ事項: 追加テスト一覧 / AC-3 回帰 guard / エッジケース網羅
- ブロック条件: いずれかのエッジケースが before と異なる出力を返す
