# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | observability target 差分検証 script 追加 (UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-05-01 |
| 前 Phase | 11 (NON_VISUAL 手動検証) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed |
| タスク分類 | infrastructure-tooling（implementation） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implementation_complete（Phase 1-12 完了 / Phase 13 pending_user_approval） |
| user_approval_required | false |
| GitHub Issue | #329（Refs #329 / Closes 不使用・Issue クローズ済み） |

## 目的

UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001 の Phase 1〜11 成果物を、workflow-local 文書と `.claude/skills/aiworkflow-requirements/references/` / CLAUDE.md / 親 UT-06-FU-A-PROD-ROUTE-SECRET-001 runbook に反映する。本タスクは **observability target 差分検証 script の追加** を伴う implementation タスクだが、observability 設定変更 / production deploy は含まない。Phase 12 必須 5 タスク + Task 6（compliance check）の合計 7 ファイルを完了し、Phase 13（PR 作成）の前提を整える。

## workflow_state 取り扱い

- 本タスクは `taskType=implementation`（読み取り専用 script の追加）/ `visualEvidence=NON_VISUAL`。
- 本 PR の公開インターフェースは `bash scripts/cf.sh observability-diff`。内部実装ファイルは `scripts/observability-target-diff.sh` と `scripts/lib/redaction.sh`。
- `apps/web/wrangler.toml` / `apps/api/wrangler.toml` / observability 設定 / production secret は **本 PR に含めない**。
- Phase 12 完了時:
  - `phases[*].status` は実成果物が揃った Phase のみ `completed` に更新可能。
  - `metadata.workflow_state` は `implementation_complete`。script / tests / Phase 11 evidence / Phase 12 strict 7 files は実体作成済み。
- 参照: `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md`。

## 必須 5 タスク + Task 6（task-specification-creator skill 準拠）

1. **Task 12-1 実装ガイド作成（Part 1: 中学生レベル / Part 2: 技術者レベル）** — `outputs/phase-12/implementation-guide.md`
2. **Task 12-2 システム仕様書更新（Step 1-A / 1-B / 1-C + Step 2）** — `outputs/phase-12/system-spec-update-summary.md`
3. **Task 12-3 ドキュメント更新履歴** — `outputs/phase-12/documentation-changelog.md`
4. **Task 12-4 未タスク検出レポート（0 件でも出力必須）** — `outputs/phase-12/unassigned-task-detection.md`
5. **Task 12-5 スキルフィードバックレポート（改善点なしでも出力必須）** — `outputs/phase-12/skill-feedback-report.md`
6. **Task 12-6 Phase 12 task-spec compliance check** — `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 5 タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 構造定義 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | 漏れパターン |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | 実装ガイド執筆ガイド |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A/1-B/1-C / Step 2 / same-wave sync |
| 必須 | docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/outputs/phase-05/script-implementation.md | script 設計（中核成果物） |
| 必須 | docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/outputs/phase-11/main.md | NON_VISUAL evidence サマリー |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | observability 正本（Step 1-A の主同期先） |
| 必須 | CLAUDE.md | scripts/cf.sh ルール / 不変条件 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/ | 親タスク（cross-link 対象） |

## Task 12-1: 実装ガイド作成

`outputs/phase-12/implementation-guide.md` に以下 2 パートを 1 ファイルで記述する。

### Part 1: 中学生レベル概念説明（日常の例え話 4 つ以上必須）

**章立て**:

1. **observability とは何か**
   - 例え話 1: 「保健室にカメラ（Tail）と日誌（Logs）と来訪統計（Analytics）と防犯ログ転送装置（Logpush）の 4 種類の見守り役がいる。どれかが古い保健室を見ていると、新しい保健室の事故に気付けない」
2. **Worker 名を変えると observability 設定はついてこないことがある**
   - 例え話 2: 「保健室の表札を変えても、見守り役のカメラはまだ古い保健室に向いていることがある。1 つずつ向きを変える作業が必要」
3. **差分検証 script とは**
   - 例え話 3: 「新旧 2 枚の見守り装置リストを並べて『どちらにしか無いもの』を赤ペンで囲む作業を機械にやらせる。毎回手で見比べると見落とす」
4. **redaction（マスク処理）とは**
   - 例え話 4: 「ログ転送先の住所（sink URL）や鍵（token）はリストに書いてあると盗まれる。配布前に黒塗りする」
5. **golden output とは**
   - 例え話 5: 「答え合わせ用の模範解答を 1 枚保存しておき、次に同じ確認をしたとき結果がズレていないかを diff で見る」
6. **なぜ読み取り専用か**
   - 「点検は『見るだけ』。書き換えはチェックリスト承認後に別の人が手で行う。点検と書き換えを混ぜると事故の元」

### Part 2: 技術者向け実装ガイド

**章立て**:

1. **コマンド一覧**（CLAUDE.md 準拠 / すべて `bash scripts/cf.sh` 経由）:
   - `bash scripts/cf.sh whoami`（認証確認のみ）
   - `bash scripts/cf.sh observability-diff --legacy-worker <旧Worker名> --current-worker ubm-hyogo-web-production`
   - `bash scripts/cf.sh observability-diff ... | tee outputs/phase-11/manual-run-log.md`
2. **script 構成**:
   - `scripts/cf.sh observability-diff`（外部公開エントリポイント）
   - `scripts/observability-target-diff.sh`（Workers Logs / Tail / Logpush / Analytics target 取得と diff）
   - `scripts/lib/redaction.sh`（token / secret / sink URL マスク）
   - `tests/golden/diff-mismatch.md`, `tests/golden/usage.txt`（golden output）
3. **redaction パターン一覧**:
   - JWT 風（`eyJ[A-Za-z0-9_-]{10,}`）
   - OAuth トークン（`ya29\.[A-Za-z0-9_-]{10,}`）
   - API key（`sk-[A-Za-z0-9]{20,}`）
   - UUID 風 token（`[0-9a-f]{32}-[0-9a-f]{4}-...`）
   - Logpush sink URL（`https://[^[:space:]]*logpush[^[:space:]]+`）
   - R2 / S3 sink（`r2://...` / `s3://...` / `*.amazonaws.com/...`）
