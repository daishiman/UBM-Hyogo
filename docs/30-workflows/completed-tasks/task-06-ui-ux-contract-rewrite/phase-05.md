[実装区分: 実装仕様書]

# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-06-ui-ux-contract-rewrite |
| Wave | 2 |
| 実行種別 | parallel |
| Phase 番号 | 5 / 13 |
| 作成日 | 2026-05-07 |
| 上流 Phase | 4（テスト戦略） |
| 下流 Phase | 6（異常系検証） |
| 状態 | completed |
| 区分 | implementation / NON_VISUAL |

## 目的

`docs/00-getting-started-manual/specs/09-ui-ux.md` を「契約のみ」に全面書き換えする実装手順を、
元仕様書 §1〜§10 の章立て順で時系列 runbook に落とす。本タスクは markdown ファイルの全面書き換えという
「実装」を伴うため、書き換えの順序・サンプル表のコピペ起点・19 routes × 同列構成テーブルの展開ガイド・
sanity check（grep gate / 構造検証）を runbook で確定する。

不変条件（CLAUDE.md / 元仕様書 §0.5 を転記）:
1. `apps/web` から D1 への直接アクセスを契約上も書かない（API 経由のみ）。
2. consent キーは `publicConsent` / `rulesConsent`。
3. `responseEmail` は system field として扱う。
4. 視覚詳細値（HEX / oklch / px / `bg-[#...]`）は **0 件**。
5. プロトタイプ EDITMODE 専用要素（TweaksPanel / data-theme switcher / AvatarStoreProvider の localStorage 部分）は不採用と明記。
6. login 5 状態（input / sent / unregistered / deleted / error）は新 §4.2 で正本化。
7. dialog / drawer は `role="dialog" + aria-modal="true" + focus trap + Esc close` を §5.2 に必ず記述。

## 実行タスク

