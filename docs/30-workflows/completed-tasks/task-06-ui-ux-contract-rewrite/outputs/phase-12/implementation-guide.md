# implementation-guide.md — 後続 task 引き渡しガイド

## Part 1: 初学者・中学生レベル

### なぜ必要か

19 画面の UI 仕様が `09-ui-ux.md` に視覚詳細とごちゃ混ぜで書かれていたため、22 並列タスクが同じファイルを編集して衝突する状態だった。「契約（API・props・state・a11y）」と「見た目（色・余白・写真）」を分け、grep 1 回で必要部分だけを取り出せる構造に作り直す必要があった。

### 今回作ったもの（何が変わるか）

- `docs/00-getting-started-manual/specs/09-ui-ux.md` を 160 → 396 行に書き換え（contract のみ・H2=10 章）
- 視覚詳細は `09a-prototype-map.md`（task-07 起票予定）と `09b-design-tokens.md`（task-08 起票予定）に委譲
- 19 routes / 13 primitives / a11y / token prefix 8 種を grep 起点で列挙
- aiworkflow-requirements / task-specification-creator skill に lessons-learned / changelog / artifact inventory を反映

### なぜ「契約のみ」に分離するか

料理本に例えると、09-ui-ux.md は「材料表（contract）」、09a / 09b は「写真集（視覚詳細）」です。

- 旧版: 「材料表」と「写真集」が同じページに混ざっていて、誰がどっちを直せばいいか分からない
- 新版: 「材料表」だけ 09-ui-ux.md に置き、「写真集」は 09a / 09b に分けた

これで `grep` 1 回で「ある画面の API 接続」「あるボタンの種類」が一発で取れる。後続の 22 並列タスクが衝突せず、安全に同時着手できる。

### 専門用語ミニ辞典

| 用語 | 説明 |
| --- | --- |
| contract（契約） | API/props/state/a11y のように「壊れたら他の人の作業が止まる」決まりごと |
| token | 色や余白の名前。値は別ファイル（09b）が正本 |
| a11y | accessibility の略。スクリーンリーダーやキーボード操作の対応 |
| WAI-ARIA | a11y のための HTML 属性のルール（`role` / `aria-*`） |
| grep | 文書の中から決まった言葉や見出しを探す検索コマンド |

### 困りごとと解決後

- 困りごと: 視覚詳細と契約が混ざって、誰がどっちを直せばいいか不明
- 解決後: grep 1 行で contract が降りてくる（`grep -n "^### 2\." 09-ui-ux.md`）

## Part 2: 開発者・技術者レベル

### 19 routes 契約表 10 列の TypeScript interface 表現

```ts
interface RouteContract {
  authz: 'unauthenticated' | 'authenticated' | 'admin';
  layout: string;                        // e.g. '(public)/layout.tsx'
  primaryComponents: string[];           // e.g. ['Hero', 'Stats']
  api: ApiCall[];                        // route × endpoint × method
  states: PageState[];                   // idle | loading | empty | error | success
  primaryProps: Record<string, unknown>; // component name → props shape
  a11y: A11yContract;                    // landmark / role / aria
  tokens: TokenName[];                   // --ubm-color-* etc.
  visualDetailLink: string;              // → 09a-prototype-map.md §x.y
  rejected?: string[];                   // 不採用 UI / behavior
}
```

### grep 起点の使い方

```bash
# 19 routes index
grep -n "^### 2\." docs/00-getting-started-manual/specs/09-ui-ux.md

# 13 primitives index
grep -n "^#### 3\.1\." docs/00-getting-started-manual/specs/09-ui-ux.md

# feature components index
grep -n "^#### 3\.2\." docs/00-getting-started-manual/specs/09-ui-ux.md

# a11y 契約 index
grep -n "^### 5\." docs/00-getting-started-manual/specs/09-ui-ux.md

# token prefix 8 種
grep -nE '\-\-ubm-(color|radius|shadow|space|text|font|dur|ease)-' docs/00-getting-started-manual/specs/09-ui-ux.md

# login 5 状態（§4.2）
grep -n "^### 4\.2" docs/00-getting-started-manual/specs/09-ui-ux.md

# dialog aria-modal 規範（§5.2）
grep -n "^### 5\.2" docs/00-getting-started-manual/specs/09-ui-ux.md

# 不採用記述
grep -n "gas-prototype\|tweaks\|theme switcher\|data-theme" docs/00-getting-started-manual/specs/09-ui-ux.md
```

