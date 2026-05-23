# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

> 目的: strict 7 files（`main.md` + 必須 6 補助成果物）を生成し、システム仕様 / 未タスク / フィードバックを **same wave で** 完了させる。FB-04 / FB-Feedback-2 / FB-VISUAL-CAP-001 を遵守。

---

## 1. Phase 12 strict 7 files

| # | 出力 | 必須 |
|---|------|------|
| 0 | `outputs/phase-12/main.md`（Phase 12 本体 summary / 7 files 実体確認） | ✅ |
| 1 | `outputs/phase-12/implementation-guide.md`（Part 1 + Part 2） | ✅ |
| 2 | `outputs/phase-12/system-spec-update-summary.md`（Step 1-A〜1-C + Step 2 判定） | ✅ |
| 3 | `outputs/phase-12/documentation-changelog.md` | ✅ |
| 4 | `outputs/phase-12/unassigned-task-detection.md`（0 件でも出力） | ✅ |
| 5 | `outputs/phase-12/skill-feedback-report.md`（改善点なしでも出力） | ✅ |
| 6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | ✅ |

## 2. 必須 6 タスク

| Task | 出力 | 必須 |
|------|------|-----|
| 12-1 | `outputs/phase-12/implementation-guide.md`（Part 1 + Part 2） | ✅ |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md`（Step 1-A〜1-C + Step 2 判定） | ✅ |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | ✅ |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md`（0 件でも出力） | ✅ |
| 12-5 | `outputs/phase-12/skill-feedback-report.md`（改善点なしでも出力） | ✅ |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | ✅ |

---

## 3. Task 12-1: 実装ガイド（2 パート構成）

### Part 1（中学生レベル / 概念説明）

「会員の管理を一人の事務員が紙のノートでやっていたのを、デジタルの一覧表とまとめ操作ができる画面に置き換えました」程度の例え話で、**なぜ** 必要かを先に書く。専門用語禁止（出てきたら即座に補足）。

トピック:
- 「ダッシュボード」とは何か（家計簿アプリのトップ画面の例え）
- 「会員管理テーブル」の意味（学校の出席簿の例え）
- 「一括操作」が何を解決するか（手で 1 人ずつチェックする手間）
- 「公開・非公開」の意味（プロフィールが他の会員から見えるか）

### Part 2（開発者レベル / 技術詳細）

- インターフェース: `AdminDashboardView`, `AdminMemberListView`, `AdminMemberDetailView`
- API シグネチャ: `fetchAdmin<T>()`, `patchMemberStatus()`, `deleteMember()`, `restoreMember()`
- 使用例（`apps/web/app/(admin)/admin/*.tsx` の SSR フェッチ + MembersClientShell の controlled state）
- エラーハンドリング: `if (!res.ok) throw new Error(...)`、Drawer の error branch
- 設定可能パラメータ: `pageSize=50` 固定 / sort / filter / zone
- 視覚証跡: `## 視覚証跡` セクションに Phase 11 screenshot 9 枚への references を canonical 名で記載

---

## 4. Task 12-2: システム仕様更新

### Step 1-A: タスク完了記録

