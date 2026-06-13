# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 13 / 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| state | pending_user_approval |
| workflow_state | `implemented_local_runtime_pending` |
| 想定 PR base | `dev` |
| relatedIssue | null（staging 実機観察起点・ユーザー報告 2026-06-11 21:43 JST） |

## 目的

ユーザー承認後に PR を `dev` 宛に作成する。本 wave は `implemented_local_runtime_pending` であり、staging deploy・復旧検証・commit・push・PR はすべてstaging runtime pending（本実行サイクル / user-gated）。本 Phase は PR 作成の多段ゲートと PR 構成を仕様として確定する。**T01 統合により、未マージ観測性ブランチ `fix/profile-session-staging-localhost-endpoint` の成果（`ApiTransportError{transportKind,baseHost}` / `describeTransport` / `environmentExplicit` fail-closed / safe-fetch transport ログ）が本 PR で初めて dev に届く**ため、PR 本文にその旨を必ず明記する（個別 PR は別途立てない）。

## 実行タスク

### 多段ゲート（spec / impl / external-ops）

| Gate | 内容 | 承認方法 |
| --- | --- | --- |
| **Gate-A（spec）** | spec 完了（Phase 1〜12 + 4 タスク仕様 T01〜T04 + strict 7 + Phase 11 復旧検証手順 + unassigned current 1 件） | ユーザー明示 OK（artifacts.json で passed 済） |
| **Gate-B（impl）** | 実装 + local 検証: `mise exec -- pnpm typecheck` / `pnpm lint` / focused vitest 5 spec PASS + `bash -n scripts/diagnose-profile-session.sh` PASS + apps/api 非接触（`git diff dev --name-only \| grep '^apps/api/'` 空）+ localhost 焼き込みなし（`grep -rn '127.0.0.1:8888' apps/web/src` 空） | ユーザー明示 OK |
| **Gate-B'（recovery verification）** | staging 復旧検証: RT-A deploy → RT-B diagnose 2 系統 → RT-C `/profile` 正常描画 + 復旧後 screenshot → （非復旧時）RT-D で S1〜S4 確定 | ユーザー明示 OK（staging 認証・deploy 権限必須・user-gated） |
| **Gate-C（external-ops）** | commit / push / PR open 承認 | ユーザー明示 OK |

各 Gate を独立に承認させる。合算承認は禁止。Gate-B' / Gate-C は staging 認証セッション・deploy 権限が必要なため user-gated（Claude Code は取得しない）。

### PR 構成

| 項目 | 値 |
| --- | --- |
| Title | `fix(web,transport): recover staging /profile session fetch with transport fallback chain, field-tolerant auth env, and integrated observability` |
| Base | `dev` |
| Head | `fix/profile-session-staging-transport-recovery` |

### PR 本文（テンプレ）

