[実装区分: 実装仕様書]

# Phase 13: PR・振り返り

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | PARALLEL-01-NAV admin sidebar logo→/ 戻り動線 + members drawer→tags link |
| タスクID | PARALLEL-01-NAV |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR・振り返り |
| 前 Phase | 12 (正本同期) |
| 次 Phase | なし（最終 Phase） |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | VISUAL |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | Phase 1〜12 で完成した UI 動線実装 + 設計書 + VISUAL evidence + 正本同期を 1 PR にまとめ、`dev` にマージ可能な状態にする最終 Phase。CONST_002（commit / push / PR は user-gated）が適用される。 |

---

## 目的

Phase 1〜12 の全成果物（コード + 設計書 + mock fallback screenshot + 完了タスク台帳更新準備）を 1 PR に集約し、`dev` ブランチへのマージ準備を完了させる。real authenticated screenshot は runtime pending として明示する。

> ⚠️ **CONST_002 / 承認ゲート**: `commit` / `push` / `gh pr create` は **user-gated**。CLAUDE.md「PR作成の完全自律フロー」が適用される依頼（「PR作成」「PR出して」「diff-to-pr」等）の場合は確認質問を挟まず実行する。それ以外はユーザーから明示承認を得てから実行する。

---

## 13-1. PR 基本情報

| 項目 | 値 |
| --- | --- |
| PR タイトル案 | `feat(parallel-01-nav): admin sidebar logo→/ 戻り動線と members drawer→tags link を追加` |
| ベースブランチ | `dev`（CLAUDE.md「既定ブランチは dev」遵守） |
| 作業ブランチ | `feat/parallel-01-nav-admin-wayfinding`（または同等 slug） |
| PR 種別 | feature（コード実装あり / VISUAL） |
| 関連 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md` を Refs として参照 |

---

## 13-2. 実行手順

### ステップ 1: ローカルチェック

```bash
# 全体型チェック / Lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# unit test
mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar MemberDrawer

# 変更ファイル確認
git status
git diff dev...HEAD --name-only

# token placeholder grep（CLAUDE.md 不変条件）
grep -rnE "bg-\[#[0-9a-fA-F]|text-\[#[0-9a-fA-F]|token-sized|09b-token-value" \
  apps/web/src/components/layout/AdminSidebar.tsx \
  apps/web/src/features/admin/components/_members/MemberDrawer.tsx \
  || echo "OK: token placeholder 0 件"

# apps/api 変更がないこと
git diff dev...HEAD --name-only | grep '^apps/api/' && echo "FAIL: apps/api に変更が混入" || echo "OK: apps/api 無変更"
```

### ステップ 2: 変更ファイル確認

確認:
- `apps/web/` 配下のコード変更（AdminSidebar.tsx / MemberDrawer.tsx + 各 spec）が含まれている
- `docs/30-workflows/parallel-01-navigation-admin-wayfinding/` 配下のドキュメント / outputs が含まれている
- `apps/api/` / D1 schema / Google Form 仕様の変更がない
- 機密値が含まれていない

### ステップ 3: コミット整理

| # | コミットメッセージ |
| --- | --- |
| 1 | `feat(web): add admin sidebar logo link to home in AdminSidebar (parallel-01-nav)` |
| 2 | `feat(web): add tag management link to MemberDrawer with encoded memberId (parallel-01-nav)` |
| 3 | `test(web): cover AdminSidebar logo link and MemberDrawer tags link (parallel-01-nav)` |
| 4 | `docs(parallel-01-nav): finalize phase 9-13 source-of-truth sync` |

### ステップ 4: push と PR 作成

```bash
git push -u origin feat/parallel-01-nav-admin-wayfinding

gh pr create --base dev --title "feat(parallel-01-nav): admin sidebar logo→/ 戻り動線と members drawer→tags link を追加" --body "$(cat <<'EOF'
## Summary

- `AdminSidebar` 上部に `<Link href="/" aria-label="ホームに戻る">` を追加し、admin 作業中から公開トップへ 1 クリックで戻れる動線を整備
- `MemberDrawer` に `/admin/tags?memberId={encoded}` への遷移リンクを追加し、会員詳細 → タグ管理画面のショートカットを確保
- 既存 API endpoint surface / D1 schema / Google Form 仕様は変更なし（CLAUDE.md「UI prototype alignment」不変条件遵守）

