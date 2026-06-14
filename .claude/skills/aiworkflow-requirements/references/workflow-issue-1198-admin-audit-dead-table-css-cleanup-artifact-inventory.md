# issue-1198-admin-audit-dead-table-css-cleanup artifact inventory

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1198-admin-audit-dead-table-css-cleanup/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| issue | #1198 CLOSED（reopen しない・PR 文脈は `Refs #1198` のみ） |
| purpose | `/admin/audit` カード型タイムライン化で未参照化した旧テーブル系 CSS 3 ブロックを `globals.css` から削除する |
| implementation | `apps/web/src/styles/globals.css` 18 行純減（`.admin-audit-filter`, `.admin-audit-table-scroll`, `.admin-audit-table` 削除） |
| evidence | `.tsx/.ts` 参照 grep 0、旧 CSS 定義 grep 0、カード系 selector 保持、`.tbl` stale baseline 0 件維持、typecheck/lint/verify:tokens/focused Vitest PASS |
| invariant | apps/api / D1 schema / Google Form schema / endpoint surface / public response shape unchanged。現行カード系 CSS は保持。`.tbl` は現行 0 件のため復活させない |
| source task | `docs/30-workflows/unassigned-task/task-admin-audit-dead-table-css-cleanup.md` consumed |
| user gate | commit, push, PR, completed-tasks physical move |

## Four-condition notes

- 矛盾なし: local implementation completion and commit/PR gate are separated.
- 漏れなし: Phase 12 strict 7 includes `main.md`; root/output `artifacts.json` parity maintained.
- 整合性あり: stale `.tbl` premise was corrected to current 0-hit baseline instead of preserving a nonexistent selector.
- 依存関係整合: parent audit UX workflow remains completed; this follow-up consumes only the dead CSS cleanup task.

## Lessons Learned

- **L-I1198-001（CSS dead-code grep は定義ファイルを参照数から除外する）**: `grep admin-audit-table apps/web/src apps/web/app` のような広い grep は `globals.css` 自身の定義行を「参照あり」と誤判定する。dead CSS 判定では `.tsx` / `.ts` など consumer 側に限定する。
- **L-I1198-002（closed issue の行番号アンカーは stale 前提）**: Issue #1198 の行 1602-1618 は後続編集で 2023-2039 へ移動していた。削除範囲は行番号ではなく selector 名で確定する。
- **L-I1198-003（preserve 前提も現行 grep で検証する）**: `.tbl` は「保持」と書かれていたが現行コードでは 0 件だった。存在しないものを保持対象にせず、0 件維持を invariant にする。
