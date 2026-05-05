[実装区分: 実装仕様書]

# Phase 13: PR 作成 — 06c-B-admin-members-implementation-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members-implementation-execution |
| phase | 13 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| user_approval_required | true |

## 目的

実装差分を含む PR を作成するための最終ゲートを定義する。本タスクは実装を伴うため、commit / push / PR は **user の明示承認まで実行しない**。

## 実行タスク

1. user の明示承認があるまで commit / push / PR を実行しない。
2. PR 用 change-summary は implementation execution spec と runtime evidence pending の境界を明記する。
3. local-check-result は実行済みコマンドのみ実値で記録し、未実行項目は pending とする。
4. staging screenshot / deploy smoke は 08b / 09a の承認ゲートへ handoff する。

## approval gate（必須）

- 本タスクは実装差分を含む。**user の明示承認が無ければ commit / push / PR を作成しない。**
- approval は user 発話で「commit してよい」「push / PR を作ってよい」等の明示同意を必要とする。
- staging visual evidence は 08b admin E2E / 09a staging smoke の承認ゲートで取得する。
- 承認なしの自走、`--no-verify`、`--force-push` は禁止。

## change-summary（PR 用 placeholder）

- 追加/変更: `apps/api/src/routes/admin/members.ts` / `member-delete.ts` / `members.test.ts` / `member-delete.test.ts`、`apps/web/app/(admin)/admin/members/page.tsx`、`apps/web/src/components/admin/{MembersClient,MemberDrawer}.tsx`、`packages/shared/src/admin/search.ts`、`docs/30-workflows/06c-B-admin-members-implementation-execution/`
- 内容: admin members 検索 (filter/q/zone/tag[]/sort/density/page) 実装、delete / restore + audit_log 接続、shared schema 抽出、テスト 14 ケース追加
- 影響: implementation（staging deploy / visual smoke は別タスクで実施）
- 不変条件: #4 / #5 / #11 / #13 を全 phase で参照、違反なし

## local-check-result（実行時に置換）

| 項目 | 結果 |
| --- | --- |
| `mise exec -- pnpm typecheck` | PASS |
| `mise exec -- pnpm lint` | PASS / stablekey warning-mode findings exited 0 |
| `mise exec -- pnpm vitest run apps/api/src/routes/admin/member-delete.test.ts apps/api/src/routes/admin/members.test.ts apps/web/src/components/admin/__tests__/MembersClient.test.tsx apps/web/src/components/admin/__tests__/MemberDrawer.test.tsx packages/shared/src/zod/viewmodel.test.ts` | PASS: 5 files / 51 tests |
| `rg "D1Database\|c\\.env\\.DB" apps/web -n` | PASS: production app direct D1 access 0 件。boundary test fixture のみ match |

## PR template（提案）

```
title: feat(06c-B): admin members search/delete/restore implementation execution

## Summary
- /admin/members 一覧検索を q / zone / tag[] AND / sort / density / page に対応
- delete / restore endpoint を audit_log と `DB.batch()` で接続
- packages/shared に AdminMemberSearchZ / toAdminApiQuery / ADMIN_SEARCH_LIMITS を集約
- 11-admin-management.md / 07-edit-delete.md / 12-search-tags.md と正本同期
- 不変条件 #4 / #5 / #11 / #13 を全 phase で参照

## Test plan
- [ ] api/web/shared typecheck
- [ ] admin members focused vitest（14 cases）
- [ ] member-delete focused vitest
- [ ] grep で apps/web から D1 直参照が 0 件
- [ ] 08b admin members E2E / 09a admin smoke の前提が揃ったことを確認
```

## 実行手順（user 承認後）

1. user 承認を得る（明示発話）。
2. `git status` / `git diff main...HEAD --name-only` で対象差分を確認。
3. `git add <specific files>` でステージ（`-A` ではなく明示的な path 指定推奨。secret の混入を防止）。
4. commit 作成（HEREDOC で複数行 message、Co-Authored-By を含む）。
5. `git push -u origin <branch>` で push。
6. `gh pr create --title "..." --body "$(cat <<'EOF' ... EOF)"` で PR 作成。
7. PR URL を user に返却。

## 入出力・副作用

- 入力: user 明示承認、Phase 1〜12 全成果
- 出力: PR URL、change-summary、local-check-result
- 副作用: remote branch push、PR 作成（承認後のみ）

## DoD

- [ ] user 明示承認後にのみ commit / push / PR を実行
- [ ] change-summary が implementation であることを明示
- [ ] local-check-result の placeholder が実値で置換されている
- [ ] 後続タスク（08b / 09a）の開始条件が記録されている

## 参照資料

- 本仕様書 Phase 1〜12
- `CLAUDE.md` ブランチ戦略 / PR 作成の完全自律フロー
- `.claude/commands/ai/diff-to-pr.md`

## 統合テスト連携

- 上流: Phase 12 ドキュメント更新
- 下流: 08b admin members E2E、09a admin staging smoke

## 多角的チェック観点

- #4 / #5 / #11 / #13 を PR description でも侵さない
- secret 値（API token / cookie）を PR 本文・commit message・log に書かない
- user 承認なしに commit / push / PR を自走しない

## サブタスク管理

- [ ] user 承認の確認
- [ ] change-summary 草案を確定する
- [ ] PR template 草案を確定する
- [ ] local-check-result を実値で更新する
- [ ] outputs/phase-13/main.md を作成する

## 成果物

- `outputs/phase-13/main.md`

## 完了条件

- [ ] user 承認後にのみ PR が作成される
- [ ] change-summary が implementation であることを明示する
- [ ] 後続タスクの開始条件が記録されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 承認なしに commit / push / PR を実行していない
- [ ] CONST_005 必須項目が網羅されている

## 次タスクへの引き渡し

08b admin members E2E と 09a admin staging smoke へ、本仕様書の AC マトリクス / evidence path / blocker を渡す。
