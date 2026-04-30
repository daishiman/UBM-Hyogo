# Phase 6: 異常系検証（追加検証ケース・エッジケース）

> **本タスクは docs-only / infrastructure-verification である**。コード ut/it は作成しない。本 Phase は Phase 4 の TC-01〜TC-06（正常系の検証ケース）に対し、運用上発生しうる **エッジケース・例外フロー** を TC-07〜TC-12 として追加し、Phase 5 runbook に追記する責務を持つ。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web production Worker route / secret / observability 移行確認 (UT-06-FU-A-PROD-ROUTE-SECRET-001) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証（追加検証ケース） |
| 作成日 | 2026-04-30 |
| 前 Phase | 5 (runbook / checklist 文書化) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | spec_created |
| タスク分類 | specification-design（failure-case / edge-case） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 親タスク | UT-06-FU-A (`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/`) |

## 目的

Phase 5 で固定した runbook（節 0〜8）に対し、production 現場で起こりうる以下のエッジケースを TC-07〜TC-12 として設計し、runbook に追記する。

- 旧 Worker に紐づく **未把握 route** が dashboard で見落とされた場合の発見手順
- 想定外の **余剰 secret key** が新 Worker に存在した場合の扱い
- deploy 後に **Tail にログが流れない** 場合の切り分け
- rollback シナリオ（**旧 Worker への route 戻し** 可能性確認）
- DNS 切替が未完了で **deploy が要求された** 場合のスコープ外検出
- secret **値ローテーション要求** 発生時の boundary（再注入のみ・新規発行は対象外）

これにより runbook の網羅性・現場運用性が担保され、Phase 7 AC マトリクスにエッジケースまで含めたトレースが可能になる。コード単体テストは作成しない。

## 実行タスク

1. TC-07〜TC-12 の 6 件を Pre / Steps / Expected / 失敗時の rollback 余地の 4 項目で設計する（完了条件: 全 6 TC で 4 項目埋まる）。
2. 各エッジケースに対する **runbook 追記事項** を Phase 5 の節 0〜8 に対応付けて記述する（完了条件: 各 TC が runbook のどの節に追記されるか明示）。
3. スコープ外（DNS 切替 / secret 新規発行）の **境界宣言** を runbook に追記する（完了条件: 境界節が文章で記述される）。
4. 各 TC で発生しうる **誤判断シナリオ** と **再現可能な切り分け手順** を整備する（完了条件: TC-09 / TC-10 の切り分け decision tree が完成）。
5. Phase 4 検証スイート / Phase 5 runbook 節 / Phase 6 追加 TC の **3 軸 wire-in 表** を作成する（完了条件: TC-07〜TC-12 全件が wire-in に登場）。
6. evidence 命名規則と禁則（secret 値・Token 値・個人情報を残さない）を Phase 4/5 と統一する（完了条件: 6 evidence ファイルの配置先と禁則が表に追加）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-04.md | TC-01〜TC-06 の入力 |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-05.md | runbook 節 0〜8 の入力 |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md | スコープ外条項 / リスク表 |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | scripts/cf.sh 経由必須 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Worker / route / secret / observability 仕様 |
| 参考 | UT-16 DNS / custom domain 切替（別タスク） | TC-11 のスコープ外境界 |

## 追加検証ケース一覧

| TC ID | 目的 | 対応 runbook 節 |
| --- | --- | --- |
| TC-07 | 旧 Worker に紐づく未把握 route の発見手順 | 節 3（route 突合） |
| TC-08 | 想定外の余剰 secret key 発見時の扱い（不要 secret の削除 vs 残置判断） | 節 4（secret snapshot） |
| TC-09 | deploy 後 Tail にログが流れない場合の切り分け（route 不一致 / Worker 未起動 / observability 設定誤り） | 節 5・6 |
| TC-10 | rollback シナリオ：旧 Worker への route 戻し可能性確認 | 節 7・8 |
| TC-11 | DNS 切替未完了 / deploy 要求の検出（スコープ外を明確化） | 節 0（スコープ宣言） |
| TC-12 | secret 値ローテーション要求発生時の boundary（再注入のみ・新規発行は対象外） | 節 4 補足 |

