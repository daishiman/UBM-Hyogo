[実装区分: 実装仕様書]

# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-06-ui-ux-contract-rewrite |
| Wave | 2 |
| 実行種別 | parallel |
| Phase 番号 | 6 / 13 |
| 作成日 | 2026-05-07 |
| 上流 Phase | 5（実装ランブック） |
| 下流 Phase | 7（AC マトリクス） |
| 状態 | completed |
| 区分 | implementation / NON_VISUAL |

## 目的

書き換え後 `09-ui-ux.md` に対する想定失敗ケースを網羅する。本タスクはコード実装ではなく markdown 書き換えのため、
HTTP status code（401/403/404/422/5xx）は対象外で、代わりに **視覚詳細混入の代表パターン検出 / login 5 状態漏れ /
API trace 漏れ / prototype 由来 19 行未取り込み / 不採用 4 項目欠落** を中心に異常系を構造化する。

## 実行タスク

1. 視覚詳細混入の代表パターン（HEX / oklch / px / Tailwind arbitrary）の検出条件と修復手順を定義
2. login 5 状態漏れ検出（input / sent / unregistered / deleted / error 各々の単独欠落をケース化）
3. API trace 漏れ検出（phase-3.md §2 と新 §2 の差分検出）
4. prototype 由来 19 行未取り込み検出（§4.5 表の checklist 化）
5. 不採用 4 項目欠落検出（§4.6 表の §8 突合）
6. 構造異常（章数 ≠ 10 / routes 数 < 19 / link 切れ）の検出
7. outputs/phase-06/main.md 作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-04/main.md` | テスト戦略 |
| 必須 | `outputs/phase-05/main.md`, `outputs/phase-05/runbook.md` | step ごとの sanity |
| 必須 | 元仕様書 §4.5 / §4.6 / §6.2 / §6.4 | 異常検出の正本 |
| 必須 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` §2 | API trace 比較対象 |

## 実行手順

### ステップ 1: failure case 表作成

カテゴリ:
- 視覚詳細混入（HEX / oklch / px / `bg-[#...]`）
- 状態列挙漏れ（login 5 状態 / ページ標準 5 値 / pending state）
- API trace 漏れ（routes × endpoint × method の不一致）
- prototype 由来 19 行未取り込み
- 不採用 4 項目欠落
- a11y 契約欠落（dialog / drawer / form / live region）
- 構造異常（章立て不一致 / routes 不足 / link 切れ）

### ステップ 2: 各ケースに「期待される検出 / 修復手順」を対応

### ステップ 3: outputs/phase-06/main.md 作成

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case を AC マトリクスの異常系列で参照 |
| Phase 9 | §6.2 grep gate / markdown lint / link 健全性の自動化方針に紐付け |

## 多角的チェック観点（不変条件参照）

