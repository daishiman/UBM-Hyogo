# Phase 6: テスト拡充（異常系・回帰 guard）

## 追加ケース

| ID | 検証内容 | 期待 |
| --- | --- | --- |
| TC-6 | `reportEndpoint` が空文字 `""` のとき report 系を出力しない | falsy 判定で未出力（`""` は `cfg.reportEndpoint ?` で false） |
| TC-7 | enforce モード + reportEndpoint 設定時も Reporting-Endpoints / Report-To / report-to を出力 | `Content-Security-Policy`（enforce）に report-to 含む + Reporting-Endpoints / Report-To ヘッダ存在 |
| TC-8 | 既存 7 ケースの無回帰（reportEndpoint 無し fixture） | 既存 assert すべて green（後方互換） |
| TC-9 | グループ名 drift guard | CSP 内 `report-to` トークンと Reporting-Endpoints / Report-To のグループ名が同一文字列であることを 1 つの定数比較で保証 |

## TC-9 設計（drift 防止）

```ts
it("never drifts group name between CSP and Reporting-Endpoints", () => {
  const headers = buildSecurityHeaders(reportCfg);
  const csp = headers.get("Content-Security-Policy-Report-Only")!;
  const re = headers.get("Reporting-Endpoints")!;
  const group = re.split("=")[0]; // "csp-endpoint"
  expect(csp).toContain(`report-to ${group}`);
  expect(JSON.parse(headers.get("Report-To")!).group).toBe(group);
});
```

`CSP_REPORT_GROUP` という単一定数を両方で使うため、定数を変えても両者が同時に追従し drift しない。テストはこの不変を明示的に固定する。

## 異常系の方針

- 空文字・undefined はいずれも「report 系未出力」に倒す（fail-soft）。例外は投げない。
- 不正 URL は env.ts の `z.string().url()` で parse 時に弾く（getPublicEnv が throw → error boundary が補足）。security-headers.ts 側では URL バリデーションを二重化しない。

## 次フェーズ引き継ぎ

Phase 7 で AC × テスト × evidence のトレースマトリクスを作る。
