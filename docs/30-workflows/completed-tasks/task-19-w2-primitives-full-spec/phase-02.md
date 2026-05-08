[実装区分: ドキュメントのみ]

# Phase 2: 設計

> 理由: task-19 の主成果物はドキュメント作成で完結する。review cycle で検出した隣接 apps/api diff は task-19 primary deliverable から分離して扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | primitives-full-spec |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-07 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| coverage AC | 適用外（pure-docs） |

## 目的

09c-primitives.md の **章立て（§1〜§18 + §99 = 19 セクション）** と **各 §X の 6 サブセクション (X.1〜X.6) topology** を確定し、Phase 5 執筆者が「どの primitive にどの行範囲・どの token・どの link を書くか」を決定論的に展開できる状態を作る。Phase 1 で確定した AC-1〜AC-17 を topology table に解像度を上げて落とす。

## 実行タスク

- 19 セクション topology table の作成（§X / Name / 由来行 / 由来関数 / token 範囲 / link 先）
- 6 サブセクション template（X.1〜X.6）の正本固定
- a11y matrix の作成（dialog 系 / icon-only / form 系の役割分類）
- token 参照辞書の整備（§5 で primitive→token 名カテゴリの対応表）
- link mapping 表（09b §X / 09a §2.X / 09e/09f/09g §X 採用例）
- §99 不採用 primitive の根拠表整備

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC 一覧 / 不変条件 / 19 見出し |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/primitives.jsx | 行範囲確定 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md | §4.1 章立て / §4.2 列構成 / §4.3 sample |
| 参考 | docs/00-getting-started-manual/specs/09a-prototype-map.md | 09a §2.X 命名規約の参照 |
| 参考 | docs/00-getting-started-manual/specs/09b-design-tokens.md | 09b §X 命名規約の参照 |

## 実行手順

### Step 1: 19 セクション topology table

| §X | Name | primitives.jsx 行範囲 | 由来関数 | a11y 区分 | token カテゴリ | link 先（09a / 09b / 採用例） |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Button | L92-L110 | `Button` | interactive | color/radius/shadow/space | 09a §2.1 / 09b §3.1 / 09e §1, 09f §1, 09g §1 |
| 2 | Card | (派生・複合) | (Section 構造) | structural | color/radius/shadow/space | 09a §2.2 / 09b §3.2 / 09e §2, 09g §2 |
| 3 | Badge | L6-L14 | `Chip` | non-interactive | color/radius/text | 09a §2.3 / 09b §3.3 / 09e §3, 09g §3 |
| 4 | Input | (Field 内 input) | `Field>input` | form-control | color/radius/border/space | 09a §2.4 / 09b §3.4 / 09f §2 |
| 5 | Field | L129-L143 | `Field` | form-wrapper | color/radius/space/text | 09a §2.5 / 09b §3.5 / 09f §2 |
| 6 | Select | (派生) | `Field>select` | form-control | color/radius/border/space | 09a §2.6 / 09b §3.6 / 09f §3, 09g §4 |
| 7 | Switch | L113-L115 | `Switch` | toggle | color/radius/space | 09a §2.7 / 09b §3.7 / 09g §5 |
| 8 | Segmented | L118-L126 | `Segmented` | toggle-group | color/radius/space/text | 09a §2.8 / 09b §3.8 / 09g §6 |
| 9 | Sidebar | (派生) | `Sidebar`+`SidebarItem` | navigation | color/space/text | 09a §2.9 / 09b §3.9 / 09g §7 |
| 10 | Stat | (派生) | `Stat` | non-interactive | color/text/space | 09a §2.10 / 09b §3.10 / 09e §4, 09g §8 |
| 11 | EmptyState | (派生) | `EmptyState` | non-interactive | color/text/space | 09a §2.11 / 09b §3.11 / 09f §4, 09g §9 |
| 12 | Avatar | (派生) | `Avatar` | non-interactive | color/radius | 09a §2.12 / 09b §3.12 / 09e §5, 09g §10 |
| 13 | Banner | (派生) | `Banner` | status | color/radius/text/space | 09a §2.13 / 09b §3.13 / 09e §6, 09g §11 |
| 14 | Drawer | L158-L174 | `Drawer` | dialog (modal) | color/radius/shadow/space | 09a §2.14 / 09b §3.14 / 09g §12 |
| 15 | Modal | L177-L195 | `Modal` | dialog (modal) | color/radius/shadow/space | 09a §2.15 / 09b §3.15 / 09g §13 |
| 16 | Toast | L198-L223 | `Toast`+`ToastProvider` | live-region | color/radius/shadow/space | 09a §2.16 / 09b §3.16 / 09g §14 |
| 17 | KVList | L226-L235 | `KVList` | non-interactive | color/text/space | 09a §2.17 / 09b §3.17 / 09e §7, 09f §5 |
| 18 | LinkPills | L248-L262 | `LinkPills` | navigation | color/radius/text/space | 09a §2.18 / 09b §3.18 / 09e §8 |
| 99 | 不採用 | — | TweaksPanel / data-theme / AvatarStoreProvider#localStorage | excluded | — | — |

