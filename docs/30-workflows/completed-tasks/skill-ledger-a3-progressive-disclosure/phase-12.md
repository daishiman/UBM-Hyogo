# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SKILL.md の Progressive Disclosure 分割 (skill-ledger A-3) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-28 |
| 前 Phase | 11（手動 smoke） |
| 次 Phase | 13（PR 作成） |
| 状態 | spec_created |
| タスク分類 | docs-only / spec_created / NON_VISUAL（`.claude/skills/` 構造の再編成仕様のみ・コード実装なし） |
| user_approval_required | false |

## 目的

Phase 1〜11 の成果物（分割設計 / 切り出し済み SKILL.md / references 群 / smoke 証跡）を踏まえ、`task-specification-creator` skill の必須 5 タスクに沿って 2 部構成の実装ガイド・仕様書同期サマリー・ドキュメント変更履歴・未タスク検出・skill フィードバックを出力する。本タスクは docs-only / NON_VISUAL のため、`apps/` / `packages/` 実装は無く、Step 2（新規 IF / API / 型追加時）は **不要** と判定する。skill 改修ガイドへの Anchor 追記は domain interface sync ではなく same-wave の再発防止記録として扱い、別 PR に分離する。same-wave sync（LOGS.md ×2 / SKILL.md ×2 / topic-map）と二重 ledger（root + outputs の `artifacts.json`）の同期を必ず通す。

## 依存境界

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Phase 11 smoke PASS | 既知制限・運用知見の引き継ぎ前提 |
| 上流 | Phase 5 切り出し完了 | documentation-changelog の実体根拠 |
| 並列 | 他 skill 改修タスク | LOGS.md / topic-map の競合に注意 |
| 下流 | Phase 13 | documentation-changelog を PR description 草案の根拠に転用 |

## 必須 5 タスク（task-specification-creator skill 準拠）

1. **実装ガイド作成（2 部構成）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新（Step 1-A〜1-G + 条件付き Step 2 判定）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴作成** — `outputs/phase-12/documentation-changelog.md`
4. **未割当タスク検出レポート（0 件でも出力必須）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須）** — `outputs/phase-12/skill-feedback-report.md`

加えて **Phase 12 自身の compliance check** を `outputs/phase-12/phase12-task-spec-compliance-check.md` に出力する。

## 実行タスク

- Task 12-1: 実装ガイド（Part 1 中学生 / Part 2 技術者）を 1 ファイルに統合作成する。
- Task 12-2: system-spec-update-summary を Step 1-A〜1-G + 条件付き Step 2 判定で構造化記述する（A-3 単体では Step 2 = 「新規 IF / API / 型追加なしのため不要」）。
- Task 12-3: documentation-changelog を SKILL.md / references の追加・移動・削除を全リスト化する。
- Task 12-4: unassigned-task-detection を 0 件でも必ず出力する（skill-creator テンプレへの 200 行制約組込み等を記録）。
- Task 12-5: skill-feedback-report を改善点なしでも必ず出力する（task-specification-creator skill 自体の 200 行未満化フィードバックを含む）。
- Task 12-6: phase12-task-spec-compliance-check を実施する。
- Task 12-7: same-wave sync（LOGS.md ×2 / SKILL.md ×2 / topic-map）を完了する。
- Task 12-8: 二重 ledger（root `artifacts.json` と `outputs/artifacts.json`）を同期する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 5 タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-tasks-guide.md | 6 タスク詳細ガイド |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A〜1-G / Step 2 / validation / same-wave sync ルール |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-11/main.md | smoke 結果の引き継ぎ |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-10/go-no-go.md | GO 判定 / 残課題 |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-12/implementation-guide.md | 上位 wave の実装順序・ロールバック |
| 必須 | docs/30-workflows/LOGS.md | task-level LOGS 同期対象 |
| 参考 | docs/30-workflows/completed-tasks/ut-02-d1-wal-mode/phase-12.md | 構造リファレンス |

## 実行手順

