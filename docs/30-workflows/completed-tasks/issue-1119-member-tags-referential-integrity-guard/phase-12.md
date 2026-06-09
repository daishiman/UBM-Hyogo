# Phase 12 — ドキュメント更新

> **[実装区分: 実装仕様書]**（CONST_004・コード変更を伴う）。
> **本 Phase は実装サイクル（Phase 4-11）完了後に `outputs/phase-12/` を物理作成・更新する close-out 手順である。**
> 現状は `status: implemented_local`。`outputs/phase-12/` 配下の canonical 7 成果物は、
> 本サイクルの実装・検証結果に基づく close-out 証跡として更新済み。

---

## 0. implemented_local 段階の取り扱い（重要）

本 workflow は `workflow_state: implemented_local`（GitHub Issue #1119 は CLOSED 維持・reopen しない）。
本 Phase 12 の canonical 7 成果物は、Phase 1-11 仕様書一式・実コード変更・focused verification が完了したことを示す **implemented_local close-out 証跡**として作成する。
commit・push・PR・deploy・実 D1 クエリ実行は user-gated であり、本 Phase では実施しない。

- **NON_VISUAL**: backend repository（read 関数 2）+ admin read-only endpoint 1 のみ。UI レンダリング変更ゼロ。
- Phase 11 スクリーンショットは不要。代替証跡として `outputs/phase-10/final-review-result.md`（最終レビュー）と `outputs/phase-11/manual-test-result.md`（自動テスト結果サマリ）を参照する。

---

## 1. Phase 12 必須成果物（canonical 7）と作成方針

`outputs/phase-12/` 配下へ以下 7 ファイルを作成・更新する。

```
outputs/phase-12/
  main.md                                # 変更サマリ + Gate evidence（必須）
  implementation-guide.md                # Part1（中学生向け）+ Part2（技術者向け）（必須）
  system-spec-update-summary.md          # Step 1-A〜1-C + Step 2 判定（必須）
  documentation-changelog.md             # ドキュメント変更履歴（必須）
  unassigned-task-detection.md           # 未タスク検出（必須・0 件でも出力）
  skill-feedback-report.md               # skill フィードバック（必須・改善なしでも出力）
  phase12-task-spec-compliance-check.md  # canonical 9 見出しコンプライアンスチェック（必須）
```

---

## 2. Task 12-1〜12-6 概要

| Task | 対象成果物 | 概要 | implemented_local 時の扱い |
|------|-----------|------|----------------------|
| 12-1 | `main.md` | 変更サマリ（repository read 関数 2 + endpoint 1 + spec 一式）と Gate-A passed 参照を記録 | 仕様確定済みとして記述 |
| 12-2 | `implementation-guide.md` | Part 1（孤児タグの概念を中学生レベルで説明）+ Part 2（型定義・SQL・API 仕様・責務分離） | 仕様確定済みとして記述 |
| 12-3 | `system-spec-update-summary.md` | aiworkflow-requirements 正本更新の Step 1 / Step 2 判定 | Step 2（新規 read 関数 2 + endpoint 1）該当を記録 |
| 12-4 | `documentation-changelog.md` | Step 1-A / 1-B / 1-C / Step 2 を個別に該当・非該当で明記 | 実装済み更新範囲を記録 |
| 12-5 | `unassigned-task-detection.md` | 未タスク検出（current / baseline 分離・0 件でも出力） | 候補 2 件を baseline に記録 |
| 12-6 | `skill-feedback-report.md` + `phase12-task-spec-compliance-check.md` | skill フィードバック + canonical 9 見出しコンプライアンス（総合判定 PASS） | implemented_local 分岐で記述 |

---

## 3. system-spec-update Step 1-A〜1-C 判定（N/A にせず implemented_local として記録）

> **方針**: Step 1-A〜1-C は「N/A」で潰さず、implemented_local 段階での該当 / 非該当を明示的に記録する。

| Step | 内容 | 本タスクでの判定（implemented_local） |
|------|------|----------------------------------|
| Step 1-A | 既存 system spec（`docs/00-getting-started-manual/specs/`）の更新 | **非該当**。D1 schema / API schema / Google Form 仕様の変更なし（migration 追加なし・read 関数と read-only endpoint の追加のみ）。`08-free-database.md` の member_tags 定義は不変。 |
| Step 1-B | aiworkflow-requirements `references/api-endpoints.md` への新 endpoint 登録 | **該当（本レビューで反映済み）**。`GET /admin/tags/orphans`（read-only 監査 surface）を登録済み。 |
| Step 1-C | aiworkflow-requirements の index / resource-map / quick-reference / task-workflow-active への workflow 登録 | **該当（本レビューで反映済み）**。issue-1119 workflow を skill 索引へ登録済み。 |
| Step 2 | 新規インターフェース（公開関数 / 型 / endpoint）の SSOT 登録 | **該当**。`detectOrphanMemberTags` / `countOrphanMemberTags`（read 関数 2）+ `OrphanMemberTag` 型 + `GET /admin/tags/orphans`（endpoint 1）。詳細は `system-spec-update-summary.md`。 |

---

## 4. Gate evidence

| Gate | status | evidence | 備考 |
|------|--------|----------|------|
| Gate-A | passed | `outputs/phase-12/main.md` | implemented_local: Phase 1-13 仕様書一式、apps/api 実装、focused tests/typecheck/lint、Phase 12 strict 7 完了 |

---

## 完了条件（Phase 12）

- [x] Task 12-1〜12-6 の概要と対象成果物を記述
- [x] implemented_local close-out ルールに準拠（commit・PR・deploy・実 D1 query は user-gated と明記）
- [x] Step 1-A / 1-B / 1-C を N/A にせず implemented_local として該当 / 非該当を記録
- [x] Step 2（新規インターフェース）該当を記録
- [x] NON_VISUAL の Phase 11 代替証跡（phase-10 / phase-11）参照方針を明記
- [x] 出力: canonical 7 成果物（`outputs/phase-12/` 配下）
