# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-GOV-001 second-stage contexts reapply（task-utgov001-second-stage-reapply-001） |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-30 |
| 前 Phase | 11 (手動 smoke / 検証) |
| 次 Phase | 13 (PR 作成 / 後追い再 PUT 実行ゲート) |
| 状態 | spec_created |
| タスク分類 | implementation / governance / NON_VISUAL |
| taskType | implementation |
| docsOnly | false |
| visualEvidence | NON_VISUAL |
| user_approval_required | false（Phase 13 で true） |
| Issue | #202 (CLOSED — 仕様書化のみ。再オープンしない) |
| タスク状態 | spec_created（仕様書作成済 / 実装着手前） |

## 目的

Phase 1〜11 で確定した後追い再 PUT 設計（UT-GOV-004 由来 contexts 抽出 / dev / main 別 payload / 独立 PUT / 適用前後 GET / drift 検査 / rollback 経路 / admin block 回避 / Secret hygiene）を、運用ドキュメント・正本仕様（`.claude/skills/aiworkflow-requirements/references/`）・LOGS / resource-map・GitHub Issue #202（CLOSED のまま）に反映し、task-specification-creator skill の **必須 5 タスク** + same-wave sync ルール + 二重 ledger 同期を完了させる。

本タスクは **implementation / NON_VISUAL** であり、UI を伴わない GitHub REST API 操作（GET / PUT）のみが実体となる。Phase 12 自体は実 PUT を含まない（実 PUT は Phase 13 のユーザー承認ゲート後に実行する）。aiworkflow-requirements references / CLAUDE.md / deployment-branch-strategy.md への実反映は別タスクで起票し、本タスク完了時の状態は `spec_created` のまま据え置く（Phase 12 で `completed` に書き換えない）。

## 本 Phase でトレースする AC

- AC-13（Phase 13 はユーザー承認なしに実 PUT・push・PR 作成を行わない原則の再確認）
- AC-14（aiworkflow-requirements references への反映方針が Phase 12 で明文化、実反映は別タスクへ引き渡し）
- AC-7 / AC-8 / AC-9 / AC-10（drift 検査結果・rollback 経路・workflow vs job 判別・admin block 回避策の最終文書化）

## 必須 5 タスク（task-specification-creator skill 準拠 / 0 件でも全タスク出力必須）

1. **実装ガイド作成（Part 1 中学生 + Part 2 技術者の 2 パート構成）** — `outputs/phase-12/implementation-guide.md`
   - implementation タスクのため「実装ガイド」は **後追い再 PUT 実行手順ガイド** として記述する。
2. **システム仕様書更新（Step 1-A / 1-B / 1-C + 条件付き Step 2）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴作成** — `outputs/phase-12/documentation-changelog.md`（および `outputs/phase-12/main.md` 内に概要転記）
4. **未割当タスク検出レポート（0 件でも出力必須）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須）** — `outputs/phase-12/skill-feedback-report.md`

加えて **Phase 12 自身の compliance check** を `outputs/phase-12/phase12-task-spec-compliance-check.md` に出力する。

## 実行タスク

- Task 12-1: 後追い再 PUT 実行手順ガイドを Part 1（中学生）+ Part 2（技術者）の 1 ファイルに統合作成。
- Task 12-2: system-spec-update-summary を Step 1-A / 1-B / 1-C + 条件付き Step 2 で構造化記述。
- Task 12-3: documentation-changelog を本タスク完了で更新される正本ドキュメントの一覧と更新内容で出力。
- Task 12-4: unassigned-task-detection を 0 件でも必ず出力（drift 是正 / aiworkflow-requirements 反映 / 関連タスク登録の formalize）。
- Task 12-5: skill-feedback-report を改善点なしでも必ず出力。
- Task 12-6: phase12-task-spec-compliance-check を実施。
- Task 12-7: same-wave sync（workflow LOG / SKILL.md ×2 / resource-map / active guide）完了。
- Task 12-8: 二重 ledger（root `artifacts.json` と `outputs/artifacts.json`）同期。
- Task 12-9: `validate-phase-output.js` と `verify-all-specs.js` 実行・全 PASS 確認。
- Task 12-10: GitHub Issue #202 は CLOSED のまま、コメントでクローズアウト記録のみ追加（再オープン禁止）。
- Task 12-11: 「implementation / NON_VISUAL / 実 PUT は Phase 13 ゲート後」境界を全成果物で再確認。
- Task 12-12: NON_VISUAL の代替 evidence ファイル名（`branch-protection-current-{dev,main}.json` / `branch-protection-applied-{dev,main}.json` / `drift-check.md` / `manual-verification-log.md`）を Phase 11 / Phase 13 から逆引き整理し、screenshot 不要根拠を明示。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 5 タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 仕様詳細 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | 落とし穴対策 |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | NON_VISUAL 代替 evidence |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/index.md | 正本語彙・AC-1〜AC-14 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-01.md 〜 phase-11.md | 全 Phase 成果物の参照元 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 1 段階目適用の運用境界 |
| 必須 | ./origin-unassigned-task.md | 原典 unassigned-task spec |
| 必須 | CLAUDE.md（ブランチ戦略 / Governance / Secret hygiene） | drift 検証基準 |
| 参考 | .claude/skills/aiworkflow-requirements/references/ci-cd.md | required_status_checks 反映先候補 |
| 参考 | .claude/skills/aiworkflow-requirements/references/governance.md | branch protection governance 反映先候補 |
| 参考 | docs/30-workflows/ut09-direction-reconciliation/phase-12.md | フォーマット参考 |

