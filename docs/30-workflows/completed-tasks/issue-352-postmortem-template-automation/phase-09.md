# Phase 9: 品質保証 — issue-352-postmortem-template-automation

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-09c-postmortem-template-automation-001 |
| phase | 9 / 13 |
| wave | 09c-fu |
| mode | parallel（実依存は serial: 09c → 本タスク） |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| priority | low |
| scale | small |
| GitHub Issue | #352 |

## 目的

typecheck / lint / format / unit / coverage / grep gate / secret hygiene を全 PASS にし、Phase 10 最終レビューに渡せる状態を作る。
特に **AC-3（blame 表現禁止）/ AC-7（冪等性）/ AC-10（coverage line 80%+ / branch 60%+）** を機械的に検証する。

## 苦戦箇所 S1-S5（前 phase から転記）

- S1: blame 表現禁止
- S2: 09c Phase 11 evidence path 必須
- S3: runbook 責務分離
- S4: 冪等性
- S5: pnpm スクリプト統合

## ローカル実行・検証コマンド（CONST_005）

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm format --check
mise exec -- pnpm vitest run scripts/postmortem
mise exec -- pnpm vitest run scripts/postmortem --coverage
bash scripts/coverage-guard.sh             # exit 0 必須
mise exec -- pnpm postmortem:generate -- --release v0.0.0 --commit deadbee \
  --evidence docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/ \
  --rollback-evidence /tmp/dummy-rollback.md \
  --occurred-at 2026-05-05T00:00:00Z --out /tmp/pm-1.md
mise exec -- pnpm postmortem:generate -- --release v0.0.0 --commit deadbee \
  --evidence docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/ \
  --rollback-evidence /tmp/dummy-rollback.md \
  --occurred-at 2026-05-05T00:00:00Z --out /tmp/pm-2.md
diff /tmp/pm-1.md /tmp/pm-2.md             # 0 diff（AC-7 冪等性）
```

## PASS 基準

| 項目 | 基準 | 紐付く AC |
| --- | --- | --- |
| typecheck | error 0 | - |
| lint | warn / error 0 | - |
| format | `prettier --check` PASS | - |
| unit（Phase 4 全 TC） | 全 PASS | AC-1..AC-7 |
| coverage（`scripts/postmortem/**`） | Statements ≥ 80% / Branches ≥ 80% / Functions ≥ 80% / Lines ≥ 80% | AC-10 |
| `bash scripts/coverage-guard.sh` | exit 0 | AC-10 |
| 冪等性 diff | `diff /tmp/pm-1.md /tmp/pm-2.md` 0 行 | AC-7 |
| CLI smoke（正常系） | exit 0 + markdown 出力 | AC-1 |
| CLI smoke（異常系） | `--evidence` 不在で exit 1 + stderr メッセージ | AC-4 |
| CLI smoke（バリデーション） | `--release foo` `--commit zzz` で exit 1 | AC-5 |

> **coverage 目標**: Phase 1 では line 80% / branch 60% を最低基準として明記したが、本 Phase では **scripts/postmortem 配下に限定して全指標 80% 以上**を目標とする（小規模スクリプトのため達成容易・かつ AC-3 / AC-7 を branch 側で確実に踏むため）。CI / `scripts/coverage-guard.sh` の閾値設定が更に低い場合、本タスク内の追加 TC でカバレッジを満たせばよい。

## grep gate 一覧

```bash
# AC-3 / S1: blame 表現がコード / template / 出力 markdown に含まれない
rg -n -i "responsible|blame|fault|責任|誰が悪い" \
  scripts/postmortem/ docs/30-workflows/runbooks/postmortem/   # 0 hit 期待

# AC-7 / S4: 非決定要素が generatePostmortem に含まれない
rg -n "Date\.now\(\)|Math\.random\(\)|process\.hrtime|crypto\.randomUUID" \
  scripts/postmortem/generate-postmortem.ts  # 0 hit 期待（main 関数の error 出力では未使用を確認）

# S3: runbook README から既存 incident response 本文への置換的記述がないか
rg -n "incident response runbook|本文置換|本文を上書き" \
  docs/30-workflows/runbooks/postmortem/README.md  # link 形式以外の出現 0 hit

# S5: package.json に postmortem:generate が登録
grep -q '"postmortem:generate"' package.json && echo OK
```

## runbook（template.md / README.md）レビュー観点

markdownlint / 手動レビューで以下を確認:

| 観点 | チェック内容 |
| --- | --- |
| 見出し階層 | template.md は H1 → H2 の単純構造、見出し 7 種が順序通り並ぶ |
| placeholder 形式 | `{{release}}` `{{commit}}` 等が統一書式で記載 |
| 言語混在 | 見出しは英語固定（Timeline / Impact / Root Cause 等）、説明は日本語 |
| 7 見出しの順序 | Header → Timeline → Impact → Detection → Response → Root Cause → Prevention → Follow-up Issues |
| README の責務記述 | 「postmortem 生成と follow-up issue 起票のみ」が冒頭に明記され、incident response 手順は外部 runbook へのリンクのみ |
| follow-up issue 手順 | `gh issue create` スニペットが完全形（title prefix / label / body template）で記載 |
| markdownlint | `mise exec -- pnpm dlx markdownlint-cli2 docs/30-workflows/runbooks/postmortem/**/*.md`（追加導入が許容されない場合は手動チェック） |

## secret hygiene 検証

postmortem 出力には API token / OAuth token / メールアドレス / 個人名 / 連絡先が含まれてはならない。
以下のいずれかを Phase 9 で実行する:

```bash
# 1) 既存 secret check スクリプトがある場合
test -x scripts/check-secrets.sh && bash scripts/check-secrets.sh /tmp/pm-1.md

