# Phase 9: パフォーマンス検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 種別 | パフォーマンス |
| 入力 | Phase 4 実装 |
| 出力 | パフォーマンス影響評価ノート |

## 目的

本タスクは mechanical な class 名置換 + 1 class 定義削除のみで、ランタイム挙動・bundle サイズ・呼び出し回数のいずれにも実質的影響を与えないことを宣言する。

## 評価項目

| 項目 | 影響 | 根拠 |
| --- | --- | --- |
| ランタイム CPU | 変化なし | `instanceof` 判定対象クラス名のみ変更。実行回数・分岐構造同一 |
| メモリ | 微減 | `AdminMutationError` クラス定義（プロトタイプ + コンストラクタ）が 1 つ消える |
| Bundle size | 微減 | 削除されるクラス定義（line 28-36, 約 200 bytes）分減少 |
| ネットワーク | 変化なし | API 呼び出し・error response 変更なし |
| レンダリング | 変化なし | toast 文言・JSX 構造変更なし |

## 検証コマンド（任意）

```bash
# bundle size 差分の確認（任意・evidence 不要）
mise exec -- pnpm -F "@ubm-hyogo/web" build 2>&1 | tail -20
```

## 完了条件


- [x] Phase 9 の完了条件を満たす証跡が保存されている。
- 上記評価表を spec の正本として確定
- パフォーマンス回帰が想定されないことを明文化

## 参照資料

- source spec §リスク（パフォーマンス影響欄なし → no-op が妥当）
- Phase 4 実装結果

## 実行タスク

- Phase 9 の本文に記載済みの手順を実行し、完了証跡を該当 outputs に保存する。

## 成果物

- Phase 9 の検証結果と関連ログ。

## 統合テスト連携

- NON_VISUAL のため画面証跡ではなく、focused Vitest / typecheck / lint / grep gate のログで連携確認する。
