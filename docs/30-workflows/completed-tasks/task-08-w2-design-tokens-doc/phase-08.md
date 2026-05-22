# Phase 8: DRY 化

実装区分: ドキュメントのみ仕様書

## 二重記述の点検

### 1. 値の二重メンテ

`09b-design-tokens.md` 内部で **同一値が複数箇所に出現する**箇所を洗い出し、正本と派生を明示する。

| 値 | 正本 | 派生 |
| --- | --- | --- |
| OKLch / HEX 値 | §3.4.1 / §3.4.2 / §3.4.3 表 | §9 inline JSON（同値）/ §10 `tokens.css` テンプレ（部分例示） |
| token 名（`--ubm-*`） | §2 命名規則表 | §3.4 / §4 / §5 / §6 / §7 / §8 各表 / §9 JSON `css` フィールド |
| Tailwind utility bridge | §10 `globals.css` テンプレ | （他章にコピーなし） |

#### DRY 化方針

- §1.1 で **§9 (JSON) を機械可読正本** / **§3.4 (CSS 表) を人間可読正本** と二者並立で定義する
- §10 `tokens.css` テンプレは §3.4 の **完全コピーではなく代表例**（surface / accent / status の主要値のみ）にとどめ、`/* §3.4.1 の全 token を列挙 */` コメントで参照誘導する（元仕様 §4.12 と同方針）
- MVP では手動で双方を一致させる。drift 検出は Phase 9 cross-check が担う
- 将来 Style Dictionary 等で generator 化した際は §9 → §3.4 / §10 / `tokens.css` の派生フローを §1 に追記する

### 2. テンプレ重複（`@theme` block）

§10 の `globals.css` ブロックは task-09 の `apps/web/src/styles/globals.css` にコピペされる。本ファイル内では 1 箇所のみに記述する（重複させない）。

### 3. 親 workflow との重複

| 親 workflow | 重複可能性 | 排除方針 |
| --- | --- | --- |
| `phase-3.md` §3.3 OKLch 適用ルール | 値そのものは親ではなく `styles.css` 由来 | 本ファイルが値の正本、phase-3 は規範の正本（住み分け） |
| `09-ui-ux.md`（task-06）§6 token 参照規則 | 命名規則の重複可能性 | 命名規則は本ファイル §2 を正本、09-ui-ux.md は引用 |
| `09a-prototype-map.md`（task-07）§2 primitive ↔ token mapping | mapping のみで値は持たない | 本ファイル §2 命名と prefix 一致を保証（cross-check） |

### 4. zone alias の DRY

§3.3 と §4.4 / §9 zone セクションで alias 表が重複する可能性。**§3.3 を正本、§4.4 / §9 は §3.3 を参照**する形にする（alias 値の更新は §3.3 のみで完結）。

> ただし §9 JSON は valid JSON 維持のため `"value": "{color.status.info}"` の Style Dictionary 参照表記を取り、§3.3 表は人間可読で `var(--ubm-color-info)` を取る。表記差は仕様（generator が解決）として注記。

## 削減対象（Don't repeat）

- ❌ 値（OKLch / HEX）を §3.4 と §9 で **異なる表記**で書く（一方が typo 起こると drift）→ **同一表記に揃える**
- ❌ 命名規則を §2 と §10 で **異なる prefix** で書く → §2 を正本に固定
- ❌ §3.5 sRGB fallback 値を §10 にもコピー → §3.5 のみに保持

## 残してよい重複（intentional）

- ✅ §3.4 値表 ↔ §9 JSON（人間可読 / 機械可読の住み分け、§1.1 で明示）
- ✅ §2 命名規則表 ↔ §3.4 / §4 / §5 各 token 表（規範と実例の住み分け）

## 完了条件

- [ ] 二重記述の正本 / 派生関係が §1.1 に明文化される
- [ ] §10 `tokens.css` テンプレが §3.4 の完全コピーではない
- [ ] zone alias の正本が §3.3 に固定
- [ ] Phase 9 で drift 検出 cross-check が実行可能
