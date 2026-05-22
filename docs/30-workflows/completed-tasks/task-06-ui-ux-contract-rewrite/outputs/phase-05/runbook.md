# Runbook: 09-ui-ux.md 書き換え

## 前提

- 対象ファイル: `docs/00-getting-started-manual/specs/09-ui-ux.md`
- 旧: 160 行 / 8 章 / 視覚詳細混在
- 新: 396 行 / 10 章 / 契約のみ
- 1 ファイル書き換え（新規作成・削除なし）

## ステップ詳細

### Step 1: 旧 §1 位置づけ / §8 不採用 文言の救出

```bash
git show HEAD:docs/00-getting-started-manual/specs/09-ui-ux.md > /tmp/09-old.md
```

旧 §1 位置づけ文言と §8 不採用文言を新 §1 / §8 で再利用する。

### Step 2: 新 §1 位置づけと正本主義

- 1.1「契約のみ」スコープ宣言（視覚詳細は 09a / token 値は 09b）
- 1.2 09a..09h index 表（8 行 × 3 列: ファイル名 / 内容 / 担当 task）

### Step 3: 新 §2 19 routes 契約一覧（最大ボリューム）

公開 6（`/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms`）/ 会員 2（`/login`, `/profile`）/ 管理 8（`/(admin)/admin`, `members`, `tags`, `meetings`, `schema`, `requests`, `identity-conflicts`, `audit`）/ 共通 4（`error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx`）

各 routes は `### 2.x.y <path>` の H3 + 10 列の表で記述。

### Step 4: 新 §3 component 契約一覧

- §3.1 primitives 13: Button / Card / Badge / Input / Select / Table / Tabs / Sidebar / Toast / Skeleton / DataTable / EmptyState / ErrorState
- §3.2 feature components 29: Hero / Stats / ZoneGuide / Timeline / MemberCard / MemberList / FilterBar / DensityToggle / MemberDetail / VisibilityBanner / VisibilitySummary / RequestPanel / DeleteRequestPanel / KpiGrid / ZoneChart / StatusChart / RecentActions / MembersTable / MemberDrawer / TagsQueue / MeetingsCalendar / MeetingForm / RequestsQueue / RequestDetail / SchemaDiff / ConflictPair / AuditTimeline / AuditFilterBar / LegalProse

### Step 5: 新 §4 状態列挙

- §4.1 ページ標準 5 値（idle / loading / empty / error / success）
- §4.2 login 5 状態（input / sent / unregistered / deleted / error）
- §4.3 申請 server-pending（client から上書き禁止）
- §4.4 prototype 由来契約 19 行 mapping 表
- §4.5 不採用 4 項目（tweaks / photo store / data-theme / gas-prototype）

### Step 6: 新 §5 a11y

- §5.1 全画面共通（landmark / `<h1>` 1 個 / focus-visible）
- §5.2 dialog drawer（`role="dialog"` + `aria-modal="true"` + focus trap + Esc close + scrim click close）
- §5.3 form input（`<label htmlFor>` ↔ `<input id>` / `aria-describedby` / `aria-invalid` / `aria-required`）
- §5.4 live region（`role="status"` / `role="alert"` / Toast Provider）

### Step 7: 新 §6 token 参照規則

- §6.1 決定権委譲（値は 09b 正本）
- §6.2 OKLch CSS 変数経由（HEX 直書き / `bg-[#...]` / `text-[#...]` / oklch() / px 直書き禁止）
- §6.3 prefix 8 種（`--ubm-{color,radius,shadow,space,text,font,dur,ease}-*`）

### Step 8: 新 §7〜§10

- §7 Storybook 正本主義
- §8 不採用画面・パターン
- §9 用語集
- §10 改訂履歴

### Step 9: 検証

```bash
# grep gate
grep -nE '#[0-9a-fA-F]{3,8}\b|oklch\(|\b[0-9]+px\b|bg-\[#|text-\[#' docs/00-getting-started-manual/specs/09-ui-ux.md
# expected: 0 件

# structure check
grep -c '^## ' docs/00-getting-started-manual/specs/09-ui-ux.md   # 10
grep -c '^### 2\.' docs/00-getting-started-manual/specs/09-ui-ux.md  # 20
grep -c '^#### 3\.1\.' docs/00-getting-started-manual/specs/09-ui-ux.md  # 13

# markdown lint
markdownlint docs/00-getting-started-manual/specs/09-ui-ux.md
```

## ロールバック

```bash
git checkout HEAD~1 -- docs/00-getting-started-manual/specs/09-ui-ux.md
```

完全可逆。後続 task は本タスク完了前は未着手のため連鎖影響なし。

## 実行記録

- 実行日: 2026-05-07
- 結果: PASS（grep gate 0 件 / structure 一致 / lint exit 0）
- evidence: `outputs/phase-11/evidence/`
