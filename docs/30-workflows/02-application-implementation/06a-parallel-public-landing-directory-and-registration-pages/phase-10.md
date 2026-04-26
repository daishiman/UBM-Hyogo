# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-landing-directory-and-registration-pages |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-26 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke) |
| 状態 | pending |

## 目的

上流 Wave (00, 04a, 05a, 05b) と下流 (08a, 08b) の AC が満たされた前提で、本タスク AC-1〜AC-12 の整合性を集計し GO/NO-GO を判定する。

## 実行タスク

1. 上流 wave AC 確認
2. 自タスク AC 集計
3. blocker / minor 一覧
4. GO/NO-GO 判定
5. 残課題引き継ぎ

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/ac-matrix.md | AC マトリクス |
| 必須 | outputs/phase-09/main.md | 品質チェック結果 |
| 必須 | doc/02-application-implementation/README.md | 不変条件と Wave 依存 |

## 実行手順

### ステップ 1: 上流 wave AC 確認

| 上流タスク | 必須出力 | 確認方法 | 状態 |
| --- | --- | --- | --- |
| 04a | `GET /public/{stats,members,members/:id,form-preview}` | OpenAPI 確認 + 08a contract test 結果 | upstream の phase-13 完了時に確定 |
| 05a | `/login` Google OAuth 動作 | session API が `/register` から参照可能 | 上流確定後 GO |
| 05b | `AuthGateState` resolver | 公開層からは未使用だが `/register` 完了後の遷移先で参照 | 上流確定後 GO |
| 00 | UI primitives 15 種 + tones.ts + view model 型 | `@ubm/ui` 名前空間が import 可能 | 上流確定後 GO |

### ステップ 2: 自タスク AC 集計

| AC | 内容 | 状態 | 根拠 |
| --- | --- | --- | --- |
| AC-1 | 4 ルート 200 / 404 分岐 | green 見込み | E-01〜E-07, C-03 |
| AC-2 | URL ベース遷移成立 | green 見込み | E-01〜E-07, layout |
| AC-3 | 6 検索 query が URL に表現 + reload | green 見込み | U-01, U-04, E-03 |
| AC-4 | density は `comfy/dense/list` のみ | green 見込み | U-03, S-03 |
| AC-5 | tag は repeated query で AND | green 見込み | U-04 |
| AC-6 | 不明 query は初期値フォールバック | green 見込み | U-02, U-03 |
| AC-7 | window.UBM 0 件 | green | grep / lint |
| AC-8 | stableKey 直書き 0 件 | green | grep / lint |
| AC-9 | localStorage 正本 0 件 | green | grep / lint |
| AC-10 | `/members/[id]` public field のみ | green 見込み | C-04, F-09〜F-12 |
| AC-11 | `/register` responderUrl + form-preview | green 見込み | C-05, S-05 |
| AC-12 | 09-ui-ux 検証マトリクス | conditional | E-01〜E-07 desktop / mobile |

### ステップ 3: blocker / minor 一覧

| 種別 | ID | 内容 | 影響 | 解消条件 |
| --- | --- | --- | --- | --- |
| blocker | B-01 | 04a が pending | API 呼び出し不能 | 04a phase-13 完了 |
| blocker | B-02 | 00 が pending | UI primitives 不足 | 00 phase-13 完了 |
| minor | M-01 | tag が 5 件 truncate のとき表示 UI | UX 軽微 | EmptyState extension |
| minor | M-02 | mobile での FilterBar 折り返し | UX 軽微 | 09-ui-ux で対応 |

### ステップ 4: GO/NO-GO 判定

| 判定軸 | 状態 | 結論 |
| --- | --- | --- |
| AC-1〜AC-12 | conditional green（上流前提） | OK |
| 不変条件 #1, #5, #6, #8, #9, #10 | OK | OK |
| 無料枠 | OK | OK |
| secret hygiene | OK | OK |
| blocker | B-01 / B-02 | 上流確定で解消 |

総合: 上流 (00, 04a) 完了を条件とした GO

### ステップ 5: 残課題引き継ぎ

- M-01, M-02 は phase-12 の `unassigned-task-detection.md` に記録
- 04a の hide 仕様変更があれば再 review

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | manual smoke の前提承認 |
| Phase 12 | 残課題ログを反映 |
| Phase 13 | PR description の根拠 |

## 多角的チェック観点

- 不変条件 #1: AC-8 が green を確認
- 不変条件 #5: AC-1 / AC-10 が green を確認
- 不変条件 #6: AC-7 が green を確認
- 不変条件 #8: AC-3, AC-9 が green を確認
- 不変条件 #9: `/no-access` 不存在を再確認
- 不変条件 #10: 無料枠 4 項目 OK 再確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 AC 確認 | 10 | pending | 4 上流 |
| 2 | 自タスク AC 集計 | 10 | pending | 12 行 |
| 3 | blocker / minor | 10 | pending | B-01/B-02, M-01/M-02 |
| 4 | GO/NO-GO | 10 | pending | conditional GO |
| 5 | 残課題引き継ぎ | 10 | pending | phase-12 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | 上流 AC + 集計 + 判定 |
| メタ | artifacts.json | phase 10 status |

## 完了条件

- [ ] 自タスク AC 12 件すべて status 確定
- [ ] blocker 一覧と解消条件あり
- [ ] GO/NO-GO 結論明記

## タスク100%実行確認【必須】

- 全 5 サブタスクが completed
- outputs/phase-10/main.md 配置
- 不変条件 #1, #5, #6, #8, #9, #10 すべて OK
- 次 Phase へ blocker 解消条件を渡す

## 次 Phase

- 次: 11 (手動 smoke)
- 引き継ぎ事項: GO 条件下で smoke を実施
- ブロック条件: blocker 未解消なら進まない
