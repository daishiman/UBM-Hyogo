# Phase 13: PR・振り返り

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 1〜12 で完成した primitive / hook / CSS / テスト / visual evidence / docs 同期を 1 PR にまとめ、`dev` ブランチへのマージ準備を完了させる最終 Phase。実 git 操作と `gh pr create` を伴う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 名称 | PR・振り返り |
| タスク | parallel-09-ux-cross-cutting (G9-1〜G9-9) |
| GitHub Issue | parallel-09-ux-cross-cutting (UI prototype alignment MVP recovery 配下) |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 状態 | pending |
| タスク種別 | implementation / **VISUAL** |

---

## 目的

Phase 1〜12 の全成果物（コード + テスト + visual evidence + 設計書 + skill 同期 + ui-primitives.md / SCOPE.md 追記）を 1 PR に集約し、`dev` ブランチへのマージ準備を完了させる。

> ⚠️ **承認ゲート**: CLAUDE.md「PR作成の完全自律フロー」が適用される依頼（「PR作成」「PR出して」「diff-to-pr」等）の場合は確認質問を挟まず実行する。それ以外はユーザーから明示承認を得てから実行する。

---

## 13-1. PR 基本情報

| 項目 | 値 |
| --- | --- |
| PR タイトル | `feat(web): unify UX primitives across 19 routes (parallel-09 G9-1..G9-9)` |
| ベースブランチ | `dev`（CLAUDE.md「既定ブランチは dev」遵守） |
| 作業ブランチ | `feat/parallel-09-ux-cross-cutting`（または同等の slug） |
| PR 種別 | feature（コード実装あり / **VISUAL**） |
| 関連 Issue | ui-prototype-alignment-mvp-recovery 親 workflow（Refs として参照） |

---

## 13-2. 実行手順

### ステップ 1: ローカルチェック

```bash
# 全体型チェック / Lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# apps/web ユニットテスト + a11y + visual
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web test:a11y
mise exec -- pnpm --filter @ubm-hyogo/web test:visual

# HEX 直書き grep gate
grep -rEn 'bg-\[#|text-\[#|border-\[#|focus:\[#' apps/web/src && echo "FAIL" || echo "OK"

# spec 命名規約
find apps/web/src -name "*.test.ts" -o -name "*.test.tsx" | wc -l
# 期待: 0

# api 不変
git diff dev...HEAD --name-only | grep -E "^apps/api/|wrangler\.toml$|migrations/|schema\.sql$"
# 期待: 0 件

# 新規 / 編集ファイル変更確認
git status
git diff dev...HEAD --name-only

# mirror parity（.claude ↔ .agents）
diff -r .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements 2>/dev/null | head
# 期待: 差分なし
```

### ステップ 2: 変更ファイル確認

確認:
- コード変更（`apps/web/`）と docs / skill 同期 / SCOPE.md 追記が含まれている
- `apps/api/` 配下に変更がない
- wrangler.toml / D1 schema に変更がない
- HEX 直書き / 機密値（実 API キー等）が含まれていない
- 12 PNG visual evidence が `outputs/phase-11/screenshots/` にコミットされている

### ステップ 3: コミット整理

| # | コミットメッセージ |
| --- | --- |
| 1 | `feat(web): add FormField primitive with aria-invalid injection (G9-1)` |
| 2 | `feat(web): extend EmptyState with optional icon/title/description/action props (G9-2)` |
| 3 | `feat(web): add Pagination primitive supporting cursor-only mode (G9-3)` |
| 4 | `feat(web): add Icon primitive with sm/md/lg/xl size convention (G9-4)` |
| 5 | `feat(web): add admin Breadcrumb primitive with aria-current support (G9-5)` |
| 6 | `feat(web): add focus-visible / motion-reduce / responsive rules in @layer components (G9-6/7)` |
| 7 | `feat(web): add concurrent mutation guard + form state preserve in useAdminMutation (G9-8/9)` |
| 8 | `test(web): cover 4 primitives + EmptyState + useAdminMutation with vitest + jest-axe` |
| 9 | `test(web): add Playwright visual snapshots for 6 primitive scenarios (1x + 2x)` |
| 10 | `docs(specs): add ui-primitives.md reference for parallel-09 primitives` |
| 11 | `docs(parallel-09): finalize phase 09-13 source-of-truth sync` |