1. 既存 `09-ui-ux.md` の章立て差分（§4.1 → §4.2）を runbook 形式に展開
2. 新 §1〜§10 の各章の sub-step を作成（書き換え順序を確定）
3. §4.3（routes contract サンプル表）を template 化し、19 routes に展開する手順を定義
4. §4.4（primitives contract サンプル表）を template 化し、13 primitives + feature components に展開する手順を定義
5. §6.2 grep gate / §6.4 trace check を sanity check として各 step に組み込む
6. 上位 task-19..22 への index 表（09a〜09h）を §1 末尾もしくは §6 直前に配置

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-06-w2-par-ui-ux-contract-rewrite.md` | 元仕様書（§0〜§10） |
| 必須 | `docs/00-getting-started-manual/specs/09-ui-ux.md` | 書き換え対象 |
| 必須 | `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx` | primitive 契約抽出元 |
| 必須 | `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` | 公開層状態抽出 |
| 必須 | `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` | login 5 状態 / profile 4 領域抽出 |
| 必須 | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` | 管理層状態抽出 |
| 必須 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` | API 接続表（§2）/ 未掲載派生ルール（§3） |

## 実行手順

### ステップ 1: 既存 09-ui-ux.md の構造把握

既存 160 行を読み、旧 §3〜§6 の視覚詳細記述（Hero 構成順序、密度切替値、KPI 文言、カード配置順）を抽出する。これらは
§2 routes 契約の状態・主 props 列、§3 component 契約の props 列に転記し、視覚詳細そのものは
`09a-prototype-map.md` への link に置き換える。

### ステップ 2: 新章立てスケルトン作成（§1〜§10 見出しのみ）

§0.7 の grep 可能見出し列をそのまま転記し、空のスケルトンを作成する:

```
## 1. 位置づけと正本主義
### 1.1 「契約のみ」スコープ
### 1.2 link 先（09a / 09b / Storybook）
## 2. 19 routes 全画面の契約一覧
### 2.1 公開層 (6 routes)
#### 2.1.1 `/` (Public Top)
#### 2.1.2 `/(public)/members`
#### 2.1.3 `/(public)/members/[id]`
#### 2.1.4 `/(public)/register`
#### 2.1.5 `/privacy`
#### 2.1.6 `/terms`
### 2.2 会員層 (2 routes)
#### 2.2.1 `/login`
#### 2.2.2 `/profile`
### 2.3 管理層 (8 routes)
#### 2.3.1 `/(admin)/admin`
#### 2.3.2 `/(admin)/admin/members`
#### 2.3.3 `/(admin)/admin/tags`
#### 2.3.4 `/(admin)/admin/meetings`
#### 2.3.5 `/(admin)/admin/schema`
#### 2.3.6 `/(admin)/admin/requests`
#### 2.3.7 `/(admin)/admin/identity-conflicts`
#### 2.3.8 `/(admin)/admin/audit`
### 2.4 共通 (3 routes + global fallback)
#### 2.4.1 `app/error.tsx`
#### 2.4.2 `app/global-error.tsx`
#### 2.4.3 `app/not-found.tsx`
#### 2.4.4 `app/loading.tsx`
## 3. component 契約一覧
### 3.1 primitives
### 3.2 feature components
## 4. 状態列挙の規範
### 4.1 ページ標準 5 値
### 4.2 login 5 状態
### 4.3 申請 pending state
## 5. アクセシビリティ契約
### 5.1 全画面共通
### 5.2 dialog / drawer
### 5.3 form / input
### 5.4 live region
## 6. token 参照規則
### 6.1 視覚値の決定権は 09b にある
### 6.2 OKLch tokens を CSS 変数経由でのみ参照
### 6.3 token 名 prefix 規則
## 7. Storybook 正本主義
## 8. 不採用画面・不採用パターン
## 9. 用語集
## 10. 改訂履歴
```

**sanity**: `grep -c '^## ' specs/09-ui-ux.md` → 10 期待。

### ステップ 3: §1 位置づけと正本主義（および 09a〜09h index 表）

- §1.1 で「契約 = props / state / a11y / token 参照名」「視覚詳細はこのファイルに書かない」を冒頭明示。
- §1 末尾もしくは §6 直前に、task-19..22 が新設する `09c..09h` への index 表（元仕様書冒頭責務再定義の 8 行表）を配置:
  ```
  | spec | 担当 task | 役割 |
  |------|----------|------|
  | 09a-prototype-map.md | task-07 | prototype source ↔ 本番 component の行範囲 mapping |
  | 09b-design-tokens.md | task-08 | OKLch / radius / shadow / typography / spacing token 値 |
  | 09c-primitives.md   | task-19 | primitive component の完全仕様（JSX inline + a11y） |
  | 09d-icons.md        | task-22 | icon カタログ（icons.jsx 由来） |
  | 09e-screen-blueprints-public.md | task-20 | 公開層全画面の完全 blueprint |
  | 09f-screen-blueprints-member.md | task-20 | 会員層全画面の完全 blueprint |
  | 09g-screen-blueprints-admin.md  | task-21 | 管理層全画面の完全 blueprint |
  | 09h-shell-and-fixtures.md       | task-22 | app shell + fixture data |
  ```

**sanity**: index 表 8 行が `grep -c '^| 09' specs/09-ui-ux.md` で 8 件検出される。

### ステップ 4: §2 routes 契約 19 個展開（§4.3 サンプル表をコピペ起点）

元仕様書 §4.3 の `/` サンプル表を **template** として、19 routes 全てに **同じ列構成**で展開する:

```
| 項目 | 内容 |
|------|------|
| 認可 | unauthenticated 可 / authenticated 可 / member only / admin only |
| layout | (public)/layout.tsx / (admin)/layout.tsx 等 |
| 主 component | feature components の列挙 |
| API | phase-3.md §2 の routes × endpoint × method を **行レベルで完全一致**転記 |
| 状態 | idle → loading → (success | error | empty) |
| 主 props | feature component の主要 props 名（値ではなく名前） |
| a11y | landmark / 見出し階層 / role / aria-* |
| token | --ubm-color-* / --ubm-radius-* / --ubm-shadow-* の参照名のみ |
| 視覚詳細 link | → 09a-prototype-map.md §x.y（pages-*.jsx Lxx-Lxx 由来） |
| 不採用 | EDITMODE 由来 UI / data-theme 切替 等 |
```

展開順:

1. §2.1 公開層 6 routes（`/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms`）
   - `/` は §4.3 のサンプルをそのまま採用（Hero / Stats / ZoneGuide / Timeline）
   - `/members` は filter `q/zone/status/sort/density`（density 3 値）を主 props に
   - `/members/[id]` は summary / overview / skill / offer / personality / contact 順を主 props に
   - `/register` / `/privacy` / `/terms` は phase-3 §3 の未掲載派生ルール（法務 / register）を反映
2. §2.2 会員層 2 routes（`/login`, `/profile`）
   - `/login` の状態列は **§4.2 へ link**（5 状態は §4.2 で正本化、§2.2.1 では参照のみ）
   - `/profile` は banner / summary / request / delete の 4 領域を主 props に
3. §2.3 管理層 8 routes
   - `/admin` は KpiGrid + ZoneChart + StatusChart + RecentActions
   - `/admin/members` は DataTable + Drawer
   - `/admin/tags` は TagsQueue（左 list + 右 detail）
   - `/admin/meetings` は MeetingsCalendar + MeetingForm（phase-3 §3 admin CRUD）
   - `/admin/schema` は SchemaDiff (2 column) + apply confirm（phase-3 §3 admin diff）
   - `/admin/requests` は RequestsQueue + RequestDetail（phase-3 §3 admin queue）
   - `/admin/identity-conflicts` は ConflictPair（phase-3 §3 admin compare）
   - `/admin/audit` は AuditTimeline + AuditFilterBar（phase-3 §3 admin timeline）
4. §2.4 共通 3 routes + global fallback（`error.tsx` / `global-error.tsx` / `not-found.tsx` / `loading.tsx`）
   - phase-3 §3 §5.8 の未掲載派生ルール（共通 error / 404 / loading）を反映
   - layout 列は「app shell（root）」、API 列は「N/A」

**sanity**: `grep -c '^### 2\.' specs/09-ui-ux.md` → 19+ 期待（4 group heading + 19 個 = 23 程度）。

### ステップ 5: §3 component 契約展開（§4.4 サンプル表をコピペ起点）

元仕様書 §4.4 の `Button` サンプル表を **template** として、`#### 3.1.1 Button` 〜 と連番付与で展開:

