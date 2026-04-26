# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07b-parallel-schema-diff-alias-assignment-workflow |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

schema alias workflow の異常系（401 / 403 / 404 / 409 / 422 / race condition / D1 失敗 / CPU 制限超過）を網羅する。

## 実行タスク

1. failure case 表
2. recovery 動作
3. race condition 対策（同時 alias 確定）
4. D1 batch 失敗時の rollback 確認
5. back-fill CPU 超過時の retryable 設計

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/schema-alias-implementation-runbook.md | throw 起点 |

## failure case 表

| case | trigger | http | 期待動作 | recovery |
| --- | --- | --- | --- | --- |
| 401 | session 切れ | 401 | error response | UI で再 login |
| 403 | non-admin | 403 | forbidden | admin 申請 |
| 404 question | 存在しない questionId | 404 | not found | UI で diff list 再 fetch |
| 404 queue | queueId 該当なし | 404 | not found | UI で diff list 再 fetch |
| 409 already-assigned | assigned に別 stableKey 再 apply | 409 | conflict | 新 schema_version で再投入 |
| 422 collision | 同 schema_version で stableKey 重複 | 422 | 「stableKey 重複」error | 別 stableKey を選択 |
| 422 invalid stableKey | regex 違反（数字始まり等） | 422 | zod error | 命名規則修正 |
| 422 questionId empty | body validation | 422 | zod error | 入力 |
| race condition | 同時 apply 競合 | 409 | one wins | UI で再 fetch |
| D1 batch failure | network / quota | 5xx | rollback、再試行 | retry button |
| audit_log INSERT 失敗 | constraint violation | 5xx | back-fill 後の audit のみ失敗、stableKey は更新済 | 手動 audit 補完 + 再 apply で idempotent |
| back-fill CPU exhaust | 数万行で 30s 超過 | 5xx (RetryableError) | back-fill 中断、queue は assigned 済 | 同 endpoint 再 apply（idempotent UPDATE で続行） |
| dryRun で書き込み発生 | code regression | テスト失敗 | unit test で検出 | コード修正 |

## race condition 対策

- `WHERE id=? AND status='unresolved'` で同時 UPDATE 1 件のみ成功
- meta.changes === 0 なら 409
- collision pre-check と DB UNIQUE constraint の二段防御

## D1 rollback

- D1 batch は atomic、いずれか失敗で全 rollback
- back-fill ループは batch とは別 atomic、各 batch 単位で commit
- audit_log INSERT が batch 後にあるため、audit 失敗時は手動補完が必要 → Phase 8 で audit-as-batch-step の DRY 候補

## back-fill CPU 超過設計

- CPU 残予算 5s 切ったら RetryableError
- queue は assigned 済（stableKey は更新済）のため、再 apply で idempotent UPDATE が back-fill を続行
- response_fields の WHERE 句 `stableKey != ?` で更新済み行を skip

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case を AC マトリクスへ |
| Phase 8a | unit / state test で各 case 検証 |
| Phase 9 | back-fill CPU 計測でケース C 再評価 |

## 多角的チェック観点

| 不変条件 | 異常系担保 | 検証 |
| --- | --- | --- |
| #1 | エラー時にコード側で stableKey を fallback しない | code review |
| #5 | 全 throw が apps/api 内 | grep |
| #14 | unidirectional 違反は 409 で確実に阻止 | state test |
| audit | tx 失敗時 stableKey も rollback | unit test |
| 認可 | 401 / 403 が正しく出る | authz test |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure case 表 | 6 | pending | 13 case |
| 2 | recovery | 6 | pending | 各 case |
| 3 | race condition | 6 | pending | WHERE 句 + UNIQUE |
| 4 | D1 rollback | 6 | pending | batch atomic |
| 5 | back-fill CPU | 6 | pending | retryable 設計 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure case + recovery |
| メタ | artifacts.json | Phase 6 を completed |

## 完了条件

- [ ] failure case 13 件以上
- [ ] 各 case に recovery
- [ ] race / rollback / CPU 超過の対策明記

## タスク100%実行確認

- 全 case に http + recovery
- artifacts.json で phase 6 を completed

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ: failure case を AC マトリクスへ
- ブロック条件: 異常系未網羅なら差し戻し
