# Phase 10: 最終レビュー

> 実装区分: **実装仕様書**
> Source issue: [#266](https://github.com/daishiman/UBM-Hyogo/issues/266)
> Phase 9: [`phase-9-qa.md`](./phase-9-qa.md)

---

## 1. 全体最終レビュー観点

| 観点 | 確認内容 | 判定根拠 |
|------|---------|---------|
| F-1 SRP | shared schema 化 ＋ TS 契約面の drift 解消に限定 | index.md / Phase 1 §1.3 |
| F-2 canonical 値の一意性 | 物理 DDL = TS = shared の 3 者一致 | Phase 2 §1 アーキ図 |
| F-3 影響範囲 | `packages/shared` 新規 1 ファイル + `apps/api/src/sync/` 5 ファイル + `apps/api/src/jobs/sync-sheets-to-d1.ts` 1 ファイル | Phase 5 §1 表 |
| F-4 migration 不要 | 物理 DDL 不変。SQL bind 値は shared canonical へ収束し、物理値集合内に収まる | Phase 3 §6 |
| F-5 contract spec regression | 既存 4 contract spec の期待値置換のみで pass | Phase 5 §11 / Phase 6 §3 |
| F-6 scope creep なし | `sync_jobs` / 物理 rename / UI 連携を out of scope に分離 | index.md §1 表 |
| F-7 out-of-scope 不混入 | `apps/api/src/repository/syncJobs.ts` / `apps/api/migrations/` / `apps/web/` 変更なし | `git status` 確認 |

---

## 2. scope creep 確認

### 2.1 PR diff の許可リスト

PR に含まれることが期待されるファイル種別:

| カテゴリ | パス pattern | 件数（上限） |
|---------|------------|------------|
| shared 新規 | `packages/shared/src/zod/sync-log.ts`, `packages/shared/src/zod/sync-log.spec.ts` | 2 |
| shared index re-export | `packages/shared/src/zod/index.ts` | 1（1 行追加） |
| apps/api sync 改修 | `apps/api/src/sync/{types,audit,manual,scheduled}.ts` | 4 |
| apps/api jobs 改修 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | 1 |
| apps/api 既存 spec 期待値更新 | `apps/api/src/sync/{audit,manual,scheduled}.contract.spec.ts` | 3 |
| docs（本 workflow） | `docs/30-workflows/issue-266-shared-sync-zod-contract/**` | 多数（仕様書 13 + outputs） |

**合計 11 ファイル + docs**。これを超える変更があれば scope creep。

### 2.2 禁止 diff

| ファイル | 理由 |
|---------|------|
| `apps/api/migrations/**` | 不変条件 #8（物理 DDL 不変） |
| `apps/api/src/repository/syncJobs.ts` | #195 別契約、out of scope |
| `apps/web/**` | 後続 UI 連携 task のスコープ |
| `packages/shared/src/zod/{primitives,field,schema,response,identity,viewmodel}.ts` | 既存 schema 改変なし（再利用のみ） |
| `.github/workflows/**` | ESLint custom rule / grep gate 追加は後続 lint 強化 task |

### 2.3 確認手順

```bash
git diff dev...HEAD --name-only | sort | uniq
# 上記許可リストに収まることを目視確認
```

---

## 3. out-of-scope 不混入確認

### 3.1 `sync_jobs`（#195）契約

```bash
git diff dev...HEAD -- apps/api/src/repository/syncJobs.ts
# 期待: 差分なし
```

### 3.2 物理 DDL

```bash
git diff dev...HEAD -- apps/api/migrations/
# 期待: 差分なし
```

### 3.3 `apps/web`

```bash
git diff dev...HEAD -- apps/web/
# 期待: 差分なし
```

---

## 4. レビュー結論

| 観点 | 判定 |
|------|------|
| F-1 SRP | OK |
| F-2 canonical 一意 | OK |
| F-3 影響範囲 | OK（許可リスト内） |
| F-4 migration 不要 | OK |
| F-5 spec regression | OK |
| F-6 scope creep | OK |
| F-7 out-of-scope | OK |

**Phase 11（手動 test）へ進行可。**

---

## 5. Phase 10 DoD

- [ ] §2.1 許可リスト内に PR diff が収まる
- [ ] §2.2 禁止 diff が 0 件
- [ ] §3 out-of-scope ファイル 3 種で差分なし
- [ ] §4 レビュー結論 7 観点 OK
