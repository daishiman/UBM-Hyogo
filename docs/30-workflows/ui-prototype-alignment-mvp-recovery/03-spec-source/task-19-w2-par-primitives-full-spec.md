# task-19 primitives-full-spec

## §0. 自己完結コンテキスト

このタスクを単独で着手する担当者が、外部資料に遡らずとも実装判断できるよう、必須前提を本節に閉じ込める。

### 0.1 上位ゴール

`docs/00-getting-started-manual/claude-design-prototype/primitives.jsx`（272 行・凍結正本）に存在する **const-based primitive / helper set**（Chip / Avatar / Button / Switch / Segmented / Field / Input / Textarea / Select / Search / Drawer / Modal / Toast / KVList / LinkPills / zoneTone / statusTone 等）の **完全仕様書** `09b-... の隣りに位置する 09c-primitives.md` を新規作成する。各 primitive について「JSX inline excerpt + props 表 + variants / sizes / states + a11y 仕様 + token 参照名」を 1 セクションに閉じ込め、後続 task-10（ui-primitives 実装）が「09c §X.Y を読んで 1 ファイル書ける」決定論的状態を作る。token 名は task-08（09b）が確定する `--ubm-*` prefix のみを参照し、HEX / oklch / px 値および placeholder token（`token-sized` / `09b-token-value` / `token-mix`）は 0 件にする（値の正本は 09b、視覚 mapping の正本は 09a）。

### 0.2 DAG 座標

- 依存元: なし（task-01 scope-gate-all-screens 完了のみ前提）
- 依存先: task-10（ui-primitives 実装）/ task-11..17（各画面が primitive を使う）/ task-06（contract が link 先として参照）
- 並列性: **task-06 / task-07 / task-08 / task-20 / task-21 / task-22 と並列実行可**。本タスクは primitive 1 軸に責務が閉じる。

### 0.3 触れるファイル群

- C（新規作成）: `docs/00-getting-started-manual/specs/09c-primitives.md`（600〜1200 行）
- R（参照のみ）: `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx`（L1-L272）/ `styles.css`（class 名出典のみ）/ `outputs/phase-2/phase-2.md` §4 / `outputs/phase-3/phase-3.md` §3
- M / 削除: なし

### 0.4 既存 API（不変）

primitive は API 接続を持たない（Button onClick / Field onChange など callback prop のみ）。`outputs/phase-3/phase-3.md` §2 の API は本タスクで参照しない。

### 0.5 不変条件

1. primitives.jsx は **凍結正本**。本タスクで改変しない。
2. JSX inline 転記は **一字一句**（class 名・whitespace 含む）。改変する場合は 09a mapping を同時改訂する別 task が必要。
3. token 値（HEX / oklch / px）を本ファイルに **0 件**含めること（§7 grep gate）。
4. 値が必要な箇所は token 名（`--ubm-color-accent` 等）で参照し、09b への link を併記する。
5. EDITMODE 専用 primitive（TweaksPanel / data-theme switcher / AvatarStoreProvider の localStorage 部分）は §99「不採用」に列挙し、本仕様には組み込まない。
6. `aria-*` / `role` は WAI-ARIA Authoring Practices に整合させる。dialog / drawer / modal は `role="dialog"` + `aria-modal="true"` + Esc close + focus trap を必ず記述する。
7. icon-only Button は `aria-label` 必須。

### 0.6 上流から受け取るシグネチャ

- phase-2 §4 の primitives 列挙（13 primitive + feature components）
- phase-3 §3 の未掲載画面派生ルール（primitive の組合せのみで構成）
- primitives.jsx の const 宣言行（Chip L6 / AvatarStoreProvider L20 / Avatar L37 / Button L92 / Switch L113 / Segmented L118 / Field L129 / Input L145 / Textarea L146 / Select L147 / Search L150 / Drawer L158 / Modal L177 / ToastProvider L201 / KVList L226 / LinkPills L248 / zoneTone L265 / statusTone L266 など）

### 0.7 下流へ渡すシグネチャ

新 `09c-primitives.md` は以下の **grep 可能な見出し**を必ず提供する:

- `## 1. プリミティブ一覧（カタログ）`
- `## 2. Chip`
- `## 3. Avatar (+ Store)`
- `## 4. Button`
- `## 5. Switch`
- `## 6. Segmented`
- `## 7. Field`
- `## 8. Input / Textarea / Select`
- `## 9. Search`
- `## 10. Drawer`
- `## 11. Modal`
- `## 12. Toast (Provider + useToast)`
- `## 13. KVList`
- `## 14. LinkPills`
- `## 15. zoneTone / statusTone（ヘルパー関数）`
- `## 16. グローバルエクスポート（prototype 環境）`
- `## 17. 補助 primitive / helper 転記`
- `## 18. 実装上の注意`
- `## 99. 不採用 primitive`

各 §X は同じ列構成で記述する:

```markdown
## X. <Name>

### X.1 prototype 由来 (`primitives.jsx` L<a>-L<b>)

```jsx
// 一字一句転記（class 名含む）
```

### X.2 本番 props 仕様
| 名前 | 型 | 必須 | 既定 | 説明 |
| ... |

### X.3 variants / sizes / states
| variant | 用途 | token |
| ... |

### X.4 a11y
- role / aria-* / keyboard

### X.5 token 参照
- `--ubm-color-*` / `--ubm-radius-*` / `--ubm-shadow-*` ...

### X.6 link
- 視覚値: → `09b-design-tokens.md` §X
- 視覚 mapping: → `09a-prototype-map.md` §2.X
- 画面採用例: → `09e/09f/09g` の該当 §
```

### 0.8 用語

- **primitive**: 単一責務の最小 UI 部品。Chip / Avatar / Button / Switch / Segmented / Field / Input / Textarea / Select / Search / Drawer / Modal / Toast / KVList / LinkPills。
- **feature component**: primitive を組合わせた画面固有の塊（Hero / Stats / MemberCard 等）。本ファイル対象外（09e/09f/09g）。
- **token 参照名**: `--ubm-color-accent` 等の CSS 変数名。値は 09b、本ファイルは名前のみ。

---

> 責務 dir: `03-spec-source`
> 想定工数: 1.0 人日
> 主担当: Tech Writer
> 依存: task-01（scope-gate-all-screens）完了
> 後続: task-10（contract に従って primitive を実装）

---

## 1. ヘッダー

| 項目 | 値 |
|------|---|
| task id | 19 |
| task name | primitives-full-spec |
| const ref | CONST_005（仕様書必須項目）/ CONST_007（単一サイクル） |
| 入力 | `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx`（272 行） |
| 出力 | `docs/00-getting-started-manual/specs/09c-primitives.md`（**新規**・600〜1200 行） |
| 主成果物の DoD | §8 参照 |

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. primitives.jsx 全 primitive を 09c-primitives.md に **JSX inline 一字一句転記**で取り込む。
2. 各 primitive の props / variants / sizes / states / a11y / token 参照名を完備する。
3. token 名のみで参照し、HEX / oklch / px / `bg-[#...]` を 0 件にする。
4. 09b（値）/ 09a（mapping）/ 09e/09f/09g（採用例）への link を全 primitive で完備する。
5. EDITMODE 専用 primitive を §99 に列挙し、本仕様から除外する。

### 2.2 非ゴール

- token 値の決定（task-08 / 09b）
- prototype mapping 表（task-07 / 09a）
- feature component の仕様（task-20/21/22）
- 実装コード（task-10）
- Storybook 環境構築

---

## 3. 変更対象ファイル表

| 区分 | path | 概要 |
|------|------|------|
| C（新規） | `docs/00-getting-started-manual/specs/09c-primitives.md` | primitive 完全仕様 |
| R（参照） | `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx` | JSX 転記元 |
| R（参照） | `docs/00-getting-started-manual/claude-design-prototype/styles.css` | class 名の出典のみ |
| R（link 先） | `docs/00-getting-started-manual/specs/09a-prototype-map.md` | task-07 |
| R（link 先） | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | task-08 |

---

## 4. シグネチャ / 章立て