### 後続 task 別 参照点表

| 後続 task | 確認項目 | 参照点 |
| --- | --- | --- |
| task-07（09a-prototype-map.md 新設） | §2.x.y / §3.1.x / §3.2.x の「視覚詳細 link」列が 09a を指す path で記述されている | §1.2 index 表 / §2 全 routes / §3 全 component |
| task-08（09b-design-tokens.md 新設） | §6.3 token prefix 規則（`--ubm-color-*` 等）が 09b 名前空間と一致 | §6.1〜§6.3 |
| task-09（tailwind-v4-setup） | §6.2 OKLch CSS 変数経由参照 / HEX 直書き禁止 | §6.2 |
| task-10（ui-primitives） | §3.1 13 primitives の props / variants / sizes / a11y 表 | §3.1.1〜§3.1.13 |
| task-11..17（画面実装） | §2 19 routes 表 1 行 → 1 画面の決定論的対応 | §2.1.1〜§2.4.4 |
| task-19（09c-primitives.md） | §3.1 を完全展開 | §3.1 |
| task-20（09e/09f screen blueprints） | §2 × 公開層 / 会員層 routes 軸の screen blueprint | §2.1〜§2.2 |
| task-21（09g screen blueprints） | §2 × 管理層 routes 軸の screen blueprint | §2.3 |
| task-22（09d-icons.md / 09h-shell-and-fixtures.md） | icon set、共通 routes、shell layer、fixture data | §2.4 / §3 全体 |

### 不変条件再強調

- **CLAUDE.md #1**（schema 固定回避）: contract に Google Form schema を焼き込まない
- **CLAUDE.md #5**（apps/web → D1 禁止）: 後続 task-11..17 にも継続適用
- **CLAUDE.md #6**（GAS prototype 非昇格）: §8 の不採用項目を後続実装で再持ち込みしない
- **元仕様 §0.5 #4**（視覚詳細 0 件）: 後続 task-07/08 が 09a/09b 側で値を扱うため、09-ui-ux.md 側で値を再持ち込みしない

### aiworkflow-requirements skill との整合監査

- skill 配下 `references/` は contract → impl mapping の参照系として機能。本タスク §0.7 grep 設計（routes/primitives/a11y/token の各 index）が aiworkflow-requirements の Progressive Disclosure と整合
- `indexes/keywords.json` に `09-ui-ux contract grep` 系の trigger を追加すると検索性向上（skill-feedback-report.md 参照）

### APIシグネチャ

このタスクはドキュメント rewrite であり実行可能 API は持たないため、grep 起点を「ドキュメント検索の擬似シグネチャ」として提示する:

```bash
# 19 routes index（§1.2）
grep -n "^### 2\." docs/00-getting-started-manual/specs/09-ui-ux.md

# 13 primitives index（§3.1）
grep -n "^### 3\.1\." docs/00-getting-started-manual/specs/09-ui-ux.md

# token prefix 8 種（§6.3）
grep -n "^### 6\.3" docs/00-getting-started-manual/specs/09-ui-ux.md

# a11y 契約（§5）
grep -nE "^### 5\.|aria-modal" docs/00-getting-started-manual/specs/09-ui-ux.md
```

### 使用例

後続 task が「ある画面の API 接続」を確認する典型ユースケース:

```bash
# 例: /(public)/members/[id] 画面の contract を取り出す
grep -nA 20 "^### 2\.3 \`/(public)/members/\[id\]\`" \
  docs/00-getting-started-manual/specs/09-ui-ux.md
```

### エラーハンドリング

- grep 起点で発見できない見出し → `09-ui-ux.md` 側で章番号 drift が発生している。Phase 11 evidence の `structure-check.log` と照合して revert する
- HEX / oklch / px / `bg-[` / `text-[` がドキュメント内に出現 → 視覚詳細の漏れ込み。`09a` / `09b` 側へ移送する（task-07/08 で対応）
- 19 routes 表に欠番（例: `/(admin)/admin/audit` 欠落） → §1.2 index 表を確認し、`outputs/phase-11/evidence/trace-check.log` で route ↔ API method 対応を再走

