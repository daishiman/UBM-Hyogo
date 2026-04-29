# Phase 6 成果物 — 異常系検証

## 1. 異常系サマリ

E1〜E13 の 13 ケースで、coverage-80-enforcement 採用案の fail path（**鶏卵 / 集計欠落 / 一部 package 未達 / Edge runtime exclude / jq 未インストール / bash 旧版 / pre-push 遅延 / detached HEAD / hard gate 化後の 80% 未満 PR / soft→hard 切替忘却 / codecov.yml 二重正本 / quality-requirements-advanced.md drift / GitHub API schema 変化**）を仕様レベルで網羅する。実走は **Phase 11 smoke / Phase 13 ユーザー承認後 merge** に委譲し、本 Phase ではシナリオ・検出方法・期待挙動・復旧手順を正本化する。

## 2. 苦戦想定 1〜7 と E1〜E13 の対応表

| 苦戦想定 | 内容 | 対応ケース |
| --- | --- | --- |
| 1 | 鶏卵問題 | E1 |
| 2 | monorepo 集計困難 | E2 + E3 |
| 3 | Edge runtime exclude | E4 |
| 4 | OS 依存 | E5 + E6 |
| 5 | soft→hard 切替忘却 | E10 |
| 6 | 二重正本 drift | E11 + E12 |
| 7 | pre-push 遅延 | E7 + E8 |

## 3. E1: 鶏卵問題（PR① で hard gate 暴発）

| 項目 | 内容 |
| --- | --- |
| ID | E1 / 対応苦戦想定 1 |
| シナリオ | PR① で `continue-on-error: true` を入れ忘れ、80% 未満で CI 全体 fail → PR① 自体が merge 不能 |
| 検出方法 | `gh pr checks <PR1>` で `coverage-gate` が `failure` / `gh workflow view ci.yml \| rg "continue-on-error: true"` が 0 件 |
| 期待挙動 | PR① では `continue-on-error: true` が必ず付与され CI 全体 green / `coverage-gate` のみ warning |
| 復旧手順 | レビュー必須項目に `continue-on-error: true` 行確認を追加 / 落ちた場合は PR① branch に diff 修正 commit を追加 |

## 4. E2: coverage-summary.json 欠損

| 項目 | 内容 |
| --- | --- |
| ID | E2 / 対応苦戦想定 2 |
| シナリオ | vitest 実行が途中で失敗し summary 不在 / OOM で空ファイル |
| 検出方法 | `coverage-guard.sh` 内で `test -f <pkg>/coverage/coverage-summary.json` false → exit 2 / stderr に「coverage-summary.json 不在: <pkg>」 |
| 期待挙動 | exit 2 + stderr に「`pnpm --filter <pkg> test:coverage` を再実行してください」HINT |
| 復旧手順 | (1) 再実行 / (2) OOM の場合 `NODE_OPTIONS=--max-old-space-size=4096` / (3) crash 原因 test を絞り込み |

## 5. E3: 一部 package のみ未達

| 項目 | 内容 |
| --- | --- |
| ID | E3 / 対応苦戦想定 2 |
| シナリオ | `apps/web` のみ lines=72%、他 4 package は 80% 達成 |
| 検出方法 | `coverage-guard.sh` が package 単位判定で「FAIL: apps/web lines=72.0% (< 80%)」を Top10 と共に出力 / exit 1 |
| 期待挙動 | 達成 package は出力に出さない（ノイズ抑制）。未達 package のみ Top10 + テスト雛形を提示 |
| 復旧手順 | Top10 上位 3 件 → テスト追加 → 残り 7 件追加。PR② sub PR として段階発行 |

## 6. E4: Edge runtime / OpenNext 不可領域がカバレッジ計上

| 項目 | 内容 |
| --- | --- |
| ID | E4 / 対応苦戦想定 3 |
| シナリオ | `apps/web/middleware.ts` や `.open-next/` 配下が常に 0% で全体 pct を引き下げ |
| 検出方法 | `jq 'keys[]' coverage/coverage-final.json \| rg "(\.open-next/|middleware\.ts|next\.config\.)"` で 1 件以上ヒット |
| 期待挙動 | exclude リストに該当パスが含まれ coverage-final.json から消える |
| 復旧手順 | (1) Phase 11 baseline で出現箇所列挙 / (2) Phase 5 T1 exclude 追加 / (3) 再生成確認 |