### 4.1 章立て（17 primitive + 不採用）

```
1. プリミティブ一覧（カタログ）
2. Chip (primitives.jsx L6-L14)
3. Avatar (+ Store) (L17-L89)
4. Button (L92-L110)
5. Switch (L113-L115)
6. Segmented (L118-L126)
7. Field (L129-L143)
8. Input / Textarea / Select (L145-L147)
9. Search (L150-L155)
10. Drawer (L158-L174)
11. Modal (L177-L195)
12. Toast (Provider + useToast) (L198-L223)
13. KVList (L226-L235)
14. LinkPills (L238-L262)
15. zoneTone / statusTone (L265-L266)
16. グローバルエクスポート（prototype 環境）
17. 補助 primitive / helper 転記
18. 実装上の注意
99. 不採用 primitive (TweaksPanel / data-theme switcher / AvatarStoreProvider#localStorage)
```

### 4.2 各 §X の最小列構成（template）

```markdown
## X. <Name>

### X.1 prototype 由来 (`primitives.jsx` L<a>-L<b>)
```jsx
// 一字一句転記
```

### X.2 props
| name | type | required | default | description |

### X.3 variants / sizes / states
| variant | description | token |
| size | dimension token |
| state | trigger | aria reflection |

### X.4 a11y
- role / aria-* / keyboard / focus management

### X.5 token 参照
- `--ubm-color-*`, `--ubm-radius-*`, `--ubm-shadow-*`, `--ubm-space-*`, `--ubm-text-*`, `--ubm-font-*`

### X.6 link
- 値: 09b §X / mapping: 09a §2.X / 採用例: 09e/09f/09g §X
```

### 4.3 サンプル: §1 Button（template として展開）

```markdown
## 1. Button

### 1.1 prototype 由来 (`primitives.jsx` L92-L110)
```jsx
function Button({ children, variant="primary", size="md", icon, iconRight, block=false, ... }) { ... }
```

### 1.2 props
| name | type | required | default | description |
| children | ReactNode | yes | — | ラベル |
| variant | "primary" \| "accent" \| "ghost" \| "soft" \| "danger" | no | "primary" | 視覚 variant |
| size | "sm" \| "md" \| "lg" | no | "md" | サイズ token |
| icon | ReactNode | no | — | 左 icon |
| iconRight | ReactNode | no | — | 右 icon |
| block | boolean | no | false | 幅 100% |
| disabled | boolean | no | false | 無効 |
| type | "button" \| "submit" \| "reset" | no | "button" | native type |
| onClick | (e) => void | no | — | click handler |

### 1.3 variants / sizes / states
| variant | token |
| primary | --ubm-color-accent / text-on-accent |
| accent | (alias) |
| ghost | bg transparent / hover overlay |
| soft | --ubm-color-panel-soft |
| danger | --ubm-color-danger |

### 1.4 a11y
- `<button type=...>` native semantics 必須
- icon-only の場合 `aria-label` 必須
- `:focus-visible` ring を token 経由で表示

### 1.5 token 参照
- `--ubm-color-accent`, `--ubm-color-text`, `--ubm-radius-md`, `--ubm-shadow-xs`

### 1.6 link
- 値: → `09b-design-tokens.md` §3.1
- mapping: → `09a-prototype-map.md` §2.1（L92-L110）
- 採用例: → `09e §1 Hero CTA` / `09f §1 Login submit` / `09g §1 RecentActions row CTA`
```

### 4.4 §99 不採用 primitive

| primitive | 理由 |
|-----------|------|
| TweaksPanel (`app.jsx` L213-L251) | EDITMODE 専用、本番 UI 非対応 |
| data-theme switcher (`styles.css` L42-L70) | dark mode は MVP 対象外 |
| AvatarStoreProvider#localStorage 部分 (`primitives.jsx` L20-L28) | 本番は API 経由（task-14 別途） |

---

## 5. 入力・出力

### 5.1 入力
- `primitives.jsx`（272 行・凍結正本）
- `styles.css`（class 名出典のみ・値転記禁止）
- phase-2 §4 / phase-3 §3

