# Phase 7: カバレッジ

## 対象ファイル

`apps/web/proxy.ts`

`apps/web/proxy.ts` は `apps/web/src/**` 外の root convention file なので、coverage include に明示する。

## カバレッジ目標

| メトリクス | 目標 | 根拠 |
|---|---|---|
| Statements | ≥ 90% | 認証 boundary は high-impact、edge case の網羅性が必要 |
| Branches | ≥ 85% | admin / profile / cookie 有無 / isAdmin の組み合わせ |
| Functions | 100% | helper 関数すべて test 経由で touch |

## 実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage proxy.spec.ts
```

Coverage include gate:

- `vitest.config.ts` includes `apps/web/proxy.ts`
- `apps/web/package.json#test:coverage` includes `--coverage.include="apps/web/proxy.ts"`

## チェックポイント

- 未カバー branch があれば proxy.spec.ts に実 case を追加する
- `apps/web/proxy.ts` が coverage 対象から漏れていないことを確認する
- coverage gate（lefthook `coverage-guard` / CI）を満たすこと
- 既存 baseline を下回らないこと（`--changed` モード時に proxy.ts が新規ファイル扱いになるため、新規ファイルの coverage 閾値を満たすこと）

## 既知の制約

認証済 JWT を要する case（AC-2/3/6）は `@ubm-hyogo/shared` の `signSessionJwt` で valid token を生成し、coverage 対象に含める。`it.todo` / `test.todo` による除外は不可。

## メタ情報

| 項目 | 値 |
|---|---|
| workflow | issue-277-next-proxy-migration |
| phase | 7 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

新規 `proxy.ts` の auth branch が coverage gate を満たすことを確認する。

## 実行タスク

- `proxy.spec.ts` coverage を実行する。
- admin/profile/cookie/isAdmin branch の未カバーを確認する。
- baseline regression がないことを確認する。

## 参照資料

- Phase 6 test additions。
- coverage guard settings。

## 成果物

- coverage run output。
- 必要に応じた追加 test case。

## 完了条件

- Statements 90% 以上、Branches 85% 以上、Functions 100%。
- authenticated branch が coverage 対象に含まれる。

## 統合テスト連携

Phase 9 QA の test / coverage gate に連携する。