```
| 項目 | 内容 |
|------|------|
| variants | primary | accent | ghost | soft | danger 等 |
| sizes | sm | md | lg |
| props | children / variant / size / icon / iconRight / block / disabled / type / title / onClick |
| a11y | <button type="..."> native semantics / icon-only は aria-label 必須 |
| state | default / hover / focus-visible / active / disabled |
| token | --ubm-color-* / --ubm-radius-* / --ubm-shadow-* |
| 視覚詳細 link | → 09a-prototype-map.md §x.y（primitives.jsx Lxx-Lxx 由来） |
| Storybook | apps/web/src/components/ui/<name>.stories.tsx（task-10 で作成） |
```

§3.1 primitives は元仕様書 §0.8 の 13 primitives:
Button / Card / Badge / Input / Select / Table / Tabs / Sidebar / Toast / Skeleton / DataTable / EmptyState / ErrorState

§3.2 feature components は元仕様書 §0.8 の列挙（29 種）:
Hero / Stats / ZoneGuide / Timeline / MemberCard / MemberList / FilterBar / DensityToggle / MemberDetail /
VisibilityBanner / VisibilitySummary / RequestPanel / DeleteRequestPanel / KpiGrid / ZoneChart / StatusChart /
RecentActions / MembersTable / MemberDrawer / TagsQueue / MeetingsCalendar / MeetingForm / RequestsQueue /
RequestDetail / SchemaDiff / ConflictPair / AuditTimeline / AuditFilterBar / LegalProse

