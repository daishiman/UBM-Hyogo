# Phase 13: Commit / PR draft

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-998-members-publish-state-production-rollout |
| phase | 13 |
| state | implemented_local_runtime_pending |
| user_gate | commit / push / PR / staging deploy / backfill apply / production rollout は全て user-gated |

## 目的

この Phase は issue #998 を production まで解決する実装サイクルの commit / PR draft を固定する。**commit / push / PR 作成は user の明示承認後にのみ実行する**。Issue #998 は CLOSED のため PR 文脈は `Refs #998` のみを使う。本サイクルでは draft の確定のみを行う。

## 参照資料

- 依存 Phase: phase-01 / Phase 1, phase-02 / Phase 2, phase-03 / Phase 3, phase-10 / Phase 10, phase-11 / Phase 11, phase-12 / Phase 12
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `tasks/task-a-production-flag-enablement.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。
- [ ] commit / PR は user 承認後に実行（本サイクルでは draft のみ）。

## Branch

`feat/issue-998-members-publish-state-production-rollout`

## Commit (single, 実装サイクルで Task A 変更後に作成)

```
feat(api): enable MEMBERS_AUTO_PUBLISH_ON_CONSENT in production for members publish-state rollout (#998)

- apps/api/wrangler.toml の production MEMBERS_AUTO_PUBLISH_ON_CONSENT を "false"→"true" に変更
- consent='consented' の member_only を sync 時に public へ昇格（decidePublishState）。
  admin override (hidden / 非 system:* updated_by) は保護
- 既実装（auto-publish policy / sync 統合 / backfill endpoint / diagnostics / ops scripts）は不変・再利用
- staging / production runtime ops（deploy / backfill apply / browser smoke）は runbook として確定（user-gated）

Issue #998 は CLOSED 維持（PR は `Refs #998` のみ）。
```

> **本サイクルのコード差分は `apps/api/wrangler.toml` の production flag 1 行 + コメント更新のみ**。新規シンボル・新規テスト追加なし。spec docs（`docs/30-workflows/issue-998-.../` 一式）と同一 commit に含める。

## PR

- base: `dev`
- title: `feat(api): members publish_state production rollout (enable auto-publish flag) (#998)`
- body:
  - ## Summary
    - Google Form 回答済み会員が production `/members` に表示されない根本問題を production まで解決する。
    - 根因は production deploy 前の runtime では `MEMBERS_AUTO_PUBLISH_ON_CONSENT` 旧設定で sync 時に `member_only` が `public` へ昇格しないこと、および既存 record が backfill apply まで `member_only` に滞留すること。
    - 親ワークフローでローカル実装済みの auto-publish policy / diagnostics / backfill / ops scripts を不変・再利用し、production flag を有効化する。
    - staging → production の安全順序（直列）で runbook を確定。本番 D1 mutation は dry-run + approval marker + admin override 保護 + backup + rollback 手順で監査運用を閉じる。
  - ## Changes
    - `apps/api/wrangler.toml`: production `MEMBERS_AUTO_PUBLISH_ON_CONSENT` を `"true"` へ（staging は既に `"true"`）。
    - `docs/30-workflows/completed-tasks/issue-998-members-publish-state-production-rollout/`: Phase 1-13 + tasks A/B/C + Phase 12 strict 7 の実装仕様書 + runbook。
  - ## Test plan
    - [ ] `pnpm --filter @ubm-hyogo/api typecheck` green
    - [ ] `pnpm --filter @ubm-hyogo/api build` green
    - [ ] 4 focused spec（auto-publish / backfill / diagnostics contract / sync contract）green
    - [ ] staging deploy → diagnose-pre → backfill dry-run → approval → apply → diagnose-post → `/members` browser smoke（user-gated）
    - [ ] production deploy → diagnose-pre → backfill dry-run → approval → apply → diagnose-post → `/members` browser smoke + rollback 手順確認（user-gated）
  - ## Linked
    - 解決対象: #998（**CLOSED 維持。PR は `Refs #998` のみ**）
    - 関連: #956 (CLOSED, H1), #957 (CLOSED, H2), #958 (CLOSED, H3 UX), #959 (CLOSED, H4)
    - 親 workflow: `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/`

## PR に含めるファイル一覧

- `docs/30-workflows/completed-tasks/issue-998-members-publish-state-production-rollout/` 一式（index.md / artifacts.json / phase-01..13 / outputs/phase-12/* / tasks/*）。
- `apps/api/wrangler.toml`（**実装サイクルで Task A の flag 変更を適用した後に含める**）。

## issue #998 の扱い

- issue #998 は GitHub 上 **CLOSED**。PR 文脈は `Refs #998` のみとし、Issue state mutation は行わない。
- production runtime evidence（`/members` 復旧 screenshot + diagnose-post の `visiblePublicCount` 増加）が取得され、ユーザーが close を明示承認した後にのみ close する。

## ユーザー gated 項目

- commit
- push
- PR 作成
- staging deploy / staging backfill apply / staging browser smoke
- production deploy / production D1 backup / production backfill apply / production browser smoke / rollback
- Issue #998 は CLOSED 維持（PR は `Refs #998` のみ）

## 実行タスク

1. ユーザーの明示承認後にのみ commit を作成する（PR base=dev）。
2. PR 本文に変更ファイル一覧（docs/30-workflows/issue-998-.../ 一式 + 実装サイクルで変更した `apps/api/wrangler.toml`）を記載する。
3. issue #998 は CLOSED 維持。PR 文脈は `Refs #998` のみ。
