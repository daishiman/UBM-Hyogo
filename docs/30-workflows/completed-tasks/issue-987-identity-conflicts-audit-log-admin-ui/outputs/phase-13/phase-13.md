# Phase 13: PR作成（Issue #987 dismiss 監査ログ対称化 / user-gated）

## 状態

`pending_user_approval`。commit / push / PR は user の明示承認後のみ実行する。本サイクルではコード実装と local focused evidence まで完了済みであり、この Phase は承認後の commit / push / PR 境界を扱う。

## なぜ blocked か

- 不可逆操作（commit / push / `gh pr create` / staging・prod deploy / D1 への監査記録書き込みを伴う runtime 確認）を含むため、user の明示承認なしに実行しない（CLAUDE.md PR 作成フローおよび三役ゲート方針に準拠）。
- Issue #987 は CLOSED のまま参照する（再 OPEN・再 close 試行を避けるため PR / commit では `Refs #987` を用い、`Closes #987` は使わない）。

## Phase 12 までの完了根拠

- Phase 1-13 仕様書作成済。Phase 12 strict 7 outputs を `outputs/phase-12/` に全件配置（`phase12-task-spec-compliance-check.md` の §5 で present 確認）。
- 実コードと focused D1 tests は同一サイクルで完了済み。本 Phase は追加の全体検証 → 承認 → PR を直列で通す。

## base ブランチ

`dev`（CLAUDE.md PR 作成フローの既定。production リリース時のみ `dev → main`）。

## 三役ゲート（直列・各ゲート独立承認）

| # | ゲート | 通過条件 | Claude 実行可否 |
| --- | --- | --- | --- |
| 1 | user 承認ゲート | change-summary + 実装差分 + テスト結果 + rollback 方針を提示し、明示文言で承認取得 | 承認まで実行禁止 |
| 2 | ローカル検証ゲート | ゲート 1 PASS 後、`pnpm typecheck` / `pnpm lint` / focused vitest を実行しログ記録 | ゲート 1 後のみ |
| 3 | push / PR 作成ゲート | ゲート 2 PASS 後、commit → push → `gh pr create --base dev` | ゲート 2 後のみ |

> 曖昧な合意（「いいよ」程度）では実行しない。`change-summary.md` 提示後の明示指示を要件とする。

## ローカル検証（コード実装後・ゲート 2 で実施）

| コマンド | 期待結果 | 記録先 |
| --- | --- | --- |
| `mise exec -- pnpm typecheck` | green | `outputs/phase-13/local-check-result.md` |
| `mise exec -- pnpm lint` | green（必要時 `--fix`） | 同上 |
| `pnpm exec vitest run --config=vitest.d1.config.ts apps/api/src/repository/__tests__/identity-conflict.repository.spec.ts apps/api/src/routes/admin/identity-conflicts.contract.spec.ts apps/api/src/routes/admin/audit.contract.spec.ts` | dismiss → audit_log `identity.dismiss` 記録検証 / audit filter PASS | 同上 |

> `local-check-result.md` は Phase 13 着手時の最初のチェックリストに含める必須成果物。

## コミット粒度

| # | 粒度 | 含むファイル例 |
| --- | --- | --- |
| 1 | impl | `apps/api/src/repository/identity-conflict.ts`（dismiss D1 batch 化 + audit_log INSERT）、`apps/api/src/routes/admin/identity-conflicts.ts`（`actorAdminEmail` 配線） |
| 2 | test | `apps/api/src/routes/admin/identity-conflicts.contract.spec.ts`、`apps/api/src/routes/admin/audit.contract.spec.ts` |
| 3 | spec | `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/**`（index.md / phase 群 / artifacts.json） |
| 4 | docs / skill sync | aiworkflow-requirements / task-specification-creator routing の same-wave 同期 |

> revert 単位 = commit 単位を保つ。コミットメッセージ末尾に `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` を付与する。

## PR 本文骨子

- **タイトル案**: `fix(admin): identity-conflicts dismiss を audit_log に記録（merge と対称化） Refs #987`
- **背景 / 根本問題**: merge は既に `audit_log` → `/admin/audit` で閲覧可能だが、dismiss は `identity_conflict_dismissals` への単一 INSERT のみで監査ログに残らず、「誰がいつどの会員を別人と判断したか」を追跡できなかった。
- **解決**: `dismissIdentityConflict()` を D1 batch 化し `audit_log` に `action='identity.dismiss'`（target_type=`member` / target_id=target / actor_id / actor_email / before_json / after_json / created_at=dismissedAt）を記録。route で `actorAdminEmail` を配線。
- **UI 変更**: なし（既存 `/admin/audit` の `action=identity.dismiss` フィルタで閲覧可能）。
- **migration**: なし（`audit_log` 既存）。
- **テスト**: `identity-conflicts.contract.spec.ts`（dismiss → audit_log 記録）、`audit.contract.spec.ts`（`identity.dismiss` フィルタ通過）。
- **endpoint 外形**: 不変（`POST /identity-conflicts/:id/dismiss` の request/response/status は維持）。
- **Issue 参照**: `Refs #987`（CLOSED のまま。`Closes` は使わない）。
- **Phase 11 evidence**: NON_VISUAL のためスクリーンショットなし。代替証跡 = vitest contract（スクリーンショット専用セクションは設けない）。

## user-gated runtime ops（PR merge 後 / 別承認）

- staging deploy: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`
- authenticated `/admin/audit` で `action=identity.dismiss` フィルタ → dismiss 操作後に行が出現することを確認
- prod deploy + 同確認（追加承認）
- 失敗時 rollback: `bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env <env>`

## Phase 13 成果物（PR 実行時に作成）

| 成果物 | 役割 |
| --- | --- |
| `outputs/phase-13/local-check-result.md` | typecheck / lint / vitest ログ |
| `outputs/phase-13/change-summary.md` | PR 作成前に user 提示 |
| `outputs/phase-13/pr-info.md` | PR URL / CI 結果 / `Refs #987` |
| `outputs/phase-13/pr-creation-result.md` | commit SHA / push / PR 作成ログ |

## approval-gated 注意

- ゲート間の合算承認禁止（各ゲートで個別の明示文言）。
- 逆順実行禁止（ローカル検証 PASS 前に push しない）。
- production deploy は staging 確認後に別途追加承認を取得する。
