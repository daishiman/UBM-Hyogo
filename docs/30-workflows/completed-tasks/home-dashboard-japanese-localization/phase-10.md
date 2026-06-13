# Phase 10 — 最終レビュー（受入条件判定 + GO/NO-GO）

> 本 Phase は `_shared-context.md`（SSOT）§4 DoD・§2 不変条件・§3 変更ファイルを正本として参照する。
> Phase 5〜9 で確定した実装仕様・テスト仕様・カバレッジ観点を統合し、本タスク（implemented_local_evidence_captured）を
> 「実装着手可能な完成仕様」として承認できるかを判定する。

## 目的

ホーム画面（公開トップ `/`）の英語表記日本語化 + 英語 overline 削除の実装仕様書（implemented_local_evidence_captured）について、
受入条件 AC-1〜AC-8 をすべて仕様レベルで満たしているかを最終確認し、blocker の有無を判定する。
本サイクルはcommit・PR を行わない（user-gated）ため、ここでの GO 判定は
「**仕様書として完成し、後続実装者がそのまま着手できる**」ことを意味する。

受入条件は SSOT §4 DoD と 1:1 対応する 8 項目（AC-1〜AC-8）として整理する。

## 成果物

### 受入条件（AC-1〜AC-8）と判定

| AC | 内容（SSOT §4 DoD 対応） | 検証手段（仕様） | 判定 |
| --- | --- | --- | --- |
| AC-1 | 統計カード4ラベルが日本語（公開メンバー/事業フェーズ/年間の支部会/最終データ更新）になる | T1 vitest（`[data-stat] [data-role="label"]`）+ SSOT §1.A | 仕様確定（PASS） |
| AC-2 | 同期バッジが「自動で最新化」になる | T1 vitest `toContain("自動で最新化")` + SSOT §1.B | 仕様確定（PASS） |
| AC-3 | 英語 overline（eyebrow）6 箇所が削除され `[data-role="eyebrow"]` が 0 件 | T2/T3/T4 vitest + SSOT §1.C | 仕様確定（PASS） |
| AC-4 | dead CSS（eyebrow ルール 4 件）が削除され CTA heading 余白が調整される | F6 セレクタ特定削除 + Phase 11 視覚証跡（user-gated） | 仕様確定（PASS・視覚は実装後） |
| AC-5 | 値・サブ行・dot・DOM contract（eyebrow 除く）が不変 | 不変条件 #3 + T1〜T6 の非破壊 assert | 仕様確定（PASS） |
| AC-6 | ホーム画面の英語表記残存が 0（回帰 grep） | SSOT §4-4 grep ヒット 0 | 仕様確定（PASS） |
| AC-7 | apps/api・packages/shared が非接触（diff 空） | SSOT §4-5 `git diff dev` 空 | 仕様確定（PASS） |
| AC-8 | OKLch トークン正本維持・HEX 0・追加色 0 | `verify-design-tokens` gate | 仕様確定（PASS） |

### blocker 判定

| 観点 | 結果 |
| --- | --- |
| 仕様の矛盾（行番号・文言・data-role 契約） | なし（SSOT §1 で一意確定） |
| 仕様の漏れ（変更ファイル・テスト・検証コマンド） | なし（SSOT §3/§4 で網羅） |
| 不変条件違反のリスク | なし（apps/web 内のみ・新規 component 0・API endpoint/shared contract 不変） |
| user-gated 越境のリスク | なし（実装/commit/PR は Phase 13 で明示 pending） |

> blocker 0 件。実装サイクルへ進める仕様完成度に達している。

### 関連成果物
- `outputs/phase-10/main.md` — 最終レビューの観点・判定根拠サマリ。
- `outputs/phase-10/go-no-go.md` — GO/NO-GO 判定書（本 Phase の結論）。

## 統合テスト連携

- AC-1〜AC-3・AC-5 は Phase 6 の focused vitest（T1〜T6・SSOT §4-1）で検証される。
- AC-6（英語残存 0）は SSOT §4-4 の回帰 grep、AC-7（diff 空）は SSOT §4-5 grep、
  AC-8（HEX 0）は `verify-design-tokens` gate で検証され、いずれもコンポーネントテスト外の gate で担保する。
- AC-4 の CSS（F6）は jsdom 非評価のため、構造検証（dead rule 消失）+ Phase 11 スクリーンショット（user-gated）の
  二段で確認する。本 Phase ではこれらが Phase 6/7/11 に正しく連携されていることを確認した。

## 完了条件

- [ ] AC-1〜AC-8 が表で列挙され、各 AC に検証手段（spec 名 / grep / gate）が対応づいている
- [ ] blocker 判定が記録され、blocker 0 件であることが明記されている
- [x] go-no-go.md に GO 判定（implemented_local_evidence_captured として完成・commit/PR は user-gated）が記録されている
- [ ] user-gated 境界（実装/commit/PR は Phase 13）が Phase 10 で逸脱していないことが確認されている
- [ ] 仕様の矛盾・漏れ・不変条件違反が無いことが記録されている
