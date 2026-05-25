# Phase 8: Definition of Done

[実装区分: 実装仕様書]

## メタ情報

| 項目     | 内容                                              |
| -------- | ------------------------------------------------- |
| タスクID | issue-883-adapter-dev-warn-unknown-kind           |
| Issue    | #883                                              |

## DoD チェックリスト

### 実装

- [x] `apps/web/src/lib/adapters/member-detail.ts` に `ToMemberDetailPropsOptions` interface が export されている
- [x] `apps/web/src/lib/adapters/member-detail.ts` で `RawField` 型が export されている
- [x] `toMemberDetailProps` が `(profile, options?)` の 2 引数シグネチャになっている
- [x] `normalizeField` の `FieldKindZ.safeParse` 失敗ブランチで `onUnknownKind?.(field)` が呼ばれている
- [x] `normalizeSection` / `toMemberDetailProps` が `onUnknownKind` を `normalizeField` へ propagate している
- [x] adapter 内に `console.*` / `process.env.*` 直接参照が **ない**（pure 維持）

### page.tsx 注入

- [x] `apps/web/app/(public)/members/[id]/page.tsx` が `toMemberDetailProps(profile, { onUnknownKind: ... })` 形で呼び出している
- [x] callback は `process.env.NODE_ENV === "development"` のときのみ関数、production では `undefined`
- [x] callback 本体は `console.warn("[member-detail] unknown kind", f.kind, f.stableKey)` のみ（throw / async なし）
- [x] callback で `f.value` を出力していない（PII 漏出防止）

### テスト

- [x] `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` のケース数が 8 → 9 に増えている
- [x] 新規ケースが `vi.fn()` で `onUnknownKind` を mock している
- [x] 新規ケースが `toHaveBeenCalledTimes(1)` と `toHaveBeenCalledWith(expect.objectContaining({ kind, stableKey }))` を assert している
- [x] 既存 8 ケースが無改修で全 green

### 品質ゲート

- [x] `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` 成功
- [x] `mise exec -- pnpm --filter @ubm-hyogo/web lint` 成功
- [x] `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` 10 passed
- [x] `ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 mise exec -- pnpm --filter @ubm-hyogo/web build` 成功
- [x] **`grep -R "\[member-detail\] unknown kind" apps/web/.next/server apps/web/.open-next 2>/dev/null | wc -l` の出力が `0`**
- [x] `mise exec -- pnpm gate-metadata:validate` 成功
- [x] `mise exec -- pnpm verify:phase12-compliance` 成功

### evidence

- [x] `outputs/phase-11/typecheck.log` 取得
- [x] `outputs/phase-11/lint.log` 取得
- [x] `outputs/phase-11/adapter-test.log` 取得
- [x] `outputs/phase-11/focused-tests.log` 取得
- [x] `outputs/phase-11/build.log` 取得
- [x] `outputs/phase-11/dce-grep.txt` 取得（`0` を含む）

## Issue #883 完了条件との対応

| Issue #883 完了条件                                                          | 対応 DoD 項目                              |
| ---------------------------------------------------------------------------- | ------------------------------------------ |
| adapter シグネチャ後方互換拡張 (`options` optional 第2引数)                  | 実装 §1〜§3                                |
| spec 10 ケース全 green（既存 8 + callback 検証 1）                            | テスト §1〜§4                              |
| page.tsx callback 注入 (dev 環境のみ `console.warn`)                          | page.tsx 注入 §1〜§4                       |
| production bundle DCE 確認 (`[member-detail] unknown kind` 文字列 0 件)       | 品質ゲート §DCE / evidence §dce-grep.txt   |

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

