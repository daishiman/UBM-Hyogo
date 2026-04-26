# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

採用案 C（二重防御）の挙動を verify するため、unit / contract / authorization / DB 制約 のテスト suite を設計する。本タスクは spec_created なのでコードは書かず、test signature と fixture 構造だけ確定する。

## 実行タスク

- [ ] verify suite 4 種（unit / contract / authorization / DB constraint）の設計
- [ ] test ファイル配置と naming convention の決定
- [ ] fixture（admin user / meeting / member 各 5 件）の最小定義
- [ ] test ケース 100% カバー matrix を `outputs/phase-04/test-matrix.md` に作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | endpoint signature |
| 必須 | outputs/phase-03/main.md | 採用案 C |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 制約一覧 |
| 参考 | doc/02-application-implementation/08a-parallel-api-contract-repository-and-authorization-tests/index.md | 下流の contract test 受け入れ口 |

## verify suite 設計

### unit test (`apps/api/src/repository/__tests__/attendance.spec.ts`)

```ts
describe('attendance.repository', () => {
  it('insert succeeds for first (sessionId, memberId)', async () => { /* ... */ })
  it('insert throws DOMAIN_UNIQUE error on duplicate (sessionId, memberId)', async () => { /* ... */ })
  it('delete returns deleted row count = 1 for existing', async () => { /* ... */ })
  it('delete returns 0 for non-existing', async () => { /* ... */ })
})
```

### contract test (`apps/api/src/routes/admin/__tests__/meetings.contract.spec.ts`)

```ts
describe('POST /admin/meetings/:sessionId/attendance', () => {
  it('returns 201 with attendance row on first call', async () => {
    const res = await app.request('/admin/meetings/s1/attendance', {
      method: 'POST',
      headers: adminAuthHeaders,
      body: JSON.stringify({ memberId: 'm1' }),
    })
    expect(res.status).toBe(201)
    expect(AttendanceCreateResponseSchema.parse(await res.json())).toBeDefined()
  })

  it('returns 409 with existing row on duplicate call (idempotent)', async () => {
    await app.request('/admin/meetings/s1/attendance', { ... })
    const res = await app.request('/admin/meetings/s1/attendance', { ... })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('attendance_already_recorded')
    expect(body.existing.memberId).toBe('m1')
  })

  it('audit_log has 1 row per successful insert', async () => {
    await app.request('/admin/meetings/s1/attendance', { ... })
    const rows = await db.prepare('SELECT * FROM audit_log WHERE action=?').bind('attendance.add').all()
    expect(rows.results).toHaveLength(1)
  })
})

describe('GET /admin/meetings/:sessionId/attendance/candidates', () => {
  it('excludes members where member_status.isDeleted=true', async () => { /* ... */ })
})
```

### authorization test (`apps/api/src/routes/admin/__tests__/meetings.authz.spec.ts`)

```ts
describe('admin gate', () => {
  it.each([
    ['anonymous', undefined, 401],
    ['member (non-admin)', memberAuthHeaders, 403],
    ['admin', adminAuthHeaders, 201],
  ])('actor=%s on POST attendance returns %d', async (_, headers, expected) => {
    const res = await app.request('/admin/meetings/s1/attendance', {
      method: 'POST', headers, body: JSON.stringify({ memberId: 'm1' }),
    })
    expect(res.status).toBe(expected)
  })
})
```

### DB constraint test (`apps/api/src/repository/__tests__/attendance.constraint.spec.ts`)

```ts
it('uq_member_attendance prevents direct duplicate INSERT at D1 layer', async () => {
  await db.prepare('INSERT INTO member_attendance (...) VALUES (?,?,?)').bind('s1','m1', now).run()
  await expect(
    db.prepare('INSERT INTO member_attendance (...) VALUES (?,?,?)').bind('s1','m1', now).run()
  ).rejects.toThrow(/UNIQUE/)
})
```

## test matrix

| AC | unit | contract | authz | DB constraint |
| --- | --- | --- | --- | --- |
| AC-1 重複 409 | ✓ | ✓ | — | ✓ |
| AC-2 削除済み除外 | — | ✓ | — | — |
| AC-3 audit 1 行 | — | ✓ | — | — |
| AC-4 payload before/after | ✓ | ✓ | — | — |
| AC-5 削除も audit | — | ✓ | — | — |
| AC-6 profile 編集 endpoint なし | — | ✓ (404 expected) | — | — |
| AC-7 二重防御 | ✓ | ✓ | — | ✓ |

## fixture 構造

```
apps/api/src/test/fixtures/
├── admin-users.ts          // 1 admin
├── members.ts              // 5 member（うち 1 件 isDeleted=true）
├── meeting-sessions.ts     // 2 session
└── seed.ts                 // beforeEach で D1 へ INSERT
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook の verify ステップに本 suite を組み込む |
| Phase 7 | AC マトリクスの test 列に上記 4 suite を埋める |
| 下流 08a | 同 spec 形式の contract test を 08a が consume |

## 多角的チェック観点

- 不変条件 **#5** authz test で公開 / 会員 / admin の境界を網羅（理由: 401/403/201 を 1 並びで確認）
- 不変条件 **#7** contract test で削除済み除外を確認（理由: candidates 配列に出ないこと）
- 不変条件 **#15** DB constraint test と contract test 双方で重複阻止確認（理由: 二重防御の verify）
- 無料枠: D1 local sqlite で in-memory 実行、CI は 0 円

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | unit test 設計 | 4 | pending | attendance.spec.ts |
| 2 | contract test 設計 | 4 | pending | meetings.contract.spec.ts |
| 3 | authorization test 設計 | 4 | pending | meetings.authz.spec.ts |
| 4 | DB constraint test 設計 | 4 | pending | attendance.constraint.spec.ts |
| 5 | test matrix 作成 | 4 | pending | outputs/phase-04/test-matrix.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト戦略本文 |
| matrix | outputs/phase-04/test-matrix.md | AC × test 対応 |
| メタ | artifacts.json | phase 4 status |

## 完了条件

- [ ] 4 種 verify suite の test signature が確定
- [ ] test matrix で AC 全行に test がマッピング
- [ ] fixture 構造が記述されている

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 4 を completed

## 次 Phase

- 次: Phase 5 (実装ランブック)
- 引き継ぎ: 4 suite 構造、fixture 配置
- ブロック条件: test matrix 未完なら Phase 5 不可
