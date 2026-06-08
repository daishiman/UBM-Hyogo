# Documentation Changelog（issue-1119-member-tags-referential-integrity-guard）

> **status: implemented_local** / NON_VISUAL / 2026-06-06
> Step 1-A / 1-B / 1-C / Step 2 を個別に該当・非該当で明記する。

---

## 本 wave で作成・更新したドキュメント（implemented_local）

| ファイル | 種別 | 内容 |
|----------|------|------|
| `phase-1.md` 〜 `phase-13.md`（root） | 新規 | 要件 / 設計 / テスト / 実装 / close-out の仕様書一式 |
| `outputs/phase-1/` 〜 `outputs/phase-7/` | 新規 | 各 Phase 成果物 |
| `outputs/phase-12/main.md` | 新規 | 変更サマリ + Gate evidence |
| `outputs/phase-12/implementation-guide.md` | 新規 | Part 1（中学生向け）+ Part 2（技術者向け） |
| `outputs/phase-12/system-spec-update-summary.md` | 新規 | Step 1 / Step 2 判定 |
| `outputs/phase-12/documentation-changelog.md` | 新規 | 本ファイル |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 | 未タスク検出（baseline 候補 2 件） |
| `outputs/phase-12/skill-feedback-report.md` | 新規 | skill フィードバック |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 | canonical 9 見出しコンプライアンス（PASS） |
| `artifacts.json`（root / outputs） | 新規 | workflow メタ・Gate-A passed |

---

## system-spec-update Step 別の更新明細

### Step 1-A — `docs/00-getting-started-manual/specs/` 更新

**非該当。** D1 schema / API schema / Google Form 仕様の変更なし。migration 追加なし。
`08-free-database.md` の member_tags / tag_definitions 定義は不変。

### Step 1-B — `references/api-endpoints.md` 新 endpoint 登録

**該当（本レビューで反映済み）。** `GET /admin/tags/orphans`（read-only 監査）を `api-endpoints.md` へ登録済み。

### Step 1-C — index / resource-map / quick-reference / task-workflow-active 登録

**該当（本レビューで反映済み）。** issue-1119 workflow を skill 索引へ登録済み。
本レビューで aiworkflow-requirements の workflow 索引へ反映済み。

### Step 2 — 新規インターフェース（公開関数 / 型 / endpoint）登録

**該当。** `detectOrphanMemberTags` / `countOrphanMemberTags`（read 関数 2）+ `OrphanMemberTag` 型 +
`GET /admin/tags/orphans`（endpoint 1）。詳細は `system-spec-update-summary.md` を正本とする。
implemented_local 時点で実 SSOT 反映済み。

---

## 反映タイミングまとめ

| Step | 該当 | implemented_local 時点の状態 | 実反映タイミング |
|------|------|------------------------|------------------|
| Step 1-A | 非該当 | 更新なし | — |
| Step 1-B | 該当 | 未反映（仕様確定） | 実装着地と同 wave |
| Step 1-C | 該当 | 未反映（仕様確定） | 実装着地と同 wave |
| Step 2 | 該当 | 未反映（仕様確定） | 実装着地と同 wave |

> 実コード変更・commit・push・PR・実 SSOT 反映はすべて user-gated（後続）。