4. **読み取り専用境界**:
   - `secret put` / `deploy` / `logpush create|update|delete` を script 内で **呼ばない**
   - destructive 呼び出しが含まれていないことを E-7 grep で保証
5. **golden output 比較**:
   - timestamp / request id 等は redaction で `<TIMESTAMP>` / `<REQ_ID>` に置換
   - `bash tests/integration/observability-target-diff.test.sh` で golden / output 契約を確認
6. **Secret hygiene 厳守**:
   - 値は op 経由のみ・`.env` Read 禁止・ログ転記禁止
7. **wrangler 直接実行禁止**:
   - すべて `bash scripts/cf.sh` 経由（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）

### Task 12-1 完了条件

- [ ] Part 1 / Part 2 構成
- [ ] Part 1 に日常の例え話が 4 つ以上
- [ ] Part 2 のコマンドが全て `bash scripts/cf.sh` 経由
- [ ] redaction パターン一覧 / 読み取り専用境界 / golden 比較が記述

### Task 12-1 漏れやすいポイント

- 例え話を「技術用語の言い換え」で終わらせず、必ず日常物（保健室・カメラ・黒塗り）に置き換える
- Part 2 で `wrangler` 直呼びサンプルを書かない
- destructive 呼び出し（secret put / deploy）を「本タスクで実行する」と誤記しない

---

## Task 12-2: システム仕様書更新

`outputs/phase-12/system-spec-update-summary.md` を以下 4 ステップで構造化する。

### Step 1-A: aiworkflow-requirements への追記方針

`.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` に observability diff script の導線を追加する方針:

| 同期対象セクション | 記述内容 |
| --- | --- |
| observability target 検証フロー | route cutover 後の観測点として `bash scripts/cf.sh observability-diff` を導線化 |
| 旧/新 Worker target inventory 取得 | `cf.sh` 経由で Workers Logs / Tail / Logpush / Analytics 一覧を取得する手順 |
| redaction ルール | token / secret / sink URL の出力混入禁止と redaction パターンの正本記述 |
| golden output | 配置先 `tests/golden/observability-target-diff/` と更新タイミング（旧 Worker rename 時） |
| 読み取り専用境界 | 設定書き換え（secret put / deploy / logpush create|update|delete）は禁止 |

> **注**: 本仕様書段階では「追記方針」を `system-spec-update-summary.md` に記述する。実際の `deployment-cloudflare.md` への書き込みは、script / tests / Phase 11 evidence と同一 wave で実装するまで PASS 証跡にしない。

### Step 1-B: CLAUDE.md「Cloudflare 系 CLI 実行ルール」セクションとの cross-link

- script 内 README で「すべて `bash scripts/cf.sh` 経由」を再宣言し、CLAUDE.md「Cloudflare 系 CLI 実行ルール」へ link する。

### Step 1-C: 親 UT-06-FU-A-PROD-ROUTE-SECRET-001 runbook との link

