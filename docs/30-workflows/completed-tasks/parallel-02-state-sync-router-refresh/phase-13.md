# Phase 13: PR・振り返り

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 名称 | PR・振り返り |
| タスク | profile mutation 成功後の RequestPendingBanner 即時反映 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 状態 | blocked_pending_user_approval |
| タスク種別 | implementation / VISUAL |
| 実装区分 | ui-bugfix |
| 実装区分 判定根拠 | Phase 1〜12 で完成した 4 ファイル変更 + Playwright screenshot を 1 PR にまとめ、`dev` にマージ可能な状態にする最終 Phase |

---

## 目的

Phase 1〜12 の全成果物（コード差分 + spec 群 + Playwright screenshot）を 1 PR に集約し、`dev` ブランチへのマージ準備を完了させる。

> ⚠️ **承認ゲート**: CLAUDE.md「PR作成の完全自律フロー」が適用される依頼（「PR作成」「PR出して」「diff-to-pr」等）の場合は確認質問を挟まず実行する。それ以外はユーザーから明示承認を得てから実行する。

---

## 13-1. PR 基本情報

| 項目 | 値 |
| --- | --- |
| PR タイトル | `fix(web): instant RequestPendingBanner reflect after profile request mutation` |
| ベースブランチ | `dev` |
| 作業ブランチ | `fix/parallel-02-state-sync-router-refresh`（または同等の slug） |
| PR 種別 | fix（UI bugfix / VISUAL） |
| 関連 Issue | （未起票・必要時に作成） / Refs `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-02-state-sync/spec.md` |

---

## 13-2. 実行手順

### ステップ 1: ローカルチェック

```bash
# 全体型チェック / Lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# apps/web ユニットテスト
mise exec -- pnpm --filter @ubm-hyogo/web test

# Playwright e2e（screenshot 取得）
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- profile

# 変更ファイル確認
git status
git diff dev...HEAD --name-only
# 期待: apps/web/app/profile/_components/ 内 4 ファイル + docs/30-workflows/parallel-02-state-sync-router-refresh/ 配下

# apps/api への変更がないことを確認
git diff dev...HEAD --name-only | grep -E "^apps/api/" || echo "OK: no apps/api changes"

# OKLch token 変更がないことを確認
git diff dev...HEAD apps/web/src/styles/ apps/web/app/ | grep -E "(#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#)" || echo "OK: no hex / arbitrary color"
```

### ステップ 2: コミット整理

| # | コミットメッセージ |
| --- | --- |
| 1 | `fix(web): call router.refresh in VisibilityRequestDialog onSubmit success branch` |
| 2 | `fix(web): call router.refresh in DeleteRequestDialog onSubmit success branch` |
| 3 | `test(web): cover router.refresh call/no-call in request dialogs` |
| 4 | `docs(parallel-02-state-sync-router-refresh): finalize phase 1-13 spec` |

### ステップ 3: push と PR 作成

