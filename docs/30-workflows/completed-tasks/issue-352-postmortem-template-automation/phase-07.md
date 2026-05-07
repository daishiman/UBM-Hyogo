# Phase 7: AC マトリクス — issue-352-postmortem-template-automation

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-09c-postmortem-template-automation-001 |
| phase | 7 / 13 |
| wave | 09c-fu |
| mode | parallel（実依存は serial: 09c → 本タスク） |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| visualEvidenceClass | NON_VISUAL |
| priority | low |
| scale | small |
| GitHub Issue | #352 |

## 目的

index.md の AC-1..AC-10 を `verification step（コマンド・期待値）`・`Phase 4 TC ID`・`Phase 6 ER ID`・`evidence path` と 1:1 対応させ、漏れなく Phase 9 / Phase 11 で検証可能にする。

NON_VISUAL タスクのため screenshot 列は **「N/A: NON_VISUAL（runbook + script test で代替）」** と明記する。代替 evidence として coverage report / vitest report / grep result / CLI smoke の stdout/stderr を使う。

## 実行タスク

1. AC-1..AC-10 を verification step（コマンド・期待値）と 1:1 で表に展開する。
2. 各 AC を Phase 4 のどの TC ID に紐付けるかを map で示す。
3. NON_VISUAL の screenshot 代替 evidence を列挙する。
4. 漏れチェック（AC 全件が TC 1 件以上 + evidence path 1 件以上を持つ）を行う。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| index.md | `docs/30-workflows/issue-352-postmortem-template-automation/index.md` | AC-1..AC-10 |
| Phase 1 | `outputs/phase-01/main.md` | AC-1..AC-10 詳細 |
| Phase 4 | `outputs/phase-04/main.md` | TC-U-01..TC-U-10 / TC-S-01 |
| Phase 5 | `outputs/phase-05/main.md` | grep gate / 検証コマンド |
| Phase 6 | `outputs/phase-06/main.md` | ER-01..ER-06 |
| coverage standards | `.claude/skills/task-specification-creator/references/coverage-standards.md` | 80% 基準 |

## AC × Verification × TC × Evidence マトリクス