### TC-07: 旧 Worker に紐づく未把握 route の発見手順

| 項目 | 内容 |
| --- | --- |
| Pre | TC-02 PASS（dashboard 上では旧 Worker route 0 件） / 旧 Worker 名 inventory が runbook に記録済み |
| Steps | 1. dashboard の Triggers / Custom Domains 表示が cache / フィルタ漏れで欠落するケースを想定し、Cloudflare Account レベルで Workers Routes 一覧を再取得<br>2. 旧 Worker 名で grep（dashboard 検索 or API レスポンスのテキスト検索）<br>3. 想定 host 一覧（ドメイン台帳）と実 route 一覧を突合し、台帳にあるが新 Worker に紐付かない host を抽出 |
| Expected | 未把握 route が **0 件**、または検出された場合は runbook の追記事項として route 付け替え計画に記録 |
| Evidence | `outputs/phase-06/evidence/tc-07-orphan-routes.md`（host 名 / 旧 Worker 名 / 発見経路） |
| 失敗時の rollback 余地 | 検出のみで route は変更しない。付け替え計画は Phase 5 節 3 に追記し、deploy 承認の前提条件として上書き |

### TC-08: 想定外の余剰 secret key の扱い

| 項目 | 内容 |
| --- | --- |
| Pre | TC-04 完了（再注入後 `secret list` が想定一覧と完全一致）または **完全一致しない** 状態 |
| Steps | 1. 新 Worker `secret list` 出力に **想定一覧に無い key** が含まれる場合、その由来を調査（旧 Worker 由来 / 過去の試行 / 未廃止 feature flag 等）<br>2. 由来不明の場合は削除せず **残置**（rollback 余地）し runbook に「由来調査中」として記録<br>3. 由来が確認でき不要と判断できる場合のみ `bash scripts/cf.sh secret delete <KEY> --config apps/web/wrangler.toml --env production` を **人手承認後** に実行（破壊的操作） |
| Expected | 余剰 key は調査記録 or 削除記録のいずれかが runbook に残る。**由来不明での即時削除は禁止** |
| Evidence | `outputs/phase-06/evidence/tc-08-extraneous-secret-keys.md`（key 名のみ・値は記録しない / 由来 / 判断） |
| 失敗時の rollback 余地 | `secret delete` を実行した後の rollback は **同一値を 1Password から再 put**。値が 1Password に存在しない場合は rollback 不能のため、削除前に 1Password に保管されていることを確認 |

### TC-09: deploy 後 Tail にログが流れない場合の切り分け

| 項目 | 内容 |
| --- | --- |
| Pre | deploy 完了後（本タスク外） / Tail コマンドを実行しても 5 分間 1 件もログが流れない状態 |
| Steps | decision tree:<br>1. **トラフィックが本当に来ているか** — 別経路（curl / browser）でリクエストして Tail に出るか確認<br>2. **route 不一致** — TC-02 / TC-07 を再実行し、route が新 Worker を指しているか確認<br>3. **Worker 未起動 / deploy 失敗** — `bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production` で最新 deployment ID を確認（cf.sh で対応するサブコマンドを使う / `wrangler` 直叩き禁止）<br>4. **observability 設定誤り** — Logpush / Analytics dataset の Worker 名が新 Worker か再確認（TC-05 を再実行）<br>5. **sampling / フィルタ** — Tail の sampling 設定や filter で抑制されていないか確認 |
| Expected | 5 段階の切り分けのいずれかで原因特定。原因不明のまま deploy を放置しない |
| Evidence | `outputs/phase-06/evidence/tc-09-tail-empty-triage.md`（実行した分岐・結果・最終判断） |
| 失敗時の rollback 余地 | 原因特定できない場合は TC-10 の route 戻し（旧 Worker への切戻）を検討。Tail が観測できない＝障害検知不能のため、deploy を継続しない |

