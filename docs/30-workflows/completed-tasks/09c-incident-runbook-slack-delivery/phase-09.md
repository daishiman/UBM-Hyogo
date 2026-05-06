# Phase 9: 品質ゲート — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

判定根拠: 本 Phase は Phase 8 の実行結果に対する機械検証ゲート（typecheck / lint / unit / coverage / secret leak / aiworkflow indexes drift / workflow yaml validity / canonical doc 整合）の合否基準と検証コマンドを確定する。検証コマンドは実環境への副作用を伴わないが、PR 作成可否を分岐する gate として CONST_004 に従い実装仕様書扱いとする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-incident-runbook-slack-delivery |
| phase | 9 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Phase 6（実装）/ 7（テスト実装）/ 8（実行）の成果に対し、Phase 10 以降（リリース準備・PR 作成）へ進めるための機械検証ゲートを確定する。各ゲートは合否基準・検証コマンド・hard/soft 区分・失敗時 fallback を一意に持つ。

## 品質ゲートマトリクス

| # | ゲート名 | 検証内容 | 通過基準 | 検証コマンド | hard/soft |
| --- | --- | --- | --- | --- | --- |
| Q1 | typecheck | TypeScript 型整合 | exit 0 / 0 error | `mise exec -- pnpm typecheck` | hard |
| Q2 | lint | ESLint / markdown lint | exit 0 / 0 error / 0 warning | `mise exec -- pnpm lint` | hard |
| Q3 | unit test pass | Vitest 全件 pass | 15/15 pass（T1〜T15） | `mise exec -- pnpm vitest run --project scripts-notify` | hard |
| Q4 | coverage | scripts/notify のカバレッジ | lines/branches/functions/statements >= 80% | `mise exec -- pnpm vitest run --project scripts-notify --coverage` の summary | hard |
| Q5 | secret leak (real token) | real bot token 形式の混入ゼロ | real token regex 0 hit | `rg -n -e 'xox[abp]-[A-Za-z0-9-]{20,}|Bearer [A-Za-z0-9._-]{20,}' docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/` | hard |
| Q6 | secret leak (xoxp/xapp/Bearer) | 他 token 形式の混入ゼロ | 0 hit | `rg -n -e 'xox[pa]-\|Bearer [A-Za-z0-9._-]{8,}' outputs/ scripts/notify/` | hard |
| Q7 | dryrun evidence schema | dryrun 配信 evidence の必須キー充足 | jq exit 0 | `jq -e '.ok and .ts and .channel and .message.permalink and .mode == "dryrun"' docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json` | hard |
| Q8 | permalink commit pin | runbook permalink が現 HEAD SHA を含む | jq exit 0 | `jq -e --arg c "$(git rev-parse HEAD)" '.runbookPermalink \| contains($c)' docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json` | hard |
| Q9 | aiworkflow indexes drift | indexes 再生成後の差分なし | `git status -s` 該当 path 0 行 | `mise exec -- pnpm indexes:rebuild && git status -s .claude/skills/aiworkflow-requirements/indexes/` | hard |
| Q10 | workflow yaml validity | `incident-runbook-slack-delivery.yml` の構文 | actionlint 0 error | `actionlint .github/workflows/incident-runbook-slack-delivery.yml`（未導入なら `yamllint -d relaxed` で代替） | hard |
| Q11 | canonical doc 反映 | secret 名が deployment-secrets-management.md に追記されている | rg hit >= 1 | `rg -F "SLACK_BOT_TOKEN_INCIDENT_RUNBOOK" .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | hard |
| Q12 | production gate 構造 | workflow yaml に `environment: production-slack-delivery` が production mode 条件下で出現 | rg hit >= 1 | `rg -F "production-slack-delivery" .github/workflows/incident-runbook-slack-delivery.yml` | hard |
| Q13 | channel 分離 unit test 存在 | T5（誤配信ガード）テストの存在 | rg hit >= 1 | `rg -nF "must differ" scripts/notify/__tests__/` | hard |
| Q14 | 09c Phase 11 placeholder 置換差分 | share-evidence の placeholder が本タスク evidence path 参照に置き換わっている | diff に該当 path | `git diff main -- docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md \| rg -F "outputs/phase-11/evidence/slack-delivery-"` | hard（Phase 12 完了後に評価） |
| Q15 | production smoke 実行有無 | 本 Phase 時点では production 未配信であること | production evidence が **存在しない**（または mode=production が CI gate 通過済 marker と整合） | `test ! -f docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-production.json` | soft（Phase 11 で user approval 後に解除） |

> hard: 失敗時に Phase 10 進行を停止 / soft: 失敗時に `outputs/phase-11/main.md` で理由記録のうえ続行可

## 実行順序と blocking / non-blocking

```
[order]                                     [blocking?]
Q1  typecheck                               blocking (hard)
Q2  lint                                    blocking (hard)
Q3  unit test pass                          blocking (hard)
Q4  coverage                                blocking (hard)
Q10 workflow yaml validity                  blocking (hard)
Q11 canonical doc 反映                      blocking (hard)
Q12 production gate 構造                    blocking (hard)
Q13 channel 分離 unit test 存在             blocking (hard)
   --- Phase 8 dry-run smoke 実行後 ---
