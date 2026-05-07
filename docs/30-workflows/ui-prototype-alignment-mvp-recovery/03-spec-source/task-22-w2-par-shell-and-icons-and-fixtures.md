# task-22 shell-and-icons-and-fixtures

## §0. 自己完結コンテキスト

このタスクを単独で着手する担当者が、外部資料に遡らずとも実装判断できるよう、必須前提を本節に閉じ込める。

### 0.1 上位ゴール

`docs/00-getting-started-manual/claude-design-prototype/app.jsx`（251 行・凍結正本）/ `icons.jsx`（79 行・凍結正本）/ `data.jsx`（339 行・凍結正本）の 3 ファイルを統合し、`09d-icons.md`（icon カタログ）と `09h-shell-and-fixtures.md`（app shell layout + fixture data）の 2 ファイルを新規作成する。app.jsx の **3 shell 構造**（PublicLayout / MemberLayout / AdminLayout）を JSX inline で完全転記し、icons.jsx の全 icon を SVG inline + props 仕様付きで列挙し、data.jsx の全 fixture（members / meetings / kpi / tags / requests / audit 等）を JSON 形式で全列挙して、後続 task-09（tailwind setup）/ task-11..17（各画面）が「fixture どおりに mock を作れる」「shell どおりに layout を組める」状態を作る。

### 0.2 DAG 座標

- 依存元: なし（task-01 scope-gate-all-screens 完了のみ前提）
- 依存先: task-09（tailwind v4 setup・globals.css）/ task-10（ui-primitives）/ task-11..17（各画面）/ task-06（contract）
- 並列性: **task-06 / 07 / 08 / 19 / 20 / 21 と並列実行可**。

### 0.3 触れるファイル群

- C（新規作成）:
  - `docs/00-getting-started-manual/specs/09d-icons.md`（200〜400 行）
  - `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md`（500〜900 行）
- R（参照のみ）: `app.jsx`（L1-L251）/ `icons.jsx`（L1-L79）/ `data.jsx`（L1-L339）/ `outputs/phase-1/phase-1.md` §3 / `outputs/phase-3/phase-3.md` §2
- M / 削除: なし

### 0.4 既存 API（不変）

shell / fixtures は API を直接呼ばない。fixture data は task-11..17 で mock として用い、本番では phase-3 §2 の API レスポンスに置き換わる。fixture と API レスポンス schema の対応を 09h §3 で明記する。

### 0.5 不変条件

1. app.jsx / icons.jsx / data.jsx は **凍結正本**。本タスクで改変しない。
2. JSX / SVG / JSON の転記は **一字一句**。
3. EDITMODE 専用 shell 要素（TweaksPanel / data-theme switcher / AvatarStoreProvider#localStorage 部分）は §99「不採用」に列挙し、3 shell 本文には組み込まない。
4. 視覚値（HEX / oklch / px）を本ファイルに **0 件**含める。token 名のみで参照。
5. icon は SVG path を一字一句転記する（path は視覚詳細ではなく形状定義のため許容）。fill / stroke は `currentColor` または token 経由のみ。HEX 直書き禁止。
6. fixture JSON の値（人名 / メール / phone 等）は prototype の値を一字一句転記する（後続実装が mock として使うため）。
7. AdminSidebar の構造は task-21 (09g) §1 と整合させる（命名・順序を同一に）。

### 0.6 上流から受け取るシグネチャ

- app.jsx 構造: PublicLayout / MemberLayout / AdminLayout の 3 shell + Header + Footer + AdminSidebar
- icons.jsx: 全 icon 関数（function <Name>() { return <svg>...</svg>; } 形式）
- data.jsx: members / meetings / kpi / zones / tags / requests / audit / identity-conflicts 等の fixture
- phase-1 §3 / phase-3 §2

### 0.7 下流へ渡すシグネチャ

#### `09d-icons.md` 章立て

```
1. icon 命名規則 (PascalCase / size 24x24 / strokeWidth 1.5 / currentColor)
2. icon カタログ
   各 icon について:
   2.X.1 prototype 由来 (`icons.jsx` L<a>-L<b>)
     ```jsx
     // SVG inline 一字一句
     ```
   2.X.2 props (size, strokeWidth, className, title, aria-hidden)
   2.X.3 a11y (decorative: aria-hidden / informative: role="img" + title)
   2.X.4 採用画面（09e/09f/09g §X からの逆 link）
3. 不採用 icon
```