---

## タスク 1: 後追い再 PUT 実行手順ガイド作成（`outputs/phase-12/implementation-guide.md`）

### Part 1（中学生レベル / 日常の例え話必須）

implementation タスクではあるが、UI を伴わない governance 操作のため、Part 1 では「branch protection」と「ステータスチェック」を例え話で説明する。3 つ以上の例え話を含めること。

- 全体導入: 「GitHub のリポジトリにある『大事なブランチ』を、勝手に変更されないように守る仕組みが branch protection。今回はその守り設定の『どのテストに合格しないと merge できないか』のリストが空っぽのままになっていたので、後から正しいリストに書き換える作業」
- 例え話 1（branch protection / ステータスチェック）: 「学校の保健室にある『この検査に合格してないと体育祭に出られない』チェックリスト。リストが空のままだと『合格証なしで出場 OK』と同じになってしまう。リストを正しく書き直すのが今回の作業」
- 例え話 2（contexts=[] では不十分な理由）: 「セキュリティのために『鍵が必要な部屋』を作ったけど、鍵の種類が空欄のまま運用していた状態。誰でも入れる部屋を『鍵付き』と呼んでいるのと同じで、見た目は守っているが実質ノーガード」
- 例え話 3（後追い再 PUT が必要な理由）: 「テストのリスト（=実際の GitHub Actions の job 名）が、別のタスク（UT-GOV-004）でやっと確定した。確定する前に保健室のリストを書いてしまったので、今からそのリストを差し替えに行く」
- 例え話 4（dev / main 独立 PUT）: 「学校の保健室と職員室で別々にリストを管理している。両方を同時に書き換えようとして片方失敗すると、リストが食い違って大混乱。だから 1 部屋ずつ順番に書き換える」
- 例え話 5（適用前 GET / 適用後 GET）: 「書き換える前に、いまのリストの写真を撮ってから書き換え、書き換えた後にもう一度写真を撮って『ちゃんと変わったか』を見比べる」

#### Part 1 専門用語セルフチェック

| 専門用語 | Part 1 での言い換え |
| --- | --- |
| branch protection | 大事なブランチを勝手に変更されないようにする守り設定 |
| required_status_checks.contexts | 「合格しないと merge できないテスト」のリスト |
| PUT / GET | 「リストを書き換えに行く」「リストを見に行く」 |
| enforce_admins | 管理者でも例外なくこのルールを守る設定 |
| drift | ドキュメントと実際の設定がずれていること |

### Part 2（技術者レベル）

以下を網羅すること。

