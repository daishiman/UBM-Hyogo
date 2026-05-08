# 品質ゲート / Phase 境界 / 検証コマンド

## 重要ルール

### Phase完了時の必須アクション

1. **タスク完全実行**: Phase内で指定された全タスクを完全に実行
2. **成果物確認**: 全ての必須成果物が生成されていることを検証
3. **artifacts.json更新**: `complete-phase.js` でPhase完了ステータスを更新
4. **完了条件チェック**: 各タスクを完遂した旨を必ず明記

### PR作成に関する注意

**PR作成は自動実行しない。必ずユーザーの明示的な許可を得てから実行すること。**

📖 [commands.md](commands.md) - コマンド一覧

## Phase 12 と Phase 13 の境界

| Task      | 完了条件                                                                                                              | 詳細                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Task 12-1 | `implementation-guide.md` が Part 1/2 を満たす                                                                        | [phase-12-documentation-guide.md](phase-12-documentation-guide.md)   |
| Task 12-2 | Step 1 と Step 2 の判定が記録される                                                                                   | [spec-update-workflow.md](spec-update-workflow.md)                   |
| Task 12-3 | `documentation-changelog.md` と artifacts が同期される                                                                | [spec-update-validation-matrix.md](spec-update-validation-matrix.md) |
| Task 12-4 | 0件でも `unassigned-task-detection.md` を出し、`current/baseline` を分離して記録する                                  | [unassigned-task-guidelines.md](unassigned-task-guidelines.md)       |
| Task 12-5 | 改善点なしでも `skill-feedback-report.md` を出し、`phase12-task-spec-compliance-check.md` を root evidence として残す | [patterns-phase12-sync.md](patterns-phase12-sync.md)                 |
| Phase 13  | commit と PR は user の明示承認後だけ                                                                                 | [review-gate-criteria.md](review-gate-criteria.md)                   |

UI/UX 実装を含む task では Phase 11 で screenshot と Apple UI/UX 視覚検証を行う。手順は [phase-11-screenshot-guide.md](phase-11-screenshot-guide.md) と [screenshot-verification-procedure.md](screenshot-verification-procedure.md) を使う。

NON_VISUAL タスク（API repository / library / config / boundary tooling など）で staging 未配備や実フロー前提が成立しない場合は、Phase 11 の代替 evidence プレイブックを使う: [phase-11-non-visual-alternative-evidence.md](phase-11-non-visual-alternative-evidence.md)。L1 型 / L2 lint-boundary / L3 in-memory test / L4 意図的 violation の 4 階層と「代替 evidence 差分表」で何を保証し何を保証できないかを明示する。

### Approval-Gated NON_VISUAL Implementation

Phase 13 が user approval + 実行ゲートを兼ねる NON_VISUAL implementation task では、Phase 12 までの JSON は成功証跡ではなく計画 / template / reserved path として扱う。

- `branch-protection-payload-*` など不可逆 API の PUT payload は、承認前でも完全 payload 形を保つ。部分 payload を「後で差分適用される」とみなさない。
- `current-*` / `applied-*` GET evidence は、Phase 13 承認後の fresh command output で上書きされた時だけ AC evidence にできる。
- AC matrix では spec evidence と runtime evidence を分離し、`blocked_until_user_approval` placeholder を PUT 成功や drift 解消の根拠にしない。
- Phase 12 の system spec update は `spec_created` を維持し、実行後の正本反映が必要な場合は正式 unassigned-task へ分離する。

## §7. テスト常時実行可能性 DoD（continuous test executability）

UI / API / boundary を伴うタスクの仕様書 (`docs/30-workflows/<feature>/03-spec-source/task-*.md`) では、対応するテスト群が **「いつでも誰でも 1 コマンドで pass まで通せる状態」** を DoD に含める。`taskType=implementation` のうち `testCategory ∈ {e2e, integration, contract}` を 1 つでも持つタスクは本セクションが必須。

