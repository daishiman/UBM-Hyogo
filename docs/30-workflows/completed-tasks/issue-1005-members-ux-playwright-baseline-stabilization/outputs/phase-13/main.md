<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 13 -->

# Phase 13 Main — commit-pr-release

## 1. 前提

実装 wave（Phase 5-11）で config / spec の安定化実装と cold-start 24 PNG 取得を完了した状態を前提とする。
本 Phase 13 はその変更を `dev` ブランチへ向けて PR 化する手順を定義する。
**commit / push / PR / staging visual baseline 更新 / Issue state 変更は user-gated であり、本仕様書では実行しない。**

## 2. PR メタ情報

| 項目 | 値 |
| ---- | -- |
| base | `dev` |
| 作業ブランチ | `docs/issue-1005-members-ux-playwright-baseline-stabilization` |
| タイトル例 | `fix(web): /members UX Playwright visual baseline を cold start で安定化し出力先 path drift を補正` |
| Issue | `Refs #1005`（close せず参照） |

## 3. 検証（PR 前・実装 wave 内で実行）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# cold start で evidence 24 PNG を取得し outputs/phase-11/ に配置
```

## 4. PR 本文構成（`outputs/phase-12/implementation-guide.md` 参照）

1. 調査結論: Issue #1005 は OPEN・別タスク未解決・path drift 同時補正。
2. 根本原因と対策: RC-1（warm-up）/ RC-2（path drift）/ RC-3（冗長 project）/ RC-4（runtime-notes）。
3. 変更ファイル: `apps/web/playwright.config.ts` / `apps/web/playwright/tests/members-ux-clarity.spec.ts`。
4. 検証結果: typecheck / lint / cold-start 24 PNG（`outputs/phase-11/manual-test-result.md`）。
5. スクリーンショット: `outputs/phase-11/` に PNG がある場合のみ参照。無ければ節を作らない。

## 5. 含めるファイル

- 実装 2 ファイル（config / spec）
- 本 workflow の Phase 1-13 ドキュメント
- Phase 11 evidence（PNG / manual-test-result.md）

## 6. 実行コマンド（user 承認後）

```bash
# 例（承認後のみ）
git add -A
git commit -m "fix(web): /members UX Playwright visual baseline を cold start で安定化し出力先 path drift を補正"
git push -u origin docs/issue-1005-members-ux-playwright-baseline-stabilization
gh pr create --base dev --title "<上記タイトル>" --body "<implementation-guide ベース本文>"
```

実行結果は `outputs/phase-13/pr-creation-result.md` に記録する。

## DoD

- [ ] base=dev が明記されている
- [ ] 検証コマンドと PR 本文構成が示されている
- [ ] commit/push/PR/staging baseline/Issue state 変更が user-gated と明記されている
