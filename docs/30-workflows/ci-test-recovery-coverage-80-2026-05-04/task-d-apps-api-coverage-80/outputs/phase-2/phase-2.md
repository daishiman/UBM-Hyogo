# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |
| 依存 Phase | Phase 1（baseline 取得済み） |

## 目的

Phase 1 で抽出した未達ファイル群を 4 lane（route / use-case / repository / middleware）+ その他 lane に最終確定し、各 lane で採用するテスト戦略・mock 戦略・D1 binding 戦略を確定する。

## lane 分割設計（最終確定）

`rg --files apps/api/src` の結果（239 ファイル中 test 104 件）から、未達補強対象を以下 4 lane に固定する。

### Lane 1: route lane

| 観点 | 内容 |
| --- | --- |
| 対象ディレクトリ | `apps/api/src/routes/{public,me,admin,auth}/` |
| 候補ファイル | `routes/public/{members,member-profile,stats,form-preview,index}.ts`、`routes/me/{index,services,schemas}.ts`、`routes/auth/{index,session-resolve,schemas}.ts`、`routes/admin/{members,meetings,attendance,member-status,requests,responses-sync,sync,sync-schema,tags-queue,smoke-sheets,member-delete,member-notes,identity-conflicts,audit,dashboard,_shared}.ts` のうち Phase 1 で未達と確定したもの |
| テスト戦略 | Hono `app.fetch(new Request(...))` で in-process integration test。本物の handler chain（middleware → route → use-case）を通す |
| D1 戦略 | Miniflare D1 binding を `getMiniflareBindings()` 相当で取得し test 内で migrations を流す |
| Mock 戦略 | 外部 API（Google Forms / Sheets / Mail）は `vi.mock()` で stub。D1 はモックしない |
| 既存資産 | `apps/api/src/routes/public/index.test.ts`、`apps/api/src/routes/me/index.test.ts`、`apps/api/src/routes/auth/__tests__/auth-routes.test.ts` を pattern として継承 |

### Lane 2: use-case lane

| 観点 | 内容 |
| --- | --- |
| 対象ディレクトリ | `apps/api/src/use-cases/{public,auth}/` |
| 候補ファイル | `use-cases/public/{get-form-preview,list-public-members,get-public-stats,get-public-member-profile}.ts`（Issue #320 系 4 本）、`use-cases/auth/{issue-magic-link,verify-magic-link,resolve-session,resolve-gate-state}.ts` のうち Phase 1 で未達のもの |
| テスト戦略 | domain pure logic は unit test、副作用（repository / mailer / token issuer）は port mock |
| Mock 戦略 | repository は `interface` を介して inject 済みのものを `vi.fn()` で satisfy。port が無い場合は Phase 5 で port 化を検討（CONST_007 範囲内で可能なら実施、不可なら repository 直叩きを許容） |
| 既存資産 | `use-cases/public/__tests__/*.test.ts`、`use-cases/public/__tests__/helpers/public-d1.ts`、`use-cases/auth/__tests__/_seed.ts` を再利用 |

### Lane 3: repository lane

| 観点 | 内容 |
| --- | --- |
| 対象ディレクトリ | `apps/api/src/repository/` |
| 候補ファイル | `repository/{members,meetings,attendance,publicMembers,memberTags,tagDefinitions,tagQueue,schemaQuestions,schemaVersions,schemaAliases,schemaDiffQueue,responseFields,responseSections,responses,magicTokens,adminUsers,adminNotes,auditLog,identities,identity-conflict,identity-merge,fieldVisibility,status,syncJobs,dashboard}.ts` のうち未達分 |
| テスト戦略 | int-test-skill の **Mock provider pattern** を主軸とし、契約テスト（interface 不変条件）+ Miniflare D1 binding を併用 |
| Mock 戦略 | `apps/api/src/repository/__fixtures__/d1mock.ts` および `apps/api/src/repository/_shared/__fakes__/fakeD1.ts` を SSOT として再利用。新規 mock を増やさない |
| Migrations | `apps/api/migrations/*.sql` を test setup で loader 経由で流す（int-test-skill `references/` の D1 binding test ガイド準拠） |
| 既存資産 | `repository/__tests__/*.test.ts`（builder / brand / responses / auditLog / identity-merge / magicTokens / adminUsers / responseFields / attendance-provider / memberTags / identity-conflict / responseSections / fieldVisibility / members / status / adminNotes / identities / syncJobs）を pattern として継承 |

### Lane 4: middleware lane

| 観点 | 内容 |
| --- | --- |
| 対象ディレクトリ | `apps/api/src/middleware/` |
| 候補ファイル | `middleware/{require-admin,require-sync-admin,me-session-resolver,error-handler,rate-limit-magic-link,rate-limit-self-request,internal-auth,admin-gate,session-guard}.ts` のうち未達分 |
| テスト戦略 | Hono の minimal app に middleware を装着し、`app.fetch(new Request(...))` で各分岐（PASS / 401 / 403 / 429 / 500）を網羅 |
| Mock 戦略 | session / cookie / header / KV（rate limit）は in-memory fake を Phase 5 で用意 |
| 既存資産 | `middleware/__tests__/rate-limit-magic-link.test.ts`、`middleware/{me-session-resolver,require-admin}.test.ts` を pattern として継承 |

### Lane 5: その他 lane（必要時のみ起動）

