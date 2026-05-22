# Phase 04: 実装計画（task-21-w2-par-screen-blueprints-admin）

[実装区分: ドキュメントのみ]

> 判定根拠注記: 成果物は `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` の新規作成のみで、コード変更を一切伴わない pure docs タスクのため、CONST_004 の例外条件に該当する。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-21-w2-par-screen-blueprints-admin` |
| Phase | 04 / 13（実装計画） |
| 推定工数 | 0.05 人日 |
| 依存 Phase | Phase 01 / 02 / 03 |
| 並列性 | 不可（Phase 05 実装の前提） |
| タスク種別 | `docs-only` / `NON_VISUAL` |
| 改訂日 | 2026-05-07 |

---

## 0. 自己完結コンテキスト

### 0.1 上位ゴール

Phase 03 で凍結した章立て（§1〜§9 + §99）を **執筆手順に分解**し、Phase 05 が機械的に進められる「ステップごとの作業内容・成果物・チェック項目」を確定する。

### 0.2 本 Phase の責務

Phase 04 は **実装計画**。1 ステップ = 1 セクションの粒度で 09g 執筆手順を分解する。各ステップの input（参照する prototype 行範囲 / phase-3 派生節）/ output（09g §X）/ DoD（X.1〜X.8 完了）を明示する。

### 0.3 本 Phase の出力

本ファイル `phase-04.md`（実装計画手順）の確定。

---

## 1. 目的

09g 執筆を 10 ステップ（§1 → §2 → §3 → §4 → §5 → §6 → §7 → §8 → §9 → §99）に分解し、Phase 05 で順次実行可能にする。

---

## 2. 執筆手順（10 ステップ）

### Step 1: §1 AdminSidebar（共通）

| 項目 | 内容 |
|------|------|
| input | `pages-admin.jsx` の AdminLayout 内 sidebar 部分 |
| output | 09g §1.1〜§1.4 |
| 作業 | (1) AdminLayout の sidebar JSX 一字一句転記 (2) nav 8 項目表（Phase 03 §3.2）転記 (3) `aria-current="page"` / focus ring 記述 (4) primitive 09c §9 / icon 09d / token 名参照 |
| DoD | §1.1 jsx code block 1 件 / §1.2 nav 表 8 行 / §1.3 a11y 記述 / §1.4 link 3 種（primitive / icon / token） |

### Step 2: §2 dashboard（プロトタイプ掲載）

| 項目 | 内容 |
|------|------|
| input | `pages-admin.jsx` L4-L161（AdminDashboardPage） |
| output | 09g §2.1〜§2.8 |
| 作業 | (1) §2.1 prototype 由来説明 (2) §2.2 KPI 見出し / button label 抽出 (3) §2.3 mermaid（idle→loading→success/empty/error） (4) §2.4 `GET /admin/dashboard` (5) §2.5 props（KpiGrid / ZoneChart / StatusChart / RecentActions） (6) §2.6 a11y（KPI live region） (7) §2.7 ナビ操作 (8) §2.8 link |
| DoD | 8 サブセクション全埋め / §2.1 行範囲 L4-L161 明記 |

### Step 3: §3 members（プロトタイプ掲載）

| 項目 | 内容 |
|------|------|
| input | `pages-admin.jsx` L162-L368（AdminMembersPage） |
| output | 09g §3.1〜§3.8 |
| 作業 | (1) §3.1 jsx 一字一句 (2) §3.2 検索 placeholder / DataTable 列名 / Drawer 文言 (3) §3.3 mermaid + drawer state (4) §3.4 `GET /admin/members` / `PATCH /admin/members/:id` (5) §3.5 props（DataTable / MemberDrawer） (6) §3.6 行選択 keyboard / Drawer focus trap (7) §3.7 bulk-action confirm Modal 手順 (8) §3.8 link |
| DoD | bulk-action confirm Modal が §3.6 a11y / §3.7 操作手順の双方に明記 |

### Step 4: §4 tags（プロトタイプ掲載）

| 項目 | 内容 |
|------|------|
| input | `pages-admin.jsx` L369-L507（AdminTagsPage） |
| output | 09g §4.1〜§4.8 |
| 作業 | (1) §4.1 prototype 由来説明 (2) §4.2 queue header / resolve button label / confirm dialog 文言 (3) §4.3 mermaid + confirming state (4) §4.4 `GET /admin/tags/queue` / `POST /admin/tags/queue/:queueId/resolve` (5) §4.5 props（TagsQueue 左 list 右 detail） (6) §4.6 confirm Modal a11y (7) §4.7 queue resolve 操作 4 ステップ (8) §4.8 link |
| DoD | confirm Modal `role="dialog"` + `aria-modal="true"` + focus trap + Esc close が §4.6 に明記 |

### Step 5: §5 meetings（派生 / phase-3 §5.4 admin CRUD）

| 項目 | 内容 |
|------|------|
| input | `outputs/phase-3/phase-3.md` §3 §5.4 |
| output | 09g §5.1〜§5.8 |
| 作業 | (1) §5.1 冒頭に `> 派生元: phase-3 §3 §5.4` + 派生ルール正本転記 (2) §5.2 派生由来の見出し / button label (3) §5.3 mermaid（CRUD 状態） (4) §5.4 `GET /admin/meetings` / `POST /admin/meetings` (5) §5.5 props（MeetingsCalendar / MeetingForm） (6) §5.6 Form Modal a11y (7) §5.7 create/edit 操作 (8) §5.8 link |
| DoD | 新規 primitive ゼロ / 09c 組合せのみ |

### Step 6: §6 schema（プロトタイプ掲載・二段確認）

| 項目 | 内容 |
|------|------|
| input | `pages-admin.jsx` L508-L657（SchemaDiffPage） |
| output | 09g §6.1〜§6.8 |
| 作業 | (1) §6.1 prototype 由来説明 (2) §6.2 diff column header / apply button label / 二段 confirm dialog 文言 (3) §6.3 mermaid（dryRun → apply confirm → accepted の **二段確認**追加） (4) §6.4 `GET /admin/schema/diff` / `POST /admin/schema/aliases` (5) §6.5 props（SchemaDiff 2 column） (6) §6.6 二段 Modal a11y (7) §6.7 二段確認操作 5 ステップ（diff 取得→表示→dry-run→confirm Modal→aliases API） (8) §6.8 link |
| DoD | 二段確認が §6.3 mermaid / §6.7 操作手順の双方に明記 |

### Step 7: §7 requests（派生 / phase-3 §5.3 admin queue）

| 項目 | 内容 |
|------|------|
| input | `outputs/phase-3/phase-3.md` §3 §5.3 |
| output | 09g §7.1〜§7.8 |
| 作業 | (1) §7.1 冒頭に `> 派生元: phase-3 §3 §5.3` + 派生ルール正本転記 (2) §7.2 派生由来の queue 見出し / resolve button label (3) §7.3 mermaid + confirming (4) §7.4 `GET /admin/requests` / `POST /admin/requests/:noteId/resolve` (5) §7.5 props（RequestsQueue / RequestDetail） (6) §7.6 confirm Modal a11y (7) §7.7 request resolve 4 ステップ (8) §7.8 link |
| DoD | 新規 primitive ゼロ / queue パターンが §4 tags と整合 |

### Step 8: §8 identity-conflicts（派生 / phase-3 §5.6 admin compare）

| 項目 | 内容 |
|------|------|
| input | `outputs/phase-3/phase-3.md` §3 §5.6 |
| output | 09g §8.1〜§8.8 |
| 作業 | (1) §8.1 冒頭に `> 派生元: phase-3 §3 §5.6` + 派生ルール正本転記 (2) §8.2 派生由来の compare header / merge / dismiss button label (3) §8.3 mermaid + merging / dismissing (4) §8.4 `GET /admin/identity-conflicts` / `POST /admin/identity-conflicts/:id/merge` / `POST /admin/identity-conflicts/:id/dismiss` (5) §8.5 props（ConflictPair） (6) §8.6 a11y (7) §8.7 merge / dismiss 操作 (8) §8.8 link |
| DoD | 2-column compare 構成 / 新規 primitive ゼロ |

### Step 9: §9 audit（派生 / phase-3 §5.7 admin timeline）

| 項目 | 内容 |
|------|------|
| input | `outputs/phase-3/phase-3.md` §3 §5.7 |
| output | 09g §9.1〜§9.8 |
| 作業 | (1) §9.1 冒頭に `> 派生元: phase-3 §3 §5.7` + 派生ルール正本転記 (2) §9.2 派生由来 (3) §9.3 mermaid (4) §9.4 `GET /admin/audit` (5) §9.5 props（AuditTimeline / AuditFilterBar） (6) §9.6 a11y (7) §9.7 filter 操作 (8) §9.8 link |
| DoD | TimelineList + FilterBar 構成 / 新規 primitive ゼロ |

### Step 10: §99 不採用要素

| 項目 | 内容 |
|------|------|
| input | Phase 03 §6 |
| output | 09g §99 |
| 作業 | TweaksPanel / theme switcher / data-theme の 3 件を理由付きで列挙 |
| DoD | 3 件の表が完成 |

---

## 3. 並列実行不可性

各ステップは前ステップに依存しないが、§1 Sidebar への参照ルール（Phase 03 §3.3）の整合性を保つため、**§1 を最初に確定**してから §2〜§9 を執筆する。§99 は最後。

---

## 4. ステップごとの予想行数

| ステップ | § | 想定行数 |
|---------|---|---------|
| 1 | §1 Sidebar | 60〜100 |
| 2 | §2 dashboard | 80〜120 |
| 3 | §3 members | 100〜150 |
| 4 | §4 tags | 100〜150 |
| 5 | §5 meetings（派生） | 70〜110 |
| 6 | §6 schema（二段確認） | 100〜150 |
| 7 | §7 requests（派生） | 70〜110 |
| 8 | §8 conflicts（派生） | 70〜110 |
| 9 | §9 audit（派生） | 60〜100 |
| 10 | §99 | 20〜40 |
| **合計** | — | **730〜1140**（700〜1200 範囲内） |

---

## 5. プロトタイプ参照表

Phase 03 §8 と同一（重複記載省略 / `phase-03.md` §8 参照）。

---

## 6. リスク / 注意

| リスク | 緩和 |
|-------|------|
| §1 を後回しにし他 § で Sidebar JSX 重複混入 | Step 1 を最優先 |
| 派生 4 画面のステップで phase-3 派生ルール正本を確認せず推測で書く | 各派生ステップ冒頭で `outputs/phase-3/phase-3.md` を実読 |
| API 表ステップでの current admin API contract と drift | Step 完了時に endpoint grep gate（Phase 07 で再検証） |

---

## 7. 完了条件（Phase 05 へ進む gate）

- [ ] 10 ステップ全てに input / output / 作業 / DoD が存在
- [ ] §1 を Step 1 とする順序が確定
- [ ] §X.1〜§X.8 全 8 サブセクションが各 Step DoD に出現
- [ ] 行数合計 730〜1140 が 700〜1200 範囲内
- [ ] 派生 4 ステップで phase-3 §3 §5.x の参照が明記

---

## 8. 次 Phase への引き渡し

Phase 05（実装）は本 Phase の 10 ステップを順次実行し、09g 本体（700〜1200 行）を生成する。各ステップ DoD を満たさない場合は Phase 05 内でループ修正する。

## 実行タスク

- 09g 執筆を 10 ステップに分解し、各 Step の input / output / DoD を確定する。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| Phase 03 | `phase-03.md` | 章立て / 8 サブ § 構成 / 派生ルール |
| プロトタイプ | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` | Step 1〜4, 6 の input |
| 派生ルール正本 | `outputs/phase-3/phase-3.md` §3 §5.3〜§5.7 | Step 5, 7, 8, 9 の input |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| phase specification | `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/phase-04.md` | 本 phase の仕様書 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] Phase 03 章立て（§1..9 + §99）と Step 1..10 が一対一対応。
- [ ] 行数合計が 700〜1200 範囲内。

## 目的

- 09g 執筆手順を 10 ステップに分解し、Phase 05 実装が機械的に進む状態を確立する。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。Phase 07 grep / Phase 08 link integrity を代替証跡とする。
