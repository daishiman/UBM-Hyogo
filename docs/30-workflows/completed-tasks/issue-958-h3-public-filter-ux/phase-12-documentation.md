# Phase 12 — ドキュメント更新（strict 7 outputs）

## 0. 出力先

`outputs/phase-12/` 配下に以下 7 ファイルを生成済み。

| # | ファイル | status |
|---|---------|--------|
| 1 | `main.md`（Phase 12 summary） | present |
| 2 | `implementation-guide.md`（Part 1 中学生 + Part 2 技術者） | present |
| 3 | `system-spec-update-summary.md` | present |
| 4 | `documentation-changelog.md` | present |
| 5 | `unassigned-task-detection.md` | present |
| 6 | `skill-feedback-report.md` | present |
| 7 | `phase12-task-spec-compliance-check.md` | present |

注意: 本 Phase 12 は **spec_created workflow の正本同期証跡**。実装・runtime screenshot は未実行であり、Phase 11 `present` evidence とは扱わない。

## 1. Task 1: implementation-guide.md

### Part 1（中学生レベル）

- 「公開メンバー一覧に誰も出てこなくなる問題」を「学校の名簿が真っ白に見えるけど実は名前を載せていいか確認中の人が多いだけ」に例える
- 3 Track を「自分の表示状態を確認できるカード」「先生（管理者）が一括で見えるようにする道具」「真っ白でも『壊れていません』と伝える看板」と説明

### Part 2（技術者レベル）

- 各 component の TypeScript interface 完全掲載
- 既存 API 接続図（PATCH /admin/members/:memberId/status、GET /me/profile、GET /public/stats）
- 設定可能定数: `GOOGLE_FORM_RESPONDER_URL`
- error 経路: 部分失敗時の failures[] 表示仕様
- Phase 11 screenshot references（10 件、`screenshots/*.png`）

## 2. Task 2: system-spec-update-summary.md

### Step 1-A: 完了タスク記録

- 関連仕様書: `docs/00-getting-started-manual/specs/00-overview.md`、`13-mvp-auth.md`
- `docs/30-workflows/LOGS.md` 追記
- `.claude/skills/aiworkflow-requirements/LOGS.md` 追記
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` 追記

### Step 1-B: 実装状況テーブル更新

- 親 workflow `google-form-reflection-diagnostics` の H3 系 followup を `completed`

### Step 1-C: 関連タスクテーブル更新

- unassigned-task spec `google-form-reflection-diagnostics-followup-003-h3-public-filter-ux.md` を completed に移動 or リンク更新

### Step 2: システム仕様更新（条件付き）

新規 interface 追加:
- `PublicConsentCalloutProps`
- `BulkRepublishTarget` / `BulkRepublishProgress` / `UseBulkRepublishReturn`
- `AllHiddenFallbackProps`

これらを `docs/00-getting-started-manual/specs/` の該当章に追記（Step 2 該当）。

## 3. Task 3: documentation-changelog.md

`node scripts/generate-documentation-changelog.js` で生成。

## 4. Task 4: unassigned-task-detection.md（0 件でも出力必須）

候補 source:
- 元 unassigned spec のスコープ外（真の bulk endpoint / publicConsent direct toggle）
- Phase 3 MINOR-2（全 page 横断選択）
- Phase 10 §3 残課題

各候補 → no-op 判定根拠 or 新 spec 配置（独立サイクル必要なものは `unassigned-task/` へ）。

## 5. Task 5: skill-feedback-report.md（改善点なしでも必須）

本タスクで得た知見:
- 3 Track 並列実装パターン（独立性高い UX 改修）の汎化候補
- INV-4 を保持した「状態可視化 + CTA 誘導」パターン（mutation 追加せず UX 改善）

→ `.claude/skills/task-specification-creator/lessons-learned/issue-958-spec-created-implementation-ux-boundary.md` に昇格済み。

## 6. Task 6: phase12-task-spec-compliance-check.md

canonical 9 headings 整合・workflow_state parity・Phase 11 evidence 表 present の自己診断。

## 7. same-wave skill sync

Phase 12 と同 wave で以下を同期:
- `.claude/skills/aiworkflow-requirements/`: task-workflow-active / quick-reference / resource-map / artifact-inventory (新規) / LOGS / SKILL-changelog / topic-map
- `.claude/skills/task-specification-creator/`: LOGS / SKILL-changelog / patterns-lessons

実同期結果は `outputs/phase-12/system-spec-update-summary.md` と `outputs/phase-12/phase12-task-spec-compliance-check.md` に記録。

## 8. 完了条件

- [x] strict 7 ファイル列挙
- [x] Task 1-6 内容指針
- [x] same-wave skill sync 一覧
