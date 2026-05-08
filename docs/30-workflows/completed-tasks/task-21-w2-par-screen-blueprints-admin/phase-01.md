# Phase 01: 要件定義（task-21-w2-par-screen-blueprints-admin）

[実装区分: ドキュメントのみ]

> 判定根拠注記: 成果物は `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` の新規作成のみで、コード変更を一切伴わない pure docs タスクのため、CONST_004 の例外条件に該当する。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-21-w2-par-screen-blueprints-admin` |
| Phase | 01 / 13（要件定義） |
| 推定工数 | 0.10 人日（全体 1.0 人日のうち 10%） |
| 依存 Phase | なし（最初の Phase） |
| 並列性 | 不可（後続 Phase 02 以降の前提） |
| タスク種別 | `docs-only`（specs/09g-screen-blueprints-admin.md 新規作成のみ・コード変更ゼロ） |
| visualEvidence | `NON_VISUAL`（docs walkthrough で代替） |
| 改訂日 | 2026-05-07 |

---

## 0. 自己完結コンテキスト

### 0.1 上位ゴール

UI prototype alignment / MVP recovery ワークフロー全体の上位ゴールは、UBM 兵庫支部会メンバーサイトの **全 19 routes** を OKLch トークン正本のもとで稼働させること。本タスク（task-21）はその管理層 8 routes + AdminSidebar 共通 = 計 9 セクションの blueprint を `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`（新規 700〜1200 行）に確定することが単一責務である。

### 0.2 本 Phase の責務

Phase 01 は **要件定義**。task-21 が満たすべき AC（受入基準）の番号付け、ユビキタス言語の確定、admin 8 routes + Sidebar 共通の数値固定、JSX 一字一句転記原則・視覚値 0 件原則・派生ルール準拠原則の文言確定を行う。コード差分・実装手順・章立て詳細には踏み込まない。

### 0.3 本 Phase の出力

本 Phase そのものは仕様書ファイル `phase-01.md`（本ファイル）の確定が成果物。task-21 全体の実成果物（09g-screen-blueprints-admin.md 本体）は Phase 05 以降で生成する手順を Phase 04 で計画する。

---

## 1. 目的

task-21 は admin 8 routes（dashboard / members / tags / meetings / schema / requests / identity-conflicts / audit）+ AdminSidebar 共通の計 9 セクションを 09g に確定する **管理層 blueprint task**。Phase 01 ではこの 9 セクション要件を「AC（acceptance criteria）」として番号付けし、後続 Phase が参照可能な形で固定する。

---

## 2. ゴール / 非ゴール

### 2.1 ゴール（AC）

- **AC-1**: task-21 source spec §2.1 の G-01〜G-06 が phase-01 §6 と完全一致して再列挙される。
- **AC-2**: admin 8 routes + Sidebar 共通 = 9 セクションが phase-01 内で固定され、後続 Phase で参照可能。
- **AC-3**: ユビキタス言語（「AdminSidebar」「bulk-action」「queue resolve」「schema alias apply」「admin queue」「admin compare」「admin timeline」「派生ルール」）が定義される。
- **AC-4**: タスク種別が `docs-only` / `NON_VISUAL` であることが明記される（Phase 11 evidence テンプレ分岐の根拠）。
- **AC-5**: 上流ブロッカー（task-01 完了 1 件のみ）が明示される。
- **AC-6**: 視覚値（HEX / oklch / px / `bg-[#...]`）spec 内 0 件原則を明記。
- **AC-7**: 未掲載 4 画面（meetings / requests / identity-conflicts / audit）が phase-3 §3 §5.3〜§5.7 派生ルール準拠であることを明記。

### 2.2 非ゴール

- 設計レベルの章立て詳細（Phase 03 で扱う）
- 09g 本体の執筆（Phase 05 で扱う）
- 実装コード（task-15 / task-16 / task-17 の責務）
- token 値（task-08）/ primitive 仕様（task-19）/ 公開・会員画面（task-20）/ shell・fixtures（task-22）

---

## 3. 入力（このフェーズで読むもの）

| 入力 | パス | 用途 |
|------|------|------|
| task-21 仕様書本体 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-21-w2-par-screen-blueprints-admin.md` | AC・対象ファイル・章立て・派生ルールの正本 |
| 上位 phase-1 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1/phase-1.md` §3 | admin 8 routes 確定根拠 |
| 上位 phase-3 | `outputs/phase-3/phase-3.md` §2 §3 §5.3〜§5.7 | API 表・派生ルール正本 |
| プロトタイプ pages-admin.jsx | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L1-L658 | 転記元（凍結正本） |
| CLAUDE.md | リポジトリ root | 不変条件 1〜7（特に #5 D1 直接アクセス禁止） |

---

## 4. 出力（このフェーズで作るもの）

- 本ファイル `phase-01.md`（要件定義の確定）
- AC-1〜AC-7（番号付き受入基準）
- ユビキタス言語表（§5）

> 本 Phase ではコード差分・docs 差分は生成しない。差分文面の確定は Phase 05 以降で行う。

---

## 5. ユビキタス言語（このタスク確定定義）

| 用語 | 定義 |
|------|------|
| AdminSidebar | admin layout 共通の左 nav。本仕様 §1 に集約し、各画面 §X からは「§1 参照」リンクで参照する。重複記述禁止 |
| bulk-action | DataTable 行選択 → 一括操作（approve / reject 等）。confirm Modal 必須 |
| queue resolve | tags queue / requests queue の確認済み解決または却下。confirm Modal 必須 |
| schema alias apply | schema diff の alias 候補を dryRun 確認後に適用する admin 専用操作。**二段確認**（dryRun diff 表示 → aliases apply confirm） |
| admin queue | phase-3 §3 §5.3 派生パターン。左 list + 右 detail で承認/却下を行う |
| admin compare | phase-3 §3 §5.6 派生パターン。2-column compare で resolve する |
| admin timeline | phase-3 §3 §5.7 派生パターン。TimelineList + AuditFilterBar |
| 派生ルール | phase-3 §3 §5.3〜§5.7 で定義された未掲載画面用の primitive 組合せルール。新規 primitive 生成禁止 |
| 一字一句転記 | プロトタイプ JSX の見出し / button label / placeholder / confirm dialog 文言を 1 文字も改変せず spec に転記すること |

---

## 6. 受入基準（AC 詳細）

| ID | 内容 | 検証 Phase |
|----|------|-----------|
| AC-1 | task-21 source §2.1 の G-01〜G-06 が phase-01 / phase-09 で再列挙され同一文言を維持 | Phase 09 |
| AC-2 | admin 9 セクション内訳が Sidebar 1 + dashboard + members + tags + meetings + schema + requests + identity-conflicts + audit で固定 | Phase 02 |
| AC-3 | ユビキタス言語 9 項目が phase-01 §5 に表として存在 | Phase 03 |
| AC-4 | `docs-only` / `NON_VISUAL` のタスク種別がメタ情報に明記 | Phase 11 |
| AC-5 | 上流ブロッカー 1 件（task-01 完了）であることが明示 | Phase 03 |
| AC-6 | 視覚値（HEX / oklch / px / `bg-[#...]`）spec 内 0 件原則が phase-01 §5 / Phase 07 grep 検証で固定 | Phase 07 |
| AC-7 | 未掲載 4 画面（meetings / requests / identity-conflicts / audit）が phase-3 §3 §5.3〜§5.7 派生ルール準拠の旨を明記 | Phase 03 |

---

## 7. 完了条件（Phase 02 へ進む gate）

- [ ] phase-01.md が本テンプレで配置済み
- [ ] AC-1〜AC-7 が番号付きで本文に存在
- [ ] ユビキタス言語表が確定
- [ ] admin 9 セクション内訳が固定（Sidebar 1 + 8 routes）
- [ ] task-21 source §2.1 の G-01〜G-06 と本 phase の AC-1 が integrity を保つ
- [ ] 視覚値 0 件原則 / 未掲載 4 画面の派生ルール準拠原則が明記されている

---

## 8. プロトタイプ参照表（必須）

| 影響画面 | prototype ファイル | 行範囲 | コンポーネント |
|---------|------------------|--------|---------------|
| AdminDashboardPage | `pages-admin.jsx` | L4-L161 | KpiGrid / ZoneChart / StatusChart / RecentActions |
| AdminMembersPage | `pages-admin.jsx` | L162-L368 | DataTable / MemberDrawer (PATCH) |
| AdminTagsPage | `pages-admin.jsx` | L369-L507 | TagsQueue (左 list + 右 detail) / queue resolve confirm |
| SchemaDiffPage | `pages-admin.jsx` | L508-L657 | SchemaDiff (2 column) / apply confirm |
| AdminLayout / Sidebar | `pages-admin.jsx` | （sidebar 部分） | AdminSidebar 8 nav 項目 |
| 未掲載: meetings | phase-3 §3 §5.4 | — | MeetingsCalendar / MeetingForm（CRUD 派生） |
| 未掲載: requests | phase-3 §3 §5.3 | — | RequestsQueue / RequestDetail（queue 派生） |
| 未掲載: identity-conflicts | phase-3 §3 §5.6 | — | ConflictPair compare / resolve（compare 派生） |
| 未掲載: audit | phase-3 §3 §5.7 | — | AuditTimeline / AuditFilterBar（timeline 派生） |

---

## 9. リスク / 注意

| リスク | 影響 | 緩和 |
|-------|------|------|
| admin 9 セクション数値の drift（後続 Phase で 8 / 10 と書かれる） | 章立て崩壊 | 各 phase §2 で Sidebar 1 + 8 routes = 9 を再検算 |
| `docs-only` 判定漏れによる Phase 11 で screenshot 強制 | false fail | メタ情報に `NON_VISUAL` 明記 + Phase 11 で再判定 |
| AC-1 と task-21 source §2.1 の文言ドリフト | DoD 不整合 | Phase 09 レビューで grep 照合 |
| 未掲載 4 画面で新規 primitive を生やす逸脱 | 09c 仕様崩壊 | AC-7 + Phase 03 §3 §5.3〜§5.7 派生ルール準拠を明記 |

---

## 10. 次 Phase への引き渡し

Phase 02（スコープ確定）は本 phase の AC-2（9 セクション固定）と AC-7（派生ルール準拠）を入力として、含む / 含まない / 前提 / 制約を表形式で固定する。

## 実行タスク

- 本 phase 本文に記載済みのタスクを実行し、task-21 admin blueprint の正本化に必要な判断・検証・成果物を閉じる。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| 親タスク仕様 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-21-w2-par-screen-blueprints-admin.md` | 09g 新規作成の要求 |
| プロトタイプ正本 | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` | 凍結 658 行 |
| 派生ルール正本 | `outputs/phase-3/phase-3.md` §3 §5.3〜§5.7 | 未掲載 4 画面の根拠 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| phase specification | `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/phase-01.md` | 本 phase の仕様書 |
| 最終成果物（後続 Phase 05） | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | task-21 の実成果物（700〜1200 行） |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] task-21 source §2.1 G-01〜G-06 と矛盾していない。
- [ ] 後続 task-15 / 16 / 17 の参照基盤を壊していない。

## 目的

- task-21 admin blueprint 要件定義を skill 準拠で前進させ、09g 正本作成の前提を確定する。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。代替として Phase 07 grep 検証 / Phase 08 link integrity / Phase 11 docs walkthrough を統合証跡とする。
