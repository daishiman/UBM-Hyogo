# Phase 13 — 変更概要

> ステータス: `implemented_local_runtime_pending`。実装差分とローカル検証結果を記録する。screenshot 取得、commit、PR、push は user 承認後のみ。

---

## 1. 変更ファイル一覧

| 区分 | パス | 変更 | 証跡 |
| --- | --- | --- | --- |
| 修正 | `apps/web/src/components/admin/RequestQueueDetail.tsx` | `formatPublishStateLabel` / `buildPublishStateDiff` 純関数追加 + dl に `変更前 → 変更後` diff 行新設 | `RequestQueueDetail.spec.tsx` |
| 修正 | `apps/web/src/components/admin/RequestQueuePanel.tsx` | helper を再利用して `destructiveMessage` で具体遷移文言を組み立て | `RequestQueuePanel.component.spec.tsx` |
| 修正 | `apps/web/src/components/admin/RequestConfirmDialog.tsx` | 既存 `destructiveMessage` props 経由で通常説明文 / destructive alert を分離表示 | `RequestConfirmDialog.spec.tsx` |
| 修正 | `apps/web/src/styles/globals.css` | `[data-diff-side="before|after"]` diff 強調クラス（既存 OKLch トークンのみ） | verify-design-tokens |
| 修正（追従） | `apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx` | note_type 別 diff 行 / fail-soft / a11y assertion 追加 | focused vitest |
| 修正（追従） | `apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx` | 非 destructive message assertion 追加 | focused vitest |
| 修正（追従） | `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` | `destructiveMessage` 具体化 assertion 追加 | focused vitest |
| **変更なし** | `apps/api/**` / `packages/shared/**` | AC-7 | diff 0 件確認済み |

## 2. AC 充足記録

| AC | 充足 | 証跡 |
| --- | --- | --- |
| AC-1 公開状態 diff（公開 → 非公開） | [x] | `RequestQueueDetail.spec.tsx` / code diff |
| AC-2 退会レコード状態遷移（在籍 → 退会） | [x] | `RequestQueueDetail.spec.tsx` |
| AC-3 publishState 日本語ラベル化 | [x] | `formatPublishStateLabel` spec |
| AC-4 OKLch token 整合 | [x] | token-audit / design-tokens.md |
| AC-5 HEX 0 件 | [x] | verify-design-tokens PASS |
| AC-6 新規 primitive 0 | [x] | `data-diff-side` 属性 + 既存 primitive |
| AC-7 API/D1/shared 不変 | [x] | `apps/api`/`packages/shared` diff 0 |
| AC-8 ダイアログ具体遷移文言 | [x] | `RequestQueuePanel.component.spec.tsx` |
| AC-9 a11y（矢印 aria-hidden） | [x] | `RequestQueueDetail.spec.tsx` |
| AC-10 既存 3 spec green 維持 | [x] | focused vitest 3 files |

## 3. テスト結果

| スイート | 件数 | 結果 |
| --- | --- | --- |
| requests admin component spec（3 本） | 27 tests | PASS |
| token gate | 9 tests | PASS |
| typecheck / lint | repo workspace | PASS |

## 4. screenshot 取得記録（実装後に埋める）

| canonical 名 | 取得 |
| --- | --- |
| request-approve-visibility-public-to-hidden | [ ] |
| request-approve-visibility-hidden-to-public | [ ] |
| request-approve-delete-enroll-to-withdraw | [ ] |

> Runtime screenshot は未取得。local evidence と staging visual evidence を分離して扱う。
