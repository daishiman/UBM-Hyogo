# Phase 13: PR 作成

> **[実装区分: 実装仕様書]**

> **ユーザーの明示承認後のみ実施する。**
> 本 Phase（commit / push / `gh pr create`）は実装サイクル（Phase 4-12）完了後、
> ユーザーが「PR を出してください」と指示した時点で実行する。
> `implemented_local_evidence_captured` 到達後も、ユーザー承認なしの先行実行は禁止。
> commit / push / PR / staging deploy / Issue mutation はすべて **user-gated**。

---

## 13.1 PR 基本情報

| 項目 | 値 |
|------|-----|
| base ブランチ | `dev` |
| 作業ブランチ | `feat/issue-1039-admin-audit-identity-action-presets` |
| PR タイトル例 | `feat(admin-audit): identity action presets via datalist on /admin/audit` |
| 関連 Issue | #1039（**CLOSED**。PR 文脈は `Refs #1039` のみ。close しない） |

---

## 13.2 PR 作成前チェックリスト

```bash
# 1. 未コミット変更がないこと
git status --porcelain

# 2. typecheck
mise exec -- pnpm typecheck

# 3. lint
mise exec -- pnpm lint

# 4. build
mise exec -- pnpm build

# 5. targeted test（リポジトリルートから）
mise exec -- pnpm vitest run \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/app/(admin)/admin/audit/page.page.spec.ts

# 6. verify-pr-ready（Phase 12 compliance / gate-metadata / indexes drift 一括確認）
bash scripts/verify-pr-ready.sh

# 7. PR 対象ファイル一覧確認
git diff dev...HEAD --name-only
```

> 品質検証失敗時は最大 3 回自動修復し、修復差分を新規 commit でまとめる（`--amend` 禁止）。

---

## 13.3 Phase 11 screenshot の PR 本文反映ルール

- `outputs/phase-11/screenshots/` に png が存在する場合 → PR 本文の **Phase 11 Evidence** セクションに canonical 名を列挙。
  - `![audit-action-filter-datalist-open](outputs/phase-11/screenshots/audit-action-filter-datalist-open.png)` 形式で参照。
- screenshot が user-gated 未取得（VISUAL_ON_EXECUTION 未撮影）の場合 → セクション全体を**省略**し、代わりにテスト計画の component / page test PASS を証跡として残す（空セクションを残さない）。

---

## 13.4 PR 本文テンプレート

```markdown
## Summary

- `/admin/audit` の action フィルタに HTML5 `<datalist>`（id=`audit-action-presets`）を追加し、`identity.merge` / `identity.dismiss` をクリックで選べる入力補助を提示（Issue #1039 AC-1）
- action `<Input>` に native `list` 属性を付与（Input primitive 無変更・`...props` 透過）
- `buildAuditHref` / `name="action"` / URL query 契約 / server component は無変更（AC-2 / AC-4）
- 任意 action の自由入力は退化なし（AC-3）

## 受入条件（AC 照合）

| AC | 内容 | 確認方法 |
|----|------|---------|
| AC-1 | identity action のプリセット提示 UI | `AuditLogPanel.component.spec.tsx`（datalist option 存在 assert） |
| AC-2 | URL query 維持 + SSR 初期表示で選択状態復元 | `page.page.spec.ts`（`?action=identity.dismiss` 復元） |
| AC-3 | 任意 action 入力の非退化 | `AuditLogPanel.component.spec.tsx`（自由入力維持 assert） |
| AC-4 | pagination が action filter を保持 | `buildAuditHref` 無変更（既存 spec 非退化） |
| AC-5 | tests green | targeted `vitest run` PASS |

## テスト計画

- [ ] `mise exec -- pnpm vitest run apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx apps/web/app/(admin)/admin/audit/page.page.spec.ts`
- [ ] `mise exec -- pnpm typecheck && mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm build`
- [ ] `bash scripts/verify-pr-ready.sh`
- [ ] staging での datalist 提示 / SSR 復元の目視確認（user-gated）

## Phase 11 Evidence

<!-- 実装サイクルで screenshot 撮影後、ここに canonical 名を列挙 -->
<!-- 未撮影（user-gated pending）の場合は本セクション全体を削除する -->

Related to #1039

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> commit message / PR 本文では `Closes #1039` を使わず、`Refs #1039` / `Related to #1039` のみを使う。

---

## 13.5 runtime ops 手順（user-gated）

> **本タスクは純粋 UI 改修で、Cloudflare bucket / secret / D1 migration を一切伴わない。** runtime ops は staging deploy と目視確認のみ。

```bash
# staging web deploy（user 承認後）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

# staging での目視確認（Phase 11 チェックリスト実施）
#   /admin/audit を admin session で開き、datalist 提示 / ?action=... 復元を確認
```

> production 反映は PR マージ後にユーザー承認を得てから `--env production` で実施する。D1 backup / migration は不要。

---

## 13.6 Issue #1039 との関係

- Issue #1039 は GitHub 実状態 **CLOSED**。本 workflow では **Issue mutation（close / reopen / comment）を一切行わない**。
- PR 文脈は `Refs #1039` / 本文末尾 `Related to #1039` のみ。`Closes #1039` は使わない。
- ユーザー依頼の文言は「クローズドのまま」だが、実態は CLOSED。Issue の状態変更はユーザー明示指示後のみ行う。

---

## 13.7 CI ゲート一覧

| Gate | Job 名 |
|------|--------|
| 型チェック | `typecheck` |
| lint | `lint` |
| テスト suffix 検証 | `verify-test-suffix`（`*.test.*` が無いこと） |
| design token 検証 | `verify-design-tokens`（HEX 直書きが無いこと） |
| Phase 12 compliance | `verify-phase12-compliance` |
| indexes drift | `verify-indexes-up-to-date` |

---

## 13.8 user-gated 操作一覧

| 操作 | gate |
|------|------|
| commit | user-gated（ユーザー承認後） |
| push | user-gated |
| `gh pr create --base dev` | user-gated |
| staging deploy（`cf.sh deploy --env staging`） | user-gated |
| production deploy | PR マージ後 user-gated |
| Issue #1039 の close / comment | **行わない**（CLOSED 維持） |

---

## 完了条件（Phase 13 / Gate-C）

- [ ] `git status --porcelain` が空（全変更がコミット済み）
- [ ] `git diff dev...HEAD --name-only` で PR 含有ファイル一覧を確認済み
- [ ] PR 対象が `apps/web`（AuditLogPanel + 2 spec）と docs のみで、`apps/api` / migrations を含まないこと
- [ ] `bash scripts/verify-pr-ready.sh` が PASS
- [ ] `gh pr create --base dev` が成功し PR URL が発行されている
- [ ] PR 本文に `implementation-guide.md` の主要内容（AC 照合 / 変更概要）が反映されている
- [ ] Phase 11 screenshot が存在する場合は PR 本文に参照が含まれている（未取得時はセクション省略）
- [ ] Issue #1039 が `Refs #1039`（close しない・CLOSED 維持）でリンクされている
- [ ] staging deploy はユーザー承認後のみ実施している
- [ ] Issue mutation を一切行っていない

## メタ情報
workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
実装・検証完了後、ユーザー承認を得て commit、push、PR を行う（Issue mutation はしない）。

## 実行タスク
- PR 前チェックを実行する。
- ユーザー承認後に commit、push、PR 作成を行う。

## 参照資料
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`

## 成果物
- Phase 13 PR runbook
