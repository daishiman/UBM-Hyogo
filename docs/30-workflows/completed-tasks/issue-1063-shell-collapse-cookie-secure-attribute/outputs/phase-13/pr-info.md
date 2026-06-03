# PR Info — issue-1063

PR not created（user-gated）。

| 項目 | 値 |
|------|----|
| base | `dev` |
| head | `feat/issue-1063-shell-collapse-cookie-secure-attribute` |
| title 案 | `feat(web): issue-1063 shell collapse cookie に production 限定で Secure 属性を付与` |

Reason: Phase 13 の外部操作（commit / push / PR）は task policy により user-gated。local implementation と focused Vitest は完了済みだが、user 承認がないため PR は作成しない。本ファイルは境界を文書化する必須プレースホルダ。

Suggested PR body bullets:

- shell collapse 永続化 cookie（`ubm_shell_collapsed`）に production(HTTPS) 限定で `; Secure` を付与する。
- 環境判定は client runtime（`browserDocument()?.location.protocol === "https:"`）で行い、`process.env.*` を `apps/web/src` 配下へ増やさない。
- localhost(http) では `Secure` 無しで発行し collapse 永続化が回帰しない。cookie 名・value・`Path`・`Max-Age`・`SameSite` は不変・`HttpOnly` 無し。
- serializer 戻り値文字列を検証する focused Vitest（TC-1〜TC-6）を追加。`Secure` は read 値に現れないため screenshot ではなく文字列検証で証明する。
