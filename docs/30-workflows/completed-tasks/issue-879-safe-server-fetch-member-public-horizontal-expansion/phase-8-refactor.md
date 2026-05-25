# Phase 8: リファクタ

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 8 / 13 |

## リファクタ観点

| # | 観点 | 対応 |
|---|---|---|
| 1 | DRY: SafeResult error normalize 関数の重複 | admin 層の `normalizeError` は共通 helper の `normalizeError` に統合済み（Phase 5 S-2） |
| 2 | naming: layer 別 SectionError | 各 layer ファイル名は `SectionError.tsx` で統一。import path で layer を区別する（barrel export 経路は変えない） |
| 3 | css class 共通化 | `.ubm-section-error` を base、`--admin/--public/--member` を modifier として 1 css ファイルに集約 |
| 4 | rethrowOn の型安全 | `ReadonlyArray<new (...args: never[]) => Error>` で declare し、呼び出し側で `[AuthRequiredError]` のように渡せる |
| 5 | code prefix の typo 防止 | `codePrefix` を string union 化する案 → 過剰設計のため見送り。layer 側で const を import するパターンも見送り（YAGNI） |
| 6 | dead code | 既存 admin spec が `normalizeError` 内部関数を import しないことを確認 |

## ヤらないこと

- 既存 `fetchAuthed` / `fetchPublic` の signature 変更
- error code 文字列の admin 既存値変更（`ADMIN_FETCH_*`）
- 新規 primitive の導入

## 検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
git grep -n "ADMIN_FETCH_" apps/web/src apps/web/app  # admin 側で同 code が使われ続けていることを確認
```

## 成果物

- 本ファイル

## 完了条件

- リファクタ観点が明示されている
- YAGNI で見送る選択が記録されている
