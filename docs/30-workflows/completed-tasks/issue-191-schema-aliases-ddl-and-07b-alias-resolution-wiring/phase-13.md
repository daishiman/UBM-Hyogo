# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-30 |
| 前 Phase | 12（ドキュメント更新） |
| 次 Phase | なし（最終） |
| 状態 | spec_created |
| user_approval_required | true |

## approval gate（最重要）

- 本 Phase は **ユーザー明示承認まで blocked**
- ユーザーから「PR 作成してよい」旨の明示指示があるまで `git push` / `gh pr create` を実行しない
- CLOSED issue #191 は **再 OPEN しない**（タイトル / body 双方で「CLOSED issue #191 に対する補完仕様化」を明記）
- `git commit` も承認後にまとめて実行（spec_created 段階では未コミット）

## 目的

Phase 1〜12 で確定した仕様書一式を docs-only PR としてレビュー可能な形に整える。実装は別 issue で起票するため、本 PR は「補完仕様化のみ」を含む。

## branch / target

| 項目 | 値 |
| --- | --- |
| branch | `docs/issue-191-schema-aliases-ddl-task-spec` |
| target | `dev`（→ 後続 PR で `main` へ昇格、通常フロー） |
| force-push | 禁止 |
| skip hook | 禁止（lefthook を必ず通す） |

## PR title 案

```
docs(issue-191): schema_aliases DDL & 07b alias resolution wiring task spec
```

70 文字以内で詳細は body に寄せる。

## PR body template

```markdown
## Summary

- CLOSED issue #191 に対する補完仕様化（docs-only / spec_created）
- `schema_aliases` テーブル新設と 07b alias resolution 配線の Phase 1-13 タスク仕様書を追加
- 実装は本 PR には含まれない。実装タスクは別 issue で起票予定（unassigned-task-detection.md 参照）
- Issue #191 は CLOSED のまま運用し、本 PR でも再 OPEN しない

## 含む変更

- `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/index.md`
- `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/artifacts.json`
- `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/phase-01.md` 〜 `phase-13.md`
- `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/outputs/phase-12/implementation-guide.md`（章構成 placeholder）
- `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/outputs/phase-12/system-spec-update-summary.md`
- `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/outputs/phase-12/documentation-changelog.md`
- `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/outputs/phase-12/skill-feedback-report.md`

## 不変条件影響

- #1（schema 固定禁止）: alias を `schema_aliases` 専用テーブルに分離する仕様で順守
- #5（D1 直接アクセスは apps/api のみ）: repository を apps/api に閉じる方針を仕様化
- #14（schema 変更は /admin/schema に集約）: 07b workflow が alias 書き込み点を維持

## 後続タスク

- 実装は別 issue で起票予定（候補 A: schema_aliases 実装本体）
- fallback 廃止 / lint rule CI 化は移行期間後に別 issue 化（候補 B / C）
- 詳細: `outputs/phase-12/unassigned-task-detection.md`

## Test plan

- [ ] `pnpm lint` PASS（docs-only でも markdown lint を通す）
- [ ] `pnpm typecheck` PASS（コード変更ゼロ確認）
- [ ] `pnpm format --check` PASS
- [ ] artifacts.json parity check（root と outputs 配下の整合）
- [ ] CLOSED issue #191 が CLOSED のままであること（`gh issue view 191 --json state` で `CLOSED`）
- [ ] PR body / title に「CLOSED issue #191 に対する補完仕様化」明記
```

## local-check-result（実行結果記録欄 / 承認後に埋める）

```text
$ mise exec -- pnpm lint
<placeholder: ここに実行結果を貼る>

$ mise exec -- pnpm typecheck
<placeholder: ここに実行結果を貼る>

$ mise exec -- pnpm format --check
<placeholder: ここに実行結果を貼る>

$ node scripts/check-artifacts-parity.mjs docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring
<placeholder: ここに artifacts.json parity 確認の出力を貼る>

$ gh issue view 191 --json state -q .state
<placeholder: CLOSED であること>
```

## change-summary

作成ファイル一覧（spec_created 段階で確定する範囲）:

- `index.md`
- `artifacts.json`
- `phase-01.md`
- `phase-02.md`
- `phase-03.md`
- `phase-04.md`
- `phase-05.md`
- `phase-06.md`
- `phase-07.md`
- `phase-08.md`
- `phase-09.md`
- `phase-10.md`
- `phase-11.md`
- `phase-12.md`
- `phase-13.md`
- `outputs/phase-12/implementation-guide.md`（章構成 placeholder）
- `outputs/phase-12/system-spec-update-summary.md`（Step 1-A〜1-C 見出し）
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`

実装系（apps/api / migrations / repository / 07b 配線）の変更は本 PR に**含まない**。

## 多角的チェック観点

- approval gate を**最初**に通す（自動 push 禁止）
- CLOSED issue を再 OPEN しない（gh pr create に `--issue` で linkify はしても close keyword は使わない）
- branch protection（dev / main）の `required_linear_history` / `required_conversation_resolution` を満たす
- secret hygiene: PR body に token / api key を含めない

## サブタスク管理

- [ ] ユーザー明示承認を取得
- [ ] `git checkout -b docs/issue-191-schema-aliases-ddl-task-spec`
- [ ] 全 spec ファイルを add → commit（HEREDOC で commit message）
- [ ] `pnpm lint` / `pnpm typecheck` / `pnpm format --check` を全 PASS
- [ ] artifacts.json parity check PASS
- [ ] `gh issue view 191 --json state` が `CLOSED` であることを確認
- [ ] `git push -u origin docs/issue-191-schema-aliases-ddl-task-spec`
- [ ] `gh pr create --base dev --title ... --body ...`（HEREDOC）
- [ ] PR URL をユーザーに返却

## 成果物

- `outputs/phase-13/main.md`（PR URL / local-check-result の最終形を記録）

## 実行タスク

- [ ] 本 Phase の目的に対応する仕様判断を本文に固定する
- [ ] docs-only / spec_created 境界を崩す実行済み表現がないことを確認する
- [ ] 次 Phase が参照する入力と出力を明記する

## 参照資料

- 依存 Phase: Phase 2 / Phase 5 / Phase 6 / Phase 8 / Phase 9
- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 統合テスト連携

本 workflow は spec_created / docs-only のため、この Phase では統合テストを実行しない。実装タスクでは Phase 4 の verify suite と Phase 7 の AC matrix を入力に、apps/api 側で契約テストと NON_VISUAL evidence を収集する。

## 完了条件

- [ ] approval gate を経由した PR が `dev` に向けて open 状態
- [ ] PR body に CLOSED issue #191 への補完仕様化である旨が明記
- [ ] local-check-result が全 PASS
- [ ] CLOSED issue #191 が CLOSED のまま維持
- [ ] workflow_state は `spec_created`（実装完了ではないため `completed` に書き換えない）

## タスク100%実行確認

- [ ] approval gate が記述されている
- [ ] PR title 案が 70 文字以内
- [ ] PR body に Summary / 含む変更 / 不変条件影響 / 後続タスク / Test plan の 5 セクション
- [ ] local-check-result placeholder が 5 種（lint / typecheck / format / parity / issue state）
- [ ] change-summary がファイル名で完全列挙されている
- [ ] branch / target が `docs/issue-191-schema-aliases-ddl-task-spec` → `dev` で固定

## 次 Phase への引き渡し

なし（最終 Phase）。本 PR がマージされた後、`unassigned-task-detection.md` の候補 A/B/C を別 issue として起票するのは別タスクの責務。
