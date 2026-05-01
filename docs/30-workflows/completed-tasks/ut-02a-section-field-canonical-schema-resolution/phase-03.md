# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-section-field-canonical-schema-resolution |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 2+ |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 で策定した resolver interface / 3 方式比較 / Ownership 宣言を **PASS / MINOR / MAJOR** の 3 段階レビュー基準で精査する。03a / 04a / 04b 担当との整合確認項目を網羅し、Phase 1 で示した 4 条件評価を再評価する。Phase 3 終了時点で選定方式（first choice = static manifest、03a 完成後 hybrid 切替の条件）を最終確定する。

## 真の論点 (true issue)

- 設計が AC-1〜10 をすべて満たすか
- 03a / 04a / 04b の view contract / interface ドラフトと矛盾しないか
- shared zod / enum 拡張が他タスク compile を壊さないか
- 選定方式（static manifest first choice）を Phase 5 ランブックに渡せる程度に確定できているか

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 2 の 4 成果物 | 設計 | review 結果 |
| 連携 | 03a 担当 | alias queue interface ドラフト | resolver から呼び出すフック契約合意 |
| 連携 | 04a / 04b 担当 | view contract | resolver 出力との整合確認 |
| 下流 | Phase 4 (テスト戦略) | 確定設計 | テスト観点 |

## 価値とコスト

Phase 1 引用。Phase 3 では review 工数のみコスト計上。MAJOR 判定発生時は Phase 2 へ手戻り。

## 4 条件評価（再評価）

| 条件 | 問い | 判定基準 | Phase 3 判定 |
| --- | --- | --- | --- |
| 価値性 | resolver で fallback を 0 行化できるか | builder.ts で `grep` 0 件達成見込み | （review で記録） |
| 実現性 | 03a 未完成下で generated static manifest baseline が成立するか | manifest が schema を網羅し、生成元 / 生成日時 / 再生成コマンド / 廃止条件を持つ | （review で記録） |
| 整合性 | 04a / 04b view contract と矛盾しないか | 04a / 04b 担当合意 | （review で記録） |
| 運用性 | NON_VISUAL evidence の取得が再現可能か | unit test / drift log / 3 view parity の手順固定 | （review で記録） |

## レビュー基準（PASS / MINOR / MAJOR）

| 判定 | 基準 | アクション |
| --- | --- | --- |
| PASS | AC-1〜10 を全て満たす設計、03a/04a/04b 整合 OK | Phase 4 へ進行 |
| MINOR | 文言修正・補足追記で済む指摘 | review-record.md に記録、その場で修正して PASS 化 |
| MAJOR | interface signature 変更 / 方式選定見直し / Ownership 競合 | Phase 2 へ手戻り、Phase 3 再実行 |

## 実行タスク

- [ ] PASS / MINOR / MAJOR 基準でレビュー実施
- [ ] 03a / 04a / 04b 担当との整合確認項目を review-record.md に列挙
- [ ] 4 条件評価の再評価
- [ ] 選定方式（static manifest first choice）の最終確定
- [ ] MAJOR 判定発生時の手戻り計画

## 03a / 04a / 04b 整合確認項目

| 相手 | 確認項目 | 確認方法 | 判定 |
| --- | --- | --- | --- |
| 03a | StableKey alias queue interface の dryRun / apply / 失敗通知 signature | resolver-interface.md §4 と 03a 設計書を突き合わせ | PASS / MINOR / MAJOR |
| 03a | static manifest 採用が 03a の D1 書き込み計画と競合しないか | 03a 担当に確認 | 同上 |
| 04a | `/public/*` view が resolver 出力 (canonical section / kind / label) を消費可能か | 04a 設計書と突き合わせ | 同上 |
| 04a | `field_kind=consent` の view 表示が法的同意フローと整合するか | 04a 仕様確認 | 同上 |
| 04b | `/me/*` read-only 境界が resolver 出力で維持されるか | 04b 設計書と突き合わせ | 同上 |
| 04b | `?edit=true` 等 edit 経路が増えていないか | 04b 仕様確認 | 同上 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/*.md | レビュー対象 |
| 必須 | outputs/phase-01/main.md | AC-1〜10 / Ownership |
| 参考 | 03a タスク仕様書 | alias queue interface |
| 参考 | 04a / 04b タスク仕様書 | view contract |

## 実行手順

### ステップ 1: AC × 設計の trace

- AC-1〜10 を 1 つずつ Phase 2 設計に対して trace し、満たす根拠を review-record.md に記録。

### ステップ 2: 03a / 04a / 04b 整合確認

- 上表 6 項目を担当者と確認。担当者不在の場合はドキュメント突き合わせで代替（個人開発ポリシー）。

### ステップ 3: 4 条件評価再評価

- Phase 1 4 条件をそのまま再評価し、PASS 維持を確認。

### ステップ 4: 選定方式最終確定

- first choice = static manifest を確定。
- 03a 完成後の hybrid 切替条件を Phase 10 への引き継ぎとして main.md に明記。

### ステップ 5: 判定記録

- PASS の場合 Phase 4 へ。MINOR は即修正。MAJOR は Phase 2 手戻り。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 確定設計に基づくテスト観点 |
| Phase 7 | AC matrix の入力 |
| Phase 10 | 03a 完成後の hybrid 切替再評価 |

## 多角的チェック観点

- Phase 1 の真の論点 4 件が全て設計に反映されているか
- Ownership 宣言が 03a / 04a / 04b と矛盾しないか
- 不変条件 #1 / #2 / #3 / #5 が設計上で観測可能か
- shared zod / enum 拡張が他タスク breaking change にならないか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC × 設計 trace | 3 | pending | review-record.md |
| 2 | 03a 整合確認 | 3 | pending | alias queue interface |
| 3 | 04a / 04b 整合確認 | 3 | pending | view contract |
| 4 | 4 条件再評価 | 3 | pending | — |
| 5 | 選定方式最終確定 | 3 | pending | static manifest first choice |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | Phase 3 主成果物（PASS/MINOR/MAJOR 判定 + 確定方式） |
| ドキュメント | outputs/phase-03/review-record.md | レビュー詳細記録 |
| メタ | artifacts.json | phase 3 status |

## 完了条件

- [ ] PASS / MINOR / MAJOR の最終判定が PASS
- [ ] 03a / 04a / 04b 整合確認 6 項目すべて記録
- [ ] 4 条件評価再評価 PASS
- [ ] 選定方式最終確定（static manifest）
- [ ] 03a 完成後の hybrid 切替条件記載

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（MAJOR 判定 / 整合不一致 / 03a interface 不在）対応記述
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 3 を completed

## 次 Phase

- 次: Phase 4 (テスト戦略)
- 引き継ぎ: 確定 interface / 確定方式 / 整合確認結果
- ブロック条件: 最終判定が PASS 以外なら Phase 4 不可
