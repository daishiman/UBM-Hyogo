# Phase 11: NON_VISUAL evidence — issue-352-postmortem-template-automation

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-09c-postmortem-template-automation-001 |
| phase | 11 / 13 |
| wave | 09c-fu |
| mode | parallel（実依存は serial: 09c → 本タスク） |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | **NON_VISUAL** |
| visualEvidenceClass | NON_VISUAL |
| priority | low |
| scale | small |
| GitHub Issue | #352 |
| capture mode | NON_VISUAL（screenshot / Playwright trace 不要） |
| status policy | `completed` を目標。代替 evidence 5 件揃いで PASS |

## 目的

本タスクは **NON_VISUAL** タスクである。生成物は Node.js CLI スクリプトと markdown runbook / template であり、UI 差分は発生しない。よって従来の screenshot / Playwright trace は取得**しない**。

代わりに `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` の代替 evidence 規約に従い、以下 5 件の machine-readable な evidence を取得し、`outputs/phase-11/main.md` から index する。

## NON_VISUAL 宣言

> 本タスクは NON_VISUAL である。理由:
>
> 1. 成果物は `scripts/postmortem/generate-postmortem.ts`（CLI スクリプト）/ `template.md` / `README.md`（markdown runbook）/ `package.json` の追記であり、UI レンダリングを伴わない
> 2. `apps/web` / `apps/api` を一切変更せず、ブラウザ表示で確認できる対象が存在しない
> 3. 検証は CLI 実行ログ / grep 結果 / diff 結果 / unit テスト結果 / coverage 結果 で完結する

screenshot は取得しない。代替 evidence 5 件で AC-1..AC-10 をカバーする。

## 苦戦箇所 S1-S5（前 phase から転記）

- S1: blame 表現禁止 → `blame-vocabulary-check.md` で 0 hit 確認
- S2: 09c Phase 11 evidence path 必須 → `script-execution.md` の異常系セクション
- S3: runbook 責務分離 → `redaction-check.md` + `git diff` 結果
- S4: 冪等性 → `idempotency-check.md`
- S5: pnpm スクリプト統合 → `script-execution.md` で `pnpm postmortem:generate` 実行ログ

## Pre-conditions

| GATE | 条件 |
| --- | --- |
| PRE-1 | Phase 10 が PASS / MINOR |
| PRE-2 | `scripts/postmortem/generate-postmortem.ts` 実装本体が local に存在 |
| PRE-3 | `package.json` に `scripts.postmortem:generate` が追加済み |
| PRE-4 | `docs/30-workflows/runbooks/postmortem/template.md` / `README.md` が存在 |
| PRE-5 | 09c Phase 11 evidence `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/main.md` が存在 |
| PRE-6 | unit 全 TC PASS / coverage ≥ 80%（Phase 9 完了） |

## 環境

| 項目 | 値 |
| --- | --- |
| Node | 24.15.0（mise 経由） |
| pnpm | 10.33.2 |
| OS | macOS / Linux（CLI 実行のみ） |
| 出力ディレクトリ | `outputs/phase-11/` |

## 取得対象 evidence（5 件 + main.md）

保存先: `outputs/phase-11/`

| # | ファイル | 役割 | 紐付く AC | 紐付く S |
| --- | --- | --- | --- | --- |
| 0 | `outputs/phase-11/main.md` | NON_VISUAL 宣言 / 代替 evidence 差分表 / index リンク | AC 全体 | S1-S5 |
| 1 | `outputs/phase-11/script-execution.md` | `pnpm postmortem:generate` を sample 入力で実行したログ（正常系・異常系） | AC-1 / AC-4 / AC-5 / AC-8 | S2 / S5 |
| 2 | `outputs/phase-11/template-headings-grep.md` | 生成 markdown と template.md の必須見出し 7 種が順序通り存在することの grep 結果 | AC-2 | S1 |
| 3 | `outputs/phase-11/blame-vocabulary-check.md` | blame 候補語（responsible / blame / fault / 責任 等）が出力 / template / コードに含まれないことの grep | AC-3 | S1 |
| 4 | `outputs/phase-11/idempotency-check.md` | 同入力で 2 回実行 → `diff` 0 行（冪等性）の確認結果 | AC-7 | S4 |
| 5 | `outputs/phase-11/redaction-check.md` | secret / token / メールアドレス / API キー等が出力 markdown / template に混入していないことの grep + 既存 runbook 本文無編集 diff | AC-9 | S1 / S3 |