> 「派生」と記した primitive は primitives.jsx に独立関数が存在せず、Chip / Field / Section / NavBtn / Pill / IconBtn 等を組み合わせて構成される。Phase 5 執筆時に最も近い関数 (`Pill` / `NavBtn` / `IconBtn` / `SectionTitle` / `SubSectionTitle` 等) の行範囲を併記し、独自セクションとして章立てる。

### Step 2: 6 サブセクション topology table（各 §X 共通）

| サブ § | 名前 | 必須内容 | 形式 |
| --- | --- | --- | --- |
| X.1 | prototype 由来 | `primitives.jsx` L<a>-L<b> + 一字一句転記 JSX block | ` ```jsx` フェンス |
| X.2 | 本番 props 仕様 | name / type / required / default / description | markdown table（5 列） |
| X.3 | variants / sizes / states | variant / size / state ごとの token 名・aria 反映 | markdown table（3 表または統合表） |
| X.4 | a11y | role / aria-* / keyboard / focus 管理 | bullet list |
| X.5 | token 参照 | `--ubm-color-*` / `--ubm-radius-*` / `--ubm-shadow-*` / `--ubm-space-*` / `--ubm-text-*` / `--ubm-font-*` の使用名のみ列挙 | bullet list（値禁止） |
| X.6 | link | 値: 09b §X / mapping: 09a §2.X / 採用例: 09e/09f/09g §X | bullet list |

### Step 3: a11y matrix

| 区分 | 該当 § | 必須事項 |
| --- | --- | --- |
| dialog (modal) | §14 Drawer / §15 Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, Esc close, 背景 inert |
| live-region | §16 Toast | `role="status"` または `role="alert"`, `aria-live="polite|assertive"`, dismiss timeout |
| toggle | §7 Switch / §8 Segmented | `role="switch"` / `role="tablist"+tab`, `aria-checked` / `aria-selected`, ←→ keyboard |
| navigation | §9 Sidebar / §18 LinkPills | `nav` 要素 or `role="navigation"`, `aria-current="page"` |
| form-control | §4 Input / §5 Field / §6 Select | `<label for>` または `aria-labelledby`, `aria-describedby`(error), `aria-invalid` |
| interactive (button) | §1 Button | icon-only は `aria-label` 必須, `:focus-visible` ring, `disabled` |
| status | §13 Banner | `role="status"` または静的 |

### Step 4: token 参照辞書（§5 用）

| カテゴリ | 名前空間 | 09b 参照先 |
| --- | --- | --- |
| color | `--ubm-color-{accent,bg,panel,panel-soft,text,text-muted,border,danger,warning,success,...}` | 09b §1 |
| radius | `--ubm-radius-{xs,sm,md,lg,pill}` | 09b §2 |
| shadow | `--ubm-shadow-{xs,sm,md,lg}` | 09b §3 |
| space | `--ubm-space-{1..8}` | 09b §4 |
| text | `--ubm-text-{xs,sm,md,lg,xl}` | 09b §5 |
| font | `--ubm-font-{sans,mono}` | 09b §6 |

> 名前空間が確定するのは task-08 完了後。本タスクは **名前のみ参照**し、値の正本は 09b に委ねる。

### Step 5: §99 不採用 primitive 根拠表

| primitive | 由来 | 不採用理由 | 代替（本番） |
| --- | --- | --- | --- |
| TweaksPanel | `app.jsx` L213-L251 | EDITMODE 専用、本番 UI 非対応 | なし（本番から完全排除） |
| data-theme switcher | `styles.css` L42-L70 | dark mode は MVP 対象外 | light only（task-08 token で固定） |
| AvatarStoreProvider#localStorage | `primitives.jsx` L20-L28 | 本番は API 経由（task-14 別途） | apps/api 経由の avatar 取得 |

### Step 6: 並列 wave ownership 宣言

| 項目 | 内容 |
| --- | --- |
| 編集する schema / 共通コード | なし（pure-docs / 09c-primitives.md 単独・新規） |
| 本タスクが ownership を持つか | yes（09c-primitives.md の owner） |
| 他 wave への影響 | task-06 (09-ui-ux.md) は consumer / task-10 (実装) は consumer |
| 競合リスク | なし（並列 task-07 は 09a / task-08 は 09b と別ファイル） |
| migration 番号 / exports 改名の予約 | 該当なし |
| test file ownership | Phase 4 検証スクリプトは本 task 単独所有（`scripts/verify-09c-no-visual-values.sh`） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | topology table の整合性レビュー / NO-GO 条件確定 |
| Phase 4 | 19 見出し / 6 サブセクション structure を grep 検証する script の入力 |
| Phase 5 | 執筆ガイドの正本（行範囲 + token カテゴリ + link 先） |
| Phase 7 | AC トレース元（topology の充足確認） |

## 多角的チェック観点（AIが判断）

- 価値性: 19 セクション topology が「次に書く 1 文字」を一意に決められる解像度か
- 実現性: 「派生」primitive 7 件（Card/Input/Select/Sidebar/Stat/EmptyState/Avatar/Banner）の構成根拠が styles.css class と一致するか
- 整合性: a11y matrix が WAI-ARIA Authoring Practices と矛盾しないか
- 運用性: token 名前空間が task-08（09b）の確定後に rename した場合の追従が grep 1 発で可能か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 19 セクション topology table 作成 | 2 | spec_created | Step 1 |
| 2 | 6 サブセクション template 固定 | 2 | spec_created | Step 2 / X.1〜X.6 |
| 3 | a11y matrix 作成 | 2 | spec_created | Step 3 |
| 4 | token 参照辞書整備 | 2 | spec_created | Step 4 |
| 5 | §99 不採用根拠表 | 2 | spec_created | Step 5 |
| 6 | 並列 wave ownership 宣言 | 2 | spec_created | Step 6 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | 19 セクション topology / 6 サブセクション / a11y matrix / token 辞書 / §99 / ownership |
| メタ | artifacts.json | Phase 状態 |

## 完了条件

- [ ] 19 セクション topology table が完備（§1〜§18 + §99）
- [ ] 各 §X の 6 サブセクション template が固定
- [ ] a11y matrix が dialog/live-region/toggle/navigation/form-control/interactive/status の 7 区分を網羅
- [ ] token 参照辞書 6 カテゴリ（color/radius/shadow/space/text/font）の名前空間が記載
- [ ] §99 3 件の根拠表（由来 / 理由 / 代替）が記載
- [ ] 並列 wave ownership 宣言が記載（owner=本 task / 競合リスク=なし）
- [ ] 上流ブロッカー（task-01 完了）を本 Phase でも明記（gate 重複明記ルール 2 箇所目）
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが spec_created
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 異常系（派生 primitive の列挙漏れ / a11y matrix の WAI-ARIA 不整合 / token 名前空間の drift）の検討済み
- [ ] 次 Phase への引き継ぎ事項を記述
- [ ] artifacts.json の該当 phase を spec_created に更新

## 次 Phase

Phase 3: 設計レビュー（PASS/MINOR/MAJOR 判定 / Phase 4 開始条件 / Phase 13 blocked 条件の確定）
