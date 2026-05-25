# Phase 6: テスト戦略

[実装区分: 実装仕様書]

## メタ情報

| 項目     | 内容                                                                |
| -------- | ------------------------------------------------------------------- |
| タスクID | issue-883-adapter-dev-warn-unknown-kind                             |
| 対象     | `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` (+1)   |
| Issue    | #883                                                                |

## テストファイル

| ファイル                                                            | 変更    | ケース数推移 |
| ------------------------------------------------------------------- | ------- | ------------ |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`         | 編集    | 8 → 10       |

## ケース一覧（既存 8 + 新規 2）

| ID    | 名称                                                                  | 種別 | 検証ポイント                                                                                       |
| ----- | --------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------- |
| TC-01 | fixture は `PublicMemberProfileZ.parse` を通過する                     | 既存 | fixture 健全性                                                                                     |
| TC-02 | happy path: summary / attendance / tags をそのまま伝播する             | 既存 | passthrough                                                                                        |
| TC-03 | visibility=member field を除外する                                    | 既存 | visibility filter                                                                                  |
| TC-04 | visibility=admin のみで構成された section は丸ごと除外                 | 既存 | section 空除外                                                                                     |
| TC-05 | unknown kind を silent skip する                                       | 既存 | callback 未注入時に silent skip を維持（後方互換 regression）                                      |
| TC-06 | 入力を mutate しない                                                  | 既存 | pure (no mutation)                                                                                 |
| TC-07 | publicSections が空のとき sections === []                              | 既存 | empty input                                                                                        |
| TC-08 | 出力 field には visibility / source キーが含まれない                   | 既存 | shape 不変                                                                                         |
| TC-09 | **(新規)** unknown kind 出現時に onUnknownKind callback が呼ばれる    | 新規 | `vi.fn()` mock / `toHaveBeenCalledTimes(1)` / `toHaveBeenCalledWith` で `kind`+`stableKey` 一致確認 |
| TC-10 | **(新規)** page 境界の lenient schema は unknown kind を adapter まで通す | 新規 | `PublicMemberProfileZ` は fail-close のまま、`PublicMemberProfileWithUnknownKindZ` だけが unknown kind を通す |

### TC-09 仕様詳細

```ts
it("unknown kind 出現時に onUnknownKind callback が呼ばれる（kind/stableKey が一致）", () => {
  const onUnknownKind = vi.fn();
  const tampered = structuredClone(samplePublicMemberProfile);
  (tampered.publicSections[0].fields[0].kind as unknown as string) = "unknown_kind_xyz";
  const expectedStableKey = tampered.publicSections[0].fields[0].stableKey;

  toMemberDetailProps(tampered, { onUnknownKind });

  expect(onUnknownKind).toHaveBeenCalledTimes(1);
  expect(onUnknownKind).toHaveBeenCalledWith(
    expect.objectContaining({
      kind: "unknown_kind_xyz",
      stableKey: expectedStableKey,
    }),
  );
});
```

## branch coverage への寄与

| ブランチ                                       | カバー元                                      |
| ---------------------------------------------- | --------------------------------------------- |
| `normalizeField` の `visibility !== "public"`   | TC-03                                         |
| `normalizeField` の `!parsed.success` + callback 未注入 | TC-05 (既存 silent skip)                      |
| `normalizeField` の `!parsed.success` + callback 注入 | **TC-09 (新規)** ← 本タスクで初めてカバー    |
| page parse 境界で unknown kind が adapter 到達前に落ちない | **TC-10 (新規)**                              |
| `normalizeField` の正常返却                    | TC-02                                         |
| `normalizeSection` の `fields.length === 0`     | TC-04                                         |

## エッジケース（網羅判定）

| ケース                                          | 扱い                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| callback が throw する                          | テスト対象外（page.tsx 側で throw しない契約・Phase 4 で明文化）   |
| 同一 unknown kind が複数 field に出現           | TC-09 では 1 件のみ検証。回数 N の検証は YAGNI（minimal coverage） |
| callback がない + unknown kind 0 件             | TC-02 等既存ケースで間接担保                                        |
| `options.onUnknownKind === undefined` 明示注入  | TC-05 と等価（optional chaining `?.()` で no-op）                  |

## 未カバー受容範囲

- production bundle DCE は **ランタイムテスト不可**（grep evidence で Phase 11 にて確認）。
- Turbopack 経路（local dev）の DCE 挙動は受容範囲外（local dev で warn が出ても production deploy には影響しない）。

## 既存テスト影響

- component spec / view-model spec / API 側 spec すべて無改修。
- Playwright visual snapshot baseline 更新不要（render 結果不変）。
- `apps/web` vitest 既存 pass 件数の維持（spec 1 ケース追加分のみ +1）。

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/lib/adapters/__tests__/member-detail.spec.ts
```

## カバレッジ目標

- `apps/web/src/lib/adapters/member-detail.ts` の branch coverage を引き続き 100% に保つ（新規 callback 注入ブランチを TC-09 で網羅）。

## 共通骨格補足

## 目的

本 Phase の仕様観点を固定し、issue-883 の実装・検証・文書同期が後続 Phase と矛盾しない状態にする。

## 実行タスク

- 本文に記載した対象ファイル、契約、検証、証跡を確認する。
- 漏れが見つかった場合は同一サイクル内で修正する。

## 参照資料

- `artifacts.json`
- `outputs/phase-11/`
- `outputs/phase-12/`

## 実行手順

1. 既存本文の仕様・実績を確認する。
2. 実コード、証跡、正本仕様との対応を照合する。
3. 差分があれば同一サイクル内で反映する。

## 統合テスト連携

NON_VISUAL だが実装タスクのため、adapter spec / web tests / typecheck / lint / build / DCE grep を Phase 11 evidence に接続する。

## 多角的チェック観点（AIが判断）

- 矛盾なし
- 漏れなし
- 整合性あり
- 依存関係整合

## サブタスク管理

本タスクは S1-S5 を同一 workflow 内で完了する。未タスク化は検出なし。

## 成果物

- 本 Phase ファイル
- 関連する実コード / evidence / Phase 12 outputs

## 完了条件

- [x] 本 Phase の記述が実装・証跡・正本仕様と一致している。
- [x] coverage AC は adapter spec / web test / typecheck / lint / build evidence で代替確認する。

## タスク100%実行確認【必須】

- [x] この Phase に必要な確認を実施済み。

## 次Phase

次 Phase へ進む前に、本 Phase の差分と evidence を確認する。
