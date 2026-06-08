# skill-feedback-report

> 改善点なしでも出力必須。task-specification-creator skill への feedback 候補。
> 本 workflow は `implemented_local_evidence_captured`（CLOSED Issue recovery / VISUAL）。local implementation close-out で候補記録済み。

## テンプレート改善

| ID | 観点 | 内容 |
| --- | --- | --- |
| FB-I1116-001 | CLOSED Issue recovery + VISUAL implemented_local_evidence_captured | CLOSED Issue を canonical 化する recovery（recovery §2/§7）で visualEvidence=VISUAL の場合、local fixture screenshot と authenticated staging screenshot を分けて記録する必要がある。Phase 11 spec（`phase-11.md`）は present・manual-test-result.md は present・local screenshots/ は present・authenticated staging は pending_user_gate という 4 値の使い分けを、VISUAL × implemented_local_evidence_captured のテンプレ例として明文化すると、compliance §4 Phase 11 evidence inventory の status 表記ぶれを防げる。 |
| FB-I1116-002 | sibling route nav 衝突の事前検証 | admin に新規ルートを足す際、`isNavItemActive` が `pathname.startsWith(href + "/")` で active 判定する実装では、既存ルートの**子ルートにすると親 nav が同時 active になる衝突**が起きる。原典 Issue が「`/admin/tags` を master 用に空きと想定」していたように、issue 文面のルート想定は陳腐化しやすい。task-spec 作成時に「新規 route が既存 nav item の接頭辞配下に入らないか」を Phase 1 の命名規則分析で必須確認する手順をテンプレ化すると、nav 衝突バグを設計段階で排除できる。 |

## ワークフロー改善

| ID | 観点 | 内容 |
| --- | --- | --- |
| FB-I1116-003 | CLOSED Issue 鮮度調査の 2 表 gate | recovery §7 の「実装済み判定表（§7.1）」「最新コードへの最適化表（§7.2）」を Phase 1 に必須で置くことで、古い issue 文面（「専用 CRUD ページがまだ無い」）に引きずられず、`rg expectedCode apps/web`=0 件・`fetchTagMaster` 未使用という current codebase 実態から「genuinely needed・ただし route 想定は stale」を機械的に切り分けられた。CLOSED Issue recovery では本 2 表を gate 化する運用が有効。 |
| FB-I1116-004 | UI 層タスクの API spec 反映スコープ | API surface が親タスク（issue-1069）で正本 spec へ改訂済みの場合、後続 UI 層タスクは API spec を再改訂しない。admin UI surface（route 追加）は workflow / aiworkflow inventory に反映し、API spec は不変として扱うと、UI タスクの過剰な spec 改訂を防げる。 |

## ドキュメント改善

- `expectedCode` compare-and-swap（CAS）は API 側（issue-1069）で確立済みパターン。UI 側は「編集開始時の `code` を `expectedCode` として保持し submit 時に同梱・409 `tag_stale_conflict` を `tag_code_conflict` と別文言で表示」という消費パターンを CONFLICT_COPY 定数 1 箇所に集約することを、admin mutation UI の横断ガイドライン候補とする。

## 総合

- 改善提案 4 件（テンプレート 2 / ワークフロー 2）+ ドキュメント 1 件。
- 本 workflow は `implemented_local_evidence_captured` のため、FB-I1116-001..004 の skill 本体への promotion は **同一 wave で同期済み**（recovery §5）。現時点は候補記録に留める。
