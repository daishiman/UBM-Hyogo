# Phase 6: 異常系検証（fail path / 回帰 guard）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | テストカバレッジ 80% 強制 (coverage-80-enforcement) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証（鶏卵 / 集計欠落 / Edge runtime / OS 依存 / 切替忘却 / 二重正本 / 遅延 / 一部 package 未達 / jq fallback / hard gate 化後 80% 未満 PR） |
| 作成日 | 2026-04-29 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending（仕様化のみ完了 / 実走は Phase 11 / 13） |
| タスク種別 | implementation / NON_VISUAL / quality_governance |

## 目的

Phase 4 の T1〜T10（happy path）に加えて、**fail path / 回帰 guard** を E1〜E13 として固定する（合計 13 ケース）。本 Phase は「壊れ方が予想範囲を超えないか」「coverage-summary.json 欠損 / 一部 package 未達 / jq 未インストール / Edge runtime 不可領域 / soft→hard 切替忘却 / 二重正本 drift / pre-push 遅延 / hard gate 化後の 80% 未満 PR」を仕様レベルで網羅する。実走は Phase 11 smoke / Phase 13 ユーザー承認後 merge に委譲する。各ケースに **期待挙動 / 検出方法 / 復旧手順** を併記する。

## 苦戦想定 1〜7 と異常系ケース対応表

| 苦戦想定 | 内容 | 対応ケース |
| --- | --- | --- |
| 1 | 鶏卵問題（仕組み導入 PR が落ちる） | E1 |
| 2 | monorepo 単一 vitest config で package 別集計困難 | E2 + E3 |
| 3 | Edge runtime / OpenNext 実行不可領域の exclude | E4 |
| 4 | OS 依存（jq 1.5 / bash 3.2） | E5 + E6 |
| 5 | soft→hard 切替忘却 | E10 |
| 6 | codecov.yml ↔ vitest.config.ts 二重正本 drift | E11 |
| 7 | lefthook pre-push 遅延 | E7 + E8 |

## 依存タスク順序（前提確認）

- Phase 5 の 9 サブタスク T0〜T8 が仕様化済み（artifacts.json と一致）。
- T7 hard gate 化と T8 正本同期は **PR③ merge 時点** での前提として、UT-GOV-001 / UT-GOV-004 完了が必須。
- 本 Phase は Phase 5 ランブックを Red 視点で逆走する形で異常系を確認する。

## 実行タスク

- タスク1: E1〜E13 の 13 ケースをシナリオ / 検出方法 / 期待挙動 / 復旧手順に分解する。
- タスク2: 苦戦想定 1〜7 と E1〜E13 の対応表を維持する。
- タスク3: 各ケースの実走 Phase（Phase 11 smoke / Phase 13 merge）を割り当てる。
- タスク4: CI gate 候補化（Phase 12 unassigned-task）への申し送りを表化する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-04.md | T1〜T10 happy path |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-05.md | 9 サブタスクランブック |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-02.md | I/O 仕様 / 苦戦想定 1〜7 |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-03.md | R-1〜R-4 / NO-GO 条件 |
| 必須 | .claude/skills/task-specification-creator/references/coverage-standards.md | 異常系テンプレ参照 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-06.md | 異常系フォーマット参照 |

## 成果物/実行手順

| 手順 | 内容 | 成果物 |
| --- | --- | --- |
| 1 | E1〜E13 を fail path として列挙し、各ケースにシナリオ / 検出方法 / 期待挙動 / 復旧手順を付与する | `outputs/phase-06/main.md` |
| 2 | 苦戦想定 1〜7 と E1〜E13 の対応表を維持する | `outputs/phase-06/main.md` |
| 3 | Phase 11 / Phase 13 で実走するケースと、Phase 12 unassigned-task に送るケースを分離する | `outputs/phase-06/main.md` |
| 4 | CI gate 候補化すべき drift / 環境エラーを Phase 12 へ申し送る | `outputs/phase-12/unassigned-task-detection.md` |

## 統合テスト連携

