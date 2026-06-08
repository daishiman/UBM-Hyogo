# Phase 2: 設計 — issue-1104-member-creation-path-unification

> [実装区分: 実装仕様書] / NON_VISUAL / implementation_mode: `new`

## 1. 真の論点（要件レビュー思考法）

| 観点 | 結論 |
|------|------|
| 真の論点 | 「member（`member_identities`）生成と `member_status` 既定行生成の**責務が単一点に集約されていない**」こと。現象（404）ではなく、生成責務の所有権が分散していることが主問題 |
| 依存関係・責務境界 | `member_identities` を作る全経路が `member_status` 生成責務を**暗黙に共有**している。これを 1 つの helper が**明示的に所有**する構造へ移す |
| 価値とコストの不均衡 | コスト最小（既存 `ensureMemberStatusRow` を再利用・新規 SQL/migration なし）で、将来の経路追加時の orphan 再発を構造的に封じる価値が得られる |
| 改善優先順位 | P-2（auto-link・現役 orphan 源）> P-1（ingest・既に 2 呼び出しで止血済だが統合）> P-3（防御・新規生成経路でない） |
| 状態所有権 | 「member 生成 = identity 行 + status 既定行のペア生成」を **repository 層の単一 helper が所有**する |

### 因果ループ

- **バランスループ（防御）**: 新経路追加 → orphan リスク → 単一 helper 経由を強制 → orphan 構造的に発生不能。helper を経由しない identity INSERT が新たに書かれない限り再発しない。
- **強化ループ（負）**: 従来 = 経路追加 → 各自で status 生成を実装 → 実装漏れ → orphan → 404 → 個別止血（散在予防呼び出し）→ さらに経路追加で再発…。本タスクはこのループを単一 helper で断つ。

## 2. 単一 helper の契約（F-1）

### 2.1 設計判断: helper 形態

3 案を比較し **案 C** を採用する。

| 案 | 内容 | 採否 |
|----|------|------|
| 案 A | `upsertMember` 自体に `member_status` 生成を内包 | △ ingest 専用 SQL（upsert）に縛られ、auto-link（insert-or-ignore）が再利用できない |
| 案 B | 各経路で `ensureMemberStatusRow` を引き続き個別呼び出し（現状維持） | ✗ 責務集約にならない（issue の根本要件を満たさない） |
| **案 C（採用）** | identity 生成（呼び出し側が渡す）と `member_status` 既定行生成を束ねる薄い helper を新設し、両経路がそれを経由。identity 生成の SQL 差（upsert / insert-or-ignore）は helper 引数 or 内部分岐で吸収 | ✅ 責務集約・両経路カバー・既存 helper 再利用 |

### 2.2 採用 helper シグネチャ

`apps/api/src/repository/members.ts` に追加（命名は既存 `ensure*` 先例 + `upsertMember` と整合）:

```ts
/**
 * 会員を作成（upsert）し、member_status 既定行を必ず同期生成する単一 helper。
 * member 生成の唯一の正規経路。どの呼び出し元から作っても member_status orphan が
 * 構造的に発生しないことを保証する（issue #1104）。
 *
 * - identity: upsertMember と同一の INSERT ... ON CONFLICT DO UPDATE
 * - status:   ensureMemberStatusRow（INSERT OR IGNORE・冪等・既定行生成）
 */
export async function createMemberWithStatus(
  c: DbCtx,
  row: UpsertMemberInput,
): Promise<void> {
  await upsertMember(c, row);          // member_identities（既存関数を内部委譲）
  await ensureMemberStatusRow(c, row.memberId); // member_status 既定行（既存 helper 再利用）
}
```

> import 追加: `members.ts` で `ensureMemberStatusRow` を `./status` から import する。循環 import 確認 = `status.ts` は `members.ts` を import しない（現行 `status.ts` の import は `_shared/db` / `_shared/brand` / `@ubm-hyogo/shared` / `_shared/sql` のみ）ため循環は発生しない（Phase 3 で再確認）。

### 2.3 auto-link 経路の status 連結（F-3・最重要）

`backfillIdentityFromCandidate`（`identities.ts:69`）は upsert ではなく `INSERT OR IGNORE` であり、`UpsertMemberInput` 型と引数が異なる（`AutoLinkCandidate`）。よって `createMemberWithStatus` をそのまま流用せず、**identity INSERT 後に実際の identity を再取得してから `ensureMemberStatusRow` を連結**する（同関数内で両行生成を保証）。

```ts
const identity = await findIdentityByEmail(
  c,
  candidate.response_email as ResponseEmail,
);
if (identity) {
  await ensureMemberStatusRow(c, asMemberId(identity.member_id));
}
return identity;
```

