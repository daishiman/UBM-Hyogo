# Phase 3: 設計レビュー / ADR

[実装区分: 実装仕様書]

## ADR: write/tag/note provider injection strategy

Status: Proposed for implementation.

## decision

Hono ctx provider を採用する。DI container は採用しない。移行対象は、route/workflow から直接呼ばれ、テストで差し替え需要があり、write 副作用を持つ repository に限定する。ADR の結論は今回実装サイクル内でコード変更に反映し、評価だけで完了扱いにしない。

## provider 判定

| provider | 判定 | 根拠 |
| --- | --- | --- |
| `adminNotesProvider` | 移行 | `/me` self request、`/admin/requests`、`/admin/member-notes` が共有し、テスト mock 需要が高い |
| `auditLogProvider` | 移行 | `/me`、admin note/status/dashboard/meeting/attendance、audit browsing、workflow の監査副作用を差し替え可能にする必要がある |
| `notificationOutboxProvider` | 移行 | 既に factory があり、admin request resolve の副作用をテストで分離できる |
| `tagDefinitionsProvider` | 移行 | `tagQueueResolve` の unknown tag 分岐を provider mock で固定できる |
| `tagQueueProvider` | 移行（method 限定） | resolve / retry / DLQ 系に必要な state transition method だけを provider 化し、既存 scheduled workflow は明示 bundle で受け取る |
| `memberTagsProvider` | 移行（workflow 専用 method 限定） | read-only 規約を維持し、`tagQueueResolve` の確認済み write helper だけを workflow 専用 provider に含める |

## rejected alternatives

| 代替案 | 却下理由 |
| --- | --- |
| 評価 ADR だけで close | Issue #532 の目的達成にコード変更が必要であり CONST_004/007 に反する |
| 全 repository 一括 provider 化 | scope が広がり、関係ない read repository まで巻き込む |
| DI container 導入 | provider 6 件の薄い factory で十分。依存解決モデルを増やす必要がない |
| optional `deps?` 再導入 | Issue #371 で撤去した signature drift / silent fallback を再発させる |

## review checklist

- `AttendanceProvider` の既存 ctx 経路を破壊していない。
- provider 未注入時に `[]` / `null` fallback しない。
- `memberTags` read-only type test の例外を増やす場合は `tagQueueResolve` 専用であることを明記する。
- Issue #532 は CLOSED 維持で、GitHub state を変更しない。
- Phase 2 の確定移行セットは 6 provider に固定し、それ以外の repository へ機械的に広げない。

## メタ情報

- task_id: issue-532-extend-ctx-injection-to-write-tag-note-providers
- taskType: implementation
- visualEvidence: NON_VISUAL
- state: implemented-local

## 目的

Issue #371 の Hono ctx provider pattern を write/tag/note repository へ必要最小限で展開するため、この Phase の判断・作業・証跡を固定する。

## 実行タスク

- Phase 本文の判断を確認する。
- 関連する証跡・完了条件を更新する。
- 後続 Phase との依存を確認する。

## 参照資料

- `index.md`
- `artifacts.json`
- `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-03/adr-di-strategy.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 実行手順

1. 対象ファイルと依存関係を確認する。
2. Phase 固有の判断を本文に反映する。
3. 完了条件と成果物の整合を確認する。

## 成果物

- この Phase の Markdown 本文。
- 必要な場合は `outputs/phase-N/` 配下の補助証跡。

## 完了条件

- [x] taskType / visualEvidence / Issue #532 CLOSED boundary が矛盾していない。
- [x] Phase 固有の完了条件が本文に記録されている。
- [x] focused changed-path tests / typecheck / lint / grep gates は PASS として記録済み。
- [ ] full coverage threshold は PR 前 verification debt。`docs/30-workflows/unassigned-task/task-issue-532-api-full-coverage-rerun-miniflare-port-exhaustion-001.md` を完了または blocker 記録してから PR 作成へ進む。`coverage-guard.sh --package -hyogo/api` は PASS/NO-OP であり threshold PASS とは扱わない。

## タスク100%実行確認【必須】

- [x] 仕様作成 wave と実装 evidence wave の境界を明記した。
- [x] commit / push / PR は実行していない。

## 次Phase

- 次の Phase は `artifacts.json` の phase order に従う。

## 統合テスト連携

- NON_VISUAL API/internal refactor のため、focused tests、typecheck、lint、coverage guard、grep gate を Phase 11 evidence に集約する。

## 多角的チェック観点（AIが判断）

- 30種思考法の compact evidence に基づき、矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## サブタスク管理

- 本 workflow 内で完結する改善は同一 cycle で反映する。未タスク化は技術的・整合性的に分離が必要な場合だけ行う。