#### `09h-shell-and-fixtures.md` 章立て

```
1. PublicLayout (app.jsx の該当行)
   1.1 prototype 由来 (JSX 一字一句)
   1.2 構造（Header + main + Footer）
   1.3 props / children scope
   1.4 a11y (`<header>` `<main>` `<footer>` landmark)
   1.5 token 参照
2. MemberLayout
   2.1〜2.5 同列構成（authenticated 表示・avatar / logout）
3. AdminLayout
   3.1〜3.5 同列構成（AdminSidebar 参照は 09g §1 へ link）
4. Header / Footer 詳細
5. fixtures (data.jsx)
   5.1 members[] (n 件・JSON 全列挙)
   5.2 meetings[]
   5.3 kpi
   5.4 zones / zoneStats
   5.5 tags[] (queue)
   5.6 requests[] (queue)
   5.7 audit[]
   5.8 identity-conflicts[]
   5.9 fixture と phase-3 §2 API レスポンス schema の対応表
99. 不採用 shell 要素 (TweaksPanel / data-theme switcher / AvatarStoreProvider#localStorage)
```

### 0.8 用語

- **shell**: ページ全体を包む共通 layout。PublicLayout / MemberLayout / AdminLayout の 3 種。
- **fixture**: 開発・mock 用のサンプルデータ。本番は API レスポンスに置き換わる。
- **icon カタログ**: icons.jsx の全 SVG icon の一覧。SVG inline + props + a11y。

---

> 責務 dir: `03-spec-source`
> 想定工数: 1.0 人日
> 主担当: Tech Writer
> 依存: task-01 完了
> 後続: task-09 / task-10 / task-11..17

---

## 1. ヘッダー

| 項目 | 値 |
|------|---|
| task id | 22 |
| task name | shell-and-icons-and-fixtures |
| const ref | CONST_005 / CONST_007 |
| 入力 | `app.jsx`（251 行）/ `icons.jsx`（79 行）/ `data.jsx`（339 行） |
| 出力 | `09d-icons.md`（新規 200〜400 行）/ `09h-shell-and-fixtures.md`（新規 500〜900 行） |
| 主成果物の DoD | §8 参照 |

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. app.jsx の 3 shell（PublicLayout / MemberLayout / AdminLayout）を 09h に JSX inline 一字一句転記
2. icons.jsx の全 icon を 09d に SVG inline + props 仕様で列挙
3. data.jsx の全 fixture を 09h §5 に JSON 形式で全列挙
4. fixture と phase-3 §2 API レスポンス schema の対応を 09h §5.9 で明記
5. icon の a11y（decorative vs informative）規則を 09d §1 で正本化
6. AdminSidebar 詳細は 09g §1 を参照（09h では link のみ・重複禁止）
7. EDITMODE 専用 shell 要素を §99 に列挙

### 2.2 非ゴール

- 実装コード（task-09 / 10 / 11..17）
- token 値（task-08 / 09b）
- primitive 仕様（task-19 / 09c）
- 画面 blueprint（task-20 / 21）
- API 実装（apps/api 側）

---

## 3. 変更対象ファイル表

| 区分 | path | 概要 |
|------|------|------|
| C（新規） | `docs/00-getting-started-manual/specs/09d-icons.md` | icon カタログ |
| C（新規） | `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` | shell + fixtures |
| R（参照） | `claude-design-prototype/app.jsx` | shell 転記元 |
| R（参照） | `claude-design-prototype/icons.jsx` | icon 転記元 |
| R（参照） | `claude-design-prototype/data.jsx` | fixture 転記元 |
| R（参照） | `outputs/phase-3/phase-3.md` §2 | fixture ↔ API schema 対応 |

---

## 4. シグネチャ / 章立て

### 4.1 09d 章立て

```
1. icon 命名規則
   1.1 PascalCase / 24x24 / strokeWidth 1.5 / currentColor
   1.2 a11y 規則
       - decorative icon: aria-hidden="true"
       - informative icon: role="img" + <title>
   1.3 props 仕様（共通）
       | name | type | required | default |
       | size | number | no | 24 |
       | strokeWidth | number | no | 1.5 |
       | className | string | no | — |
       | title | string | no | — |
2. icon カタログ
   2.1 <IconA>
     2.1.1 prototype 由来 (`icons.jsx` L<a>-L<b>)
       ```jsx
       // SVG 一字一句
       ```
     2.1.2 用途
     2.1.3 採用画面（09e/09f/09g 逆 link）
   2.2 <IconB> ...
   ...（icons.jsx 全件）
99. 不採用 icon
```