| 連携先 | 内容 |
| --- | --- |
| Phase 4 | happy path T1〜T10 と対になる fail path として利用 |
| Phase 11 | manual smoke の red 確認ケースへ E1 / E3 / E5 / E9 / E10 を渡す |
| Phase 12 | CI gate 候補と drift 防止タスクを unassigned-task として formalize |
| Phase 13 | PR① soft / PR③ hard の reviewer checklist に E1 / E9 / E10 を渡す |

## 異常系テスト一覧（E1〜E13）

### E1: 鶏卵問題（PR① で hard gate 暴発）

| 項目 | 内容 |
| --- | --- |
| ID | E1 |
| 対応苦戦想定 | 1 |
| シナリオ | PR① の `coverage-gate` job で `continue-on-error: true` を入れ忘れ、80% 未満の現状値で CI 全体が fail し PR① 自体が merge 不能 |
| 検出方法 | `gh pr checks <PR1>` で `coverage-gate` が `failure`（neutral / success ではない） / `gh workflow view ci.yml \| rg "continue-on-error: true"` が 0 件 |
| 期待挙動 | PR① では必ず `continue-on-error: true` が付与され、CI 全体は green。`coverage-gate` のみ warning として表示 |
| 復旧手順 | PR① のレビューで `continue-on-error: true` 行の存在を必須レビュー観点として確認。落ちた場合は PR① branch で diff 修正の commit を追加 → 再 push |

### E2: coverage-summary.json 欠損（vitest 実行失敗 / 集計欠落）

| 項目 | 内容 |
| --- | --- |
| ID | E2 |
| 対応苦戦想定 | 2 |
| シナリオ | いずれかの package で vitest 実行が途中で失敗し `coverage/coverage-summary.json` が生成されない / または OOM で空ファイル |
| 検出方法 | `coverage-guard.sh` 内の `test -f <pkg>/coverage/coverage-summary.json` で false → exit 2 / stderr に「coverage-summary.json 不在: <pkg>」と表示 |
| 期待挙動 | exit 2 で環境エラー扱い。stderr に「該当 package の `pnpm --filter <pkg> test:coverage` を再実行してください」と HINT |
| 復旧手順 | (1) `pnpm --filter <pkg> test:coverage` を再実行 / (2) OOM の場合 `NODE_OPTIONS=--max-old-space-size=4096` 付与 / (3) test runner crash の場合は単体テスト削減で原因 test を特定 |

### E3: 一部 package のみ未達（残りは 80% 達成）

| 項目 | 内容 |
| --- | --- |
| ID | E3 |
| 対応苦戦想定 | 2 |
| シナリオ | `apps/web` のみ lines=72%、他 4 package は 80% 達成 |
| 検出方法 | `coverage-guard.sh` が package 単位で判定し、未達 package のみ stderr に「FAIL: apps/web lines=72.0% (< 80%)」と Top10 を出力 / exit 1 |
| 期待挙動 | 達成 package は出力に出さない（ノイズ抑制）。未達 package のみに集中して Top10 + テスト雛形を提示 |
| 復旧手順 | stderr の Top10 のうち上位 3 件にテスト追加 → 再実行 → 残り 7 件にテスト追加。PR② sub PR として段階発行 |

### E4: Edge runtime / OpenNext 不可領域がカバレッジ計上される

| 項目 | 内容 |
| --- | --- |
| ID | E4 |
| 対応苦戦想定 | 3 |
| シナリオ | `apps/web/middleware.ts` や `.open-next/` 配下が `coverage-final.json` に出現し常に 0% 計上で全体 pct を引き下げる |
| 検出方法 | `jq 'keys[]' coverage/coverage-final.json \| rg "(.open-next/|middleware\.ts|next\.config\.)"` で 1 件以上ヒットしたら exclude 漏れ |
| 期待挙動 | vitest.config.ts の `coverage.exclude` に該当パスが含まれ、coverage-final.json の key にも出現しない |
| 復旧手順 | (1) Phase 11 baseline で出現箇所を列挙 / (2) Phase 5 T1 の exclude リストに追加 / (3) `pnpm test:coverage` で再生成し coverage-final.json から消えることを確認 |

### E5: jq 未インストール / 旧バージョン環境（macOS デフォルト 1.5）

