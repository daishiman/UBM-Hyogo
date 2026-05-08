# Phase 5: 実装（09c-primitives.md 本体執筆）

[実装区分: ドキュメントのみ]（CONST_004 例外: 純粋なドキュメント作成）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-19-w2-primitives-full-spec |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装（仕様書本体執筆） |
| 作成日 | 2026-05-07 |
| 前 Phase | 4 (事前検証手順) |
| 次 Phase | 6 (テスト実行) |
| 状態 | completed |
| implementation_mode | docs-only |
| task_kind | NON_VISUAL（pure-docs） |
| visualEvidence | false |

## 目的

タスク正本 §0.1 / §4 に従い、`docs/00-getting-started-manual/specs/09c-primitives.md`（600〜1200 行・新規）を執筆する。`primitives.jsx`（凍結正本・272 行）の全 primitive を 1 セクションずつ取り込み、後続 task-10（ui-primitives 実装）が「§X.Y を読んで 1 ファイル書ける」決定論的状態を作る。token 値（HEX / oklch / px）は **0 件**にし、token 名のみで参照する（値の正本は 09b、視覚 mapping の正本は 09a）。

## 実行タスク

- §1 Button 〜 §18 LinkPills + §99 不採用の **19 サブタスク**を 1 セクションずつ執筆
- 各 §X は X.1（JSX 一字一句転記）/ X.2（props 表）/ X.3（variants/sizes/states）/ X.4（a11y）/ X.5（token 参照）/ X.6（link）の **6 構成**を全て満たす
- JSX inline 転記は `primitives.jsx` の L\<a\>-L\<b\> を一字一句保つ（class 名・whitespace 含む）
- HEX / `oklch(` / `Npx` / `bg-[` を 0 件にする（token 名 `--ubm-*` のみ参照）
- icon-only Button（IconBtn）の `aria-label` 必須を §1.4 に明記
- dialog / drawer / modal は `role="dialog" + aria-modal="true" + Esc close + focus trap` を §14 / §15 に明記
- §99 に TweaksPanel / data-theme switcher / AvatarStoreProvider#localStorage の 3 件を列挙

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須（正本） | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md | タスク正本（§0.7 grep 見出し / §4.2 template / §4.3 Button サンプル） |
| 必須（転記元） | docs/00-getting-started-manual/claude-design-prototype/primitives.jsx | JSX 一字一句転記元（L1-L272・凍結正本） |
| 参照 | docs/00-getting-started-manual/claude-design-prototype/styles.css | class 名出典のみ（値転記禁止） |
| 参照 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-2/phase-2.md | §4 primitive 列挙 |
| 参照 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md | §3 未掲載画面派生ルール |
| link 先（同時並列） | docs/00-getting-started-manual/specs/09b-design-tokens.md | task-08 token 値 |
| link 先（同時並列） | docs/00-getting-started-manual/specs/09a-prototype-map.md | task-07 mapping |

## 実行手順

### ステップ 1: primitive 列挙確定
1. `rg -n '^(const|function) [A-Z][A-Za-z0-9]*\b' docs/00-getting-started-manual/claude-design-prototype/primitives.jsx` で関数宣言行を抽出
2. タスク正本 §0.7 の 18 primitive + §99 と突合し、漏れなし checklist を構築

### ステップ 2: ファイル骨格生成
1. `09c-primitives.md` 冒頭に `[実装区分: ドキュメントのみ]` を明記
2. 目次（§1〜§18 + §99）を `## N. <Name>` 形式で配置
3. 各 §X 直下に X.1〜X.6 の 6 サブセクションの空テンプレを配置