元仕様書 §4.5 の prototype 由来 19 行（Chip / Button / Switch / Segmented / Field / Drawer / Modal / Toast /
KVList / LinkPills / zoneTone・statusTone / LandingPage / MemberListPage / MemberDetailPage / LoginPage /
MyProfilePage / AdminDashboardPage / AdminMembersPage / AdminTagsPage / SchemaDiffPage）を **checklist** として
§3 / §2 の該当箇所に取り込む。漏れ検出は phase-06 の異常系で扱う。

### ステップ 6: §4 状態列挙の規範

- §4.1 ページ標準 5 値: `idle / loading / empty / error / success`
- §4.2 login 5 状態: `input / sent / unregistered / deleted / error`（`pages-member.jsx` L4-L67 の構造に従う）
- §4.3 申請 pending state: visibility-request / delete-request の `server-pending` を **クライアントから上書き禁止**

### ステップ 7: §5 a11y 契約

- §5.1 全画面共通: landmark roles / heading hierarchy / skip link / focus visible
- §5.2 dialog / drawer: `role="dialog" + aria-modal="true" + focus trap + Esc close`（不変条件 7 を完全文記述）
- §5.3 form / input: `id` ↔ `htmlFor` / `aria-describedby` / `aria-invalid` / `aria-required`
- §5.4 live region: `role="status"`（toast 等）と `role="alert"`（critical）を分離

### ステップ 8: §6 token 参照規則

- §6.1 視覚値の決定権は 09b にある（明文化）
- §6.2 OKLch tokens を CSS 変数経由でのみ参照（HEX / `bg-[#...]` 直書き禁止）
- §6.3 token 名 prefix（重複参照は §3 の token 列で再記述しない）:
  ```
  --ubm-color-*  --ubm-radius-*  --ubm-shadow-*
  --ubm-space-*  --ubm-text-*    --ubm-font-*
  --ubm-dur-*    --ubm-ease-*
  ```

### ステップ 9: §7 Storybook 正本主義 / §8 不採用 / §9 用語集 / §10 改訂履歴

- §7: contract と Storybook story の責務分担、VRT 画像が「正解スクリーンショット」の正本
- §8: 元仕様書 §4.6 の **4 項目**を完全転記
  1. プロトタイプ tweaks パネル / theme switcher（`app.jsx` L213-L251）
  2. localStorage ベースの photo store（`primitives.jsx` AvatarStoreProvider L20-L28）
  3. `data-theme="warm" / "cool"` 切替（`styles.css` L42-L70）
  4. `gas-prototype/` 由来の振る舞い
- §9: zone / gate-state / visibility-request / identity-conflict / pending banner / server-pending / contract
- §10: `2026-05-07: full rewrite to contract-only (task-06)` の 1 行追加

### ステップ 10: 構造検証 + 視覚詳細 grep gate（§6.2 / §6.4）

```bash
F=docs/00-getting-started-manual/specs/09-ui-ux.md

# 構造検証
grep -c '^## ' "$F"          # → 10 期待
grep -c '^### 2\.' "$F"      # → 19+ 期待

# 視覚詳細混入禁止（§6.2）
grep -nE '#[0-9a-fA-F]{3,8}\b' "$F" && { echo "HEX 検出"; exit 1; } || true
grep -nE 'oklch\(' "$F" && { echo "oklch 値直書き検出"; exit 1; } || true
grep -nE '\b[0-9]+px\b' "$F" && { echo "px 値直書き検出"; exit 1; } || true
grep -nE '\bbg-\[' "$F" && { echo "Tailwind arbitrary 値検出"; exit 1; } || true

# trace check（§6.4）
# phase-3.md §2 の routes × endpoint × method と新 §2 の API 列を行レベル diff
```

**sanity**: 全 grep gate exit 0、構造検証期待値一致。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook 各 step の expected 失敗（grep 検出 / 行数不一致 / API trace 漏れ） |
| Phase 7 | §8 DoD 各項目を AC として step に紐付け |
| Phase 9 | §6.2 grep gate / markdown lint / link 健全性の自動化 |

## 多角的チェック観点（不変条件参照）

