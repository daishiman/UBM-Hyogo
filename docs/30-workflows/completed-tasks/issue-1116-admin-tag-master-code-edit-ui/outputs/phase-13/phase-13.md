# Phase 13: commit-pr-release — admin tag master code edit UI（issue-1116）

**[実装区分: 実装仕様書]**

> **重要: 本 Phase は user の明示承認後のみ実施する。本仕様書作成サイクルでは実行しない。**
> Phase 13 status = `pending_user_approval`。`git commit` / `git push` / `gh pr create` / staging deploy / authenticated visual capture / Issue 状態変更はすべて **user-gated**。
> 本 workflow は `implemented_local_evidence_captured`（実コード実装済み）。実装・focused web tests・typecheck・lint・verify:design-tokens・authenticated visual capture は**本実行サイクルで user-gated に実施**してから PR を作成する。

## 1. 本サイクル（仕様書作成）での実行範囲

- 本サイクルでは **commit / push / PR / staging deploy / authenticated visual capture / Issue 状態変更を一切行わない**。
- 成果物は workflow 仕様書（Phase 1-13 + strict 7）のみ。`apps/` 配下は非接触。
- PR 作成は user 明示承認後にのみ行い、Gate-A/B/C passed の local evidence を本文に転記する。

## 2. 前提ゲート（PR 作成前に全通過必須）

