# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 6 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

5 画面と mutation で起こりうる異常系（401 / 403 / 404 / 422 / 5xx / sync 失敗 / consent 撤回 / 削除済み）を網羅し、UI 側の表示と recovery 動作を確定する。

## 実行タスク

1. failure case 表の作成（status × 画面 × 表示）
2. recovery 動作の定義（再 fetch / redirect / Toast）
3. 削除済み会員 / consent 撤回 / unresolved schema の境界ケース
4. Forms 同期失敗時の `/admin/schema` および `/admin` バナー
5. 不変条件 violation を起こしうる UI シーケンスのリスト

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/admin-implementation-runbook.md | 失敗起点の特定 |
| 必須 | doc/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md | 上流 API エラー |

## 実行手順

### ステップ 1: status code × 画面
- 401 → どの画面でも `/login?next=...` redirect、Toast「セッションが切れました」
- 403 → forbidden 画面（admin gate 失敗）
- 404 → 該当画面で空状態 + 一覧へ戻る導線
- 422 → form error（attendance 重複時等）
- 5xx → Toast「一時的なエラー」+ retry button

### ステップ 2: 境界ケース
- 削除済み会員を `/admin/members` で開く → drawer に「削除済み」バッジ + 復元 button のみ表示、status 切替は disabled
- consent 撤回後の member → publishState=private 強制、Switch を disabled
- unresolved schema が残っている状態で `/admin/sync/responses` を実行 → `/admin/schema` 誘導バナー

### ステップ 3: Forms 同期失敗
- `/admin` dashboard の sync badge が `failed` のとき、最終成功時刻と失敗詳細リンクを表示
- 再同期ボタンで `POST /admin/sync/schema` または `POST /admin/sync/responses` を再実行

### ステップ 4: 不変条件 violation シーケンス
- ドロワーで誤って tag を編集できそうな UI（drag&drop 等）→ 出さない
- members 一覧で schema unresolved の member に新規 status patch → 422 で reject
- attendance に削除済み member ID を URL 直叩き → 404

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case を AC マトリクスへ |
| Phase 8 | DRY 化（共通 ErrorBoundary） |
| Phase 8b | E2E でこれらシナリオを assert |

## 多角的チェック観点

| 不変条件 | 異常系での担保 | 検証 |
| --- | --- | --- |
| #11 | 削除済み member でも本文編集 form は出ない | unit |
| #13 | 全 error 状態でも tag 直接編集 form は出ない | unit |
| #14 | unresolved schema は `/admin/schema` バナーで誘導 | E2E |
| #15 | attendance 重複 422 を Toast で明示 | E2E |
| 認可境界 | 401 / 403 の redirect が必ず動く | E2E |

## failure case 表

| case | trigger | 期待表示 | recovery |
| --- | --- | --- | --- |
| 401 unauthorized | session 切れ | Toast + redirect `/login?next=...` | 再 login |
| 403 forbidden | non-admin | forbidden 画面 | admin に申請 |
| 404 not found | 存在しない memberId | 空状態 + 戻る | URL 修正 |
| 422 validation | attendance 重複 | form error + Toast | 重複削除 |
| 422 validation | publishState=public で consent 未取得 | 「掲載同意が必要」エラー | Form 再回答待ち |
| 5xx server | API 障害 | Toast + retry | 時間置く |
| forms sync failed | schema sync 失敗 | dashboard sync badge `failed` | `/admin/schema` で再実行 |
| forms sync failed | response sync 失敗 | dashboard sync badge `failed` | `/admin` で再実行 |
| consent 撤回 | publicConsent=declined | publishState 強制 private、Switch disabled | 本人 Form 再回答 |
| 削除済み | isDeleted=true | drawer に「削除済み」バッジ、status disabled、復元 button のみ | 復元 |
| schema unresolved | stableKey 未割当 question あり | dashboard 警告バッジ + `/admin/schema` 誘導 | alias 割当 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure case 表 | 6 | pending | 11 cases 以上 |
| 2 | recovery 動作 | 6 | pending | 各 case |
| 3 | 境界ケース | 6 | pending | 削除済み / consent / schema |
| 4 | sync 失敗 UI | 6 | pending | dashboard badge |
| 5 | violation シーケンス | 6 | pending | UI 防御の確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure case 表 + recovery |
| メタ | artifacts.json | Phase 6 を completed |

## 完了条件

- [ ] failure case 表が 11 件以上記載
- [ ] 各 case に recovery 動作
- [ ] 境界ケース（削除済み / consent / schema）が網羅
- [ ] 不変条件 violation を起こす UI シーケンスがリスト化
- [ ] 全 case が Phase 8b (E2E) で test 可能な assertion 形式

## タスク100%実行確認

- 全 case が table に記載
- recovery が画面別に書かれる
- artifacts.json で phase 6 を completed

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ: failure case を AC マトリクスの「異常系」列に
- ブロック条件: 境界ケース未網羅なら差し戻し