| AC | 内容 | verification step（コマンド） | 期待値 | 紐付く TC | 紐付く ER | evidence path | screenshot |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | `pnpm postmortem:generate -- --release vX.Y.Z --commit <sha> --evidence <path> --rollback-evidence <path> --out <out>` が exit code 0 で markdown を出力 | `mise exec -- pnpm postmortem:generate -- --release v0.0.0 --commit deadbeef --evidence docs/30-workflows/completed-tasks/09c-.../outputs/phase-11/ --rollback-evidence /tmp/rollback-empty.md --occurred-at 2026-05-05T00:00:00Z --out /tmp/postmortem-smoke.md` | exit 0 / `/tmp/postmortem-smoke.md` 生成 | TC-U-02, TC-U-07, TC-S-01 | ER-05（負ケース） | `outputs/phase-11/cli-smoke-stdout.txt`、`outputs/phase-11/cli-smoke-exit-code.txt` | N/A: NON_VISUAL（runbook + script test で代替） |
| AC-2 | 出力 markdown に timeline / impact / detection / response / root cause / prevention / follow-up issues の 7 見出し（+ Header）が順序通り含まれる | `mise exec -- pnpm vitest run scripts/postmortem -t "TC-U-01"` | PASS（7 見出し正規表現が定義順 hit） | TC-U-01, TC-U-02, TC-S-01 | - | `outputs/phase-09/vitest-report.txt`、`outputs/phase-11/postmortem-smoke.md` | N/A: NON_VISUAL |
| AC-3 | 出力 markdown に blame 表現（"責任" / "blame" / "fault" / "responsible" / "誰が" / 人名・部署名固有名詞）が含まれない | `mise exec -- pnpm vitest run scripts/postmortem -t "TC-U-05"` && `rg -i "責任|blame|fault|responsible|誰が" docs/30-workflows/runbooks/postmortem/ scripts/postmortem/` | TC PASS / grep 0 hit | TC-U-05 | - | `outputs/phase-09/vitest-report.txt`、`outputs/phase-11/grep-result-blame.txt` | N/A: NON_VISUAL |
| AC-4 | `--evidence` で指定された 09c Phase 11 evidence path が存在しない場合、exit code 非 0 + stderr にエラー理由を出力 | `mise exec -- pnpm postmortem:generate -- --release v0.0.0 --commit deadbeef --evidence /tmp/nonexistent --rollback-evidence /tmp/rollback-empty.md --occurred-at 2026-05-05T00:00:00Z; echo "exit=$?"` | exit 1 / stderr に `evidence path not found` | TC-U-03, TC-U-04 | ER-01, ER-02 | `outputs/phase-09/vitest-report.txt`、`outputs/phase-11/cli-evidence-missing-stderr.txt` | N/A: NON_VISUAL |
| AC-5 | `--release` / `--commit` の形式バリデーション（release は `v\d+\.\d+\.\d+`、commit は `[0-9a-f]{7,40}`）が機能し、不正値は exit code 非 0 で拒否 | `mise exec -- pnpm postmortem:generate -- --release v1.2 --commit zzz --evidence ... --rollback-evidence ... --occurred-at ...; echo "exit=$?"` | exit 1 / stderr に `invalid release` または `invalid commit` | TC-U-09 | ER-03, ER-04 | `outputs/phase-09/vitest-report.txt`、`outputs/phase-11/cli-validation-stderr.txt` | N/A: NON_VISUAL |
| AC-6 | `generatePostmortem(input)` 関数は副作用なしで markdown 文字列を返す pure 関数として unit test 可能 | `mise exec -- pnpm vitest run scripts/postmortem -t "TC-U-01"`（直接 import して呼ぶ test 構造で構造的に証明） | PASS | TC-U-01, TC-U-02, TC-U-05, TC-U-06, TC-U-08 | - | `outputs/phase-09/vitest-report.txt`、`scripts/postmortem/__tests__/generate-postmortem.test.ts` | N/A: NON_VISUAL |
| AC-7 | 同一入力で 2 回実行した結果が完全一致（冪等性 / `Date.now()` 等の非決定要素は input から渡す） | `mise exec -- pnpm vitest run scripts/postmortem -t "TC-U-06"` && `rg -n "Date\.now\|Math\.random\|process\.env\.HOSTNAME" scripts/postmortem/generate-postmortem.ts` | TC PASS / grep 0 hit | TC-U-06 | ER-06 | `outputs/phase-09/vitest-report.txt`、`outputs/phase-11/grep-result-nondeterministic.txt` | N/A: NON_VISUAL |
| AC-8 | runbook README に follow-up issue 作成手順（`gh issue create` テンプレ）が記載 | `rg -n "gh issue create" docs/30-workflows/runbooks/postmortem/README.md && rg -n "\[postmortem-followup\]" docs/30-workflows/runbooks/postmortem/README.md` | 双方 1 hit 以上 | TC-U-08 | - | `outputs/phase-11/grep-result-gh-cli.txt`、`docs/30-workflows/runbooks/postmortem/README.md` | N/A: NON_VISUAL |
| AC-9 | `docs/30-workflows/runbooks/postmortem/README.md` から incident response runbook 本文への参照リンクのみで本文置換なし（grep gate） | `git diff --name-only main...HEAD \| rg -v '^(scripts/postmortem/\|docs/30-workflows/runbooks/postmortem/\|package.json$\|pnpm-lock\.yaml$)'`、加えて既存 incident response runbook diff 0 件 | 0 行（想定外の path 変更なし） | - | - | `outputs/phase-11/grep-result-runbook-diff.txt` | N/A: NON_VISUAL |
| AC-10 | unit line 80%+ / branch 60%+（本タスクでは Phase 4 で Statements/Branches/Functions/Lines 全て 80%+ に上書き）、結合は CLI smoke 1 件以上で合格 | `mise exec -- pnpm vitest run scripts/postmortem --coverage` && `bash scripts/coverage-guard.sh` && TC-S-01 実行 | coverage 4 メトリクス >=80% / `coverage-guard.sh` exit 0 / TC-S-01 PASS | TC-U-01..TC-U-10, TC-S-01 | - | `outputs/phase-09/coverage-report/`、`outputs/phase-09/coverage-guard-stdout.txt`、`outputs/phase-11/cli-smoke-stdout.txt` | N/A: NON_VISUAL |

## screenshot 列の扱い（NON_VISUAL）

本タスクは **`visualEvidence: NON_VISUAL`** / **`visualEvidenceClass: NON_VISUAL`** であるため、AC-1..AC-10 の screenshot 列は全て **「N/A: NON_VISUAL（runbook + script test で代替）」** と明記する。代替 evidence は以下の通り Phase 9 / Phase 11 で取得する:

| 代替 evidence type | 取得 phase | 取得方法 | 個数（最低） |
| --- | --- | --- | --- |
| vitest report（unit test 結果） | Phase 9 | `mise exec -- pnpm vitest run scripts/postmortem` の stdout を保存 | 1 |
| coverage report | Phase 9 | `mise exec -- pnpm vitest run scripts/postmortem --coverage` の出力（`coverage/` 配下を `outputs/phase-09/coverage-report/` にコピー） | 1 |
| coverage-guard 結果 | Phase 9 | `bash scripts/coverage-guard.sh > outputs/phase-09/coverage-guard-stdout.txt 2>&1; echo "exit=$?" >> ...` | 1 |
| grep result（blame / nondeterministic / runbook diff / gh CLI） | Phase 11 | `rg` 実行結果を `outputs/phase-11/grep-result-*.txt` に保存 | 4 |
| CLI smoke stdout / stderr / exit code | Phase 11 | TC-S-01 / 負ケース（AC-4 / AC-5）の実行結果を `outputs/phase-11/cli-*.txt` に保存 | 3 ファイル以上 |
| 実生成 postmortem サンプル | Phase 11 | TC-S-01 で `--out` 出力した markdown 1 本を `outputs/phase-11/postmortem-smoke.md` として保存 | 1 |