- 親タスクの runbook から本タスク（observability diff script）への link を追記する。
- 親タスク Phase 10 open question #2「Logpush ターゲット差分検証スクリプト化」が本タスクの起源であることを明示。

### Step 2: 契約 / API / DB Schema の同期

- 本タスクは新規 TypeScript インターフェース / API endpoint / IPC 契約 / D1 schema を **追加しない**。
- 追加するのは bash script のみで、契約面の同期は **N/A**。
- ただし aiworkflow-requirements `deployment-cloudflare.md` への導線追記（Step 1-A）は本タスク内で実施する。

### Task 12-2 完了条件

- [ ] Step 1-A に同期対象 5 項目の追記方針が記述
- [ ] Step 1-B に CLAUDE.md cross-link 方針が記述
- [ ] Step 1-C に親 UT-06-FU-A-PROD-ROUTE-SECRET-001 link 方針が記述
- [ ] Step 2 で「契約変更なし / N/A」が理由付きで明記

### Task 12-2 漏れやすいポイント

- 「実書き込み」と「追記方針記述」を混同しない（本 PR では `deployment-cloudflare.md` への実書き込みも実施）
- Step 2 を「N/A」とだけ書いて理由を省略しない

---

## Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を記述する。

| 日付 | 変更種別 | 対象ファイル | 変更概要 | reviewer |
| --- | --- | --- | --- | --- |
| 2026-05-01 | 新規 | docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/ | UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001 仕様書 13 Phase + index + artifacts.json | @daishiman |
| 2026-05-01 | 新規 | `scripts/observability-target-diff.sh`, `scripts/lib/redaction.sh` | observability target 差分検証 script 一式 | @daishiman |
| 2026-05-01 | 新規 | docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/outputs/phase-11/ | NON_VISUAL 代替 evidence E-1〜E-7 | @daishiman |
| 2026-05-01 | 更新 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | observability diff script 導線追加 | @daishiman |
| 2026-05-01 | 更新方針記録 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | 本 script への cross-link 追記方針（実書き込みは別 PR） | @daishiman |
| 2026-05-01 | 更新方針記録 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/ | 親タスクから本 script への link 追記方針 | @daishiman |

### Task 12-3 完了条件

- [ ] 更新ファイル一覧 / 変更概要 / reviewer / 更新日 2026-05-01 が記述
- [ ] workflow-local 同期と global skill / CLAUDE.md 追記方針が別ブロックで記録

### Task 12-3 漏れやすいポイント

- 「実書き込み」と「追記方針記録」を混在させて変更日付がずれる
- reviewer 欄を空にする（solo dev でも `@daishiman` を明記）

---

## Task 12-4: 未タスク検出レポート（0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md` を出力する。

### 検出候補（推奨記載）

| 検出 ID（候補） | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- |
| UNASSIGNED-FU-A-LOGPUSH-DIFF-001 | 自動化 | observability diff script を CI（GitHub Actions）に組込み定期実行 | 新規 unassigned（infrastructure-automation） |
| UNASSIGNED-FU-A-LOGPUSH-DIFF-002 | 運用 | golden output の自動更新ワークフロー（旧 Worker rename / 削除時） | 新規 unassigned（infrastructure-automation） |
| UNASSIGNED-FU-A-LOGPUSH-DIFF-003 | 拡張 | `bash scripts/cf.sh` ラッパー未対応 API（Logpush jobs list 等）の追加 | 新規 unassigned（tooling） |

### 0 件記載のフォーマット（該当時のみ使用）

> 現時点で 0 件。Phase 11 の代替 evidence 採取で運用上の追加課題は検出されなかった。

### Task 12-4 完了条件

- [ ] 0 件でも `outputs/phase-12/unassigned-task-detection.md` が出力されている
- [ ] 1〜3 件の候補を起票候補として記述するか、0 件を明示

### Task 12-4 漏れやすいポイント

- 「0 件だから出力しない」と誤判定する
- 候補に割り当て先 wave / タスク種別を書き忘れる

---

## Task 12-5: スキルフィードバックレポート（改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` を出力する。

### フィードバック例（推奨記載）

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | implementation タスクで NON_VISUAL となるケース（CLI script のみ）の boilerplate が薄い | `references/phase-template-phase11-detail.md` に「CLI script implementation の NON_VISUAL 縮約」例を追加 |
| task-specification-creator | golden output / redaction grep を伴う検証パターンの標準テンプレ不在 | `references/` に「観測系 diff script 検証 evidence」テンプレを追加 |
| aiworkflow-requirements | `deployment-cloudflare.md` における observability diff script 導線の標準節がない | references に「observability target diff 検証フロー」セクションを追加 |
| github-issue-manager | CLOSED Issue の Refs 運用（Closes 不使用）が SKILL.md に明記なし | CLOSED Issue の Refs 運用を SKILL.md に追記 |

