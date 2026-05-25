# Phase 12: ドキュメント

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | issue-883-adapter-dev-warn-unknown-kind |
| Issue | #883 |
| ステータス | completed |
| visualEvidence | NON_VISUAL |

## 概要

issue #883 (serial-06 followup-002): `toMemberDetailProps` adapter に dev 環境のみで unknown kind を観測する optional callback (`onUnknownKind`) を追加し、`/(public)/members/[id]/page.tsx` から `NODE_ENV === "development"` のときだけ `console.warn` callback を注入する。production bundle には dev-only 文字列が DCE で残らないことを実測で確認する。adapter の pure 性 / 既存 API の後方互換は完全に維持する。

## 変更点

- `apps/web/src/lib/adapters/member-detail.ts`
  - `ToMemberDetailPropsOptions` interface を新規 export（`onUnknownKind?: (field: RawField) => void`）。
  - `RawField` 型を export（spec / 呼出側 callback 引数の型参照のため）。
  - `toMemberDetailProps` シグネチャを `(profile, options: ToMemberDetailPropsOptions = {})` に拡張。既存単一引数呼出は無改修で動作。
  - `normalizeField` / `normalizeSection` を内部的に `onUnknownKind` propagate 対応に拡張。
  - `normalizeField` の `FieldKindZ.safeParse` 失敗ブランチで `onUnknownKind?.(field)` を呼んでから `null` 返却。
- `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`
  - `vi` import 追加。
  - TC-09「unknown kind 出現時に onUnknownKind callback が呼ばれる」を追加（8 → 10 ケース）。
- `apps/web/app/(public)/members/[id]/page.tsx`
  - `toMemberDetailProps(profile, { onUnknownKind: ... })` 形に変更。
  - callback は `process.env.NODE_ENV === "development"` の三項分岐で `(f) => console.warn("[member-detail] unknown kind", f.kind, f.stableKey)` または `undefined`。

## 影響範囲

- 影響対象は 3 ファイル閉路（adapter / spec / page.tsx）。他 primitive / route / API / D1 schema への波及なし。
- `MemberDetail` / `MemberLinks` / `MemberActivity` の render 結果は不変（visual snapshot baseline 更新不要）。
- API surface 不変（`apps/api` 改修なし）。D1 直接アクセス禁止（不変条件 #5）維持。
- `PublicMemberProfileZ` / `FieldKindZ` schema 不変。
- 既存 8 spec ケース無改修。component / view-model / API 側 spec すべて無改修。

## 関連 Issue / PR

- Issue: https://github.com/daishiman/UBM-Hyogo/issues/883 (CLOSED のまま・本仕様で実装反映)
- 親タスク: `docs/30-workflows/completed-tasks/issue-827-member-detail-adapter-and-visibility-defense/`
- 起点: serial-06 Phase 9 §3 「unknown field 出現時 fallback」の deferred 判断

## 仕様書整合

- `docs/00-getting-started-manual/specs/01-api-schema.md` の `FieldKindZ` enum は本タスクで変更しない。
- `docs/00-getting-started-manual/specs/13-mvp-auth.md` への影響なし（認証経路に変更なし）。
- CLAUDE.md 不変条件:
  - 不変条件 #5 (D1 直接アクセス禁止): 維持。
  - 「production build は `next build --webpack` を正本」: DCE 信頼根拠として明示参照。
  - 「`apps/web` で `process.env.*` 直接参照禁止」: page.tsx の `process.env.NODE_ENV` は env.ts 経由対象外（build-time 静的置換のため runtime env ではない）。env.ts は runtime env（API_BASE_URL 等）専用。

## 検証結果

| 検証                        | 期待                              | 取得先                                   |
| --------------------------- | --------------------------------- | ---------------------------------------- |
| typecheck                   | exit 0                            | `outputs/phase-11/typecheck.log`         |
| lint                        | exit 0                            | `outputs/phase-11/lint.log`              |
| adapter spec                | 10 passed                          | `outputs/phase-11/adapter-test.log`      |
| web focused tests           | 既存 pass +1                      | `outputs/phase-11/focused-tests.log`     |
| production build            | Compiled successfully             | `outputs/phase-11/build.log`             |
| DCE grep                    | `0`                               | `outputs/phase-11/dce-grep.txt`          |
| visual snapshot             | baseline 不変                     | `outputs/phase-11/visual-snapshot-status.md` |
| verify:phase12-compliance   | exit 0                            | terminal execution log                   |
| gate-metadata:validate      | exit 0 / ERROR: 0                 | terminal execution log                   |

## 未解決事項

- Sentry / Workers Analytics への production 経路 logger 連携は本タスク非ゴール。必要が出た時点で別 issue で扱う。
- Turbopack 経路の DCE 挙動は本タスク検証対象外（local dev 限定運用 / production deploy は webpack 経路）。
- `FieldKindZ` enum が将来拡張された場合の adapter 表示判定追従は別タスク（issue-827 残課題 R-01 と同じ管理）。

## ロールバック

- 単一 commit 構成想定のため `git revert <commit>` で完全復旧。
- 3 ファイルとも編集のみ（新規ファイル 0 / 削除ファイル 0）。revert 後は adapter シグネチャが `(profile)` 単一引数に戻り、既存 8 ケースのみで green を維持する。
- adapter API surface に `ToMemberDetailPropsOptions` / `RawField` の export を増やしているが、これらは未参照だった追加 export なので revert で外部 import を壊さない。

## evidence

- `outputs/phase-11/typecheck.log` — `mise exec -- pnpm typecheck` の生ログ
- `outputs/phase-11/lint.log` — `mise exec -- pnpm lint` の生ログ
- `outputs/phase-11/adapter-test.log` — adapter spec 10 case green の生ログ
- `outputs/phase-11/focused-tests.log` — web 全 vitest の生ログ
- `outputs/phase-11/build.log` — `next build --webpack` の生ログ
- `outputs/phase-11/dce-grep.txt` — production artifact 内 `[member-detail] unknown kind` 件数（`0`）
- `outputs/phase-11/visual-snapshot-status.md` — visual baseline 不変記録

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
