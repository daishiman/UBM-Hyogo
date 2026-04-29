# 手動 smoke log — 6 ケース手動 smoke コマンド系列（NOT EXECUTED）

> **本ログは仕様レベルの NOT EXECUTED 記録**。実走は Phase 13 ユーザー明示承認後（PR① / PR② / PR③ の段階適用）に別オペレーションで行う。
> ここでは「実走時に辿るべきコマンド・期待結果・実行前提・rollback 手順」を固定する。実 coverage 値・実 actions run link・実 lefthook 出力 は本ファイルには記録しない（実走時に上書き）。

## メタ

| 項目 | 値 |
| --- | --- |
| 証跡の主ソース | spec walkthrough（手動）+ Phase 2 §coverage-guard.sh I/O 仕様 / §CI workflow 更新仕様 / §lefthook.yml 更新仕様 |
| screenshot を作らない理由 | NON_VISUAL（UI 無し）+ docs-only walkthrough（実走は Phase 13 後） |
| 実行日時 | 2026-04-29（spec 固定日） |
| 実行者 | worktree branch: `task-20260429-132037-wt-3`（solo 開発） |
| 実走予定 | Phase 13 ユーザー明示承認後の別オペレーション（PR① / PR② / PR③） |
| 担当者 | solo 運用のため実行者本人 |

## NO-GO ゲート再掲（鶏卵問題 3 重明記の 4 箇所目）

- 本タスクは「仕組み導入 PR 自体が hard gate に落ちる鶏卵問題」を回避するため **3 段階 PR 戦略** を採用する。
- ケース 4（CI soft gate 動作）以前に PR① の `coverage-gate` job が `continue-on-error: true` で導入されていることが必須。
- ケース 5 / 6（lefthook / hard 切替）は PR② で全 package が 80% を満たしていることが前提。

---

## ケース 1 — T0 baseline 計測（NOT EXECUTED）

### 実行前提

| 項目 | 値 |
| --- | --- |
| PR 番号 | PR①（仕組み導入）merge 後 |
| branch | `dev`（PR① merge 直後）または PR① worktree |
| 実施時刻枠 | PR① merge 完了から 1 時間以内（baseline drift を最小化） |
| 前提条件 | `vitest.config.ts` の coverage セクション / `scripts/coverage-guard.sh` / 各 package の `test:coverage` script が PR① で導入済 |

### コマンド / 期待結果 / 実測 / PASS-FAIL

| # | コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 1.1 | `mise exec -- pnpm install --frozen-lockfile` | 依存解決成功 | NOT EXECUTED | NOT EXECUTED |
| 1.2 | `mise exec -- pnpm -r test:coverage` | 5 package すべてで vitest が完走し `<pkg>/coverage/coverage-summary.json` が生成 | NOT EXECUTED | NOT EXECUTED |
| 1.3 | `for pkg in apps/web apps/api packages/shared packages/integrations packages/integrations/google; do echo "=== $pkg ==="; jq '.total' "$pkg/coverage/coverage-summary.json"; done` | 各 package の lines/branches/functions/statements pct が JSON で出力 | NOT EXECUTED | NOT EXECUTED |
| 1.4 | 上記 1.3 の結果を `outputs/phase-11/coverage-baseline-summary.md` の `<TBD>` プレースホルダに記入 | 5 package × 4 metrics の実値が埋まる | NOT EXECUTED | NOT EXECUTED |
| 1.5 | `for pkg in apps/web apps/api packages/shared packages/integrations packages/integrations/google; do jq '[.[] \| select(type=="object")] \| sort_by(.lines.pct) \| .[0:10]' "$pkg/coverage/coverage-final.json" > "$pkg/coverage/top10-unsatisfied.json"; done` | 各 package の不足ファイル top10 が JSON で抽出 | NOT EXECUTED | NOT EXECUTED |

### Rollback 手順

- baseline 計測自体は read-only（vitest 実行のみ / git に commit しない）。
- `coverage-baseline-summary.md` への記入は git に commit するため、誤値を入れた場合は `git checkout -- outputs/phase-11/coverage-baseline-summary.md` で初期 `<TBD>` 状態に戻す。
- vitest 実行で生成された `coverage/` ディレクトリは `.gitignore` 配下なので clean-up は `rm -rf {apps,packages}/*/coverage` で済む。