## 代替 evidence 差分表（必須テンプレ）

`outputs/phase-11/main.md` に必ず含める:

```markdown
## 代替 evidence 差分表

| Phase 11 シナリオ | 元前提（VISUAL タスク） | 採用した代替手段（NON_VISUAL） | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| S1 (blame 排除) | UI で見出し目視 | `blame-vocabulary-check.md`（rg 0 hit） | コード / template / 出力 markdown 全層 | （カバー済み） |
| S2 (evidence 必須) | スクリーンショットで UI エラー表示 | `script-execution.md` 異常系: `--evidence /nonexistent` で exit 1 + stderr | CLI 入力検証 | runtime での実 incident 適用は運用 task |
| S3 (runbook 責務分離) | UI 上の runbook 表示 | `redaction-check.md` 内 `git diff` 09c phase-06 / incident response = 0 line | リポジトリ静的状態 | （カバー済み） |
| S4 (冪等性) | UI で再描画一致 | `idempotency-check.md` の `diff` 0 行 | スクリプト出力 | （カバー済み） |
| S5 (pnpm 統合) | UI で実行ボタン | `script-execution.md` で `mise exec -- pnpm postmortem:generate` 実行ログ | スクリプト起動経路 | （カバー済み） |
| 7 見出し順序 (AC-2) | UI 目視 | `template-headings-grep.md` で順序付き grep | 出力 markdown | （カバー済み） |
| 実 incident 適用 | - | （本タスクでは保証しない） | - | 初回 incident 発生時の運用検証へ申し送り |
```

## evidence 取得手順

### evidence 1: `script-execution.md`

```bash
# 正常系
mise exec -- pnpm postmortem:generate -- \
  --release v0.0.0 --commit deadbee \
  --evidence docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/ \
  --rollback-evidence /tmp/dummy-rollback.md \
  --occurred-at 2026-05-05T00:00:00Z \
  --out outputs/phase-11/sample-postmortem.md
echo "exit=$?"            # 0 期待
ls -la outputs/phase-11/sample-postmortem.md

# 異常系: evidence path 不在 (AC-4)
mise exec -- pnpm postmortem:generate -- \
  --release v0.0.0 --commit deadbee \
  --evidence /nonexistent/path/ \
  --rollback-evidence /tmp/dummy-rollback.md \
  --occurred-at 2026-05-05T00:00:00Z 2>&1 | tee -a outputs/phase-11/script-execution.md
echo "exit=$?"            # 1 期待

# 異常系: release / commit 形式不正 (AC-5)
mise exec -- pnpm postmortem:generate -- --release foo --commit zzz \
  --evidence docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/ \
  --rollback-evidence /tmp/dummy-rollback.md --occurred-at 2026-05-05T00:00:00Z 2>&1 | tee -a outputs/phase-11/script-execution.md
echo "exit=$?"            # 1 期待
```

`script-execution.md` には実行コマンド / 終了コード / 所要時間 / 実行者 / 実行日時 を記録する。

### evidence 2: `template-headings-grep.md`

```bash
# 出力 markdown の見出し順序確認 (AC-2)
grep -n "^## " outputs/phase-11/sample-postmortem.md | tee outputs/phase-11/template-headings-grep.md
# 期待: Header / Timeline / Impact / Detection / Response / Root Cause / Prevention / Follow-up Issues の順

# template.md の見出し順序確認
grep -n "^## " docs/30-workflows/runbooks/postmortem/template.md | tee -a outputs/phase-11/template-headings-grep.md
```

期待出力（順序）:

```
## Header
## Timeline
## Impact
## Detection
## Response
## Root Cause
## Prevention
## Follow-up Issues
```

### evidence 3: `blame-vocabulary-check.md`

