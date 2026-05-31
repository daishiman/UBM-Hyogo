# Phase 13: 承認ゲート / PR

## メタ情報

- task_id: `admin-layout-sidebar-shell-migration`
- task_type: `implementation`
- 実装区分: **実装仕様書**（CONST_004 判定根拠は `index.md` 参照）
- 前 Phase: 12（documentation strict 7） / 最終 Phase
- 作成日: 2026-05-29
- 判定: **blocked**（user の明示承認がない限り commit / push / PR を実行しない・CONST_002）

## ルール（CONST_002・テンプレ準拠）

1. user の明示承認がない限り blocked のままにする。曖昧な合意（「いいよ」程度）では実行しない。
2. ローカル確認を省略しない。
3. commit / PR を自動で作らない。
4. PR base は `dev`（CLAUDE.md「PR作成の完全自律フロー」既定方針。`main` は production リリース時のみ）。

## なぜ blocked か（本サイクルの境界）

- 本サイクルは **spec のみ**（`workflow_state=spec_created`）。実コード差分・local visual capture・commit・push・PR は
  **Gate-B / Gate-C の user-gated execution wave** に属する。
- さらに **実装着手の物理前提**として Task A（`SidebarShellServer`）/ Task B（`SidebarUserMenu`）/ Task E（`SidebarMobileTrigger`）の完成が必要
  （phase-1 前提条件 / phase-2 dependency matrix / phase-3 NO-GO 条件で 3 箇所重複明記）。
  現時点で `apps/web/src/components/shell/` は未作成のため、Phase 5（実装）に進めない。
- したがって Phase 13 は **blocked**。本ファイルは PR を出すための contract（成果物 / ゲート / local check 項目）を定義するのみ。

## Phase 12 までの完了根拠

- Phase 1-3: AC-1〜AC-10 / layout 新形 / 削除 6 ファイル / Task A 契約境界 / NO-GO 条件を確定（spec foundation = Gate-A）。
- Phase 4-10: テスト計画（4 ケース + DOM contract）/ 実装手順（mount 書換 → 削除 → grep）/ 回帰 / カバレッジ / 品質保証 / 最終レビューゲートを定義。
- Phase 11: UI smoke evidence 6 点 + screenshot 計画 10 entry を contract 化。状態語彙は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。
- Phase 12: strict 7 成果物（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / compliance-check）を作成。

## Task A/B/E 依存の明記

| 依存 | 提供物 | 本タスクでの利用 | 実装着手条件 |
| --- | --- | --- | --- |
| Task A | `apps/web/src/components/shell/SidebarShell.server.tsx`（`SidebarShellServer`） | layout から `{ activePath, children, mobileTriggerSlot }` で呼び出し。schemaDiffCount は shell 内部算出 | A 完成 → D 実装着手 |
| Task B | admin role の `SidebarUserMenu`（4 action） | shell 左下に embed（layout は呼ばない） | B 完成 |
| Task E | `apps/web/src/components/shell/SidebarMobileTrigger.tsx` | layout の `mobileTriggerSlot` に注入 | E 完成（暫定空 slot は Phase 11 で要確認） |

> PR は本タスク実装と Task A/B/E 完成が揃ってから出す。親 workflow `unified-sidebar-shell-public-and-admin` の wave 順序に従う場合はその wave に合わせる。

## 必須成果物 4 点

| 成果物 | 役割 | 本サイクルでの状態 |
| --- | --- | --- |
| `outputs/phase-13/local-check-result.md` | typecheck / lint / test / coverage-guard のローカル検証ログ | Gate-B 後に実行・記録（**見落とし注意の必須成果物**） |
| `outputs/phase-13/change-summary.md` | 変更サマリー（PR 作成前に user へ提示） | spec で項目を確定、実差分確定後に記入 |
| `outputs/phase-13/pr-info.md` | PR 作成後の URL / CI 結果 / Issue 参照 | Gate-C（PR 作成）後に記録 |
| `outputs/phase-13/pr-creation-result.md` | PR 作成プロセスの実行ログ（commit SHA / push 結果 / API response） | Gate-C 後に記録 |

> `local-check-result.md` は Phase 13 着手時の最初のチェックリストに含める。

## 三役ゲート（user 承認 → local 確認 → push & PR）

各ゲートは独立。前段 PASS まで次段を実行しない。合算承認禁止。

