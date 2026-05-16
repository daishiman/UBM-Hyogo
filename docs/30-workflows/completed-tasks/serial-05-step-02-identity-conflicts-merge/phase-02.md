# Phase 2: 設計

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase は、既存
> `apps/web/src/components/admin/IdentityConflictRow.tsx` の mutation 実装を
> `useAdminMutation` に寄せるための関数境界・API payload・evidence 設計を固定する。
> 新規 `_components/` 作成や `page.tsx` client 化は行わない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-02 identity-conflicts merge UI hardening |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |

## 目的

既存 identity-conflicts 画面の実装実態を前提に、最小変更で安全な merge UI を成立させる。
本 Phase は以下 3 成果物を出力する。

1. `outputs/phase-02/row-hardening-design.md` — `IdentityConflictRow` の state / a11y / error 表示
2. `outputs/phase-02/mutation-contract-design.md` — `useAdminMutation` 呼び出しと API request / response
3. `outputs/phase-02/dependency-matrix.md` — 既存正本と編集責務

## 設計詳細

### 2.1 IdentityConflictRow hardening

**配置先**: `apps/web/src/components/admin/IdentityConflictRow.tsx`（既存）

**入力型**:

```typescript
import type {
  IdentityConflictRow as IdentityConflictRowData,
  MergeIdentityResponse,
  DismissIdentityConflictResponse,
} from "@ubm-hyogo/shared";
```

`IdentityConflictRowData` の実 field は `conflictId` / `sourceMemberId` /
`candidateTargetMemberId` / `matchedFields` / `detectedAt` / `responseEmailMasked` /
`syncJobId`。旧 UI 仕様で想定していた別型名・email field・`targetMemberId` field は使わない。

**state**:

```typescript
const [stage, setStage] = useState<"idle" | "merge-confirm" | "merge-final" | "dismiss">("idle");
const [reason, setReason] = useState("");
```

既存の二段階確認（`merge-confirm` → `merge-final`）を維持し、送信中状態は
`useAdminMutation` の `isLoading` を使う。重複 submit は hook 側の
`isSubmittingRef` で抑止される。

### 2.2 mutation contract

**merge endpoint**:

```typescript
const mergeMutation = useAdminMutation<MergeIdentityResponse>(
  `/api/admin/identity-conflicts/${encodeURIComponent(item.conflictId)}/merge`,
  "POST",
  {
    successMessage: "✓ 統合しました",
    onError: (err) => {
      // ALREADY_MERGED / TARGET_MEMBER_MISMATCH を運用者向け文言に変換して画面内 error に保持する。
    },
  },
);

await mergeMutation.trigger({
  targetMemberId: item.candidateTargetMemberId,
  reason: reason.trim(),
});
```

**dismiss endpoint**:

```typescript
const dismissMutation = useAdminMutation<DismissIdentityConflictResponse>(
  `/api/admin/identity-conflicts/${encodeURIComponent(item.conflictId)}/dismiss`,
  "POST",
  { successMessage: "✓ 別人として確定しました" },
);
```

API 正本は `apps/api/src/routes/admin/identity-conflicts.ts` と
`packages/shared/src/schemas/identity-conflict.ts`。merge request は
`{ targetMemberId, reason }`、response は `{ mergedAt, targetMemberId,
archivedSourceMemberId, auditId }`。

### 2.3 page boundary

`apps/web/app/(admin)/admin/identity-conflicts/page.tsx` は server component のまま維持する。
`fetchAdmin<ListIdentityConflictsResponse>()` で取得した `items` を既存
`IdentityConflictRow` に渡すだけにし、D1 直接アクセスや `process.env.*` 参照は追加しない。

### 2.4 dependency matrix

| モジュール | 用途 | owner | 本タスクでの扱い |
| --- | --- | --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | merge / dismiss UI | step-02 | hardening 対象 |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | server entry | existing admin UI | 境界維持確認 |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | mutation 共通 hook | step-01 | import のみ |
| `packages/shared/src/schemas/identity-conflict.ts` | API schema / type | shared schema | import のみ |
| `apps/api/src/routes/admin/identity-conflicts.ts` | API handler | apps/api | 変更禁止 |

## validation matrix

| command | scope | 成功条件 |
| --- | --- | --- |
| `pnpm typecheck` | repo 全体 | error 0 |
| `pnpm lint` | repo 全体 | error 0 |
| `pnpm --filter @ubm-hyogo/web test -- IdentityConflictRow.spec.tsx` | row unit | green |
| `pnpm verify:tokens` | design token | HEX / arbitrary color 0 件 |
| `pnpm --filter @ubm-hyogo/web e2e:smoke` | smoke | `/admin/identity-conflicts` 経路 green |

## 実行タスク

- [ ] `IdentityConflictRow` の既存 state と mutation 経路を inventory する
- [ ] `callJson()` を撤去し、`useAdminMutation` import へ寄せる設計を `row-hardening-design.md` に記録
- [ ] merge body を `{ targetMemberId: item.candidateTargetMemberId, reason: reason.trim() }` に固定
- [ ] 400 / 409 の error mapping と inline panel 維持条件を `mutation-contract-design.md` に記録
- [ ] `page.tsx` は server component 維持であることを `dependency-matrix.md` に明記

## 完了条件

- [ ] 設計成果物 3 件作成済
- [ ] API request / response shape が shared schema と一致
- [ ] `useAdminMutation` の API surface は `trigger` / `isLoading` / `error` に統一
- [ ] 旧分割 component 前提が残っていない
- [ ] validation matrix の script 名が `package.json` と一致

## 次Phase

Phase 3 (設計レビュー): 正本 contract / server-client 境界 / a11y / test 方針の GO/NO-GO を確定する。