### ステップ 1: 実装ガイド作成（Task 12-1 / 2 部構成）

`outputs/phase-12/implementation-guide.md` に以下 2 部を記述する。

**Part 1（中学生レベル / 日常の例え話必須・「たとえば」を最低 1 回明示）**

- 「skill って何？」
  - たとえば、Claude が「料理を作る」「掃除をする」のように **特定の作業を上手にやるためのレシピ集** が skill です。
  - レシピ集の表紙が `SKILL.md`、巻末資料が `references/<topic>.md` です。
- 「entrypoint と references って何？」
  - 表紙（entrypoint）には「このレシピ集で何ができるか」と「目次」だけ書きます（200 行未満）。
  - 巻末資料（references）には「だしの取り方」「煮込み時間」のような **詳しい手順** を分けて書きます。
- 「なぜ分けるの？」
  - 表紙が分厚いと、毎回全部読まないといけなくて疲れます（loader の context 消費）。
  - 友達と同時にレシピを書き換えると、同じ行を編集してケンカ（merge conflict）が起きます。表紙を薄くして資料を分けると、別々の資料を別々の人が直せるので衝突しません。

**Part 2（技術者レベル）**

- skill loader の動作:
  - loader は `SKILL.md` の front matter（`name` / `description` / `trigger` / `allowed-tools`）と Anchors のみを最初にロードする。
  - `references/<topic>.md` は **Progressive Disclosure** で必要時に遅延ロードされる。
- Progressive Disclosure 原則:
  - entry に残置: front matter / 概要 5〜10 行 / trigger / allowed-tools / Anchors / クイックスタート / モード一覧 / agent 導線 / references リンク表 / 最小 workflow。
  - references へ移送: Phase テンプレ / アセット規約 / 品質ゲート / オーケストレーション / 運用ランブック等。
- mirror 同期規約:
  - canonical = `.claude/skills/<skill>/`、mirror = `.agents/skills/<skill>/`。
  - `diff -r` の差分を 0 に保つ。canonical 修正後に必ず mirror へ反映。
- ロールバック手順:
  - 1 PR = 1 skill 分割を厳守し、`git revert <merge-commit>` で skill 単位に戻る設計。
  - skill 改修ガイドへの Anchor 追記は **別 PR** に分離し、本体 revert を独立可能に保つ。

### ステップ 2: システム仕様更新（Task 12-2）

`outputs/phase-12/system-spec-update-summary.md` を Step 1-A〜1-G と Step 2 判定で構造化する。

