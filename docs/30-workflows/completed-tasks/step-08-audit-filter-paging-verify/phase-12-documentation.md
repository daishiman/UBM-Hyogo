# Phase 12: ドキュメント同期（strict 7 成果物 + bonus scope-out記録）

**[実装区分: 実装仕様書（verify_existing）]**

> 監査タスク用テンプレ（`phase-template-audit-task.md` / `phase-12-documentation-guide.md`）に基づき、Phase 12 実行時に `outputs/phase-12/` へ作る**strict 7 成果物の SPEC** を定義する。本ファイルは task root 直下の**集約サマリー**であり、実体ファイルは `outputs/phase-12/` に生成済みである。
>
> **着手時の最初の作業（Feedback2 / 隣接コード差分 gate）**: artifacts.json と各 `phase-*.md` の artifact 名 1:1 突合、および `git status --porcelain -- apps/ packages/ infra/ scripts/ .github/ tests/fixtures/` の生出力転記。`apps/` dirty diff 0 件であることが NFR-5（コード変更ゼロ）の前提。

## 1. 完了ステータス判断（検証済み・PR待ち）

| 観点 | 値 | 根拠 |
|------|----|------|
| `implementation_mode` | `verify_existing` | phase-1 §1。元 spec「✅ OK - 改善不要」を回帰検証 |
| `taskType` | `implementation` | 既存実装を検証する実装仕様書 |
| `visualEvidence` | `NON_VISUAL` | UI/UX 変更なし。既存 visual baseline 流用 |
| close-out status | `verified_current_no_code_change_pending_pr`（Phase 13 のみ user-gated） | verify_existing で code wave はないが、Phase 11 local regression evidence と apps/packages diff-zero を取得済み |
| code wave | なし（`apps/` 差分 0） | NFR-5 / AC-4 |

## 2. strict 7 成果物の SPEC（canonical 名・パス・必須要件）

> 配置先はすべて `outputs/phase-12/`。task root 直下に Phase 12 成果物を作らない（本 `phase-12-documentation.md` は集約サマリーのみ）。canonical filename は strict 固定（別名・suffix 違い不可）。

| # | canonical path | 役割 | 必須要件 |
|---|----------------|------|---------|
| 1 | `outputs/phase-12/main.md` | Phase 12 main | strict 7 一覧、workflow分類、Phase 11境界を記録 |
| 2 | `outputs/phase-12/implementation-guide.md` | Task 12-1 実装ガイド（2 パート） | Part1（中学生レベル）+ Part2（技術詳細） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Task 12-2 spec 更新サマリー | Step1-A/1-B/1-C + Step2 + verified_current_no_code_change_pending_pr 採用根拠 + artifacts parity |
| 4 | `outputs/phase-12/documentation-changelog.md` | Task 12-3 変更ファイル一覧 | 全 Step 結果 + workflow-local / global skill sync + validator 記録 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | Task 12-4 未タスク検出 | bonus 3 機能を core 外 bonus として理由付きscope-out記録（AC-6）。未タスク新規作成なし |
| 6 | `outputs/phase-12/skill-feedback-report.md` | Task 12-5 skill feedback | 改善点なしでも確認 scope と no-op 理由を出力 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 12-6 root evidence | canonical 9 headings + Phase 11 inventory + strict 7 + 4条件 verdict |

> canonical N 成果物（Phase 5/6/8 固有の生成物）は**パス参照のみ・コピー禁止**（PR12-R2）。本タスクは code wave なしのため canonical N 生成物は存在せず、参照は phase-5/6/8 の検証手順に閉じる。

## 3. Task 12-1: implementation-guide.md SPEC

| パート | 対象 | 必須内容 |
|--------|------|---------|
| Part1 | 中学生レベル | 「監査ログ閲覧画面が**壊れていないことを確認し続ける仕組み**」を日常の例えで説明（例: 「家の鍵が今日もちゃんと閉まるか毎朝確認する点検」のような例え）。`たとえば` を最低 1 回。専門用語禁止（使う場合は即説明） |
| Part2 | 開発者 | 検証対象（phase-1 §2-1 inventory）/ 既存テスト（§2-2）/ FR↔テスト coverage map（phase-9 §1 参照）/ 検証コマンド（index.md §3） |