### 改善点なしの場合のフォーマット

> 特になし。本タスクで使用したスキルはいずれも本タスクの NON_VISUAL / implementation / infrastructure-tooling 組み合わせにおいて期待通り機能した。

### Task 12-5 完了条件

- [ ] 改善点なしでも `outputs/phase-12/skill-feedback-report.md` が出力されている
- [ ] スキル別の改善提案または「特になし」を明示

### Task 12-5 漏れやすいポイント

- 「改善点なしだから出力しない」と誤判定する
- スキル名を曖昧（`task-specification`）に書く

---

## Task 12-6: Phase 12 task-spec compliance check

`outputs/phase-12/phase12-task-spec-compliance-check.md` を出力する。

### チェック項目

| # | チェック項目 | 期待 | 結果 |
| --- | --- | --- | --- |
| 1 | Task 12-1 implementation-guide.md（Part 1 中学生 + Part 2 技術者）が存在 | YES | TBD |
| 2 | Part 1 に日常の例え話 4 つ以上 | YES | TBD |
| 3 | Task 12-2 system-spec-update-summary.md の Step 1-A/1-B/1-C/2 が記述 | YES | TBD |
| 4 | Task 12-3 documentation-changelog.md が日付 2026-05-01 で記述 | YES | TBD |
| 5 | Task 12-4 unassigned-task-detection.md が出力（0 件でも） | YES | TBD |
| 6 | Task 12-5 skill-feedback-report.md が出力（改善点なしでも） | YES | TBD |
| 7 | main.md が補助 index として出力 | YES | TBD |
| 8 | same-wave sync（aiworkflow-requirements 追記）完了 | YES | TBD |
| 9 | 二重 ledger（root + outputs の artifacts.json）同期 | YES | TBD |
| 10 | script 内に `wrangler` 直呼び 0 件 | YES | TBD |
| 11 | script 内に destructive 呼び出し 0 件 | YES | TBD |
| 12 | redaction grep で実値混入 0 件 | YES | TBD |
| 13 | `apps/web/wrangler.toml` / `apps/api/wrangler.toml` への変更が PR に非混入 | YES | TBD |
| 14 | implementation-guide に `wrangler` 直呼びサンプルなし | YES | TBD |

### Task 12-6 完了条件

- [ ] 14 チェック項目すべて記述
- [ ] 全項目に PASS / FAIL / TBD のいずれかが付与
- [ ] FAIL がある場合は是正 Phase（5 / 8 / 9 / 11）が指定

---

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 | 本タスクでの扱い |
| --- | --- | --- | --- |
| 親 UT-06-FU-A-PROD-ROUTE-SECRET-001 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/ | TBD（追記方針記録、実 link は実装 wave で確認） | 双方向 link |
| aiworkflow-requirements references | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | YES（実書き込み） | observability diff script 導線追加 |
| skill 本体 / LOGS | 今回は skill 挙動を変更しない | N/A | スキル改善は `skill-feedback-report.md` に記録 |
| aiworkflow-requirements indexes | indexes/topic-map.md / resource-map.md / quick-reference.md / keywords.json | 条件付き | 導線追加が必要なら更新 |

## 二重 ledger 同期【必須】

- root `artifacts.json` と `outputs/artifacts.json` を同時更新する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `task.metadata.taskType` / `task.metadata.workflow_state`。
- **本タスクの drift 防止チェック**:
  - `task.metadata.taskType = "implementation"`
  - `task.metadata.visualEvidence = "NON_VISUAL"`
  - `apps/web/wrangler.toml` / `apps/api/wrangler.toml` への変更が本 PR に含まれていない

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | NON_VISUAL evidence サマリー（E-1〜E-7）を `system-spec-update-summary.md` の参照証跡に転記 |
| Phase 13 | doc-update-history を PR 変更ファイル一覧の根拠として使用 |
| 親 UT-06-FU-A-PROD-ROUTE-SECRET-001 | observability diff script 仕様として申し送り（open question #2 は script 実装完了まで解消扱いにしない） |

## 多角的チェック観点

