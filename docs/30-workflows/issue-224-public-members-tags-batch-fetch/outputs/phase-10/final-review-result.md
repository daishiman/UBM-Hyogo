# Phase 10: 最終レビュー結果

> 対象 Issue: #224 公開 members list の tags 一括取得（N+1 防止）
> ステータス: implemented_local_evidence_captured（設計レビュー後に実装・証跡取得済み）

## 受け入れ条件 充足判定

| AC | 内容 | 設計上の充足 | 根拠 |
|----|------|------------|------|
| AC-1 | `expand=tags` 指定時、全 member の tags が返る | 満たす設計 | phase-2 で `expand=tags` 時に `listTagsByMemberIds(memberIds)` 結果を memberId で groupBy し各 item へ割り当てる方針を定義済み |
| AC-2 | tags 取得が `member_id IN (...)` の 1 query | 満たす設計 | helper を 1 回のみ呼ぶ設計。member ごとの個別取得を行わない（phase-2 データ取得設計） |
| AC-3 | `expand` 未指定時は tags を含まない | 満たす設計 | `expand` 未指定時は tags キーを付与しない。`PublicMemberListItemZ.tags` を optional に保つ（phase-2 不変条件） |
| AC-4 | visibility filter（公開対象のみ）が維持される | 満たす設計 | 既存 visibility filter を変更せず、フィルタ通過後の memberId 集合に対してのみ tags を取得（phase-9 後方互換チェック） |
| AC-5 | test で N+1 を検知する | 満たす設計 | use-case spec で `listTagsByMemberIds` 呼び出し回数 = 1 を mock で assert する計画（phase-9 検証マトリクス） |

## 設計健全性チェック

- helper（`listTagsByMemberIds`）はフラット配列を返したまま無改変であり、整形は use-case 側に閉じる。
- shared の zod/型変更（`PublicMemberTagZ` / `PublicMemberListItemZ.tags` / `PublicMemberListItem.tags?`）と apps 側参照を同一 wave で配線する設計になっている。
- `appliedQuery` は `.strict()` を維持し、`expand` を含めないため既存 contract test の回帰を壊さない。

## Blocker 判定

- blocker: なし
- 備考: 本レビューは当初の設計レビューであり、現在は Phase 11/12 で実装完了と検証 green を別途記録済み。

## 結論

設計は AC-1〜AC-5 を満たす構成になっている。実装フェーズで本設計（helper 無改変・1 query 一括取得・groupBy 割り当て・strictness 差の維持）に従えば、受け入れ条件を充足できる見込み。