### 4.2 09h 章立て

```
1. PublicLayout
   1.1 prototype 由来 (`app.jsx` L<a>-L<b>)
       ```jsx
       // JSX 一字一句
       ```
   1.2 構造（Header + main + Footer）
   1.3 props / children scope
   1.4 a11y (`<header>` `<main role="main">` `<footer>` landmark)
   1.5 token 参照（`--ubm-color-bg`, `--ubm-color-panel`）
2. MemberLayout
   2.1〜2.5（authenticated 専用・avatar / logout button）
3. AdminLayout
   3.1〜3.5（AdminSidebar は 09g §1 参照）
4. Header / Footer 詳細
   4.1 Header (logo / nav / 認証状態別 CTA)
   4.2 Footer (legal links / copyright)
5. fixtures (data.jsx)
   5.1 members[] — JSON 全列挙（id / name / nameKana / zone / status / skills / offers / personality / contact 等）
   5.2 meetings[] — JSON 全列挙
   5.3 kpi — JSON
   5.4 zones / zoneStats — JSON
   5.5 tags[] — queue 用 JSON
   5.6 requests[] — queue 用 JSON
   5.7 audit[] — timeline 用 JSON
   5.8 identity-conflicts[] — compare 用 JSON
   5.9 fixture ↔ API schema 対応表
       | fixture key | phase-3 §2 API | schema field |
       | members[] | GET /admin/members | MemberView[] |
       | members[*] | GET /public/members/:id | PublicMemberDetailView |
       | kpi | GET /admin/kpi | AdminKpiView |
       | meetings[] | GET /public/meetings, GET /admin/meetings | MeetingView[] |
       | tags[] | GET /admin/tags | AdminTagView[] |
       | requests[] | GET /admin/requests | AdminRequestView[] |
       | audit[] | GET /admin/audit | AdminAuditEntry[] |
       | identity-conflicts[] | GET /admin/identity-conflicts | IdentityConflictView[] |
99. 不採用 shell 要素 (TweaksPanel / data-theme / AvatarStoreProvider#localStorage)
```

### 4.3 §1〜§3 shell template

```markdown
## X. <LayoutName>

### X.1 prototype 由来 (`app.jsx` L<a>-L<b>)
```jsx
// 一字一句転記
```

### X.2 構造
- 上から順に（Header → main → Footer など）

### X.3 props / children scope
| name | type | required | default |
| children | ReactNode | yes | — |
| ...

### X.4 a11y
- landmark / heading hierarchy / skip link

### X.5 token 参照
- `--ubm-color-bg`, `--ubm-color-panel`, `--ubm-radius-lg`
```

### 4.4 §5 fixture template

```markdown
### 5.X <fixtureName>

```json
[
  {
    "id": "...",
    "name": "...",
    ...
  }
]
```

- 由来: `data.jsx` L<a>-L<b>
- 件数: N
- 対応 API: GET /xxx (→ §5.9)
```

### 4.5 §99 不採用要素

| 要素 | 理由 |
|------|------|
| TweaksPanel (`app.jsx` L213-L251) | EDITMODE 専用 |
| data-theme switcher (`styles.css` L42-L70) | dark mode MVP 非対応 |
| AvatarStoreProvider#localStorage 部分 (`primitives.jsx` L20-L28) | 本番は API 経由（task-14） |

---

## 5. 入力・出力

### 5.1 入力
- app.jsx（251 行・凍結）
- icons.jsx（79 行・凍結）
- data.jsx（339 行・凍結）
- phase-1 §3 / phase-3 §2

### 5.2 出力
- 09d-icons.md（新規 200〜400 行）
- 09h-shell-and-fixtures.md（新規 500〜900 行）

---

## 6. テスト方針

### 6.1 markdown 構造検証

