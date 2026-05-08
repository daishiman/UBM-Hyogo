# Phase 02: スコープ確定（task-21-w2-par-screen-blueprints-admin）

[実装区分: ドキュメントのみ]

> 判定根拠注記: 成果物は `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` の新規作成のみで、コード変更を一切伴わない pure docs タスクのため、CONST_004 の例外条件に該当する。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-21-w2-par-screen-blueprints-admin` |
| Phase | 02 / 13（スコープ確定） |
| 推定工数 | 0.05 人日 |
| 依存 Phase | Phase 01 |
| 並列性 | 不可（Phase 03 設計の前提） |
| タスク種別 | `docs-only` / `NON_VISUAL` |
| 改訂日 | 2026-05-07 |

---

## 0. 自己完結コンテキスト

### 0.1 上位ゴール

09g（admin 9 セクション blueprint）の作成範囲を「含む / 含まない / 前提 / 制約」で固定し、Phase 03 設計と Phase 05 実装の境界を一意に確定する。

### 0.2 本 Phase の責務

Phase 02 は **スコープ確定**。Phase 01 で定めた AC-2（9 セクション固定）/ AC-7（派生ルール準拠）を表形式で具象化し、後続 Phase が「何を書く / 何を書かない」で迷わない状態に閉じる。

### 0.3 本 Phase の出力

本 Phase そのものは仕様書ファイル `phase-02.md`（本ファイル）の確定が成果物。

---

## 1. 目的

task-21 のスコープ境界を Phase 03 設計着手前に明文化する。

---

## 2. 含む / 含まない

### 2.1 含む（IN-SCOPE）

| # | 項目 | 根拠 |
|---|------|------|
| IN-01 | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` の新規作成（700〜1200 行） | task-21 source §3 |
| IN-02 | §1 AdminSidebar 共通セクション（重複なし・1 箇所集約） | source §0.7 / §4.3 |
| IN-03 | §2 dashboard（AdminDashboardPage L4-L161 一字一句転記） | source §0.6 |
| IN-04 | §3 members（AdminMembersPage L162-L368 一字一句転記） | source §0.6 |
| IN-05 | §4 tags（AdminTagsPage L369-L507 一字一句転記） | source §0.6 |
| IN-06 | §5 meetings（phase-3 §3 §5.4 派生 / CRUD パターン） | source §4.5 |
| IN-07 | §6 schema（SchemaDiffPage L508-L657 一字一句転記 / 二段確認 apply） | source §0.6 / §0.5 |
| IN-08 | §7 requests（phase-3 §3 §5.3 派生 / queue パターン） | source §4.5 |
| IN-09 | §8 identity-conflicts（phase-3 §3 §5.6 派生 / compare パターン） | source §4.5 |
| IN-10 | §9 audit（phase-3 §3 §5.7 派生 / timeline パターン） | source §4.5 |
| IN-11 | §99 不採用要素（TweaksPanel / theme switcher / data-theme） | source §4.6 |
| IN-12 | 各画面 §X.1〜§X.8（prototype 由来 / コピー原文 / 状態遷移 mermaid / API 表 / props・state / a11y / 操作手順 / 参照） | source §4.2 |

### 2.2 含まない（OUT-OF-SCOPE）

| # | 項目 | 担当 |
|---|------|------|
| OUT-01 | apps/web 実装（admin layout / pages） | task-15 / 16 / 17 |
| OUT-02 | apps/api 実装（admin endpoint） | 既存（変更禁止） |
| OUT-03 | OKLch token 値の確定 | task-08（09b） |
| OUT-04 | primitive 仕様 | task-19（09c） |
| OUT-05 | icon 仕様 | task-22（09d） |
| OUT-06 | 公開層 / 会員層 blueprint | task-20（09e / 09f） |
| OUT-07 | shell / fixtures | task-22（09h） |
| OUT-08 | 09a mapping 表本体 | task-07（09a） |
| OUT-09 | 09-ui-ux.md 契約 | task-06 |
| OUT-10 | pages-admin.jsx の改変 | 凍結（不変条件 #1） |

---

## 3. 前提条件

| # | 前提 | 確認方法 |
|---|------|---------|
| PRE-01 | task-01 完了（SCOPE.md / CLAUDE.md / specs/00-overview.md に scope gate 確定済） | `git log` / SCOPE.md 存在確認 |
| PRE-02 | pages-admin.jsx が 658 行で凍結 | `wc -l docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` |
| PRE-03 | outputs/phase-3/phase-3.md §2 §3 §5.3〜§5.7 が確定 | ファイル存在 + §確認 |
| PRE-04 | 09g-screen-blueprints-admin.md が未存在（新規作成） | `test ! -f docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` |

---

## 4. 制約

