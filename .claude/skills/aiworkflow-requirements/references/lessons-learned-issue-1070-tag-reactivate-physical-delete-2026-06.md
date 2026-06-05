# lessons-learned-issue-1070-tag-reactivate-physical-delete-2026-06

> Issue #1070「tag master reactivate + 参照ガード付き physical delete」(`implemented_local_evidence_captured / implementation / NON_VISUAL`) で得た非自明な知見。親 workflow は [[workflow-issue-1035-tag-master-write-endpoints-artifact-inventory]]、本サイクルの台帳は [[workflow-issue-1070-tag-reactivate-physical-delete-artifact-inventory]]。

## L-I1070-001 DB-FK 不在テーブルへの physical delete は application-level COUNT(*) ガードが唯一の参照防壁

- Situation: `member_tags.tag_id` には `tag_definitions` への DB-level `FOREIGN KEY` が無い。そのため physical delete で `tag_definitions` の row を消しても DB は参照側 (`member_tags`) を止めず、貼り跡だけが残る孤児化が起きうる。
- Resolution: `ON DELETE` / DB 制約に依存しない。削除前に `countMemberTagReferences`(`SELECT COUNT(*) FROM member_tags WHERE tag_id`) を実行し、`> 0` は `DELETE` を発行せず 409 `tag_has_references` + `referenceCount` で拒否する。`> 0` の判定を「削除の唯一の防壁」として Phase 2/3 に明記した。
- Verification: repository spec で参照あり時に row 残存を assert、contract spec で 409 + `referenceCount` + 行残存を assert（focused D1 Vitest 2 files / 15 tests PASS）。

## L-I1070-002 不可逆 physical delete は「endpoint 実装」と「production mutation」を 2-stage で分離する

- Situation: 「物理削除は不可逆だから endpoint コード全体を未実装のまま user-gated にする」という前提に陥りやすい。
- Resolution: endpoint / repository / 参照ガード / audit / error contract / focused tests / typecheck / lint / 正本 spec / runbook / artifacts metadata は **同一サイクルで実装可能**。user-gated は **production の実データ物理削除 mutation のみ**（runbook + `user_approval_marker` + pre-delete backup / read-only verify）。この境界を `task-specification-creator` の [[non-visual-irreversible-task-rules]] §「物理削除 endpoint の 2-stage 実装境界」へ昇格した。
- Verification: phase12-compliance §7 で local 実装 done / production mutation のみ user-gated を明示し ok:true。`outputs/phase-12/physical-delete-runbook.md` を strict 7 と同 wave で作成。

## L-I1070-003 lifecycle write は「対称形ペア」で設計すると実現性が上がる

- Situation: reactivate を新規設計するとき、conflict path や独自 SQL を一から起こすと複雑化しうる。
- Resolution: reactivate は `deactivateTagDefinition` の逆操作（同一 row の `active` flip）として置く。UNIQUE `code` 列に触れないため reactivate 時の code conflict path は構造的に不要。no-op（既に `active=1`）時は `UPDATE` を発行せず `changed:false` を返し audit 不発火 — deactivate の signature / no-op / audit 条件を反転テンプレとして再利用した。
- Verification: repository spec で 不在=null / no-op=`changed:false`(UPDATE 不発行) / 復帰=`changed:true` を分岐 assert。contract spec で idempotent 再呼び出し時に audit が増えないことを assert。

## L-I1070-004 prefix を共有する新 route は静的セグメント優先解決を既存 regression で固定する

- Situation: `/tags/:tagId/physical` は既存 `/tags/:tagId`(logical DELETE) と prefix を共有する。
- Resolution: Hono は静的セグメント `/physical` を `:tagId` パラメータより優先解決するため衝突しないが、解決順序の固定は既存 logical `DELETE /tags/:tagId` の regression test を新 route の contract spec に含めて担保する（親 issue-1035 `/tags/queue` regression と同型。汎用パターンは [[patterns-lessons-and-pitfalls]] の SP-I1035-D に既出）。
- Verification: contract spec で logical DELETE が従来通り 204 + active=0 + member_tags 保持（AC-6）であることを固定。

## L-I1070-005 physical delete の audit before は「削除前 snapshot」を repository から返す

- Situation: row を消した後に audit を書こうとすると、before 用の値が取得できない。
- Resolution: `physicalDeleteTagDefinition` は削除成功時に削除前 row を返し、route が `before: rowBody(row), after: null` で `admin.tag.physically_deleted` を 1 件 append する。audit は state 変化時のみ（physical=削除成功時 / reactivate=`changed===true` 時）。
- Verification: contract spec で physical 成功時 audit 1 件・before に full row・after=null を assert。

## L-I1070-006 lessons は references/ 直下に置く（generate-index.js は lessons-learned/ サブdir を scan しない）

- Situation: 本 skill には `lessons-learned/` サブdir（例 issue-1036）と `references/` 直下（例 issue-1039）の 2 系統が混在する。`generate-index.js` は `REFS_DIR = references/` の直下 `.md` のみを走査し、サブdir は topic-map / keywords に登録されない。
- Resolution: 索引到達性を確保するため本 lessons を `references/lessons-learned-issue-1070-...md` の直下に置き、台帳 inventory に `## Lessons Learned` 節で双方向リンクした。`indexes:rebuild` で topic-map / keywords に自動登録される。
- Verification: `indexes:rebuild` 後に topic-map / keywords.json へ本ファイルが登録され、再実行で drift 0。

## 関連パターン

- 親: [[workflow-issue-1035-tag-master-write-endpoints-artifact-inventory]]（logical delete / audit / contract test 前例）
- 昇格先: [[non-visual-irreversible-task-rules]] §「物理削除 endpoint の 2-stage 実装境界」（L-I1070-001 / 002）
- 参照: [[patterns-lessons-and-pitfalls]] の SP-I1070（symmetric-lifecycle）/ SP-I1035-D（prefix route regression）
