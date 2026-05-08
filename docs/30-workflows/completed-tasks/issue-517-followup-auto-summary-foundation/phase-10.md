# Phase 10: 最終レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-517 N 日後 follow-up auto-summary 基盤 |
| GitHub Issue | #517（CLOSED 維持 / 再 OPEN しない / PR 文面は `Refs #517, Refs #497, Refs #351`） |
| Phase 番号 | 10 / 13（**Gate Phase**） |
| Phase 名称 | 最終レビューゲート |
| 作成日 | 2026-05-07 |
| 前 Phase | 9（品質保証） |
| 次 Phase | 11（手動検証） |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **実装仕様書（CONST_004 / コード変更を伴う）** |
| Gate Phase | ✅（Phase 1〜9 を横断レビューし PASS / MAJOR / MINOR を判定） |

---

## 目的

Phase 1〜9 の出力（要件 / 設計 / 検証戦略 / runbook / 異常系 / AC マトリクス / DRY 整合 / 品質保証）を **4 観点（機能性 / 信頼性 / 保守性 / セキュリティ）** および **4 条件評価（価値性 / 実現性 / 整合性 / 運用性）** で横断レビューし、Phase 11 着手の可否を確定する。

solo dev 運用ポリシーに従い PR 必須レビュアーは 0 名であるため、本 Phase は **self-review checklist 13 項目を必須化** し、機械的かつ網羅的にゲートを通過させる設計とする。MAJOR が 1 件でも検出されれば Phase 2-3 に戻し、MINOR は同フェーズ内修正で吸収する。

---

## ゲート判定基準

| 判定 | 基準 | アクション |
| --- | --- | --- |
| **PASS** | 4 観点すべての base case が AC / NFR を充足、4 条件評価が全 PASS、self-review checklist 13 項目すべて ✅ | Phase 11 へ進む |
| **MINOR** | 軽微な懸念あり（後続 Phase / 同 Phase 内修正で吸収可能） | base case 維持、Phase 11 / 12 で追補 |
| **MAJOR** | AC 未充足 / Secrets 露出 / silent-skip 設計矛盾 / DRY 違反 / Issue 再 OPEN 含意 | **Phase 2-3 に差し戻し** |

戻し先決定ルール:

- 「workflow YAML / 関数構造 / exit code / 失敗パターン / DRY 整合」関連 → Phase 2-3 戻し
- 「機能要件 / 非機能要件 / 変更対象ファイル / 制約」関連 → Phase 1 戻し
- 「テスト戦略 / 異常系 / AC マトリクス」関連 → Phase 4-7 戻し
- 「品質保証 / DoD」関連 → Phase 9 内修正

---

## レビュー観点 1: 機能性（AC-1〜AC-10 全 PASS）

Phase 7 AC マトリクスと cross check し、各 AC が Phase 1〜9 のいずれかの成果物で達成可能であることを確認する。

| AC | 達成根拠（Phase 出力） | 判定方法 |
| --- | --- | --- |
| AC-1（cron + silent skip） | Phase 2 軸 1-1 schedule + 軸 2-3 step 6 | YAML cron 値 `0 1 * * *` と `is_30day_gate_satisfied` 分岐の双方確認 |
| AC-2（PR body に 4 集計） | Phase 2 軸 2-2 `aggregate_runs` + `render_pr_body` | 集計 JSON schema 4 項目（conclusion_dist / longest_failure_streak / failure_rate / 原因分類）網羅 |
| AC-3（Slack 5 行 + PR URL） | Phase 2 軸 2-2 `render_slack_payload` + `post_slack` | 5 行制限固定 / PR URL 引数化 |
| AC-4（重複 PR スキップ） | Phase 2 軸 2-3 step 7 + `find_existing_pr` | YYYYMM 粒度 + Slack 送信なし明示 |
| AC-5（redaction） | Phase 2 軸 2-3 step 8 + Phase 8 軸 1 既存 lib 再利用 | パターン 4 件固定 / DRY 違反 0 |
| AC-6（failure>=10% 検討節） | Phase 2 軸 2-2 `render_pr_body` | しきい値 0.10 が render_pr_body 内に固定 |
| AC-7（dispatch + dry_run） | Phase 2 軸 1-1 inputs + 軸 2-6 dry-run mode | inputs.dry_run boolean / DRY_RUN env 流入 |
| AC-8（ローカル --dry-run） | Phase 2 軸 2-6 + Phase 9 軸 1 QG-6 | step 11〜13 スキップ / dry-run exit 0 確認 |
| AC-9（Phase 12 7 成果物） | Phase 12 で扱う / Phase 8 軸 4 skill references 追記方針 | 7 必須成果物の draft 構造が Phase 9 DoD-11〜13 で固定 |
| AC-10（4 条件 PASS） | Phase 1 / Phase 2 / Phase 8 / Phase 9 の 4 条件表 | 全 PASS が根拠付き |

