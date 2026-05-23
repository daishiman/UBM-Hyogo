# Phase 7 成果物: カバレッジ

unit test 4 cases で以下を網羅:

| 行 | 経路 | テスト |
|---|---|---|
| profile 正常取得→ImageResponse 構築（occupation 有） | happy path | TC-1 |
| profile 正常取得→ImageResponse 構築（occupation null） | optional branch | TC-2 |
| catch 内 `FetchPublicNotFoundError` 判定 → `notFound()` | 404 path | TC-3 |
| catch 内 非 404 error rethrow | error path | TC-4 |

focused unit test 4 cases で occupation 有 / null の両 path を網羅。coverage は focused run で確認する。