## 7. E5: jq 未インストール / 旧バージョン

| 項目 | 内容 |
| --- | --- |
| ID | E5 / 対応苦戦想定 4 |
| シナリオ | `jq --version` が 1.5（macOS デフォルト）/ `command -v jq` 空 |
| 検出方法 | `coverage-guard.sh` 冒頭で `command -v jq` 確認 + version parse |
| 期待挙動 | exit 2 + stderr に「jq 1.6+ が必要です。`mise install jq` または `brew install jq`」HINT |
| 復旧手順 | (1) `brew install jq` / (2) CI: `mise.toml` に `jq = "1.7"` + `mise-action` / (3) Linux: `apt-get install jq` |

## 8. E6: bash 3.2 で連想配列構文エラー

| 項目 | 内容 |
| --- | --- |
| ID | E6 / 対応苦戦想定 4 |
| シナリオ | macOS デフォルト bash 3.2 で `declare -A` / `[[` 拡張が syntax error |
| 検出方法 | `coverage-guard.sh` 冒頭で `[ "${BASH_VERSINFO[0]}" -ge 4 ]` チェック |
| 期待挙動 | exit 2 + stderr に「bash 4.0+ が必要」 |
| 復旧手順 | (1) `mise exec -- bash` 経由実行 / (2) `brew install bash` で 5.x / (3) POSIX 範囲のみへ書き換え |

## 9. E7: lefthook pre-push 遅延

| 項目 | 内容 |
| --- | --- |
| ID | E7 / 対応苦戦想定 7 |
| シナリオ | `--changed` モードでも全 package 実行で push まで 60 秒超 |
| 検出方法 | Phase 11 で `time mise exec -- lefthook run pre-push` を計測 / 30 秒超で fail |
| 期待挙動 | `--changed` モードで touched package のみ実行 → 30 秒以内 |
| 復旧手順 | (1) `git fetch origin main --depth=1` を pre-push 冒頭追加 / (2) detached HEAD 確認 / (3) 緊急時 `LEFTHOOK=0 git push` + CI 再 block |

## 10. E8: detached HEAD で `--changed` mode 暴発

| 項目 | 内容 |
| --- | --- |
| ID | E8 / 対応苦戦想定 7 |
| シナリオ | rebase 中 / `git checkout <sha>` で `git diff origin/main...HEAD` 解決不能 → 全 package 実行 |
| 検出方法 | stderr に「WARN: detached HEAD detected, falling back to full mode」 |
| 期待挙動 | full mode に明示フォールバック + WARN 表示 / `lefthook.yml` `skip: [merge, rebase]` で rebase 中は完全 skip |
| 復旧手順 | (1) `lefthook.yml` skip リストに `rebase` 含有（Phase 5 T6） / (2) WARN 出力 / (3) branch 復帰後通常モード |

## 11. E9: hard gate 化後の 80% 未満 PR（回帰検出）

| 項目 | 内容 |
| --- | --- |
| ID | E9 |
| シナリオ | PR③ merge 後、別開発者が 80% 未満の PR 提出 |
| 検出方法 | (1) lefthook pre-push exit 1 で push block / (2) `--no-verify` でも CI `coverage-gate` hard fail / (3) branch protection required で merge button disable |
| 期待挙動 | 二重防御で merge 不能 / PR コメントに stderr Top10 を転記促し |
| 復旧手順 | (1) Top10 にテスト追加 / (2) push 再試行 / (3) 緊急時のみ UT-GOV-001 ランブック `enforce_admins -X DELETE` → hotfix → 復元 |

## 12. E10: soft→hard 切替忘却

| 項目 | 内容 |
| --- | --- |
| ID | E10 / 対応苦戦想定 5 |
| シナリオ | PR② 一巡後 PR③ が起票されないまま数ヶ月 |
| 検出方法 | (1) Phase 12 unassigned-task-detection.md に「PR③ 期限超過」起票 / (2) `rg "continue-on-error: true" .github/workflows/ci.yml` 残存 / (3) `gh api .../protection \| jq '.required_status_checks.contexts | index("coverage-gate")'` が null |
| 期待挙動 | Phase 12 で「PR③ merge 期限 = PR② 完了 + 30 日以内」を unassigned-task 明文化 + 期限超過アラート |
| 復旧手順 | (1) Phase 12 unassigned-task トリガで PR③ 起票 / (2) Phase 11 smoke 再走 / (3) Phase 13 PR③ runbook で merge |

