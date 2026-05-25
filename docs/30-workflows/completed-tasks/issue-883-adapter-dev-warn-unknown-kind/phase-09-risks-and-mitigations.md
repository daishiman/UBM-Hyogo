# Phase 9: リスクと緩和策

[実装区分: 実装仕様書]

## メタ情報

| 項目     | 内容                                              |
| -------- | ------------------------------------------------- |
| タスクID | issue-883-adapter-dev-warn-unknown-kind           |
| Issue    | #883                                              |

## リスク一覧

| ID   | リスク                                                                                                | 影響                                                                  | 緩和策                                                                                                                                                                |
| ---- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-01 | **DCE 失敗**: production bundle に `"[member-detail] unknown kind"` 文字列が残る                       | production console に dev-only 文字列が漏れる / bundle size 増        | Phase 11 で `grep` 実測。0 件でない場合は `process.env.NODE_ENV === "development"` の表記揺れを疑い、`=== "development"` 等の代替表記に置き換えるか build 設定を再確認 |
| R-02 | **Turbopack 経路の DCE 信頼度低下**: Next.js 16 Turbopack は webpack と DCE 挙動が異なる              | local dev で warn が出る・production には影響しない（CLAUDE.md と整合） | Turbopack は local dev 限定運用。production deploy は `next build --webpack` 経路（CLAUDE.md 不変条件）。本タスクの DCE 検証は webpack 経路のみで判定                  |
| R-03 | **後方互換破壊**: 既存 8 ケースが何らかの理由で fail                                                  | 既存呼出 `toMemberDetailProps(profile)` が壊れる                       | `options = {}` を default に置く実装で型・実行ともに無変更。Phase 6 で既存 8 ケース無改修 green を必須化                                                               |
| R-04 | **callback throw**: page.tsx 以外から callback を渡し、その callback が throw した場合 adapter が連鎖失敗 | adapter pure 性破壊                                                   | Phase 4 契約で「callback は throw しない」と明文化。page.tsx 実装は `console.warn` のみ（throw 含まず）。adapter 自身は try/catch しない（隠蔽より明示失敗を優先）   |
| R-05 | **PII 漏出**: callback で `f.value` をログ出力してしまう                                              | dev console に PII が出る                                              | page.tsx の callback は `f.kind` / `f.stableKey` のみログ出力（DoD で明記）。code review で `console.warn(..., f.value)` 禁止を確認                                  |
| R-06 | **logger 連携の future creep**: Sentry / Workers Analytics への送信を追加したくなる                    | 本タスクのスコープを越え、production 経路にも副作用が及ぶ              | Phase 1 非ゴールで明示。logger 連携は別 issue で扱う。本タスクは dev console 観測の最小実装に限定                                                                     |
| R-07 | **adapter pure 性検査の見落とし**: 環境分岐を関数内に書く誘惑                                          | テスト時に環境変数 mock が必須化し case 爆発                          | Phase 5 実装ガイドで「adapter 内 `process.env.*` / `console.*` 禁止」を明記。code review で grep 確認                                                                |
| R-08 | **既存 silent skip ケース (TC-05) の意味喪失**: callback 注入なしでの silent skip 不変条件             | 後方互換が壊れる                                                      | TC-05 は無改修。callback 未注入時の挙動が変わらないことを「実装は `?.()` を使う」「テストは TC-05 で担保」の 2 重で保証                                              |

## 撤退条件

- R-01 が解消できない場合（grep が 0 にならない場合）は callback 注入方式を諦め、page.tsx 側で adapter 呼出後に sections を walk して unknown 検知する代替案を検討する。ただし本タスクの設計判断（採用案 / 却下案 (A)(B)(C) は Phase 2 §代替案）は変更しない。
- visual snapshot diff が発生した場合（render 結果不変前提が破られた場合）は実装ミスを疑い、adapter ロジックを修正。baseline 再生成は実施しない。

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

