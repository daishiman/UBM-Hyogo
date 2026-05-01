# Phase 7: AC マトリクス / テストカバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07a-02-search-tags-resolve-contract-followup |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス / テストカバレッジ確認 |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-01 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | completed |
| Source Issue | #297 |

---

## 目的

Phase 1 で確定した AC-1〜AC-7 と、Phase 4 のテスト戦略 / Phase 5 の実装ファイル / Phase 6 の異常系 fixture を
1 つの「AC × 検証手段 × 実装ファイル」マトリクスに集約し、未カバー領域を Phase 8 以降に持ち越す責務を担う。
本 Phase はコードを書かず、AC ↔ 検証 ↔ 実装の追従関係を表で固定する。

---

## 実行タスク

1. AC-1〜AC-7 を行に、検証手段（unit / contract / E2E / manual / static）と実装ファイルを列に並べた AC マトリクスを作成
2. 各 AC の達成度を「達成 / 部分達成 / 未達」で判定し、未達は Phase 8 へ持ち越し対象としてマーク
3. 既存 contract test 100% green 維持の確認手順と、新規 4 ケース追加（confirmed / rejected / validation / idempotent）後の line / branch coverage 実測値を記録
4. coverage gap（未カバーの分岐 / 未テストのファイル）を列挙し Phase 8 / 9 へ持ち越し
5. Phase 6 で生成した 422 / 400 / 409 異常系 fixture が AC マトリクス上で対応する AC に紐づいているか cross-check

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-01.md | AC-1〜AC-7 の定義 |
| 必須 | phase-02.md | 追従対象表（4 層 6 ファイル） |
| 必須 | phase-03.md | 採用案 A（shared zod schema） |
| 必須 | outputs/phase-04/ | contract test ケース表 |
| 必須 | outputs/phase-05/ | 実装ファイル一覧 |
| 必須 | outputs/phase-06/ | 異常系 fixture 一覧 |
| 参考 | apps/api/test/contract/ | 既存 contract test の green 状態 |

---

## AC マトリクス

| AC | 内容 | 検証手段 | 主実装ファイル | 検証ファイル | 判定 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | `resolveTagQueue` の TypeScript 型が discriminated union に一致 | static (typecheck) | `apps/web/src/lib/api/admin.ts` / `packages/shared/src/schemas/admin/tag-queue-resolve.ts` | `pnpm typecheck` (apps/web) | 達成 |
| AC-2 | 08a contract test に `confirmed` 成功ケース | contract | `apps/api/src/routes/admin/tags/queue/resolve.ts` | `apps/api/test/contract/admin-tags-queue-resolve.test.ts` (`it("returns 200 on confirmed")`) | 達成 |
| AC-3 | 08a contract test に `rejected` 成功ケース | contract | 同上 | 同上 (`it("returns 200 on rejected")`) | 達成 |
| AC-4 | 08a contract test に validation error（400: action 欠落 / tagCodes 空 / reason 空）ケース | contract | 同上 | 同上 (`it("returns 400 when action missing")` / `it("returns 400 when tagCodes empty")` / `it("returns 400 when reason empty")`) | 達成 |
| AC-5 | 08a contract test に同一 payload 再投入 idempotent（200 + `idempotent: true`）ケース | contract | 同上 | 同上 (`it("returns idempotent:true on replay")`) | 達成 |
| AC-6 | 12-search-tags.md と implementation-guide.md の body shape が文字列レベルで一致 | static (grep diff) | `docs/00-getting-started-manual/specs/12-search-tags.md` / `docs/30-workflows/completed-tasks/07a-.../phase-12/implementation-guide.md` | Phase 12 の docs 同期スクリプト or grep diff | 部分達成 |
| AC-7 | 06c 由来の旧契約記述（空 body）が残存していない | static (grep) | 全 docs ツリー | `rg "resolveTagQueue\(queueId\)\s*\)" docs/` | 部分達成 |

> 「部分達成」は実装は完了するが、Phase 12 の docs 同期で最終確認が必要なものを指す。

---

## 検証手段カバレッジ表

| 検証手段 | 対象 AC | 実行コマンド | 期待値 |
| --- | --- | --- | --- |
| typecheck | AC-1 | `mise exec -- pnpm typecheck` | エラー 0 件 |
| contract test | AC-2 / AC-3 / AC-4 / AC-5 | `mise exec -- pnpm --filter @repo/api test -- contract/admin-tags-queue-resolve` | 既存 + 新規 4 ケース all green |
| static grep | AC-6 / AC-7 | `rg` で旧契約パターン検索 | hit 数 0 |
| coverage 実測 | （横断） | `mise exec -- pnpm --filter @repo/api test -- --coverage` | line / branch ともに既存 baseline 維持 |