- **#1**: 視覚詳細値（HEX / oklch / px / `bg-[#...]`）が 0 件
- **#5**: 契約上も `apps/web` から D1 binding 記述しない（API 経由のみ）
- **#6**: GAS prototype 由来の振る舞いを §8 で「不採用」明記
- **#7**: dialog / drawer の a11y 契約（role/aria-modal/focus trap/Esc）を §5.2 完全記述
- **prototype 19 行**: §4.5 の 19 行が §2/§3 のいずれかに取り込まれる
- **不採用 4 項目**: §4.6 の 4 項目が §8 に欠落なく記述される
- **login 5 状態**: §4.2 で input/sent/unregistered/deleted/error の 5 状態が漏れなく列挙される

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 既存構造把握 + 章立てスケルトン作成 | 5 | completed | grep -c '^## ' = 10 |
| 2 | §1 位置づけ + 09a〜09h index 表配置 | 5 | completed | 8 行 index |
| 3 | §2 routes 19 個展開（§4.3 template コピペ） | 5 | completed | 同列構成統一 |
| 4 | §3 primitives 13 + feature 29 展開（§4.4 template） | 5 | completed | 同列構成統一 |
| 5 | §4 状態 / §5 a11y / §6 token / §7 Storybook / §8 不採用 / §9 用語集 / §10 改訂 | 5 | completed | 全章記述 |
| 6 | grep gate / 構造検証 / trace check 実行 | 5 | completed | 全 PASS |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `docs/00-getting-started-manual/specs/09-ui-ux.md` | 契約のみ版（300〜420 行） |
| ドキュメント | `outputs/phase-05/main.md` | 実装ランブック総合 |
| メタ | `artifacts.json` | Phase 5 を completed |

## 完了条件

- [ ] §1〜§10 の 10 章すべてに本文がある
- [ ] §2 で 19 routes すべてに contract 表が存在し、列構成が統一されている
- [ ] §3 で 13 primitives + 29 feature components の props 表が存在
- [ ] §4.2 で login 5 状態が列挙されている
- [ ] §5 a11y 契約が dialog / drawer / form / live region すべてカバー
- [ ] §6 で「視覚値の決定権は 09b にある」「HEX 直書き禁止」が明記されている
- [ ] §7 Storybook 正本主義の段落が存在
- [ ] §6.2 grep gate で視覚詳細値 0 件
- [ ] §4.5 の 19 行 prototype 由来契約が漏れなく取り込まれている
- [ ] §4.6 の 4 項目が §8 で「不採用」明記
- [ ] phase-3.md §2 と新 §2 の API 列が完全一致

## タスク 100% 実行確認【必須】

- [ ] 全 6 サブタスク completed
- [ ] `09-ui-ux.md` 書き換え完了
- [ ] outputs/phase-05/main.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 6（異常系検証）
- 引き継ぎ事項: 各 step の expected 失敗 → 異常系一覧
- ブロック条件: grep gate / 構造検証のいずれかが NG

## 実行コマンド

```bash
# 1. 既存と prototype を読む
cat docs/00-getting-started-manual/specs/09-ui-ux.md
cat docs/00-getting-started-manual/claude-design-prototype/primitives.jsx
cat docs/00-getting-started-manual/claude-design-prototype/pages-{public,member,admin}.jsx

# 2. 書き換え（直接編集）
$EDITOR docs/00-getting-started-manual/specs/09-ui-ux.md

# 3. 構造検証
grep -c '^## ' docs/00-getting-started-manual/specs/09-ui-ux.md       # → 10 期待
grep -c '^### 2\.' docs/00-getting-started-manual/specs/09-ui-ux.md   # → 19+ 期待

# 4. 視覚詳細混入チェック
F=docs/00-getting-started-manual/specs/09-ui-ux.md
grep -nE '#[0-9a-fA-F]{3,8}\b' "$F"
grep -nE 'oklch\(' "$F"
grep -nE '\b[0-9]+px\b' "$F"
grep -nE '\bbg-\[' "$F"

# 5. markdown lint
mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09-ui-ux.md || true
```