**判定**: 全 AC が Phase 1〜9 出力にマップ可能であれば PASS。1 件でも欠落があれば対応戻し先（Phase 1〜7）へ MAJOR 差し戻し。

---

## レビュー観点 2: 信頼性（silent skip / dry-run / 重複検知 / redaction）

| 確認項目 | 期待状態 | 判定方法 |
| --- | --- | --- |
| gate 不成立 silent skip → exit 0 / Slack 送信なし | Phase 2 軸 2-3 step 6 + 軸 4 早見表で固定 | YAML / script trace |
| 重複 PR silent skip → exit 0 / Slack 送信なし | Phase 2 軸 2-3 step 7 + 軸 4 早見表で固定 | YAML / script trace |
| dry-run → step 11〜13 全スキップ / exit 0 | Phase 2 軸 2-6 + Phase 9 QG-6 | dry-run 実行確認 |
| Slack POST 失敗 → exit 3 / PR は残置 | Phase 2 軸 2-5 + 軸 4 早見表 | exit code semantics 表 |
| `set -euo pipefail` 配下で各関数が動作 | Phase 2 軸 2-2 冒頭で固定 | shellcheck warnings 0 |
| failure_rate >= 10% で retry/alert 検討節挿入 | Phase 2 軸 2-2 `render_pr_body` 0.10 閾値 | TC fixture で確認 |
| redaction が PR body / Slack payload 双方に適用 | Phase 2 軸 2-3 step 8 + Phase 8 軸 1 | redaction audit grep |

**判定方法**: 上記 7 経路のうち 1 件でも「副作用が漏れる」「exit code が曖昧」「Slack 送信が gate 後に走る」「redaction が片方のみ」設計があれば MAJOR（Phase 2-3 戻し）。

---

## レビュー観点 3: 保守性（関数分離 / README / lib 再利用）

| 確認項目 | 期待状態 |
| --- | --- |
| 関数 7 件が Phase 2 軸 2-2 契約通り分離 | aggregate_runs / redact_log / is_30day_gate_satisfied / find_existing_pr / render_pr_body / render_slack_payload / post_slack |
| 既存 `lib/redaction-check.sh` を source 経由で再利用 | Phase 8 軸 1-1 |
| `gh run list` 呼出が `fetch_runs()` 1 箇所に集約 | Phase 8 軸 1-2 |
| `scripts/post-release-dashboard/README.md` が Phase 12 で更新予定 | Phase 9 DoD-11 |
| aiworkflow-requirements `references/deployment-gha.md` 追記章が単一 | Phase 8 軸 4-1 |
| `__tests__/run-all.sh` への 1 行追加で CI 自動連携 | Phase 9 軸 2-2 |

---

## レビュー観点 4: セキュリティ（secret / redaction / permissions）

Phase 9 軸 4 SC-1〜SC-8 を再確認:

- [ ] SC-1: `SLACK_WEBHOOK_URL` が GitHub Secrets 経由のみ流入
- [ ] SC-2: script 内で `echo "$SLACK_WEBHOOK_URL"` / `set -x` 配下参照禁止
- [ ] SC-3: redaction patterns を含む行が PR body / Slack payload に混入しない
- [ ] SC-4: PR body / Slack payload 投稿前の最終 grep audit
- [ ] SC-5: log / commit / README に webhook URL 実値が含まれない
- [ ] SC-6: permissions が least-privilege（`contents: write` / `pull-requests: write` / `actions: read`）
- [ ] SC-7: dry-run は `SLACK_WEBHOOK_URL` 未設定でも成功
- [ ] SC-8: `wrangler` / Cloudflare 系 CLI 不使用

---

## 4 条件評価最終確認

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | defer-allowed タスクの「忘れ事故」リスクを cron + Slack 通知で構造的に解消。issue-497 の人手運用負荷を 0 化 |
| 実現性 | PASS | 既存 GitHub Actions / gh CLI / shell（jq / curl / git）のみで完結し新規依存なし。timeout 10 分の安全 margin |
| 整合性 | PASS | 不変条件 1〜7 影響なし。post-release-dashboard.yml 出力契約と整合（read-only）。Issue #517 CLOSED 維持。`Refs #517, Refs #497, Refs #351` 統一 |
| 運用性 | PASS | dry-run / workflow_dispatch / Slack 通知 / draft PR レビューの human-in-the-loop 設計。silent skip 3 経路 + Slack 失敗 1 経路の挙動が明確 |