### 7.1 仕様書側の必須記述（CONST 拡張）

実装仕様書の DoD セクションに以下 4 点を必ず明記する。曖昧表現（「テストが通る」「動作確認」のみ）は FAIL。

1. **対象テストファイルの列挙**: 仕様書実装後に GREEN になるべき spec ファイルパスを行単位で列挙する（例: `apps/web/playwright/tests/profile.spec.ts:7:3`）。
2. **常時実行コマンドの固定**: `mise exec -- pnpm --filter <pkg> exec <runner> <args>` 形式の実行コマンドを 1 行で記載。`-- --project=` 等の `--` argument misparse を避ける書式とする。
3. **実行前提（pre-requisite）の宣言**: dev server / browser binary / fixtures / D1 seed / auth session など、実行前に整っていなければならない条件を箇条書きする。各条件には**自動化スクリプト or CI step のパス**を書く（手順を書くだけは不可）。
4. **un-skip 不変条件**: `test.describe.skip` / `test.skip(true)` / `it.skip` を当該テストに**置かない**ことを明記。仕様書がカバーするテストはランタイムで skip されてはならない。

### 7.2 infra 側の必須整備（実装サイクル内で完了させる）

仕様書はテスト実行性を**仕組み**で保証する。手順書化のみで「実装者が頑張る」前提は禁止。以下 3 点を実装サイクルに含めることを仕様書側で要求する。

| 項目 | 内容 | 配置先の例 |
| --- | --- | --- |
| browser binary の確実な install | `pnpm install` 後に Playwright browsers が無い場合は明示的 install step / postinstall / CI cache のいずれかで自動化 | `package.json#scripts.postinstall` または `.github/workflows/<e2e>.yml` |
| dev server の自動起動 | `playwright.config.ts#webServer` が local で立ち上がる、または fixture が `mise exec -- pnpm dev` を起動 | `apps/web/playwright.config.ts` |
| CI gate 化 | E2E（または対応 test category）が `dev` への PR で required check として走る | `.github/workflows/*.yml`、branch protection の `required_status_checks` |

### 7.3 un-skip ポリシー（regression guard）

`test.describe.skip(...)` / `test.skip(true, '...')` を使って **「実装は別 phase で活性化する」** と先送りする運用は禁止。`CONST_007`（先送り禁止）と整合する。

- 一時的な skip が必要な場合は `test.fixme(...)` を使い、直近サイクルで GREEN へ戻す Issue 番号をコメントに付ける。
- skip / fixme を含む spec ファイルは Phase 11 evidence で「skip count = 0」を AC matrix に明記する（仕様書側で記述）。
- regression guard として `grep -rn "test.describe.skip\|test\.skip(true" apps/*/playwright/tests/` が 0 件を返すことを Phase 11 evidence に含めることを推奨。

### 7.4 Phase 11 evidence への落とし込み

VISUAL タスクは `phase-template-phase11.md` の screenshot evidence に加え、以下 3 件を `outputs/phase-11/evidence/` に必ず残す:

```
e2e-run.log              # 該当 spec のフル実行ログ（pass/fail 集計が末尾にあるもの）
e2e-skip-count.txt       # skip 集計（0 を期待）
runner-version.txt       # @playwright/test / vitest 等のバージョン固定証跡
```

NON_VISUAL タスクは [phase-11-non-visual-alternative-evidence.md](phase-11-non-visual-alternative-evidence.md) の L3 in-memory test layer と統合する。

### 7.5 E2E カバレッジ閾値（≥ 80%）

E2E（Playwright 等）でブラウザ実行型のテストを持つタスク仕様書は、`taskType=implementation` のうち `testCategory ∋ e2e` を含む場合、**E2E によるソースコード行カバレッジ 80% 以上** を DoD に組み込む。閾値・計測方式は次の通り固定する。