# 2) 無い場合は grep で代替
rg -n -i "api[_-]?token|oauth|secret|bearer|password|@[a-z0-9.\-]+\.[a-z]{2,}|\b[A-Z0-9]{20,}\b" /tmp/pm-1.md  # 0 hit 期待
rg -n "AKIA|ghp_|xox[baprs]-|sk-[A-Za-z0-9]{20,}" /tmp/pm-1.md  # 0 hit 期待
```

template.md / README.md にも同 grep を適用し 0 hit を確認する（README には例示用 `<sha>` `<owner>` 等の placeholder のみが残ること）。

## PII / Secrets / Variables 配置確認

| 種別 | 例 | 本タスクでの取り扱い |
| --- | --- | --- |
| Secrets | API Token / OAuth Client Secret | 出力 markdown に転記禁止（grep で 0 hit を強制） |
| Variables | release tag / commit sha | CLI 入力経由で markdown 出力に含まれてよい（PII ではない） |
| ローカル `.env` | - | 本タスクは scripts/postmortem 内で env を参照しない（参照しないこと自体を grep で確認） |

```bash
rg -n "process\.env" scripts/postmortem/  # 0 hit 期待（env 非依存）
```

## 失敗時の自動修復方針

| 失敗 | 修復 |
| --- | --- |
| typecheck | unused / null 許容 / `parseArgs` の戻り値型を最小差分修正 |
| lint | `pnpm lint --fix` 先行 |
| format | `pnpm format --write` 先行 |
| unit | TC ID で原因切り分け（AC 番号 → TC → コード経路） |
| coverage 不足 | branch 不足は error 経路（不正 release / commit / evidence path 不在）を追加 |
| grep gate hit | リテラル文字列を定数化または別表現に変更（S1 違反は構造改修で対応） |
| 冪等性 diff | `Date.now()` 等の非決定要素を排除し、入力からの値のみで markdown を構成 |

最大 3 回まで自動修復を試行し、それでも PASS しなければ Phase 5（実装ランブック）に差し戻す。

## DoD（Phase 9）

- [ ] 上記コマンド全 PASS
- [ ] grep gate 一覧の期待値が全て一致（0 hit）
- [ ] coverage 目標達成（scripts/postmortem 配下 ≥ 80%）
- [ ] `bash scripts/coverage-guard.sh` exit 0
- [ ] secret hygiene grep が 0 hit
- [ ] 冪等性 diff 0
- [ ] runbook（template.md / README.md）の見出し / 7 見出し順序 / follow-up issue 手順を確認

## サブタスク管理

- [ ] typecheck / lint / format PASS
- [ ] unit 全 TC PASS
- [ ] coverage ≥ 80% 達成
- [ ] coverage-guard.sh exit 0
- [ ] grep gate 全 PASS（S1 / S4 / S3 / S5）
- [ ] CLI smoke（正常 / 異常 / バリデーション）PASS
- [ ] 冪等性 diff 0
- [ ] secret hygiene grep PASS
- [ ] runbook レビュー（markdownlint または手動）
- [ ] `outputs/phase-09/main.md` 作成

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 品質保証レポート | `outputs/phase-09/main.md` | PASS 基準各項目の結果記録 |
| coverage report | `outputs/phase-09/coverage/` | vitest coverage 出力 |
| grep result | `outputs/phase-09/grep-result.txt` | grep gate の実行ログ |
| secret hygiene | `outputs/phase-09/secret-hygiene.md` | secret 検査結果（0 hit 確認） |

## 完了条件

- [ ] PASS 基準を全て満たす
- [ ] `bash scripts/coverage-guard.sh` exit 0 が記録されている
- [ ] secret hygiene 検査結果が記録されている
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] commit / push / PR を実行していない（user 承認は Phase 13）
- [ ] 既存 runbook 本文を編集していない（S3）
- [ ] AC-3 grep / AC-7 冪等 diff / AC-10 coverage を全て機械的に確認した

## 次 Phase への引き渡し

Phase 10 へ、品質保証レポート / coverage 結果 / grep result / secret hygiene 結果 / 冪等性 diff 結果を渡す。