**Step 1-A: 完了タスク記録 + LOGS.md ×2 + topic-map**

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/30-workflows/LOGS.md` | A-3 (Issue #131) の Phase 1〜13 完了行追記 |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | A-3 影響メモ（references 構造の参考事例） |
| `.claude/skills/task-specification-creator/LOGS.md` | 自 skill が 200 行未満化された旨と影響範囲 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴テーブル（A-3 由来の変更があれば追記） |
| `.claude/skills/task-specification-creator/SKILL.md` | 変更履歴テーブル（自身の分割完了を記録） |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 「Progressive Disclosure / SKILL.md 分割」キーワードへのリンク追加 |

**Step 1-B: 実装状況テーブル更新**

- `docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md` の Phase 状態を `spec_created → completed` に更新（実 PR マージ後）。
- `docs/30-workflows/unassigned-task/` に同名タスクが残っていれば `completed-tasks/` へ移動。

**Step 1-C: 関連タスクテーブル更新**

- A-1（Issue #129）/ A-2（Issue #130）/ B-1 の index.md の「下流 / 関連」テーブルに A-3 完了情報を反映。

**Step 1-D: 上流仕様書差分追記**

- 同一 Wave の `task-conflict-prevention-skill-state-redesign/outputs/phase-7/skill-split-runbook.md` と phase-12 implementation guide に、A-3 で確定した entry 固定セット・mirror diff・旧アンカー追跡の差分を追記するか判定する。
- 追記しない場合は、`system-spec-update-summary.md` に「baseline 留置」または「Wave N+1 別 PR」の理由を残す。

**Step 1-E: indexes / quick-reference 更新**

- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` と `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` に、skill-ledger A-3 の再利用入口を追加するか判定する。
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` / `.claude/skills/aiworkflow-requirements/indexes/keywords.json` は `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` 後の生成物として扱い、手編集と生成物の責務を混ぜない。

**Step 1-F: lessons-learned / task-workflow 同期**

- Progressive Disclosure 分割で得た運用知見を、該当する lessons-learned または task-workflow active/completed へ同期する。
- spec_created の段階では「同期予定」と「実 PR マージ後に completed 化する項目」を分けて記録する。

**Step 1-G: validation**

- `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js`、`node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js`、`node .claude/skills/task-specification-creator/scripts/validate-phase-output.js --task skill-ledger-a3-progressive-disclosure`、`node .claude/skills/task-specification-creator/scripts/verify-all-specs.js` の結果を記録する。
- warning がある場合は baseline/current を分け、A-3 由来の新規 warning だけを blocker として扱う。

**Step 2（条件付き）: 新規インターフェース追加時のみ**

- 本タスクは docs-only / 機械的 cut & paste のみで **新規 TypeScript IF / API / 型は追加しない**。
- そのため Step 2 は **不要**。判断根拠を `documentation-changelog.md` と `system-spec-update-summary.md` に残す。
- skill 改修ガイド（`task-specification-creator/references/`）への「fragment で書け」「200 行を超えたら分割」Anchor 追記は再発防止の docs update であり、Step 2 ではなく PR-N（別 PR）で実施する。

### ステップ 3: ドキュメント更新履歴作成（Task 12-3）

`outputs/phase-12/documentation-changelog.md` に SKILL.md / references の追加・移動・削除を全リスト化する。

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-28 | 新規 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/ | A-3 仕様書 13 Phase + index + artifacts.json |
| 2026-04-28 | 移動 | .claude/skills/task-specification-creator/SKILL.md → references/<topic>.md 群 | 機械的 cut & paste（200 行未満化） |
| 2026-04-28 | 新規 | .claude/skills/task-specification-creator/references/<topic>.md（複数） | Phase テンプレ / アセット規約 / 品質ゲート 等 |
| 2026-04-28 | 移動 | .agents/skills/task-specification-creator/ | canonical → mirror 同期 |
| 2026-04-28 | 同期 | docs/30-workflows/LOGS.md | A-3 完了行追加 |
| 2026-04-28 | 同期 | .claude/skills/task-specification-creator/LOGS.md | 自 skill 分割完了 |
| 2026-04-28 | 同期 | .claude/skills/aiworkflow-requirements/LOGS.md | A-3 参照ログ |
| 2026-04-28 | 同期 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | 「Progressive Disclosure」キーワード追加 |

> 各分割対象 skill ごとに 1 行ずつ「移動 / 新規」を追記する（per-skill PR の根拠）。

### ステップ 4: 未割当タスク検出レポート（Task 12-4 / 0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md` を以下フォーマットで出力する。

| 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- |
| skill-creator テンプレへの「200 行未満」必須項目組込み | 設計 | skill-creator のテンプレ生成時に references/ 受け皿を初期作成 | 別タスク（skill-creator 改修 wave） |
| skill loader doctor スクリプトの提供 | 実作業 | 行数 / リンク / mirror diff の自動 smoke 化 | 後続 wave |
| 旧アンカー名で外部ドキュメントから来ている深いリンクの追跡 | 検証 | 全 docs grep + 旧→新マッピング表作成 | 別タスク（doc-link-audit） |
| `aiworkflow-requirements/references/` 命名規約の標準化 | 設計 | A-3 で得た topic 命名パターンを skill 横断ルール化 | 別タスク（skill-naming-convention） |

> 検出 0 件の場合も「該当なし」セクションを必ず作成する。

### ステップ 5: スキルフィードバックレポート（Task 12-5 / 改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` を以下フォーマットで出力する。