```bash
git push -u origin fix/parallel-02-state-sync-router-refresh

gh pr create --base dev --title "fix(web): instant RequestPendingBanner reflect after profile request mutation" --body "$(cat <<'EOF'
## Summary

- マイページ profile の visibility-request / delete-request mutation 成功直後に `RequestPendingBanner` を即時反映
- `VisibilityRequestDialog` / `DeleteRequestDialog` の `onSubmit` success branch に `router.refresh()` を `onSubmitted` / `onClose` より先に呼び出す順序固定で追加
- failure branch (`else` / `catch`) では `router.refresh()` を呼ばず、不要な server 往復を抑制

## 設計判断

- **revalidation 戦略**: `router.refresh()` を採用（SWR / optimistic update は不採用 / server state を正本）
- **呼び出し位置**: dialog ローカル（dialog の成功要件として banner 反映を内包）
- **呼び出し順序**: `router.refresh() → onSubmitted() → onClose()` 固定（unmount 後の navigation 警告回避）
- **failure path**: refresh を呼ばない（429 risk 抑制）
- **既存 `RequestActionPanel.tsx` の `router.refresh()`**: 削除済み。parent は accepted response bridge state のみ担当

## 変更ファイル

### apps/web（編集）
- `app/profile/_components/VisibilityRequestDialog.tsx` — `useRouter` import / `router.refresh()` 追加
- `app/profile/_components/DeleteRequestDialog.tsx` — 同上
- `app/profile/_components/VisibilityRequestDialog.component.spec.tsx` — `useRouter` mock + 2 ケース追加
- `app/profile/_components/DeleteRequestDialog.component.spec.tsx` — 同上

### docs
- `docs/30-workflows/parallel-02-state-sync-router-refresh/{index,phase-01..13,artifacts.json}.md` — Phase 1-13 仕様書
- `docs/30-workflows/parallel-02-state-sync-router-refresh/outputs/phase-{01..13}/*` — 各 phase の主成果物

## 検証手順

### ローカル
- `pnpm typecheck` PASS
- `pnpm lint` PASS
- `pnpm --filter @ubm-hyogo/web test -- RequestActionPanel.component.spec.tsx` PASS（新規 cases + focused non-regression）
- `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- profile` runtime_pending

### 手動（テストアカウント `manju.manju.03.28@gmail.com`）
1. `/profile` ロード → banner 非表示
2. 「公開を停止する」→ dialog → 申請送信 → reload なしで banner 即時表示
3. 409 衝突 → banner 状態維持 / dialog 内 alert 表示

## ロールバック

| 範囲 | 手順 |
| --- | --- |
| コード | `git revert <commit_hash>` で 4 ファイル復元（apps/api / D1 / Cloudflare 設定への波及なし） |

## Test plan

- [x] pnpm typecheck PASS
- [x] pnpm lint PASS
- [x] pnpm --filter @ubm-hyogo/web test -- RequestActionPanel.component.spec.tsx PASS
- [ ] pnpm --filter @ubm-hyogo/web test:e2e runtime_pending
- [ ] Playwright screenshot 5 枚 runtime_pending
- [x] apps/api/ 配下に変更なし
- [x] D1 schema 変更なし
- [x] OKLch token / 色変更なし

## 不変条件チェック

- [x] 既存 API endpoint surface 不変
- [x] D1 直接アクセスを追加していない
- [x] OKLch token 無関係
- [x] テスト新規ファイルは `*.spec.tsx` のみ
- [x] `apps/web` 限定（`apps/api` 変更なし）
- [x] 呼び出し順序 refresh → onSubmitted → onClose 固定
- [x] server state 正本（楽観的 UI 不採用）

## スクリーンショット

- `docs/30-workflows/parallel-02-state-sync-router-refresh/outputs/phase-11/screenshots/01-profile-initial.png`
- `.../02-visibility-dialog-open.png`
- `.../03-visibility-banner-shown.png`
- `.../04-delete-dialog-confirmed.png`
- `.../05-delete-banner-shown.png`

## 関連

- Refs `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-02-state-sync/spec.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 13-3. post-merge アクション

| # | アクション | 担当 |
| --- | --- | --- |
| 1 | 親 workflow `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-02-state-sync/spec.md` 末尾にクロスリンク追記 | 手動（PR に含めても可） |
| 2 | runtime screenshot 取得後に `workflow_state` を `runtime_evidence_captured` へ昇格 | 手動 |
| 3 | dev → main の昇格 PR を別途作成（CLAUDE.md「main は dev→main リリース時のみ」） | 別タスク |

---

## 13-4. 振り返りチェック

| 観点 | 内容 |
| --- | --- |
| 計画精度 | +66 行 / -0 行の小規模見積もりに対する実工数の差分 |
| 不変条件 | CONST_005（変更ファイル / シグネチャ / 入出力 / テスト / コマンド / DoD）違反が PR レビューで指摘されたか |
| Lessons Learned | dialog ローカル `useRouter` + 順序固定パターンが他 dialog（admin 管理画面）にも転用できるか |
| 重複 refresh | Phase 10 で削除済み。実運用では bridge state と server pending の切替を観察 |

---

## 13-5. 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| dev → main 昇格 PR | 本 PR マージ後、別 PR で本番反映 | 本タスクスコープ外 |
| ui-prototype-alignment-mvp-recovery 配下の他 parallel 改善 PR | 独立。並走 / 順次どちらも可 | 先行マージ側に rebase で追従 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/parallel-02-state-sync-router-refresh/outputs/phase-12/implementation-guide.md` | PR 本文「変更ファイル / 設計判断 / 検証 / ロールバック」の元データ |
| 必須 | `docs/30-workflows/parallel-02-state-sync-router-refresh/outputs/phase-11/visual-evidence.md` | screenshot 参照 |
| 必須 | CLAUDE.md「PR作成の完全自律フロー」 | PR 作成プロトコル |
| 必須 | CLAUDE.md「ブランチ戦略」 | dev base 運用 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-13/pr-summary.md` | PR 本文の正本 |
| PR | GitHub Pull Request | レビュー / マージ |

---

## 完了条件

- [ ] ユーザー承認（または PR 自律フロー適用条件）が成立している
- [ ] ローカルチェック全 PASS（typecheck / lint / test / e2e）
- [ ] PR が GitHub 上に作成され URL が記録されている
- [ ] PR base が `dev` である
- [ ] PR タイトルが `fix(web): instant RequestPendingBanner reflect after profile request mutation` である
- [ ] スクリーンショット 5 枚が PR 本文に参照されている
- [ ] `apps/api` への変更が PR に含まれていない
- [ ] 振り返り（13-4 セクション）が記録されている

---

## タスク 100% 実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] PR URL が `outputs/phase-13/pr-summary.md` 末尾に記録
- [ ] post-merge アクション 3 件が用意されている

---

## 次 Phase

- なし（Phase 13 が最終 Phase）
- post-merge: 13-3 の 3 アクションを実施
- ブロック条件: ローカルチェック FAIL / `apps/api` 変更混入 / OKLch token / 色変更混入 の場合は実行しない
