# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-login-and-profile-pages |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（最終） |
| 状態 | pending（ユーザー承認後にのみ実行） |

## ユーザー承認確認文（冒頭必須）

**この Phase はユーザーの明示承認がある場合のみ実行する。承認なしで `gh pr create` を発火しない。**

## 目的

会員 2 ルート（`/login` 5 状態 + `/profile` read-only）実装の PR を `feature/* → dev → main` の戦略に沿って作成し、6 種ドキュメントと AC-1〜AC-12、不変条件 #1 / #2 / #4 / #5 / #6 / #7 / #8 / #9 / #10 / #11 を description に貼る。**承認 gate（user explicit yes）に達するまで実行しない**。

## 実行タスク

1. approval gate
2. local check（typecheck / lint / test / build）の最終 pass
3. `local-check-result.md` を生成
4. `change-summary.md` を生成
5. PR description テンプレートを準備
6. labels / reviewers
7. user 承認後に `gh pr create` を実行
8. merge 戦略の確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/ac-matrix.md | AC |
| 必須 | outputs/phase-09/main.md | 品質 |
| 必須 | outputs/phase-10/main.md | GO 判定 |
| 必須 | outputs/phase-11/main.md | smoke evidence |
| 必須 | outputs/phase-12/ | 6 種ドキュメント |
| 参考 | CLAUDE.md | branch 戦略 |

## 実行手順

### ステップ 1: approval gate

- 本 phase は user explicit yes が無ければ実行しない（CLAUDE.md commit 規約）
- AC-1〜AC-12 の green が前提（条件付き green は上流確定後）
- blocker B-01〜B-04（00, 04b, 05a, 05b）が解消済みであること

### ステップ 2: 最終 local check

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm -F apps/web build
```

期待: 全コマンド exit code 0、所要時間記録、不変条件 #4 / #9 の grep 0 件再確認

### ステップ 3: local-check-result.md

- 上記 5 コマンドの exit code と所要時間を記録
- 不変条件 #4（`/profile` 編集 form 不在）/ #9（`/no-access` 不採用）の grep 結果を併記

### ステップ 4: change-summary.md

- 変更ファイル一覧（spec のみ、コード変更なし）
- AC-1〜AC-12 の trace 状況
- 不変条件 #1, #2, #4, #5, #6, #7, #8, #9, #10, #11 の compliance

### ステップ 5: branch / commit

| 項目 | 値 |
| --- | --- |
| branch | `feature/06b-member-login-and-profile-pages` |
| base | `dev` |
| commit 規約 | conventional commits（`docs(app/06b): …`） |
| Co-Authored-By | `Claude Opus 4.7 <noreply@anthropic.com>` |

### ステップ 6: PR description（テンプレート）

```md
## Summary
- `/login`（AuthGateState 5 状態出し分け + Magic Link + Google OAuth）と `/profile`（read-only）を Next.js App Router + `@opennextjs/cloudflare` で実装
- URL query 正本（`state/email/redirect`）+ stableKey 参照 + window.UBM / localStorage 不採用
- 04b の `/me`, `/me/profile` を fetch（D1 は apps/api に閉じる）
- `/no-access` 不採用、`/login` で 5 状態（input / sent / unregistered / rules_declined / deleted）を吸収
- profile 本文編集は Google Form 再回答経路のみ（`EditCta` で responderUrl / editResponseUrl 提供）

## Linked specs
- doc/00-getting-started-manual/specs/02-auth.md
- doc/00-getting-started-manual/specs/05-pages.md
- doc/00-getting-started-manual/specs/06-member-auth.md
- doc/00-getting-started-manual/specs/07-edit-delete.md
- doc/00-getting-started-manual/specs/13-mvp-auth.md
- doc/00-getting-started-manual/specs/16-component-library.md

## AC
- AC-1〜AC-12 完全トレース → outputs/phase-07/ac-matrix.md

## Test
- typecheck / lint / unit / contract / E2E / a11y / secret scan: pass
- manual smoke M-01〜M-16: outputs/phase-11/main.md

## Free tier
- Workers req 12,900 / 月（無料枠 100,000 / 日 = 3,000,000 / 月の 0.43%）
- D1 reads（04b 経由） 6,000 / 月

## Documents
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

## Invariants
- #1 stableKey only / #2 publicConsent / rulesConsent only / #4 profile read-only (Google Form re-submit only) / #5 D1 only via apps/api / #6 no window.UBM / no localStorage / #7 session.memberId only, MVP = Google Form re-submit / #8 URL query as source of truth / #9 no /no-access / #10 free-tier safe / #11 no member body edit by anyone

