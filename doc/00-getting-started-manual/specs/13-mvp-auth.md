# MVP 認証方針

## MVP で採用するもの

```text
公開ページ
  -> 認証不要

会員ページ
  -> Google OAuth を主導線
  -> Magic Link を補助導線

管理ページ
  -> 会員認証 + admin_users
```

---

## MVP の前提

1. 実フォームは 31 項目・6 セクション
2. formId は `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`
3. メールは Google 自動収集の `responseEmail`
4. consent キーは `publicConsent` / `rulesConsent`
5. 本人更新は Google Form 再回答または edit URL
6. GAS prototype は UI 参照であり、本番認証の正本ではない

---

## MVP ログイン条件

1. `responseEmail` が登録済み
2. `rulesConsent = "consented"`
3. `isDeleted = false`

これを満たさない場合は、別ページに飛ばすのではなく `/login` の状態として扱う。

| 状態 | 対応 |
|------|------|
| 未登録 | Google Form 登録へ誘導 |
| 規約未同意 | 再回答へ誘導 |
| 削除済み | 管理者連絡を案内 |

---

## MVP 公開条件

1. `publicConsent = "consented"`
2. `publishState = "public"`
3. `isDeleted = false`

公開条件とログイン条件は別。

---

## MVP でやらないこと

1. `/no-access` 専用画面依存
2. D1 `profile_overrides` ベースの本人編集
3. GAS `localStorage` をそのまま本番保存方式にすること
4. 会合・参加履歴を Google Form schema に含めること

---

## MVP 受け入れ条件

1. 未ログインでも公開一覧・公開詳細を閲覧できる
2. `responseEmail` 一致の会員だけログインできる
3. `rulesConsent` 未同意ではログインできない
4. マイページから Google Form 更新導線へ行ける
5. 管理者は公開状態、削除、開催日、参加履歴、タグキューを扱える