### ステップ 4: push と PR 作成

```bash
git push -u origin feat/parallel-09-ux-cross-cutting

gh pr create --base dev --title "feat(web): unify UX primitives across 19 routes (parallel-09 G9-1..G9-9)" --body "$(cat <<'EOF'
## Summary

- 19 routes 横断で利用される UX primitive を `apps/web/src/components/ui/` および `apps/web/src/components/admin/` 配下に統一実装
- 4 primitive 新規（FormField / Pagination / Icon / Breadcrumb）+ EmptyState 拡張 + useAdminMutation 編集
- `apps/web/src/styles/globals.css` `@layer components` に form validation / responsive / focus-visible / motion-reduce 規則を追記し、parallel-03 と section コメントで物理位置分離
- API 変更 0 / D1 schema 変更 0 / wrangler.toml 変更 0 / HEX 直書き 0
- 6 種 × 2 scale = 12 Playwright visual snapshot を evidence として固定

## 設計判断

- **YAGNI 適用**: `apps/web/src/lib/` への helper 切り出しは行わず、各 primitive ファイル内 module-local で完結
- **後方互換維持**: EmptyState は新規ではなく optional props 拡張（既存 caller 5 箇所無修正）
- **parallel-03 共存**: globals.css に `/* === parallel-09 G9-* === */` section コメントで物理分離し、merge conflict を予防
- **cursor-only 対応**: Pagination の `total?` を optional にし、cursor-based API endpoint にも適用可能
- **Icon 実装**: `<span style={fontSize}>` で SVG ライブラリ依存を増やさず既存 icons.ts と組合せ
- **mutation guard**: `isLoading` 中の 2nd call を toast + reject で D1 への duplicate write 防止
- **visual scale**: 1x + 2x の 2 scale 取得で Retina 環境の antialiasing 差異を回避
- **fixture page**: `/visual-harness/` 配下に隔離 + production ガードで本番漏れ防止

## 変更ファイル

### apps/web（新規）
- `src/components/ui/FormField.tsx` — G9-1 form validation primitive
- `src/components/ui/Pagination.tsx` — G9-3 pagination primitive
- `src/components/ui/Icon.tsx` — G9-4 icon size convention
- `src/components/admin/Breadcrumb.tsx` — G9-5 breadcrumb primitive
- `src/components/ui/__tests__/{FormField,EmptyState,Pagination,Icon}.spec.tsx`
- `src/components/admin/__tests__/Breadcrumb.spec.tsx`
- `src/lib/__tests__/useAdminMutation.spec.ts`
- `tests/visual/parallel-09-primitives.spec.ts`
- `app/visual-harness/[name]/page.tsx`（production ガード付）

### apps/web（編集）
- `src/components/ui/EmptyState.tsx` — G9-2 optional props 拡張（後方互換維持）
- `src/lib/useAdminMutation.ts` — G9-8/9 mutation guard + form state preserve
- `src/styles/globals.css` — G9-1/6/7 CSS layer + parallel-09 section コメント整理

### docs / 仕様
- `docs/00-getting-started-manual/specs/ui-primitives.md` — primitive リファレンス（新規）
- `docs/00-getting-started-manual/specs/design-tokens.md` — token 不足時のみ feedback 追記（条件付）
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` — primitive 提供シグナル追記
- `docs/30-workflows/parallel-09-ux-cross-cutting/phase-{09..13}.md`
- `docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-{09..13}/*`

