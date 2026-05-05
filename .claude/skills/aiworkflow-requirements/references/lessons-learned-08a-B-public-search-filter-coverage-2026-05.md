# Lessons Learned — 08a-B Public Search Filter Coverage（2026-05-04）

> task: `08a-B-public-search-filter-coverage`
> 関連 spec: `docs/00-getting-started-manual/specs/12-search-tags.md`、`docs/00-getting-started-manual/specs/01-api-schema.md`、`docs/00-getting-started-manual/specs/05-pages.md`、`docs/00-getting-started-manual/specs/09-ui-ux.md`
> 関連 source: `apps/api/src/_shared/search-query-parser.ts`、`apps/api/src/repository/_shared/sql.ts`、`apps/api/src/repository/publicMembers.ts`、`apps/web/src/lib/url/members-search.ts`
> 関連 reference: `task-workflow-active.md`（08a-B 行）/ `legacy-ordinal-family-register.md`（path 移動行）

## 教訓一覧

### L-08AB-001: `status` parameter は **参加ステータス**（参加区分）であり、**公開状態フィルタではない**

- **背景**: 仕様初稿で `status` を「公開/非公開の切り替え」と読める文面が混入し、Phase 2 設計途中で公開境界（base WHERE）と参加ステータス絞り込みが混線した。
- **教訓**: `status` は `member_status`（正会員 / 非会員 / アカデミー…）の query parameter として使い、公開境界は API base WHERE の `public_consent='consented' AND publish_state='public' AND is_deleted=0 AND canonical alias source 除外` で **必ず固定**する。query 受け取り側で公開境界を制御してはならない（不変条件 #4 / #5 違反になる）。
- **将来アクション**: 検索/フィルタ系タスクでは Phase 2 設計時に「**公開境界（base WHERE / 不可変）**」と「**ユーザー指定の絞り込み（query / 可変）**」を 2 軸で必ず分離して書き、AC でも `AC-INV4` を独立化する。

### L-08AB-002: `q` は LIKE wildcard literal を **escape** し、`ESCAPE '\'` 句で SQL 注入を防ぐ

- **背景**: 初期実装は `q` をそのまま `LIKE '%' || ? || '%'` に渡しており、ユーザー入力に `%` / `_` を含むと意図しない部分一致が発生した（誤一致 + DoS リスク）。
- **教訓**: `apps/api/src/repository/_shared/sql.ts` に `escapeLikePattern(q)` を追加し、`%` / `_` / `\` を backslash escape したうえで `name LIKE ? ESCAPE '\\'` の形で bind する。Phase 4 focused test で `%` / `_` 入力時の AC を必ず追加する。
- **将来アクション**: D1 / SQLite で `LIKE` を使う query は **`escapeLikePattern` + `ESCAPE '\\'`** をデフォルトとする。`apps/api/src/repository/_shared/sql.ts` の helper を共通正本とし、新規 repository でも import して使う。

### L-08AB-003: `tag` AND 条件は positional bind の **offset を考慮**して `placeholders(n, start)` で生成する

- **背景**: `q` / `zone` / `status` / `tag (IN ...)` を組み合わせると、tag IN 句の placeholder index が先行 bind と重なり、SQLite が「不正な bind index」「件数 0 falsely」を返した。
- **教訓**: `placeholders(n)` を `placeholders(n, start)` に拡張し、`start` に先行 bind 数を渡して `?N+1, ?N+2, ...` の形を生成する。Phase 4 focused test で compound filter の bind alignment を検証する。
- **将来アクション**: D1 で動的 IN を生成する query は **必ず `placeholders(n, start)` を使う**ルールを `apps/api/src/repository/_shared/sql.ts` JSDoc に明記。新規 repository でも同 helper を import する。

### L-08AB-004: `sort=name` / `sort=recent` は **fullName tie-break** を必ず含める

- **背景**: 初期実装は `sort=name` を `member_id ASC` MVP として扱っていたが、name sort の semantic 期待と乖離。`sort=recent` も `last_submitted_at` だけで tie-break すると同日時の並びが non-deterministic になり Playwright が flaky 化した。
- **教訓**: `sort=name` は `fullName ASC, member_id ASC`、`sort=recent` は `last_submitted_at DESC, fullName ASC, member_id ASC` で固定する。tie-break は **fullName → member_id の 2 段**を default とする。
- **将来アクション**: 公開系 list endpoint の sort 定義は「主軸 → 派生軸（fullName）→ pkey（member_id）」の 3 段固定を spec template に組み込む。Phase 4 で同点 tie-break test を必須化。

### L-08AB-005: `tag` query は **dedup + empty drop + 5 件上限** を parser 層で吸収する

- **背景**: query parser は tag を array として受けるだけで、`?tag=&tag=jazz&tag=jazz&tag=&...&tag=N` のような不正値で SQL bind 数が膨張・空文字 IN 句で 0 件 falsely になっていた。
- **教訓**: `apps/api/src/_shared/search-query-parser.ts` で `tag` を **trim → empty drop → dedup → 5 件 cap** の順で正規化し、`q` も `trim → whitespace normalize → 200 文字 truncate` を default とする。
- **将来アクション**: query parser の正規化ルールは `references/api-endpoints.md` の query 仕様セクションへ反映し、新規 list endpoint も同じ正規化を共有する。

### L-08AB-006: implementation / implemented-local / VISUAL_ON_EXECUTION の close-out 判定 `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

