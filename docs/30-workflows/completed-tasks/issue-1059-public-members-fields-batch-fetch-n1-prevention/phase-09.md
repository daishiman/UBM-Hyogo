# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 公開 members list の fields 一括取得 N+1 防止 (issue-1059) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-06-02 |
| 状態 | completed |
| 前 Phase | 8 (リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| タスク種別 | implementation / NON_VISUAL / implementation_mode: new |

## 目的

実装・リファクタ完了後の最終 QA を実施し、typecheck / lint / 対象 vitest 全緑、不変条件 #5（apps/web 非接触）、
単数 helper の温存（誤削除なし）、出力形状不変を QA チェックリストで担保する。本 Phase は受入条件 AC-1〜AC-6 の
最終充足判定を行う。

## QA チェックリスト

| # | 項目 | 検証コマンド / 方法 | PASS 基準 |
| --- | --- | --- | --- |
| Q-1 | 型チェック緑 | `mise exec -- pnpm typecheck` | exit 0・エラー 0 |
| Q-2 | lint 緑 | `mise exec -- pnpm lint` | exit 0・エラー 0 |
| Q-3 | 対象 vitest 緑 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/repository/__tests__/responseFields.repository.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | 2 spec 全 PASS |
| Q-4 | 不変条件 #5（apps/web 非接触） | `git diff --name-only origin/dev...HEAD` | 出力に `apps/web/` を含む行が **0 件** |
| Q-5 | 単数 helper 温存（誤削除なし） | `grep -rn "listFieldsByResponseIds" apps/api/src` で複数形が存在し、かつ `grep -rn "listFieldsByResponseId\b" apps/api/src` で単数形の定義 + caller が残存 | 単数 `listFieldsByResponseId` の export 定義が削除されていない |
| Q-6 | fields クエリ ≦ 1（N+1 解消 / AC-3） | use-case テストの query 回数アサーション（Phase 4 で追加）が緑 | member N 件でも fields query が 1 回（または 0 回：空配列時） |
| Q-7 | 出力形状不変（AC-4） | 既存 use-case テストの期待 `PublicMemberListResponse` が変更なしで緑 | view 出力の値・形状が Before と一致 |
| Q-8 | スコープ外不変（AC-5） | `git diff --name-only origin/dev...HEAD` で変更ファイルが対象 2 + テスト 2（+ 本 workflow docs）に収まる | tags / schema / endpoint / Google Form 関連ファイルが差分に無い |
| Q-9 | `as never` 全廃（Phase 8 連携） | `grep -n "as never" apps/api/src/use-cases/public/list-public-members.ts` | 0 件 |

> **PASS 基準に「ファイルを削除したこと」を含めない**（FB-UI-02-1）。Q-5 は逆に「単数 helper を**削除していないこと**」を
> 確認する項目であり、削除を成果物としない。

## 実行タスク

1. Q-1 / Q-2（typecheck / lint）を実行し全緑を確認する。
   完了条件: 両コマンド exit 0。
2. Q-3 / Q-6 / Q-7（対象 vitest・N+1 query 回数・出力不変）を実行し全緑を確認する。
   完了条件: 対象 2 spec PASS かつ query 回数アサーション緑。
3. Q-4（不変条件 #5）: `git diff --name-only origin/dev...HEAD` の出力に `apps/web/` が含まれないことを grep で確認する。
   ```bash
   git diff --name-only origin/dev...HEAD | grep -c '^apps/web/'   # 0 を期待
   ```
   完了条件: apps/web 行 0 件。
4. Q-5（単数 helper 温存）: 単数 `listFieldsByResponseId` の定義 + caller が残存していることを grep で確認する。
   ```bash
   grep -rn "listFieldsByResponseId\b" apps/api/src    # 単数の定義 + 残存 caller を確認
   grep -rn "listFieldsByResponseIds" apps/api/src     # 複数形（新規）も存在
   ```
   完了条件: 単数 export 定義が削除されていない（「削除」を PASS 基準にしない）。
5. Q-8 / Q-9（スコープ外不変・`as never` 全廃）を grep で確認する。
   完了条件: 変更ファイルが対象範囲内・`as never` 0 件。
6. AC-1〜AC-6 の最終充足を QA チェックリストにマッピングして記録する。
   完了条件: AC ↔ Q-n の対応表が `outputs/phase-09/main.md` に残る。

## AC ↔ QA 対応

| AC | 内容 | 対応 QA |
| --- | --- | --- |
| AC-1 | helper 追加（`listFieldsByResponseIds`） | Q-5（複数形存在）/ Q-3 |
| AC-2 | Map(key=response_id) groupBy | Q-3 / Q-7 |
| AC-3 | fields クエリ ≦ 1 回帰テスト | Q-6 |
| AC-4 | 出力不変 | Q-7 |
| AC-5 | スコープ外不変 | Q-4 / Q-8 |
| AC-6 | typecheck / lint / vitest 緑 | Q-1 / Q-2 / Q-3 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-08.md | `as never` 全廃・命名整合の結果（Q-9 入力） |
| 必須 | phase-07.md | カバレッジ実測（緑前提の補強証跡） |
| 必須 | apps/api/src/use-cases/public/list-public-members.ts | Q-9 grep 対象 |
| 必須 | apps/api/src/repository/responseFields.ts | Q-5 grep 対象 |
| 参考 | CLAUDE.md | 不変条件 #5 / vitest 実行ルール（リポジトリルートから） |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質保証主成果物（QA チェックリスト結果 + AC↔QA 対応表 + grep 証跡） |
| メタ | artifacts.json | Phase 9 状態の更新（completed） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | カバレッジ実測を QA の補強証跡として参照 |
| Phase 8 | `as never` 全廃結果を Q-9 で再確認 |
| Phase 10 | QA 全緑・AC 充足を最終レビューの GO 判定入力へ渡す |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] Q-1〜Q-9 が全て PASS で記録されている
- [ ] 不変条件 #5（`git diff --name-only` に apps/web を含まない）を grep で確認している
- [ ] 単数 `listFieldsByResponseId` を削除していないことを grep で確認している（削除を PASS 基準にしない）
- [ ] 出力形状不変（AC-4）が既存 use-case テスト緑で担保されている
- [ ] AC-1〜AC-6 と QA チェック項目の対応表が記録されている
- [ ] typecheck / lint / 対象 vitest が全緑

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が completed
- 成果物が `outputs/phase-09/main.md` に配置済み
- QA チェックリスト（Q-1〜Q-9）の結果と grep 証跡が残っている
- 「ファイル削除」を PASS 基準に含めていない
- artifacts.json の `phases[8].status` が completed

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - QA 全緑・AC-1〜AC-6 充足の証跡
  - apps/web 非接触 / 単数 helper 温存の grep 結果
- ブロック条件:
  - typecheck / lint / 対象 vitest のいずれかが赤
  - `git diff --name-only` に apps/web が含まれる
  - 単数 helper が誤って削除されている