| 項目 | 内容 |
| --- | --- |
| ID | E5 |
| 対応苦戦想定 | 4 |
| シナリオ | 開発者ローカル / CI runner で `jq --version` が 1.5 / `command -v jq` が空 |
| 検出方法 | `coverage-guard.sh` 冒頭で `command -v jq >/dev/null 2>&1 || { echo "[coverage-guard] FAIL: jq 未インストール" >&2; exit 2; }` / `jq --version` を parse して 1.6 未満なら fail |
| 期待挙動 | exit 2 で stderr に「jq 1.6+ が必要です。`mise install jq` または `brew install jq` で導入してください」と HINT |
| 復旧手順 | (1) macOS: `brew install jq` / (2) CI: `mise.toml` に `jq = "1.7"` を追加し `mise-action` で auto install / (3) Linux: `apt-get install jq` |

### E6: bash 3.2 (macOS デフォルト) で連想配列構文エラー

| 項目 | 内容 |
| --- | --- |
| ID | E6 |
| 対応苦戦想定 | 4 |
| シナリオ | macOS デフォルト bash 3.2 で `coverage-guard.sh` 内の `declare -A` / `[[` 拡張が syntax error |
| 検出方法 | shebang を `#!/usr/bin/env bash` で固定 + `mise exec --` 経由で bash 5.x を強制。直接 `/bin/bash` 実行された場合に明示エラー |
| 期待挙動 | `coverage-guard.sh` 冒頭で `[ "${BASH_VERSINFO[0]}" -ge 4 ] || { echo "[coverage-guard] FAIL: bash 4.0+ が必要" >&2; exit 2; }` |
| 復旧手順 | (1) `mise exec -- bash scripts/coverage-guard.sh` で起動 / (2) macOS: `brew install bash` で 5.x 導入 + `mise.toml` に追加 / (3) スクリプトで POSIX 範囲のみ使う書き換え（連想配列回避）も代替策 |

### E7: lefthook pre-push 遅延（30 秒超 / 開発体験悪化）

| 項目 | 内容 |
| --- | --- |
| ID | E7 |
| 対応苦戦想定 | 7 |
| シナリオ | `--changed` モードでも全 package を実行してしまい push まで 60 秒以上かかる |
| 検出方法 | Phase 11 smoke で `time mise exec -- lefthook run pre-push` を計測 / 30 秒超で fail |
| 期待挙動 | `--changed` モードで touched package のみ実行 → 通常 30 秒以内 / フル実行は CI のみ |
| 復旧手順 | (1) `git diff --name-only origin/main...HEAD` の base ref が detached HEAD でないか確認 / (2) `git fetch origin main --depth=1` を pre-push 冒頭に追加 / (3) それでも遅い場合は `LEFTHOOK=0 git push` で緊急 skip + CI 側で再 block |

### E8: detached HEAD で `--changed` mode が暴発（全 package 実行）

| 項目 | 内容 |
| --- | --- |
| ID | E8 |
| 対応苦戦想定 | 7 |
| シナリオ | `git rebase` 中や `git checkout <sha>` 時の detached HEAD で `git diff origin/main...HEAD` が解決できず全 package を実行 |
| 検出方法 | stderr に「[coverage-guard] WARN: detached HEAD detected, falling back to full mode」を出力 / 経過時間が 30 秒を超える |
| 期待挙動 | detached HEAD 検出時に full mode に明示フォールバック + WARN 表示 / `lefthook.yml` の `skip: [merge, rebase]` で rebase 中は完全 skip |
| 復旧手順 | (1) `lefthook.yml` の `skip` リストに `rebase` を含める（Phase 5 T6 で確定） / (2) detached HEAD 時は WARN を出して full mode 実行 / (3) ユーザーが branch に戻り次第通常モードで再実行 |

### E9: hard gate 化後の 80% 未満 PR が来た時（回帰検出）

| 項目 | 内容 |
| --- | --- |
| ID | E9 |
| 対応苦戦想定 | - |
| シナリオ | PR③ merge 後、別開発者が 80% 未満の状態で PR を提出 |
| 検出方法 | (1) ローカル `git push` 時に lefthook pre-push が exit 1 で block / (2) `--no-verify` で push しても CI `coverage-gate` が hard fail / (3) branch protection の required check に `coverage-gate` が含まれているため merge button disable |
| 期待挙動 | 二重防御（lefthook + CI）で merge 不能 / PR 説明文に Top10 + テスト雛形を pre-push の stderr から転記して PR コメントに添付するよう促す |
| 復旧手順 | (1) PR 作成者が stderr / CI log の Top10 にテスト追加 / (2) push 再試行 / (3) どうしても緊急時は `enforce_admins=true` 状態で admin override は不能 → `gh api .../enforce_admins -X DELETE` で一時解除 → hotfix → 復元（UT-GOV-001 ランブックの緊急 rollback 経路に準拠） |