- **後追い再 PUT 実行手順（base case = 案 A）**:
  1. 適用前 GET 取得: `gh api repos/{owner}/{repo}/branches/dev/protection > outputs/phase-13/branch-protection-current-dev.json` / 同 main。
  2. UT-GOV-004 成果物（`required-status-checks-contexts.{dev,main}.json`）から実在 context（job 名 or check-run 名）を抽出（`contexts-source.json` 経由）。
  3. `branch-protection-payload-{dev,main}.json` の `required_status_checks.contexts` を実在 context のみで再生成。残りの全フィールド（`required_pull_request_reviews=null` / `enforce_admins=true` / `required_linear_history` / `required_conversation_resolution` / `allow_force_pushes=false` / `allow_deletions=false` / `lock_branch=false`）は適用前 GET と同値を維持。
  4. dev PUT: `gh api -X PUT repos/{owner}/{repo}/branches/dev/protection --input outputs/phase-02/branch-protection-payload-dev.json`。
  5. dev 検証 GET → `outputs/phase-13/branch-protection-applied-dev.json` 保存。`jq '.required_status_checks.contexts | sort'` で期待 contexts と集合一致を確認。
  6. main PUT: 同様。
  7. main 検証 GET → `outputs/phase-13/branch-protection-applied-main.json` 保存・集合一致確認。
  8. drift 検査: 6 値（`required_pull_request_reviews=null` / `enforce_admins=true` / `allow_force_pushes=false` / `allow_deletions=false` / `required_linear_history` / `required_conversation_resolution`）を CLAUDE.md / deployment-branch-strategy.md と突合し `outputs/phase-09/drift-check.md` に記録。
- **TypeScript 型定義（gh api レスポンス想定スキーマ）**: GitHub REST API `BranchProtection` 型（`required_status_checks: { strict: boolean; contexts: string[]; checks?: Array<{context: string; app_id: number | null}> }` 等）の参照箇所を明記し、独自型を新規導入しない方針を記述。
- **API シグネチャと使用例**:
  - `GET /repos/{owner}/{repo}/branches/{branch}/protection`
  - `PUT /repos/{owner}/{repo}/branches/{branch}/protection`（payload は `required_status_checks` を含む完全置換）
  - `gh auth status` で admin scope 確認 → 不在時は実行停止。
- **エラーハンドリングとエッジケース**:
  - 403 (admin scope 不足): 即時停止、token を `op://Employee/ubm-hyogo-env/GITHUB_ADMIN_TOKEN` から再取得。
  - 422 (payload schema 不正 / typo context): 当該 PUT のみ rollback、UT-GOV-004 成果物の再点検タスクを起票。
  - 片側 PUT 失敗 (dev OK / main NG): main のみ UT-GOV-001 rollback payload で再 PUT、dev は維持。
  - admin block (実行直後 open PR が check 未走): UT-GOV-001 rollback payload で即時 revert、Phase 11 の事前 open PR 確認を再実施。
- **設定可能パラメータ / 定数**:
  - `OWNER=daishiman`, `REPO=UBM-Hyogo`, `BRANCHES=(dev main)`
  - 期待 contexts ファイル: `outputs/phase-02/expected-contexts-{dev,main}.json`
  - rollback payload: UT-GOV-001 の `outputs/phase-05/rollback-payload-{dev,main}.json`（再利用のみ・上書き禁止）
- **CLI 規約**: 本タスクは Cloudflare 操作なしのため `scripts/cf.sh` 不要。`gh` CLI と `jq` のみ使用。`wrangler` 直接実行は本タスクで発生しない。
- **1Password vault**: `op://Employee/ubm-hyogo-env/GITHUB_ADMIN_TOKEN`（admin scope 必須）。実値の docs 転記禁止。
- **Phase 13 ゲート前の禁止事項**: 仕様書段階では実 PUT・push・PR 作成を一切行わない（AC-13）。

### 成果物

- パス: `outputs/phase-12/implementation-guide.md`
- 完了条件: Part 1（例え話 5 つ以上）+ Part 2（実行手順 / 型 / API / エラー / 定数 / CLI / Secret / Phase 13 ゲート禁止）が網羅されている。

### セルフチェックリスト

- [ ] Part 1 に 5 つ以上の日常例え話
- [ ] Part 1 専門用語セルフチェック表
- [ ] Part 2 に 8 ステップの再 PUT 手順
- [ ] エラーハンドリング 4 ケース以上
- [ ] Secret hygiene と Phase 13 ゲート禁止が明文化

---

## タスク 2: システム仕様更新（`outputs/phase-12/system-spec-update-summary.md`）