## Test plan
- [ ] CI green
- [ ] dev deploy で `/login?state=sent` が 200 + sent Banner
- [ ] dev deploy で `/profile` 未ログインが 302 → `/login?redirect=/profile`
- [ ] dev deploy で `/profile` ログイン後に編集 form 不在
- [ ] dev deploy で `/no-access` が 404
```

### ステップ 7: labels / reviewers

| 種別 | 値 |
| --- | --- |
| labels | `area/web`, `wave-6`, `parallel`, `member`, `auth` |
| reviewers (dev) | 1 名 |
| reviewers (main) | 2 名（CLAUDE.md より） |

### ステップ 8: PR 発行（承認後のみ）

```bash
git push -u origin feature/06b-member-login-and-profile-pages
gh pr create --base dev --head feature/06b-member-login-and-profile-pages \
  --title "docs(app/06b): member login and profile pages spec" \
  --body-file outputs/phase-13/change-summary.md
```

### ステップ 9: merge 戦略

| 項目 | 値 |
| --- | --- |
| dev merge | `Squash and merge` |
| main merge | `Create a merge commit`（履歴保全） |
| 自動デプロイ | dev → Cloudflare staging / main → production |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 08a | session / gate state contract test |
| 08b | login → profile E2E |
| 09a | staging deploy 確認 |
| 09b | production deploy 確認 |

## 多角的チェック観点

- 不変条件 #1: PR description に明示（stableKey only） |
- 不変条件 #2: PR description に明示（publicConsent / rulesConsent only） |
- 不変条件 #4: PR description に明示（profile read-only, Google Form 経由） |
- 不変条件 #5: PR description に明示（D1 only via apps/api） |
- 不変条件 #6: PR description に明示（no window.UBM / no localStorage） |
- 不変条件 #7: PR description に明示（session.memberId only, MVP = Google Form 再回答） |
- 不変条件 #8: PR description に明示（URL query as source of truth） |
- 不変条件 #9: PR description に明示（no /no-access） |
- 不変条件 #10: PR description に明示（free-tier 0.43%） |
- 不変条件 #11: PR description に明示（no member body edit） |

## 変更サマリー

- spec 変更: 15 ファイル（index.md + artifacts.json + phase-01.md 〜 phase-13.md）
- コード変更: なし（spec_created）
- downstream 影響: 08a / 08b が着手可能

## CI チェック

- docs lint pass
- link check pass
- spec compliance check pass

## close-out チェックリスト

- [ ] user 承認あり
- [ ] local-check-result.md がある
- [ ] change-summary.md がある
- [ ] Phase 12 close-out 済み
- [ ] PR が `feature/06b-* → dev` で発行
- [ ] artifacts.json で phase 13 を completed
- [ ] 不変条件 #4 / #9 の grep 結果が 0 件であることを description に記載

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | approval gate | 13 | pending | user yes |
| 2 | local check | 13 | pending | 5 コマンド |
| 3 | local-check-result.md | 13 | pending | exit code + grep |
| 4 | change-summary.md | 13 | pending | trace |
| 5 | PR description | 13 | pending | template |
| 6 | labels / reviewers | 13 | pending | dev:1 / main:2 |
| 7 | gh pr create（承認後） | 13 | pending | user approval gate |
| 8 | merge 戦略 | 13 | pending | squash → merge |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR メタ + URL |
| ドキュメント | outputs/phase-13/local-check-result.md | local check 結果 + grep |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリ |
| メタ | artifacts.json | phase 13 status |

## 完了条件

- [ ] approval gate 通過
- [ ] PR が dev に open
- [ ] description に AC + 6 種ドキュメント link 含む
- [ ] description に不変条件 #1, #2, #4, #5, #6, #7, #8, #9, #10, #11 が明示
- [ ] CI green

## タスク100%実行確認【必須】

- 全 8 サブタスクが completed
- PR URL を outputs/phase-13/main.md に記録
- 不変条件 #1, #2, #4, #5, #6, #7, #8, #9, #10, #11 への対応が PR に明示
- merge 後の dev staging 確認は 09a へ引継ぎ

## 次 Phase

- 次: なし（最終）
- 引き継ぎ事項: PR URL を後続 Wave（08a / 08b / 09a / 09b）に共有
- ブロック条件: approval gate 未通過なら PR 発行しない