```md
## Summary

- T01 (integration): 未マージ観測性ブランチ `fix/profile-session-staging-localhost-endpoint` を本ブランチに統合。
  **本 PR により当該ブランチの成果（`ApiTransportError{transportKind,baseHost}` / `describeTransport` /
  `environmentExplicit` fail-closed / safe-fetch transport ログ）が初めて dev へ届く**（個別 PR は立てない）。
- T02 (apps/web lib): `getAuthEnv` を field 単位 safeParse の field-tolerant に変更。無関係 field 1 つの不正で
  `INTERNAL_API_BASE_URL` まで黙って捨てる all-or-nothing 設計欠陥（F-A）を根治。dropped key 名のみ構造化 warn
  `auth_env_field_dropped {keys}`（値・secret 非出力）。
- T03 (apps/web lib): transport 多段フォールバック chain（service-binding → `INTERNAL_API_BASE_URL` →
  `NEXT_PUBLIC_API_BASE_URL`(staging/production のみ)）を追加（F-B 根治）。fallback は `ApiTransportError`
  （transport 層 throw）時のみ・GET/HEAD のみ。HTTP エラー Response（401/404/410/5xx）では fallback せず
  status 体系・`AuthRequiredError` 挙動は不変。fallback 時は `api_transport_fallback {from, to, path}` warn。
- T04 (scripts): `scripts/diagnose-profile-session.sh` を web `/api/me`（proxy 実経路）+ API direct `/me` の
  2 系統 probe へ是正し、cookie 提供時の `data-cause` 抽出と deploy 版数確認手順を追加（read-only・冪等）。

## Why

staging `/profile`（ログイン済み会員）で「セッション情報を取得できませんでした / 通信経路でセッション確認に
失敗しました」が表示され本体が描画されない。表示文言は PR #1194 導入の `MEMBER_SESSION_FAILED`
（transport 失敗）専用文言であり、`/me` fetch が HTTP 応答に至らず throw したことが確定している。
残るサブ原因は S1（transport 解決不能 throw）/ S2（localhost fallback 接続失敗）/ S3（service-binding fetch
throw）/ S4（http fetch throw）の 4 つで、本 PR は **S1〜S4 のどれであっても復旧する多層防御**
（env field-tolerant + transport chain + 観測性 deploy 到達）を実装する。サブ原因の最終確定は deploy 後の
staging ログ（transportKind/baseHost）で行い、S3 確定時のみ API worker 根治を別タスク
（`unassigned-task/task-api-worker-hard-error-root-fix.md`）で実施する。
`/me` の path・shape・status 体系・`apps/api` 全体・D1 schema・Google Form 仕様・`/profile` UI 文言/分岐は不変。

## Test plan

- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/__tests__/env.spec.ts apps/web/src/lib/fetch/transport.spec.ts apps/web/src/lib/fetch/authed.spec.ts 'apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts' 'apps/web/app/(member)/profile/page.spec.tsx'` PASS
- [ ] `bash -n scripts/diagnose-profile-session.sh` exit 0
- [ ] `git diff dev --name-only | grep '^apps/api/'` 空（apps/api 非接触・AC-7）
- [ ] `grep -rn '127.0.0.1:8888' apps/web/src` 空（localhost 焼き込みなし）
- [ ] staging deploy 後 `bash scripts/diagnose-profile-session.sh` で 2 系統 probe 確認（RT-B・user-gated）
- [ ] staging `/profile` 正常描画 + 復旧後 screenshot（RT-C・auth-required user-gated）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> 本ワークフローは独立 issue 番号を持たない（relatedIssue=null）ため、PR 本文に issue リンクは付けない。前身 Issue #1191（transport 運用是正）相当を本 PR が実装で回収する旨は、必要に応じて PR コメントで言及する（クローズ可否はユーザー判断）。

### blocked 条件

- Gate-A〜Gate-C のいずれかが未承認 → Phase 13 blocked。
- focused vitest または typecheck/lint fail → Phase 8（リファクタリング）/ Phase 5（実装手順）へ戻る。
- `git diff dev --name-only | grep '^apps/api/'` が空でない（apps/api 接触）→ 該当変更を revert（AC-7 違反）。
- 非 local で localhost transport に到達するテスト結果 → 実装を修正（AC-4 違反・NO-GO）。

## 完了条件

- [ ] Gate-A〜Gate-C すべてユーザー承認済み（user-gated）
- [ ] PR が `dev` base で open され URL が記録されている
- [ ] PR 本文に観測性ブランチ成果同梱（T01 統合）が明記されている
- [ ] CI（required status checks）すべて green

## 成果物

- `outputs/phase-13/phase-13.md`（本仕様）
- user-gated PR 作成後に PR URL を `outputs/phase-13/pr.md` 等に記録予定

## 参照資料

- `outputs/phase-5/task-01..04-*.md`（実装仕様書本体）
- `outputs/phase-11/manual-test-result.md`（RT-A〜RT-D・Gate-B' の正本）
- `outputs/phase-12/implementation-guide.md`（PR 本文の根拠）
- `_shared-context.md` §6（観測性ブランチ WF との関係: 本 WF の PR が当該成果を dev へ届ける）
- `CLAUDE.md` §「PR作成の完全自律フロー」

## 統合テスト連携

Gate-B（local 検証）と Gate-B'（staging 復旧検証）の証跡が PR の Test plan へ 1:1 で転記される。RT-D で S3 と確定した場合は、PR マージ後に `unassigned-task/task-api-worker-hard-error-root-fix.md` の正式起票（GitHub Issue 化）をユーザーへ提案する。