| skill | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | 自 skill の `SKILL.md` が 200 行を超えていたドッグフーディング矛盾を A-3 で解消 | テンプレに「200 行を超えたら分割」Anchor を恒久追記（別 PR で実施） |
| task-specification-creator | Phase 12 タスクガイド自体も Progressive Disclosure 化されており参考事例として有効 | references/phase-12-tasks-guide.md を A-3 のロールモデルとして README に明示 |
| aiworkflow-requirements | 既に references/ 分割済みで、A-3 の範囲外（参考例として良好） | topic-map に A-3 の「Progressive Disclosure」キーワード追加のみ |
| skill-creator | 新規 skill 作成時の 200 行制約が未実装 | skill-creator のテンプレに references/ 受け皿初期化を組み込む（別タスク） |

### ステップ 6: Phase 12 compliance check（Task 12-6 / 必須）

`outputs/phase-12/phase12-task-spec-compliance-check.md` で以下を検証する。

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 5 タスクの成果物が揃っている | 6 ファイル（compliance check 含む） | PASS |
| 実装ガイドが Part 1 / Part 2 構成 | 中学生 / 技術者の 2 部 + 「たとえば」明示 | PASS |
| Step 1-A〜1-G が記述 | 仕様書同期サマリーに含まれる | PASS |
| Step 2 の必要性判定が記録 | A-3 単体では「新規 IF / API / 型追加なしのため不要」と明記 | PASS |
| same-wave sync 完了 | LOGS.md ×2 + SKILL.md ×2 + topic-map | PASS |
| 二重 ledger 同期 | root `artifacts.json` / `outputs/artifacts.json` | PASS |
| validate-phase-output.js | 全 Phase PASS | PASS |
| verify-all-specs.js | 全 spec PASS | PASS |
| docs-only / NON_VISUAL 整合 | `outputs/phase-11/screenshots/` 不在を確認 | PASS |

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| LOGS #1 | .claude/skills/aiworkflow-requirements/LOGS.md | YES |
| LOGS #2 | .claude/skills/task-specification-creator/LOGS.md | YES |
| SKILL #1 | .claude/skills/aiworkflow-requirements/SKILL.md | YES（更新事項あれば） |
| SKILL #2 | .claude/skills/task-specification-creator/SKILL.md | YES（自身の分割完了を変更履歴へ記載） |
| topic-map | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | YES |

> 違反検知: `rg -l 'A-3\|skill-ledger\|Progressive Disclosure'` で 2 LOGS / 2 SKILL / topic-map に同一トピックが揃っているか目視確認。1 つでも欠ければ FAIL。

## 二重 ledger 同期【必須】

- root `artifacts.json`（タスク直下）と `outputs/artifacts.json`（生成物 ledger）を必ず同時更新する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `task.metadata.taskType`。
- 片方のみ更新は禁止（drift の主要原因）。

## docs-only close-out ルール【必須】

- 本タスクは `metadata.taskType = "docs-only"` / `visualEvidence = "NON_VISUAL"` で確定する。
- `apps/` / `packages/` への変更は **入らない** ことを `git status` で確認する（混入していれば即停止）。
- same-wave sync を必ず通し、LOGS / SKILL.md change history / topic-map / 関連タスクテーブル更新を完了させて初めて close-out とする。

## validate / verify スクリプト実行確認

```bash
# Phase 単位の出力スキーマ検証
node scripts/validate-phase-output.js \
  --task skill-ledger-a3-progressive-disclosure

# 全タスク仕様書の整合性検証
node scripts/verify-all-specs.js
```

- 期待: 両方とも exit code 0 / 全 PASS。

## 多角的チェック観点