### Step 1-A: 完了タスク記録 + 関連 doc リンク + 変更履歴 + workflow LOG + resource-map

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/30-workflows/LOGS.md` | UT-GOV-001 second-stage reapply の Phase 1〜13 完了行追記（base case = 案 A）。本タスクは `spec_created` で close-out のため「仕様書化完了」行のみ |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴テーブルへ「UT-GOV-001 second-stage reapply 仕様書化」を追記 |
| `.claude/skills/task-specification-creator/SKILL.md` | 変更履歴テーブルへ「Phase 13 をユーザー承認ゲート兼実 PUT 実行ゲートとした事例」を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory に `utgov001-second-stage-reapply` を追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | second-stage reapply の運用境界（実 PUT は Phase 13 ゲート後）を追記 |
| 関連 doc リンク | UT-GOV-001 完了タスク / UT-GOV-004 / UT-GOV-002 / UT-GOV-003 / UT-GOV-005〜007 への双方向リンク予定（実反映は別タスク `pending_creation`） |
| `docs/30-workflows/completed-tasks/` への移動方針 | **本タスク完了時（実 PUT + drift 検証完了 + PR merged 後）に Phase 13 で `docs/30-workflows/completed-tasks/UT-GOV-001-second-stage-reapply.md` として移動・登録予定**。Phase 12 段階では未移動 |

### Step 1-B: 実装状況テーブル更新（`spec_created` 維持）

- 統合 README / `docs/30-workflows/LOGS.md` の実装状況テーブルで本タスクを `spec_created` ステータスで記録（`completed` にしない）。
- 仕様状態の遷移: `spec_created` →（Phase 13 user 承認 + 実 PUT 完了）→ `applied` →（PR merged）→ `completed`。
- 本 Phase 12 では `spec_created` を **書き換えない**。

### Step 1-C: 関連タスクテーブル更新予定

- 以下タスクの index.md / 関連タスクテーブルに second-stage reapply 完了情報の参照行を反映予定（実反映は別タスク pending_creation）:
  - `docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md` §8.2「後追い再 PUT 経路」に本タスクへのリンクを追記
  - `./origin-unassigned-task.md` のステータスを `spec_created` → `applied` 候補へ更新（実反映は本タスク Phase 13 完了後）
  - UT-GOV-002 / UT-GOV-003 / UT-GOV-004 / UT-GOV-005〜007 各 index.md「依存」表に「contexts 強制が機能している protected dev / main」を前提として確認

### Step 2（条件付き）: aiworkflow-requirements references への反映

| 採用方針 | Step 2 発火 | 更新対象 |
| --- | --- | --- |
| A（推奨 / base case） | **別タスクへ引き渡し（本タスクでは未発火）** | 実反映タスクで `.claude/skills/aiworkflow-requirements/references/ci-cd.md`（または `governance.md`）に branch protection 最終状態（dev / main 別 contexts 配列・適用日付・GET 正本パス）を反映する。Phase 12 では「方針明文化」のみ（AC-14） |

> **重要**: 本タスクは implementation だが、references 実反映までは含めない（Ownership 境界）。実反映は新規 unassigned-task `task-utgov001-references-reflect-001`（Task 12-4 で登録）として別タスク化する。

### 成果物

- パス: `outputs/phase-12/system-spec-update-summary.md`
- 完了条件: Step 1-A / 1-B / 1-C / Step 2 が全て記述、`spec_created` を維持する設計が明文化、references 実反映は別タスクへ引き渡しが明記。

### セルフチェックリスト

- [x] Step 1-A の同期対象 6 行
- [x] Step 1-B で `spec_created` を Phase 12 段階で書き換えない方針が明示
- [x] Step 1-C で 6 関連タスクへの双方向リンク予定
- [x] Step 2 が「別タスクへ引き渡し」と明示
- [x] completed-tasks への移動は Phase 13 完了後である旨が明示

---

## タスク 3: ドキュメント更新履歴作成（`outputs/phase-12/documentation-changelog.md`）

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-30 | 新規 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/ | Phase 1〜13 + index + outputs + artifacts.json |
| 2026-04-30 | 同期 | docs/30-workflows/LOGS.md | UT-GOV-001 second-stage reapply 仕様書化完了行 |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/SKILL.md | 変更履歴テーブル更新 |
| 2026-04-30 | 同期 | .claude/skills/task-specification-creator/SKILL.md | 変更履歴テーブル更新 |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | workflow inventory に second-stage reapply 行を追加 |
| 2026-04-30 | リンク追記予定 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | §8.2 への双方向リンク |
| 2026-04-30 | リンク追記予定 | ./origin-unassigned-task.md | 仕様書化完了行 |
| Phase 13 後 | 移動 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/ → docs/30-workflows/completed-tasks/UT-GOV-001-second-stage-reapply.md | 実 PUT + PR merged 後に移動 |
| 別タスク | 反映予定 | .claude/skills/aiworkflow-requirements/references/ci-cd.md (or governance.md) | branch protection 最終状態反映（task-utgov001-references-reflect-001） |
| 別タスク | drift 検出時 | CLAUDE.md / docs/00-getting-started-manual/deployment-branch-strategy.md | drift 是正（task-utgov001-drift-fix-001） |

### 成果物

- パス: `outputs/phase-12/documentation-changelog.md`
- 完了条件: 全変更ファイルが網羅され、本 PR で発生する変更と Phase 13 後 / 別タスクで発生する変更が明確に分離されている。

---

## タスク 4: 未割当タスク検出レポート（`outputs/phase-12/unassigned-task-detection.md` / 0 件でも出力必須）

Phase 1〜11 の open question / drift 候補 / Ownership 境界を一括登録する。

| # | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- | --- |
| 1 | aiworkflow-requirements references（`ci-cd.md` または `governance.md`）への branch protection 最終状態反映 | 仕様更新 | dev / main 別 contexts 配列・適用日付・GET 正本パスを記載 | 新規 unassigned-task: `task-utgov001-references-reflect-001` |
| 2 | CLAUDE.md / deployment-branch-strategy.md drift 検出時の追従更新 | 仕様更新（条件付き） | Phase 9 drift-check.md で drift 検出した場合のみ起票 | 新規 unassigned-task: `task-utgov001-drift-fix-001`（条件発火） |
| 3 | UT-GOV-004 成果物の重複 context / workflow 名混入の最終監査 | 検証 | `contexts-source.json` 抽出時に jq `unique` 適用結果のレビュー | UT-GOV-004 側で起票（本タスク外） |
| 4 | 後続 UT-GOV-005〜007 への「contexts 強制 protected dev / main」前提の明示反映 | 仕様更新 | 各 index.md「上流」表へリンク追記 | 新規 unassigned-task: `task-utgov-downstream-precondition-link-001` |
| 5 | rollback rehearsal を second-stage 用にも文書化するかの判断 | 設計 / 戦略 | UT-GOV-001 で初回完了済 / 本タスクでは rollback payload 再利用のみ。再 rehearsal の要否は user 判断 | 本ファイルに保留登録（user 判断 trigger） |
| 6 | Issue #202 close-out コメントの追記 | 運用 | `gh issue comment 202` 経由で仕様書化完了 / 実 PUT 完了の二段階記録 | 本タスク Phase 13 ステップに組込済（新規起票不要） |

> 検出件数: **6 件**（うち条件発火 1 件 / 保留 1 件 / Phase 13 内処理 1 件）。本タスクの Ownership 境界に純粋に外側にある実反映タスクは #1 / #2 / #4 の 3 件。**0 件ではない根拠**: aiworkflow-requirements references への反映方針 (AC-14) を本タスクで未発火とする設計のため、最低 1 件は必ず発生する。

### セルフチェックリスト

- [x] 検出 6 件すべてに割り当て先 ID または保留 / 内処理理由が明示
- [x] 「0 件である根拠」または「0 件でない根拠」が記述
- [x] aiworkflow-requirements references 反映タスクが必ず登録されている（AC-14）

---

## タスク 5: スキルフィードバックレポート（`outputs/phase-12/skill-feedback-report.md` / 改善点なしでも出力必須）

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | implementation タスクで Phase 13 が「ユーザー承認ゲート兼実 PUT 実行ゲート」を兼ねるパターンが既存テンプレに薄い | governance / 不可逆 API 操作タスク向けに「Phase 13 = approval + execute」テンプレを `phase-template-phase12-detail.md` に追記 |
| task-specification-creator | NON_VISUAL の代替 evidence ファイル名が implementation タスクでも明文化必須である運用ルールを Phase 12 仕様に追記 | `phase-12-spec.md` に「NON_VISUAL implementation の代替 evidence は GET / drift-check.md / manual-verification-log.md を最低限とする」旨を記載 |
| task-specification-creator | `spec_created` 維持で Phase 12 を close-out する implementation タスク（実行ゲートが Phase 13）の Step 1-B 取り扱いを明示 | `spec-update-workflow.md` に「Phase 13 が approval gate のとき、Phase 12 では `spec_created` を書き換えない」を追記 |
| aiworkflow-requirements | branch protection 正本（GitHub 側 = `gh api`）と references / CLAUDE.md の片務 drift 検出が運用に依存している | `references/governance.md` に「branch protection drift 検出は `gh api` 出力を正本としたチェック手順」を追記提案 |
| automation-30 | 30 種思考法の Phase 3 代表 8 + Phase 10 補完 22 の分割運用は本タスクでも有効に機能した | 改善提案なし（現行運用で十分） |
| github-issue-manager | Issue #202 (CLOSED) を再オープンせず、仕様書化完了 / 実 PUT 完了の 2 段階コメントで履歴を残す運用が有効 | CLOSED Issue への二段階クローズアウトコメントテンプレを skill 化 |

> 改善提案 6 件（うち 1 件は「改善点なし」明示）。本タスクは second-stage reapply の初例のため、テンプレ化候補が複数発生した。

### セルフチェックリスト

- [x] task-specification-creator の改善提案が 3 件以上
- [x] aiworkflow-requirements の改善提案が 1 件以上
- [x] 「改善点なし」の skill にもその旨を明示

---

## タスク 6: Phase 12 compliance check（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 5 タスクの成果物が揃っている | main.md + 5 補助 + compliance check = 7 ファイル | PASS |
| 実装ガイドが Part 1 / Part 2 構成 | 中学生 / 技術者の 2 パート | PASS |
| Part 1 に例え話 5 つ以上 | branch protection / contexts=[] / 後追い理由 / 独立 PUT / GET 比較 | PASS |
| Part 2 に再 PUT 手順 8 ステップ + エラー 4 ケース + Secret + Phase 13 ゲート禁止 | 全項目記述 | PASS |
| Step 1-A / 1-B / 1-C が記述 | 仕様書同期サマリー | PASS |
| Step 2 条件分岐記述 | 別タスクへ引き渡し（Phase 12 未発火）| PASS |
| same-wave sync 完了 | workflow LOG + SKILL ×2 + resource-map + active guide | PASS |
| 二重 ledger 同期 | root + outputs の artifacts.json | PASS |
| validate-phase-output.js | 全 Phase PASS | PASS |
| verify-all-specs.js | 全 spec PASS | PASS |
| spec_created ステータス維持 | Phase 12 段階で `completed` に書き換えていない | PASS |
| Issue #202 CLOSED のまま | 再オープン禁止 / コメントのみ追記 | PASS |
| 機密情報非混入 | admin token 値 / op:// 解決値が docs に無い | PASS |
| NON_VISUAL 代替 evidence 明示 | GET 2 系統 + drift-check + manual-verification-log | PASS |
| Phase 13 ゲート設計 | approval なしで実 PUT 実行しない設計 | PASS |
| docs-only → code 再判定 | implementation 確定のため再判定不要 | PASS |
| AC-13 / AC-14 トレース | Phase 12 完了条件に明記 | PASS |

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| workflow LOG | docs/30-workflows/LOGS.md | YES |
| SKILL #1 | .claude/skills/aiworkflow-requirements/SKILL.md | YES |
| SKILL #2 | .claude/skills/task-specification-creator/SKILL.md | YES |
| Index | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | YES |
| active guide | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | YES |

## 二重 ledger 同期【必須】

- root `artifacts.json` と `outputs/artifacts.json` を必ず同時更新する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `task.metadata.taskType` / `task.metadata.docsOnly` / `task.metadata.visualEvidence`。
- 本タスクは `taskType=implementation` / `docsOnly=false` / `visualEvidence=NON_VISUAL` を全 ledger で固定する。
- Phase 12 完了時点での `phases[11].status = spec_created`（`completed` ではない / Phase 13 approval 後に実 PUT で初めて applied 化）。

## NON_VISUAL 代替 evidence【必須】

本タスクは UI を伴わないため screenshot は採取しない。代替 evidence として以下を必須化する。

| 代替 evidence | 採取 Phase | パス |
| --- | --- | --- |
| 適用前 GET（dev / main） | Phase 13 | outputs/phase-13/branch-protection-current-{dev,main}.json |
| 適用後 GET（dev / main） | Phase 13 | outputs/phase-13/branch-protection-applied-{dev,main}.json |
| drift 検査結果 | Phase 9 | outputs/phase-09/drift-check.md |
| 手動検証ログ | Phase 11 | outputs/phase-11/manual-verification-log.md |
| ローカル確認結果 | Phase 13 | outputs/phase-13/local-check-result.md |

> Phase 11 の screenshot 不要根拠: REST API 操作 / ブラウザ UI 非介在のため。`phase-11-non-visual-alternative-evidence.md` 準拠。

## docs-only → code 再判定（不要）

本タスクは当初から implementation / NON_VISUAL 確定のため、docs-only → code の再判定は不要。後続タスク（references 反映 / drift 是正）が docs-only で起票される可能性はあるが、本タスクの Phase 12 では再判定 trigger なし。

## validate-phase-output.js / verify-all-specs.js 実行確認

```bash
node scripts/validate-phase-output.js \
  --task utgov001-second-stage-reapply