### TC-10: rollback シナリオ（旧 Worker への route 戻し可能性確認）

| 項目 | 内容 |
| --- | --- |
| Pre | 旧 Worker が **未削除で残置**（節 7 / 節 8 のルール遵守）/ 旧 Worker の secret 状態が前回 deploy 時のまま保持されている |
| Steps | 1. 新 Worker で重大障害（5xx / データ不整合）が観測された場合の rollback プランを runbook に記述<br>2. route の対象 Worker 名を **旧 Worker** に戻す手順（dashboard 操作 / cf.sh で対応するサブコマンド）<br>3. 戻した直後に旧 Worker の Tail で traffic を観測して動作確認<br>4. rollback 完了後は新 Worker の調査を別タスクで実施 |
| Expected | rollback 手順がコピペで実行可能な markdown として runbook 節 8 に追記される。旧 Worker が削除済みの場合 rollback 不能であることを警告として明示 |
| Evidence | `outputs/phase-06/evidence/tc-10-rollback-plan.md`（rollback 手順 / 前提条件 / 不能条件） |
| 失敗時の rollback 余地 | rollback 自体が失敗する場合（旧 Worker も応答しない / DNS 整合性問題）は SRE エスカレーション。本タスクの責務は rollback 経路の確保まで |

### TC-11: DNS 切替未完了で deploy 要求された場合の検出

| 項目 | 内容 |
| --- | --- |
| Pre | 本タスクは **DNS 切替を含まない** ことが正本仕様で宣言されている / DNS 切替は別タスク UT-16 |
| Steps | 1. runbook 節 0 に「DNS 切替が未完了の状態で本 runbook を deploy ゲートに使ってはならない」旨を明示<br>2. dashboard で対象 host の DNS レコード（CNAME / A）が Cloudflare Workers を指しているか確認する手順を追記<br>3. DNS が想定先を指していない場合は本 runbook を **中断** し、UT-16 完了を待つ |
| Expected | DNS 不整合が検出された場合 deploy 承認を出さない。runbook に検出手順と中断条件が明記 |
| Evidence | `outputs/phase-06/evidence/tc-11-dns-out-of-scope.md`（DNS 状態 / 中断判断 / UT-16 待ちの記録） |
| 失敗時の rollback 余地 | 本タスクは DNS を変更しないため副作用なし。検出のみ |

### TC-12: secret 値ローテーション要求発生時の boundary

| 項目 | 内容 |
| --- | --- |
| Pre | 本タスクは **既存値の再注入のみ**を扱い、新規発行・ローテーションは含まない（正本仕様 2.3「含まないもの」） |
| Steps | 1. ローテーション要求（key 値の刷新）が発生した場合、本 runbook の `secret put` 節は使用しない<br>2. 新規発行は別タスクで実施し、その後本 runbook の TC-04（再注入）を再走<br>3. runbook 節 4 末尾に「ローテーション = 別タスク」境界を明示 |
| Expected | ローテーション要求が来ても本 runbook は実行しない / 別タスク完了後に再走するフロー |
| Evidence | `outputs/phase-06/evidence/tc-12-rotation-boundary.md`（境界宣言 / 再走条件） |
| 失敗時の rollback 余地 | 境界違反で誤って新規値を put した場合、1Password の正本値で即時上書き。1Password も新規値で更新済みの場合は新規値が正本になるため rollback 不要 |

## runbook 追記事項

| TC | Phase 5 runbook 節 | 追記内容 |
| --- | --- | --- |
| TC-07 | 節 3 | dashboard 漏れに対する Account レベル route 一覧再取得手順 / ドメイン台帳との突合 |
| TC-08 | 節 4 | 余剰 key 発見時の「由来調査 → 残置 or 人手承認後削除」ルール |
| TC-09 | 節 5・6 | Tail 無音時の 5 段階切り分け decision tree |
| TC-10 | 節 7・8 | 旧 Worker への route 戻し手順 / 旧 Worker 削除済み時の rollback 不能警告 |
| TC-11 | 節 0 | DNS 切替未完了時の中断条件 / UT-16 への依存宣言 |
| TC-12 | 節 4 末尾 | ローテーション要求は別タスク・本 runbook 対象外の境界 |