## AC × TC マップ（Phase 4 への逆引き）

| AC | カバー TC（Phase 4） |
| --- | --- |
| AC-1 | TC-U-02, TC-U-07, TC-S-01 |
| AC-2 | TC-U-01, TC-U-02, TC-S-01 |
| AC-3 | TC-U-05 |
| AC-4 | TC-U-03, TC-U-04 |
| AC-5 | TC-U-09 |
| AC-6 | TC-U-01, TC-U-02, TC-U-05, TC-U-06, TC-U-08（pure 関数を直接 import する test 構造で構造的証明） |
| AC-7 | TC-U-06 |
| AC-8 | TC-U-08 |
| AC-9 | （TC ではなく Phase 5 ステップ 9 / Phase 11 grep gate でカバー） |
| AC-10 | TC-U-01..TC-U-10 + TC-S-01 + Phase 9 coverage 集計 |

## AC × ER マップ（Phase 6 への逆引き）

| AC | カバー ER（Phase 6） |
| --- | --- |
| AC-1 | ER-05（負ケースで I/O 失敗 = exit 2） |
| AC-4 | ER-01, ER-02 |
| AC-5 | ER-03, ER-04 |
| AC-7 | ER-06（空 rollback evidence でも冪等） |
| AC-2, AC-3, AC-6, AC-8, AC-9, AC-10 | ER 紐付けなし（正常系で証明） |

## 漏れチェック

- [x] AC-1..AC-10 全てが verification step（コマンド）を持つ
- [x] AC-1..AC-10 全てが evidence path を持つ
- [x] AC-1..AC-10 全てが TC 1 件以上 / または grep gate でカバーされている
- [x] screenshot 列が全て「N/A: NON_VISUAL」で埋まっている
- [x] NON_VISUAL の代替 evidence type が 6 種以上列挙されている
- [x] AC-9（runbook 本文置換なし）が Phase 5 ステップ 9 grep gate と Phase 11 evidence で紐付き
- [x] AC-10（カバレッジ）が Phase 9 で `coverage-guard.sh` exit 0 含む完了条件と紐付き

## 多角的チェック観点

- AC × TC × ER の 3 軸でブランクが残っていないか（AC-9 のみ TC ではなく grep gate で OK）
- screenshot 列を空欄のまま残していないか（NON_VISUAL なら明示的に N/A 記載）
- 代替 evidence の取得 phase（Phase 9 / Phase 11）が決まっているか
- AC-3（blame 排除）と AC-9（runbook 本文置換なし）が grep gate でカバー二重化されているか（S1 / S3 の最終防衛線）
- AC-7（冪等性）の grep gate が `Date.now` / `Math.random` / `process.env.HOSTNAME` を全て含むか（S4）

## サブタスク管理

- [ ] AC-1..AC-10 を verification step / TC / ER / evidence の 4 軸で表化
- [ ] screenshot 列を全件 N/A: NON_VISUAL に統一
- [ ] AC × TC マップ確定
- [ ] AC × ER マップ確定
- [ ] 代替 evidence type 6 種以上を列挙
- [ ] 漏れチェック完了
- [ ] `outputs/phase-07/main.md` 作成

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| AC マトリクス | `outputs/phase-07/main.md` | AC × verification × TC × ER × evidence の 5 軸表 |

## 完了条件

- [ ] AC-1..AC-10 全てに verification step（コマンド）と期待値が紐付く
- [ ] AC-1..AC-10 全てに TC 1 件以上 / または grep gate が紐付く
- [ ] AC-1..AC-10 全てに evidence path が紐付く
- [ ] screenshot 列が全件「N/A: NON_VISUAL（runbook + script test で代替）」
- [ ] 代替 evidence type が 6 種以上列挙されている
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] AC × evidence のクロスマトリクスにブランクがない
- [ ] visualEvidence が NON_VISUAL であることが phase 全体で一貫している
- [ ] 09c の本文（phase-06.md / phase-11.md / runbook 等）を編集していない

## 次 Phase への引き渡し

Phase 8 へ、AC マトリクス（5 軸表）と DRY 化対象（Phase 5 で再利用すべき helper / 既存 `scripts/coverage-guard.ts` パターン / `node:util` parseArgs の共通化候補）を渡す。Phase 8 では `scripts/postmortem/generate-postmortem.ts` の関数分割が DRY 原則を満たしているか、template.md の placeholder 規約を README から transclusion できるかを再評価する。
