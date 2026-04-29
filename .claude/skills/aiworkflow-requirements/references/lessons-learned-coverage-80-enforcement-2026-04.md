# Lessons Learned: coverage-80-enforcement（全 package 一律 80% / 3 重 gate / 3 段階 PR）

> 由来: `docs/30-workflows/coverage-80-enforcement/`
> 作成日: 2026-04-29
> タスク種別: governance / quality / NON_VISUAL / implementation_started
> 出典: `outputs/phase-12/{system-spec-update-summary,unassigned-task-detection,skill-feedback-report,implementation-guide}.md`

## 概要

monorepo の全 workspace package（apps/web, apps/api, packages/shared, packages/integrations, packages/integrations/google）について、coverage 閾値を `apps=80% / packages=65%` の差分制から **lines / branches / functions / statements 一律 80%** に切り替えた。

責務分離の原則を採用:

- **Vitest** = coverage 計測（`coverage-summary.json` 出力）に専念
- **`scripts/coverage-guard.sh`** = package 単位の 80% 判定 + 不足 metric / 不足ファイル top10 / 推奨テストファイルパスを stderr 出力
- **強制経路 = 3 重 gate**: (1) `pnpm coverage:guard` ローカル明示、(2) lefthook `pre-push --changed` auto-loop、(3) GitHub Actions `coverage-gate` job

PR 段階適用は鶏卵問題を避けるため **PR① soft（gate 導入のみ）→ PR② テスト追加 → PR③ hard（fail 化）** の 3 段階に分離した。

## 正本 4 系

| 系 | ファイル | 役割 |
| --- | --- | --- |
| 正本（仕様） | `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` §カバレッジ閾値設定 | package 別閾値の正本（全て 80%） |
| 正本（手順） | `.claude/skills/task-specification-creator/references/coverage-standards.md` §workspace 一律 80% 強制経路 | 強制経路 3 種の正本 |
| 実行設定 | `vitest.config.ts` の `coverage` セクション | 計測（reporter / include / exclude） |
| 判定スクリプト | `scripts/coverage-guard.sh` + `scripts/coverage-guard.test.ts` | 80% 判定 + top10 失敗ファイル出力 |

> 4 系のうち 1 つだけ更新すると drift が起きる。一括変更時は本ファイルを参照し、4 系すべての差分を同一 wave で同期すること。

## 苦戦箇所 5 件（U-1〜U-5 由来）

### L-COV80-001: `--changed` flag の依存波及未保証（U-1）

`coverage-guard.sh --changed` は git diff ベースの軽量化に閉じるため、依存 package への波及や cache hit/miss の再現性は保証しない。

- **教訓**: pre-push の auto-loop と CI full coverage を併用し、ローカルでは差分 / CI では full の役割分担を固定する。
- **再発防止**: Turborepo / Nx の `affected` graph を採用するなら別タスク化（U-1 formalize 候補）。本タスクのスコープには含めない。

### L-COV80-002: Next.js page / layout の v8 unit coverage 不適合（U-2）

`apps/web` の `page.tsx` / `layout.tsx` / Edge runtime コードは v8 unit coverage で扱いにくく、include すると 0% 計上で gate を不当に落とす。

- **教訓**: `vitest.config.ts` の `coverage.exclude` で page 系を除外し、Phase 11 baseline で除外比率を確認する（30% 超は blocker 扱い）。
- **再発防止**: E2E（Playwright）coverage 導入は別タスク（U-2 formalize 候補）。本タスクは exclude 維持。

### L-COV80-003: Vitest workspace 移行の規模（U-3）

単一 root config + multi-include は導入が軽い一方、package ごとに include / exclude / setup 差分が増えると肥大化する。

- **教訓**: 本タスクは root config に閉じる。workspace 化は中規模リファクタとして U-3 formalize 候補に切り出す。
- **再発防止**: 移行時は workspace 共通設定から 80% threshold を継承する設計とし、package 別 drift を起こさない。

### L-COV80-004: soft → hard 切替忘却（U-4 / 高優先）

PR① merge 後に PR③ を出さないと、`coverage-gate` が warning のまま定着し本タスクの目的（hard gate 化）が達成されない。

- **教訓**: PR① runbook に PR③ owner と期限を明記する。Issue reminder か scheduled workflow で強制化（U-4 formalize 候補）。
- **再発防止**: `documentation-changelog.md` で「PR① merge 後、user 承認後の `pnpm indexes:rebuild` / branch protection contexts 登録」を Phase 13 ゲートとして明記。

### L-COV80-005: 4 系正本 drift の構造的リスク（U-5）

`codecov.yml` を後から導入する場合、`codecov.yml` / `coverage-guard.sh` / `quality-requirements-advanced.md` / `vitest.config.ts` の 4 箇所に閾値が現れ、片方だけ古い値に戻る drift が起きやすい。

- **教訓**: aiworkflow-requirements を「正本」、vitest config を「実行設定」として対応表を本ファイルに固定。
- **再発防止**: Codecov 導入時は threshold sync lint（node script）を CI に追加（U-5 formalize 候補）。現 repo に `codecov.yml` は存在しない。

## NON_VISUAL Phase 12 Part 1 / Part 2 構成の適用知見

- **Part 1（中学生レベル）** に「カバレッジ通信簿 / 80% 現実解 / auto-loop ループ / 鶏卵問題（3 段階 PR）」の 4 つの例え話を載せる構成が、governance / quality 系で再利用しやすい。
- **Part 2（開発者技術詳細）** は vitest config / `coverage-guard.sh` 関数シグネチャ（`parse_args` / `collect_summary` / `aggregate_pkg_pct` / `format_top10_failure` / `emit_test_template_paths` / `main`）/ exit code 表（0 / 1 / 2）/ CI YAML soft & hard 両形 / lefthook YAML / 3 段階 PR の git switch / commit / push / gh pr create を網羅する。
- 詳細は `outputs/phase-12/implementation-guide.md` 参照。

## branch protection / contexts 登録の上流前提（5 重明記）

UT-GOV-004 完了 → UT-GOV-001 contexts 登録 → 本タスク PR③ hard gate 化、の依存関係を Phase 1 / 2 / 3 / 11 / 12 で 5 重明記している。実 `gh api PUT` は UT-GOV-001 経由で user 承認後に実施する（本タスク wave では実行しない）。

## 実行タイミングまとめ

| 操作 | タイミング |
| --- | --- |
| LOGS.md / `quality-requirements-advanced.md` / `coverage-standards.md` / lessons-learned 追記 | 本 wave |
| commit / push / PR 作成 | Phase 13 user 承認後 |
| `pnpm indexes:rebuild`（topic-map 再生成） | PR③ merge 後の別オペレーション |
| branch protection contexts 登録 | PR③ merge 後、UT-GOV-001 経由 |

## 関連リソース

- `docs/30-workflows/coverage-80-enforcement/`（Phase 1〜13 仕様書 / outputs）
- `scripts/coverage-guard.sh` / `scripts/coverage-guard.test.ts`
- `vitest.config.ts`（coverage セクション）
- `.github/workflows/ci.yml`（`coverage-gate` job）
- `lefthook.yml`（pre-push.commands.coverage-guard）
- `references/lessons-learned-ut-gov-001-2026-04.md`（branch protection apply 上流）
- `references/lessons-learned-ut-gov-004-branch-protection-context-sync.md`（contexts 同期上流）