### エッジケース

- **NON_VISUAL タスクのため Phase 11 でスクリーンショットを取らない**: 代わりに grep gate / structure check / markdown lint / trace check の 4 種で代替 evidence を取得（後段「Phase 11 evidence への参照」参照）
- **委譲先 path 未確定 (09a / 09b)**: task-07 / task-08 で workflow dir 起票予定。本タスクは index path のみ予約し、内容生成は別 wave に委ねる
- **prototype 正本順位の判定**: `claude-design-prototype/` を視覚詳細の正本とし、`gas-prototype/` は本番仕様に昇格させない（不採用記述として §8 に明記）

### 設定項目と定数一覧

| 項目 | 値 | 出典 |
| --- | --- | --- |
| 公開画面数 | 6 | §1.2 |
| 会員画面数 | 2 | §1.2 |
| 管理画面数 | 8 | §1.2 |
| 共通画面数 | 3 | §1.2 |
| primitives 総数 | 13 | §3.1 |
| token prefix 種類 | 8 | §6.3 |
| H2 章数 | 10 | structure-check |
| `### 2.` (route subsection) | 20 | structure-check |
| `### 3.1.` (primitives) | 13 | structure-check |
| visualEvidence | NON_VISUAL | artifacts.json |
| workflow_state | implemented-local | artifacts.json |

### テスト構成

NON_VISUAL タスクのテストは Phase 11 evidence 4 種で構成される（unit / integration / e2e の代替）:

| 区分 | 代替 evidence | 実行コマンド | 出力 |
| --- | --- | --- | --- |
| unit 相当 | grep gate | `grep -E "#[0-9a-f]{3,8}\|oklch\(\|[0-9]+px\|bg-\[\|text-\[" 09-ui-ux.md` (0 hit 期待) | `outputs/phase-11/evidence/grep-gate.log` |
| integration 相当 | structure check | `grep -c "^## " 09-ui-ux.md` (=10) 等 | `outputs/phase-11/evidence/structure-check.log` |
| lint 相当 | markdown lint | `pnpm markdownlint 09-ui-ux.md` (exit 0) | `outputs/phase-11/evidence/markdown-lint.log` |
| e2e 相当 | trace check | route ↔ API method ↔ fallback entry の 3 列対応表 | `outputs/phase-11/evidence/trace-check.log` |

PR (Phase 13) では上記 4 ログを evidence として添付する。

## Phase 11 evidence への参照（NON_VISUAL タスク）

本タスクは markdown contract 書き換えのみ（NON_VISUAL）のため、Phase 11 はスクリーンショットを取得しない。代わりに以下 4 種の代替 evidence を Phase 11 で取得済み:

| evidence | path |
| --- | --- |
| grep gate（HEX/oklch/px/`bg-[`/`text-[` 0 件） | `outputs/phase-11/evidence/grep-gate.log` |
| structure check（H2=10 / `### 2.`=20 / `### 3.1.`=13） | `outputs/phase-11/evidence/structure-check.log` |
| markdown lint（exit 0） | `outputs/phase-11/evidence/markdown-lint.log` |
| trace check（route / API / method 対応、static/no API entry、fallback entry） | `outputs/phase-11/evidence/trace-check.log` |

加えて代替 evidence の根拠を `outputs/phase-11/phase-11-non-visual-alternative-evidence.md` に記録済み。

## 後続 task GO 条件チェックリスト

- [x] 09-ui-ux.md 396 行 / H2=10 / `### 2.`=20 / `### 3.1.`=13
- [x] grep gate 0 件（HEX/oklch/px/`bg-[`/`text-[`）
- [x] §1.2 index 表に 09a / 09b path 記載済み
- [x] §6.3 token prefix 8 種すべて記述
- [x] §4.2 login 5 状態 / §5.2 dialog aria-modal 記述
- [x] §8 不採用項目（tweaks / photo store / data-theme / gas-prototype）
- [x] markdown lint exit 0
