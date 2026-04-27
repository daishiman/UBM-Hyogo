# Phase 4: test fixtures 設計

> Phase 4 サブ成果物。fixture の配置と中身を定義。

## 1. 31 項目 fixture（zod test）

配置: `packages/shared/test/fixtures/form-31fields.json`

- valid sample × 5 件（典型的な回答パターン）
- invalid sample × 31 件（各項目 1 個ずつ invalid 化）

### 構造例

```json
{
  "valid": [
    {
      "responseId": "resp_001",
      "responseEmail": "user@example.com",
      "submittedAt": "2026-04-27T00:00:00Z",
      "answers": [
        { "stableKey": "name_kana", "value": "ヤマダ タロウ" },
        { "stableKey": "publicConsent", "value": "yes" },
        ...
      ]
    }
  ],
  "invalid": [
    { "case": "missing-name_kana", "input": { ... } },
    { "case": "invalid-email", "input": { ... } },
    ...
  ]
}
```

## 2. Forms API mock response（Forms client test）

配置: `packages/integrations/google/test/fixtures/`

| ファイル | 用途 |
| --- | --- |
| `forms-get-response.json` | `forms.get` API の典型レスポンス |
| `forms-list-page1.json` | `forms.responses.list` 1 ページ目（nextPageToken あり） |
| `forms-list-page2.json` | 2 ページ目（nextPageToken なし） |
| `forms-error-401.json` | 認証エラー |
| `forms-error-429.json` | rate limit |
| `forms-error-503.json` | サーバエラー |

## 3. consent normalizer fixture

配置: `packages/shared/test/fixtures/consent-cases.json`

| case | 入力 | 期待出力 |
| --- | --- | --- |
| modern | `{ publicConsent: true, rulesConsent: true }` | 同じ |
| legacy snake | `{ public_consent: true, rules_consent: true }` | 新キーに変換 |
| GAS legacy | `{ shareInfo: true, agreeRules: true }` | 新キーに変換 |
| mixed | 旧 + 新 共存 | 新キーで上書き、旧キー drop |
| missing | `{}` | `{ publicConsent: false, rulesConsent: false }` |

## 4. viewmodel fixture

配置: `packages/shared/test/fixtures/viewmodel-{name}.json`

10 種 × valid/invalid 各 1 件。

## 5. boundary lint fixture

配置: 仮想プロジェクト（`scripts/lint-boundaries.mjs` 内に inline）

| ファイル | import 内容 | 期待 |
| --- | --- | --- |
| `apps/web/_test_boundary.tsx` | `import { ... } from "@ubm-hyogo/integrations-google"` | error |
| `apps/api/_test_boundary.ts` | 同上 | OK |

## 6. fixture メンテナンス指針

- spec/01-api-schema.md の項目変更時は **必ず fixture も更新** すること（zod test が落ちて検出される）。
- GAS prototype 由来の値（`companyType` 等）は valid fixture に **入れない**（不変条件 #6）。
- legacy key（`shareInfo` 等）は consent fixture でのみ扱う。
