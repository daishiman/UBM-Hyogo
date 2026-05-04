[実装区分: 実装仕様書]

# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

Phase 2/3 で確定した family 単位置換の挙動同一性（identity）を保証するため、family 別 focused test 一覧と DoD（Definition of Done）を確定する。新規テストは `scripts/lint-stablekey-literal.test.ts` の strict 期待値更新（→ 0）のみとし、それ以外は既存テストを reuse する方針を明示する。

## 前提

- 全置換は identity 変換（runtime output 同一）
- 関数シグネチャ・export 名は変更しない
- 既存 unit / integration テストは無修正で PASS することが期待される
- 期待値 0 への更新は最終 commit で実施

## family 別 focused test matrix

`outputs/phase-04/test-matrix.md` に詳細を記述する。Phase 5 実装者が family commit 直後に実行する vitest path を一覧化する。

| family | 主たる focused test path（候補） | 確認観点 |
| --- | --- | --- |
| A (jobs/mappers) | `apps/api/src/jobs/mappers/sheets-to-members.test.ts`（存在する場合） / `apps/api/src/jobs/sync-sheets-to-d1.test.ts` | row → member mapping output 同一 |
| B (repository) | `apps/api/src/repository/_shared/builder.test.ts` / `apps/api/src/repository/publicMembers.test.ts` | SQL 列名 / D1 row mapping 同一 |
| C (routes/admin) | `apps/api/src/routes/admin/members.test.ts` / `apps/api/src/routes/admin/requests.test.ts` | request payload 検証 / response shape 同一 |
| D (use-case / view-model) | `apps/api/src/use-cases/public/list-public-members.test.ts` / `apps/api/src/view-models/public/public-member-list-view.test.ts` / `apps/api/src/view-models/public/public-member-profile-view.test.ts` | view 構築結果同一 |
| E (profile components) | `apps/web/app/profile/_components/*.test.tsx`（存在する場合） | render snapshot / 状態更新同一 |
| F (public components) | `apps/web/src/components/public/MemberCard.test.tsx` / `ProfileHero.test.tsx`（存在する場合） | render snapshot 同一 |
| G (shared utils consent) | `packages/shared/src/utils/consent.test.ts` | output literal `"publicConsent"` `"rulesConsent"` 同一 |

> **注**: 上記 test path は Phase 5 実装者が `Bash` で `find` 等を用いて実在 path を確認する。存在しない family については「focused test なし → 統合 vitest で代替」を Phase 4 main.md に記録する。

## 追加・更新するテスト

| ファイル | 変更内容 | 担当 commit |
| --- | --- | --- |
| `scripts/lint-stablekey-literal.test.ts` | strict mode 期待 violation count を **0** に更新（既存値が 148 等の場合は置換）。`stableKeyCount=31` assertion は維持 | 最終 commit (test-update) |

新規テストは追加しない（identity 置換のため）。

## DoD（Definition of Done）

本タスクは以下すべてが PASS で完了とする。

| # | DoD 項目 | 検証コマンド |
| --- | --- | --- |
| 1 | strict 検査 violation 0 | `node scripts/lint-stablekey-literal.mjs --strict` exit 0 |
| 2 | stableKeyCount=31 維持 | `node scripts/lint-stablekey-literal.mjs --strict` 出力に `stableKeyCount=31` |
| 3 | strict 期待値テスト PASS | `mise exec -- pnpm exec vitest run scripts/lint-stablekey-literal.test.ts` |
| 4 | typecheck PASS | `mise exec -- pnpm typecheck` |
| 5 | lint PASS | `mise exec -- pnpm lint` |
| 6 | family 別 focused test PASS | family ごとの `pnpm exec vitest run <path>` |
| 7 | suppression 0 件追加 | grep `eslint-disable` / `@ts-ignore` の差分が 0 |

## 実行タスク

- [ ] family A〜G の focused test path を実在確認し test-matrix.md に記録
- [ ] strict 期待値テスト更新範囲を確定
- [ ] DoD 7 項目を `outputs/phase-04/main.md` に転記
- [ ] suppression 0 件 grep 確認手順を明記
- [ ] Phase 5 実装者へ「commit 単位で focused test を走らせる」運用を引き継ぎ

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/per-family-plan.md | family 別ファイル一覧 |
| 必須 | outputs/phase-03/main.md | commit 順序 |
| 必須 | scripts/lint-stablekey-literal.test.ts | 期待値更新対象 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト戦略サマリー / DoD |
| ドキュメント | outputs/phase-04/test-matrix.md | family 別 focused test path matrix |
| メタ | artifacts.json | phase 4 status |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | family commit 直後の focused test 実行手順 |
| Phase 6 | 違反 fixture / suppression bypass の test 化 |
| Phase 7 | DoD 7 項目の統合実行 evidence |

## 多角的チェック観点

- 既存テストが「stableKey literal を直接 assert している」ケース → 置換後も literal 値同一なので PASS
- snapshot test が key 順に依存 → identity 置換で順序不変、PASS
- consent.ts output assert がユニコード正規化 / 大文字小文字を含む → identity 維持で PASS
- 型 narrowing で型 test (`expectType`) が壊れる → Phase 4 で type test 存在を確認

## 完了条件

- [ ] family 別 focused test matrix 完成
- [ ] DoD 7 項目記載
- [ ] suppression 0 件確認手順記載
- [ ] Phase 5 への引き継ぎ整理

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（focused test 不在 family / type test 壊れ / snapshot drift）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 4 を completed

## 次 Phase

- 次: Phase 5 (実装ランブック)
- 引き継ぎ: family 別 focused test matrix / DoD 7 項目 / strict 期待値更新 commit 配置
- ブロック条件: focused test path 実在確認未了なら Phase 5 ランブック確定不可
