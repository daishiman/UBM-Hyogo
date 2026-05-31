# Phase 13: PR 作成

> workflow: `issue-981-admin-members-table-list-enrichment`
> task type: UI task / VISUAL_ON_EXECUTION
> workflow_state: `implemented_local_evidence_captured`

## 1. 最重要: user-gate（最上段）

**commit / push / PR 作成 / staging deploy はすべて、ユーザーの明示承認後のみ実行する。** 本サイクルでは local implementation と test evidence まで完了しているが、外部状態を変える操作は user-gated のまま維持する。

## 2. base / branch 方針

- PR base は **`dev`**（CLAUDE.md デフォルト。`main` への PR は production リリース時のみ）。
- PR ブランチ名は `feat/issue-981-admin-members-table-list-enrichment` を想定。
- 本 spec 作成ブランチは `docs/...` 系であり、PR とは別管理。

## 3. pre-flight（PR 作成前の品質検証）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

- 加えて UI 変更のため `verify-design-tokens` 相当（HEX 直書きゼロ）を確認する。
- targeted spec: `mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx`。
- 失敗時は最大 3 回まで自動修復し、修復差分をコミットする（typecheck / lint --fix 優先）。

## 4. PR 本文骨子

- **背景**: Issue #981（OPEN）を現コードへ最適化した結果、データ層（API / shared schema）は #968 で実装済・変更禁止。残課題は `/admin/members` list response の既存 enrichment フィールド（occupation / ubmZone / ubmMembershipType / tags）を UI に描画する **AC-2 のみ**。
- **変更点**: `MembersTable.tsx` の enrichment 描画。(1) メンバー列に occupation small text、(2)「区画/ステータス」列に zone chip(`zoneTone`)+type chip(`statusTone`) を additive 追加（既存 `MemberStateChipRow` 維持）、(3) タグ列 placeholder「—」を tag pill（最大2件 + `+N`、空なら「未タグ」warning chip）へ置換。`Chip` / `zoneTone` / `statusTone` 再利用・新規 primitive ゼロ。
- **テスト結果**: TC-MT-06〜13 GREEN + 既存 TC-MT-01〜05 / a11y violations 0 維持 / typecheck green。
- **Phase 11 screenshot 参照**: `admin-members-table-enriched.png` / `admin-members-table-untagged.png` を本文に参照（`outputs/phase-11/` 配下に画像がある場合のみ）。
- **Issue 言及**: `Closes #981`（**ただし user 承認後**。Issue の reopen / close / 本文最適化反映は user-gated。本ワークフローは Issue state を変更しない）。

## 5. PR 作成コマンド（user 承認後のみ）

```bash
# user 承認後にのみ実行
gh pr create --base dev --title "feat(admin): #981 MembersTable list enrichment 描画" --body-file <pr-body>
```

## 6. 最終レポート（PR 作成完了後 1 回）

PR URL / 採用ブランチ / 実行した自動修復 / 解消したコンフリクト / 残課題（M-1 no-task 判定 / M-2 解消済み）を 1 回だけ報告する。

## 完了条件

- [ ] commit/push/PR/staging deploy が user-gated である旨が最上段に明記された
- [ ] PR base が `dev`・実装ブランチ `feat/issue-981-...` 想定が記された
- [ ] pre-flight 4 コマンド（install --force / typecheck / lint / verify-pr-ready.sh）が記された
- [ ] PR 本文骨子（背景 / 変更点 / テスト結果 / Phase 11 screenshot / `Closes #981`）が定義された
- [ ] `Closes #981` および Issue state 変更が user 承認後である旨が明記された
- [ ] 最終レポート要件が記された
