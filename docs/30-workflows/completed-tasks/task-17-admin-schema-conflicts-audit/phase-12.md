# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

## 必須 6 タスク + strict 7 outputs (Phase 12 canonical)

Phase 12 の実行単位は Task 12-1〜12-6 だが、`outputs/phase-12/` の必須ファイルは **main.md + 6 補助 = strict 7** で固定する。1 件でも欠落する場合は `phase12-task-spec-compliance-check.md` を FAIL とし、PASS 単独表記は禁止する。

### Task 12-1: 実装ガイド作成 (Part 1 + Part 2)

`outputs/phase-12/implementation-guide.md` を 2 パート構成で作成:

- **Part 1 (中学生レベル)** — 「Google Form の質問項目が変わったら、どの質問が "結婚式の引き出物" の質問か覚えておくキー (= stableKey) を割り当てる作業画面」など、日常の例え話で説明。専門用語ゼロ。なぜ → 何をする の順。
- **Part 2 (技術者レベル)** — TypeScript 型定義 (`AdminSchemaView`, `ConflictPair`, `AuditEvent`)、API シグネチャ (`fetchAdminSchema()` 等)、エラーコード (`ASSIGN_NOT_AVAILABLE`, `SCHEMA_APPLY_CONFLICT`, `ALREADY_RESOLVED`)、edge case (不在 endpoint, JST 換算境界, 422 / 409 path)、設定可能パラメータ (date 上限 / pageSize clamp)。

VISUAL_ON_EXECUTION タスクなので、実装実行時に Phase 11 screenshot reference (`admin-schema-default.png` 等) と `phase11-capture-metadata.json` の参照を必ず明記する。

### Task 12-2: システム仕様書更新

`outputs/phase-12/system-spec-update-summary.md`:

- **Step 1-A**: 仕様作成記録 — `docs/00-getting-started-manual/specs/11-admin-management.md` は現行 `/admin/schema /admin/identity-conflicts /admin/audit` 契約の参照先として維持し、実装完了とは書かない。LOGS.md / changelog / aiworkflow indexes を同波更新。
- **Step 1-B**: 実装状況テーブルは `spec_created / implementation / VISUAL_ON_EXECUTION / contract_ready_implementation_pending` として記録する。runtime evidence 未取得の `completed` は禁止。
- **Step 1-C**: 関連タスクテーブル (本 task / task-15 / task-16 / task-18) のステータス更新。
- **Step 2 (条件付き)**: 新規インターフェース追加 = なし (既存 endpoint 接続のみ) なので **N/A**。

### Task 12-3: documentation-changelog.md

`outputs/phase-12/documentation-changelog.md`:

- workflow-local 同期と global skill sync を別ブロックで記録 (FB-BEFORE-QUIT-003)
- Step 1-A / 1-B / 1-C / Step 2 (N/A) の結果を個別に明記

### Task 12-4: 未タスク検出 (0 件でも出力必須)

`outputs/phase-12/unassigned-task-detection.md`:

ソース確認:
- 元仕様 §1.2 「非ゴール」リスト (CSV export, 3 件以上 merge, dry-run, syntax highlight)
- Phase 3/10 の MINOR 指摘
- Phase 11 の HIGH 重大度発見
- コード TODO/FIXME
- `describe.skip` 残存 testid

候補例 (実装後に確定):
- CSV export 対応 (元 §1.2 非ゴール)
- 3 件以上同時 merge (元 §1.2 非ゴール)
- schema apply の dry-run preview (元 §1.2 非ゴール)
- `actorEmail` autocomplete (UX 改善余地、Phase 11 で発見想定)

「関連タスク差分確認」セクションを設け、既存 task との重複チェックを実施 (FB-CANCEL-004-2)。

### Task 12-5: skill-feedback-report (改善点なしでも出力必須)

`outputs/phase-12/skill-feedback-report.md`:

- テンプレート改善 / ワークフロー改善 / ドキュメント改善 の 3 観点で記録
- 該当なしでも空欄は許容しない (「特になし」と明記)

### Task 12-6: phase12-task-spec-compliance-check

`outputs/phase-12/phase12-task-spec-compliance-check.md`:

- Phase 1 で記録した受入条件 G-01〜G-09 が `implementation-guide.md` で説明されているか cross-check
- callback 名 / props 名 / type 名が実コードと grep 一致 (FB-W1-02b-3)
- artifacts.json と outputs/artifacts.json の parity 確認 (UT-W3)

## チェックリスト (Phase 12 によくある漏れ)

- [ ] Step 1-C を実行した
- [ ] topic-map.md が更新された
- [ ] documentation-changelog.md が完全 (全 Step を記録)
- [ ] system-spec-update-summary.md が作成された
- [ ] LOGS.md 2 ファイル更新 (workflow + skill 側)
- [ ] artifacts.json と outputs/artifacts.json が一致 (`spec_created` + `phase13 blocked_pending_user_approval`)
- [ ] task-workflow.md の未タスクリンクが参照切れなし
- [ ] outputs/phase-12 の strict 7 ファイルが揃った (`main.md` + 6 補助)
- [ ] `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` を実行 (UT-W3 stale 防止)
- [ ] artifacts canonical 名と phase spec の名前が照合済み (Feedback 2)
- [ ] Phase 1 で記録したタスク分類 (UI task / VISUAL) を Phase 11 で再確認した (Feedback 3)
- [ ] `complete-phase.js` で Phase status を更新する場合も root workflow_state は実装完了まで `spec_created` を維持した (Feedback TASK-UI-04)

## 実行コマンド

```bash
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
# 注意: 2026-05-10 時点の task-specification-creator generate-index.js は
# `phase-01.md` naming を認識せず `Phase files found: 0/13` の index を生成する。
# 実行した場合は index.md を目視確認し、破壊的な generic index になれば復元する。
```

## DoD

- [ ] outputs/phase-12 に strict 7 ファイルすべて存在
- [ ] artifacts.json `metadata.workflow_state = spec_created`、`phase13 blocked_pending_user_approval`
- [ ] LOGS.md 2 ファイル更新
- [ ] topic-map / 関連 spec 整合