- **背景**: 本タスクは API 実装 / focused test / specs sync は完了しているが、Playwright screenshot / staging curl / axe report は 08b / 09a 実行時に取得する設計。Phase 11 を `not executed` のまま PASS と扱うリスクがあった。
- **教訓**: runtime evidence pending を意味する **`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`** を判定値として採用し、Phase 11 は `blocked_runtime_evidence`、Phase 12 は `completed`、Phase 13 は `pending_user_approval` で artifacts.json / compliance check を分離する。`unassigned-task-detection.md` で「runtime evidence は既存 downstream（08b / 09a）routing で吸収する」を明示し、新規 unassigned task の濫造を避ける。
- **将来アクション**: VISUAL_ON_EXECUTION 系タスクで close-out するときは、close-out 判定を 5 段階（`PASS_FULL` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / `PASS_DOCS_ONLY` / `BLOCKED` / `FAIL`）に正規化し、Phase 12 compliance check の項目に必ず記録する。

### L-08AB-007: 既存実装が大半完成しているケースは Phase 5 ランブックを **編集中心型**に切り替える

- **背景**: `apps/api/src/_shared/search-query-parser.ts` と `apps/api/src/repository/publicMembers.ts` は既に存在し、Phase 5 ランブックの「新規実装」枠が冗長な空欄で埋まる結果となった。
- **教訓**: Phase 5 ランブックを「**新規実装 / 編集中心 / 移行中心**」の 3 分岐で書き、本タスクのような既存実装の AC drift 修正型は **編集中心**で書く。新規実装テンプレを無理に埋めない。
- **将来アクション**: `task-specification-creator` skill の Phase 5 雛形に 3 分岐を追加する提案を `skill-feedback-report.md` の T-1 として promote 済み。

### L-08AB-008: workflow root path 移動は **legacy-ordinal-family-register.md** で必ず追跡する

- **背景**: 当初 `docs/30-workflows/02-application-implementation/08a-B-public-search-filter-coverage/` に置かれていたが、canonical workflow 直下（`docs/30-workflows/08a-B-public-search-filter-coverage/`）へ移動。旧 path は git status で D（削除）として残り、旧 citation の引き直しが必要。
- **教訓**: workflow root の rename / move 時は legacy register の §Current Alias Overrides に「旧 path → 現 path」行を追加し、resource-map / quick-reference / task-workflow-active を同一 wave で更新する。filename family rename でなく path 移動でも記録する。
- **将来アクション**: lifecycle path move を Phase 12 必須サブタスクの項目に固定し、compliance check で empty diff チェックを行う。
