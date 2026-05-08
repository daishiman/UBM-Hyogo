# Phase 02: 設計

## サマリ

新 §1〜§10 章立て、§2 routes 契約表 10 列、§3 component 契約表 8 列、§4.5 prototype 由来契約 19 行 mapping、§4.6 不採用 4 項目、§5 a11y 正本見出し、§6 token prefix 8 種、09a..09h index 表配置を確定した。詳細スケルトンは `chapter-skeleton.md` 参照。

## 章立て差分

| 旧 (160 行 / 8 章) | 新 (396 行 / 10 章) | 差分の核心 |
| --- | --- | --- |
| 1. 位置づけ | 1. 位置づけと正本主義 | 1.2 link 先 index 表（09a/09b/09c..09h/Storybook）を追加 |
| 2. 情報設計の基本原則 | 2. 19 routes 全画面の契約一覧 | routes 軸の契約表に統合（10 列 × 20 行） |
| 3. レイヤ別 UX | 3. component 契約一覧 | 視覚詳細を削除、props 一覧表に統一 |
| 4. 一覧 UX | 4. 状態列挙の規範 | login 5 状態 / 申請 server-pending / prototype 19 行 / 不採用 4 項目 |
| 5. 詳細 UX | 5. アクセシビリティ契約 | a11y を独立章に昇格（5.1 共通 / 5.2 dialog / 5.3 form / 5.4 live region） |
| 6. 管理 UX | 6. token 参照規則 | 「視覚値の決定権は 09b にある」明文化、prefix 8 種 |
| 7. コンポーネント方針 | 7. Storybook 正本主義 | 正解スクリーンショット = Storybook VRT |
| 8. 不採用と注意事項 | 8. 不採用画面・不採用パターン | 章番号維持 |
| —— | 9. 用語集 | zone / gate-state / visibility-request / identity-conflict / pending banner |
| —— | 10. 改訂履歴 | 新規 |

旧 §3〜§6 の視覚詳細記述は削除済み（grep gate で確認: HEX/oklch/px/`bg-[` すべて 0 件）。

## §2 routes 契約表 列構成（10 列・統一）

```
| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
```

サンプル `/`（Public Top）:
- 認可: unauthenticated 可 / authenticated 可
- API: `GET /public/stats`, `GET /public/members?limit=6&order=recent`, `GET /public/form-preview`
- token: `--ubm-color-bg`, `--ubm-color-panel`, `--ubm-color-accent`, `--ubm-radius-lg`, `--ubm-shadow-md`
- 視覚詳細: → `09a-prototype-map.md` §1.1
- 不採用: theme switcher UI

19 routes + `global-error.tsx` fallback を同一列構成で書き切る（20 個の `### 2.x.y`）。

## §3 component 契約表 列構成（8 列・統一）

```
| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
```

サンプル `Button`（§3.1.1）:
- variants: primary / accent / ghost / soft / danger
- sizes: sm / md（既定）/ lg
- 視覚詳細: → `09a-prototype-map.md` §2.1（完全仕様 = `09c-primitives.md`）
- Storybook: `apps/web/src/components/ui/button.stories.tsx`（task-10 で作成）

primitives 13 種（Button/Card/Badge/Input/Select/Table/Tabs/Sidebar/Toast/Skeleton/DataTable/EmptyState/ErrorState）をすべて 8 列で記述。

## §4.5 prototype 由来契約 19 行 mapping（要約）

| 由来 | 取り込み先 |
| --- | --- |
| primitives.jsx Chip / Button / Switch / Segmented / Field / Drawer / Modal / Toast / KVList / LinkPills / zoneTone | §3.1 / §3.2 / §5.2 / §5.4 / §6.3 |
| pages-public.jsx Landing / MemberList / MemberDetail | §2.1.1 / §2.1.2 / §2.1.3 |
| pages-member.jsx Login / MyProfile | §4.2 / §2.2.2 |
| pages-admin.jsx Dashboard / Members / Tags / SchemaDiff | §2.3.1 / §2.3.2 / §2.3.3 / §2.3.5 |

19 行を漏れなく §3 / §2 / §4.2 / §5.2 / §6.3 にマッピング済み。

## §4.6 不採用 4 項目

| 項目 | 理由 |
| --- | --- |
| tweaks panel / theme switcher | EDITMODE 専用、本番 UI 要件外 |
| localStorage ベースの photo store | 本番は API 経由（task-14 で別途設計） |
| `data-theme="warm"/"cool"` | dark mode 含め MVP 非対応 |
| gas-prototype 由来挙動 | 不変条件 #6（GAS prototype 非昇格） |

## §5 a11y 正本見出し位置

- §5.1 全画面共通（landmark / `<h1>` 1 個 / focus-visible）
- §5.2 dialog / drawer（`role="dialog"` + `aria-modal="true"` + focus trap + Esc close + scrim click close）
- §5.3 form / input（`<label htmlFor>` ↔ `<input id>` / `aria-describedby` / `aria-invalid` / `aria-required`）
- §5.4 live region（`role="status"` / `role="alert"` / Toast Provider 経由）

## §6 token prefix 規則（8 種）

| prefix | 用途 |
| --- | --- |
| `--ubm-color-*` | 色（surface / panel / accent / text / status） |
| `--ubm-radius-*` | 角丸 |
| `--ubm-shadow-*` | 影 |
| `--ubm-space-*` | 余白 / gap |
| `--ubm-text-*` | typography size / line-height |
| `--ubm-font-*` | font-family / weight |
| `--ubm-dur-*` | アニメ duration |
| `--ubm-ease-*` | アニメ easing |

## 09a..09h index 表（§1.2 配置確定）

| ファイル | 内容 | 担当 task |
| --- | --- | --- |
| 09a-prototype-map.md | prototype 行範囲 → contract mapping | task-07 |
| 09b-design-tokens.md | token 値（HEX/oklch/px） | task-08 |
| 09c-primitives.md | primitive 完全仕様 | task-19 |
| 09d-icons.md | icon set | task-22 |
| 09e-screen-blueprints-public.md | 公開層 blueprint | task-21 |
| 09f-screen-blueprints-member.md | 会員層 blueprint | task-21 |
| 09g-screen-blueprints-admin.md | 管理層 blueprint | task-21 |
| 09h-shell-and-fixtures.md | shell + fixtures | task-22 |

## サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | :---: |
| 1 | 章立て差分表（旧 8 章 → 新 10 章） | completed |
| 2 | §2 表列構成 + サンプル | completed |
| 3 | §3 表列構成 + サンプル | completed |
| 4 | §4.5 19 行 mapping | completed |
| 5 | §4.6 不採用 4 項目 | completed |
| 6 | §5 a11y 正本見出し | completed |
| 7 | §6 token prefix 8 種 | completed |
| 8 | 09a..09h index 表配置 | completed |
| 9 | chapter-skeleton.md 配置 | completed |

## 次 Phase

Phase 3（設計レビュー）へ。alternative 3 案 / PASS-MINOR-MAJOR 判定 / GO 判定の入力として本 Phase の章立て確定を渡す。