### E10: soft→hard 切替忘却（PR③ が永遠に出ない）

| 項目 | 内容 |
| --- | --- |
| ID | E10 |
| 対応苦戦想定 | 5 |
| シナリオ | PR① merge 後、PR② sub PR 群が一巡したが PR③（hard gate 化）が起票されないまま数ヶ月経過 |
| 検出方法 | (1) Phase 12 unassigned-task-detection.md に「PR③ 期限超過」が起票される / (2) `gh workflow view ci.yml \| rg "continue-on-error: true"` が PR② merge 完了後も残存 / (3) `gh api repos/{owner}/{repo}/branches/main/protection \| jq '.required_status_checks.contexts | index("coverage-gate")'` が null |
| 期待挙動 | Phase 12 で「PR③ merge 期限 = PR② 完了 + 30 日以内」を unassigned-task として明文化 / 期限超過時に自動アラート（GitHub Issue / GHA scheduled job） |
| 復旧手順 | (1) Phase 12 unassigned-task をトリガに PR③ を起票 / (2) Phase 11 smoke を再走 / (3) Phase 13 PR③ runbook に従い merge |

### E11: codecov.yml ↔ vitest.config.ts 二重正本 drift

| 項目 | 内容 |
| --- | --- |
| ID | E11 |
| 対応苦戦想定 | 6 |
| シナリオ | vitest.config.ts は 80% / codecov.yml の `project.target` が 90%（または 65% のまま） |
| 検出方法 | (1) `rg "target:" codecov.yml` の値を `vitest.config.ts` の `thresholds.lines` と diff / (2) Phase 12 system-spec-update-summary.md で同期確認 |
| 期待挙動 | Phase 5 T8 で `codecov.yml` の `project.target` と `patch.target` を共に 80% に統一 / 以降 vitest.config.ts 変更時は codecov.yml も同期する旨を `coverage-standards.md` に明記 |
| 復旧手順 | (1) `codecov.yml` を 80% に書き換え / (2) `vitest.config.ts` と `codecov.yml` の「正本は vitest.config.ts」明記を `coverage-standards.md` に追記（T8 で完了済みのはず） / (3) drift 再発防止に Phase 12 で CI 同期 check を unassigned-task 起票 |

### E12: 二重正本 drift（quality-requirements-advanced.md 旧値残存）

| 項目 | 内容 |
| --- | --- |
| ID | E12 |
| 対応苦戦想定 | 6 |
| シナリオ | T8 で `quality-requirements-advanced.md` の本文表は更新したが、別セクション / 例文に旧 desktop=80% / shared=65% が残存 |
| 検出方法 | `rg "65%\|85%" .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` が 1 件以上ヒット |
| 期待挙動 | Phase 5 T8 完了後は当該 ripgrep が 0 件。Phase 4 T10 で dry-run 列挙済み |
| 復旧手順 | (1) Phase 4 T10 の差分リストを再走 / (2) 残存箇所を編集 / (3) Phase 12 system-spec-update-summary.md に追記 |

### E13: GitHub API バージョン変更で `required_status_checks.contexts` schema が変化

| 項目 | 内容 |
| --- | --- |
| ID | E13 |
| 対応苦戦想定 | - |
| シナリオ | GitHub REST API の更新で `required_status_checks.contexts` が deprecate され `checks` に置換、本タスクで登録した `coverage-gate` が認識されない |
| 検出方法 | (1) `gh api repos/{owner}/{repo}/branches/main/protection \| jq '.required_status_checks'` の出力構造を年次レビュー / (2) UT-GOV-001 / UT-GOV-004 の adapter 11 field 表との突合 |
| 期待挙動 | UT-GOV-001 ランブックの T11（GET→PUT field drift）と同等の検出 → Phase 12 unassigned-task として adapter 再評価を起票 |
| 復旧手順 | UT-GOV-001 ランブックに従い adapter を更新 → 再 PUT で `coverage-gate` を再登録 |