- **#1**: 視覚詳細値混入は CI 不可（grep で blocker）
- **#5**: 契約上 D1 binding 記述があれば即修正
- **#6**: prototype 由来でも localStorage / EDITMODE は §8 で削除を強制
- **#7**: dialog / drawer の a11y 契約欠落 → 修復必須

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 視覚詳細混入ケース | 6 | completed | 4 パターン |
| 2 | 状態列挙漏れケース | 6 | completed | login 5 状態 + pending |
| 3 | API trace 漏れケース | 6 | completed | phase-3 §2 突合 |
| 4 | prototype 19 行未取込ケース | 6 | completed | §4.5 checklist |
| 5 | 不採用 4 項目欠落ケース | 6 | completed | §4.6 突合 |
| 6 | a11y / 構造異常ケース | 6 | completed | dialog/drawer 等 |
| 7 | outputs 作成 | 6 | completed | outputs/phase-06/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-06/main.md` | failure cases + 修復手順 |
| メタ | `artifacts.json` | Phase 6 を completed |

## 完了条件

- [ ] failure case 18 件以上が列挙
- [ ] 不変条件違反 trigger 4 件以上
- [ ] 各ケースに修復手順 1 行以上

## タスク 100% 実行確認【必須】

- [ ] 全 7 サブタスク completed
- [ ] outputs/phase-06/main.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 7（AC マトリクス）
- 引き継ぎ事項: failure case → AC matrix 異常系列
- ブロック条件: outputs/phase-06/main.md 未作成

## Failure Cases 一覧

| # | カテゴリ | ケース | 期待検出 | 修復手順 |
| --- | --- | --- | --- | --- |
| 1 | 視覚詳細混入 | HEX 値（例 `#0ea5e9`）残存 | `grep -nE '#[0-9a-fA-F]{3,8}\b' $F` 1 件以上 | 該当行を削除し、`token` 列の `--ubm-color-*` 参照名に置換 |
| 2 | 視覚詳細混入 | `oklch(...)` 値直書き | `grep -nE 'oklch\(' $F` 1 件以上 | 09b への link に置換 |
| 3 | 視覚詳細混入 | `px` 値直書き（例 `16px`） | `grep -nE '\b[0-9]+px\b' $F` 1 件以上 | `--ubm-space-*` 参照名に置換 |
| 4 | 視覚詳細混入 | Tailwind arbitrary 値（`bg-[#...]`） | `grep -nE '\bbg-\[' $F` 1 件以上 | token 化 + 09a link |
| 5 | 状態列挙漏れ | §4.2 から `input` 状態欠落 | `grep -E '\binput\b' §4.2 ブロック` 0 件 | pages-member.jsx L4-L67 から再抽出 |
| 6 | 状態列挙漏れ | §4.2 から `sent` 状態欠落 | 同上 | 同上 |
| 7 | 状態列挙漏れ | §4.2 から `unregistered` 状態欠落 | 同上 | 同上 |
| 8 | 状態列挙漏れ | §4.2 から `deleted` 状態欠落 | 同上 | 同上 |
| 9 | 状態列挙漏れ | §4.2 から `error` 状態欠落 | 同上 | 同上 |
| 10 | 状態列挙漏れ | §4.3 申請 pending（server-pending 上書き禁止）欠落 | 「server-pending」grep 0 件 | §4.3 に追記 |
| 11 | API trace 漏れ | phase-3.md §2 routes に存在し新 §2 に欠落 | `diff <(phase-3 §2) <(09-ui-ux §2 API 列)` 差分 | 欠落 endpoint を該当 route の API 列に追記 |
| 12 | API trace 漏れ | endpoint method 不一致（GET ↔ POST） | 同上 | phase-3 §2 を正本として修正 |
| 13 | prototype 19 行未取込 | Chip tone 列挙欠落 | §3.1 Badge から `default/accent/ok/warn/danger/info` 漏れ | primitives.jsx L6-L14 から再転記 |
| 14 | prototype 19 行未取込 | Drawer の `role="dialog"` 欠落 | §3.1 Drawer / §5.2 で grep 0 件 | primitives.jsx L158-L174 から再転記 |
| 15 | prototype 19 行未取込 | Toast 自動消滅 3.2s 言及欠落 | grep 0 件 | primitives.jsx L198-L223 から転記 |
| 16 | prototype 19 行未取込 | LoginPage 5 状態未取込 | §4.2 不足 | pages-member.jsx L4-L67 から転記 |
| 17 | prototype 19 行未取込 | MyProfilePage 4 領域未取込 | §2.2.2 主 props に `banner/summary/request/delete` 不足 | pages-member.jsx L220-L373 から転記 |
| 18 | 不採用 4 項目欠落 | tweaks パネル / theme switcher 不採用記述欠落 | §8 に該当行なし | §4.6 1 行目を §8 に転記 |
| 19 | 不採用 4 項目欠落 | localStorage photo store 不採用記述欠落 | 同上 | §4.6 2 行目を §8 に転記 |
| 20 | 不採用 4 項目欠落 | data-theme 切替 不採用記述欠落 | 同上 | §4.6 3 行目を §8 に転記 |
| 21 | 不採用 4 項目欠落 | gas-prototype 由来 不採用記述欠落 | 同上 | §4.6 4 行目を §8 に転記 |
| 22 | a11y 欠落 | §5.2 dialog / drawer に `aria-modal="true"` 欠落 | grep 0 件 | §5.2 に「role=dialog + aria-modal=true + focus trap + Esc close」を完全記述 |
| 23 | a11y 欠落 | §5.3 form/input で `aria-describedby` 欠落 | grep 0 件 | §5.3 に追記 |
| 24 | a11y 欠落 | §5.4 live region で `role="status"` / `role="alert"` 区別欠落 | grep 0 件 | §5.4 に追記 |
| 25 | 構造異常 | 章数 ≠ 10 | `grep -c '^## '` ≠ 10 | スケルトンと突合し欠落章を補完 |
| 26 | 構造異常 | routes 数 < 19 | `grep -c '^### 2\.'` < 19 | 欠落 route の sub-heading を追加 |
| 27 | 構造異常 | 09a / 09b への相対 link 切れ | markdown link checker fail | path を `../specs/09a-prototype-map.md` 等に修正 |
| 28 | 構造異常 | §3 で primitives 13 未満 | `grep -c '^#### 3\.1\.'` < 13 | 欠落 primitive の sub-heading を追加 |
| 29 | 不変条件違反 #1 | 09b の値を 09-ui-ux に再掲 | oklch 値 grep 検出 | 削除して link のみに |
| 30 | 不変条件違反 #5 | 「apps/web から D1 へ」の記述 | grep `D1.*apps/web` 検出 | 削除（API 経由のみと明記） |

## 不変条件違反 trigger（4 件以上）

| # | 不変条件 | trigger | 対応 |
| --- | --- | --- | --- |
| 1 | #1（視覚詳細値の二重管理回避） | 09-ui-ux.md に oklch / HEX 直書き | grep gate で blocker、修復は 09b へ link |
| 2 | #5（D1 直接アクセス禁止） | 「apps/web から D1 binding を利用」記述 | 削除し API 経由のみと明記 |
| 3 | #6（GAS prototype 非昇格） | gas-prototype 由来仕様を contract 化 | §8 で「不採用」明記 |
| 4 | #7（dialog/drawer a11y） | `role="dialog"` のみで `aria-modal` / focus trap / Esc 欠落 | §5.2 に完全文を記述 |