### ステップ 3: §1〜§18 を 1 セクションずつ執筆（19 サブタスク）
タスク正本 §4.2 template / §4.3 Button サンプルに準拠。各 §X で:
- X.1: `primitives.jsx` の該当行範囲を ```jsx ブロックで一字一句転記
- X.2: props 表（name / type / required / default / description）
- X.3: variants / sizes / states 表（token 名で記述）
- X.4: a11y（role / aria-* / keyboard / focus management）
- X.5: token 参照名のみ列挙（`--ubm-color-*` 等）
- X.6: 09b §X / 09a §2.X / 09e/09f/09g 採用例への link

### ステップ 4: §99 不採用 primitive 整理
| primitive | 理由 |
|-----------|------|
| TweaksPanel (`app.jsx` L213-L251) | EDITMODE 専用、本番 UI 非対応 |
| data-theme switcher (`styles.css` L42-L70) | dark mode は MVP 対象外 |
| AvatarStoreProvider#localStorage (`primitives.jsx` L20-L28) | 本番は API 経由（task-14 別途） |

### ステップ 5: a11y 不変条件の埋め込み
- §1.4: icon-only Button / IconBtn の `aria-label` 必須
- §14.4 / §15.4: `role="dialog" + aria-modal="true" + Esc close + focus trap`
- §16.4 (Toast): `role="status"` または `aria-live="polite"`

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | §6.1〜§6.3 grep gate / markdown lint の検証起点 |
| Phase 7 | §X 共通テンプレ準拠の整形対象 |
| Phase 8 | 09a / 09b / 09e/09f/09g への link 整合性検証起点 |
| Phase 9 | DoD §8 の最終チェックリスト起点 |

## 多角的チェック観点（AIが判断）

- 価値性: task-10 実装担当者が §X.Y を読むだけで 1 primitive を書けるか
- 整合性: §0.5 不変条件（JSX 改変禁止 / token 値 0 件 / EDITMODE 除外）を全て満たすか
- 完全性: 18 primitive + §99 が全て揃い、各 §X が X.1〜X.6 完備か
- 安全性: a11y（dialog / aria-label / focus trap）の必須記述が漏れていないか
- 保守性: token 名のみ参照することで 09b 単独改訂で値が伝播するか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | §1 Button | 5 | pending | L92-L110 / icon-only aria-label |
| 2 | §2 Card | 5 | pending | class 名抽出 |
| 3 | §3 Badge (Chip) | 5 | pending | L6-L14 |
| 4 | §4 Input | 5 | pending | Field と分離 |
| 5 | §5 Field | 5 | pending | L129-L143 |
| 6 | §6 Select | 5 | pending | native select wrap |
| 7 | §7 Switch | 5 | pending | L113-L115 |
| 8 | §8 Segmented | 5 | pending | L118-L126 |
| 9 | §9 Sidebar | 5 | pending | SidebarItem 含む |
| 10 | §10 Stat | 5 | pending | label / value / sub |
| 11 | §11 EmptyState | 5 | pending | icon / title / description / action |
| 12 | §12 Avatar | 5 | pending | size / fallback |
| 13 | §13 Banner | 5 | pending | info / warn / error / success |
| 14 | §14 Drawer | 5 | pending | L158-L174 / dialog a11y |
| 15 | §15 Modal | 5 | pending | L177-L195 / focus trap |
| 16 | §16 Toast | 5 | pending | L198-L223 / aria-live |
| 17 | §17 KVList | 5 | pending | L226-L235 |
| 18 | §18 LinkPills | 5 | pending | L248-L262 |
| 19 | §99 不採用 | 5 | pending | TweaksPanel / data-theme / localStorage |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | docs/00-getting-started-manual/specs/09c-primitives.md | primitive 完全仕様（600〜1200 行・新規） |
| メタ | artifacts.json | Phase 5 を spec_created に更新 |

## 完了条件

- [ ] `09c-primitives.md` が新規作成され 600〜1200 行
- [ ] §1〜§18 + §99 の見出しが揃う（19 セクション）
- [ ] 各 §X に X.1〜X.6 が揃う
- [ ] 全 primitive で token 名のみ使用（HEX / oklch / px / `bg-[` が 0 件）
- [ ] icon-only Button の `aria-label` 必須が §1.4 に明記
- [ ] §14 / §15 に `role="dialog" + aria-modal="true" + focus trap + Esc close` 記述
- [ ] §99 に 3 件の不採用 primitive 列挙
- [ ] coverage AC 適用外（pure-docs / 実装テスト発生せず）

## タスク100%実行確認【必須】

- [ ] 19 サブタスク全て completed
- [ ] 09c-primitives.md が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 不変条件 §0.5（1〜7）を逸脱していない
- [ ] 次 Phase への引き継ぎ事項を記述
- [ ] artifacts.json の該当 phase を spec_created に更新

## 次 Phase

- 次: 6 (テスト実行)
- 引き継ぎ事項: 執筆済み 09c-primitives.md を Phase 6 の grep gate / markdown lint に投入
- ブロック条件: 19 サブタスクのうち 1 つでも未完成、または HEX/oklch/px が混入している場合は次 Phase に進まない