- 価値性: 実装ガイド Part 1 が非エンジニアでも observability split-brain 検出意義を理解できるレベルか。
- 実現性: Step 1-A の `deployment-cloudflare.md` 追記が現行ファイル構造と整合しているか。
- 整合性: same-wave sync が aiworkflow-requirements / 親 UT-06-FU-A と一致するか。
- 運用性: unassigned-task-detection の委譲先が実在 ID または「新規 unassigned」候補として明記されているか。
- 認可境界: 実装ガイドの全コマンドが `scripts/cf.sh` 経由で書かれているか。
- Secret hygiene: ガイド内サンプルに実 token / 実 sink URL / 実 secret 値が含まれていないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Task 12-1 実装ガイド Part 1（中学生） | 12 | spec_created | 例え話 4 つ以上必須 |
| 2 | Task 12-1 実装ガイド Part 2（技術者） | 12 | spec_created | scripts/cf.sh 経由 |
| 3 | Task 12-2 system-spec-update | 12 | spec_created | Step 1-A/1-B/1-C + Step 2 |
| 4 | Task 12-3 doc-update-history | 12 | spec_created | reviewer / 2026-05-01 |
| 5 | Task 12-4 unassigned-task-detection | 12 | spec_created | 0 件でも必須 |
| 6 | Task 12-5 skill-feedback-report | 12 | spec_created | 改善点なしでも必須 |
| 7 | Task 12-6 compliance check | 12 | spec_created | 14 項目 |
| 8 | same-wave sync | 12 | spec_created | aiworkflow / 親 UT-06-FU-A |
| 9 | 二重 ledger 同期 | 12 | spec_created | drift 0 |

## 成果物（正本 7 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 index と正本 7 成果物ナビ |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生）+ Part 2（技術者） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/1-B/1-C + Step 2 |
| 履歴 | outputs/phase-12/documentation-changelog.md | 全変更ファイル一覧 / reviewer / 2026-05-01 |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 0 件でも必須 |
| FB | outputs/phase-12/skill-feedback-report.md | 改善点なしでも必須 |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | 14 チェック項目 |
| メタ | artifacts.json (root) | Phase 12 状態の更新 |
| メタ | outputs/artifacts.json | 生成物 ledger 同期 |

## 完了条件【Task 12-1〜12-6 各成果物パスを列挙】

- [ ] `outputs/phase-12/main.md` が補助 index として出力されている
- [ ] `outputs/phase-12/implementation-guide.md`（Task 12-1）が Part 1 / Part 2 構成で出力
- [ ] Part 1 に日常の例え話が 4 つ以上含まれる
- [ ] `outputs/phase-12/system-spec-update-summary.md`（Task 12-2）が出力
- [ ] Step 1-A / 1-B / 1-C / Step 2 が明記
- [ ] `outputs/phase-12/documentation-changelog.md`（Task 12-3）が出力
- [ ] `outputs/phase-12/unassigned-task-detection.md`（Task 12-4）が 0 件でも出力
- [ ] `outputs/phase-12/skill-feedback-report.md`（Task 12-5）が改善点なしでも出力
- [ ] `outputs/phase-12/phase12-task-spec-compliance-check.md`（Task 12-6）が出力
- [x] same-wave sync（aiworkflow-requirements `deployment-cloudflare-opennext-workers.md` / indexes / task-workflow / changelog）完了
- [ ] 二重 ledger（root + outputs の artifacts.json）が同期
- [ ] `apps/web/wrangler.toml` / `apps/api/wrangler.toml` への変更が本 PR に非混入
- [ ] 全 CLI が `bash scripts/cf.sh` 経由（wrangler 直呼び 0 件）
- [ ] script 内に destructive 呼び出し 0 件
- [ ] redaction grep で実値混入 0 件

## タスク 100% 実行確認【必須】

- 全実行タスク（9 件）の状態が `completed`
- 正本 7 成果物が `outputs/phase-12/` に配置される設計
- artifacts.json の `phases[11].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成)
- 引き継ぎ事項:
  - doc-update-history の変更ファイル一覧 → PR description 草案の根拠
  - Task 12-1 implementation-guide → PR description の概要パートに転記
  - Task 12-4 unassigned-task-detection → 関連タスク（CI 組込 / golden 自動更新 / cf.sh 拡張）の起票候補
  - Task 12-5 skill-feedback-report → SKILL.md / references 改善候補として後続タスクへ申し送り
  - PR description に `Refs #329`（Issue クローズ済みのため Closes 不使用）を明記
- ブロック条件:
  - 正本 7 ファイルのいずれかが欠落
  - same-wave sync 未完了
  - 二重 ledger に drift がある
  - implementation-guide に `wrangler` 直呼びサンプルが残存
  - 実 token / 実 sink URL / 実 secret 値が outputs に転記されている
