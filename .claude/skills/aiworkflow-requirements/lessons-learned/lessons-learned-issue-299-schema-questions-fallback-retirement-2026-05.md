# Lessons Learned — Issue #299 schema_questions Fallback Retirement（2026-05-15）

> task: `task-issue-299-schema-questions-fallback-retirement-001`
> 関連 spec: `docs/30-workflows/completed-tasks/task-issue-299-schema-questions-fallback-retirement-001/phase-{01..13}.md`、同 `outputs/phase-{11,12}/`
> 関連 source: `apps/api/src/repository/schemaQuestions.ts`、`apps/api/src/sync/schema/resolve-stable-key.ts`、`apps/api/src/sync/schema/resolve-stable-key.spec.ts`、`scripts/diagnose/schema-aliases-coverage.sql`
> 関連 reference: `references/database-implementation-core.md`、`references/task-workflow-active.md`、`references/workflow-task-issue-299-schema-questions-fallback-retirement-artifact-inventory.md`
> 関連 changelog: `changelog/20260515-issue299-schema-questions-fallback-retirement-spec.md`

## 教訓一覧

### L-299-001: fallback 物理削除は「dual-environment coverage 0 rows 確認 → 物理削除」の 2-stage retirement で行う

- **背景**: `schema_questions.stable_key` への SELECT fallback を `findStableKeyByQuestionId` から削除する作業。fallback がまだ実行経路として hit する状態で削除すると alias 解決済みのレコードが unresolved 化し sync が破損する。
- **教訓**: physical deletion の前に **production / staging 双方で `scripts/diagnose/schema-aliases-coverage.sql` 相当の coverage SQL を実行し、`fallback hit 0 rows` を独立に確認する**。両環境で 0 rows が確定して初めて fallback SELECT を物理削除する。evidence は Phase 11 `coverage-evidence.md` に SQL / 環境 / 行数を直接転記し、`evidence_state=COVERAGE_ZERO_VERIFIED_LOCAL` で artifacts.json に固定する。
- **将来アクション**: 同類の lookup contract 段階移行（alias 表 / mapping 表 / fallback chain 再設計）では Phase 11 evidence の 1 件として「dual-environment coverage 0 rows」AC を必ず立てる。`task-specification-creator` template の DB 移行系 task に組み込む。

### L-299-002: staging が production D1 と同一 binding の場合、staging 単独実行でも安全担保根拠になる根拠を明記する

- **背景**: 本タスクで staging 環境の coverage SQL を「production と同一 D1 binding に解決される」前提で 0 rows 評価したが、これを Phase 11 evidence に書かないと、後続レビュアが「staging で見ただけ」と誤解する余地が残る。
- **教訓**: D1 binding の environment-mapping を Phase 11 evidence (`sync-log-evidence.md` か `coverage-evidence.md`) に **明示的に文章化**し、「staging 指定だが production と同一物理 D1 を指す」根拠を `wrangler.toml` の binding 名で示す。これにより staging 単独実行が production safety guarantee と等価であることが artifact 上で再現可能になる。
- **将来アクション**: D1 / KV / R2 など Cloudflare bindings を共有する environment 構成で実行する evidence は、binding mapping を 1 行明記するルールを `references/database-implementation-core.md` の evidence 条項に組み込む。

### L-299-003: lookup 順序 / contract / 移行終端条件は同一 wave で 1 つの canonical reference に同期する

- **背景**: fallback 削除後、`apps/api` runtime の lookup 順序、戻り値 contract、移行終端条件（fallback retired を意味する semantic）が `database-implementation-core.md` で一箇所にまとまっていないと、後続実装者が古い順序を再導入するリスクがある。
- **教訓**: physical deletion を伴う fallback retirement では、**(a) lookup 順序、(b) 関数 contract（戻り値 / null / unresolved 表現）、(c) 移行終端条件（retired を意味する semantic）** の 3 点を同一 reference (`database-implementation-core.md`) の同一節に「retired」表記で同期する。indexes / quick-reference / topic-map / keywords は同 wave で update し、`changelog/<date>-issueN-...-spec.md` に Synced surfaces として列挙する。
- **将来アクション**: aiworkflow-requirements の DB 系 reference 更新時は `lookup 順序 / contract / 終端条件` 3 点セットの同期チェックリストを quick-reference に常置する。

### L-299-004: OPEN issue を維持したまま実装を完了する場合は `Refs #N` を使い `Closes` を禁止する

- **背景**: Issue #299 はユーザー指示により OPEN 維持。PR 本文に `Closes #299` を書くと merge 時に自動 close され、後続フォロー（指標 dashboard 確認 / additional retirement）の追跡 issue がなくなる。
- **教訓**: ユーザーが「issue を OPEN 維持」と明示する場合は **PR 本文に `Refs #<n>` のみ**を使い、`Closes` / `Fixes` / `Resolves` / `Closed-by` keyword は禁止。Phase 12 `main.md` の Boundary 節と changelog の Boundary 節の両方に「Issue #N OPEN 維持 / `Refs` 使用」を明記し、Phase 13 user approval boundary でも再確認する。
- **将来アクション**: `task-specification-creator` の Phase 12 / Phase 13 template に「issue OPEN 維持 / `Refs` only」状態語を導入し、PR template の `Closes` 行を選択式にする。

### L-299-005: source unassigned task は GO 完了時 `completed by task-issue-N` 注記を加えて履歴トレースを残す

- **背景**: Issue #191 に紐づく source unassigned task が `unassigned-task/` または `completed-tasks/` に存在し、Issue #299 の実装で実質的に解消された。source task を黙って消すとトレースが消失する。
- **教訓**: GO 完了で別 issue の workstream が source task を消化した場合は、**source task ファイル先頭の Status 行に `completed by task-issue-<consuming-task-id> (<date>)` を追記**し、completion メモ section を加えてからファイル移動する。物理削除はせず、artifact inventory にも source trace を残す。
- **将来アクション**: Phase 12 strict 7 outputs の `unassigned-task-detection.md` に「source trace updated」verdict を必須項目化する。

## 適用範囲

- 本 lessons は **DB lookup contract / fallback 物理削除 / dual-environment coverage gate** を含む全 task に適用する。
- L-299-001 / L-299-002 は D1 / KV / R2 を介する binding 共有環境での evidence-gated implementation 全般に適用。
- L-299-003 は aiworkflow-requirements の DB 系 reference 更新を含む全 task に適用。
- L-299-004 は OPEN issue 維持 + `Refs` only 運用 task に適用。
- L-299-005 は source unassigned task を別 issue で消化する全 GO completion パスに適用。

## 追跡 / 未解放事項

| 項目 | 接続先 | 状態 |
| --- | --- | --- |
| Phase 13 user approval（commit / push / PR 作成） | Phase 13 boundary | pending |
| Issue #299 の OPEN 維持確認 | PR 本文 `Refs #299` | enforced |
| `pnpm indexes:rebuild` 実行 | Phase 13 前後 | optional |

## 参考リンク

- `docs/30-workflows/completed-tasks/task-issue-299-schema-questions-fallback-retirement-001/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/task-issue-299-schema-questions-fallback-retirement-001/outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-task-issue-299-schema-questions-fallback-retirement-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260515-issue299-schema-questions-fallback-retirement-spec.md`
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