すべて PASS。

---

## self-review checklist（13 項目 / solo dev 必須）

solo dev 運用ポリシーに従い PR 必須レビュアー 0 名のため、本 13 項目を **Phase 10 終了時点で全 ✅** にする:

- [ ] SR-1: AC-1〜AC-10 全件が Phase 1〜9 出力にマップ可能
- [ ] SR-2: silent skip 3 経路（gate 不成立 / 重複 PR / dry-run）すべて exit 0 で統一
- [ ] SR-3: Slack POST 失敗時 exit 3 / PR 残置の経路明確
- [ ] SR-4: redaction patterns（`token` / `bearer` / `secret` / `Authorization`）が `lib/redaction-check.sh` のみに固定
- [ ] SR-5: `gh run list` 呼出が `fetch_runs()` 1 箇所に集約
- [ ] SR-6: workflow permissions が least-privilege（3 種のみ）
- [ ] SR-7: `SLACK_WEBHOOK_URL` の log / PR body / Slack payload / README 露出 0
- [ ] SR-8: dry-run が `SLACK_WEBHOOK_URL` 未設定でも exit 0
- [ ] SR-9: aiworkflow-requirements 追記が `references/deployment-gha.md` のみ
- [ ] SR-10: Issue #517 CLOSED 維持 / `Closes #517` / `Fixes #517` / `gh issue reopen` 検出 0 件
- [ ] SR-11: PR 文面が `Refs #517, Refs #497, Refs #351` で統一
- [ ] SR-12: shellcheck / actionlint / shfmt / unit test / dry-run / redaction audit 6 ゲートが PASS 可能
- [ ] SR-13: DoD-1〜DoD-13（Phase 9 軸 5）が Phase 11 / 13 までに全充足見込み

---

## pre-merge チェックリスト（Phase 12 / 13 連携）

Phase 12 ドキュメント更新 / Phase 13 PR 作成に進む前に、次を確認:

- [ ] PM-1: strict 7 必須成果物（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）の draft 構造が `outputs/phase-12/` に揃う見込み
- [ ] PM-2: aiworkflow-requirements skill の `references/deployment-gha.md` 章追加 + changelog 新規作成が Phase 12 引き渡し条件として明示
- [ ] PM-3: `scripts/post-release-dashboard/README.md` の更新内容が draft 状態（Slack channel 明記 + Secrets 登録手順 + 実値非記載原則）
- [ ] PM-4: Slack channel bootstrap / GitHub Secrets `SLACK_WEBHOOK_URL` 確認が運用者操作として README に手順化（Phase 11 preflight で確認、未登録なら `CONTRACT_READY_SECRET_PENDING`）
- [ ] PM-5: PR title が `[issue-517] N-day follow-up auto-summary foundation` 等の prefix 統一案で固定
- [ ] PM-6: PR body が `.claude/commands/ai/diff-to-pr.md` Phase 13 仕様 + `outputs/phase-12/implementation-guide.md` を反映する方針

---

## リスクレジスタと残留リスク

| # | リスク | 検知手段 | 残留度 |
| --- | --- | --- | --- |
| R-1 | Slack channel ID 誤り → 通知到達失敗 | Phase 11 dry-run + 実機 1 回 POST 確認 / Slack channel `w1618436027-ek2505248` 文書化 | 低（Phase 11 で実測） |
| R-2 | GitHub token 権限不足 → PR 起票失敗 | actionlint + workflow `permissions:` 明示 + Phase 11 で初回手動 dispatch 確認 | 低 |
| R-3 | cron drift（GHA cron は ±10 分程度） | UTC 1 時間遅延設計（親 `0 0 * * *` / 本 `0 1 * * *`）で吸収。30 日 gate は ISO 8601 文字列比較で安定 | 極低 |
| R-4 | GraphQL / `gh run list` schema drift（`createdAt` / `conclusion` / `event` フィールド変化） | aggregate_runs 内で必須 field の存在チェック → exit 2 で早期失敗 / Phase 11 で gh CLI バージョン記録 | 中 |
| R-5 | 親 workflow `post-release-dashboard.yml` の削除 / 改名 | 起動時 path existence gate（Phase 2 軸 5-1 + Phase 8 軸 2-2）→ exit 64 | 低 |
| R-6 | redaction patterns 漏れ（新規 token 種別の出現） | Phase 12 unassigned-task-detection で「redaction patterns 拡張」を follow-up として記録可能性あり | 中（運用フィードバックで対応） |
| R-7 | 同月内に手動 dispatch 連発 → 重複 PR 誤起票 | `find_existing_pr()` + concurrency group `cancel-in-progress: false` で直列化 | 低 |