Q5  secret leak (xoxb)                      blocking (hard)
Q6  secret leak (xoxp/xapp/Bearer)          blocking (hard)
Q7  dryrun evidence schema                  blocking (hard)
Q8  permalink commit pin                    blocking (hard)
Q9  aiworkflow indexes drift                blocking (hard)
Q14 placeholder 置換差分                    blocking (hard, Phase 12 後)
Q15 production smoke 未実行確認             non-blocking (soft, Phase 11 で解除)
```

## 失敗時の自動修復可否 / fallback

| ゲート | 自動修復 | 失敗時の分岐 |
| --- | --- | --- |
| Q1 typecheck | × | 該当ファイルを Phase 6 シグネチャと照合 → 修正 → 再実行 |
| Q2 lint | ◯（`pnpm lint --fix` 1 回） | 残違反は手修正、CONST_007 で先送り禁止 |
| Q3 unit test | × | 失敗ケース ID（T1〜T15）から Phase 7 骨格・Phase 6 実装の差分を特定 |
| Q4 coverage | × | 未到達ブランチに対して assert を追加（T9〜T15 の補強） |
| Q5/Q6 secret leak | × | 該当 evidence 即削除、Phase 6 の Error redact 経路を強化、再 smoke |
| Q7/Q8 evidence | × | dry-run smoke を再実行（Phase 8 Step 5） |
| Q9 indexes drift | ◯（`pnpm indexes:rebuild` 結果を C6 と同一 commit に追加） | drift が解消しない場合は indexes 生成 script の不具合として別タスクで起票 |
| Q10 yaml validity | × | actionlint 出力を読んで該当行を Phase 6 C5 骨格と照合 |
| Q11 canonical doc | × | Phase 6 C6 の diff を再適用 |
| Q12 production gate | × | Phase 6 C5 yaml の `environment` 行を再確認 |
| Q13 channel 分離 test | × | Phase 7 T5 の `must differ` assertion を追加 |
| Q14 placeholder 置換 | × | Phase 12 で 09c Phase 11 ファイル編集を完了させて再評価 |

## blocker / Phase 10 への引き渡し条件

Phase 10（リリース準備）に進めるのは以下を **全て満たす** 場合のみ:

1. Q1〜Q13 が全て pass（Q14 は Phase 12 完了後に評価、Q15 は Phase 11 後に評価）
2. Phase 8 Step 5 の dry-run smoke が成功し、`docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json` が存在
3. `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-message-rendered.md` に redacted message body が保存されている
4. `outputs/phase-11/evidence/secret-resolution.log` に MASKED 表記での解決ログが残っている
5. Phase 11 で実施する production approval gate のための GitHub environment `production-slack-delivery` が事前作成済（reviewer に release oncall が登録）

満たさない場合の blocker 解消手順:

| 未達項目 | 解消手順 | 担当 |
| --- | --- | --- |
| Q1〜Q4 失敗 | Phase 6 / Phase 7 へ差し戻し、骨格修正 → 再実行 | Claude Code |
| Q5/Q6 失敗 | redact 強化 → 該当 evidence 全件再生成 | Claude Code |
| Q11 失敗 | C6 diff 再適用 + indexes 再生成 | Claude Code |
| Q14 未達 | Phase 12 へ進行不可 → Phase 11 完了後に着手 | Claude Code |
| GitHub environment 未作成 | repo admin で手動作成、reviewer 登録 | UBM admin |

## CI gate との整合

| CI ジョブ名（既存） | 紐付くゲート | 備考 |
| --- | --- | --- |
| `lint` | Q2 | 既存 gate |
| `typecheck` | Q1 | 既存 gate |
| `unit` / `test:run` | Q3, Q4 | 既存 gate（scripts-notify project 追加で coverage 集計対象に組み込む） |
| `verify-indexes-up-to-date` | Q9 | 既存 gate |
| `secret-leak-scan`（または `gitleaks` action） | Q5, Q6 | 既存 gate に xox[b]-/xox[p]- パターン追加可否を確認 |
| 新規 `incident-runbook-slack-delivery` workflow_dispatch | Q7, Q8, Q12 の動作検証 | 手動 trigger 結果は artifact から検証 |

## 多角的チェック観点

- secret leak gate が 3 種以上のパターンで二重防御
- production smoke 未実行（Q15）が soft gate として明示されている
- canonical doc（aiworkflow-requirements）整合が hard gate 化されている
- channel 誤配信ガードのテスト存在（Q13）が code review 用 grep で機械検証可能
- Phase 14（PR 作成）に進む前に必要な GitHub 側の environment 設定が前提として明示されている

## Definition of Done（Phase 9）

- [ ] Q1〜Q15 のゲートが本ファイルに揃っている（15 件）
- [ ] 各ゲートに検証コマンド・通過基準・hard/soft 区分・fallback がある
- [ ] Phase 10 への引き渡し条件が 5 項目で明示されている
- [ ] CI gate との対応表が記載されている
- [ ] `outputs/phase-09/main.md` に要点サマリ保存

## 参照

- phase-06.md / phase-07.md / phase-08.md
- `.github/workflows/verify-indexes.yml`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-09.md`（参考フォーマット）

## 次 Phase への引き渡し

Phase 10（リリース準備）へ:

- Q1〜Q13 pass を前提とし、Q14（placeholder 置換）/ Q15（production smoke）の事前条件を引き継ぐ
- production environment の reviewer 設定状況をリリース準備時に確認
- evidence 5 種（dryrun.json / rendered.md / secret-resolution.log / dryrun-smoke.log / production.json は Phase 11）の保存先を Phase 10 で再点検
