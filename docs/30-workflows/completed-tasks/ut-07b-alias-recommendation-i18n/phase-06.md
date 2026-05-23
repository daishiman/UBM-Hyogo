# Phase 6: テスト拡充

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 名称 | テスト拡充 |
| 追加観点 | fail path / 回帰 guard / 過剰一致 negative |

## 目的

Phase 5 で GREEN にした実装に対し、fail path・回帰 guard・補助 fixture を追加し、過剰一致や regress を Phase 7 以降で検出できるようにする。

## 実行タスク

1. 「section 一致が normalize で縮まった label 距離より優先される」回帰 guard を追加する
2. 「大小文字は normalize で吸収しない」negative case を追加する
3. 既存英語 fixture 5 ケースが無編集で残っていることを `git diff` で確認する
4. 全 20 ケース PASS を確認する

## 追加するテスト

```ts
it("section 一致が normalize で縮まった label 距離より優先される", () => {
  const r = recommendAliases(
    { label: "メール", sectionKey: "contact", position: null },
    [
      { stableKey: "email_profile", label: "メール", sectionKey: "profile", position: 1 },
      { stableKey: "email_contact", label: "メイル", sectionKey: "contact", position: 2 },
    ],
  );
  expect(r[0]).toBe("email_contact");
});

it("大小文字は normalize で吸収しないため Email と email は別 label", () => {
  expect(
    levenshtein(
      normalizeLabelForCompare("Email"),
      normalizeLabelForCompare("email"),
    ),
  ).toBe(1);
});
```

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run src/services/aliasRecommendation.spec.ts
```

期待: levenshtein 4 + recommendAliases 9 + normalize 7 = 計 20 ケース PASS。

## 参照資料

- `outputs/phase-04/red-test-result.md`
- `outputs/phase-05/green-test-result.md`
- `apps/api/src/services/aliasRecommendation.spec.ts`

## 統合テスト連携

- 20 ケース PASS が Phase 7 coverage 確認の前提
- Phase 9 品質保証で同コマンドを再実行する

## 成果物

`outputs/phase-06/expanded-test-result.md` に拡充ケース一覧と実行ログを記録。

## 完了条件

- [ ] 拡充ケース 2 件が追加されている
- [ ] 全 20 ケースが PASS
- [ ] 既存英語 fixture が無編集（`git diff` で確認）
- [ ] `outputs/phase-06/expanded-test-result.md` が存在する