### skill 同期（.claude/skills/）
- `aiworkflow-requirements/references/frontend-conventions.md`（または該当 reference）— 「primitive 統一の原則」追記
- `aiworkflow-requirements/indexes/keywords.json` — `FormField` / `Pagination primitive` / `Icon size convention` / `Breadcrumb primitive` / `useAdminMutation` / `OKLch token` / `@layer components section` 追加

## 検証手順

### ローカル
- `mise exec -- pnpm typecheck` PASS
- `mise exec -- pnpm lint` PASS
- `mise exec -- pnpm --filter @ubm-hyogo/web test` PASS
- `mise exec -- pnpm --filter @ubm-hyogo/web test:a11y` violations 0
- `mise exec -- pnpm --filter @ubm-hyogo/web test:visual` diff 0
- HEX 直書き grep: 0 件
- API 変更 grep: 0 件

### CI gate
- `verify-design-tokens` (HEX 0)
- `verify-test-suffix` (`*.spec.{ts,tsx}` のみ)
- `verify-indexes-up-to-date`（aiworkflow-requirements skill index）

## ロールバック

| 範囲 | 手順 |
| --- | --- |
| primitive 単体 | 該当 commit を `git revert` |
| globals.css | `git checkout dev -- apps/web/src/styles/globals.css` |
| EmptyState 拡張 | `git checkout dev -- apps/web/src/components/ui/EmptyState.tsx`（後方互換のため caller 修正不要） |
| useAdminMutation | `git checkout dev -- apps/web/src/lib/useAdminMutation.ts` |
| 全体 | feature ブランチ破棄。Cloudflare 側 rollback 不要（`apps/api` / D1 / wrangler.toml に変更なし） |

## Test plan

- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `pnpm --filter @ubm-hyogo/web test` PASS
- [x] `pnpm --filter @ubm-hyogo/web test:a11y` violations 0
- [x] `pnpm --filter @ubm-hyogo/web test:visual` diff 0
- [x] HEX 直書き grep 0 件
- [x] `apps/api/` / wrangler.toml / D1 schema に diff なし
- [x] 12 PNG visual evidence が outputs/phase-11/screenshots/ に存在
- [x] parallel-03 conflict dry-run で conflict 0（または skip 理由文書化）

## 不変条件チェック

- [x] D1 直接アクセスを追加していない（`apps/web` から D1 binding 禁止維持）
- [x] API endpoint surface に変更なし（既存 endpoint のみ利用）
- [x] OKLch token 正本（`apps/web/src/styles/tokens.css`）を変更していない
- [x] HEX 直書き 0 件
- [x] spec 命名規約 (`*.spec.{ts,tsx}` のみ)
- [x] `apps/api/` / `wrangler.toml` / D1 migration に変更なし
- [x] CLAUDE.md / `tokens.css` に変更なし

## スクリーンショット

VISUAL タスクのため Playwright snapshot を 12 枚取得済（6 種 × 1x/2x）:

- 01-formfield-error: `docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/01-formfield-error.png` / `01-formfield-error@2x.png`
- 02-icon-4sizes: `02-icon-4sizes.png` / `02-icon-4sizes@2x.png`
- 03-breadcrumb: `03-breadcrumb.png` / `03-breadcrumb@2x.png`
- 04-focus-visible: `04-focus-visible.png` / `04-focus-visible@2x.png`
- 05-pagination-disabled: `05-pagination-disabled.png` / `05-pagination-disabled@2x.png`
- 06-empty-state: `06-empty-state.png` / `06-empty-state@2x.png`

詳細は `outputs/phase-11/visual-evidence-summary.md` 参照。

## 関連

- Refs ui-prototype-alignment-mvp-recovery 親 workflow
- 並走: parallel-01〜08（独立。primitive 提供シグナルで API 共有）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 13-3. post-merge アクション

PR が `dev` にマージされた後に実施:

| # | アクション | 担当 |
| --- | --- | --- |
| 1 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md` の status を `completed` に更新（ui-prototype-alignment-mvp-recovery 親 workflow の運用に従う） | 手動 |
| 2 | parallel-01〜08 の各 spec 著者へ「primitive 提供完了」を SCOPE.md 経由で通知（既に SCOPE.md に追記済） | 自動 |
| 3 | unassigned-task として記録した「`apps/web/src/lib/aria-helpers.ts` 切り出し」は再利用需要が出た時点で別 task として起票 | 別タスク |
| 4 | dev → main の昇格 PR を別途作成（CLAUDE.md「main は dev→main リリース時のみ」） | 別タスク |
| 5 | `aiworkflow-requirements` skill index 再生成: `mise exec -- pnpm indexes:rebuild` | 手動（必要時） |

---

## 13-4. 振り返りチェック

| 観点 | 内容 |
| --- | --- |
| 計画精度 | 「中規模」見積もりに対する実工数の差分。primitive 4 つ + visual evidence 12 枚の取得が想定内か |
| 不変条件 | API 変更 0 / D1 変更 0 / HEX 0 / spec 命名規約が PR レビューで指摘されたか |
| Lessons Learned | YAGNI 適用（`apps/web/src/lib/` 切り出し保留）/ section コメントによる parallel-03 共存設計が将来 task に転用できるか |
| 後続タスク | parallel-01〜08 が primitive を import する際の friction（型定義 / import path / props naming）が想定内か |
| visual evidence | 1x + 2x 取得運用が Retina 環境での false positive を本当に防げたか |

---

## 13-5. 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| dev → main 昇格 PR | 本 PR マージ後、別 PR で本番反映 | 本タスクスコープ外 |
| parallel-01〜08 PR | primitive を import して各 spec の UI を実装 | 先行マージ側に rebase で追従 |
| parallel-03 | `@layer components` 同時編集 | section コメントによる物理分離で merge conflict 0 を維持 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-12/implementation-guide.md` | PR 本文「変更ファイル / 設計判断 / 検証 / ロールバック」の元データ |
| 必須 | `docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-11/visual-evidence-summary.md` | PR 本文「Screenshots」の元データ |
| 必須 | `docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-12/unassigned-task-detection.md` | post-merge アクション 3 番の元データ |
| 必須 | CLAUDE.md「PR作成の完全自律フロー」 | PR 作成プロトコル |
| 必須 | CLAUDE.md「ブランチ戦略」 | dev base 運用 |
| 参考 | `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-13.md` | フォーマット参考 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-13/pr-summary.md` | PR 本文の正本（gh pr create 引数の元データ） |
| ドキュメント | `outputs/phase-13/retrospective.md` | 振り返り 13-4 の記録 |
| PR | GitHub Pull Request | レビュー / マージ |
| メタ | `artifacts.json` | phase-13 を completed に更新 |

---

## 完了条件

- [ ] ユーザー承認（または PR 自律フロー適用条件）が成立している
- [ ] ローカルチェック全 PASS（typecheck / lint / unit / a11y / visual / HEX grep / API 不変 grep）
- [ ] PR が GitHub 上に作成され URL が記録されている
- [ ] PR base が `dev` である
- [ ] PR タイトルが `feat(web): unify UX primitives across 19 routes (parallel-09 G9-1..G9-9)` である
- [ ] PR 本文に 12 PNG visual evidence への path が記載されている
- [ ] HEX 直書き / 機密値が PR 本文 / コミット / コードに含まれていない
- [ ] 振り返り（13-4 セクション）が `outputs/phase-13/retrospective.md` に記録されている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] PR URL が `outputs/phase-13/pr-summary.md` 末尾に記録
- [ ] post-merge アクション 5 件のうち手動アクション（1, 5）の実行手順が用意されている
- [ ] visual evidence 12 PNG への path が PR 本文に正確に記載

---

## 次 Phase

- なし（Phase 13 が最終 Phase）
- post-merge: 13-3 の 5 アクションを実施
- ブロック条件: ローカルチェック FAIL / HEX 混入 / `apps/api` 変更混入 / wrangler.toml 変更混入 / 12 PNG 欠落のいずれかが発生した場合は実行しない