**`視覚証跡` セクション固定フレーズ（逐語）**: `UI/UX変更なしのため Phase 11 スクリーンショット不要`

> Part2 は `current contract`（既存実装）と `target delta`（= no-op）を分けて書く。Before/After が同一のため `After = same / no-op` と明記し差分を捏造しない。

## 4. Task 12-2: system-spec-update-summary.md SPEC

| Step | 内容 | 本タスクでの判定 |
|------|------|-----------------|
| Step1-A | 完了タスク記録 + LOGS.md×2 + topic-map 再生成 | `task-workflow` へ step-08-audit-filter-paging-verify を `verified_current_no_code_change_pending_pr` で記録 |
| Step1-B | 実装状況 | `verified_current_no_code_change_pending_pr`（code wave なし、local regression evidence captured） |
| Step1-C | 関連タスクテーブル | serial-05 step-01..08 / step-07 (#865) との関係を 1 表で記録 |
| Step2 | 新規 interface 追加判定 | **N/A**（新規 API / 型 / IPC 追加なし。既存 surface のみ検証） |

- **verified_current_no_code_change_pending_pr 採用根拠（1 行必須）**: 「verify_existing・code wave なし・既存テスト回帰実行、targeted coverage、apps/packages diff-zero を確認済みのため `verified_current_no_code_change_pending_pr`（commit/push/PR のみ user-gated）」
- artifacts.json / outputs/artifacts.json の title / type / status / phase artifact 名 parity を初手確認。
- LOGS.md×2（`.claude/skills/aiworkflow-requirements/LOGS.md` + `.claude/skills/task-specification-creator/LOGS.md`）と SKILL.md×2 の変更履歴更新。
- `.claude` 正本先行更新 → `.agents` mirror parity（`diff -qr .claude/skills/<skill> .agents/skills/<skill>`、存在しない場合は N/A 理由記録）。

## 5. Task 12-3: documentation-changelog.md SPEC

| ブロック | 内容 |
|---------|------|
| entry checklist | `git status --porcelain -- apps/ packages/` 生出力転記（期待: apps/ 0 件 →「`apps/` dirty diff 0 件確認済」明記） |
| 全 Step 結果 | Step1-A〜Step2 の touch / 該当なしを行ごとに記録（空行で省略しない） |
| workflow-local 同期ブロック | `index.md` / `phase-*.md` / `artifacts.json` / `outputs/artifacts.json` の 4 点同期結果 |
| global skill sync ブロック（BEFORE-QUIT-003） | SKILL.md×2 / LOGS.md×2 を canonical absolute path で列挙 + mirror parity |
| validator 実行記録 | コマンド逐語 + exit code + 件数（3 値）。例: `rg -n "計画\|予定\|TODO" outputs/phase-12/*.md → exit 1 (match 0)` |

> 必須 7 カテゴリ（skill 正本 / skill 履歴 / skill reference / workflow artifacts / workflow outputs / system spec 個別 path / validator 記録）のうち touch しないものは「該当なし: 理由」を 1 行残す。

## 6. Task 12-4: unassigned-task-detection.md SPEC（bonus scope-out記録・AC-6）

> bonus 3 機能は元 spec が「core 要件ではなく admin UX 向上の bonus」と明示。**先送りではなく、監査結論を超える別スコープの正式記録**として `unassigned-task-detection.md` に記録する。CONST_005 に従い、今回サイクルでは未タスク新規作成を行わない。

| 検出項目 | status | core 外 bonus 理由 | decision | 配置 path |
|---------|--------|-------------------|----------|-----------|
| CSV export | scope-out | 監査対象（filter/paging/masking）外。閲覧結果の外部出力は別 UX scope | 新規未タスクなし | N/A |
| Saved filters | scope-out | filter の永続化は別データモデル（保存 store）を要し core 監査外 | 新規未タスクなし | N/A |
| Real-time update / polling | scope-out | リアルタイム更新は read-only 監査の継続保証 scope 外 | 新規未タスクなし | N/A |

- current（本タスク差分起因）/ baseline（既存ドリフト）を分離。本 3 件は current の core 外 bonus として記録するが、検出された欠陥ではない。
- 関連タスク差分確認欄を設け、serial-05 既存タスクと重複しないこと（duplicate でない）を明記。
- これにより AC-6（bonus 3 機能の core 外スコープ理由付き記録）を満たす。

## 7. Task 12-5: skill-feedback-report.md SPEC

- 改善点があれば `promotion target / no-op reason / evidence path` を付ける。
- 改善点なしの場合も確認 scope（task-specification-creator / aiworkflow-requirements / skill-creator / validation scripts）と no-op 理由を明記。
- verify_existing / 監査タスクへの `phase-template-audit-task.md` 適用所感（matrix shape 不要・FR↔テスト coverage map で代替できたか等）を 1 ブロック記録。

## 8. Task 12-6: phase12-task-spec-compliance-check.md SPEC（root evidence）

| 確認項目 | PASS 条件 |
|---------|----------|
| Task 12-1〜12-5 完了 | 6 成果物実体が `outputs/phase-12/` に存在（早期完了記載禁止） |
| planned wording 0 件 | `rg -n "計画\|予定\|TODO\|will be\|を予定\|保留として記録" outputs/phase-12/*.md` が 0 件 |
| identifier drift | implementation-guide.md の関数名（`maskAuditJson` 等）が現行実装に grep 一致 |
| artifacts parity | root / outputs artifacts.json の Phase status・filename を同値確認 |
| mirror parity | `.agents/skills/<skill>` 存在時は `diff -qr`、不在は N/A 理由 |
| Phase 11 evidence | `outputs/phase-11/manual-test-result.md` が `not_run` のままなら Phase 11/12 を completed にしない |
| Phase 13 | user approval 未取得なら `blocked` 維持 |
| canonical filename | 6 成果物名が strict 固定（別名なし）であることを 4 箇所（changelog / compliance / root artifacts / outputs artifacts）で同一文字列確認 |

> 自己申告 PASS で閉じず、validator 実測値 / artifact existence / mirror diff / Phase 11 evidence 実ファイルを結び付ける。Task12-1〜12-5 集約の root evidence として機能させる。

## 9. 完了条件（Phase 12 DoD）

- [ ] strict 7 成果物（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）の canonical 名・パス・必須要件を表で定義した（§2）。
- [ ] implementation-guide.md の Part1（中学生レベル）/ Part2（技術詳細）と `視覚証跡` 固定フレーズ「UI/UX変更なしのため Phase 11 スクリーンショット不要」を定義した（§3）。
- [ ] system-spec-update-summary に Step1-A〜Step2（Step2=N/A）と verified_current_no_code_change_pending_pr 採用根拠 1 行を定義した（§4）。
- [ ] documentation-changelog に workflow-local / global skill sync 別ブロック（BEFORE-QUIT-003）と validator 3 値記録を定義した（§5）。
- [ ] bonus 3 機能（CSV export / Saved filters / Real-time update）を core 外 bonus として理由付きscope-out記録し AC-6 を満たす定義をした（§6）。
- [ ] skill-feedback-report を改善点なしでも出力する定義をした（§7）。
- [ ] phase12-task-spec-compliance-check を Task12-1〜12-5 集約 root evidence として定義した（§8）。
- [ ] LOGS.md×2 / SKILL.md×2 更新と `.claude` 正本先行 → `.agents` mirror parity（diff -qr）を手順化した。
- [ ] 着手の最初の作業として artifacts.json↔phase-*.md artifact 名 1:1 突合と apps/ dirty diff 0 件確認を手順化した（Feedback2）。
- [ ] close-out status は `verified_current_no_code_change_pending_pr`（Phase 13 のみ user-gated）と明記した（§1）。