```bash
# AC-3 / S1: blame 表現が含まれないことの grep
{
  echo "## scripts/postmortem"
  rg -n -i "responsible|blame|fault|責任|誰が悪い" scripts/postmortem/ || echo "0 hit"
  echo "## docs/30-workflows/runbooks/postmortem"
  rg -n -i "responsible|blame|fault|責任|誰が悪い" docs/30-workflows/runbooks/postmortem/ || echo "0 hit"
  echo "## generated sample"
  rg -n -i "responsible|blame|fault|責任|誰が悪い" outputs/phase-11/sample-postmortem.md || echo "0 hit"
} > outputs/phase-11/blame-vocabulary-check.md
```

期待: 全セクション「0 hit」。

### evidence 4: `idempotency-check.md`

```bash
# AC-7 / S4: 同入力 2 回実行で完全一致
mise exec -- pnpm postmortem:generate -- --release v0.0.0 --commit deadbee \
  --evidence docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/ \
  --rollback-evidence /tmp/dummy-rollback.md --occurred-at 2026-05-05T00:00:00Z --out /tmp/pm-1.md
mise exec -- pnpm postmortem:generate -- --release v0.0.0 --commit deadbee \
  --evidence docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/ \
  --rollback-evidence /tmp/dummy-rollback.md --occurred-at 2026-05-05T00:00:00Z --out /tmp/pm-2.md
{
  echo "## diff result"
  diff /tmp/pm-1.md /tmp/pm-2.md && echo "0 diff (idempotent)"
  echo ""
  echo "## sha256"
  shasum -a 256 /tmp/pm-1.md /tmp/pm-2.md
} > outputs/phase-11/idempotency-check.md
```

期待: `diff` が 0 行・sha256 が一致。

### evidence 5: `redaction-check.md`

```bash
# secret / token / メールアドレス等が出力に混入していない (AC-9 / S1)
{
  echo "## secret patterns in generated postmortem"
  rg -n -i "api[_-]?token|oauth|secret|bearer|password|@[a-z0-9.\-]+\.[a-z]{2,}" outputs/phase-11/sample-postmortem.md || echo "0 hit"
  rg -n "AKIA|ghp_|xox[baprs]-|sk-[A-Za-z0-9]{20,}" outputs/phase-11/sample-postmortem.md || echo "0 hit"

  echo "## secret patterns in template.md / README.md"
  rg -n -i "api[_-]?token|oauth|secret|bearer|password|@[a-z0-9.\-]+\.[a-z]{2,}" docs/30-workflows/runbooks/postmortem/ || echo "0 hit (placeholder のみ)"

  echo "## process.env reference (S4 周辺)"
  rg -n "process\.env" scripts/postmortem/ || echo "0 hit (env 非依存)"

  echo "## existing runbook diff (S3)"
  git diff main...HEAD -- docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/ | wc -l
  # 期待: 0 行

  echo "## incident response runbook diff (S3)"
  git diff main...HEAD -- docs/30-workflows/runbooks/incident-response/ 2>/dev/null | wc -l
  # 期待: 0 行（存在しない場合も 0）
} > outputs/phase-11/redaction-check.md
```

期待: 全セクション「0 hit」または「0 行」。

## N/A 理由テーブル（screenshot 列）

| TC | UI 状態（仮想） | screenshot ファイル | 取得 | N/A 理由 |
| --- | --- | --- | --- | --- |
| TC-CLI-01 | 正常系 markdown 生成 | - | 取得しない | NON_VISUAL: スクリプト + runbook タスク（UI なし） |
| TC-CLI-02 | evidence 不在エラー | - | 取得しない | NON_VISUAL: stderr テキストで `script-execution.md` に記録 |
| TC-CLI-03 | release / commit 形式不正 | - | 取得しない | NON_VISUAL: stderr テキストで `script-execution.md` に記録 |
| TC-CLI-04 | 冪等性 | - | 取得しない | NON_VISUAL: `diff` 0 行で `idempotency-check.md` に記録 |
| TC-CLI-05 | blame 表現排除 | - | 取得しない | NON_VISUAL: grep 0 hit で `blame-vocabulary-check.md` に記録 |

