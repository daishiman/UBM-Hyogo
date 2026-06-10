# Phase 13: commit / PR / release

## メタ情報

- task_id: `admin-members-timestamp-jst-and-identity-label-clarity`
- workflow_state: `implemented_local_evidence_captured` → Phase 13 は `pending_user_approval`
- 本 Phase の状態: **BLOCKED（pending_user_approval）**
  - 前提: 実装（F1-F5）・focused vitest・local screenshot は完了済み。user 明示承認で本 Phase を実施する。

## 目的

user 明示承認後に commit / push / PR を作成し、`dev` ブランチへ変更を統合する。
Claude Code は自律的に実行しない。

## ブロック理由

本 workflow は `implemented_local_evidence_captured` であり、apps/web の helper / SSOT / コンポーネント差し替え（F1-F5）と
focused vitest（T1-T5）はまだ実コードへ反映していない。以下の条件がすべて揃うまで Phase 13 の実行を禁止する:

| 前提条件 | 状態 |
| --- | --- |
| 仕様書 Phase 1-13 authored | done（本サイクル） |
| AC-1..AC-11 実装完了（apps/web の helper / SSOT / 3 コンポーネント差し替え + 5 テスト） | pending（後続 03.実装.md） |
| focused vitest が green | PASS（5 files / 41 tests） |
| local visual evidence | PASS（Playwright 1 test / 3 PNG） |
| `pnpm typecheck && pnpm lint && pnpm verify:tokens` が green | pending（PR 前 gate） |
| `git diff --name-only -- apps/api` が空（AC-10） | pending |
| Phase 11 pixel screenshot 取得済み（staging 認証済み） | pending（user-gated） |
| Phase 12 strict 7 実体確認済み | present（本 Phase 12 で完成） |

## user-gated 操作一覧

以下の操作は **すべてユーザーの明示承認が必要**。Claude Code が自律的に実行しない。

| 操作 | ゲート種別 |
| --- | --- |
| 実装（F1-F5）の実コード反映 | user-gated（後続 03.実装.md） |
| focused vitest の実行 | user-gated |
| `git add` / `git commit` | user-gated |
| `git push origin feat/admin-members-timestamp-jst-and-identity-label-clarity` | user-gated |
| `gh pr create --base dev ...` | user-gated |
| staging 視覚確認・pixel screenshot 取得 | user-gated |

## 実行順序（承認後）

1. **ローカル品質確認**（全 green を確認してから commit）
   ```bash
   mise exec -- pnpm typecheck
   mise exec -- pnpm lint
   mise exec -- pnpm verify:tokens
   mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
     apps/web/src/lib/format/__tests__/datetime.spec.ts \
     apps/web/src/features/admin/components/_members/__tests__/memberSystemFieldGlossary.spec.ts \
     apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx \
     apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx \
     apps/web/src/features/admin/components/_members/__tests__/MemberDiagnosticsPanel.spec.tsx
   git diff --name-only -- apps/api  # 空であること（AC-10）
   ```

2. **コミット粒度**（4 単位）

   | # | 粒度 | 含むファイル例 |
   | --- | --- | --- |
   | 1 | spec（仕様書本体） | `docs/30-workflows/completed-tasks/admin-members-timestamp-jst-and-identity-label-clarity/phase-*.md` / `shared-context.md` / `index.md` |
   | 2 | outputs（Phase 12 strict 7） | `outputs/phase-12/*.md` / `outputs/artifacts.json` |
   | 3 | impl（apps/web 実装 + テスト） | `apps/web/src/lib/format/datetime.ts` / `apps/web/src/features/admin/components/_members/**` |
   | 4 | Phase 11 visual evidence | `outputs/phase-11/screenshots/*.png` / `outputs/phase-11/manual-test-result.md` / `artifacts.json` 最終更新 |

3. **PR 作成**

   ```bash
   gh pr create \
     --base dev \
     --title "fix(admin): 会員管理の最終更新を JST 化・IDENTITY/DIAGNOSTICS を日本語ラベル化" \
     --body "$(cat <<'EOF'
   ## Summary

   - 会員管理一覧の「最終更新」列を ISO 生表示から JST 漢字表記（例: 2026年6月9日 19:34:19）へ是正（AC-1）
   - 日時整形を新 helper `formatJstDateTimeWithSeconds` に集約。不正値・空文字は元入力をそのまま返す fail-soft（AC-2）
   - 詳細ドロワー IDENTITY を日本語ラベル主・英語キー併記へ。真偽値は「はい/いいえ」（AC-3/AC-4）
   - DIAGNOSTICS を日本語ラベル主・英語キー併記へ。真偽値は「はい/いいえ」（AC-5/AC-6）
   - 英語キー→日本語ラベル + 真偽値日本語化を新規 SSOT `memberSystemFieldGlossary.ts` に集約（AC-7）
   - セクション見出しも日本語化（本人情報（システム項目） / 診断情報）（AC-8）
   - 色はすべて var(--ubm-color-*) 経由のみ（AC-9）
   - apps/api / D1 migration / Google Form schema 無変更（AC-10）
   - 英語キー文字列は併記で DOM に残し既存テストを破壊しない（AC-11）

   ## 変更ファイル（実装 5 + テスト 5）

   - apps/web/src/lib/format/datetime.ts（helper 追加）
   - apps/web/src/features/admin/components/_members/memberSystemFieldGlossary.ts（新規 SSOT）
   - apps/web/src/features/admin/components/_members/MembersTable.tsx
   - apps/web/src/features/admin/components/_members/MemberDrawer.tsx
   - apps/web/src/features/admin/components/_members/MemberDiagnosticsPanel.tsx
   - apps/web/src/lib/format/__tests__/datetime.spec.ts
   - apps/web/src/features/admin/components/_members/__tests__/memberSystemFieldGlossary.spec.ts
   - apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx（追記）
   - apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx（新規）
   - apps/web/src/features/admin/components/_members/__tests__/MemberDiagnosticsPanel.spec.tsx（新規）

   ## スクリーンショット

   pixel screenshot は staging 認証済み環境で取得する（**user-gated**）。
   取得後に outputs/phase-11/screenshots/ に追記し PR に参照を含める。

   ## 参照

   - task_id: admin-members-timestamp-jst-and-identity-label-clarity
   - 実装仕様: docs/30-workflows/completed-tasks/admin-members-timestamp-jst-and-identity-label-clarity/
   EOF
   )"
   ```

## 完了条件

- `gh pr create` が成功し PR URL が取得できること
- PR CI（typecheck / lint / verify-design-tokens / verify-test-suffix）が green であること
- `outputs/phase-13/pr-info.md` に PR URL / CI 結果 / commit SHA を記録すること
- `outputs/phase-13/pr-creation-result.md` に実行ログを記録すること

## 参照資料

| 種別 | Path |
| --- | --- |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 11 手動テスト計画 | `phase-11-manual-test.md` |
| artifacts | `artifacts.json` |
