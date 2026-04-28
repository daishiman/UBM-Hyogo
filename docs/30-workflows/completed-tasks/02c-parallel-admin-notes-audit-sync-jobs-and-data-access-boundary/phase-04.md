# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-notes-audit-sync-jobs-and-data-access-boundary |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 3 (設計レビュー) |
| 下流 | Phase 5 (実装ランブック) |
| 状態 | pending |

## 目的

実装より先に **テストの形** を確定し、AC-1〜AC-11 を verify suite として定義する。boundary tooling（dep-cruiser / ESLint）の自動 test を含める。

## verify suite 構成

### 1. unit test（vitest）

| ファイル | 対象 | 目的 |
| --- | --- | --- |
| `adminUsers.test.ts` | adminUsers.ts | findByEmail / listAll / touchLastSeen の整合 |
| `adminNotes.test.ts` | adminNotes.ts | listByMemberId / create / update / remove の CRUD |
| `auditLog.test.ts` | auditLog.ts | append のみ動作確認、listRecent / listByActor / listByTarget の整合 |
| `syncJobs.test.ts` | syncJobs.ts | start → succeed / start → fail の transition、findLatest |
| `magicTokens.test.ts` | magicTokens.ts | issue / verify / consume の single-use |
| `_setup.test.ts` | __tests__/_setup.ts | in-memory D1 が 02a/02b の fixture 種を loadFixtures() で読める |

### 2. boundary test（dep-cruiser / ESLint）

| 対象 | 検証内容 |
| --- | --- |
| dep-cruiser | `apps/web/**` → `apps/api/src/repository/**` で violation error |
| dep-cruiser | `apps/web/**` → `D1Database` import で violation error |
| dep-cruiser | 02a の `members.ts` → 02b の `meetings.ts` で violation error |
| dep-cruiser | 02b の `tagQueue.ts` → 02c の `auditLog.ts` で violation error |
| ESLint | `apps/web/src/page.tsx` で `import "@apps/api/src/repository/adminNotes"` を書くと lint error |
| ESLint | `apps/web/src/page.tsx` で `import { D1Database } from "@cloudflare/workers-types"` で lint error |

### 3. invariant test（既存 violation の検出）

| シナリオ | 期待動作 |
| --- | --- |
| `auditLog.test.ts` で UPDATE / DELETE 関数を呼ぼうとする | 関数不在で型エラー（API 不在で守る） |
| `magicTokens.consume` を 2 回呼ぶ | 2 回目は `{ ok: false, reason: "already_used" }` |
| `magicTokens.consume` を expired 後に呼ぶ | `{ ok: false, reason: "expired" }` |
| `syncJobs.succeed("not_found_id", {})` | UPDATE rowcount=0、warning log |
| `syncJobs.fail` を `succeeded` 状態の job に対して呼ぶ | throw `IllegalStateTransition` |
| `adminNotes` を builder の戻り値型に代入 | builder は引数で受け取る設計、戻り値に adminNotes は含まれるが builder 内部で repository を呼ばないことを test |

### 4. fixture / in-memory D1（02a / 02b 共通利用）

```ts
// __fixtures__/admin.fixture.ts
export const fixtureAdminUsers: AdminUserRow[] = [
  { email: adminEmail("owner@example.com"), role: "owner", createdAt: "2026-04-01T00:00:00Z", lastSeenAt: null },
  { email: adminEmail("manager@example.com"), role: "manager", createdAt: "2026-04-01T00:00:00Z", lastSeenAt: null },
];

export const fixtureAdminNotes: AdminMemberNoteRow[] = [
  { id: "note_001", memberId: memberId("m_001"), body: "初回コンタクト OK", createdBy: adminEmail("owner@example.com"), createdAt: "2026-04-10T00:00:00Z", updatedAt: "2026-04-10T00:00:00Z" },
];

export const fixtureAuditLog: AuditLogEntry[] = [
  { id: "audit_001", actor: adminEmail("owner@example.com"), action: "member.publish_state_changed", targetType: "member", targetId: "m_001", metadata: { from: "hidden", to: "public" }, occurredAt: "2026-04-10T00:00:00Z" },
];

// __tests__/_setup.ts（02a/02b/02c 共通）
export const setupD1 = async (): Promise<InMemoryD1> => {
  const db = await createInMemoryD1();
  await db.exec(loadMigrations()); // 01a の migration を全て流す（5 + 9 + 7 = 21 テーブル）
  return {
    ctx: { db },
    loadFixtures: async (paths) => { for (const p of paths) await loadFixture(db, p); },
    reset: async () => { await truncateAll(db); },
  };
};
```

