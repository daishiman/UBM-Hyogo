# Phase 3: タスク分解

[実装区分: 実装仕様書]

## メタ情報

| 項目     | 内容                                                              |
| -------- | ----------------------------------------------------------------- |
| タスクID | issue-883-adapter-dev-warn-unknown-kind                           |
| 分類     | 改善（DX / 観測性）                                               |
| 対象機能 | adapter callback 注入 + page.tsx 環境別 callback + spec case 追加 |
| 優先度   | 低                                                                |
| Issue    | #883                                                              |

## 単一タスク構成（CONST_007: 1 サイクル内完了）

| Step | 内容                                                                                                      | 対象ファイル                                                            | 種別 |
| ---- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---- |
| S1   | adapter シグネチャ拡張: 第2引数 `options?: { onUnknownKind?: (field: RawField) => void }` を追加（後方互換） | `apps/web/src/lib/adapters/member-detail.ts`                            | 編集 |
| S2   | `normalizeField` の `FieldKindZ.safeParse` 失敗ブランチで `options.onUnknownKind?.(field)` を呼出           | `apps/web/src/lib/adapters/member-detail.ts`                            | 編集 |
| S3   | adapter spec に「unknown kind で onUnknownKind callback が呼ばれる」ケース 1 件追加（既存 8 → 10）         | `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`             | 編集 |
| S4   | page.tsx で `process.env.NODE_ENV === "development"` 時のみ `console.warn` callback を注入                  | `apps/web/app/(public)/members/[id]/page.tsx`                           | 編集 |
| S5   | 検証コマンド一括実行（typecheck / lint / web filter test / production build + grep 0 件）                  | —                                                                       | 実行 |

## 分割しない理由（CONST_007）

- S1-S4 は同一 PR で完結する最小機能単位。
- 依存上分割不可能: S2 は S1 完了前提（型がないと callback 呼出が型エラー）。S3 は S1+S2 前提（callback 検証は呼出ブランチが存在しないと書けない）。S4 は S1 前提（options 型が export されている必要）。
- 後送り無し: 完了条件 4 項目（adapter / spec / page.tsx / DCE 確認）はすべて S1-S5 で吸収する。

## 変更対象ファイル一覧

| ファイル                                                                | 種別 | 行数規模目安       |
| ----------------------------------------------------------------------- | ---- | ------------------ |
| `apps/web/src/lib/adapters/member-detail.ts`                            | 編集 | +10〜15 行         |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`             | 編集 | +15〜20 行（1 case） |
| `apps/web/app/(public)/members/[id]/page.tsx`                           | 編集 | +5〜8 行           |

新規ファイル: 0 / 削除ファイル: 0。

## 検証コマンド（S5 の中身・Phase 10 で正本化）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web build
# production bundle に dev-only warn 文字列が残っていないことを確認
grep -R "\\[member-detail\\] unknown kind" apps/web/.next/server apps/web/.open-next 2>/dev/null | wc -l   # 期待: 0
```

## Phase 4-13 への引き継ぎ

後続実装エージェントがそのまま着手できるよう、必要事項を以下に列挙する。

### 引き継ぎ要点

| Phase    | 担当範囲                                                                                                                                  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 4  | adapter 型契約（`ToMemberDetailPropsOptions` の export 方針）/ spec の Vitest mock callback 形（`vi.fn()`）/ page.tsx callback 型          |
| Phase 5  | 実装ガイド: Phase 2 のコード sketch を完成形に。`RawField` 型の export 必要性を判定（spec で型参照する場合に export 追加）                  |
| Phase 6  | テスト戦略: 新規 1 ケースの branch coverage 寄与 / 既存 8 ケース regression / callback が `undefined` のときに silent skip を維持する回帰  |
| Phase 7  | 品質ゲート: typecheck / lint / web filter test / production build / `grep` による DCE 確認の 5 ゲート                                     |
| Phase 8  | DoD: Issue #883 完了条件 4 項目をそのまま転記                                                                                              |
| Phase 9  | リスク: Turbopack DCE 不確実性（local dev 限定で許容）/ callback throw 時の adapter 連鎖失敗（callback 仕様で「throw しない」を明記）      |
| Phase 10 | local verify: Phase 3 §「検証コマンド」を正本化。実行ログを `outputs/phase-10/` に保存                                                    |
| Phase 11 | evidence: production bundle grep ログ / spec 10 ケース pass ログ / `pnpm typecheck`+`pnpm lint` ログを `outputs/phase-11/` に保存          |
| Phase 12 | canonical 9 headings で documentation 化。adapter API 拡張 / page.tsx 注入パターン / DCE 信頼根拠を実装ガイドとして記録                    |
| Phase 13 | commit & PR: `feat(adapter): toMemberDetailProps に dev-mode unknown kind 観測 callback を追加 (#883)`。base は `dev`                     |

### 不変条件（Phase 4-13 全 Phase に継続適用）

1. adapter pure 性維持（環境分岐は関数内に書かない）。
2. 後方互換維持（既存呼出を変更しない）。
3. production bundle DCE 維持（`next build --webpack` 正本）。
4. `apps/web` から D1 直接アクセス禁止。
5. `PublicMemberProfileZ` / `FieldKindZ` schema 不変。
6. 新規 test ファイルは `*.spec.{ts,tsx}` のみ（本タスクは既存 spec への追記のみで新規ファイルなし）。

### 未確定事項（Phase 4 で確定する）

- `RawField` 型を public export するか、`ToMemberDetailPropsOptions` の callback 引数型を局所 alias にとどめるか。
- spec での callback 検証は `vi.fn()` の `toHaveBeenCalledWith(expect.objectContaining({ kind: "unknown_kind_xyz" }))` 形を推奨（Phase 4 で確定）。

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

