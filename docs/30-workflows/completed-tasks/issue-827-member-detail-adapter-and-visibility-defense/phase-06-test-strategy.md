# Phase 6: テスト戦略

## 追加: adapter 単体テスト

ファイル: `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`

| TC | 名称 | 検証内容 |
|----|------|---------|
| TC-A-01 | activity 分離 + allSections visibility filter | `key === "activity"` の section が `detailSections` に含まれず、`allSections` には public field だけで含まれる |
| TC-A-02 | detail visibility 二重防御 | `detailSections` でも `visibility !== "public"` の field が除外される（`member` / `admin` で確認） |
| TC-A-03 | url kind 除外 | `kind === "url"` の field が `detailSections` から除外される |
| TC-A-04 | unknown kind silent skip | `DISPLAYABLE_KINDS` 外の `unknown` / `system` / `consent` が除外される |
| TC-A-05 | 空 section 除外 | filter 後 0 件の section は `detailSections` から除外される |
| TC-A-06 | pure function | 同一入力 → 同一出力（`Object.is` 不一致でも deep equal） / 入力 mutation なし |

## 更新: 既存 component test

`apps/web/src/components/public/__tests__/MemberDetailSections.component.spec.tsx`:

- TC-U-03 (`excludes url kind from KVList`) を **削除** — filter 責務が adapter に移管されたため、component layer のテストとしては不適切。adapter TC-A-03 に置換。
- TC-U-05 (`hides section when no visible fields remain`) を **「fields が 0 件の section を render しない」**に書き換え（filter 責務は外部）。

## 既存テスト不変

- API 側 `builder.repository.spec.ts` / view-model spec は変更不要。
- Playwright visual snapshot (`full-visual-members-detail-*`) は **再撮影不要**（render 結果不変が前提のため）。

## カバレッジ目標

- `apps/web/src/lib/adapters/member-detail.ts` は branch coverage 100% を目標（filter 全分岐をテスト網羅）。
