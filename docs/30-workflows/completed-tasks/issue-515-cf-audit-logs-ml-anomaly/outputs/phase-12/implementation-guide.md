# Implementation Guide: CF Audit Log ML-ready anomaly detection

## Part 1: 中学生レベルの説明

学校の先生が遅刻を見つけるとき、最初は「朝 9 時を過ぎたら遅刻」という単純な決まりで見ます。これはわかりやすい一方で、電車が止まった日や学校行事の日には、いつもと違う判断が必要になります。

Cloudflare の記録監視も同じです。今は「いつもと違う場所から成功した」「失敗が急に増えた」などの決まりで危険を見つけています。今回の改善では、いきなり新しい判断係に任せるのではなく、今の決まりをそのまま使える箱に入れ、あとで新しい判断係と比べられるようにします。

大事なのは、秘密の情報を見せないことです。住所を全部書かず町名だけにするように、IP アドレスやメールアドレスはそのまま保存せず、ぼかした形にして比べます。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| classifier | 判断係 |
| threshold | 決まりの線 |
| ML | たくさんの例から学ぶ判断係 |
| feature | 判断に使うヒント |
| rollback | 前の安全な状態へ戻すこと |

## Part 2: 技術者向け

本サイクルは ML 本番切替ではなく、ML-ready abstraction を実装する。`scripts/cf-audit-log/severity-classifier.ts` は既存 threshold 正本として残し、`scripts/cf-audit-log/classifier/` に薄い interface を追加する。

```ts
export interface Classifier {
  readonly name: "threshold" | "ml";
  readonly version: string;
  classify(input: ClassifierInput): SeverityResult | null;
}
```

`CF_AUDIT_CLASSIFIER` 未指定時は `threshold`。`ml` 指定時も skeleton は threshold fallback し、`reason` に `ml-fallback-to-threshold` を追加する。production ML switch は 90 日 Gate と offline replay 比較後の別 PR で行う。

Redaction boundary:

| レイヤ | raw 値 | 扱い |
| --- | --- | --- |
| D1 `cf_audit_log` | actor IP / UA / raw_json を保持 | privileged source store |
| `RedactedFeatures` | raw 値なし | ML/evaluation/export 用 |
| Issue / logs / evidence | redacted only | secret leakage grep で検証 |

Rollback は forward-safe を原則にする。D1 追加列は残し、`CF_AUDIT_CLASSIFIER=threshold` へ戻す。破壊的 DOWN SQL は user-gated 手動操作のみ。