node scripts/verify-all-specs.js
```

- 期待: 両方とも exit code 0 / 全 PASS。
- FAIL 時: 該当 Phase の outputs/ 不足ファイルまたは artifacts.json drift を是正してから再実行。

## GitHub Issue #202 連携【必須 / 再オープン禁止】

```bash
# Issue #202 は CLOSED のまま。仕様書化完了のクローズアウトコメントのみ追加。
# 実 PUT 完了後（Phase 13）には更に二段階目のコメントを追記する。
gh issue comment 202 --body "$(cat <<'EOF'
UT-GOV-001 second-stage reapply の Phase 1〜12 仕様書化が完了しました。

- 仕様書ディレクトリ: docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/
- base case: 案 A（UT-GOV-004 完了後の dev / main 独立 PUT / MAJOR ゼロ・MINOR ゼロ）
- 実 PUT は Phase 13 のユーザー承認ゲート後に実行予定
- 残作業（unassigned-task として登録予定）:
  - aiworkflow-requirements references（ci-cd.md / governance.md）への最終状態反映
  - CLAUDE.md / deployment-branch-strategy.md drift 検出時の追従更新（条件発火）
  - UT-GOV-005〜007 への「contexts 強制 protected dev / main」前提リンク追記

本タスクは implementation / NON_VISUAL のため `spec_created` で Phase 12 close-out。
Issue は CLOSED のまま、追跡情報のみ追記。
EOF
)"