## fail path × 検出 lane / Phase 早見表

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
| E11 | codecov.yml diff | Phase 5 T8 / Phase 12 | 候補（CI で同期 check） |
| E12 | rg drift check | Phase 5 T8 / Phase 12 | 候補 |
| E13 | UT-GOV-001 ランブック | Phase 12 unassigned | 既存 UT-GOV-001 で被覆 |

## 完了条件

- [ ] E1〜E13 が `outputs/phase-06/main.md` に表化されている
- [ ] 各ケースに ID / 対応苦戦想定 / シナリオ / 検出方法 / 期待挙動 / 復旧手順が記述されている
- [ ] 苦戦想定 1〜7 すべてが対応ケースに紐付けられている（E1 / E2 / E4 / E5 / E7 / E10 / E11）
- [ ] CI gate 候補（Phase 12 unassigned-task）への申し送りが表化されている
- [ ] hard gate 化後の 80% 未満 PR の挙動（E9）が二重防御として記述されている
- [ ] soft→hard 切替忘却検出（E10）が Phase 12 unassigned-task との連携で記述されている
- [ ] 実テスト走行は Phase 11 / 13 に委ねる旨が明示されている

## 検証コマンド（仕様確認用 / NOT EXECUTED）

```bash
test -f docs/30-workflows/coverage-80-enforcement/outputs/phase-06/main.md
rg -c "^### E(1[0-3]|[1-9]):" docs/30-workflows/coverage-80-enforcement/outputs/phase-06/main.md
# => 13
rg -c "対応苦戦想定" docs/30-workflows/coverage-80-enforcement/outputs/phase-06/main.md
# => 13
```

## 苦戦防止メモ

1. **E1 / E10 はレビュー観点必須**: PR① の `continue-on-error: true` 存在 / PR③ の削除を必須レビュー項目化。Phase 12 unassigned-task で期限可視化。
2. **E2 / E5 / E6 は CI gate 候補**: 手動レビューでは検出困難。Phase 12 unassigned-task-detection.md に CI gate タスクを登録。
3. **E4 は Phase 11 baseline 後に再評価**: Edge runtime exclude が広すぎると実質カバレッジが下がる（Phase 3 R-1）。Phase 11 で baseline を見て exclude を絞る選択肢を残す。
4. **E9 の hard gate 化後の admin override**: solo 運用では `enforce_admins=true` 状態で admin 自身も bypass 不能。緊急時は UT-GOV-001 ランブックの `enforce_admins -X DELETE` 経路を使う（担当者明記必須）。
5. **E11 / E12 の二重正本は CI で同期 check 化**: drift 再発を構造的に防ぐため、Phase 12 で `vitest.config.ts ↔ codecov.yml ↔ quality-requirements-advanced.md` の 3 方向同期 check を CI 候補化。
6. **E13 は年次レビュー対象**: GitHub API 変更は突発的に起こる。Phase 12 unassigned-task に「年次 adapter 再評価」を恒久タスク化。
7. **本 Phase は実走しない**: 仕様化のみ。実走は Phase 11 smoke / Phase 13 ユーザー承認後 merge。

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - T1〜T10（happy path / Phase 4）+ E1〜E13（fail path / 本 Phase）の合計 23 件を Phase 7 AC マトリクス入力として渡す
  - E2 / E5 / E6 / E10 / E11 / E12 を CI gate 候補として Phase 12 unassigned-task-detection.md に申し送り
  - E10 の soft→hard 切替期限を Phase 12 / Phase 13 PR③ runbook に転記
  - E9 の hard gate 化後の二重防御挙動を Phase 13 PR③ 説明文に転記
- ブロック条件:
  - 13 ケースのいずれかに期待挙動 / 検出方法 / 復旧手順が欠けている
  - 苦戦想定 1〜7 のいずれかが対応ケースに紐付かない
  - E10 の soft→hard 切替忘却検出が Phase 12 unassigned-task に申し送られない
  - E9 の hard gate 化後の二重防御が記述されない
