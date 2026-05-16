# Phase 12: ドキュメント生成・未タスク検出

## メタ情報

- **タスク**: parallel-08-shared-foundation-admin-ui-foundation
- **Phase**: 12 / 13
- **[実装区分: 実装仕様書]**
- **判定根拠**: 本タスクは `apps/web` 配下に 3 新規 + 4 編集の code/test 差分を持つ。docs-only ではないため、code 差分と implementation-guide のドリフト 0 監査が必要。
- **workflow_state 遷移**: `spec_created` から `implemented_local_evidence_captured` への昇格は Phase 11 evidence と Phase 12 strict 7 が揃った後にのみ行う。commit / push / PR は Phase 13 のユーザー承認後まで実行しない。

---

## 目的

Phase 12 strict 7 ファイルを生成し、`apps/` / `packages/` 配下の dirty diff を最終監査する。
中学生レベル（Part 1）と技術者レベル（Part 2）の二層 implementation-guide を提供し、code 差分とのドリフト 0 を保証する。

---

## 実行タスク（Phase 12 strict 7）

1. `outputs/phase-12/main.md`
   - Phase 12 の総合結果、strict 7 の実体確認、Phase 11 evidence の参照、workflow_state 判定を記録。
2. `outputs/phase-12/implementation-guide.md`
   - **Part 1（中学生レベル）**: 「admin 画面の共通の土台を整える話。トースト（小さい通知）と、書き込み（変更）を扱う共通の道具と、エラー画面と、ログイン確認の見張りを、admin 画面全体で同じものを使えるようにそろえる」
   - **Part 2（技術者レベル）**: ToastProvider root wrap、`useAdminMutation` 型契約宣言、`ToastProvider` context value memo 化、`(admin)/admin/error.tsx` 既存確認、middleware guard 既存確認。API error inventory と parser compatibility 境界。
3. `outputs/phase-12/system-spec-update-summary.md`
   - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` / `indexes/quick-reference.md` / `references/task-workflow-active.md` への登録要否を実測し、更新した場合は path と差分を記録。更新不要の場合も Step 2 N/A の 3 点根拠を記録。
4. `outputs/phase-12/documentation-changelog.md`
   - ソース spec の `apps/web/app/(admin)/error.tsx` 表記を `apps/web/app/(admin)/admin/error.tsx` に訂正した旨を記録。
   - 実コード差分（`layout.tsx` / `Toast.tsx` / hooks 2 件 / hook contract spec 1 件 / static invariant 1 件 / toast behavior spec 1 件）を同一 wave で反映した旨を記録。
5. `outputs/phase-12/unassigned-task-detection.md`
   - serial-05/step-01..07 で本 type 契約に依存するコードが import を更新するか確認するチェックリスト（0 件でも本 file は必須）。
6. `outputs/phase-12/skill-feedback-report.md`（3 観点必須）
   - テンプレ観点: phase テンプレが NON_VISUAL タスクで Phase 11 evidence 5 点セットを過不足なく扱えたか
   - ワークフロー観点: parallel-08 が parallel-01..07 と独立しつつ serial-05/step-01 への前提として機能したか
   - ドキュメント観点: spec.md の path 表記揺れを早期検出できる仕組みの提案
   - 改善なしでも本 file は必須
7. `outputs/phase-12/phase12-task-spec-compliance-check.md`
   - Phase 12 strict 7 path existence pre-check（下記）+ Phase 12 canonical heading SSOT 遵守確認

---

## Phase 12 strict 7 path existence pre-check

| # | path | 期待 |
|---|------|------|
| 1 | outputs/phase-12/main.md | exists |
| 2 | outputs/phase-12/implementation-guide.md | exists |
| 3 | outputs/phase-12/system-spec-update-summary.md | exists |
| 4 | outputs/phase-12/documentation-changelog.md | exists |
| 5 | outputs/phase-12/unassigned-task-detection.md | exists |
| 6 | outputs/phase-12/skill-feedback-report.md | exists |
| 7 | outputs/phase-12/phase12-task-spec-compliance-check.md | exists |

Phase 11 evidence は別ゲートとして以下 6 件を参照する。Phase 12 strict 7 の代替にはしない。

| # | path | 期待 |
|---|------|------|
| E1 | outputs/phase-11/evidence/typecheck.log | exists |
| E2 | outputs/phase-11/evidence/lint.log | exists |
| E3 | outputs/phase-11/evidence/test.log | exists |
| E4 | outputs/phase-11/evidence/build.log | exists |
| E5 | outputs/phase-11/evidence/grep-gate.log | exists |
| E6 | outputs/phase-11/main.md | exists |

---

## 実行手順

### Step 1: code 差分監査（apps/ / packages/ dirty diff）

```bash
git status --porcelain apps packages
git diff --name-only dev...HEAD -- apps packages
```

期待される apps/web 差分:
- `apps/web/app/layout.tsx`
- `apps/web/src/components/ui/Toast.tsx`
- `apps/web/src/features/admin/hooks/useAdminMutation.ts`
- `apps/web/src/features/admin/hooks/index.ts`
- `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`
- `apps/web/src/__tests__/static-invariants.runtime.spec.ts`
- `apps/web/src/components/ui/__tests__/primitives.component.spec.tsx`

それ以外が現れた場合は scope creep として Phase 10 に差し戻し。

### Step 2: implementation-guide 作成

Part 1（中学生レベル）と Part 2（技術者レベル）を `outputs/phase-12/implementation-guide.md` 内に明確な heading で分離。

### Step 3: 残り 5 ドキュメント生成

上記タスク 2〜6 の各 markdown を生成。0 件でも file は必須。

### Step 4: drift 監査（code ↔ implementation-guide）

implementation-guide の Part 2 で記述した「変更ファイル」「型シグネチャ」「API contract」が実 diff と完全一致するか目視 + grep で確認。

### Step 5: pre-check 実行

```bash
for p in \
  outputs/phase-12/main.md \
  outputs/phase-12/implementation-guide.md \
  outputs/phase-12/system-spec-update-summary.md \
  outputs/phase-12/documentation-changelog.md \
  outputs/phase-12/unassigned-task-detection.md \
  outputs/phase-12/skill-feedback-report.md \
  outputs/phase-12/phase12-task-spec-compliance-check.md
