# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-identity-status-and-response-repository |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 6 (異常系検証) |
| 下流 | Phase 8 (DRY 化) |
| 状態 | pending |

## 目的

Phase 1 の AC × Phase 4 の verify suite × Phase 5 の実装 step × Phase 6 の異常系を 1 枚の matrix で対応付け、漏れと重複を排除する。

## AC matrix

| AC | 内容 | Phase 4 verify | Phase 5 実装 step | Phase 6 failure case | 検証コマンド |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 8 repo の unit test pass | unit test 9 ファイル | Step 4（8 repo 実装） | F-5, F-6 | `pnpm test repository` |
| AC-2 | 3 view 組み立て可 | builder.test.ts | Step 5（builder） | A-1〜A-5 | `pnpm test repository builder` |
| AC-3 | `MemberId !== ResponseId` 型エラー | brand.test.ts | Step 2（brand.ts） | E-1, E-2 | `tsc --noEmit __tests__/brand.test.ts` |
| AC-4 | deleted / consent != consented を public から除外 | builder boundary section | Step 5 builder の if 句 | A-1, A-2 | `pnpm test repository builder.boundary` |
| AC-5 | admin field を public/member から除外 | builder visibility section | Step 5 builder | A-5 | `pnpm test repository builder.visibility` |
| AC-6 | `memberTags` write API 不在 | memberTags.test.ts type test | Step 4 memberTags.ts | A-7（同型） | `tsc --noEmit __tests__/memberTags.test.ts` |
| AC-7 | N+1 防止 | builder.test.ts query count | Step 5 builder で `listTagsByMemberIds` | E-3 | `pnpm test repository builder.n-plus-one` |
| AC-8 | 02b/02c 相互 import ゼロ | depcruise CI | Step 7 dep-cruiser config | A-8 | `pnpm depcruise apps/api` |

## 不変条件 × AC マトリクス

| 不変条件 | 関連 AC | このタスクでの守り方 |
| --- | --- | --- |
| #4 本人本文 = Form 再回答 | AC-2, AC-6 同型 | responses.ts に partial update API なし |
| #5 D1 boundary | AC-8 | dep-cruiser で `apps/web` → `apps/api/repository` を error |
| #7 `responseId !== memberId` | AC-3 | brand.ts による branded type |
| #11 admin 本文編集禁止 | AC-2 | builder の admin 用は `setPublishState` / `setDeleted` のみ |
| #12 adminNotes 分離 | AC-2, AC-5 | builder 戻り値型 + 引数受取 |
| #10 無料枠 | AC-7 | N+1 排除 + index 利用 |

## トレース完全性チェック

| Phase | 件数 | AC matrix トレース完了率 |
| --- | --- | --- |
| Phase 1 AC | 8 | 8/8 = 100% |
| Phase 4 verify suite | 9 unit + 4 contract + 7 boundary + 4 type = 24 test target | 24/24 → 上記 8 AC に集約 |
| Phase 5 実装 step | 8 | 8/8 |
| Phase 6 failure case | 19 (F-6 + A-8 + E-5) | 19/19 |

漏れ確認:
- AC が verify suite を持たない → なし
- verify suite が AC を持たない → なし
- 実装 step が AC に紐付かない → なし
- failure case が verify suite で検証されない → なし

## 実行タスク

1. AC matrix 表を `outputs/phase-07/ac-matrix.md` に作成
2. 不変条件 × AC マトリクスを main.md に作成
3. トレース完全性チェック表を main.md に作成
4. 漏れ件数を 0 にする（漏れがあれば Phase 1〜6 に戻る）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 1 outputs/phase-01/main.md | AC 一覧 |
| 必須 | Phase 4 outputs/phase-04/verify-suite.md | verify 一覧 |
| 必須 | Phase 5 outputs/phase-05/runbook.md | 実装 step |
| 必須 | Phase 6 outputs/phase-06/failure-cases.md | failure case |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | matrix から DRY 化候補（重複 verify）を抽出 |
| Phase 10 | GO/NO-GO 判定の根拠 |
| 08a | repository contract test の入力 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| AC 漏れ | — | 8 AC が verify suite と 1:1 対応 |
| 不変条件 | #4 #5 #7 #11 #12 #10 | 6 件全てが少なくとも 1 AC を持つ |
| トレース | — | 漏れ件数 0 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix 表 | 7 | pending | 8 AC × 4 軸 |
| 2 | 不変条件 × AC | 7 | pending | 6 不変条件 |
| 3 | トレース完全性 | 7 | pending | 漏れ 0 |
| 4 | 漏れ修正 | 7 | pending | 条件を満たす場合は Phase 1〜6 戻し |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | 不変条件×AC + トレース完全性 |
| ドキュメント | outputs/phase-07/ac-matrix.md | 8 AC × 4 軸の matrix |

## 完了条件

- [ ] AC matrix が 8 AC × 4 軸で完成
- [ ] 不変条件 6 件全てが AC にマップ
- [ ] トレース完全性が 100%

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜4 が completed
- [ ] outputs/phase-07/{main,ac-matrix}.md が配置済み
- [ ] 漏れ件数 0
- [ ] artifacts.json の Phase 7 を completed に更新

## 次 Phase

- 次: Phase 8 (DRY 化)
- 引き継ぎ事項: AC matrix
- ブロック条件: 漏れ件数 > 0 なら Phase 1 / 4 / 5 / 6 に戻る