更新ファイル（**same wave で 5 ファイル同期** — FB-04）:
1. `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` — task-15 を実行状態に応じて `implemented-local` / `IMPLEMENTED_LOCAL_RUNTIME_PENDING` へ同期
2. `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `indexes/resource-map.md` — task-15 current workflow 導線を追加
3. `.claude/skills/aiworkflow-requirements/references/workflow-task-15-admin-dashboard-and-members-artifact-inventory.md` — artifact inventory を新規作成
4. `.claude/skills/aiworkflow-requirements/changelog/20260510-task-15-admin-dashboard-and-members.md` と `LOGS/_legacy.md` — close-out sync（現行 skill は fragment + `_legacy` 運用）
5. `.claude/skills/task-specification-creator/LOGS/_legacy.md` — same（`LOGS.md` が無い場合は `_legacy` へ記録）
6. `docs/30-workflows/task-15-admin-dashboard-and-members/index.md` — Phase status 更新
7. backlog ledger / completed ledger があれば更新

### Step 1-B: 実装状況テーブル更新

`/admin` `/admin/members` `(admin)/layout.tsx` を「未実装 → 完了」へ。

### Step 1-C: 関連タスクテーブル更新

task-09 / task-10 / task-13 / task-16 / task-17 / task-18 のステータス再確認。

### Step 2: ドメイン仕様更新（条件付き）

判定: **Step 2 必要**（理由: `AdminDashboardView` は shared schema を変更しないが、web local の dashboard UI mapper と `/admin` / `/admin/members` の公開 UI contract を正本仕様へ反映するため）

更新先候補:
- `docs/00-getting-started-manual/specs/11-admin-management.md` に `byZone` / `byStatus` UI optional の説明を追記
- `apps/web/src/lib/admin/*` の `fetchAdmin<T>()` / mutation helper 公開 surface を spec に明記

---

## 5. Task 12-3: documentation-changelog.md

Step 1-A / 1-B / 1-C / Step 2 の **各結果を個別に記録**（「該当なし」も明記）。workflow-local 同期と global skill sync を **別ブロック** で記録（FB-BEFORE-QUIT-003）。

---

## 6. Task 12-4: 未タスク検出（0 件でも出力）

Phase 10 §3 で棚卸した残課題から:

| ID | 内容 | 状態 | 配置先 |
|----|------|------|--------|
| U-01 | `/admin/dashboard` API への `byZone` / `byStatus` 集計フィールド追加 | new | `docs/30-workflows/unassigned-task/` |
| U-02 | CSV export 実装 | new | 同上 |
| U-03 | task-17 audit page 完成後の RecentActions filter 反映 | depends-on-task-17 | 同上 |
| U-04 | Drawer focus trap 最小実装の永続検証 | conditional | 同上 |

`unassigned-task-detection.md` テンプレに **関連タスク差分確認** セクションを設け、既存タスクとの重複チェック（FB-CANCEL-004-2）。

---

## 7. Task 12-5: skill-feedback-report.md

| 観点 | 内容 |
|------|------|
| テンプレート改善 | 検出した曖昧さ（あれば） |
| ワークフロー改善 | 並列実行で詰まった箇所（あれば） |
| ドキュメント改善 | 横断ガイドライン化候補（あれば） |

「改善点なし」の場合も「改善点なし」と明記して出力（必須）。

---

## 8. Task 12-6: phase12-task-spec-compliance-check.md

`assets/phase12-task-spec-compliance-template.md` 相当のチェックリストを root evidence として残す。

確認項目:
- [ ] strict 7 files すべて存在
- [ ] `artifacts.json` と `outputs/artifacts.json` の parity
- [ ] `implementation-guide.md` 内の identifier（`fetchAdmin`, `patchMemberStatus`, `MembersClientShell` 等）が現行コードと一致（grep 確認 — FB-W1-02b-3）
- [ ] Phase 11 screenshot 名 4 か所一致確認
- [ ] index 再生成: `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js`（FB-UT-W3）

---

## 9. close-out parity 確認（FB-04 / FB-Feedback-5）

```bash
# 5 ファイル same wave 同期確認
node scripts/validate-phase-output.js --phase 12
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js

# artifacts parity
diff <(jq -S . docs/30-workflows/task-15-admin-dashboard-and-members/artifacts.json) \
     <(jq -S . docs/30-workflows/task-15-admin-dashboard-and-members/outputs/artifacts.json)
```

---

## 10. 完了条件（DoD）

- [ ] strict 7 files すべて生成（0 件でも出力）
- [ ] §3 same wave 同期完了
- [ ] §8 parity 確認 success
- [ ] `index.md` の Phase 1-12 が `completed`、Phase 13 が `blocked`（user 承認待ち）
- [ ] 実行後に `artifacts.json` の `phase12.status` を `completed` へ更新（仕様書作成時点は `spec_created`）