---

## ケース 2 — coverage-guard pass（NOT EXECUTED）

### 実行前提

| 項目 | 値 |
| --- | --- |
| PR 番号 | PR②（テスト追加）の全 sub PR merge 後 |
| branch | `dev`（PR② 全 sub PR merge 完了後） |
| 実施時刻枠 | PR② 最終 sub PR merge 完了から PR③ 着手までの間 |
| 前提条件 | 全 5 package で lines/branches/functions/statements すべて 80% 以上を達成済（ケース 1 baseline からの差分が解消） |

### コマンド / 期待結果 / 実測 / PASS-FAIL

| # | コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 2.1 | `mise exec -- pnpm install --frozen-lockfile` | 依存解決成功 | NOT EXECUTED | NOT EXECUTED |
| 2.2 | `mise exec -- bash scripts/coverage-guard.sh` | exit 0 / stderr に `[coverage-guard] FAIL` 行なし / 全 package summary が PASS | NOT EXECUTED | NOT EXECUTED |
| 2.3 | `echo $?` | `0` | NOT EXECUTED | NOT EXECUTED |
| 2.4 | `mise exec -- bash scripts/coverage-guard.sh --threshold 80` | exit 0（明示的に閾値を指定しても同結果） | NOT EXECUTED | NOT EXECUTED |

### Rollback 手順

- read-only。git 状態を変えない。実行ログを残す場合は `tee` で別ファイルへ。

---

## ケース 3 — coverage-guard fail（NOT EXECUTED / L4 意図的 violation）

### 実行前提

| 項目 | 値 |
| --- | --- |
| PR 番号 | PR① または PR② のいずれかの worktree（merge せず手元のみ） |
| branch | feature worktree（dev / main を汚染しない） |
| 実施時刻枠 | 任意（手元での red 確認） |
| 前提条件 | テストファイルを一時 skip する / 閾値を一時 90% に上げる、いずれかで意図的に未達状態を作る |

### コマンド / 期待結果 / 実測 / PASS-FAIL

| # | コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 3.1 | `mise exec -- bash scripts/coverage-guard.sh --threshold 99` | exit 1 / stderr に `[coverage-guard] FAIL: <pkg> <metric>=<pct>% (< 99%)` が package ごとに出力 | NOT EXECUTED | NOT EXECUTED |
| 3.2 | 上記 stderr に `Top10 unsatisfied files (sorted by lines%):` セクションが含まれること | 不足ファイル上位 10 件が `<file>  lines=<pct>%  suggested test: <file>.test.ts` 形式で出力 | NOT EXECUTED | NOT EXECUTED |
| 3.3 | `echo $?` | `1` | NOT EXECUTED | NOT EXECUTED |
| 3.4 | `mise exec -- bash scripts/coverage-guard.sh --package packages/shared --threshold 99` | 単一 package モードで同様に exit 1 + top10 出力 | NOT EXECUTED | NOT EXECUTED |
| 3.5 | jq 未インストール環境を擬似的に再現（`PATH=/usr/bin:/bin bash scripts/coverage-guard.sh`） | exit 2 / 「jq not found」相当のエラーメッセージ | NOT EXECUTED | NOT EXECUTED |

### Rollback 手順

- 一時的に閾値を上げただけなので、`--threshold` flag を外せば元の挙動に戻る。
- テストファイルを skip した場合は `git checkout -- <skip 対象>` で復元。
- `vitest.config.ts` の閾値を直接書き換えた場合は `git diff vitest.config.ts` で変更を確認し `git checkout -- vitest.config.ts` で復元（commit していないこと）。

---

## ケース 4 — CI soft gate 動作（NOT EXECUTED）

### 実行前提