| # | 制約 | 根拠 |
|---|------|------|
| C-01 | pages-admin.jsx の改変禁止（凍結正本） | source §0.5 #1 |
| C-02 | コピー文言は **一字一句**（見出し / button label / placeholder / confirm dialog 文言）。JSX 内の視覚値 literal は token 名へ正規化 | source §0.5 #2 |
| C-03 | 視覚値（HEX / oklch / px / `bg-[#...]`）を spec 内に **0 件**含めない | source §0.5 #3 |
| C-04 | apps/web から D1 直接アクセス禁止（CLAUDE.md 不変条件 #5） | CLAUDE.md |
| C-05 | AdminSidebar は §1 集約・各画面で重複禁止 | source §0.5 #5 |
| C-06 | bulk-action / queue resolve confirm Modal 必須（`role="dialog"` + `aria-modal="true"` + focus trap + Esc close）を §X.6 a11y に記述 | source §0.5 #6 |
| C-07 | schema alias apply は二段確認（dryRun diff 表示 → aliases apply confirm） | source §0.5 #7 |
| C-08 | 未掲載 4 画面で新規 primitive 生成禁止（09c 組合せのみ） | source §0.5 #8 |
| C-09 | API 表は aiworkflow-requirements current admin API contract と一致 | source §6.3 |
| C-10 | 各画面 §X.8 で 09a / 09b / 09c / 09d への link を必ず記述 | source §8 DoD 末尾 |

---

## 5. 数値固定（再検算）

| 項目 | 値 |
|------|-----|
| admin routes | 8 |
| Sidebar 共通セクション | 1 |
| §99 不採用 | 1 |
| **合計セクション** | **管理 blueprint 9（Sidebar 1 + routes 8） + §99 不採用 1 = 10** |
| プロトタイプ掲載画面 | 4（dashboard / members / tags / schema） |
| プロトタイプ未掲載画面（派生） | 4（meetings / requests / identity-conflicts / audit） |
| pages-admin.jsx 行数 | 658（凍結） |
| 09g 想定行数 | 700〜1200 |
| 各画面サブセクション | 8（X.1〜X.8） |

---

## 6. NO-GO 条件

以下のいずれかが満たされた場合、Phase 03 へ進めない:

- [ ] 9 セクション内訳が phase-01 / phase-02 で不一致
- [ ] OUT-01〜OUT-10 と IN-01〜IN-12 に重複・矛盾
- [ ] PRE-01〜PRE-04 のいずれか NG
- [ ] C-01〜C-10 のいずれか文言が phase-01 / source と不整合

---

## 7. 完了条件（Phase 03 へ進む gate）

- [ ] IN / OUT 表が確定（IN-01..12 / OUT-01..10）
- [ ] 前提条件 4 件全て PASS
- [ ] 制約 10 件が phase-01 ユビキタス言語と整合
- [ ] 数値固定（9 セクション / 658 行 / 700〜1200 行）が再検算済
- [ ] NO-GO 条件全て NO

---

## 8. プロトタイプ参照表

| 影響画面 | prototype | 行範囲 | スコープ判定 |
|---------|----------|--------|-------------|
| dashboard | pages-admin.jsx | L4-L161 | IN-03 |
| members | pages-admin.jsx | L162-L368 | IN-04 |
| tags | pages-admin.jsx | L369-L507 | IN-05 |
| schema | pages-admin.jsx | L508-L657 | IN-07 |
| AdminLayout / Sidebar | pages-admin.jsx | sidebar 部分 | IN-02 |
| meetings | phase-3 §3 §5.4 | 派生 | IN-06 |
| requests | phase-3 §3 §5.3 | 派生 | IN-08 |
| identity-conflicts | phase-3 §3 §5.6 | 派生 | IN-09 |
| audit | phase-3 §3 §5.7 | 派生 | IN-10 |

---

## 9. リスク / 注意

| リスク | 緩和 |
|-------|------|
| OUT-XX に書き忘れた範囲を Phase 05 で書いてしまう | Phase 03 設計で IN-XX のみ章立て化 |
| pages-admin.jsx 行範囲の解釈ぶれ | source §0.6 行範囲を Phase 03 に転記 |
| 未掲載 4 画面の派生解釈ぶれ | C-08 + Phase 03 §5 派生表で再固定 |

---

## 10. 次 Phase への引き渡し

Phase 03（設計）は IN-01〜IN-12 を章立てに変換する。OUT-01〜OUT-10 は章立てから除外、C-01〜C-10 は §冒頭の「不変条件」節に転記する。

## 実行タスク

- IN / OUT / 前提 / 制約 / 数値固定を表で具象化し、Phase 03 設計の入力を確定する。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| 親タスク仕様 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-21-w2-par-screen-blueprints-admin.md` | source §2 ゴール |
| Phase 01 | `phase-01.md` | AC-1..7 |
| プロトタイプ | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` | 凍結正本 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| phase specification | `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/phase-02.md` | 本 phase の仕様書 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] Phase 01 の AC-2 / AC-7 と矛盾していない。
- [ ] Phase 03 への入力が一意に確定している。

## 目的

- task-21 admin blueprint のスコープ境界を確定し、Phase 03 章立て設計の前提を一意化する。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。Phase 07 grep / Phase 08 link integrity を代替証跡とする。