---

## Coverage 目標と実測

| 指標 | baseline（07a 完了時） | 本タスク完了時目標 | 持ち越し条件 |
| --- | --- | --- | --- |
| 既存 contract test green 率 | 100% | 100% 維持 | 1 件でも red → Phase 8 戻り |
| 新規 contract ケース数 | 0 | +4（confirmed / rejected / validation / idempotent）以上 | 不足は Phase 8 で追加 |
| line coverage（admin/tags/queue/resolve） | baseline X% | baseline 以上を維持 | 低下時は Phase 8 で補強 |
| branch coverage（discriminated union 分岐） | baseline Y% | confirmed / rejected の両 branch hit | どちらか未到達なら Phase 8 |

> baseline X% / Y% は Phase 5 完了時に実測して埋める。

---

## 未カバー領域 / 持ち越し

| # | 領域 | 持ち越し先 Phase | 理由 |
| --- | --- | --- | --- |
| U-1 | 422 unknown_tag_code（tagCodes に存在しない code） | Phase 8（fixture 集約）+ Phase 9（再実行） | Phase 6 で fixture 生成済、AC には未列挙のため AC マトリクス外 |
| U-2 | 409 conflict（別 payload での再投入） | Phase 8 / 9 | 同上 |
| U-3 | 12-search-tags.md ↔ implementation-guide.md 文字列一致（AC-6） | Phase 12 | docs 同期は Phase 12 の責務 |
| U-4 | 06c 旧契約 doc の最終 grep 0 件確認（AC-7） | Phase 12 | docs 同期で確定 |
| U-5 | apps/web 側の E2E（実 client から叩く）| 後続 UT-07A-03（staging smoke）| 本タスク scope 外 |

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | 未カバー U-1 / U-2 を fixture 集約と命名統一の対象として引き継ぐ |
| Phase 9 | coverage 実測値を最終 quality gate に組み込む |
| Phase 10 | AC マトリクスの「部分達成」を GO / NO-GO 判定の入力に使用 |
| Phase 12 | AC-6 / AC-7 の docs 同期チェックリストを引き継ぐ |

---

## 多角的チェック観点

- 不変条件 #5: AC マトリクスのいずれも apps/web から D1 に直接触れる経路を要求していないことを再確認
- 不変条件 #11: resolve API の責務（タグ確定 / 拒否のみ）を超える AC が紛れていないことを cross-check
- DRY: AC マトリクスは Phase 2 追従対象表とノードを共有する（重複定義しない）
- YAGNI: AC-1〜AC-7 以外の AC を本 Phase で勝手に増やさない（増えるなら Phase 1 へ戻る）

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC マトリクス作成（AC-1〜AC-7） | 7 | pending | 検証手段 × 実装ファイルの 2 軸 |
| 2 | 検証手段カバレッジ表作成 | 7 | pending | typecheck / contract / static / coverage |
| 3 | coverage baseline / 実測の記録 | 7 | pending | Phase 5 実測値を引用 |
| 4 | 未カバー領域の Phase 8 / 9 / 12 持ち越し | 7 | pending | U-1〜U-5 |
| 5 | 異常系 fixture と AC の cross-check | 7 | pending | Phase 6 出力との突合 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | AC マトリクス / 検証手段カバレッジ表 / coverage 実測 / 未カバー領域 |
| メタ | artifacts.json | Phase 7 を completed に更新 |

---

## 完了条件

- [ ] AC マトリクスが AC-1〜AC-7 全行を網羅し、各行に検証手段と実装ファイルが記入されている
- [ ] 検証手段カバレッジ表に typecheck / contract / static / coverage が含まれる
- [ ] coverage baseline と実測の差分が記録されている
- [ ] 未カバー領域 U-1〜U-5 が Phase 8 / 9 / 12 のいずれかに持ち越し済
- [ ] Phase 6 の異常系 fixture が AC マトリクス外の領域として明示されている

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-07/main.md` が指定パスに配置済み
- 完了条件 5 件すべてにチェック
- 「未達」AC が 1 件でもあれば Phase 8 への戻り経路を明記
- artifacts.json の phase 7 を completed に更新

---

## 次 Phase

- 次: 8 (DRY 化)
- 引き継ぎ事項: AC マトリクス / 未カバー U-1〜U-5 / coverage gap / 部分達成 AC のクロージング条件
- ブロック条件: AC マトリクスに未達 AC が残る場合は Phase 8 で先行解消する