| 検証 | 方法 |
|------|------|
| 09d icon 数 | `grep -cE '^### 2\.[0-9]+ ' specs/09d-icons.md` → icons.jsx 関数数と一致 |
| 09h shell 数 | `grep -cE '^## [0-9]+\. ' specs/09h-shell-and-fixtures.md` → 5+1 (§99) |
| fixture 数 | `grep -cE '^### 5\.[0-9]+ ' specs/09h-...` → 8 (5.1〜5.8) + 5.9 |
| JSON block | `grep -c '^```json$' specs/09h-...` → 8+ |

### 6.2 視覚値混入禁止

```bash
for F in specs/09d-icons.md specs/09h-shell-and-fixtures.md; do
  grep -nE '#[0-9a-fA-F]{3,8}\b' "$F" && exit 1 || true   # SVG fill="currentColor" は許容、HEX 直書きは NG
  grep -nE 'oklch\(' "$F" && exit 1 || true
  grep -nE '\b[0-9]+px\b' "$F" && exit 1 || true
  grep -nE '\bbg-\[' "$F" && exit 1 || true
done
```

### 6.3 icon 件数一致

```bash
# icons.jsx の関数定義数を抽出し 09d §2 の icon 数と一致を確認
grep -cE '^function [A-Z]' docs/00-getting-started-manual/claude-design-prototype/icons.jsx
grep -cE '^### 2\.[0-9]+ ' docs/00-getting-started-manual/specs/09d-icons.md
```

### 6.4 fixture ↔ API 対応 trace

09h §5.9 の対応表と phase-3 §2 を行レベル diff で完全一致確認。

---

## 7. 実行コマンド

```bash
cat docs/00-getting-started-manual/claude-design-prototype/app.jsx
cat docs/00-getting-started-manual/claude-design-prototype/icons.jsx
cat docs/00-getting-started-manual/claude-design-prototype/data.jsx
$EDITOR docs/00-getting-started-manual/specs/09d-icons.md
$EDITOR docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md
grep -cE '^## [0-9]+\. ' docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md
bash scripts/verify-09dh-no-visual-values.sh || true
mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09d-icons.md docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md || true
```

---

## 8. DoD（Definition of Done）

- [ ] `09d-icons.md` 新規作成・200〜400 行
- [ ] `09h-shell-and-fixtures.md` 新規作成・500〜900 行
- [ ] 09d §1 で命名規則 / a11y 規則 / 共通 props が明記
- [ ] 09d §2 に icons.jsx の全 icon が SVG inline + 採用画面リンク付きで列挙（件数一致 §6.3）
- [ ] 09h §1〜§3 で 3 shell（PublicLayout / MemberLayout / AdminLayout）が JSX 一字一句転記
- [ ] 09h §3 AdminLayout から AdminSidebar は 09g §1 への link のみ（重複記述なし）
- [ ] 09h §4 で Header / Footer 詳細
- [ ] 09h §5.1〜§5.8 の 8 fixture が JSON 全列挙
- [ ] 09h §5.9 で fixture ↔ phase-3 §2 API schema 対応表が完全一致
- [ ] §99 に TweaksPanel / data-theme / AvatarStoreProvider#localStorage の 3 件
- [ ] 視覚値（HEX / oklch / px / `bg-[#...]`) が 0 件（SVG `currentColor` は許容）
- [ ] icon の `aria-hidden` / `role="img"+title` 規則が §1.2 / 各 icon §X.X に記述
- [ ] markdown lint で error 0
- [ ] 09c / 09b / 09e/09f/09g / 09a への link が記述

---

## 9. 影響範囲・リスク

| リスク | 緩和策 |
|--------|--------|
| icon 列挙漏れ | §6.3 件数一致 check + icons.jsx 関数 grep |
| fixture 値ドリフト | data.jsx の値を一字一句 JSON 転記、`grep -F` で検証 |
| AdminSidebar 重複 | §3 で 09g §1 link のみ、本文記述なし（task-21 と整合） |
| fixture ↔ API schema 対応漏れ | §6.4 trace check |

---

## 10. 関連 task / link 先

- task-06（09-ui-ux.md 契約）
- task-07（09a mapping）
- task-08（09b token）
- task-19（09c primitives）
- task-20（09e/09f）
- task-21（09g admin / AdminSidebar §1 集約）
- task-09（tailwind v4 setup・globals.css）
- task-10（ui-primitives）
- task-11..17（各画面・fixture を mock として使用）
