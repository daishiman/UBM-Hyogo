# issue-346-08a-canonical-workflow-tree-restore — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-346-08a-canonical-workflow-tree-restore |
| ディレクトリ | docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore |
| Issue | #346 (CLOSED — 仕様書作成時点で既に close 済。本仕様書は close されたまま作成する運用) |
| 親タスク | 09c-serial-production-deploy-and-post-release-verification |
| Wave | 復旧系 (canonical tree restore) |
| 実行種別 | sequential |
| 作成日 | 2026-05-02 |
| 担当 | docs-governance / aiworkflow-requirements 正本管理 |
| 状態 | spec-created / Phase 1-12 completed / Phase 13 pending_user_approval |
| タスク種別 | docs-only / NON_VISUAL |
| 優先度 | high |
| 規模 | medium |
| 発見元 | 09c production release runbook の上流 contract gate 不整合検知 |

## purpose

08a workflow の canonical path `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` は本タスクで復元済みである。09c production release runbook は 08a を **上流 contract gate** として参照しており、復元済み canonical root へ trace できることが production release gate の前提になる。

本タスクは、08a の正しい状態を「**A. canonical tree 復元**」「**B. completed-tasks への移動を正本化**」「**C. current/partial trace 正本化**」のいずれかに確定し、最終的に **A. canonical tree 復元** を採用した。その決定を `aiworkflow-requirements` 正本（`legacy-ordinal-family-register.md` / `resource-map.md` / `task-workflow-active.md`）と 09c の参照に同時反映することで、broken link を消滅させ production release gate の trace 可能性を回復することを目的とする。

## scope in / out

### scope in

- 08a canonical tree の **物理状態調査**（canonical path / completed-tasks / `02-application-implementation/08a-A-*` 派生 dir / archived 候補の有無）
- 状態決定（A 復元 / B completed-tasks 移動正本化 / C current/partial 分類）の確定と aiworkflow-requirements への反映
- `aiworkflow-requirements` の 3 ファイル更新: `legacy-ordinal-family-register.md` / `resource-map.md` / `task-workflow-active.md`
- 09a-staging-deploy / 09b-observability-and-cd-post-deploy / 09c-serial-production-deploy-and-post-release-verification の **08a 参照同期**（broken link 解消）
- `docs/30-workflows/unassigned-task/` 配下の 08a 参照を必要に応じ同期（UT-08A-01〜06、本タスク自身の起票元）
- `pnpm indexes:rebuild` による aiworkflow-requirements indexes 再生成と CI gate `verify-indexes-up-to-date` 通過

### scope out

- 08a test suite の **新規実装**（08a 配下の各サブタスク UT-08A-01〜06 はそれぞれ別タスクとして既起票済み、本タスクでは扱わない）
- production deploy の実行（09c 責務）
- 08a の機能設計や AC の見直し（canonical path / 状態分類の正本化のみが本タスク責務）
- aiworkflow-requirements indexes 仕様自体の改修（既存 schema を踏襲）
- GAS prototype 系の昇格（不変条件 #6 を遵守）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流参照 | docs/30-workflows/unassigned-task/task-08a-canonical-workflow-tree-restore-001.md | 起票元の未タスク仕様（背景・AC 一次出典） |
| 上流参照 | .claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md | 08a 系列の状態正本 |
| 上流参照 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | workflow tree 物理 path の正本 |
| 上流参照 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | アクティブ workflow の正本 |
| 後続 | 09a-staging-deploy | 上流 contract gate (08a) の参照同期先 |
| 後続 | 09b-observability-and-cd-post-deploy | 上流 contract gate (08a) の参照同期先 |
| 後続 | 09c-serial-production-deploy-and-post-release-verification | 上流 contract gate (08a) の参照同期先（最重要） |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-08a-canonical-workflow-tree-restore-001.md | 起票元 |
| 必須 | .claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md | 08a 状態の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | physical path 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | アクティブ workflow リスト |
| 必須 | docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/ | 復元済み canonical workflow root |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #5 / #6 / #7 |
| 参考 | docs/30-workflows/completed-tasks/ | 完了タスクの命名規約参照 |

## AC（Acceptance Criteria）