| 観点 | 内容 |
| --- | --- |
| 対象 | `apps/api/src/_shared/`、`apps/api/src/utils/`、`apps/api/src/view-models/public/`、`apps/api/src/workflows/`、`apps/api/src/services/`、`apps/api/src/jobs/`、`apps/api/src/sync/` |
| 起動条件 | Phase 1 の `uncovered-by-lane.md` に該当 lane で未達ファイルが残っている場合のみ |
| テスト戦略 | pure unit test を基本とする。`workflows/`（tagCandidateEnqueue 等）と `jobs/`（sync-forms-responses 等）は repository mock を介する |

## concern 数判定（TASK-SKILL-LIFECYCLE-08）

5 lane を扱うため `phase-2-design.md` 内に concern ごとセクション分割（同一ファイル内）で記述する。Phase 2 成果物 `outputs/phase-2/phase-2-design.md` の章立ては「Lane 1 〜 Lane 5」の 5 セクション + 横断「dependency matrix」「validation matrix」とする。

## dependency matrix（Phase 2 並列 wave 必須 owner / co-owner 列）

| 共有モジュール | 用途 | owner | co-owner | 同期タイミング |
| --- | --- | --- | --- | --- |
| `apps/api/src/repository/__fixtures__/d1mock.ts` | repository D1 mock | repository lane（Lane 3） | use-case lane（Lane 2）/ route lane（Lane 1） | wave-2 末尾 same-wave sync |
| `apps/api/src/repository/_shared/__fakes__/fakeD1.ts` | repository D1 fake builder | repository lane（Lane 3） | route lane（Lane 1） | 同上 |
| `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` | public use-case D1 helper | use-case lane（Lane 2） | route lane（Lane 1） | 同上 |
| `apps/api/src/use-cases/auth/__tests__/_seed.ts` | auth use-case seed | use-case lane（Lane 2） | middleware lane（Lane 4） | 同上 |
| `apps/api/vitest.config.ts` | coverage.exclude 調整 | Lane 共通（Phase 7 で集約決定） | 全 lane | Phase 7 集約時 |

## validation matrix

| コマンド | 期待 | 担当 lane |
| --- | --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | exit 0 | 全 lane |
| `mise exec -- pnpm --filter @ubm-hyogo/api lint` | exit 0 | 全 lane |
| `mise exec -- pnpm --filter @ubm-hyogo/api test` | exit 0 / regression 0 | 全 lane |
| `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` | total 全 metric ≥80% | 全 lane |
| `bash scripts/coverage-guard.sh --package apps/api` | exit 0 | 全 lane |

## D1 / API / repository 系タスク必須セクション（仕様書記述 vs 実 DB 対応表）

| repository | 参照 migration | 主要 column | 注意 |
| --- | --- | --- | --- |
| `members.ts` | `apps/api/migrations/0001_*.sql` 系 | `member_id` / `email` / `status` | identity-merge と column 共有 |
| `meetings.ts` | `apps/api/migrations/00xx_meetings*.sql` | `meeting_id` / `held_at` | attendance と FK |
| `magicTokens.ts` | `apps/api/migrations/00xx_magic*.sql` | `token_hash` / `expires_at` | TTL test 必須 |
| `responseFields.ts` `responseSections.ts` `responses.ts` | `apps/api/migrations/00xx_responses*.sql` | `response_id` / `field_key` | schemaQuestions と join |
| `tagQueue.ts` `tagDefinitions.ts` `memberTags.ts` | `apps/api/migrations/00xx_tags*.sql` | `tag_key` / `state` | idempotency retry test 必須 |
| `schemaQuestions.ts` `schemaVersions.ts` `schemaAliases.ts` `schemaDiffQueue.ts` | `apps/api/migrations/00xx_schema*.sql` | `version_hash` / `question_key` | flatten / hash 整合 |
| `auditLog.ts` | `apps/api/migrations/00xx_audit*.sql` | `actor_id` / `action` | append-only |

> Phase 1 で実 migration ファイル名を確定し、本表を更新すること。

## OAuth / session 共有契約（middleware lane 必須）

| 項目 | 必須内容 |
| --- | --- |
| session 型 | `memberId` / `email` / `isAdmin` / `gateReason` の最小 payload を test 内で satisfy |
| token 形式 | Auth.js JWT default + magic link token（hash 比較） |
| encode/decode owner | `apps/api/src/use-cases/auth/{verify-magic-link,resolve-session}.ts` |
| provider 共有 | `apps/web` 側 Auth.js cookie ↔ `apps/api` `me-session-resolver.ts` の互換テスト |

## 検討した simpler alternative（Phase 3 で正式記録）

| 案 | 採否 | 理由 |
| --- | --- | --- |
| 全ファイルを 1 lane で順次補強 | ✗ | 並列性失われ wave-2 で Task C を待たせる |
| 80% 未達ファイルを `coverage.exclude` で除外 | △ | CONST_007 違反リスク。最終手段としてのみ Phase 7 で限定採用 |
| Mock provider 不使用で全件 Miniflare D1 | ✗ | test 実行時間が膨大。int-test-skill の標準形に従い contract test を主軸にする |

## 完了条件

- [ ] 4 lane（+ 必要時 Lane 5）の対象ファイル一覧が確定
- [ ] dependency matrix（owner / co-owner）が記載
- [ ] validation matrix が 5 コマンドで定義
- [ ] D1 vs migrations 対応表が記載
- [ ] simpler alternative 検討結果が記録

## 次 Phase

Phase 3（アーキテクチャ確認）。
