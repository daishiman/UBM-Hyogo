# Phase 13: commit / PR / release

## メタ情報

- task_id: `admin-audit-log-ux-clarity-and-reduce-error-fix`
- workflow_state: `implemented_local_evidence_captured` → Phase 13 は `pending`
- 本 Phase の状態: **BLOCKED（pending）**
  - 前提: 本サイクルで AC-1..AC-10 のローカル実装と focused tests が完了し、runtime screenshot は user-gated pending であること
- base ブランチ: `dev`（既定。production リリース時のみ `main`）
- branch: `feat/admin-audit-ux-clarity-and-error-fix`

## 目的

実装完了後に commit / push / PR を作成し、`dev` ブランチへ変更を統合する。
本 Phase は **user 明示承認後にのみ実行**する。本 spec 作成 wave では実行しない。

## ブロック理由

本 workflow は `implemented_local_evidence_captured` であり、`apps/web` の実コード・focused tests・typecheck/lint/token gate は完了済み。
以下の外部操作条件がすべて揃うまで Phase 13 の実行を禁止する:

| 前提条件 | 状態 |
| --- | --- |
| AC-1..AC-10 実装完了（apps/web の TSX・純関数・CSS・テスト） | done（local implementation and focused tests） |
| focused vitest 6本が green | done（6 files / 59 tests PASS） |
| `pnpm typecheck && pnpm lint && pnpm verify:tokens` が green | done |
| `git diff --name-only -- apps/api` が空（AC-8） | done |
| Phase 11 pixel screenshot 取得済み | pending（user-gated） |
| Phase 12 strict 7 実体確認済み | present（本 Phase 12 で完成） |

## user-gated 操作一覧

以下の操作は **すべてユーザーの明示承認が必要**。Claude Code が自律的に実行しない。

| 操作 | ゲート種別 |
| --- | --- |
| `git add` / `git commit` | user-gated |
| `git push origin feat/admin-audit-ux-clarity-and-error-fix` | user-gated |
| `gh pr create --base dev ...` | user-gated |
| staging 視覚確認・pixel screenshot 取得 | user-gated |

## 実行順序（承認後）

1. **ローカル品質確認**（全 green を確認してから commit）
   ```bash
   mise exec -- pnpm typecheck
   mise exec -- pnpm lint
   mise exec -- pnpm verify:tokens
   mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
     apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
     apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx \
     apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \
     apps/web/src/components/admin/__tests__/AuditPurposeGuide.spec.tsx \
     apps/web/src/components/admin/__tests__/auditErrorMessage.spec.ts \
     apps/web/src/components/admin/__tests__/TagCatalogPanel.reduce-guard.spec.tsx
   git diff --name-only -- apps/api  # 空であること（AC-8）
   ```

2. **コミット粒度**（5 単位）

   | # | 粒度 | 含むファイル例 |
   | --- | --- | --- |
   | 1 | spec（仕様書本体） | `docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/phase-*.md` / `index.md` |
   | 2 | outputs（Phase 12 strict 7 + Phase 11 ledger） | `outputs/phase-12/*.md` / `outputs/phase-11/*` |
   | 3 | impl Lane A/B（監査ログ表現層） | `AuditLogPanel.tsx` / `AuditLogCard.tsx` / `auditAppliedFilters.ts` / `AuditPurposeGuide.tsx` / `auditGlossary.ts` / `auditErrorMessage.ts` / `audit/page.tsx` / `globals.css` |
   | 4 | impl Lane C（reduce 防御）+ tests | `TagCatalogPanel.tsx` / `catalog/page.tsx`（必要時）/ `__tests__/*.spec.*` |
   | 5 | Phase 11 visual evidence | `outputs/phase-11/screenshots/*.png` / `outputs/phase-11/manual-test-result.md` 更新 |

3. **PR 作成**

   ```bash
   gh pr create \
     --base dev \
     --title "feat(admin): 監査ログ /admin/audit UI/UX 情報設計刷新 + catalog reduce エラー根絶" \
     --body "$(cat <<'EOF'
   ## 背景

   staging `/admin/audit` で 2 案件が報告された:
   1. 監査ログの UI/UX が見にくく「何をする画面か・何が絞り込まれているか・各ログで誰が何をしたか」が伝わらない（apps/web 表現層の情報設計欠如。API/D1/Form は無罪）。
   2. コンソールに `TypeError: Cannot read properties of undefined (reading 'reduce')`（真因は `/admin/tags/catalog` の `TagCatalogPanel` props 防御欠如。admin 共通 error boundary で別画面でも表面化）。

   ## 変更（apps/web 表現層に閉じる・3 レーン）

   - **Lane A**: 結果 4 列テーブルを**カード型タイムライン**へ刷新（`AuditLogCard`）。各ログ 1 カードで「日時/実行者/action/対象/バッチ/▸変更内容」を表示（AC-1）。`appliedFilters` を上部チップ列で可視化（`toAppliedFilterChips`・未指定時「なし（直近N件）」）（AC-2）。
   - **Lane B**: 「この画面でできること」+ 用語ガイドを**常時表示**（`AuditPurposeGuide` / `auditGlossary` 用語 SSOT）（AC-3）。API エラーを親切な日本語 + 対処ヒントへ（`toAuditErrorView`・404/期間/cursor/generic 分岐）（AC-4）。action/targetType に datalist 拡充（AC-5）。
   - **Lane C**: `TagCatalogPanel` の props 防御ガード（`initial?.items ?? []` / `?? 0`）で reduce クラッシュを根絶（AC-6）+ 回帰 spec。

   ## AC

   - AC-1 カード型タイムライン / AC-2 appliedFilters 可視化 / AC-3 目的・用語ガイド常時表示 / AC-4 エラー親切化 / AC-5 datalist / AC-6 reduce 根絶 / AC-7 既存純関数シグネチャ・既存テスト維持 / AC-8 `apps/api` 非変更 / AC-9 HEX ゼロ・OKLch のみ / AC-10 typecheck/lint/vitest 緑。

   ## 検証コマンド

   \`\`\`bash
   mise exec -- pnpm typecheck
   mise exec -- pnpm lint
   mise exec -- pnpm verify:tokens
   mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \\
     apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \\
     apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx \\
     apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \\
     apps/web/src/components/admin/__tests__/AuditPurposeGuide.spec.tsx \\
     apps/web/src/components/admin/__tests__/auditErrorMessage.spec.ts \\
     apps/web/src/components/admin/__tests__/TagCatalogPanel.reduce-guard.spec.tsx
   git diff --name-only -- apps/api  # 空であること
   \`\`\`

   ## apps/api 非変更

   既存 endpoint surface（`apps/api/src/routes/admin/audit.ts` / `tags.ts`）のみ利用。新 endpoint・D1 schema・Google Form 仕様の変更なし（AC-8）。`appliedFilters` は既存型・既存 API に存在し UI 可視化のみ追加。

   ## スクリーンショット

   pixel screenshot は staging 認証済み環境で取得する（**user-gated**）。取得後に \`outputs/phase-11/screenshots/\` に追記し PR に参照を含める。

   ## 参照

   - task_id: \`admin-audit-log-ux-clarity-and-reduce-error-fix\`
   - 実装仕様: \`docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/\`
   - 実装ガイド: \`outputs/phase-12/implementation-guide.md\`

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
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
