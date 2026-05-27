# Link / Route Checklist

| 表示位置                 | href      | 想定状態                            | 結果 |
| ------------------------ | --------- | ----------------------------------- | ---- |
| nav (`/` 等公開層、auth) | `/`       | ホーム                              | 既存 |
| nav (公開層、auth)       | `/members`| メンバー一覧                        | 既存 |
| nav (公開層、auth)       | `/register`| 登録                               | 既存 |
| nav (公開層、auth のみ)  | `/profile`| マイページ（本タスクで追加）        | NEW  |
| CTA 右上 (auth)          | `/profile`| マイページ（`data-state="authenticated"`） | NEW  |
| CTA 右上 (anon)          | `/login`  | ログイン（`data-state="anonymous"`）| 既存 |
| brand                    | `/`       | ホーム                              | 既存 |

全 link は既存 route。新規 endpoint / 新規 segment の追加なし。
