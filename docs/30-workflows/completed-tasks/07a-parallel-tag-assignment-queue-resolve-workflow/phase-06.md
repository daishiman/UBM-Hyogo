# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07a-parallel-tag-assignment-queue-resolve-workflow |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

resolve workflow の異常系（401 / 403 / 404 / 409 / 422 / race condition / D1 失敗）を網羅する。

## 実行タスク

1. failure case 表
2. recovery 動作
3. race condition 対策
4. guarded update 失敗時に後続副作用が発生しないことの確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/tag-queue-implementation-runbook.md | throw 起点 |

## failure case 表

| case | trigger | http | 期待動作 | recovery |
| --- | --- | --- | --- | --- |
| 401 | session 切れ | 401 | error response | UI で再 login |
| 403 | non-admin | 403 | forbidden | admin 申請 |
| 404 | 存在しない queueId | 404 | not found | UI で list 再 fetch |
| 409 confirmed→rejected | unidirectional 違反 | 409 | conflict | 新規 queue 作成 |
| 422 unknown tag | tagCodes に未知 code | 422 | 「未知のタグ」error | tag_definitions 確認 |
| 422 deleted member | isDeleted=true への resolve | 422 | 「削除済み会員」error | 復元してから再 resolve |
| 400 reason empty | reject で reason="" | 400 | zod error | reason 入力 |
| 400 tagCodes empty | confirm で tagCodes=[] | 400 | zod error | tag 選択 |
| race condition | 同時 resolve 競合 | 409 | one wins | UI で list 再 fetch |
| guarded update failure | network / quota | 5xx | 再試行 | retry button |
| audit_log INSERT 失敗 | constraint violation | 5xx | queue 更新後の follow-up 失敗として log 調査 | log 調査 |

## race condition 対策

- WHERE 句に `status IN ('queued','reviewing')` を含めることで、同時 UPDATE で 1 件だけが changes=1 になる
- meta.changes === 0 なら 409 を返す

## D1 race / failure boundary

- guarded update の `changes=0` は race lost として 409 を返す
- race lost 時は `member_tags` / `audit_log` を書かない
- follow-up statement 失敗は client に 5xx + retry 推奨を返し、log で調査する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case を AC マトリクスへ |
| Phase 8a | unit / state test で各 case 検証 |

## 多角的チェック観点

| 不変条件 | 異常系担保 | 検証 |
| --- | --- | --- |
| #5 | 全 throw が apps/api 内 | grep |
| #13 | unidirectional 違反は 409 で確実に阻止 | state test |
| audit | guarded update 成功時のみ audit_log を書く | unit test |
| 認可 | 401 / 403 が正しく出る | authz test |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure case 表 | 6 | pending | 11 case |
| 2 | recovery | 6 | pending | 各 case |
| 3 | race condition | 6 | pending | WHERE 句 |
| 4 | D1 race / failure boundary | 6 | pending | guarded update |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure case + recovery |
| メタ | artifacts.json | Phase 6 を completed |

## 完了条件

- [ ] failure case 11 件以上
- [ ] 各 case に recovery
- [ ] race / follow-up failure の対策明記

## タスク100%実行確認

- 全 case に http + recovery
- artifacts.json で phase 6 を completed

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ: failure case を AC マトリクスへ
- ブロック条件: 異常系未網羅なら差し戻し