## 切り分け decision tree（TC-09 / TC-10 抜粋）

### TC-09: Tail 無音時の切り分け

```
Tail に 5 分間ログ無し
├─ 別経路でリクエスト → Tail に出る？
│   ├─ YES → 平常時は traffic が無いだけ（誤検知）
│   └─ NO → 次へ
├─ route が新 Worker を指す？（TC-02 / TC-07 再実行）
│   ├─ NO → route 付け替え
│   └─ YES → 次へ
├─ 最新 deployment が成功？（cf.sh で deployments 確認）
│   ├─ NO → deploy 再実行（別タスク）
│   └─ YES → 次へ
├─ Logpush / Analytics の Worker 名が新 Worker？（TC-05 再実行）
│   ├─ NO → 設定書き換え
│   └─ YES → 次へ
└─ Tail の sampling / filter 設定確認
    └─ filter で抑制 → filter 解除して再観測
```

### TC-10: rollback decision

```
新 Worker で重大障害観測
├─ 旧 Worker は残置されているか？
│   ├─ NO（削除済み） → rollback 不能 / SRE エスカレーション
│   └─ YES → 次へ
├─ 旧 Worker の secret 状態は前 deploy 時のままか？
│   ├─ NO → 動作不能の可能性 / 慎重に判断
│   └─ YES → route を旧 Worker に戻す
└─ route 戻し後に旧 Worker Tail で traffic 観測
    ├─ ログ流れる → rollback 成功 / 新 Worker 調査は別タスク
    └─ ログ無し → SRE エスカレーション
```

## 3 軸 wire-in 表（Phase 4 × Phase 5 × Phase 6）

| TC | Phase 4 検証スイート | Phase 5 runbook 節 | Phase 6 追記 |
| --- | --- | --- | --- |
| TC-01〜TC-06 | TC-01〜TC-06 そのもの | 節 1〜7 | （正常系） |
| TC-07 | TC-02 拡張 | 節 3 | dashboard 漏れ対策 |
| TC-08 | TC-04 拡張 | 節 4 | 余剰 key 扱い |
| TC-09 | TC-05 拡張 | 節 5・6 | Tail 無音切り分け |
| TC-10 | TC-06 拡張 | 節 7・8 | rollback 経路 |
| TC-11 | （Phase 4 にはない / Phase 6 新規） | 節 0 | DNS 境界 |
| TC-12 | （Phase 4 にはない / Phase 6 新規） | 節 4 補足 | ローテーション境界 |

## evidence 配置と禁則（Phase 4/5 と統一）

| evidence | 配置先 | 粒度 | 禁則 |
| --- | --- | --- | --- |
| tc-07-orphan-routes.md | `outputs/phase-06/evidence/` | host 名 / 旧 Worker 名 / 発見経路 | 個人情報を含む path は伏字 |
| tc-08-extraneous-secret-keys.md | 同上 | key 名 / 由来 / 判断 | 値・hash・長さ |
| tc-09-tail-empty-triage.md | 同上 | 分岐結果 / 最終判断 | リクエスト本文の個人情報マスク |
| tc-10-rollback-plan.md | 同上 | rollback 手順 / 前提 / 不能条件 | （特になし） |
| tc-11-dns-out-of-scope.md | 同上 | DNS 状態 / 中断判断 | （特になし） |
| tc-12-rotation-boundary.md | 同上 | 境界宣言 / 再走条件 | 値そのものの記述禁止 |

## 実行手順