### 5.2 出力
- `09c-primitives.md`（600〜1200 行・新規）

---

## 6. テスト方針

### 6.1 markdown 構造検証

| 検証 | 方法 |
|------|------|
| primitive 数 | `grep -cE '^## [0-9]+\. ' specs/09c-primitives.md` → 18 以上 |
| §99 存在 | `grep -c '^## 99\. ' specs/09c-primitives.md` → 1 |
| JSX block | `grep -c '^```jsx$' specs/09c-primitives.md` → 17+ |

### 6.2 視覚値混入禁止

```bash
F=docs/00-getting-started-manual/specs/09c-primitives.md
grep -nE '#[0-9a-fA-F]{3,8}\b' "$F" && exit 1 || true
grep -nE 'oklch\(' "$F" && exit 1 || true
grep -nE '\b[0-9]+px\b' "$F" && exit 1 || true
grep -nE '\bbg-\[' "$F" && exit 1 || true
echo OK
```

### 6.3 JSX 転記の一致確認

`primitives.jsx` の各 primitive 関数本体行を `09c-primitives.md` に検索し、改行・class 名が一致することを目視確認。

---

## 7. 実行コマンド

```bash
cat docs/00-getting-started-manual/claude-design-prototype/primitives.jsx
$EDITOR docs/00-getting-started-manual/specs/09c-primitives.md
grep -cE '^## [0-9]+\. ' docs/00-getting-started-manual/specs/09c-primitives.md
bash scripts/verify-09c-no-visual-values.sh || true
mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09c-primitives.md || true
```

---

## 8. DoD（Definition of Done）

- [ ] `09c-primitives.md` が新規作成され 600〜1200 行
- [ ] §1〜§18 + §99 の見出しが揃う（17 primitive + 不採用）
- [ ] 各 §X に X.1 (JSX 転記) / X.2 (props) / X.3 (variants/sizes/states) / X.4 (a11y) / X.5 (token) / X.6 (link) が揃う
- [ ] 全 primitive で token 名のみ使用（HEX / oklch / px 値が §6.2 grep で 0 件）
- [ ] icon-only Button / IconBtn の `aria-label` 必須が §1.4 / 関連 §に明記
- [ ] dialog / drawer / modal で `role="dialog"` + `aria-modal="true"` + focus trap + Esc close が記述
- [ ] §99 に TweaksPanel / data-theme / AvatarStoreProvider#localStorage の 3 件が列挙
- [ ] 09b / 09a / 09e/09f/09g への link が全 primitive で記述
- [ ] markdown lint で error 0

---

## 9. 影響範囲・リスク

| リスク | 緩和策 |
|--------|--------|
| primitive 列挙漏れ | primitives.jsx の関数宣言行を `grep -nE '^function [A-Z]' primitives.jsx` で抽出し checklist 化 |
| token 値の混入 | §6.2 grep gate を pre-commit で実行 |
| JSX 転記のドリフト | task-07 の 09a mapping と行範囲を 1:1 で揃える |

---

## 10. 関連 task / link 先

- task-06（09-ui-ux.md 契約 → 09c に index 表でリンク）
- task-07（09a-prototype-map.md → 行範囲 mapping）
- task-08（09b-design-tokens.md → token 値）
- task-10 ui-primitives → 本仕様に従って実装
- task-20/21/22（09e/09f/09g/09h）→ primitive 採用例として 09c に逆 link


---

## diff scope 規律（task-01 反映 / 2026-05-07）

`SCOPE.md §6 diff scope 規律 / archive rule` を遵守する。本 task 完了前に以下を必ず確認:

- `git diff --name-only main...HEAD` の出力が、本 task 仕様 §3「変更対象ファイル」 + 本 task package（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/<dir>/`）配下のみで構成されていること
- 完了済み workflow dir を整理する場合は `git mv <dir> docs/30-workflows/completed-tasks/<dir>` でアーカイブ（`git rm -r` 純削除は禁止）
- sync-merge / rebase で混入した範囲外削除は `git checkout HEAD -- <path>` で復旧してから commit する
