# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08a-parallel-api-contract-repository-and-authorization-tests |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

contract / repo / authz 全 endpoint で起こりうる failure ケースを 401 / 403 / 404 / 409 / 422 / 5xx / sync 失敗 / consent 撤回 / 削除済み / 重複 で網羅し、test ケースとして組み込む。

## 実行タスク

- [ ] failure cases を 10 カテゴリで列挙
- [ ] 各 category × 関連 endpoint × expected status のマトリクス化
- [ ] sync 失敗 / consent 撤回 / 削除済み の特例 test を定義

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/main.md | runbook |
| 必須 | doc/00-getting-started-manual/specs/00-overview.md | 不変条件 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | AuthGateState |

## failure cases

| # | カテゴリ | 発生条件 | 関連 endpoint | expected | 備考 |
| --- | --- | --- | --- | --- | --- |
| F-1 | 401 | 未ログイン | `/me/*` `/admin/*` | 401 | sessionResolver |
| F-2 | 403 | non-admin が admin endpoint | `/admin/*` | 403 | adminGate |
| F-3 | 404 (resource) | 存在しない memberId / sessionId | `/admin/members/:memberId` 等 | 404 | repository null |
| F-4 | 404 (route) | 存在しない path | `PATCH /admin/members/:id/profile` | 404 | route 不在（不変条件 #11） |
| F-5 | 409 | 重複 INSERT (attendance / tag queue) | `/admin/meetings/:id/attendance` | 409 | UNIQUE 制約 |
| F-6 | 422 (zod parse fail) | invalid body / query | 全 POST / PATCH | 422 | zod issues 配列 |
| F-7 | 5xx (D1 一時障害) | D1 unreachable | 全 endpoint | 503 | retry 推奨 |
| F-8 | sync 失敗 (Forms API down) | external Forms API 502 | `/admin/sync/*` | 502 | partial 記録 |
| F-9 | consent 撤回 | publicConsent 元 consented → revoked | `/public/members` | 該当 member が消える | contract で確認 |
| F-10 | rulesConsent != consented | login 時 rules_declined | `/auth/magic-link` | 200 + AuthGateState=rules_declined | gate 出し分け |
| F-11 | 削除済み login | isDeleted=true で再 login 試行 | `/auth/magic-link` | 200 + AuthGateState=deleted | gate 出し分け |
| F-12 | unregistered email | DB に identity なし | `/auth/magic-link` | 200 + AuthGateState=unregistered | enumeration 防止 |

## category × endpoint matrix

| カテゴリ | public | me | admin | auth |
| --- | --- | --- | --- | --- |
| F-1 401 | — | ✓ | ✓ | — |
| F-2 403 | — | — | ✓ | — |
| F-3 404 resource | — | — | ✓ | — |
| F-4 404 route (#11) | — | — | ✓ (profile path) | — |
| F-5 409 | — | — | ✓ (attendance) | — |
| F-6 422 | ✓ (query) | ✓ (body) | ✓ (body) | ✓ (body) |
| F-7 5xx | ✓ | ✓ | ✓ | ✓ |
| F-8 sync 502 | — | — | ✓ (sync/*) | — |
| F-9 consent 撤回 | ✓ | — | — | — |
| F-10 rules_declined | — | — | — | ✓ |
| F-11 deleted login | — | — | — | ✓ |
| F-12 unregistered | — | — | — | ✓ |

## sync 失敗テスト特例

```ts
// apps/api/src/routes/admin/__tests__/sync.contract.spec.ts
it('returns 502 + sync_jobs row with status=failed when Forms API is down (#1)', async () => {
  server.use(
    http.get('https://forms.googleapis.com/v1/forms/:formId/responses', () => HttpResponse.error())
  )
  const res = await app.request('/admin/sync/responses', { method: 'POST', headers: adminCookie() })
  expect(res.status).toBe(502)
  const job = await db.prepare('SELECT * FROM sync_jobs WHERE kind=? ORDER BY started_at DESC').bind('responses').first()
  expect(job.status).toBe('failed')
})
```

## consent 撤回テスト

```ts
it('member with publicConsent revoked is excluded from /public/members (#7 logical, #9 consent)', async () => {
  await db.prepare('UPDATE member_status SET public_consent=? WHERE member_id=?').bind('revoked', 'm-1').run()
  const body = await (await app.request('/public/members')).json()
  expect(body.members.find((m: any) => m.memberId === 'm-1')).toBeUndefined()
})
```

## AuthGateState テスト

```ts
it.each([
  ['unregistered@example.com', 'unregistered'],
  ['rules_declined@example.com', 'rules_declined'],
  ['deleted@example.com', 'deleted'],
  ['ok@example.com', 'sent'],
])('email=%s -> AuthGateState=%s', async (email, gate) => {
  const res = await app.request('/auth/magic-link', { method: 'POST', body: JSON.stringify({ email }) })
  const body = await res.json()
  expect(body.gate).toBe(gate)
})
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 verify suite | 上記 failure を test ケース化 |
| Phase 7 AC matrix | failure × AC マッピング |
| 下流 09a smoke | staging で同 failure 再現可能性 |

## 多角的チェック観点

- 不変条件 **#1** sync 失敗テストで `extraFields` 経路の保全
- 不変条件 **#2** consent 撤回テストで `publicConsent` 値変更を verify
- 不変条件 **#5** 401 / 403 を全 admin / me で
- 不変条件 **#6** lint test 失敗時の test 自体の落ち方
- 不変条件 **#7** deleted login + consent 撤回テストで論理削除観測
- 不変条件 **#11** profile 編集 path 404 テストで本文編集 endpoint 不在
- a11y: 422 toast / 401 redirect は 08b の責務
- 無料枠: failure テストでも CI 0 円

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure cases 12 件 | 6 | pending | F-1〜12 |
| 2 | category × endpoint matrix | 6 | pending | matrix |
| 3 | sync / consent / AuthGateState 特例 | 6 | pending | 各特例 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure 一覧 |
| メタ | artifacts.json | phase 6 status |

## 完了条件

- [ ] failure cases ≥ 10 カテゴリ
- [ ] category × endpoint matrix
- [ ] sync / consent / AuthGateState 特例 test 定義

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 6 を completed

## 次 Phase

- 次: Phase 7 (AC マトリクス)
- 引き継ぎ: 12 failure を AC matrix の異常系列へ
- ブロック条件: failure 10 未満なら Phase 7 不可
