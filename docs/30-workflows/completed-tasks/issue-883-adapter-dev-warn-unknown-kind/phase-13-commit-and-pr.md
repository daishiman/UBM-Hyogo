# Phase 13: Commit & PR

[実装区分: 実装仕様書]

## メタ情報

| 項目     | 内容                                              |
| -------- | ------------------------------------------------- |
| タスクID | issue-883-adapter-dev-warn-unknown-kind           |
| Issue    | #883                                              |

## ブランチ命名

```
feat/issue-883-adapter-dev-warn-unknown-kind
```

## コミット粒度

| # | 内容                                                                                                |
| - | --------------------------------------------------------------------------------------------------- |
| 1 | `feat(issue-883): toMemberDetailProps に dev-mode unknown kind 観測 callback を追加`                |

> 3 ファイルとも責務が密結合（adapter シグネチャ拡張 → spec → page.tsx 注入）のため単一コミットで可。

## コミットメッセージ draft

```
feat(issue-883): toMemberDetailProps に dev-mode unknown kind 観測 callback を追加

- adapter: ToMemberDetailPropsOptions interface + onUnknownKind callback を導入
  (後方互換: 既存単一引数呼出は無変更で動作)
- spec: 8 → 10 ケース (vi.fn() mock で callback 呼出 + kind/stableKey 一致を assert)
- page.tsx: NODE_ENV === "development" 時のみ console.warn callback を注入
  production bundle DCE で warn 文字列 0 件 (outputs/phase-11/dce-grep.txt)

Refs: #883
Spec: docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind/
```

## PR タイトル

```
feat(issue-883): adapter dev-mode unknown kind 観測 helper
```

## PR base

```
gh pr create --base dev --title "..." --body "..."
```

> production リリース時の `dev → main` 以外は **必ず `--base dev`**。

## PR 本文 draft

```markdown
## 概要

issue #883 (serial-06 followup-002) の残実装を反映。`toMemberDetailProps` adapter に dev 環境のみで unknown kind を観測する optional callback (`onUnknownKind`) を追加し、`/(public)/members/[id]/page.tsx` から `NODE_ENV === "development"` のときだけ `console.warn` callback を注入。production bundle には dev-only 文字列が DCE で残らないことを実測確認済。adapter は pure 維持・既存 API 後方互換維持。

## 変更点

- `apps/web/src/lib/adapters/member-detail.ts`: `ToMemberDetailPropsOptions` / `RawField` を export、`toMemberDetailProps(profile, options?)` シグネチャ拡張、`normalizeField` の unknown kind ブランチで `onUnknownKind?.(field)` 呼出
- `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`: TC-09 追加（`vi.fn()` mock + `toHaveBeenCalledTimes(1)` + `toHaveBeenCalledWith` 検証）
- `apps/web/app/(public)/members/[id]/page.tsx`: callback 注入（dev のみ・production は `undefined`）

## 関連 Issue / PR

- Closes Refs: #883 (CLOSED のまま自動再 close 不要。本 PR で実装反映)
- 親タスク: `docs/30-workflows/completed-tasks/issue-827-member-detail-adapter-and-visibility-defense/`
- 仕様書: `docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind/`

## 検証結果

- [x] `mise exec -- pnpm typecheck`
- [x] `mise exec -- pnpm lint`
- [x] `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts` (10 passed)
- [x] `ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 mise exec -- pnpm --filter @ubm-hyogo/web build`
- [x] **DCE grep**: `grep -R "\[member-detail\] unknown kind" apps/web/.next/server apps/web/.open-next | wc -l` → `0`
- [x] visual snapshot baseline 不変
- [x] `mise exec -- pnpm gate-metadata:validate`
- [x] `mise exec -- pnpm verify:phase12-compliance`

## evidence

- `docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind/outputs/phase-11/typecheck.log`
- `docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind/outputs/phase-11/lint.log`
- `docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind/outputs/phase-11/adapter-test.log`
- `docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind/outputs/phase-11/focused-tests.log`
- `docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind/outputs/phase-11/build.log`
- `docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind/outputs/phase-11/dce-grep.txt`
- `docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind/outputs/phase-11/visual-snapshot-status.md`

## ロールバック

単一 commit のため `git revert <commit>` で完全復旧。adapter API に追加した named export (`ToMemberDetailPropsOptions` / `RawField`) は未参照だった追加 export のため、revert で外部 import を壊さない。
```

## Issue 連携方針

- Issue #883 は既に **CLOSED**。本 PR で reopen しない。
- 自動 close キーワード (`Closes #883`) は使わない。PR 本文では `Refs: #883` で参照のみ。

## Gate-C user-gated 項目

| 項目                                | 実行タイミング                  |
| ----------------------------------- | ------------------------------- |
| `git add` / `git commit`            | user 明示承認後                  |
| `git push -u origin <branch>`       | user 明示承認後                  |
| `gh pr create --base dev ...`       | user 明示承認後                  |
| Issue 操作                          | reopen / status 変更ともに不要   |
| staging / production deploy 検証    | 本タスク範囲外                   |

## 共通骨格補足

## 目的

本 Phase の仕様観点を固定し、issue-883 の実装・検証・文書同期が後続 Phase と矛盾しない状態にする。

## 実行タスク

- 本文に記載した対象ファイル、契約、検証、証跡を確認する。
- 漏れが見つかった場合は同一サイクル内で修正する。

## 参照資料

- `artifacts.json`
- `outputs/phase-11/`
- `outputs/phase-12/`

## 実行手順

1. 既存本文の仕様・実績を確認する。
2. 実コード、証跡、正本仕様との対応を照合する。
3. 差分があれば同一サイクル内で反映する。

## 統合テスト連携

NON_VISUAL だが実装タスクのため、adapter spec / web tests / typecheck / lint / build / DCE grep を Phase 11 evidence に接続する。

## 多角的チェック観点（AIが判断）

- 矛盾なし
- 漏れなし
- 整合性あり
- 依存関係整合

## サブタスク管理

本タスクは S1-S5 を同一 workflow 内で完了する。未タスク化は検出なし。

## 成果物

- 本 Phase ファイル
- 関連する実コード / evidence / Phase 12 outputs

## 完了条件

- [x] 本 Phase の記述が実装・証跡・正本仕様と一致している。
- [x] coverage AC は adapter spec / web test / typecheck / lint / build evidence で代替確認する。

## タスク100%実行確認【必須】

- [x] この Phase に必要な確認を実施済み。

## 次Phase

次 Phase へ進む前に、本 Phase の差分と evidence を確認する。

