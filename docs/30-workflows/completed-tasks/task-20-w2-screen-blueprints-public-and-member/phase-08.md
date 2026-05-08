# Phase 08 — DRY 化

実装区分: ドキュメントのみ仕様書（CONST_004 例外適用 — 純粋に markdown 2 件作成のみ）

## 0. 目的

09e / 09f 内および 9 series 全体の重複・揺らぎを排除し、後続並列タスクとの整合を最小コストで保つ。本タスクの DRY 化対象は本仕様書の構造的繰り返し（§X.7 link / §99 不採用 / mermaid template）に限定する。

## 1. §X.7 link format（fixed）

全 8 画面 §X.7 で以下の **3 行 + 1 行 optional** format に固定する:

```markdown
### X.7 token / primitive / icon 参照

- token: 09b §<番号>
- primitive: 09c §<番号>
- icon: 09d §<番号>
- prototype-map: 09a §<番号>（optional）
```

DRY ルール:

| ルール | 内容 |
|--------|------|
| 1 | content copy を持たない（§番号のみで参照） |
| 2 | 並列タスク未確定時は `§TBD` placeholder を使い、Phase 9 で解決確認 |
| 3 | 1 画面 1 §X.7 セクション（合計 8 セクション） |
| 4 | 順序固定（token → primitive → icon → prototype-map） |
| 5 | §X.7 内に視覚値（HEX / oklch / px）を **絶対に書かない** |

## 2. §99 不採用要素表（共通 4 行 + 09f 拡張 1 行）

### 2.1 共通 4 行（09e / 09f 両方）

| 要素 | 理由 |
|------|------|
| TweaksPanel（`app.jsx` L213-L251） | EDITMODE 専用 |
| theme switcher（`styles.css` L42-L70） | dark mode MVP 非対応 |
| AvatarStoreProvider#localStorage 部分 | API 経由（task-14） |
| `gas-prototype/` 由来の振る舞い | 仕様昇格禁止（CLAUDE.md 不変条件 6） |

### 2.2 09f 拡張（profile 直接影響を強調）

09f §99 では `AvatarStoreProvider#localStorage` を **必須行**として明記。09e §99 では同行を含めて構わないが必須ではない。

DRY ルール:

| ルール | 内容 |
|--------|------|
| 1 | 行はカタログ的に列挙し、本編 §1〜§N からの参照リンクのみ持つ |
| 2 | 同一要素を §1〜§N の本編で言及した場合、`→ §99` link を本編側に必ず残す |
| 3 | §99 内に prototype JSX を貼らない（見出し + 理由のみ） |

## 3. mermaid template（共通 + login 派生）

### 3.1 標準 5 状態（公開層 + /profile 各領域に適用）

```
[*] --> idle
idle --> loading: mount
loading --> success: 200
loading --> empty: 200 + result=[]
loading --> error: 4xx/5xx
success --> [*]
```

### 3.2 login 派生（09f §1.3 専用）

```
[*] --> input
input --> sent: POST /api/auth/magic-link 200
input --> unregistered: 404 not_member
input --> deleted: 410 deleted_member
input --> error: 5xx
sent --> [*]
```

DRY ルール:

| ルール | 内容 |
|--------|------|
| 1 | 1 画面 1 mermaid block（必要に応じ画面固有派生を 1 つ追加可、その場合 block 数 +1） |
| 2 | template の transition trigger は HTTP method + path + status 形式に揃える |
| 3 | `success → [*]` で終端を明示、`[*]` を 2 回以上書かない |

## 4. §X.4 API 表 format（共通）

```markdown
| method | endpoint | trigger | 状態反映 |
|--------|----------|---------|---------|
| GET | /public/stats | mount | success → Stats render |
```

DRY ルール:

| ルール | 内容 |
|--------|------|
| 1 | 表ヘッダ 4 列固定（method / endpoint / trigger / 状態反映） |
| 2 | endpoint は現行 API 正本と一致（query 文字列含む） |
| 3 | trigger は `mount` / `submit` / `click:<ボタン名>` / `change:<input名>` のいずれか |
| 4 | 状態反映は §X.3 mermaid の状態名と同一語彙 |

## 5. §X.1 prototype 由来 ヘッダ format（共通）

```markdown
### X.1 prototype 由来 (`pages-<public|member>.jsx` L<a>-L<b>)

```jsx
// return JSX 一字一句転記（import / hook / boilerplate を含めない）
```
```

DRY ルール:

| ルール | 内容 |
|--------|------|
| 1 | ヘッダで行範囲を明記（`L<a>-L<b>`） |
| 2 | 単一 `jsx` コードブロックを 1 つだけ持つ |
| 3 | 実装段階で hash-equal 検証可能な形（空白・改行・属性順を保つ） |

## 6. ファイル冒頭 boilerplate（共通）

09e / 09f 冒頭に以下の boilerplate を共通配置（コピペで一貫性担保）:

```markdown
# 09<e|f> — 画面 blueprint（<公開|会員>層）

> 正本順位: pages-<public|member>.jsx 凍結正本 → 現行 API 正本（apps/api / apps/web BFF / aiworkflow-requirements）→ phase-3 §3 §5.2 → 9 series 内 link
> 視覚値（HEX / oklch / px / bg-arbitrary-class）は本ファイル内で 0 件（grep gate）
> token / primitive / icon の値そのものは扱わず、09b / 09c / 09d への §番号 link のみ
```

DRY ルール:

| ルール | 内容 |
|--------|------|
| 1 | `<e\|f>` / `<公開\|会員>` / `<public\|member>` を該当ファイルの値で展開 |
| 2 | boilerplate 3 行は順序固定 |

## 7. 並列タスク §番号 placeholder

§番号未確定の場合は `09<a-d> §TBD` を placeholder として使用。Phase 9 で `! grep -nE '§TBD'` を gate 化する。

| placeholder | 解決元 | 期待 |
|-------------|--------|------|
| `09a §TBD` | task-07 | merge 完了時に §番号確定 |
| `09b §TBD` | task-08 | 同上 |
| `09c §TBD` | task-19 | 同上 |
| `09d §TBD` | task-22 | 同上 |

## 8. DRY 化適用 checklist

- [ ] §X.7 link format 全 8 画面で同一順序
- [ ] §99 共通 4 行表の文言が 09e / 09f で一致
- [ ] mermaid template 標準 5 状態が標準画面で同一
- [ ] §X.4 API 表ヘッダが 4 列固定
- [ ] §X.1 ヘッダが `(\`pages-*.jsx\` L<a>-L<b>)` format
- [ ] ファイル冒頭 boilerplate 3 行が両ファイルに存在

## 9. 次フェーズへの引き渡し

phase-09（品質保証）に渡す:

- §X.7 / §99 / mermaid / §X.4 / §X.1 / boilerplate の format 固定値
- placeholder 解決対象 4 種
