[実装区分: 実装仕様書]

# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-06-ui-ux-contract-rewrite |
| Wave | 2 |
| 実行種別 | parallel |
| Phase 番号 | 8 / 13 |
| 作成日 | 2026-05-07 |
| 上流 Phase | 7（AC マトリクス） |
| 下流 Phase | 9（品質保証） |
| 状態 | completed |
| 区分 | implementation / NON_VISUAL |

## 目的

19 routes contract 表 / 13 primitives + feature components contract 表 / token 参照名の重複を整理する。
本タスクは markdown 1 ファイルの書き換えであり、DRY 化対象は **行の重複**ではなく **列構成・参照経路の重複**となる。
具体的には:

1. 19 routes contract 表の **列構成統一**（10 列を全 route で揃える）
2. §3 primitives 表の **列構成統一**（8 列を全 primitive で揃える）
3. token prefix の **重複参照削減**（§3 の token 列で値を再記述せず、§6.3 で prefix を 1 箇所定義）
4. 09a / 09b への link 文言統一（`→ 09a-prototype-map.md §x.y（pages-*.jsx Lxx-Lxx 由来）` 形式）

## 実行タスク

1. routes contract 表の Before/After（列構成）
2. primitives contract 表の Before/After（列構成）
3. token 参照経路 Before/After（§6.3 単一定義 + §3 は参照名のみ）
4. link 文言 Before/After（09a / 09b への統一書式）
5. 状態列挙の重複削減（login 5 状態は §4.2 単一定義、§2.2.1 は参照のみ）
6. outputs/phase-08/main.md 作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | 元仕様書 §0.7（grep 可能見出し列構成） | 列構成正本 |
| 必須 | 元仕様書 §4.3 / §4.4 | template 表 |
| 必須 | 元仕様書 §6.3 token prefix 規則 | prefix 単一定義 |

## 実行手順

### ステップ 1: routes contract 列構成確定（10 列）
### ステップ 2: primitives contract 列構成確定（8 列）
### ステップ 3: token 参照経路 DRY 化
### ステップ 4: link 文言統一
### ステップ 5: 状態列挙の単一正本化
### ステップ 6: outputs/phase-08/main.md 作成

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | 列構成が grep で機械検証可能（`| 認可 |` `| variants |` 等の検出数） |
| Phase 12 | implementation-guide.md に列構成表を転記 |

## 多角的チェック観点（不変条件参照）

- **#1**: token 値を §3 で再記述しないこと（§6.3 で 1 箇所定義）
- **#5**: 「D1 直接アクセス」の文言を §1 で 1 箇所定義し、各 route で再掲しない
- **#6**: 「不採用」記述を §8 に集約（各 route の「不採用」列は短い参照のみ）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | routes 列構成 Before/After | 8 | completed | 10 列 |
| 2 | primitives 列構成 Before/After | 8 | completed | 8 列 |
| 3 | token 参照経路 DRY | 8 | completed | §6.3 単一定義 |
| 4 | link 文言統一 | 8 | completed | 09a / 09b |
| 5 | 状態列挙単一正本化 | 8 | completed | §4.2 単一 |
| 6 | outputs 作成 | 8 | completed | outputs/phase-08/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-08/main.md` | DRY Before/After 一覧 |
| メタ | `artifacts.json` | Phase 8 を completed |

## 完了条件

- [ ] routes / primitives 列構成が全 entry で同一
- [ ] token prefix が §6.3 で 1 箇所定義され、§3 の token 列は参照名のみ
- [ ] link 文言が `→ 09a-prototype-map.md §x.y（<source.jsx> Lxx-Lxx 由来）` 形式に統一
- [ ] login 5 状態は §4.2 単一正本、§2.2.1 は参照のみ

## タスク 100% 実行確認【必須】

- [ ] 全 6 サブタスク completed
- [ ] outputs/phase-08/main.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 9（品質保証）
- 引き継ぎ事項: 列構成 → grep 機械検証ルール
- ブロック条件: 列構成が揺れたまま残存

## Before / After

### routes contract 表 列構成（採用 10 列）

| Before（旧 09-ui-ux.md / 揺れ） | After（採用） | 理由 |
| --- | --- | --- |
| 散文 + 一部表 / 列名不統一 | `| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |` | grep 機械検証可、19 entry で揃う |
| 「視覚詳細」を本文中に記述 | 「視覚詳細 link」列で 09a への link のみ | DRY、09b 値は再掲しない |
| 「実装ファイル」列 | 削除（task-09..17 が決める） | 契約と実装の分離 |

### primitives contract 表 列構成（採用 8 列）

| Before（揺れ候補） | After（採用） | 理由 |
| --- | --- | --- |
| props のみ列挙 | `| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |` | 全 primitive で揃う |
| 「token 値」直書き | 「token」列に参照名のみ | §6.3 / 09b に委譲 |
| Storybook path 個別記述 | `apps/web/src/components/ui/<name>.stories.tsx` 形式に統一 | task-10 に向けた決定論的経路 |

### token 参照経路 DRY 化

| Before | After |
| --- | --- |
| §3 の各 primitive で `--ubm-color-accent: oklch(...)` のように値を再掲 | §6.3 で prefix `--ubm-color-* / --ubm-radius-* / --ubm-shadow-* / --ubm-space-* / --ubm-text-* / --ubm-font-* / --ubm-dur-* / --ubm-ease-*` を 1 箇所定義、§3 / §2 の token 列は参照名のみ |
| 視覚値（oklch / HEX）を §3 / §2 に転記 | 削除（09b に委譲、`→ 09b-design-tokens.md §x` link） |

### link 文言統一

| Before（揺れ候補） | After（採用） |
| --- | --- |
| `参照: ../prototype/...` | `→ 09a-prototype-map.md §x.y（<source>.jsx Lxx-Lxx 由来）` |
| `(09b 参照)` | `→ 09b-design-tokens.md §x` |
| `Storybook で確認` | `apps/web/src/components/ui/<name>.stories.tsx`（task-10 で作成） |

### 状態列挙の単一正本化

| Before | After |
| --- | --- |
| §2.2.1 `/login` で 5 状態を full 列挙 | §4.2 で 5 状態 full 列挙、§2.2.1 は「状態 → §4.2 参照」のみ |
| 申請 pending を §2.2.2 / §4.3 で二重記述 | §4.3 で `server-pending を上書き禁止` を単一正本化、§2.2.2 は参照のみ |
| ページ標準 5 値を各 route で散発記述 | §4.1 で 1 箇所定義、§2 各 route の「状態」列は `idle → loading → (success | error | empty)` の標準形のみ |

### 不採用記述の集約

| Before | After |
| --- | --- |
| 各 route の「不採用」列で詳細を記述 | §8 に集約（4 項目）、§2 各 route の「不採用」列は短いラベル参照のみ |