### 5. type test

| 対象 | 期待 |
| --- | --- |
| `(p: PublicMemberProfile).adminNotes` | プロパティ存在しないエラー（02a builder の戻り値型に adminNotes 不在を確認） |
| `auditLog.update("id", {})` | 関数不在エラー |
| `magicTokens.consume("raw_string", at)` | `MagicTokenValue` brand が必要なエラー |

## verify suite と AC のマッピング

| AC | 検証 test | ファイル |
| --- | --- | --- |
| AC-1 (5 repo unit pass) | unit test 5 種 | *.test.ts |
| AC-2 (adminNotes が view model に混ざらない) | type test + boundary test | adminNotes.test.ts |
| AC-3 (apps/web → repository 禁止) | boundary lint | scripts/lint-boundaries.mjs |
| AC-4 (apps/web → D1Database 禁止) | boundary lint | 同上 |
| AC-5 (dep-cruiser 0 violation) | dep-cruiser CI | depcruise.config.cjs |
| AC-6 (auditLog append-only) | invariant test | auditLog.test.ts |
| AC-7 (magicTokens single-use) | invariant test | magicTokens.test.ts |
| AC-8 (syncJobs status 一方向) | invariant test | syncJobs.test.ts |
| AC-9 (in-memory loader 共通利用) | _setup.test.ts | _setup.test.ts |
| AC-10 (prototype 昇格防止) | seed scope test | fixture が dev only と test |
| AC-11 (02a/02b 相互 import 0) | dep-cruiser CI | depcruise.config.cjs |

## 実行タスク

1. verify suite 表を `outputs/phase-04/verify-suite.md` に作成
2. AC マッピング表を `outputs/phase-04/main.md` に作成
3. fixture / setup loader 構造を verify-suite.md に貼る
4. dep-cruiser config と ESLint config を verify-suite.md に貼る
5. boundary test の自動化方法（CI で `pnpm depcruise && pnpm lint` 必須）を main.md に

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 3 outputs/phase-03/main.md | 採用案 A |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | OTP / Magic Link 仕様 |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | adminNotes / auditLog 仕様 |
| 参考 | doc/02-application-implementation/02a-... / 02b-... | fixture loader の利用側 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | verify suite を実装の到達目標 |
| Phase 6 | 異常系（同一 token 二重 consume / 02a/02b 経路の violation 検出 等） |
| Phase 7 | AC matrix の検証列 |
| Phase 8 | dep-cruiser config の DRY 化対象 |
| 08a | repository contract test を継承 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| D1 boundary | #5 | dep-cruiser + ESLint test を verify suite に含める |
| GAS 昇格防止 | #6 | seed が dev only / prod build から除外を test |
| admin 本文編集禁止 | #11 | adminNotes / auditLog test に member_responses 触らない確認 |
| view 分離 | #12 | type test で `PublicMemberProfile` の adminNotes 不在 |
| append-only | — | UPDATE/DELETE API 不在の type test |
| single-use | — | 二重 consume の reason 確認 |
| 状態遷移 | — | syncJobs ALLOWED_TRANSITIONS test |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | unit test 一覧 | 4 | pending | 6 ファイル |
| 2 | boundary test (dep-cruiser/ESLint) | 4 | pending | 6 ケース |
| 3 | invariant test | 4 | pending | 6 シナリオ |
| 4 | fixture / setup loader | 4 | pending | 02a/02b 共通利用想定 |
| 5 | type test snippet | 4 | pending | 3 ケース |
| 6 | AC マッピング | 4 | pending | AC-1〜AC-11 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | AC-test マッピング + 戦略 |
| ドキュメント | outputs/phase-04/verify-suite.md | verify suite 詳細 + fixture + dep-cruiser config |

## 完了条件

- [ ] verify suite 表が AC-1〜AC-11 を網羅
- [ ] boundary test が dep-cruiser / ESLint 双方を持つ
- [ ] fixture / setup loader signature が 02a/02b 共通利用可能
- [ ] dep-cruiser ルール案が pseudo config

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が completed
- [ ] outputs/phase-04/{main,verify-suite}.md が配置済み
- [ ] AC-1〜AC-11 全てに対応 test がマップ
- [ ] artifacts.json の Phase 4 を completed に更新

## 次 Phase

- 次: Phase 5 (実装ランブック)
- 引き継ぎ事項: verify suite / fixture / setup loader / dep-cruiser config
- ブロック条件: 任意の AC が test なしの場合 Phase 5 に進めない
