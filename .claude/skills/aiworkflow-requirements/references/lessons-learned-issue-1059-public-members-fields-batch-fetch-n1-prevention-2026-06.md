# Lessons Learned — Issue #1059 public members fields batch fetch (N+1 prevention)

> 親 #224 U-2 follow-up。tags 側 batch（[L-I224-001..010](lessons-learned-issue-224-public-members-tags-batch-fetch-2026-05.md)）と対称な fields 側 batch を `responseFields.ts` + `list-public-members.ts` に適用した wave の知見。

## L-I1059-001: fields batch helper の return shape も Phase 1 で verbatim 固定する

`listFieldsByResponseIds(ctx, readonly ResponseId[])` は tags 側と同じくフラットな `ResponseFieldRow[]` を返す（Map ではない）。既存 `listFieldsByResponseId`（単数）の signature と return shape を Phase 1 で表に固定してから batch 版の擬似コードを書くことで、整形責務（use-case）と取得責務（repository）の境界がぶれない。単数 helper は他経路が使うため温存し、削除せず併存させる。

## L-I1059-002: groupBy キーは `response_id`（= `current_response_id`）であり `member_id` ではない（最大の落とし穴）

tags batch は `member_id` キーの Map（[L-I224-008](lessons-learned-issue-224-public-members-tags-batch-fetch-2026-05.md)）だが、fields batch は **`response_id` キー**で groupBy する。`memberRows.map((m) => asResponseId(m.current_response_id))` で response_id 群を作り、`fieldsByResponseId.get(m.current_response_id)` で引く。tags の対称形だからと `member_id` で引くと全件 miss して出力が空欄化するため、key の非対称性を Phase 設計（F-2）で明示し、回帰テストで担保する。

## L-I1059-003: batch 化と同時に `as never` を branded cast `asResponseId` へ是正する

旧コードは `m.current_response_id as never` で単数 helper に渡していた。batch 化リファクタの同一サイクルで `asResponseId(m.current_response_id)` の branded 変換に置換し、QA 的な型逃がし（`as never`）を残さない。この種の型逃がし是正は Phase 12 compliance に実コード grep 結果（before/after）を root evidence として残す。

## L-I1059-004: SUMMARY_KEYS フィルタを groupBy ループ内に保持して出力を不変に保つ

旧 per-member ループは取得後に `SUMMARY_KEYS.includes(f.stable_key)` で間引いていた。batch 化後も同じフィルタを groupBy ループ内（`if (!SUMMARY_KEYS.includes(...)) continue;`）に保持し、Map には summary 対象 stable_key のみ積む。byKey 構築以降のロジックは一切変えないことで `PublicMemberListResponse` の shape / 値を完全不変に保つ（AC-4）。

## L-I1059-005: fields query 回数 <= 1 の回帰 spec で N+1 防止をロックする

「N+1 を解消した」ことは出力の不変だけでは証明できない。複数 member fixture で `FROM response_fields` クエリが 1 回以下しか発行されないことを assert する回帰 spec（`list-public-members.spec.ts`）を追加し、将来の per-member ループ復活を機械検知する。test helper（`public-d1.ts`）に `response_id IN (...)` の dispatch を足してこの計測を可能にする。

## L-I1059-006: 空配列時は batch query を発行しない

visibility filter 後の `responseIds.length === 0` のとき空 IN 句を組み立てず、helper 側 `if (rids.length === 0) return []` + use-case 側 early guard の二重で query 自体を発行しない（[L-I224-006](lessons-learned-issue-224-public-members-tags-batch-fetch-2026-05.md) と同方針）。N=0 で無駄な D1 往復・SQL エラーを起こさない。

## L-I1059-007: read-only 監査（Explore）エージェントは Bash を持ち、mover を実行しうる

本 wave の close-out 検証中、read-only と想定した Explore 監査エージェントが Bash 経由で workflow dir を `docs/30-workflows/issue-1059-...` → `docs/30-workflows/completed-tasks/issue-1059-...` へ git mv した（unassigned source も co-locate）。**真の状態は git status を正本に判定する**。前 wave のスキル参照（resource-map / quick-reference / task-workflow-active / LOGS / artifact-inventory）が既に completed-tasks/ を指していたため、移動後はむしろ参照と整合する「intended 収束」だった。旧パスへの stale 参照がゼロであることを grep で確認した上で、収束先を採用し巻き戻さない（巻き戻すと参照 drift を再発させる）。

## L-I1059-008: RED 前提 Phase 記述は実装が同一サイクルで landed した時点で evidence-captured へ同期する

仕様作成だけで止めず同一サイクルで local code + focused tests + Phase 11 evidence + aiworkflow sync まで完了させた。その結果、RED 前提（実装前）で書いた Phase 記述が実態とずれるため、`workflow_state` を `implemented_local_evidence_captured` へ、各 phase status を completed へ同期する。strict 7（`main.md` + 6 補助）を root evidence として明示しないと implementation-guide 単独で close-out したように見える点にも注意する。
