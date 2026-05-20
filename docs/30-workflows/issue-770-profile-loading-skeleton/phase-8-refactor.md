# Phase 8: リファクタ

## 結論

本タスクではリファクタを実施しない。

## 理由

- 変更対象は `apps/web/app/profile/loading.tsx`（純粋 Server Component / 12 要素 / 副作用なし）と新規 `.spec.tsx` のみで、抽象化余地が小さい。
- i05/i06/i07 で確立した skeleton pattern を共通 primitive `<LoadingSkeleton>` / hook 化するのは、3 タスクすべての merge 後に行うのが妥当（CONST_007 の今サイクル完了スコープに含めると先送りタスクと矛盾する）。
- 既存の `Card` / `CardContent` primitive を loading 内で採用する案も検討したが、`/profile` 実 page が `Card` を多用していない場合に layout 整合が崩れるため、本タスクでは plain `<main>` 構成を維持する（CLS 整合優先）。

## 後続タスクへの申し送り（参考メモ）

i05/i06/i07 すべての PR merge 後、以下を別 PR で検討する余地がある（本タスク scope 外）:

- `<LoadingSkeleton variant="profile">` 等の primitive 抽出
- `bg-surface-2 motion-safe:animate-pulse` の utility class `.skeleton-block` への集約
- `data-page="*-loading"` 命名の registry 化

これらは将来の DX 改善で必須ではない。スコープを切らずに先送り判断する基準はあくまで「重複が 4 件以上発生したら抽出を検討」とする。
