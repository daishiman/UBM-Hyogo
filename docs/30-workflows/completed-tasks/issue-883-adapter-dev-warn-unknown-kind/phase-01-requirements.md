# Phase 1: 要件定義

[実装区分: 実装仕様書]
**判定根拠:** Issue #883 の本文に列挙された完了条件（adapter シグネチャ後方互換拡張・spec 10 ケース全 green・page.tsx callback 注入・production bundle DCE 確認）は、`apps/web/src/lib/adapters/member-detail.ts` の関数シグネチャ拡張、`apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` のテストケース追加、`apps/web/app/(public)/members/[id]/page.tsx` の callback 注入を伴う実コード変更を必須とする。ドキュメントだけでは完了条件を満たせないため実装仕様書として扱う。

## メタ情報

| 項目         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| タスクID     | issue-883-adapter-dev-warn-unknown-kind                                               |
| タスク名     | adapter `toMemberDetailProps` の unknown kind 観測 helper（dev 環境のみ）             |
| 分類         | 改善（DX / 観測性）                                                                   |
| 対象機能     | `apps/web/src/lib/adapters/member-detail.ts` + page.tsx                               |
| 優先度       | 低                                                                                    |
| 見積もり規模 | 小規模                                                                                |
| Issue        | #883 (CLOSED, 本文の実装は未反映)                                                     |
| 発見元       | serial-06 Phase 9 §3「unknown field 出現時 fallback」の deferred 判断                |
| 関連         | parent: `docs/30-workflows/completed-tasks/issue-827-member-detail-adapter-and-visibility-defense/` |

## 背景

serial-06 / issue #827 で `toMemberDetailProps` adapter は unknown `kind` を **silent skip** で処理する設計を採用した（`FieldKindZ.safeParse` 失敗時に `null` を返す）。理由は production の console を汚さないため。Phase 9 §3 では「development では `console.warn` を出す方針も検討可」と保留しており、本タスクでその hook を提供する。

現状の adapter 実装（`apps/web/src/lib/adapters/member-detail.ts`）:

- `toMemberDetailProps(profile)` は単一引数。
- `normalizeField` の `FieldKindZ.safeParse` 失敗ブランチで `return null;` のみ（観測 hook なし）。
- callback / logger 注入機構なし。

現状の page.tsx（`apps/web/app/(public)/members/[id]/page.tsx`）:

- `toMemberDetailProps(profile)` を呼んでいる。callback 注入なし。

現状の spec（`apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`）: 8 ケース。「unknown kind を silent skip する」ケースあり。callback 検証ケースなし。

## ゴール

1. adapter の pure 性を保ったまま、dev 環境で unknown kind を観測する hook を提供する。
2. production bundle に dev-only コード（warn 文字列）が dead-code elimination により残らないことを保証する。
3. adapter spec を 10 ケースに拡張し、callback が呼ばれる経路を branch coverage に含める。

## 非ゴール

- production 経路への logger 出力追加（Sentry / Workers Analytics / console.warn）
- `PublicMemberProfileZ` schema 変更 / `FieldKindZ` enum 拡張
- API surface 変更（既存 endpoint 不変）
- D1 直接アクセス（不変条件 #5 維持）
- adapter 内での環境分岐（`process.env.NODE_ENV` を関数内に書かない）
- visual snapshot baseline 更新（render 結果不変）

## 入出力

| 項目     | 内容                                                                                   |
| -------- | -------------------------------------------------------------------------------------- |
| 入力     | `PublicMemberProfile` (zod 検証済み) + optional `options: { onUnknownKind?: (field: RawField) => void }` |
| 出力     | `MemberDetailProps`（既存型・shape 不変）                                              |
| 副作用   | なし（callback を渡された場合のみ呼出側に副作用が発生する。adapter 自身は pure 維持） |

## 成功基準

| 区分 | 基準                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------ |
| 機能 | callback 未指定時の挙動が現状と完全一致（既存 8 ケース pass）                                          |
| 機能 | callback 指定時、unknown kind の field が来ると callback が field 引数つきで呼ばれる（新規 1 ケース）  |
| 機能 | page.tsx が dev 環境で `console.warn` を含む callback を注入し、production では `undefined` を渡す     |
| 品質 | `pnpm --filter @ubm-hyogo/web build`（`next build --webpack` 経路）後の bundle に `"unknown kind"` 文字列が **0 件** |
| 品質 | adapter は引き続き pure（spec の「入力を mutate しない」ケース green 維持）                            |

## 不変条件（本タスクで破ってはならない）

1. adapter の pure 性: 環境分岐を関数内に書かない。副作用は callback として外から注入する。
2. 後方互換: 既存呼出 `toMemberDetailProps(profile)` を変更しなくても動作する（`options` は optional + default `{}`）。
3. production bundle DCE: `next build --webpack` 経路で warn 文字列が消える前提（CLAUDE.md「`next build --webpack` を正本とする」と整合）。
4. `apps/web` から D1 直接アクセス禁止（不変条件 #5）。
5. `PublicMemberProfileZ` / `FieldKindZ` の shape を変更しない。
6. 新規 test ファイルは `*.spec.{ts,tsx}` のみ（既存 spec への追記なので影響なし）。

## CONST_005 必須項目への接続

| 項目               | 本タスクでの位置付け                                                                   |
| ------------------ | -------------------------------------------------------------------------------------- |
| Why                | Google Form の `kind` 追加を dev loop で早期検知し、UI 反映漏れを production 後発見にしない |
| What               | adapter optional callback + page.tsx 環境別注入                                        |
| How (アーキ概要)   | callback 注入方式（Phase 2 で詳述）                                                    |
| 成功基準           | 上記成功基準テーブル                                                                   |
| 非ゴール           | 上記非ゴールセクション                                                                 |
| 影響範囲           | adapter 1 / spec 1 / page.tsx 1 の計 3 ファイル                                        |
| 不変条件           | 上記不変条件セクション                                                                 |

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

