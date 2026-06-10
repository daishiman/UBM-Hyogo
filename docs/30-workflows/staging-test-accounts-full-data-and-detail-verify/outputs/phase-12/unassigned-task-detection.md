# Unassigned Task Detection

## Result

新規 unassigned task: **0 件**（current）。スコープ外として明示した項目は本タスクの「含まない」で理由付き除外済みのため baseline として記録し、current の新規起票は行わない。relatedIssue=null かつ current 0 件のため Issue 起票も行わない。

## ソース別確認

| ソース | 確認内容 | 検出 |
| --- | --- | --- |
| 元仕様スコープ外 | index.md「含まない」4 項目（commit/PR/staging apply/スクリーンショットの user-gate / 公開ページへの member/admin 項目追加 / 新規 schema・endpoint / Google Form 実回答の本番 sync 取り込み） | スコープ外として明示済（理由付き除外・CONST_007 で先送りでないことを確認済）。新規起票なし |
| Phase 3 設計レビュー MINOR | build-seed-sql 汎用性 / Lane B ギャップ薄 / 09 必須欠落 / drift の 4 リスク | いずれも対策が spec に織り込み済（汎用性は Phase 5 冒頭確認・Lane B は縮退手順明記・必須は必ず充填・drift は contract spec で強制）。未タスクなし |
| Phase 10 最終レビュー MINOR | 残課題候補 | スコープ外として明示した baseline 2 項目以外に新規未タスクなし |
| コードコメント TODO | 本 wave はコード実装なし（implemented_local_evidence_captured）。新規 TODO コメントを追加していない | なし |

## current / baseline 分離

### current（本タスクで対応・新規起票なし）

- 本タスクで対応すべき項目（catalog profile 拡充 / build-seed-sql 確認 / 生成物再生成 / drift・contract spec / apps/web 表示検証・ギャップ修正 / fixture・adapter spec）はすべて本 wave で **手順仕様化済**（implemented_local_evidence_captured）であり、今回のlocal実装 1 サイクルで完了する。current の新規未タスクは検出されなかった。

### baseline（本タスクのスコープ外・将来別タスク / OOS・別関心）

| 項目 | 分類 | 理由 |
| --- | --- | --- |
| ログイン後 `/profile`（member）/ `/admin`（admin）での member/admin 項目表示の目視確認 | baseline（OOS・別関心） | 本タスクは公開詳細ページ（visibility=public）の表示検証に閉じる。member/admin 項目（birthDate / ubmJoinDate / challenges / consent）はデータ投入するが、表示確認の対象画面は /profile・/admin であり、それらの目視は別画面の別関心。本タスクの「含まない」で除外済 |
| 実 Google Form スプレッドシートデータの本番 sync 取り込み | baseline（別関心） | テストアカウントは form sync を経由せず D1 へ直接 seed する既存方式を踏襲。実スプレッドシートの messy データ取り込みは別タスク（`member-data-source-precedence-and-profile-session-fix` 等が扱う領域）。本タスクの「含まない」で除外済 |

> 上記 2 項目は **本タスクで理由付き除外した既知のスコープ外**であり、Phase 3 / 10 で新たに発見された未対応事項ではない。current の新規 unassigned task として formalize はせず、将来別タスク（baseline）として記録する。

## 関連タスク差分確認（重複起票チェック）

| 関連 | 重複判定 |
| --- | --- |
| `test-accounts-seed-spec` | **基盤再利用**。catalog / build-seed-sql / 適用 CLI / drift guard の正本。本タスクは基盤定義を変更せず profile データを拡充する継続であり、重複起票なし |
| `public-member-detail-survey-fields-richness`（completed-tasks） | **継続**。公開詳細 5 セクション化 + TEST-MEM-01 seed richness を、TEST-MEM-02..10 へ横展開する続き。描画構造は変更せず重複なし |
| `member-data-source-precedence-and-profile-session-fix` | **別関心**。実スプレッドシート/Form の 3 層プレシデンスと /profile セッション修正を扱う別タスク。本タスクのテストアカウント直接 seed とは経路・関心が異なり重複なし |

既存 seed / 公開詳細系とは「基盤再利用」「描画継続」「別関心」で切り分けられ、重複起票はない。本タスクは current の新規未タスクを生まないため Issue 起票は行わない。
