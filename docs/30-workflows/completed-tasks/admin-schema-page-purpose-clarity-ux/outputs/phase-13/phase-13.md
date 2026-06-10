# Phase 13 — PR 作成・ドキュメント更新仕様

**[実装区分: 実装仕様書]**

実装完了後の PR 作成手順を固定する。CLAUDE.md「PR 作成の完全自律フロー」と整合。**commit / push / PR 作成 / staging deploy / visual baseline 取得はすべて user-gated**（明示承認後のみ実行する）。

## 1. 前提

| 項目 | 値 |
| --- | --- |
| base ブランチ | **`dev`**（CLAUDE.md 既定。production リリース時のみ `dev → main`） |
| 作業ブランチ | `feat/admin-schema-page-purpose-clarity-ux`（dev tip 基準） |
| relatedIssue | null（staging 観察起点。close-out 時に起票要否を判断） |
| 前提クリア | Phase 4-11 の DoD（SSOT §8）すべて。focused vitest 4 spec GREEN・typecheck・lint・verify-design-tokens・API 非接触 diff 空 |
| Phase 11 evidence | local desktop/mobile screenshot captured。staging visual baseline は user-gated |

> **user-gated の徹底**: 本 Phase の push・PR 作成は user 明示承認後にのみ実行する。local implementation evidence は取得済みだが、PR 操作は実行しない。

## 2. PR 作成前検証（CLAUDE.md PR 自律フロー §実行順序）

```bash
git fetch origin dev
git checkout dev
git merge --ff-only origin/dev || git pull --ff-only origin dev
git checkout feat/admin-schema-page-purpose-clarity-ux
git merge dev   # コンフリクト発生時は dev 側採用 + 必要差分再適用 (CLAUDE.md 既定方針)

mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

全コマンド exit 0 で push 可。`verify-pr-ready.sh` が fail した場合は skill `references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 に従い解消（gate-metadata → phase12-compliance → indexes:rebuild drift の順）。

> **user-gated**: 上記コマンドの実行および push は user 明示承認後にのみ行う。

## 3. CI ゲート（正本 = `bash scripts/verify-pr-ready.sh` 3点 / SSOT §9）

| # | ゲート | 期待 |
| --- | --- | --- |
| 1 | `verify:phase12-compliance` | `ok`（9見出し逐語 + Phase 11 evidence 表） |
| 2 | `gate-metadata:validate` | ERROR 0（artifacts.json `metadata.gates` zod 準拠） |
| 3 | `indexes:rebuild` drift | 0 |

> `validate-phase-output.js` / `verify-all-specs.js` は非 CI 助言（land 済テンプレでも fail する）。CI 判定は上記3点のみ。

## 4. 正本仕様への反映

- `docs/00-getting-started-manual/specs/` の正本更新は **N/A**（表現層のコピー/CSS 追加のみ。schema / API / 認証仕様は不変）。
- 新規 primitive / design token / endpoint を追加しないため、aiworkflow-requirements skill surface への新規概念同期は最小（同 wave の `indexes:rebuild` idempotent 確認のみ）。

```bash
mise exec -- pnpm indexes:rebuild   # idempotent 確認
git diff --stat .claude/skills/aiworkflow-requirements docs/30-workflows/LOGS.md
```

## 5. PR 本文テンプレート（`.claude/commands/ai/diff-to-pr.md` 準拠）

> `outputs/phase-12/implementation-guide.md` が存在する場合、その主要見出しと内容を本文へ反映する。

