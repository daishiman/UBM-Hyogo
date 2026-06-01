# 実装ガイド — Issue #57 KV/R2 guardrail + executable degrade

## Part 1: やさしい説明（中学生レベル）

クラウドには「倉庫」と「メモ帳」があります。R2 は写真やログをしまっておく**倉庫**、KV は短いメモを貼っておく**付箋（ふせん）**のようなものです。どちらも「無料で使える量」に上限があり、使いすぎるとお金がかかったりサービスが止まったりします。

このプロジェクトでは最近、監査ログ（だれが何をしたかの記録）を R2 の倉庫へ自動で運ぶ仕組みが動き始めました。ところが、説明書（仕様書）には「倉庫はまだ使っていません」と古いまま書かれていて、実際とズレていました。さらに「もし倉庫を使いすぎたら止める方法」が書いてあるのに、その止め方が実際には使えない状態でした。

そこで本タスクでは、(1) 説明書を今の状態に直し、(2) 無料で使える量を書き残し、(3) **スイッチ一つで倉庫への書き込みを一時的に止められる仕組み（kill-switch）** を用意します。スイッチは `AUDIT_COLD_STORAGE_EXPORT_PAUSED` という設定で、`true` にすると倉庫への保存を止め、`false`（既定）なら普通に動きます。

## Part 2: 技術者向け詳細

### 追加する env フラグ

| 名前 | 型 | 既定 | 意味 |
| --- | --- | --- | --- |
| `AUDIT_COLD_STORAGE_EXPORT_PAUSED` | `string`（`"true"`/`"false"`） | `"false"` | `"true"` のとき audit cold-storage export を degrade 停止 |

`.github/workflows/audit-log-cold-storage.yml` が GitHub repository variable `AUDIT_COLD_STORAGE_EXPORT_PAUSED` を script env へ渡す。`apps/api/src/env.ts` は `readonly ALERT_DEDUP_KV: KVNamespace;` を `?:`（optional）へ是正する（wrangler.toml で当該 KV はコメントアウト=未活性のため）。

### 判定セマンティクス（export-to-r2.ts）

```ts
if (opts.paused === true) {
  return { status: "paused", objectKey: null, rowCount: 0, /* ... */ };
}
```

- 厳密一致 `"true"` のみ pause（`"TRUE"`/`"1"` は非 pause）。
- pause は D1 SELECT / manifest write / R2 PUT をすべて short-circuit する。
- pause は dry-run / apply path より優先。

### KV / R2 free-tier limits（実行日に公式 doc 再確認 + 確認日併記）

| サービス | metric | free-tier |
| --- | --- | --- |
| KV | reads / writes / deletes / list / storage / namespaces | 100k/day・1k/day・1k/day・1k/day・1GB/account・1k |
| R2 Standard | storage / Class A / Class B / egress | 10GB-month・1M/month・10M/month・free |

### エラーハンドリング / エッジケース

- フラグ未設定（undefined）→ 通常動作。
- pause 中は D1 / R2 credential の有無に依存せず停止する。
- `ALERT_DEDUP_KV` optional 時は alert delivery を継続し、dedup のみ `dedupPersisted:false` とする。

### 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡: `outputs/phase-10/final-review-result.md` と `outputs/phase-11/main.md`（TC-PAUSE-01 + KV optional regression）。
