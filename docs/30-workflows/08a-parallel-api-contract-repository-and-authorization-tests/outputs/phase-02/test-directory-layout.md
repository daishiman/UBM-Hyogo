# test directory layout (08a Phase 2)

既存構造を尊重し、新規追加は最小限とする。`apps/api/src/repository/__tests__/`, `apps/api/src/middleware/__tests__/`, `apps/api/src/routes/auth/__tests__/`, `apps/api/src/_shared/__tests__/`, `apps/api/src/use-cases/auth/__tests__/`, `apps/api/src/view-models/public/__tests__/`, `apps/api/tests/fixtures/` は既に存在。

## 既存維持 (no-op)

```
apps/api/
├── package.json                                  (test / test:coverage script は既存)
├── src/
│   ├── repository/
│   │   ├── __fixtures__/                         # 既存: admin / members / d1mock
│   │   │   ├── admin.fixture.ts
│   │   │   ├── d1mock.ts
│   │   │   └── members.fixture.ts
│   │   ├── _shared/__fakes__/fakeD1.ts           # 既存: D1 binding fake
│   │   └── __tests__/                            # 既存 15 件 (Phase 1 §3 列挙)
│   │       ├── _setup.ts / _setup.test.ts
│   │       ├── adminNotes.test.ts
│   │       ├── adminUsers.test.ts
│   │       ├── auditLog.test.ts
│   │       ├── brand.test.ts
│   │       ├── builder.test.ts
│   │       ├── fieldVisibility.test.ts
│   │       ├── identities.test.ts
│   │       ├── magicTokens.test.ts
│   │       ├── members.test.ts
│   │       ├── memberTags.test.ts
│   │       ├── responseFields.test.ts
│   │       ├── responses.test.ts
│   │       ├── responseSections.test.ts
│   │       ├── status.test.ts
│   │       └── syncJobs.test.ts
│   ├── middleware/
│   │   ├── __tests__/                             # 既存
│   │   └── require-admin.test.ts                  # 既存 (将来 authz/ に集約予定)
│   ├── routes/auth/__tests__/                     # 既存
│   ├── use-cases/auth/__tests__/                  # 既存
│   ├── view-models/public/__tests__/              # 既存
│   └── _shared/__tests__/                         # 既存
└── tests/
    └── fixtures/forms-get.ts                      # 既存
```

## 本タスクで新規追加

```
apps/api/
├── vitest.config.ts                                # NEW: typecheck enabled, coverage thresholds
├── test/                                           # NEW: 横断 helpers / mocks
│   ├── helpers/
│   │   ├── app.ts                                  # NEW: createTestApp(env, bindings)
│   │   ├── auth.ts                                 # NEW: createAdminCookie / createMemberCookie / anonymous
│   │   ├── seed.ts                                 # NEW: fixture を fakeD1 / sqlite に注入
│   │   └── reset.ts                                # NEW: afterEach でクリア
│   ├── fixtures/                                   # NEW: 既存 __fixtures__ 拡張
│   │   ├── meetings.ts                             # 2 sessions
│   │   ├── tags.ts                                 # 6 categories + 12 definitions
│   │   ├── magic-tokens.ts                         # 1 valid / 1 expired
│   │   └── audit-log.ts                            # baseline rows
│   └── mocks/
│       ├── forms-api.handlers.ts                   # NEW: msw handler
│       └── server.ts                               # NEW: setupServer
├── tests/
│   ├── lint/
│   │   └── import-boundary.test.ts                 # NEW: 不変条件 #6
│   └── invariants/
│       ├── invariant-01-extra-fields.test.ts      # #1 schema 固定しすぎない
│       ├── invariant-02-response-email.test.ts    # #2 system field
│       ├── invariant-05-three-layer.test.ts       # #5 authz 集約 (re-export)
│       ├── invariant-07-soft-delete.test.ts       # #7 論理削除
│       └── invariant-11-no-profile-edit.test.ts   # #11 profile 編集 endpoint なし
└── src/
    ├── routes/
    │   ├── public/__tests__/                       # NEW
    │   │   ├── stats.contract.spec.ts
    │   │   ├── members.contract.spec.ts
    │   │   ├── member-profile.contract.spec.ts
    │   │   └── form-preview.contract.spec.ts
    │   ├── me/__tests__/                           # NEW
    │   │   ├── profile.contract.spec.ts
    │   │   └── visibility-request.contract.spec.ts (上流確認後)
    │   ├── admin/__tests__/                        # NEW
    │   │   ├── dashboard.contract.spec.ts
    │   │   ├── members.contract.spec.ts
    │   │   ├── member-status.contract.spec.ts
    │   │   ├── member-notes.contract.spec.ts
    │   │   ├── member-delete.contract.spec.ts
    │   │   ├── tags-queue.contract.spec.ts
    │   │   ├── schema.contract.spec.ts
    │   │   ├── meetings.contract.spec.ts
    │   │   ├── attendance.contract.spec.ts
    │   │   ├── sync.contract.spec.ts
    │   │   ├── sync-schema.contract.spec.ts
    │   │   └── responses-sync.contract.spec.ts
    │   └── auth/__tests__/                          # 既存に追加
    │       ├── magic-link.contract.spec.ts
    │       ├── magic-link-verify.contract.spec.ts
    │       ├── resolve-session.contract.spec.ts
    │       ├── session-resolve.contract.spec.ts
    │       └── gate-state.contract.spec.ts
    ├── repository/__tests__/                        # NEW 9 件追加
    │   ├── attendance.test.ts
    │   ├── dashboard.test.ts
    │   ├── meetings.test.ts
    │   ├── publicMembers.test.ts
    │   ├── schemaDiffQueue.test.ts
    │   ├── schemaQuestions.test.ts
    │   ├── schemaVersions.test.ts
    │   ├── tagDefinitions.test.ts
    │   └── tagQueue.test.ts
    ├── middleware/__tests__/                        # 既存に追加
    │   ├── admin-gate.authz.test.ts
    │   ├── session-guard.authz.test.ts
    │   └── internal-auth.authz.test.ts
    └── _shared/__tests__/
        └── brand.type.test-d.ts                     # NEW (vitest typecheck)
```

```
packages/shared/
└── src/__tests__/brand.type.test-d.ts             # 候補配置 (apps/api と二択)
```

## 命名規則

- contract test は `*.contract.spec.ts` (`*.test.ts` と区別し fixture 衝突を防ぐ)
- repository unit は既存に合わせて `*.test.ts`
- authz は `*.authz.test.ts`
- type test は vitest typecheck の慣例で `*.test-d.ts`
- 不変条件は `invariant-NN-<slug>.test.ts` (ID 採番)

## 配置の選択理由

| 配置 | 理由 |
| --- | --- |
| `apps/api/test/` (横断) | 複数 layer 跨ぎの helpers / mocks / fixtures を集約 |
| `apps/api/src/<layer>/__tests__/` | 単一 layer に閉じる test (既存慣例維持) |
| `apps/api/tests/{lint,invariants}/` | layer 横断の独立 test (既存 `tests/fixtures/` と整合) |
| `_shared/__tests__/` | brand 型は shared module に最も近い既存テスト位置 |

## 既存 `apps/api/tests/fixtures/forms-get.ts` の扱い

そのまま `test/mocks/forms-api.handlers.ts` の payload source として再利用 (重複定義しない)。msw handler は fixture を import するだけの薄いラッパに留める。