# 再オープンは禁止
# gh issue reopen 202 ← 実行しない
```

## 多角的チェック観点

- 価値性: Part 1 が非エンジニアでも contexts=[] 残留リスクを理解できるか（例え話 5 つ以上）。
- 実現性: Step 2 が「別タスクへ引き渡し」と明示され Phase 12 で発火しないか。
- 整合性: same-wave sync の LOGS / SKILL / resource-map が最新コミットで一致しているか。
- 運用性: unassigned-task-detection の 6 件すべてに割り当て先 ID または保留 / 内処理理由が記述されているか。
- implementation 境界: 本 Phase 12 で実 PUT を行わず、`spec_created` を維持する設計が貫徹されているか。
- Secret hygiene: ガイド・更新 references に admin token 値 / op:// 解決済み実値が含まれていないか。
- Issue 整合: #202 を CLOSED のまま扱い、再オープンしていないか。
- NON_VISUAL: 代替 evidence 5 種が Phase 11 / 13 で網羅されているか。
- AC-13 / AC-14: 完了条件に明示されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 後追い再 PUT 手順ガイド Part 1（中学生） | 12 | spec_created | 例え話 5 つ以上 |
| 2 | 同 Part 2（技術者） | 12 | spec_created | 8 ステップ / エラー 4 ケース / Secret / Phase 13 ゲート禁止 |
| 3 | system-spec-update-summary | 12 | spec_created | Step 1-A/B/C + Step 2 別タスク引き渡し |
| 4 | documentation-changelog | 12 | spec_created | 本 PR 変更 / Phase 13 後 / 別タスクの 3 区分 |
| 5 | unassigned-task-detection | 12 | spec_created | 6 件登録（条件発火 1 / 保留 1 / 内処理 1） |
| 6 | skill-feedback-report | 12 | spec_created | 改善提案 6 件 |
| 7 | phase12-compliance-check | 12 | spec_created | 全 PASS |
| 8 | same-wave sync | 12 | spec_created | workflow LOG / SKILL×2 / resource-map / active guide |
| 9 | 二重 ledger 同期 | 12 | spec_created | implementation / NON_VISUAL 固定 |
| 10 | validate / verify スクリプト | 12 | spec_created | exit 0 |
| 11 | Issue #202 コメント追記 | 12 | spec_created | CLOSED のまま / 再オープン禁止 |
| 12 | NON_VISUAL 代替 evidence 整理 | 12 | spec_created | GET 2 系統 + drift-check + manual-verification-log + local-check-result |

## 成果物

必須 7 成果物（`main.md` + Task 12-1〜12-5 + compliance check）と 2 ledger:

| 種別 | パス | 説明 |
| --- | --- | --- |
| 本体 | outputs/phase-12/main.md | Phase 12 概要 + ドキュメント更新履歴サマリー |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1 + Part 2 |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/1-B/1-C + Step 2 別タスク引き渡し |
| 履歴 | outputs/phase-12/documentation-changelog.md | 全変更ファイル一覧 |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 6 件登録 |
| FB | outputs/phase-12/skill-feedback-report.md | 改善提案 6 件 |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | 全 PASS |
| メタ | artifacts.json (root) | Phase 12 状態の更新（`spec_created` 維持） |
| メタ | outputs/artifacts.json | 生成物 ledger 同期 |

## 完了条件

- [ ] 必須 7 成果物が `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1 / Part 2 構成で、Part 1 に日常の例え話が 5 つ以上含まれる
- [ ] Part 2 に 8 ステップ手順 / エラー 4 ケース / Secret / Phase 13 ゲート禁止が網羅
- [ ] system-spec-update-summary に Step 1-A / 1-B / 1-C / Step 2（別タスク引き渡し）が明記
- [ ] documentation-changelog に本 PR / Phase 13 後 / 別タスクの 3 区分が網羅
- [ ] unassigned-task-detection が 6 件登録され、各々に割り当て先 ID または保留 / 内処理理由が記述（AC-14 トレース）
- [ ] skill-feedback-report に改善提案 6 件
- [ ] phase12-task-spec-compliance-check の全項目が PASS
- [ ] same-wave sync が完了
- [ ] 二重 ledger が `taskType=implementation` / `docsOnly=false` / `visualEvidence=NON_VISUAL` で同期
- [ ] `validate-phase-output.js` / `verify-all-specs.js` が exit code 0
- [ ] Issue #202 への仕様書化完了コメント追記済み（再オープンしていない）
- [ ] NON_VISUAL 代替 evidence 5 種が Phase 11 / 13 から逆引き整理済み
- [ ] `spec_created` ステータスが Phase 12 段階で書き換えられていない（AC-13 トレース）

