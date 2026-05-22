# Phase 4 — Open Questions 解決

> 親 workflow phase-4 §1 / §3.2 / §4 の解決済 Q を本仕様に確定として転記。

## Q1. merge response の field 命名

**Q**: `mergedMemberId` / `targetMemberId` のどちらを正本とするか。

**A**: `targetMemberId` を正本とする。`mergedMemberId` は **使用禁止**。
**根拠**: `apps/api/src/repository/identity-merge.ts:149,171` で `targetMemberId` 返却が固定されており、shared `MergeIdentityResponseZ` も `targetMemberId` で定義。

**反映**:
- §5.2 merge response shape に `targetMemberId` を採用
- DoD §9-8: `grep -n "mergedMemberId" admin-identity-conflicts.spec.ts` が **0 hit** で fail

## Q2. archived source member id の field 名

**Q**: `sourceMemberId` を merge response にも入れるか。

**A**: list item 側の入力フィールド名としてのみ `sourceMemberId` を使用。merge response では shared schema の `archivedSourceMemberId` を使う。

## Q3. cascade preview skip を本 spec に含めるか

**A**: 含めない。cascade preview skip は sub-task 2c の責務。本 spec は **skip 0 件**。

## Q4. race condition / counter 検証を本 spec に含めるか

**A**: 含めない。race / counter 検証は sub-task 2a の責務。

## Q5. 実 API / 実 D1 を叩く統合パスを混在させるか

**A**: 混在させない。`page.route()` mock のみ。不変条件 4（D1 直接アクセス禁止 / `apps/web` から D1 binding 禁止）の維持。

## Q6. selector 戦略

**A**: `getByRole` / `getByText` / `getByTestId` 優先。Tailwind class / 色値依存禁止（不変条件 2）。

## Q7. 認可境界の具体表現

**A**:
- **member**: API 403 → admin layout 内 403 表示 or `/profile` redirect。admin 専用要素は不可視であること。
- **anonymous**: `page.url()` が `/login` を含むこと。
