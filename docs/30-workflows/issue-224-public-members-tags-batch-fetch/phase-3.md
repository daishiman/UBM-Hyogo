# Phase 3: 設計レビュー（ゲート）

## 判定

**PASS** — Phase 4（テスト作成）へ進めてよい。

## レビュー観点と結果

| 観点                       | 評価 | 根拠                                                                                          |
| -------------------------- | ---- | --------------------------------------------------------------------------------------------- |
| AC 充足性                  | OK   | AC-1〜AC-5 が Phase 2 のデータフロー / query 回数表 / test 方針で全てカバーされる              |
| 実コード整合               | OK   | helper の**フラット配列返り**を groupBy する設計、`q`/`limit` 等の実フィールド名、contract spec 実パス（`index.contract.spec.ts`）を反映済み |
| 責務境界                   | OK   | parse / use-case / repository / view-model / shared の 5 レイヤで責務分離。状態所有権の混在なし |
| 既存実装との整合           | OK   | helper `listTagsByMemberIds` 再利用（新規 query ゼロ）。parser/zod/builder の既存パターン踏襲  |
| leak 防御（invariant）     | OK   | tags 取得対象を visibility filter 通過後の `listPublicMembers` 結果集合に限定する不変条件で担保 |
| 後方互換                   | OK   | `tags` は `.optional()`、`expand` は `appliedQuery` に含めない。expand 未指定で応答が現行と byte 互換 |
| N+1 リグレッション検知性    | OK   | test が tags batch query（`member_id IN`）のみを計数し「件数非依存で 1 query」を assert        |
| スコープ妥当性（CONST_007） | OK   | API 1 サイクルで完結。web UI / fields N+1 は責務分離でスコープ外（先送りではない）            |

## 設計上の決定事項（confirmed）

1. **expand は whitelist 方式**: 未知値は throw せず黙って除外。結果は常に配列（default `[]`）。
2. **helper はフラット配列を返す**: use-case 層で memberId キーの Map に groupBy してから引き当てる。
3. **expand を `appliedQuery` に含めない**: `appliedQuery` は `.strict()` で既存6キー固定のため。
4. **tags query は use-case 層で条件分岐**: repository は無改変。opt-in 判定は `query.expand.includes("tags")`。
5. **test は tags batch query のみ計数**: fields N+1（別 issue）を assert に巻き込まない。
6. **view-model は spread 条件で tags 付与**: 未指定時はキー自体を出さない（AC-3 を schema optional + builder の二重で保証）。

## リスクと対策

| リスク                                                       | 対策                                                                       |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| helper のフラット配列を Map と誤認し引き当てが壊れる         | Phase 2 に groupBy コードを明示。Phase 4 で「複数 member × 複数 tag」を fixture 化し検証 |
| `expand` を `appliedQuery` に足して既存 strict contract test が落ちる | Phase 2/5 で「expand は appliedQuery 非対象」を明記。既存 contract test（appliedQuery 6キー）を回帰確認 |
| contract test の query 計数機構が D1 mock に無い              | Phase 4 で `createPublicD1Mock` の prepare 呼び出しを spy（`member_id IN` を含む SQL の回数計数）する方針を確定。無ければ helper を spy する use-case unit test を第一証跡にする |
| memberId と current_response_id の取り違え                   | tags は `member_id` で JOIN、fields は `current_response_id`。Phase 5 で引き当てキーを明示確認 |
| `expand`（応答拡張）と `tag`/`tags`（絞り込みフィルタ）の混同 | 別 param。命名・責務で区別済み。parse でも別経路 |
| `asMemberId` の import 経路差異                              | Phase 5 で既存 brand 利用箇所（`@ubm-hyogo/shared` or `repository/_shared/brand`）に合わせる |

## 次フェーズへの申し送り

- Phase 4: ① tags batch query 計数手段（D1 mock prepare spy or helper spy）を最初に確定 ② 複数 member × 複数 tag の fixture を用意 ③ 既存 appliedQuery contract test の回帰維持を確認。
- Phase 5: 変更ファイル 5（parser / shared zod / shared 型 / view-model source / use-case）を同一 wave で更新。helper は無改変。