## 13. E11: codecov.yml ↔ vitest.config.ts 二重正本 drift

| 項目 | 内容 |
| --- | --- |
| ID | E11 / 対応苦戦想定 6 |
| シナリオ | vitest 80% / codecov.yml `project.target` が 90% or 65% 残存 |
| 検出方法 | `rg "target:" codecov.yml` 値と `vitest.config.ts thresholds.lines` を diff |
| 期待挙動 | Phase 5 T8 で 80% 統一 / `coverage-standards.md` に「正本は vitest.config.ts」明記 |
| 復旧手順 | (1) `codecov.yml` を 80% 書き換え / (2) Phase 12 で同期 CI check を unassigned-task 起票 |

## 14. E12: quality-requirements-advanced.md 旧値残存

| 項目 | 内容 |
| --- | --- |
| ID | E12 / 対応苦戦想定 6 |
| シナリオ | T8 で本文表は更新したが別セクション / 例文に旧 desktop=80% / shared=65% 残存 |
| 検出方法 | `rg "65%\|85%" .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` が 1 件以上 |
| 期待挙動 | Phase 5 T8 完了後は 0 件（Phase 4 T10 dry-run で列挙済み） |
| 復旧手順 | (1) Phase 4 T10 差分リスト再走 / (2) 残存箇所編集 / (3) Phase 12 system-spec-update-summary.md 追記 |

## 15. E13: GitHub API schema 変化（contexts deprecate）

| 項目 | 内容 |
| --- | --- |
| ID | E13 |
| シナリオ | `required_status_checks.contexts` が deprecate され `checks` に置換 / `coverage-gate` 認識不能 |
| 検出方法 | (1) `gh api .../protection \| jq '.required_status_checks'` 構造の年次レビュー / (2) UT-GOV-001 adapter 11 field 表突合 |
| 期待挙動 | UT-GOV-001 T11（GET→PUT field drift）相当の検出 → Phase 12 unassigned-task で adapter 再評価 |
| 復旧手順 | UT-GOV-001 ランブックに従い adapter 更新 → 再 PUT で `coverage-gate` 再登録 |

## 16. fail path × 検出 lane / Phase 早見表

| ID | 検出 lane | 対応 Phase / Step | CI gate 候補（Phase 12 unassigned） |
| --- | --- | --- | --- |
| E1 | レビュー / CI | Phase 5 T4 / Phase 13 PR① | - |
| E2 | coverage-guard.sh | Phase 5 T2 / Phase 11 smoke | 候補（summary 欠損自動検出） |
| E3 | coverage-guard.sh | Phase 5 T2 / Phase 11 smoke | - |
| E4 | vitest.config.ts | Phase 5 T1 / Phase 11 baseline 再評価 | - |
| E5 | coverage-guard.sh 冒頭 | Phase 5 T2 | 候補（jq バージョン check） |
| E6 | coverage-guard.sh 冒頭 | Phase 5 T2 | - |
| E7 | lefthook | Phase 5 T6 / Phase 11 smoke | - |
| E8 | coverage-guard.sh + lefthook | Phase 5 T2 / T6 | - |
| E9 | lefthook + CI hard gate | Phase 5 T6 / T7 / Phase 11 smoke | - |
| E10 | Phase 12 unassigned-task | Phase 12 / Phase 13 | **必須**（期限超過アラート） |
| E11 | codecov.yml diff | Phase 5 T8 / Phase 12 | 候補（CI 同期 check） |
| E12 | rg drift check | Phase 5 T8 / Phase 12 | 候補 |
| E13 | UT-GOV-001 ランブック | Phase 12 unassigned | 既存 UT-GOV-001 で被覆 |

## 17. 引き渡し（Phase 7 へ）

- T1〜T10（happy path / Phase 4）+ E1〜E13（fail path / 本 Phase）の合計 23 件を Phase 7 AC マトリクス入力として渡す
- E2 / E5 / E6 / E10 / E11 / E12 を Phase 12 unassigned-task-detection.md に CI gate 候補として申し送り
- E10 soft→hard 切替期限を Phase 12 / Phase 13 PR③ runbook に転記
- E9 hard gate 化後の二重防御挙動を Phase 13 PR③ 説明文に転記
- 実走は Phase 11 smoke / Phase 13 ユーザー承認後 merge