## 設計判断

- **既存 API endpoint surface 不変**: `/admin/tags/page.tsx` の `focusMemberId` 既存 contract をそのまま利用
- **independent component 化を見送り**: Phase 10 リファクタ判定で「本タスク 1 箇所のみ使用 / variant 要求なし」のため YAGNI。将来切り出し条件は `outputs/phase-10/refactor-summary.md` に記録
- **drawer onClose 明示呼び出しなし**: `next/link` の page transition で drawer が自動 unmount されるため、race condition リスクを抑える
- **`encodeURIComponent` 必須化**: 将来 free-form memberId を扱う際の安全余白として強制

## 変更ファイル

### apps/web（編集）
- `src/components/layout/AdminSidebar.tsx` — `<nav>` 直下に logo `<Link href="/">` を追加
- `src/features/admin/components/_members/MemberDrawer.tsx` — drawer footer に `/admin/tags?memberId={encodeURIComponent(memberId)}` link を追加

### apps/web（新規）
- `src/components/layout/__tests__/AdminSidebar.component.spec.tsx` — logo link 存在 / aria-label / focus-visible assertion
- `src/features/admin/components/__tests__/MemberDrawer.spec.tsx` — tags link 存在 / 特殊文字 memberId の percent-encoded href assertion

### docs
- `docs/30-workflows/parallel-01-navigation-admin-wayfinding/phase-{09..13}.md`
- `docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-09/acceptance.md`
- `docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-10/refactor-summary.md`
- `docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-11/{admin-sidebar-logo-link.png,member-drawer-tags-link.png,dom-snapshot.txt,canonical-paths.json,evidence/*.log}`（PNG は mock fallback。real screenshot は runtime pending）
- `docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`

## 検証手順

### ローカル
- `mise exec -- pnpm typecheck` PASS
- `mise exec -- pnpm lint` PASS
- `mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar MemberDrawer` PASS
- token placeholder grep: 0 件
- `apps/api/` 配下に変更なし

### staging（外部実施）
1. `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`
2. staging `/admin` → sidebar logo クリック → `/` 到達確認
3. staging `/admin/members` → drawer → tags link → `/admin/tags?memberId=...` 到達確認 + `focusMemberId` 反映確認

## Test plan

- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `pnpm --filter @ubm-hyogo/web test -- AdminSidebar MemberDrawer` PASS
- [ ] staging deploy 成功（外部実施）
- [ ] staging で `/admin` → sidebar logo → `/` 遷移確認（外部実施）
- [ ] staging で `/admin/members` → drawer → tags link → `/admin/tags?memberId=...` 遷移確認（外部実施）
- [x] token placeholder grep 0 件
- [x] `apps/api/` 配下に変更なし

## Screenshots / Visual Boundary

- `docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-11/admin-sidebar-logo-link.png` — mock fallback: sidebar 上部に「ホームに戻る」link 描画
- `docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-11/member-drawer-tags-link.png` — mock fallback: drawer 内に「タグ管理へ」link 描画
- `docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-11/dom-snapshot.txt` — implemented DOM contract fallback

Real authenticated screenshots are not claimed complete. `outputs/phase-11/canonical-paths.json` marks the visual evidence as `mock_fallback_captured_real_runtime_pending`.

## ロールバック

| 範囲 | 手順 |
| --- | --- |
| デプロイ | `bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/web/wrangler.toml --env <env>` |
| コード | `AdminSidebar.tsx` の logo link ブロックを削除 / `MemberDrawer.tsx` の tags link ブロックを削除 → 再 deploy |
| 既存 contract | `/admin/tags` の `focusMemberId` は本 PR で変更していないため、ロールバック対象外 |

## 不変条件チェック

- [x] D1 直接アクセスを追加していない（`apps/web` から D1 binding 触れず）
- [x] 既存 API endpoint surface 不変
- [x] OKLch tokens（`var(--ubm-color-*)`）のみ使用 / HEX 直書きなし
- [x] `apps/api/` 配下に変更なし
- [x] Google Form 仕様変更なし
- [x] `next/link` 使用、外部リンクなし

## 関連

Refs: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 13-3. post-merge アクション

PR が `dev` にマージされた後に実施:

