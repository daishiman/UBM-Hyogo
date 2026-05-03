# Lessons Learned — 06c-C admin tags queue-only follow-up

## L-06CC-001: `/admin/tags` を「タグ辞書 CRUD」と誤読しない

`/admin/tags` の正本は **未タグ会員割当キュー (queue-only)** であり、タグ辞書 CRUD / alias editor /
`member_tags` 直接編集 UI/API は scope out。`tags` という URL から「タグ辞書管理」を連想して
`POST /admin/tags`（タグ作成）/ `PATCH /admin/tags/:id`（タグ rename）/ `DELETE /admin/tags/:id`
（タグ削除）/ alias editor を新設すると、正本仕様（`12-search-tags.md` + `11-admin-management.md`）
と衝突し、後段で全 route 撤去の breaking change が必要になる。Phase 1 着手前に
`12-search-tags.md`（queue 境界）+ `11-admin-management.md`（admin 5 画面責務）を必読し、
「URL は名詞だが機能は queue resolve のみ」という境界をチームで明示する。

## L-06CC-002: status union 拡張は 4 箇所に波及するため Panel export で single-source-of-truth 化する

issue-109 で `tag_queue.status` 列に `dlq` が追加されたが、UI 側の status union（`TagQueueStatus`）
が未追従だったために以下 4 箇所すべてで個別更新が必要だった:

1. `TagQueuePanel.tsx` の `TagQueueStatus` type union（`queued | reviewing | resolved | rejected | dlq`）
2. `TagQueuePanel.tsx` の `TERMINAL_STATUSES` set（disabled 判定）
3. `page.tsx` の status クエリパラメータ受理リテラル
4. `TagQueuePanel.tsx` のフィルタボタン配列

これらが個別 `=== "resolved" || === "rejected"` で書かれていると、`dlq` 追加時に 4 箇所すべて
更新が必要で、漏れると「dlq でも confirm/reject ボタンが押せる / dlq フィルタが出ない / page.tsx で
リテラル拒否」のいずれかが発生する。`TagQueuePanel` 側で `ALL_STATUSES` 配列 + `TERMINAL_STATUSES`
set + `TagQueueStatus` type を export し、`page.tsx` は import で参照する設計に統一すれば、
status 列追加時は Panel 1 ファイルの更新で済む。

## L-06CC-003: 旧 CRUD POM (`admin-add-tag-button`) を queue-only 化と同 PR で必ず置換する

`AdminTagsPage.ts` に旧 `admin-tag-list` / `admin-add-tag-button` / `clickAddTag` の locator が
残っていた。spec 側で skip されていても、queue-only 化以後は selector が DOM に存在しないため
将来 unskip した瞬間に 100% タイムアウトで fail する。さらに「POM が CRUD 前提のまま残存」自体が
新規参加者に「`/admin/tags` は CRUD 画面」という誤誘導を与える。queue-only 化の PR で必ず
`queueList` / `reviewPanel` / `statusFilters` + `assertQueueShell()` に置換し、`admin-tag-list` /
`admin-add-tag-button` を完全削除する。spec 側も `assertQueueShell()` 呼び出しに同 PR で置換する。

## L-06CC-004: SKILL.md merge conflict marker 残存検出 hook を導入する

git stash apply / merge 後に SKILL.md へ `<<<<<<< Updated upstream` / `||||||| Stash base` /
`>>>>>>> Stashed changes` マーカーが残ったままコミットされうる（実際 `v2026.05.02-06c-B-admin-members`
追加時に一時残存していた）。マーカー残存は次回の Phase 12 sync で `grep` ノイズと「どの行が canonical か」
の判定混乱を引き起こす。Phase 12 review の前に
`rg "^<<<<<<< |^======= |^>>>>>>> |^\|\|\|\|\|\|\| " .claude/skills/aiworkflow-requirements/SKILL.md`
で marker 不在を verify し、ゼロでなければ Phase 12 開始を block する。pre-commit hook に
conflict marker 検出を追加する候補を `unassigned-task` へ別途記録する。

## L-06CC-005: visual evidence は 06c-C 単独で取得せず 08b/09a へ委譲する境界をテンプレ化する

`/admin/tags` の screenshot は staging admin Google account + sanitized D1 fixture（`tag_queue` に
queue 行が複数 status で存在する状態）が前提で、06c-C 単体のローカル環境では再現不能。
Phase 11 を 06c-C に閉じ込めようとすると placeholder 画像を `outputs/phase-11/screenshots/` に
配置することになり、それを実測 PASS と誤認するリスクが残る。admin UI 系 follow-up の visual evidence
は **08b admin Playwright E2E / 09a staging smoke** に委譲し、`outputs/phase-11/runtime-evidence-handoff.md`
に `PENDING_RUNTIME_FOLLOW_UP` 状態と canonical handoff 先（`AdminTagsPage.assertQueueShell()` 起点で
`admin-tags` screenshot を取得）を必ず記録する。06c-A / 06c-B / 06c-C すべて同じ境界で運用する。