---

## ゲート結果テンプレ表

下記は Phase 10 実行時に `outputs/phase-10/gate-result.md` に記入するテンプレート。

| 項目 | 値 |
| --- | --- |
| 結論 | **PASS** / **MAJOR**（戻し先 Phase 併記） / **MINOR**（同 Phase 内修正項目併記） |
| 観点 1（機能性） | PASS / MINOR / MAJOR + 根拠 |
| 観点 2（信頼性） | PASS / MINOR / MAJOR + 根拠 |
| 観点 3（保守性） | PASS / MINOR / MAJOR + 根拠 |
| 観点 4（セキュリティ） | PASS / MINOR / MAJOR + 根拠 |
| 4 条件評価 | 価値性 / 実現性 / 整合性 / 運用性 各 PASS / MINOR / MAJOR |
| self-review SR-1〜SR-13 | 13 項目チェック結果 |
| pre-merge PM-1〜PM-6 | 6 項目チェック結果 |
| レビュー日 | YYYY-MM-DD |
| レビュアー | solo dev（self-review） |
| 次アクション | Phase 11 着手 / Phase 2-3 / 1 / 4-7 / 9 への戻し（該当 phase 併記） |

---

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | （`index.md` 記載の不変条件すべて） | 影響なし | 本タスクは GHA workflow + bash script + Slack Webhook + skill references 追記のみで完結 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/gate-result.md | 4 観点 + 4 条件 + self-review 13 + pre-merge 6 + リスクレジスタの判定結果 |
| メタ | artifacts.json | Phase 10 状態の更新 |

---

## 受入条件 / 完了条件チェックリスト

- [ ] 4 観点（機能性 / 信頼性 / 保守性 / セキュリティ）すべての判定が記録
- [ ] 4 条件評価が全 PASS で根拠付き
- [ ] self-review checklist 13 項目すべて ✅
- [ ] pre-merge チェックリスト 6 項目すべて方針確認済
- [ ] リスクレジスタ 7 件の検知手段が記述
- [ ] ゲート結果テンプレ表に従い `outputs/phase-10/gate-result.md` 作成
- [ ] MAJOR 検出時の戻し先 phase が記述

---

## 変更対象ファイル / 関数シグネチャ / unit / integration / e2e tests

本 Phase は **横断レビュー / 判定** に閉じる。Phase 1〜9 で確定した変更対象ファイルおよび関数 7 件の契約への変更はない。

---

## 次 Phase への引き渡し

- 次 Phase: 11（手動検証）— ただし MAJOR 判定の場合は実施せず該当 phase に戻し
- 引き継ぎ事項:
  - 4 観点判定結果（PASS なら Phase 11 着手可）
  - self-review 13 + pre-merge 6 のチェック結果
  - リスクレジスタ 7 件と検知手段
  - 6 ゲート（Phase 9 軸 1）の Phase 11 実測予定
- ブロック条件:
  - 4 観点のいずれかで MAJOR 残存 → Phase 2-3 / 1 / 4-7 / 9 戻し
  - self-review 13 項目に未充足あり
  - リスクレジスタの検知手段が未確定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-517-followup-auto-summary-foundation/index.md` | AC / scope 正本 |
| 必須 | `docs/30-workflows/issue-517-followup-auto-summary-foundation/phase-02.md` | 関数 7 件契約 / silent skip 経路 |
| 必須 | `docs/30-workflows/issue-517-followup-auto-summary-foundation/phase-08.md` | DRY 整合 / skill references 単一追記章 |
| 必須 | `docs/30-workflows/issue-517-followup-auto-summary-foundation/phase-09.md` | 6 ゲート + DoD 13 項目 + SC-1〜SC-8 |
| 参照 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 追記先（実在確認済） |
| 参照 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-10.md` | テンプレ参照 |

## 完了条件

- [ ] 本 Phase の目的、実行タスク、成果物、次 Phase への引き渡しが矛盾なく記録されている
- [ ] CONST_004 / CONST_007 / Issue #517 CLOSED 維持の境界が崩れていない
- [ ] 必要な参照資料と evidence path が実在パスで記録されている