> これにより P-2（auto-link）で生成された identity にも必ず member_status 既定行が付く。`ensureMemberStatusRow` は冪等のため、既存 identity（INSERT OR IGNORE が no-op の場合）でも安全。競合時は実際に email に紐づいた identity だけを補完し、losing candidate の member_id には status を作らない。
> `identities.ts` は `ensureMemberStatusRow` を `./status` から、`asMemberId` を `_shared/brand` から import する（循環なし）。

### 2.4 ingest 経路の統合（F-2）

`sync-forms-responses.ts:307-316` の以下を:

```ts
await upsertMember(dbCtx, { ... });
await ensureMemberStatusRow(dbCtx, memberId);
// upsertMember + ensureMemberStatusRow の 2 write
writeCount += 2;
```

単一 helper 1 呼び出しへ置換:

```ts
await createMemberWithStatus(dbCtx, { ... });
// createMemberWithStatus = member_identities + member_status の 2 write
writeCount += 2;
```

> `writeCount += 2` は不変（helper 内部で 2 write のまま）。import を `upsertMember` から `createMemberWithStatus` へ差し替え、不要になった `ensureMemberStatusRow` の直接 import は ingest 側から除去（ただし同 job 内で `setConsentSnapshot` 等が `status` を使うため、`ensureMemberStatusRow` の import 残存有無は Phase 5 で実コード確認）。

## 3. F-4 設計判定: route mutation の防御呼び出し（`member-status.ts:60`）

| 判定 | 内容 |
|------|------|
| 結論 | **防御 backstop として保持する（集約 helper へ寄せない）** |
| 理由 | `member-status.ts:60` は新規 member 生成経路ではなく、「PATCH 対象の既存 member に（legacy 由来で）`member_status` 行が無い場合に mutation 前に既定行を保証する」防御。生成責務の集約対象（= 新規生成経路）ではない。これを除去すると、backfill 0025 適用前に作られ未修復の legacy orphan への PATCH が再び 404/失敗するリスクが残る |
| AC-3 との整合 | AC-3 が言う「散在する予防呼び出しの集約」は **新規生成経路（P-1/P-2）に散在するもの**が対象。P-3 は mutation 防御であり性質が異なるため、コメントで「new-member 生成は createMemberWithStatus が保証。本呼び出しは legacy orphan への mutation 防御 backstop」と意図を明記して保持する |
| 文書化 | phase-1 inventory・implementation-guide に「P-3 は意図的に保持する防御」と記録し、grep gate（AC-3）は P-1/P-2 を対象に判定する |

> これは「責務境界を混在させない」原則の適用: 生成責務（helper が所有）と mutation 防御（route が所有）を分離する。

## 4. 入力・出力・副作用

| helper | 入力 | 出力 | 副作用 |
|--------|------|------|--------|
| `createMemberWithStatus(c, row: UpsertMemberInput)` | DbCtx + identity 行 | `Promise<void>` | `member_identities` upsert + `member_status` INSERT OR IGNORE（2 write・冪等） |
| `backfillIdentityFromCandidate`（改修後） | DbCtx + AutoLinkCandidate | `Promise<MemberIdentityRow \| null>`（不変） | identity INSERT OR IGNORE + `member_status` INSERT OR IGNORE（+1 write・冪等）|

### エラーハンドリング
- いずれも `INSERT OR IGNORE` / `ON CONFLICT` で冪等。重複 INSERT で throw しない。
- D1 例外は呼び出し元（ingest job の withSyncMutex / auth route）の既存ハンドリングに委ねる（本タスクで握り潰さない）。

## 5. SubAgent lane（仕様書作成の並列構成）

| lane | 担当 Phase | 並列性 |
|------|-----------|--------|
| backbone（親が直列作成） | index / phase-1 / phase-2 / phase-3 / artifacts | 直列（CONST_001 設計優先） |
| lane A | phase-4 / phase-5 / phase-6 | 並列 |
| lane B | phase-7 / phase-8 / phase-9 | 並列 |
| lane C | phase-10 / phase-11 / phase-12 / phase-13 | 並列 |
| lane D | outputs/phase-11 + outputs/phase-12（strict 7）+ outputs/artifacts.json | 並列 |

> validation lane（gate 検証）は直列で締める。

## 6. 完了条件

- [x] 真の論点 / 因果ループ / 状態所有権を固定
- [x] 単一 helper 契約（`createMemberWithStatus`）を確定
- [x] auto-link status 連結（F-3）を設計
- [x] ingest 統合（F-2）を設計
- [x] F-4（route 防御の保持判定）を確定
- [x] 循環 import の非発生を事前確認（Phase 3 で再検証）
- [x] SubAgent lane を定義
