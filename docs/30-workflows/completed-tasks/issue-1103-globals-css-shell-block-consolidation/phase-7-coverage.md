# Phase 7: カバレッジ確認 — issue-1103 globals.css 重複 shell ブロック 1 本化

> **[実装区分: 実装仕様書 / NON_VISUAL]**
> implementation_mode: new / status: implemented_local_evidence_captured（commit・push・PR は user-gated）

## 1. 方針（CSS の「カバレッジ」定義）

本タスクは CSS の重複ブロック削除であり、TS の line / branch coverage は対象にならない。代わりに **変更対象の構造的カバレッジ** = 「削除する後発ブロックの全 selector が、残す先発ブロックに 1 対 1 で対応していること」を照合表で可視化する。byte 一致が前提のため対応は完全 1:1 であることを構造的に裏付ける。

## 2. selector 1 対 1 対応照合表

削除対象（後発ブロック / 重複 2 個目）に含まれる全 selector が、残存ブロック（先発 / 重複 1 個目）に同一定義で存在することを照合する。**byte 一致（Phase 4 TC-1c）が証明済みのため全行が 1:1 で対応する。**

| カテゴリ | selector | 残存ブロック（先発）に存在 | 削除後の参照先 |
| --- | --- | --- | --- |
| route | `[data-route]` | ✓ | 先発（page surface） |
| section | `[data-section]` | ✓ | 先発（section rhythm） |
| section | `[data-section-rhythm="compact"]` | ✓ | 先発 |
| section | `[data-section-rhythm="comfortable"]` | ✓ | 先発 |
| section | `[data-section-rhythm="loose"]` | ✓ | 先発 |
| card | `[data-card]` | ✓ | 先発（card chrome） |
| card | `[data-card-tone="panel"]` | ✓ | 先発 |
| card | `[data-card-tone="surface"]` | ✓ | 先発 |
| card | `[data-card-tone="emphasis"]` | ✓ | 先発 |
| card | `[data-card-tone="flat"]` | ✓ | 先発 |
| shell | `[data-shell="topbar"]` | ✓ | 先発（shell surface） |
| shell | `[data-shell="sidebar"]` | ✓ | 先発（1708 由来） |
| shell | `[data-shell="footer"]` | ✓ | 先発 |
| text | `[data-text]` | ✓ | 先発（typography scale） |
| text | `[data-text="display"]` | ✓ | 先発 |
| text | `[data-text="title"]` | ✓ | 先発 |
| text | `[data-text="section"]` | ✓ | 先発 |
| text | `[data-text="card"]` | ✓ | 先発 |
| text | `[data-text="body"]` | ✓ | 先発 |
| text | `[data-text="caption"]` | ✓ | 先発 |
| text | `[data-text="eyebrow"]` | ✓ | 先発 |

> 上記 21 selector はすべて両ブロックに同一宣言で存在。削除後はすべて先発ブロックが唯一の供給源となる。**未対応（先発に存在しない）selector はゼロ** = カバレッジ 100%。

## 3. dependency edge（consumer カバレッジ）

削除ブロックを参照していた consumer（HTML 側の data-attribute 利用箇所）が、残存ブロックで完全にカバーされることを確認する。

| consumer 種別 | 例 | カバレッジ |
| --- | --- | --- |
| `[data-shell="sidebar"]` を持つ DOM（shell サイドバー） | shell コンポーネントの sidebar 要素 | 先発ブロックが同一宣言を供給 → computed style 不変 |
| `[data-shell="topbar"]` / `[data-shell="footer"]` を持つ DOM | shell トップバー / フッター | 同上 |
| `[data-route]` / `[data-section]` / `[data-card]` / `[data-text]` を持つ DOM | 各レイアウト要素 | 同上 |

- 削除前は「先発 + 後発の二重定義（後発が last-wins で上書き、ただし byte 一致なので結果同一）」、削除後は「先発のみ」。**いずれの consumer も computed style が不変**であることが byte 一致から構造的に保証される。

## 4. 除外スコープ（変更範囲外）

Feedback BEFORE-QUIT-002 準拠で、本タスクの変更範囲外は coverage 対象外と明記する:

- `[data-route-group="admin"] [data-shell="sidebar"]`（元 2306 行 / `@media (max-width:767px)` 内）= **admin スコープ派生・削除対象外**。先発ブロックの基底定義とは別レイヤーの override であり、本タスクでは一切変更しない。
- token 定義（`apps/web/src/styles/tokens.css`）、shell コンポーネント、`globals.css` の他ブロック（parallel-02 / parallel-09 / admin-ui-prototype-alignment など）= 変更範囲外。

## 5. カバレッジ判定サマリ

| 観点 | 指標 | 結果 |
| --- | --- | --- |
| selector 1:1 対応 | 後発 21 selector / 先発被覆 | 21 / 21（100%） |
| consumer カバレッジ | 削除前後で computed style 不変 | 全 consumer 不変（byte 一致が保証） |
| 構造検証（grep / diff） | Phase 4 TC-1c / TC-2a / TC-2b / TC-2c | 全 PASS 期待 |
| token gate 回帰 | tokens.runtime.spec.ts | PASS 維持 |
| build | next build --webpack | exit 0 |

> 実 UI 描画の視覚カバレッジ（shell sidebar / topbar / footer の表示崩れ確認）は NON_VISUAL のためスクリーンショットでは取得しない。Phase 11 では byte-identical 削除 + cascade 文脈同一 + grep/build/token gate を代替証跡として記録する。