```markdown
## Summary

- `/admin/schema`（スキーマ差分のレビュー）の **目的・操作の流れ・得られる結果が伝わらない情報設計の問題** を表現層のみで解消
- 新規 `SchemaPurposeExplainer`（できること + 3ステップ流れ図 + 結果プレビュー + 用語集）を AdminPageHeader 直下に常時表示
- 用語の言い換えを純データ `schemaGlossary.ts` に SSOT 集約し、統計ラベル/hint・履歴見出し・diff カテゴリ説明・割り当てアウトカム・0件 empty コピーを平易日本語主・技術名併記へ更新
- **既存 API endpoint surface / D1 schema / Google Form 仕様 / useAdminMutation 本体は不変**（CLAUDE.md 不変条件 #5 遵守。`git diff --stat -- apps/api packages/shared` が空）
- 色は OKLch トークン経由（HEX 直書き 0 件 / `verify-design-tokens` 緑）

## 変更スコープ

- Lane A（目的説明・用語）: `apps/web/src/components/admin/SchemaPurposeExplainer.tsx`（新規）, `apps/web/src/components/admin/schemaGlossary.ts`（新規）, 各 spec（新規）, `apps/web/app/(admin)/admin/schema/page.tsx`（header description + explainer 設置）
- Lane B（操作の意味）: `apps/web/src/components/admin/SchemaDiffPanel.tsx`（カテゴリ説明 / アウトカム / empty コピー追加・ロジック不変）, `SchemaDiffPanel.component.spec.tsx`
- Lane C（統計/履歴の文脈化 + CSS）: `apps/web/app/(admin)/admin/schema/page.tsx`（統計/履歴ラベル平易化）, `page.spec.tsx`, `apps/web/src/styles/globals.css`（`.schema-purpose-card` 等 OKLch クラス追加）
- docs: `docs/30-workflows/completed-tasks/admin-schema-page-purpose-clarity-ux/**`（Phase 1-13 + evidence）

## Screenshots

`docs/30-workflows/completed-tasks/admin-schema-page-purpose-clarity-ux/outputs/phase-11/screenshots/` の local runtime PNG を本文中に参照:

- `schema-purpose-explainer-default.png`
- `schema-stats-plain-labels.png`
- `schema-diff-assign-outcome.png`
- `admin-schema-purpose-clarity-mobile-runtime.png`

`schema-empty-state.png` は fixture 不在のため semantic PASS（`SchemaDiffPanel.component.spec.tsx`）として記録。

## Test plan

- [ ] `pnpm --filter @ubm-hyogo/web typecheck` exit 0（AC-9）
- [ ] `pnpm lint` exit 0（AC-9）
- [ ] focused vitest 4 spec exit 0（AC-1,2,3,4,5,6）
- [ ] `pnpm --filter @ubm-hyogo/web verify-design-tokens` exit 0（AC-8 / HEX 0）
- [ ] `git diff --stat -- apps/api packages/shared` が空（AC-7 / API・D1・Form 非接触）
- [ ] `bash scripts/verify-pr-ready.sh` exit 0（CI 3ゲート）
- [x] local `/admin/schema` で目的説明カード常時表示 / 統計平易ラベル / アウトカム表示を desktop/mobile 目視
- [ ] staging Playwright 視覚ベースライン取得 — user-gated

## 受入条件（AC-1..9）

Phase 1 §1.4 の AC-1..9 を満たす。AC 充足判定は `outputs/phase-10/phase-10.md` §10.2 を参照。

## Follow-ups

- FU-SCHEMA-01: ガイド付きフルウィザード再設計（OOS baseline 候補 / Phase 10 MN-3）。今サイクル外・別検討。

## Phase 11 evidence

`docs/30-workflows/completed-tasks/admin-schema-page-purpose-clarity-ux/outputs/phase-11/` 配下に実績一式（`phase-11.md` / `manual-test-result.md` / `screenshot-plan.json` / `phase11-capture-metadata.json` / `evidence/*.log` / `screenshots/*.png`）。staging screenshot のみ user-gated。
```

## 6. PR 作成コマンド（user-gated）

```bash
gh pr create --base dev \
  --title "feat(admin-schema): /admin/schema の目的・流れ・成果が伝わる情報設計へ整える" \
  --body "$(cat <<'EOF'
…上記テンプレート…
EOF
)"
```

## 7. PR 後の追加対応（user-gated）

- visual baseline 4 枚を実装後に取得し、本 PR または follow-up で同 canonical 名のまま追加する。
- `docs/30-workflows/LOGS.md` に本ワークフロー root の 1 行を追加（本 PR に含める）。
- merge 後、close-out 判断で MN-3（フルウィザード OOS）の follow-up Issue 起票要否を user に確認する（relatedIssue=null のため自動起票しない）。

## 8. リリース後検証（staging）— user-gated

merge → dev → staging deploy 後:

```bash
# /admin/schema 表示確認（bearer mint 済 admin cookie）
curl -i https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/schema
#   -> 200 (admin cookie) / 302 (cookie 無し)。

# 目視:
#   - 目的説明カード（できること + 3ステップ流れ図 + 結果プレビュー + 用語集）が常時表示
#   - 統計4枚が平易ラベル + 次アクション示唆
#   - 割り当てフォーム展開でアウトカム説明
#   - 差分0件で empty コピー
```

production 反映は `dev → main` リリースサイクルで実施。

## 9. DoD

- [ ] §2 PR 作成前検証コマンドすべて exit 0
- [ ] §3 CI 3ゲートすべて緑
- [ ] §4 skill sync + indexes:rebuild idempotent
- [ ] §5 PR 本文が全項目埋まっている（実装後の Test plan チェック反映）
- [ ] §6 PR 作成は user 明示承認後
- [ ] §7 visual baseline 4 枚 + LOGS.md 追記が同 PR（または follow-up）に含まれる
- [ ] §8 staging 検証が user 承認済み
- [ ] PR URL が user に共有される

## 10. 参照

- CLAUDE.md「PR 作成の完全自律フロー」
- `outputs/phase-10/phase-10.md`（AC 充足判定 / blocker なし）
- `outputs/phase-11/phase-11.md`（視覚証跡計画 / canonical 4 名）
- `outputs/phase-12/implementation-guide.md`（実装ハンドブック）
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
