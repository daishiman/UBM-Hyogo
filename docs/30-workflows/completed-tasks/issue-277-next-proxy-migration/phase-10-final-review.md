# Phase 10: 最終レビュー

## レビューチェックリスト

### コード

- [ ] `apps/web/proxy.ts` が存在
- [ ] `apps/web/middleware.ts` が削除されている
- [ ] `export async function proxy` / `export default proxy` / `export const config` の3 export が存在
- [ ] matcher が `["/admin/:path*", "/profile/:path*"]` のまま
- [ ] SESSION_COOKIE_NAMES の順序が変わっていない
- [ ] `decodeAuthSessionJwt` の引数順が変わっていない
- [ ] `apps/web/app/(admin)/layout.tsx` のコメントが proxy.ts 表記に更新
- [ ] `apps/web/__tests__/proxy.spec.ts` が追加

### テスト

- [ ] proxy.spec.ts AC-1〜AC-7 green
- [ ] `it.todo` / `test.todo` が残っていない
- [ ] 既存 `pnpm test` 全体が green

### ビルド

- [ ] `pnpm build` success
- [ ] build log に `"middleware" file convention is deprecated` が出ない

### ドキュメント

- [ ] Phase 12 のドキュメントが完成
- [ ] root `artifacts.json` と `outputs/artifacts.json` が一致
- [ ] Phase 12 strict 7 outputs が存在し、compliance check の canonical 9 headings が揃っている
- [ ] aiworkflow-requirements `resource-map` / `quick-reference` / artifact inventory が同期済み
- [ ] PR body が phase-13 仕様に従う

### 不変条件

- [ ] 不変条件 #5（D1 直接アクセス禁止）維持
- [ ] 不変条件 #9（/no-access 専用画面に依存しない）維持
- [ ] 不変条件 #11（admin/profile HTML SSR 防止）維持

## 承認条件

上記全項目 ✅、または未済理由が phase-12-documentation.md に明記されていること。

## メタ情報

| 項目 | 値 |
|---|---|
| workflow | issue-277-next-proxy-migration |
| phase | 10 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

PR 前に code / test / build / documentation / invariants の整合を確認する。

## 実行タスク

- コード差分を review checklist で確認する。
- tests / build / docs / invariants を確認する。
- artifacts と strict 7 の存在を確認する。

## 参照資料

- Phase 5 implementation。
- Phase 9 QA。
- outputs/phase-12/phase12-task-spec-compliance-check.md。

## 成果物

- 本 Phase 10 final review checklist。

## 完了条件

- checklist がすべて解消済み、または未済理由が明記されている。
- user-gated operation が勝手に実行されていない。

## 統合テスト連携

Phase 9 の自動 QA と Phase 11 の manual smoke を final review の証跡として使う。