- 価値性: 実装ガイド Part 1 が非エンジニアでも「skill / entrypoint / references」の関係を理解できるか。
- 実現性: documentation-changelog が per-skill PR 計画（Phase 13）と 1:1 対応するか。
- 整合性: same-wave sync の 2 LOGS / 2 SKILL / topic-map が最新コミットで一致しているか。
- 運用性: unassigned-task-detection の委譲先タスクが実在 wave / 別タスク化を含むか。
- ドッグフーディング: skill-feedback-report に `task-specification-creator` 自身の 200 行未満化フィードバックが含まれているか。
- Secret hygiene: docs-only のため Secret 取扱いなし（混入していないことを grep 確認）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 実装ガイド Part 1（中学生） | 12 | spec_created | 「たとえば」明示 |
| 2 | 実装ガイド Part 2（技術者） | 12 | spec_created | loader / Progressive Disclosure / mirror / rollback |
| 3 | system-spec-update-summary | 12 | spec_created | Step 1-A〜1-G + Step 2 判定（不要） |
| 4 | documentation-changelog | 12 | spec_created | SKILL.md / references 全リスト |
| 5 | unassigned-task-detection | 12 | spec_created | 0 件でも出力 |
| 6 | skill-feedback-report | 12 | spec_created | 改善点なしでも出力 |
| 7 | phase12-compliance-check | 12 | spec_created | 全 PASS |
| 8 | same-wave sync (LOGS×2 / SKILL×2 / topic-map) | 12 | spec_created | 必須 |
| 9 | 二重 ledger 同期 | 12 | spec_created | root + outputs |
| 10 | validate / verify スクリプト | 12 | spec_created | exit 0 |

## 成果物（必須 6 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生） + Part 2（技術者） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A〜1-G + 条件付き Step 2 判定 |
| 履歴 | outputs/phase-12/documentation-changelog.md | SKILL.md / references の追加・移動・削除 |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 0 件でも必須 |
| FB | outputs/phase-12/skill-feedback-report.md | 改善点なしでも必須 |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | 全 PASS が PR 前提 |
| メタ | artifacts.json (root) | Phase 12 状態の更新 |
| メタ | outputs/artifacts.json | 生成物 ledger 同期 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 必須 6 ファイルが `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1 / Part 2 構成で、Part 1 に「たとえば」を最低 1 回含む日常の例え話がある
- [ ] system-spec-update-summary に Step 1-A〜1-G / Step 2 判定（A-3 では「新規 IF / API / 型追加なしのため不要」）が明記
- [ ] documentation-changelog に SKILL.md / references の追加・移動・削除が網羅
- [ ] unassigned-task-detection が 0 件でも出力されている（skill-creator テンプレ等）
- [ ] skill-feedback-report に `task-specification-creator` 自身の 200 行未満化フィードバックが含まれている
- [ ] phase12-task-spec-compliance-check の全項目が PASS
- [ ] same-wave sync（LOGS ×2 / SKILL ×2 + topic-map）が完了
- [ ] 二重 ledger（root + outputs の `artifacts.json`）が同期
- [ ] `validate-phase-output.js` / `verify-all-specs.js` が exit code 0
- [ ] docs-only / NON_VISUAL 整合（`apps/` / `packages/` 混入なし、`screenshots/` 不在）

## タスク 100% 実行確認【必須】

- 全実行タスク（10 件）が `spec_created`
- 必須 6 成果物が `outputs/phase-12/` に配置される設計になっている
- docs-only タスクの close-out ルール（実コード混入なし / same-wave sync 完了）が遵守されている
- Step 2 が不要であること、skill 改修ガイドへの Anchor 追記は Step 1 系の再発防止 docs update として別 PR 化されることが明記
- artifacts.json の `phases[11].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 13（PR 作成）
- 引き継ぎ事項:
  - documentation-changelog の per-skill 行 → Phase 13 の per-skill PR 計画（PR-1〜PR-N）の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - skill-feedback-report の Anchor 追記項目 → Phase 13 の PR-N（別 PR）で実施
- ブロック条件:
  - 必須 6 ファイルのいずれかが欠落
  - same-wave sync が未完了（LOGS ×2 / SKILL ×2 / topic-map）
  - 二重 ledger に drift がある
  - validate / verify スクリプトが FAIL
  - `apps/` / `packages/` への変更が混入している（docs-only 違反）