| # | アクション | 担当 |
| --- | --- | --- |
| 1 | `docs/30-workflows/parallel-01-navigation-admin-wayfinding/` を完了サイクル完了後に `docs/30-workflows/completed-tasks/` 配下へ `git mv`（条件: external ops 完了） | 手動 |
| 2 | external ops（staging deploy / 動線確認）を実施 | プロジェクトオーナー |
| 3 | external ops 完了後、status を `completed` に更新（`outputs/phase-12/system-spec-update-summary.md` 参照） | 手動 |
| 4 | real authenticated screenshot は既存 task-18-FU full visual regression suite / this workflow Phase 11 runtime boundary で継続管理 | runtime boundary |
| 5 | dev → main の昇格 PR を別途作成（CLAUDE.md「main は dev→main リリース時のみ」） | 別タスク |

---

## 13-4. 振り返り（KPT）

`outputs/phase-13/pr-summary.md` 末尾に以下構造で記録:

### Keep（継続したい）

- 既存 API endpoint surface を一切変更せず UI 側のみで動線追加できた（CLAUDE.md 不変条件遵守）
- Phase 10 で independent component 化を YAGNI で見送り、premature abstraction を回避した判断
- OKLch tokens 経由の color 指定で design tokens 不変条件を満たした

### Problem（改善したい）

- Playwright auth fixture が未整備の場合、Phase 11 で mock fallback が必要になる運用負荷
- `MemberDrawer` の link 配置が drawer footer area で良いかは visual review で再評価余地あり

### Try（次回試したい）

- Playwright auth fixture を共通化 followup として独立起票（mock fallback 採用時のみ）
- 他 parallel-* improvements で同等の sidebar / drawer 動線追加が連続する場合、`LogoLink` / `TagManagementLink` の独立 component 化を再検討（Phase 10 将来切り出し条件参照）

---

## 13-5. 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| dev → main 昇格 PR | 本 PR マージ後、別 PR で本番反映 | 本タスクスコープ外 |
| ui-prototype-alignment-mvp-recovery の他 parallel-* improvements | 独立。並走 / 順次どちらも可 | 先行マージ側に rebase で追従 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-12/implementation-guide.md` | PR 本文「変更ファイル / 設計判断 / 検証 / ロールバック」の元データ |
| 必須 | `outputs/phase-12/documentation-changelog.md` | PR 本文「Summary」元データ |
| 必須 | `outputs/phase-12/unassigned-task-detection.md` | post-merge アクション 4 の起票判断 |
| 必須 | `outputs/phase-11/canonical-paths.json` | PR 本文 Screenshots 一覧の正本 |
| 必須 | CLAUDE.md「PR作成の完全自律フロー」 | PR 作成プロトコル |
| 必須 | CLAUDE.md「ブランチ戦略」「UI prototype alignment」 | dev base / 不変条件 |
| 参考 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-13.md | フォーマット参考 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-13/pr-summary.md` | PR 本文正本（`gh pr create` 引数の元データ + KPT） |
| PR | GitHub Pull Request | レビュー / マージ |

---

## 完了条件

- [ ] ユーザー承認（または PR 自律フロー適用条件）が成立している
- [ ] ローカルチェック全 PASS（typecheck / lint / unit test / token grep）
- [ ] PR が GitHub 上に作成され URL が記録されている
- [ ] PR base が `dev` である
- [ ] PR タイトルが `feat(parallel-01-nav): admin sidebar logo→/ 戻り動線と members drawer→tags link を追加` である
- [ ] PR 本文に `Refs: improvements/parallel-01-navigation/spec.md` が含まれている
- [ ] `apps/api/` 配下に変更がない
- [ ] OKLch tokens 不変条件遵守（HEX 直書きなし）
- [ ] 振り返り（13-4 KPT）が記録されている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] PR URL が `outputs/phase-13/pr-summary.md` 末尾に記録
- [ ] post-merge アクション 5 件のうち 1 番（completed-tasks 移動）の git mv コマンドが用意されている
- [ ] external ops が「外部実施」として明示分離されている

---

## 次 Phase

- なし（Phase 13 が最終 Phase）
- post-merge: 13-3 の 5 アクションを実施
- ブロック条件: ローカルチェック FAIL / `apps/api` 変更混入 / OKLch tokens 不変条件違反 / 既存 API endpoint surface 変更が混入した場合は実行しない

---

作成日: 2026-05-15