## タスク 100% 実行確認【必須】

- 全実行タスク（12 件）が `spec_created`
- 必須 7 成果物が `outputs/phase-12/` に配置される設計になっている
- implementation タスクの Phase 12 close-out ルール（`spec_created` を書き換えない / 実 PUT は Phase 13 ゲート後）が遵守されている
- Step 2 が「別タスクへ引き渡し」と明記されている
- Issue #202 を CLOSED のまま扱い、再オープン手順を含めていない
- artifacts.json の `phases[11].status = spec_created` / `task.metadata.taskType = implementation` / `task.metadata.visualEvidence = NON_VISUAL`
- AC-13 / AC-14 / AC-7 / AC-8 / AC-9 / AC-10 が完了条件に含まれる

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成 / 後追い再 PUT 実行ゲート)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection 6 件 → Phase 13 完了後 / 別タスクで順次起票
  - Issue #202 は CLOSED のまま PR 側で `Refs #202` として参照（`Closes #202` は不可）
  - implementation 境界（実 PUT は Phase 13 ゲート後）を Phase 13 で再確認
  - Phase 13 はユーザー承認前提の **実 PUT 実行ゲート** であることを最優先で明記
  - NON_VISUAL 代替 evidence 採取は Phase 13（GET 2 系統 / local-check-result）で実施
- ブロック条件:
  - 必須 7 成果物のいずれかが欠落
  - same-wave sync が未完了
  - 二重 ledger に drift（特に `taskType=implementation` / `visualEvidence=NON_VISUAL`）
  - validate / verify スクリプトが FAIL
  - Step 2 条件分岐が未記述
  - Issue #202 を誤って再オープンした
  - Phase 12 段階で `spec_created` を `completed` に書き換えた