| # | ゲート | 通過条件 | Claude が実行可か |
| --- | --- | --- | --- |
| 1 | user 承認ゲート | `change-summary.md` + 実行 plan + 依存（A/B/E 完成）充足を提示し、user の **明示文言** で承認取得 | 承認取得まで実行禁止 |
| 2 | local 確認ゲート | ゲート 1 PASS 後、下記 local check 4 コマンドを実行し全 green を `local-check-result.md` に記録 | ゲート 1 後にのみ実行 |
| 3 | push / PR 作成ゲート | ゲート 2 PASS 後、commit → push → `gh pr create --base dev` | ゲート 2 後にのみ実行 |

### local 確認ゲートの検証コマンド

| command | 目的 |
| --- | --- |
| `mise exec -- pnpm typecheck` | 型整合 |
| `mise exec -- pnpm lint` | lint（失敗時は `pnpm lint --fix` 後に残違反を手修正） |
| `mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/app/\(admin\)` | layout.spec（4 ケース + DOM contract）green |
| `bash scripts/coverage-guard.sh` | coverage exit 0（`apps/web` >=80%） |
| `git grep -l "components/layout/AdminSidebar"` | 削除完了 gate（ヒット 0 件・AC-2/不変条件 #7） |

## コミット粒度（revert 単位 = commit 単位）

| # | 粒度 | 含むファイル例 |
| --- | --- | --- |
| 1 | spec（仕様書本体） | `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/phase-*.md` / `index.md` / `artifacts.json` |
| 2 | outputs（生成物） | `outputs/phase-01〜phase-13/` |
| 3 | impl（layout 書換 + 削除 + spec 書換） | `apps/web/app/(admin)/layout.tsx` / `layout.spec.tsx` / 削除 6 ファイル |
| 4 | docs / skill sync（同 wave 同期） | `.claude/skills/**` / `indexes/*` |
| 5 | LOGS row | `docs/30-workflows/LOGS.md` |

## Issue 参照方針

- 親 workflow / source task に対応 Issue がある場合は **`Refs #<issue>`** を使用する（後追い適用で誤 close を避けるため `Closes` は使わない）。
- 対応 Issue が無い場合は Issue 行を作らない。

## change-summary に提示する内容（user 承認ゲート用）

- 変更概要: admin layout を SidebarShell へ移行 / 旧 AdminSidebar 系 6 ファイル削除 / layout.spec.tsx 書き換え
- `git diff dev...HEAD --name-only` 相当のファイル一覧（mount 書換 + 削除 + spec）
- local check 4 コマンドの結果（全 green）
- 依存ゲート（Task A/B/E 完成）充足の確認
- AC-1〜AC-10 の達成根拠と Phase 11 evidence（screenshot capture 状態）
- PR title / body 概要（base = `dev`）

## 多角的チェック観点（AIが判断）

- Task A/B/E が未完成のまま実装 evidence を主張しない（phase-3 blocked 条件）。
- `local-check-result.md` を省略しない。`git grep` 0 件を local check に含める。
- PR base を `dev` 以外にしない（production リリース時のみ `main`）。
- screenshot capture が `PENDING` のまま PR を出す場合は、Phase 11 状態語彙を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として change-summary に明示する。

## サブタスク管理

- 単一責務。サブタスク分割なし。

## 成果物

- 本 Phase: 必須成果物 4 点の contract / 三役ゲート定義 / コミット粒度 / Issue 参照方針（本ファイル + Gate-B/C 後に `outputs/phase-13/`）。

## 完了条件

- [ ] blocked 理由（spec-only + A/B/E 依存）を明記した
- [ ] 必須成果物 4 点（local-check-result / change-summary / pr-info / pr-creation-result）を定義した
- [ ] 三役ゲート（user 承認 → local 確認 → push & PR）と local check コマンドを定義した
- [ ] PR base = `dev`、Issue 参照 = `Refs #<issue>` 方針を明記した
- [ ] Task A/B/E 依存を表で明記した

## タスク100%実行確認【必須】

- [ ] 上記「完了条件」全項目を満たした
- [ ] user の明示承認なしに commit / push / PR を実行しない設計になっている
- [ ] 実在しないコマンド/パスを local check に持ち込んでいない（`@ubm-hyogo/web` / 実在 script のみ）

## 次Phase

なし（最終 Phase）。Gate-B（実装 + local capture）/ Gate-C（commit / push / PR）は user 承認後の execution wave。