| ゲート | 内容 | 確認元 |
| --- | --- | --- |
| Gate-A | 要件・設計・テスト仕様確定（Phase 1-4 / DESIGN-BRIEF §3 / sibling route 決定） | spec 上 passed（artifacts.json gates） |
| Gate-B | 実装 + リファクタリング + 品質保証（Phase 5-9）green | PASS |
| Gate-C | 手動テスト + 最終レビュー + ドキュメント同期（Phase 10-12） | PASS |
| web typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` error 0 | pending |
| lint | `mise exec -- pnpm lint` exit 0 | pending |
| focused web vitest | `tags.update.spec.ts` / `TagMasterPanel.spec.tsx` / `page.spec.tsx` / `shell-config.spec.ts` | PASS（4 files / 20 tests） |
| design token | `mise exec -- pnpm verify:design-tokens` PASS | pending |
| coverage | `bash scripts/coverage-guard.sh --group web` PASS | pending |
| local fixture visual | `outputs/phase-11/screenshots/` に 4 枚 capture | PASS |
| authenticated visual | staging deploy 後に追加 capture（user-gated） | pending_user_gate |

## 3. 想定 PR 設定

| 項目 | 値 |
| --- | --- |
| base ブランチ | `dev`（CLAUDE.md「PR作成の完全自律フロー」既定。`main` は production リリース時のみ） |
| 作業ブランチ | `docs/issue-1116-admin-tag-master-code-edit-ui-spec`（仕様書）。実装コードを載せる場合は同ブランチで実装差分を追加コミット |
| タイトル案 | `feat(admin): tag master code/label/category 編集 UI 導線を追加 (#1116)` |
| Issue リンク方針 | **`Refs #1116`** を使用。**`Closes #1116` は使わない**（Issue #1116 は既に CLOSED。本 PR で再 close しない） |

## 4. 想定 PR 本文骨子

```
## 概要
admin が tag master の code / label / category を安全に編集できる新規導線を追加する。
- 新規 sibling ルート /admin/tag-master（server component・既存 safeServerFetch('/admin/tags?...') で一覧取得）。
- 新規 client component TagMasterPanel（一覧+行選択）/ TagMasterEditForm（FormField で code/label/category 編集）。
- 新規 web API client updateTag(tagId, {code?,label?,category?,expectedCode?})。
  code 変更時のみ expectedCode を同梱し、CAS で 409 tag_stale_conflict を検出。
- 409 tag_code_conflict（UNIQUE 衝突）と 409 tag_stale_conflict（最新値競合）を別文言で表示。
- sidebar nav に tag-master item（label「タグ管理」）+ icon を追加。
VISUAL（apps/web only）。apps/api 非接触・D1 直アクセスなし・新規 endpoint なし。

## Issue #1116 を現状コードに最適化した点
- 原典 issue は /admin/tags を tag master CRUD 用に空きと想定していたが、現コードでは
  /admin/tags は tag QUEUE（nav id tag-queue）で占有済み。isNavItemActive の
  startsWith(href+"/") により子ルート /admin/tags/master は tag-queue と active 衝突する。
  → sibling ルート /admin/tag-master を採用（nav 衝突を構造的に回避・回帰テストで固定）。
- API は issue-1069（PATCH code/expectedCode・409 分離）/ issue-1070（reactivate/delete）で完備。
  本 PR は UI 層のみ追加し apps/api を一切変更しない。web proxy catch-all は既存転送を再利用（新規 proxy 不要）。
- read は既存 fetchTagMaster（members.ts）を再利用し、新規は updateTag（PATCH）client のみ追加。
  create は MemberTagInlineCreate に既存・delete/reactivate は別スコープ。

## 変更ファイル
- apps/web/app/(admin)/admin/tag-master/page.tsx（新規・server component）
- apps/web/src/features/admin/components/_tags/TagMasterPanel.tsx（新規）
- apps/web/src/features/admin/components/_tags/TagMasterEditForm.tsx（新規）
- apps/web/src/features/admin/api/tags.ts（新規・updateTag / parseTagUpdateErrorCode / TagUpdateError）
- apps/web/src/components/shell/shell-config.ts（編集・ShellNavItemId 拡張 + tag-master item）
- apps/web/src/components/shell/icons.tsx（編集・PATHS["tag-master"] 追加）
- apps/web/src/features/admin/api/__tests__/tags.update.spec.ts（新規・U-T1..U-T9 / U-P1）
- apps/web/src/features/admin/components/_tags/__tests__/TagMasterPanel.spec.tsx（新規・P-T1..P-T7）
- apps/web/app/(admin)/admin/tag-master/page.spec.tsx（新規・GET response shape）
- apps/web/src/components/shell/__tests__/shell-config.spec.ts（編集・Reg-N1/N2・items 10→11）
- apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx（編集・Reg-N3）
- apps/web/playwright/tests/admin-tag-master-code-edit-ui.spec.ts（新規）
- apps/web/playwright/tests/visual-staging-authenticated/admin-tag-master-authenticated.spec.ts（新規）

## AC マッピング
- AC-1 一覧→選択→編集 UI 到達: page.tsx / TagMasterPanel / TagMasterEditForm / nav（P-T1/P-T2/Reg-N1..N3）
- AC-2 expectedCode CAS で stale 検出: buildBody / updateTag（E-T1/E-T2/P-T6/P-T7）
- AC-3 409 code_conflict ≠ stale_conflict 別文言: CONFLICT_COPY（E-T4/E-T5/U-T2/U-T3）
- AC-4 label/category 更新と rename の後方互換: buildBody 差分送信（E-T3/E-T3c/U-T1c/U-T8）
- AC-5 focused tests + authenticated visual evidence: U/E/P/Reg spec + screenshots

## スクリーンショット
- outputs/phase-11/screenshots/tag-master-list.png — 一覧
- outputs/phase-11/screenshots/tag-master-edit-form.png — 編集フォーム
- outputs/phase-11/screenshots/tag-master-code-conflict.png — tag_code_conflict 表示
- outputs/phase-11/screenshots/tag-master-stale-conflict.png — tag_stale_conflict 表示
（VISUAL。authenticated staging で user-gated に capture 後、本文へ画像参照を含める。
 authenticated staging 未 capture の状態では staging 画像セクションを空のまま PR を作らない。）

## 検証コマンド
mise exec -- pnpm --filter @ubm-hyogo/web test:run \
  apps/web/src/features/admin/api/__tests__/tags.update.spec.ts \
  apps/web/src/features/admin/components/_tags/__tests__/TagMasterPanel.spec.tsx \
  apps/web/app/\(admin\)/admin/tag-master/page.spec.tsx \
  apps/web/src/components/shell/__tests__/shell-config.spec.ts \
  apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:design-tokens

## テスト結果
- tags.update / TagMasterPanel / shell-config: green（focused Vitest 3 files / 19 tests PASS）
- nav 回帰（shell-config / SidebarNavItem）: green
- typecheck / lint / verify:design-tokens / coverage-guard --group web: green

## Issue 状態
Issue #1116 は CLOSED。本 PR で再 close しない（Refs #1116 のみ使用）。

Refs #1116

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> 本タスクは **VISUAL**。`outputs/phase-11/screenshots/` に local fixture 画像 4 枚を capture 済み。authenticated staging screenshot は user-gated のため、staging 実行後に追加する。

## 5. 想定コミット分割

| # | 範囲 | 内容 |
| --- | --- | --- |
| commit 1 | 実装コード（apps/web） | `tags.ts` + `TagMasterEditForm.tsx` + `TagMasterPanel.tsx` + `page.tsx` + `shell-config.ts` + `icons.tsx` + focused tests |
| commit 2 | visual evidence | authenticated staging screenshot evidence（user-gated capture 後） |
| commit 3 | docs（workflow spec） | `docs/30-workflows/completed-tasks/issue-1116-admin-tag-master-code-edit-ui/**`（本仕様書一式・Phase 12 skill same-wave sync 含む） |

> commit 分割は PR 作成時の案であり、本サイクルでは commit/push/PR を実行しない。

## 6. PR 前の再訪手順（user 承認後）

PR 作成承認後に Phase 7-13 を再訪する手順:

1. **実装**: Phase 5 の差分方針どおり `tags.ts` → `TagMasterEditForm` → `TagMasterPanel` → `page.tsx` → `shell-config.ts` + `icons.tsx` の順で実装し、Phase 4/6 の test（U/E/P/Reg）を Green にする。
2. **Phase 7 再訪**: `coverage-guard.sh --group web`（or focused coverage）を実走し、変更ファイルの実カバレッジを Phase 7 §1 の目標と突合して実値を記録。
3. **Phase 9 再訪**: §1 DoD（focused web vitest / web typecheck / lint / verify:design-tokens / coverage-guard）を実走し §2 不変条件 grep evidence と合わせて実値を記録。
4. **Phase 11 再訪**: staging deploy（user-gated）後 authenticated で 一覧→編集→保存→409 分離 を再現し、`outputs/phase-11/screenshots/` に 4 枚 capture。`manual-test-result.md` に実走 evidence を記録（Gate-B 用 evidence）。
5. **Phase 12 再訪**: skill same-wave sync（artifact-inventory / LOGS / SKILL-changelog 等）+ unassigned-task-detection（§10.5 の MINOR を実装着地後に再判断）。`verify:phase12-compliance` / `gate-metadata:validate` 緑を確認。Gate-C を passed へ。
6. **Phase 13 実行**: §6 手順で commit / push / `gh pr create --base dev`（本文 §4・`Refs #1116`）。

### PR 作成の実行手順（user 承認後・実装完了後）

1. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
2. 作業ブランチ `docs/issue-1116-admin-tag-master-code-edit-ui-spec` に `dev` をマージ（コンフリクト時は CLAUDE.md 既定方針で自律解消）。
3. 品質検証: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. `git add -A` で全差分コミット → `git push`。
5. `gh pr create --base dev` で作成（本文は §4・`Refs #1116` のみ・`Closes` 禁止）。

## 7. 完了条件（Phase 13）

- [ ] user の明示承認を取得（承認まで実行しない）
- [ ] Gate-A/B/C 全通過 + web typecheck / lint / focused web vitest / verify:tokens / verify:no-inline-style green を確認
- [ ] （VISUAL）authenticated staging で 4 枚 screenshot を追加 capture し PR 本文へ画像参照を含める（staging 未 capture なら staging 画像セクションを空のまま PR を作らない）
- [ ] base = `dev`、タイトル = §3 案、本文 = §4（`Refs #1116` のみ・`Closes #1116` 不使用）
- [ ] PR URL を最終レポートに記録
- [ ] Issue #1116 は CLOSED 済（本ワークフローは状態変更しない）
- [ ] Phase 13 status = `pending_user_approval`（承認待ち）