- AC-1: 08a canonical path の **現状（実在 / 不在 / どこに移動しているか）** が `outputs/phase-11/evidence/file-existence.log` に記録されている
- AC-2: 状態決定（A / B / C）が `outputs/phase-02/main.md` に **判定根拠付きで** 確定している
- AC-3: `aiworkflow-requirements` の 3 ファイル（`legacy-ordinal-family-register.md` / `resource-map.md` / `task-workflow-active.md`）が AC-2 の決定と整合している（drift 0）
- AC-4: 09a / 09b / 09c の 08a 参照が broken link でない（`9a-9b-9c-link-check.log` が PASS）
- AC-5: `docs/30-workflows/unassigned-task/` 配下の 08a 参照が新状態と整合（`unassigned-task-grep.log` が PASS）
- AC-6: `pnpm indexes:rebuild` 実行後に `.claude/skills/aiworkflow-requirements/indexes` の drift が 0（`verify-indexes.log` が PASS）
- AC-7: secret 値（API token / OAuth secret 等）が canonical path 名・file 名・evidence に**含まれない**ことを Phase 9 secret hygiene check で確認

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点（A / B / C 3 択）と AC-1〜7 確定、Schema/共有コード Ownership 宣言 |
| 2 | 設計 | phase-02.md | 状態分類決定アルゴリズム、aiworkflow-requirements 反映設計、09a-c 参照同期方針 |
| 3 | 設計レビュー | phase-03.md | A / B / C 代替案と PASS-MINOR-MAJOR、base case 別差分マトリクス |
| 4 | タスク分解 | phase-04.md | T1 物理状態調査 / T2 aiworkflow-requirements 更新 / T3 09a-c 参照同期 / T4 unassigned 同期 |
| 5 | 実装計画 | phase-05.md | runbook（編集順序: 調査→決定→aiworkflow→09a-c→unassigned→検証） |
| 6 | テスト戦略 | phase-06.md | 検証戦略: `test -e` / `rg` 整合 / state 欄一致確認 |
| 7 | 受入条件マトリクス | phase-07.md | AC × evidence × 不変条件 マトリクス |
| 8 | CI / 品質ゲート | phase-08.md | `verify-indexes-up-to-date` / markdown link check / indexes 再生成 |
| 9 | セキュリティ / boundary 検証 | phase-09.md | secret hygiene / boundary lint 不要の判定根拠（docs-only） |
| 10 | ロールアウト / 後続連携 | phase-10.md | 09a-c の上流 contract gate 表現確定、08a follow-up 起票先方針 |
| 11 | evidence 取得 (NON_VISUAL) | phase-11.md | 7 種 log evidence の取得コマンド明記 |
| 12 | close-out | phase-12.md | implementation-guide / 仕様同期 / 未タスク / skill-feedback / compliance check |
| 13 | PR 作成 | phase-13.md | 承認ゲート + commit 5 単位 + push + PR + `Refs #346` |

## 不変条件参照

- 不変条件 **#5**（D1 直接アクセス禁止）: 本タスクは docs-only であり `apps/web` / `apps/api` のコードに触れない。boundary lint 影響なしを Phase 9 で明記する。
- 不変条件 **#6**（GAS prototype 昇格禁止）: 本タスクの 08a 状態正本化は `docs/00-getting-started-manual/gas-prototype/` を参照しない。GAS prototype を canonical workflow tree に昇格させる経路は本タスクで作らない。
- 不変条件 **#7**（Google Form 再回答が本人更新の正式経路）: 08a は API contract / repository / 認可 test の系列であり、フォーム再回答経路の変更を伴わない。本タスクで触れない。

## 補足

- Issue #346 は仕様書作成時点で **CLOSED** だが、ユーザー指示により close されたまま本仕様書を作成する。close 状態と `metadata.issue_state_at_spec_time = "CLOSED"` を artifacts.json に記録し、Phase 13 では `Refs #346` を採用、`Closes` は使用しない。
- 本タスクは `docs-only` のため `apps/api` / `apps/web` のビルド・型チェックに影響を与えない設計。Phase 8 / 9 でその根拠を明記する。
- 本タスクの帰結により aiworkflow-requirements indexes が再生成されるため、merge 後は `verify-indexes-up-to-date` CI gate を必ず通過させる。