| 項目 | 値 / 規定 |
| --- | --- |
| 閾値 | `lines >= 80%` を最低基準。`statements / functions / branches` も併記し、いずれか 1 つでも閾値割れ時は FAIL |
| 計測対象 | UI 配下の TS/TSX（例: `apps/web/src/**`、`apps/web/app/**`）。infra（`*.config.ts` / `scripts/**`）と test 自身は除外 |
| 計測方式（Playwright） | `page.coverage.startJSCoverage()` ＋ `monocart-reporter` または `c8` でレポート生成。CI 上で `coverage/e2e/{lcov.info, coverage-summary.json}` を artifact として upload |
| 計測方式（vitest） | `vitest run --coverage` を別 step で実行し、E2E coverage と結合（`nyc merge` または `monocart` の merge）して総合カバレッジを算出してもよい |
| 閾値 enforcement | CI で `coverage-summary.json` を読み、`lines.pct < 80` なら exit 1 する step を `e2e-tests.yml` に組み込む |
| 仕様書側の記述 | 各 task-spec の DoD に「自タスクが触る module 群が新規に E2E 経由で覆われ、リポジトリ全体の `lines.pct` が 80% を**割らない**」ことを明記 |

仕様書側の記述例（DoD 抜粋）:

> - `apps/web/src/components/members/MembersFilterBar.client.tsx` の主要分岐（density 切替・query 反映）が `search-density.spec.ts` のフローで実行される
> - `coverage/e2e/coverage-summary.json` の `total.lines.pct >= 80`（リポジトリ閾値）を割らない
> - 自タスク追加 module の `lines.pct >= 80`（タスク閾値）を独立に確認

カバレッジ閾値割れが発生した場合、**spec の追加・assertion 増強で覆う**のが第一手。E2E で触れない dead code は削除を検討する。閾値を下げて pass させることは禁止。

NON_VISUAL タスクは E2E coverage 対象外とし、L3 in-memory test layer（[phase-11-non-visual-alternative-evidence.md](phase-11-non-visual-alternative-evidence.md)）の coverage 規定に従う。

### 7.6 Phase 12 close-out 検証

Phase 12 の `phase12-task-spec-compliance-check.md` で、次の 8 点を **チェックリスト** として実体検証する。1 件でも欠落していれば `verified` にせず `partial` でとどめ、未対応分は `unassigned-task` へ formalize する（CONST_007 の例外条件「外部依存待ち」等に該当する場合のみ）。

1. §7.1 (1) 対象 spec ファイル列挙
2. §7.1 (2) 1 行実行コマンド
3. §7.1 (3) 実行前提と自動化 path
4. §7.1 (4) un-skip 不変条件
5. §7.2 (1) browser binary 自動 install
6. §7.2 (2) dev server 自動起動
7. §7.2 (3) CI gate 化
8. §7.5 E2E lines coverage ≥ 80%（リポジトリ閾値・タスク閾値の両方）

## 検証コマンド

```bash
node scripts/validate-phase-output.js docs/30-workflows/{{FEATURE_NAME}}
node scripts/verify-all-specs.js --workflow docs/30-workflows/{{FEATURE_NAME}}
node ../skill-creator/scripts/quick_validate.js .claude/skills/task-specification-creator
node ../skill-creator/scripts/validate_all.js .claude/skills/task-specification-creator
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
node scripts/log-usage.js --result success --phase "Phase {{N}}"
```

Phase 12 は順序付きで検証する: `validate-phase-output` / `verify-all-specs` → `verify-unassigned-links --source` → `audit-unassigned-tasks --target-file`（必要なら `--completed-unassigned-dir`）→ `validate-phase12-implementation-guide --workflow` → workflow `generate-index --regenerate` → aiworkflow `generate-index.js` → `validate-structure.js`。mirror directory が存在する skill だけ `rsync` と `diff -qr` を実行する。存在しない `.agents/skills/<skill>` への `diff -qr` は PASS 条件にしない。