| 項目 | 値 |
| --- | --- |
| PR 番号 | PR① のドラフト PR（`feature/coverage-80-pr1` → `dev`） |
| branch | PR① の feature branch |
| 実施時刻枠 | PR① merge する前のドラフト状態 |
| 前提条件 | `.github/workflows/ci.yml` に `coverage-gate` job が `continue-on-error: true` で追加済 / branch protection の `required_status_checks.contexts` には `coverage-gate` をまだ追加していない（UT-GOV-004 連携は PR③ で実施） |

### コマンド / 期待結果 / 実測 / PASS-FAIL

| # | コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 4.1 | `gh pr view <PR① number> --json statusCheckRollup` | `coverage-gate` job が走り、`conclusion` が `success`（pass 時）または `failure` だが `continue-on-error: true` で全体 mergeable 維持 | NOT EXECUTED | NOT EXECUTED |
| 4.2 | `gh run list --workflow=ci.yml --branch <branch> --limit 1` | 直近の CI run id を取得 | NOT EXECUTED | NOT EXECUTED |
| 4.3 | `gh run view <run-id> --log` で `coverage-gate` step を抜粋 | `coverage-guard.sh` の実行ログが残り、artifact `coverage-report` が upload されている | NOT EXECUTED | NOT EXECUTED |
| 4.4 | `gh pr checks <PR① number>` | `coverage-gate` が SKIP / WARNING（continue-on-error）で表示、PR は mergeable | NOT EXECUTED | NOT EXECUTED |
| 4.5 | actions run link を本ログに記録 | `https://github.com/daishiman/UBM-Hyogo/actions/runs/<id>` を実走時に記入 | NOT EXECUTED | NOT EXECUTED |

### Rollback 手順

- soft gate は `continue-on-error: true` のため、CI 失敗が PR merge を block しない（rollback 不要）。
- ワークフロー変更を取り消したい場合は `git revert <PR① のマージ commit>` または PR① を close。
- artifact が大きすぎてストレージを圧迫した場合は `gh api -X DELETE /repos/{owner}/{repo}/actions/artifacts/<id>` で個別削除。

---

## ケース 5 — lefthook pre-push 動作（NOT EXECUTED）

### 実行前提

| 項目 | 値 |
| --- | --- |
| PR 番号 | PR③ の worktree（`feature/coverage-80-pr3` → `dev`） |
| branch | PR③ の feature branch |
| 実施時刻枠 | PR③ merge する前 |
| 前提条件 | `lefthook.yml` の pre-push に `coverage-guard` が追加済 / `pnpm install` で `lefthook install` が実行済 / 80% 未達状態を意図的に作る（テスト 1 件を一時 skip 等） |

### コマンド / 期待結果 / 実測 / PASS-FAIL

| # | コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 5.1 | `pnpm install`（`prepare` script で `lefthook install` 自動実行） | `.git/hooks/pre-push` が lefthook によって配置 | NOT EXECUTED | NOT EXECUTED |
| 5.2 | テスト 1 件を一時 skip した状態で `git push` | pre-push hook が発火し `coverage-guard.sh --changed` が走り、80% 未達で push が block される | NOT EXECUTED | NOT EXECUTED |
| 5.3 | block 時の stderr に `[coverage-guard] FAIL` + top10 + suggested test path が含まれる | Phase 2 §出力フォーマットと一致 | NOT EXECUTED | NOT EXECUTED |
| 5.4 | テスト skip を解除して再 push | hook が PASS し push 成功 | NOT EXECUTED | NOT EXECUTED |
| 5.5 | `LEFTHOOK=0 git push`（緊急 skip） | push 成功（hook bypass）。ただし CI hard gate（ケース 6）で同等 check が走るため事実上 block | NOT EXECUTED | NOT EXECUTED |

### Rollback 手順

- 誤って push が通ってしまった場合: `git push <remote> +<HEAD~1>:<branch>` で 1 コミット戻す（force push、`dev`/`main` では絶対禁止 — feature branch のみ）。
- `lefthook.yml` の変更を取り消したい場合: `git checkout -- lefthook.yml && pnpm install`（`prepare` で再 install）。
- `.git/hooks/*` を手書き編集してしまった場合: `lefthook install --force` で正本から再配置。

---

## ケース 6 — soft → hard 切替リハーサル（NOT EXECUTED / L4 意図的 violation）

### 実行前提

