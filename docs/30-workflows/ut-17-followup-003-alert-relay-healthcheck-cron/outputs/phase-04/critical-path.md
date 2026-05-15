# Phase 4 成果物: クリティカルパス

[実装区分: 実装仕様書]

UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) の T1〜T9 実行順序を、
クリティカルパスとして可視化する。

---

## 実行順序図

```
[前提整備]              [実装]                   [検証]              [反映]
T1 (env)  ─┐        ┌─► T3 (run関数) ──► T4 (handler配線) ─┐
           ├──────► │                                      │
T2 (Secret)┘        └─► T5 (vitest)                        │
                                                           ▼
                                                    T6 (staging検証)
                                                           │
                                                           ▼
                                                    T7 (wrangler注記/任意)
                                                           │
                                                           ▼
                                                    T8 (runbook更新)
                                                           │
                                                           ▼
                                                    T9 (production deploy)
```

## クリティカルパス（最長）

```
T1 → T3 → T4 → T5 → T6 → T8 → T9   (T7 はオプション)
0.5h  1.5h  0.5h  1.0h  1.0h  0.5h  0.5h  = 5.5h
```

T7 を含めても合計 6.25h。半〜1 営業日で完遂可能。

## 並列化可能区間

| 並列ペア | 条件 |
| --- | --- |
| T1 と T2 | 完全並列可能（T1=コード、T2=CLI 副作用） |
| T3 と T2 | typecheck は env schema 拡張済みで通るため並列可能 |
| T5 と T4 | T3 完了後、T4（handler 配線）と T5（vitest）は独立並列可能 |

## ゲート条件

| ゲート | 通過条件 |
| --- | --- |
| T5 → T6 | vitest 3 ケース全 PASS、line coverage ≥ 80% |
| T6 → T8 | staging 正常系 + 異常系（mail fallback）両方を確認したログがある |
| T8 → T9 | 月次 runbook に役割分担と連続失敗閾値が反映されている |

## 想定リスクと打ち手

| リスク | 影響 | 打ち手 |
| --- | --- | --- |
| T6 で staging Slack 不一致が出る | T9 production 進められない | Phase 7 grep gate（webhook URL ログ非出力）+ Phase 9 で再確認 |
| Resend API key 未確保 | T3 / T6 ブロック | T2 で `MAIL_PROVIDER_KEY` 流用案を採用し、Resend 共通鍵で初期構築 |
| Monday gate のタイムゾーン誤り | 本番で発火曜日ズレ | T5 vitest で `getUTCDay() === 1` をハードコードで検証、Phase 6 のテストケースに「曜日境界」観点を追加 |

## 完了確認

- [ ] T1〜T9 のクリティカルパスが上記図と一致する順序で実行される
- [ ] 並列化可能区間で実際に並列実行する場合も、ゲート条件を破らない
