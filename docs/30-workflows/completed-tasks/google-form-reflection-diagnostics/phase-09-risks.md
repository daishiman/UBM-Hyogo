---
phase: 9
title: リスク — 機密露出 / 個人情報範囲 / staging 副作用
workflow_id: google-form-reflection-diagnostics
status: spec_created
---

# Phase 9 — リスク評価

[実装区分: 実装仕様書]

## 1. リスク一覧

| ID | リスク | 影響 | 軽減策 |
| --- | --- | --- | --- |
| R-01 | diagnostics endpoint から secrets 実値が漏洩 | 致命的 | response に boolean readiness のみ含める。contract spec C-FP-05 で string 一致検査 |
| R-02 | 未認証 / 非 admin からのアクセス | 高 | 既存 admin middleware を再利用、contract spec C-FP-07 / C-FP-08 で 401/403 を assert |
| R-03 | 1 メンバー診断 endpoint で個人情報が広範に露出 | 中 | response は H2-H4 判定に必要な最小フィールドのみ。氏名 / 連絡先 / 機微属性は含めない (missingFieldKeys は **key 名のみ**、値は含めない) |
| R-04 | D1 SELECT 集計コストで latency 悪化 | 低 | 直近 10 件など limit を厳格に置く。count 系は単一 query で済ませる |
| R-05 | diagnostics 実装が ingest job の挙動を変える | 致命的 | **read-only SELECT のみ**。書き込み禁止 (D-08 と code review で担保) |
| R-06 | 観察データから誤った Spec-B を起票し的外れ修復に走る | 中 | Phase 8 §3 の起票条件を満たした候補のみを user に提示。`unassigned-task-detection.md` でトリガ条件を明示 |
| R-07 | diagnostics endpoint に対する DoS | 低 | admin only かつ低頻度想定。レート制限は本仕様では追加せず、staging 監視のみ |
| R-08 | zod schema drift (api / web 間) | 中 | contract spec で同一 shape を assert。web 側 types.ts はファイル単体で完結し import 依存を最小化 |
| R-09 | Playwright env-gated smoke が CI で誤実行される | 低 | `STAGING_SMOKE=1` env gating + Playwright `testIgnore` 設定で staging credentials 無い環境では skip |

## 2. 観察データの個人情報範囲

| endpoint | 含まれる個人情報 | 含めない |
| --- | --- | --- |
| `/admin/diagnostics/forms-pipeline` | 集計値のみ (件数 / boolean) | 個人を特定する fields は一切含まない |
| `/admin/diagnostics/member/:id` | memberId / consent boolean / publishState boolean / missingFieldKeys (キー名のみ) | 氏名・email・電話・所属・自由記述・タグ等の **値**。matchedFormResponseId のみ string (内部 ID) |

## 3. secrets readiness の boolean-only 不変条件

実装側で以下のような形のみ許容:

```ts
secretsReadiness: {
  googleServiceAccountEmail: typeof env.GOOGLE_SERVICE_ACCOUNT_EMAIL === 'string' && env.GOOGLE_SERVICE_ACCOUNT_EMAIL.length > 0,
  googlePrivateKey: typeof env.GOOGLE_PRIVATE_KEY === 'string' && env.GOOGLE_PRIVATE_KEY.length > 0,
  googleFormId: typeof env.GOOGLE_FORM_ID === 'string' && env.GOOGLE_FORM_ID.length > 0,
  // ...
}
```

以下は **禁止**:

- 値の length / first-char / last-4 / hash / md5 / base64 を含める
- 「投入されているか」を示すために bool 以外を返す
- error message 内に secrets 実値を含める (catch 時の `String(error)` には secrets を絶対に乗せない)

## 4. rollback

本 Spec-A の実装は read-only SELECT のみで副作用がないため、PR revert で完全 rollback 可能。D1 schema 変更なし。