1. TC-07〜TC-12 の 6 件を `outputs/phase-06/edge-cases.md` に転記する。
2. 各 TC の Pre / Steps / Expected / rollback 余地 4 項目が埋まっていることを目視確認。
3. runbook 追記事項を Phase 5 節 0 / 3 / 4 / 5・6 / 7・8 にマップして反映する（親 runbook の追記）。
4. 切り分け decision tree（TC-09 / TC-10）が markdown で図示されていることを確認。
5. 3 軸 wire-in 表が Phase 4 / Phase 5 / Phase 6 の対応で完結していることを確認。
6. `wrangler` 直叩きが本ドキュメント内にゼロ件であることを `grep` で確認。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | TC-01〜TC-12 を AC × TC マトリクスに集約 |
| Phase 9 | TC-09 / TC-10 を「障害発生時の切り分け再現性」指標に組み込み |
| Phase 11 | runbook 全体（節 0〜8 + 追記）を staging で空実行（deploy なし）して再現性確認 |
| Phase 12 | DNS 切替（UT-16）/ secret ローテーション（別タスク）の依存を unassigned-task-detection に登録 |

## 多角的チェック観点

- 価値性: TC-07〜TC-12 が現場で起こりうる事故を実際に防げるか。
- 実現性: dashboard 操作 / cf.sh コマンドで再現可能な手順か。
- 整合性: Phase 5 runbook 節と TC が wire-in 表で 1:1 対応しているか。
- 運用性: TC-09 / TC-10 の decision tree がコピペで運用可能か。
- 認可境界: TC-08（secret 削除）/ TC-10（route 戻し）の破壊的操作で人手承認境界が明示されているか。
- セキュリティ: 全 evidence で値・Token・個人情報が残らない設計か。
- 境界明確化: TC-11（DNS）/ TC-12（ローテーション）が本タスクスコープ外として宣言されているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | TC-07〜TC-12 設計 | spec_created |
| 2 | runbook 追記事項マッピング | spec_created |
| 3 | スコープ外境界宣言（TC-11 / TC-12） | spec_created |
| 4 | 切り分け decision tree（TC-09 / TC-10） | spec_created |
| 5 | 3 軸 wire-in 表 | spec_created |
| 6 | evidence 命名規則統一 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/edge-cases.md | TC-07〜TC-12 の 6 件設計 + runbook 追記事項 + decision tree + wire-in 表 |
| ドキュメント | docs/30-workflows/ut-06-followup-A-opennext-workers-migration/runbook/production-worker-migration-verification.md | Phase 5 で作成した親 runbook に TC-07〜TC-12 の追記が反映 |
| メタ | artifacts.json | Phase 6 状態更新 |

## 完了条件

- [ ] TC-07〜TC-12 の 6 件が Pre / Steps / Expected / rollback 余地 4 項目で完成
- [ ] 各 TC が Phase 5 runbook の対応節に追記される計画が明示
- [ ] スコープ外境界（TC-11 DNS / TC-12 ローテーション）が runbook 節 0 / 節 4 末尾で宣言
- [ ] 切り分け decision tree（TC-09 / TC-10）が markdown 図示
- [ ] 3 軸 wire-in 表（Phase 4 × Phase 5 × Phase 6）で 12 TC 全件が登場
- [ ] evidence 6 ファイルの配置先と禁則が表に追加（Phase 4/5 と統一）
- [ ] `wrangler` 直叩きが本ドキュメント内にゼロ件
- [ ] 親 runbook への追記が runbook 節 0 / 3 / 4 / 5・6 / 7・8 に反映

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物が `outputs/phase-06/edge-cases.md` に配置済み
- TC-07〜TC-12 全件に 4 項目（Pre / Steps / Expected / rollback 余地）が記入
- 親 runbook 追記が Phase 5 節とマップ済み
- 本 Phase はコードを書かない docs-only タスクであることが冒頭で再宣言
- secret 値・Token 値・個人情報を evidence に残さない原則が全 TC で適用

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - TC-01〜TC-12 を AC マトリクスの「関連 TC」列に紐付け
  - スコープ外境界（DNS / ローテーション）を AC の「含まないもの」列に明記
  - 切り分け decision tree を Phase 11 staging 空実行の対象に予約
- ブロック条件:
  - TC が 6 件未満で Phase 7 に進む
  - スコープ外境界が runbook に追記されない
  - `wrangler` 直叩きが追加されている
  - secret 値が evidence に書かれる経路が残る