| 項目 | 値 |
| --- | --- |
| PR 番号 | PR③ merge 前のドラフト PR |
| branch | PR③ の feature branch |
| 実施時刻枠 | PR③ merge 直前（hard 化適用前のリハーサル） |
| 前提条件 | 全 5 package が 80% を満たしている（ケース 2 PASS 後）/ `vitest.config.ts` を一時的に書き換える権限あり |

### コマンド / 期待結果 / 実測 / PASS-FAIL

| # | コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 6.1 | `vitest.config.ts` の `coverage.thresholds` を一時 90% に書き換え（各 metric） | git diff で thresholds: 80 → 90 が表示 | NOT EXECUTED | NOT EXECUTED |
| 6.2 | コミットして PR③ feature branch に push | CI が起動 | NOT EXECUTED | NOT EXECUTED |
| 6.3 | `gh run list --workflow=ci.yml --branch <branch> --limit 1` で run id 取得 → `gh run view <id>` | `coverage-gate` job が fail（90% に届かない package が存在） | NOT EXECUTED | NOT EXECUTED |
| 6.4 | `vitest.config.ts` を 80% に戻して push | `coverage-gate` が再 green | NOT EXECUTED | NOT EXECUTED |
| 6.5 | `.github/workflows/ci.yml` から `continue-on-error: true` を削除して push | `coverage-gate` が required gate として動作（80% 未達 PR は block） | NOT EXECUTED | NOT EXECUTED |
| 6.6 | branch protection の `required_status_checks.contexts` に `coverage-gate` を登録（UT-GOV-001 / UT-GOV-004 経由） | `dev` / `main` の protection で `coverage-gate` が required になる | NOT EXECUTED | NOT EXECUTED |
| 6.7 | actions run link を本ログに記録 | 90% fail run / 80% 戻し pass run / continue-on-error 削除後 hard run の 3 link を記入 | NOT EXECUTED | NOT EXECUTED |

### Rollback 手順

- `vitest.config.ts` の閾値を 90% に上げた状態のまま放置しない: 必ず 80% に戻してから次工程へ。
- `continue-on-error: true` を削除した後に rollback したい場合: `git revert <該当 commit>` で復元（PR③ をまだ merge していないなら force push でも可）。
- `required_status_checks.contexts` に `coverage-gate` を登録後、緊急 rollback が必要な場合は UT-GOV-001 の `apply-runbook.md` の rollback 経路（`enforce_admins=false` 最小 patch / DELETE 経路）を参照。
- 全 5 package の 80% 達成が崩れている状態で hard 化すると既存 PR が一斉 block されるため、ケース 6 実施前に必ずケース 2 PASS を確認する（Phase 3 §レビュー指摘 R-4 対応）。

---

## 実走時の必須条件（Phase 13 へ申し送り）

- ケース 1 完了が ケース 2 / 3 の前提（baseline 値の確定）
- ケース 2 全 PASS が ケース 5 / 6 の前提（80% 達成済）
- ケース 4（soft gate）の actions run link が記録されてから ケース 6（hard 切替）に進む
- ケース 6.5（`continue-on-error` 削除）と ケース 6.6（contexts 登録）は **必ずペアで実施**（片方だけだと gate が機能しない / 2 重正本 drift）
- すべてのケースで NOT EXECUTED → PASS / FAIL に書き換えるとき、actions run link / `coverage-baseline-summary.md` 実値 / 実 stderr 抜粋（先頭 20 行）を本ファイルに追記する

## 関連

- 6 ケース概要: [./main.md §3](./main.md)
- T0 baseline 枠: [./coverage-baseline-summary.md](./coverage-baseline-summary.md)
- coverage-guard.sh I/O 正本: [../phase-02/main.md](../phase-02/main.md)
- vitest config 正本: [../phase-02/main.md](../phase-02/main.md)
- 3 段階 PR 段取り: [../phase-02/main.md](../phase-02/main.md) / Phase 13 PR runbook
- 連携タスク（branch protection contexts 登録）: [../../../ut-gov-001-github-branch-protection-apply/](../../../ut-gov-001-github-branch-protection-apply/)