do
  test -f "docs/30-workflows/parallel-08-shared-foundation-admin-ui-foundation/$p" \
    && echo "OK: $p" || echo "MISSING: $p"
done
```

すべて OK であること。

---

## 多角的チェック観点（AI が判断）

- **strict 7 全件**: 0 件でも file 必須を遵守
- **Phase 12 canonical heading SSOT**: 見出し体系を逸脱しない
- **drift**: code 差分 ↔ implementation-guide Part 2 が 1:1
- **workflow_state**: root / index / compliance check の語彙が `spec_created` / `runtime_pending` / `implemented_local_evidence_captured` の境界を混同しない
- **scope creep**: apps/ / packages/ dirty diff が上記 7 ファイルに収まる

---

## サブタスク管理

| No | サブタスク | 完了条件 |
|----|-----------|---------|
| 12-1 | apps/ packages/ dirty diff 監査 | 7 ファイルのみ |
| 12-2 | main.md | Phase 12 総合結果 + state 判定 |
| 12-3 | implementation-guide (Part 1+2) | 中学生 + 技術者 二層完備 |
| 12-4 | system-spec-update-summary | aiworkflow 同期要否を実測記録 |
| 12-5 | documentation-changelog | spec 表記揺れ + 実コード差分記録 |
| 12-6 | unassigned-task-detection | 0 件でも file 必須 |
| 12-7 | skill-feedback-report | 3 観点記載 |
| 12-8 | phase12-task-spec-compliance-check | strict 7 path pre-check OK |

---

## 成果物

- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/main.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

---

## 完了条件

- [ ] Phase 12 strict 7 ファイルすべて生成
- [ ] Phase 12 strict 7 path existence pre-check すべて OK
- [ ] code ↔ implementation-guide drift 0
- [ ] apps/ packages/ dirty diff が想定 7 ファイルのみ
- [ ] workflow_state 語彙が root / index / compliance check で整合

---

## タスク 100% 実行確認【必須】

- [ ] strict 7 + Phase 11 evidence 参照 gate 完遂
- [ ] 未完項目があれば再着手
- [ ] CONST_007 遵守

---

## 次 Phase

Phase 13: PR 作成（base `dev`、ユーザー明示承認後のみ実行）。