screenshot 全列が **NON_VISUAL: スクリプト + runbook タスク** の理由で N/A。代わりに上記 5 件の machine-readable evidence で AC をカバーする。

## 多角的チェック観点

- 5 件の evidence ファイルが**全て**作成されているか（不足 1 件でも MINOR 判定）
- `script-execution.md` の正常系 exit 0 / 異常系 exit 1 が両方記録されているか
- `idempotency-check.md` の diff が 0 行であり、sha256 一致まで記録されているか
- `blame-vocabulary-check.md` / `redaction-check.md` が「0 hit」を明示記録しているか（grep が空出力でも記録上空欄にしない）
- 09c Phase 11 evidence path 参照リンクが `outputs/phase-11/sample-postmortem.md` 内で生きているか（`test -e` で確認可能）

## サブタスク管理

- [ ] PRE-1..6 を確認
- [ ] `outputs/phase-11/main.md` に NON_VISUAL 宣言 / 代替 evidence 差分表を記載
- [ ] `outputs/phase-11/script-execution.md` 取得（正常系 + 異常系 2 種）
- [ ] `outputs/phase-11/template-headings-grep.md` 取得（7 見出し順序）
- [ ] `outputs/phase-11/blame-vocabulary-check.md` 取得（0 hit）
- [ ] `outputs/phase-11/idempotency-check.md` 取得（diff 0）
- [ ] `outputs/phase-11/redaction-check.md` 取得（0 hit / 0 行）
- [ ] N/A 理由テーブル（screenshot 全列 NON_VISUAL）を `main.md` に記載
- [ ] 09c Phase 11 evidence path 参照リンクの生存確認

## 成果物

| 成果物 | パス | 必須 |
| --- | --- | --- |
| index | `outputs/phase-11/main.md` | ✅ |
| 実行ログ | `outputs/phase-11/script-execution.md` | ✅ |
| 見出し grep | `outputs/phase-11/template-headings-grep.md` | ✅ |
| blame grep | `outputs/phase-11/blame-vocabulary-check.md` | ✅ |
| 冪等性 diff | `outputs/phase-11/idempotency-check.md` | ✅ |
| 秘密情報 / 責務分離 grep | `outputs/phase-11/redaction-check.md` | ✅ |
| 生成サンプル | `outputs/phase-11/sample-postmortem.md` | ✅（CLI smoke 出力本体） |
| screenshot | - | ❌ NON_VISUAL のため取得しない |
| Playwright trace | - | ❌ NON_VISUAL のため取得しない |

## 完了条件

- [ ] PRE-1..6 が全成立
- [ ] `outputs/phase-11/main.md` に NON_VISUAL 宣言 / 代替 evidence 差分表 / N/A 理由テーブル / 5 件 evidence への index リンク が揃う
- [ ] 上記 5 件 evidence ファイル（script-execution / template-headings-grep / blame-vocabulary-check / idempotency-check / redaction-check）が**全て**作成される
- [ ] vitest 全 TC が green（Phase 9 PASS の継続）
- [ ] `bash scripts/coverage-guard.sh` exit 0（Phase 9 から継続）
- [ ] 09c Phase 11 evidence path（`docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/main.md`）への参照が機能している
- [ ] AC-1..AC-10 と evidence の対応が `main.md` に記載
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 仕様書段階では実 evidence ファイルを生成していない（Phase 5 実装後に Phase 11 で取得する手順整備のみ）
- [ ] 実装、deploy、commit、push、PR を実行していない（user 承認は Phase 13）
- [ ] NON_VISUAL を VISUAL に読み替えていない（screenshot を要求していない）
- [ ] 既存 incident response runbook / 09c phase-06 本文に diff が出ていない（S3）

## 次 Phase への引き渡し

Phase 12 へ、5 件 NON_VISUAL evidence の path、`main.md` の代替 evidence 差分表、N/A 理由テーブル、AC-evidence 対応、09c Phase 11 evidence path 参照の生存結果を渡す。Phase 12 では `implementation-guide.md` / `system-spec-update-summary.md` / `unassigned-task-detection.md` の更新と、上流 `docs/30-workflows/unassigned-task/task-09c-postmortem-template-automation-001.md` の status 同期を行う。
