# Phase 6: 異常系検証

[実装区分: 実装仕様書]

## failure cases

| ID | ケース | 期待 |
| --- | --- | --- |
| F-01 | provider middleware 未 mount | `Error("<provider> not bound to context")` |
| F-02 | `/me` self request で note 作成成功、audit 失敗 | 既存挙動に合わせて request は失敗扱い。silent success 禁止 |
| F-03 | admin request resolve で outbox enqueue 失敗 | 既存 500/警告ログ境界を維持し、PII をログに出さない |
| F-04 | tag queue unknown tag code | `TagQueueResolveError("unknown_tag_code")` 維持 |
| F-05 | tag queue race lost | guarded update 後の副作用が走らない |
| F-06 | memberTags provider に一般 write method が増える | type-level test で FAIL |

## 追加テスト方針

- provider 未注入の単体テストは repository provider helper で実施する。
- route integration は mock provider を `c.set` する fixture middleware を使う。
- D1 mock の SQL 挙動を変えず、provider 差し替えが目的のテストにする。

## コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- repository-providers routes/me routes/admin/requests workflows/tagQueueResolve
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
```


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
