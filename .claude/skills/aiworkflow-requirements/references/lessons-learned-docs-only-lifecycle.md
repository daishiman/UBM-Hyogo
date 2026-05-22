# Lessons Learned: docs-only / NON_VISUAL ライフサイクルモデル

> 親 hub: `references/lessons-learned.md`
> 関連: `references/task-workflow-active.md`、`indexes/quick-reference.md`、`indexes/resource-map.md`、`indexes/topic-map.md`、`changelog/20260507-task-20-screen-blueprints-public-member.md`
> 起点 task: task-20 screen blueprints public/member（2026-05-07）

## 目的

既存 markdown 仕様の同期（existing-docs-sync）を扱う docs-only / NON_VISUAL workflow について、lifecycle ラベル・endpoint surface 検証・consent key 検証の正本ルールを固定する。task-20 の Phase 12 で確立した知見の再利用カードである。

## 適用範囲

- 既存 `docs/00-getting-started-manual/specs/*.md` を正本同期する workflow
- `apps/` / `packages/` のコード変更を伴わない docs-only workflow
- 視覚的 evidence を伴わない NON_VISUAL workflow
- `SCOPE.md` §2 等 scope SSOT に拘束される UI prototype alignment family

## L-DOCS-LIFECYCLE-001: docs-only NON_VISUAL の状態語彙を固定する

### 苦戦箇所

- root `workflow_state` を `completed` に昇格させたくなるが、Phase 13 が user approval gate のため `completed` 表現は早すぎる。
- 一方で各 phase を `pending` 表現にすると、Phase 1-12 が完了している事実が伝わらない。

### 適用ルール

- root `workflow_state=spec_created` のまま固定する。
- Phase 1-12 は個別に `completed`、Phase 13 のみ `blocked_pending_user_approval`。
- 「root spec_created / Phase individual completed / Phase 13 blocked」が NON_VISUAL pattern の正本三位一体。
- `docs-only` と `NON_VISUAL` は同一 wave で必ず併記する。

### 検証

- task-20 `outputs/phase-12/phase12-task-spec-compliance-check.md` の State Vocabulary 表が PASS のまま固定。
- 同 root `artifacts.json` と `outputs/artifacts.json` が `cmp -s` で byte-identical。

## L-DOCS-LIFECYCLE-002: Endpoint surface は SCOPE と現行 route の AND で検証する

### 苦戦箇所

- 既存 spec の endpoint 表記は legacy（`/v1/public/*`、`/api/me/*`、`/auth/schemas`、`/auth/logout`、`/public/member-profile/:id`）が混在しがちで、code 側の current canonical（`apps/api/src/routes/`）と乖離する。

### 適用ルール

- endpoint surface の正本判定は次の AND 条件:
  1. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` §2 に列挙されている
  2. 現行 `apps/api/src/routes/` 配下に実 route が存在する
- どちらか一方しか満たさない記述は legacy drift として削除候補。
- 削除可否は phase-3 仕様参照と現行 route 不存在の AND で判定し、推測判定は禁止。
- Phase 11 evidence の `endpoint-surface.log` に AND 結果を残す。

### 検証

- task-20 では `/v1/public/*`、`/public/member-profile/:id`、`/auth/schemas`、`/auth/logout`、`/api/me` を 09e/09f から削除し、`GET /public/members/:memberId` / `POST /auth/magic-link` / `GET /auth/gate-state` / `GET /auth/session-resolve` / `GET /me` / `POST /me/visibility-request` / `POST /me/delete-request` を canonical として固定。

## L-DOCS-LIFECYCLE-003: consent key 統一は機械的 grep で検証する

### 苦戦箇所

- CLAUDE.md 不変条件 #2 で `publicConsent` と `rulesConsent` に統一しているが、過去 spec には `ruleConsent`（単数 s なし）が点在し、レビューで見逃される。

### 適用ルール

- `ruleConsent` は禁止語として grep gate で検出する。
- 09e/09f 等の同期対象 spec、および skill references 全体を Phase 11 evidence に grep 結果として残す。
- Allowed: `publicConsent`、`rulesConsent`、`responseEmail`（system field）。

### 検証

- task-20 では 09e/09f から `ruleConsent` を除去し `rulesConsent` に統一。

## L-DOCS-LIFECYCLE-004: existing-docs-sync の lifecycle model

### 苦戦箇所

- 「既存 markdown を更新するだけ」のタスクを new-file create と誤認すると、Phase 11 evidence shape が runtime visual を要求してしまい、close-out が止まる。

### 適用ルール

| ステージ | 状態 | 補足 |
| --- | --- | --- |
| 起点 | `spec_created` | root workflow_state は最後まで spec_created |
| 分類 | `docs-only` | apps/packages 0 diff を Phase 11 で grep 確認 |
| 視覚 | `NON_VISUAL` | screenshot は N/A、Phase 11 は compact evidence template |
| Phase 1-12 | individual `completed` | strict 7 outputs を Phase 12 で実体化 |
| Phase 13 | `blocked_pending_user_approval` | commit / push / PR は user gate |

- compact evidence template は `route-coverage.log` / `endpoint-surface.log` / `state-vocabulary.log` / `phase12-strict-outputs.log` / `aiworkflow-sync-presence.log` / `lint-availability.log` を最小集合とする。
- markdown lint script（`pnpm lint:md`）が存在しない場合は `lint-availability.log` で `N/A` と明記し、false PASS を作らない。

## L-DOCS-LIFECYCLE-005: artifacts parity は同一 wave の必須ゲート

### 苦戦箇所

- root `artifacts.json` と `outputs/artifacts.json` のどちらか片方だけ更新して PASS に見えるケースがあった。

### 適用ルール

- 両ファイルは `cmp -s` で byte-identical でなければならない。
- Phase 12 strict 7 outputs の materialize と同じ wave で parity を確認する。
- Phase 11 evidence の strict outputs log で対象 7 ファイルの存在を機械的に列挙する。

## 起点 task との対応

| 知見 | task-20 phase-12 source |
| --- | --- |
| 状態語彙 | `outputs/phase-12/phase12-task-spec-compliance-check.md` State Vocabulary |
| endpoint surface | `outputs/phase-12/implementation-guide.md` §Endpoint Surface、`outputs/phase-12/system-spec-update-summary.md` §Step 2 |
| consent key | `outputs/phase-12/skill-feedback-report.md` §ドキュメント改善 |
| docs-only lifecycle | `outputs/phase-12/main.md` §State |
| artifacts parity | `outputs/phase-12/phase12-task-spec-compliance-check.md` §Artifacts Parity |

## 不変条件

- `apps/` / `packages/` 変更なし。
- 新 endpoint / D1 schema / Google Form 仕様変更なし。
- runtime screenshot 不要（NON_VISUAL）。
- commit / push / PR は user approval まで未実行。
