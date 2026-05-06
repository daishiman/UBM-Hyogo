# Phase 6: 異常系（duplicate enqueue / partial failure recovery / batch boundary）

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | Schema alias back-fill queue/cron split (UT-07B-FU-01) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系 |
| 作成日 | 2026-05-05 |
| 前 Phase | 5（仕様 runbook 作成） |
| 次 Phase | 7（AC マトリクス） |
| 状態 | spec_created |
| タスク分類 | implementation（failure-mode-analysis） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |

## 目的

UT-07B-FU-01 の queue/cron 分離設計が運用中に遭遇しうる異常モードを **FMEA 風** に列挙し、各モードに対する (1) 発生条件 (2) 影響 (3) 検出方法 (4) 予防策（本タスクの設計決定との対応） (5) recovery 手順 (6) evidence の 6 軸で文書化する。本 Phase は Phase 5 の関数シグネチャ / migration runbook / contract 移行と Phase 4 のテストケースを「異常モード視点」で再編成し、Phase 8〜10 実装と Phase 11 staging 実測時に「想定外」が発生しないことを保証する入力を作る。

親タスク UT-07B（schema alias hardening）の Case 1〜6 を上位互換として継承し、queue/cron 分離固有の異常 5 件（duplicate enqueue / partial failure recovery / batch boundary 過小過大 / queue consumer crash / max retry exceeded）と enqueue 失敗時 compensation を新規 Case として追加する。

## 完了条件チェックリスト

- [ ] 想定異常 Case が 7 件以上列挙されている（duplicate enqueue / batch partial failure / queue consumer crash / cron 重複起動 / max retry exceeded / enqueue 失敗 compensation / batch boundary tuning）
- [ ] 各 Case に「発生条件 / 影響 / 検出方法 / 予防策 / recovery 手順 / evidence」の 6 項目が揃っている
- [ ] silent failure / 半サイレント / 顕在失敗の区別が明示されている
- [ ] recovery 手順が Phase 5 関数シグネチャ / migration runbook と紐付いている
- [ ] evidence パス（Phase 11 で残す計測値 / log）が予約されている
- [ ] 異常検出マトリクス（Case × サイレント度 × 検出層 × 対応 Phase）が補助表として記述されている
- [ ] batch boundary（max_batch_size / max_batch_timeout / max_retries）の決定根拠と staging evidence からのチューニング方針が独立節で記述されている
- [ ] 全異常系に対する unit / integration テストケース ID（Phase 4 連動）が紐付いている

## 実行タスク

1. Case 1〜7 の 6 軸を起草する。
2. 異常検出マトリクスを起草する。
3. recovery 手順を Phase 5 関数シグネチャ / migration runbook と紐付ける。
4. batch boundary tuning の独立節を起草する。
5. 各 Case と Phase 4 テストケース ID（T-U/T-R/T-W/T-Q）の紐付けを表化する。
6. evidence パス（`outputs/phase-11/manual-evidence.md` § Case 1〜7）を予約する。
7. 成果物 `outputs/phase-06/failure-cases.md` の章立てを確定する。

## 異常ケース一覧

### Case 1: duplicate enqueue（同 alias を短時間に複数回 apply）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | admin UI で apply ボタンの誤連打 / retry / 自動 polling が同一 `(aliasId, revisionId, stableKey)` に対し短時間に複数 enqueue を試みる |
| 影響 | dedupe key が無い場合は queue に重複 message が滞留し、consumer が同一 batch を多重処理。remaining-scan の対象行減少確認が無ければ二重 UPDATE で副作用増幅 |
| サイレント度 | 半サイレント（重複処理は status 上問題なく見えるが、queue cost / D1 write が水増し） |
| 検出方法 | T-W-05（Miniflare で同 dedupe key 2 回 enqueue → INSERT OR IGNORE で 1 件に収束）+ T-Q-01（dedupe_key UNIQUE 制約で SQLITE_CONSTRAINT） |
| 予防策（本タスク） | (a) Phase 5 §4 で `dedupe_key` UNIQUE INDEX、(b) `enqueueBackfillJob` で `INSERT OR IGNORE` → `deduped:true` 返却、(c) remaining-scan で `__extra__:<questionId>` 残件だけを UPDATE し at-least-once 配送下も idempotent |
| recovery 手順 | 本構造では recovery 不要（dedupe で抑止される）。万一 duplicate が発生しても idempotent UPDATE で副作用ゼロ。`audit_log` に `action='backfill_duplicate_dedupe'` を記録 |
| evidence | `outputs/phase-11/manual-evidence.md` § Case 1 に staging で 2 連打した場合の queue message 数（dedupe 後 1 件）と DB UPDATE 件数を記録 |

### Case 2: batch partial failure（N 件中 M 件で UPDATE 例外）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `processBackfillBatch` 中に `response_fields` UPDATE で D1 一時障害 / 制約違反 / busy エラーが M 件発生 |
| 影響 | 1 batch = 1 D1 transaction を採用していれば all-or-nothing で部分 commit は発生しない。だが「成功分のみ commit + 失敗分次 batch 持ち越し」を選んだ場合、`failed_items_json` と retry_count による失敗行管理が必要 |
| サイレント度 | サイレント（status は `running` のまま継続するが、特定行が永続的に失敗する可能性） |
| 検出方法 | T-W-04（Miniflare で UPDATE に強制例外注入 → tx は成功分のみ commit / 失敗行は次 batch へ繰り越し / retry_count++） |
| 予防策（本タスク） | (a) Phase 5 §2 `processBackfillBatch` の戻り値に `processed` / `remaining` を分離、(b) `retry_count` を `schema_diff_queue` に持ち retry 上限を保証、(c) `last_error` を保存し dead-letter 判定の根拠化 |
| recovery 手順 | retry_count < max なら次 batch で再試行（idempotent）。max 超過は Case 5 へ遷移 |
| evidence | `outputs/phase-11/manual-evidence.md` § Case 2 に partial failure 発生時の `retry_count` 推移 + `last_error` を記録 |

### Case 3: queue consumer crash（at-least-once 再配送）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | consumer 実行中に Workers runtime crash / OOM / timeout で ack を返さず、Cloudflare Queue が同一 message を再配送 |
| 影響 | 再配送された message を consumer が再処理すると、(a) 同一 batch を再 UPDATE するリスク、(b) remaining-scan 対象が既に減少済みなら二重 UPDATE は no-op、(c) ただし dedupe key 比較を欠くと余分な D1 read が発生 |
| サイレント度 | サイレント（at-least-once は仕様。idempotent 実装が無いと発覚しにくい） |
| 検出方法 | T-W-06（Miniflare で同一 message を consumer に 2 回投入 → 2 回目は remaining-scan 対象 0 で no-op、UPDATE rowsAffected=0） |
| 予防策（本タスク） | Phase 5 §2 `processBackfillBatch` で `WHERE key='__extra__:<questionId>'` の remaining-scan を再評価し、再配送 message は no-op で抜ける |
| recovery 手順 | 自動。idempotent UPDATE により再配送は副作用ゼロで吸収 |
| evidence | `outputs/phase-11/manual-evidence.md` § Case 3 に staging で人為的 crash → 再配送発生時の queue message 履歴と DB 状態 snapshot を記録 |

### Case 4: cron 重複起動 / 前回未完で再起動

| 項目 | 内容 |
| --- | --- |
| 発生条件 | cron handler 実行中に次の cron tick が到達し、同一 `schema_diff_queue` 行に対する re-enqueue が並列発生 |
| 影響 | dedupe key 一致なら INSERT OR IGNORE で抑止。だが queue 側に既に message が滞留している場合、queue 上で重複が発生する可能性 |
| サイレント度 | 半サイレント（重複処理は idempotent UPDATE で吸収されるが、queue lag が長期化） |
| 検出方法 | T-W-07（cron handler が status='exhausted' 行を再 enqueue → 既に queue に message があれば dedupe で skip） |
| 予防策（本タスク） | (a) cron handler は `status IN ('exhausted','running') AND last_processed_at < now() - 10min` の stale 条件で対象を絞る、(b) re-enqueue 前に Cloudflare Queue の send 結果が dedupe で skip されることを許容 |
| recovery 手順 | 自動。idempotent + dedupe で吸収 |
| evidence | `outputs/phase-11/manual-evidence.md` § Case 4 に cron 連続起動時の queue 滞留 message 数 + 重複検出ログを記録 |

### Case 5: max retry exceeded（dead-letter 相当）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | 同一 batch / message に対し `retry_count` が max（Phase 5 §5.1 の `max_retries=5`）を超過 |
| 影響 | 該当 alias の back-fill が永続的に進まない。公開 API は `backfill.status:'exhausted'` のまま retry metadata で manual intervention を要求し、internal DB は failed 相当に遷移する |
| サイレント度 | 顕在（admin UI で明示）+ DLQ message 化 |
| 検出方法 | T-W-08（retry_count >= max で internal failed 相当に遷移 / DLQ にも message 投下） |
| 予防策（本タスク） | (a) `schema_diff_queue.retry_count` 上限管理、(b) Cloudflare Queue の `dead_letter_queue = "schema-backfill-dlq"`、(c) `getBackfillStatus` の戻り値に `retryCount` を含めて admin UI 表示 |
| recovery 手順 | (1) admin が `last_error` を確認、(2) 原因解消後に `audit_log` 記録 + `retry_count = 0` に手動リセット、(3) cron が次 tick で自動 re-enqueue / もしくは admin が同 payload で再 apply（dedupe で重複抑止） |
| evidence | `outputs/phase-11/manual-evidence.md` § Case 5 に DLQ 投下時の `last_error` + admin 復旧手順 trace を記録 |

### Case 6: enqueue 失敗時 compensation（alias 確定済 / queue API 障害）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | Stage 1 alias 確定 commit 後、`enqueueBackfillJob` 内で `env.SCHEMA_BACKFILL_QUEUE.send(...)` が一時障害で例外 |
| 影響 | alias は確定済（DB に commit）だが queue に message が無い → cron が `status:'pending'` 行を発見するまで back-fill 開始遅延 |
| サイレント度 | 半サイレント（response は `confirmed:true, backfill.status:'pending'` を返すが、cron tick まで進まない） |
| 検出方法 | T-W-02（producer に強制例外注入 → alias は残り `status:'pending'` のままになり、cron 起動で recover） |
| 予防策（本タスク） | (a) Phase 5 §3 副作用表で「enqueue 失敗時は alias 確定はそのまま、`status:'pending'` を残し cron で recover」を契約、(b) cron handler が `status='pending' AND queue_message_id IS NULL` を再 enqueue 対象に含める、(c) 同期 fallback として route 側で例外を握り潰さず response に `backfill.status` を返却 |
| recovery 手順 | cron が次 tick で `status='pending'` の row を発見し再 enqueue（idempotent）。失敗が続く場合は Case 5 へ遷移 |
| evidence | `outputs/phase-11/manual-evidence.md` § Case 6 に enqueue 失敗時 → cron 経由 recover の queue 履歴 + DB 状態を記録 |

### Case 7: batch boundary tuning（max_batch_size / timeout / retries の不適合）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | (a) `max_batch_size` 過小で queue throughput が cron tick に追いつかず lag が累積、(b) 過大で 1 consumer 実行が CPU budget を超過、(c) `max_retries` 過小で transient error が DLQ に流れすぎる |
| 影響 | (a) 完了時間 SLO 違反、(b) cpu_budget_exhausted を新 contract 内部で再発、(c) 復旧可能 error が manual intervention 必須化 |
| サイレント度 | 顕在（lag / DLQ rate / cpu metrics で観測可能） |
| 検出方法 | Phase 11 staging T-S-02 / T-S-03 の after evidence で計測（apply 応答時間 / queue lag / CPU 時間 / DLQ rate） |
| 予防策（本タスク） | Phase 5 §5.1 で **初期値**: `max_batch_size = 10`, `max_batch_timeout = 5s`, `max_retries = 5` を設定。Phase 11 staging evidence でチューニング根拠を記録し、production 適用前に値を確定する |
| recovery 手順 | wrangler.toml の `[[queues.consumers]]` 設定値を変更 → `bash scripts/cf.sh deploy` で reapply。Cloudflare Queue 側の値は wrangler 経由のみで上書き |
| evidence | `outputs/phase-11/manual-evidence.md` § Case 7 に staging 計測値（before / 初期値 after / チューニング後 after）を 3 列で記録 |

## 異常検出マトリクス

| Case | サイレント度 | 検出層 | 対応 Phase | 関連 test ID | 関連 Phase 5 節 |
| --- | --- | --- | --- | --- | --- |
| Case 1 | 半サイレント | repository / workflow | Phase 4 / 9 | T-W-05, T-Q-01 | §4（dedupe_key UNIQUE）/ §2（enqueueBackfillJob） |
| Case 2 | サイレント | workflow | Phase 4 / 9 | T-W-04 | §2（processBackfillBatch）/ §4（retry_count） |
| Case 3 | サイレント | workflow | Phase 4 / 9 | T-W-06 | §2（remaining-scan no-op）|
| Case 4 | 半サイレント | workflow | Phase 4 / 9 | T-W-07 | §5（cron stale 条件） |
| Case 5 | 顕在 | workflow / DLQ | Phase 4 / 9 / 11 | T-W-08 | §5（dead_letter_queue）|
| Case 6 | 半サイレント | workflow | Phase 4 / 9 | T-W-02 | §2 / §3（compensation 契約）|
| Case 7 | 顕在 | staging 計測 | Phase 11 | T-S-02, T-S-03 | §5.1（max_batch_size 等）|

## batch boundary tuning 独立節

### 初期値の決定根拠

| パラメータ | 初期値 | 根拠 |
| --- | --- | --- |
| `max_batch_size` | 10 | 1 message = 1 alias の back-fill 単位。10 並列処理しても D1 単一 transaction の競合が許容範囲（既存 sync の `SYNC_BATCH_SIZE=100` より控えめ） |
| `max_batch_timeout` | 5 秒 | Workers の 30 秒 CPU budget に対し 1 batch 5 秒で安全マージン確保 |
| `max_retries` | 5 | transient error（D1 busy 等）は 1〜2 回で解消、5 回失敗は永続失敗とみなして DLQ 化 |
| cron interval | `*/5 * * * *`（free plan は `*/15 * * * *`）| 完了時間 SLO（10K 行を 30 分以内）と Cloudflare account cron 上限のトレードオフ |

### staging evidence からのチューニング方針

1. Phase 11 で 10K / 50K rows fixture 投入後、初期値で T-S-02 / T-S-03 を実行
2. 計測項目（apply 応答時間 / queue lag / CPU 時間 / retry 回数 / DLQ rate）を記録
3. 以下条件で値を変更し再計測:
   - apply 応答時間 > 5s → enqueue を非同期化（既に新 contract で 200 を即返すため通常発生しない）
   - queue lag > 5min → `max_batch_size` を 20 に増加
   - CPU 時間 > 25s → `max_batch_size` を 5 に削減
   - DLQ rate > 1% → `max_retries` を 7 に増加
4. チューニング後の値を Phase 12 で `wrangler.toml` に反映、staging / production 同期適用

## 後続実装 Phase（Phase 8〜10）への引き渡し

- 各 Case の予防策が Phase 4 テストケース ID と紐付くため、実装時はそのテストを通すことで予防が達成される。
- recovery 手順は Phase 5 §2 関数シグネチャ / §4 migration runbook / §5 binding 設定 に集約されているため、本 Phase はこれを参照するのみ。
- batch boundary tuning（Case 7）は Phase 11 staging 計測値に基づき Phase 10 ゲートで初期値の妥当性を判定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-02.md` | Queue vs Cron 設計判断 |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-04.md` | テストケース ID（T-U/T-R/T-W/T-Q）連動 |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-05.md` | 関数シグネチャ / migration / binding / contract 移行 |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-06.md` | 親タスク Case 1〜6 の上位互換 |
| 参考 | Cloudflare Queues docs（`max_batch_size`, `dead_letter_queue`） | binding 仕様の正本 |

## 苦戦箇所【記入必須】

- Case 6（enqueue 失敗 compensation）の選択肢として「同期 fallback で route 内で再試行」も検討したが、route 内で複数回 send を試みると新 contract の「200 即返し」契約と矛盾する。compensation は cron 経由に一本化する選択を本 Phase で固定する。
- Case 7（batch boundary）は Phase 11 staging 計測がないと初期値の妥当性が確定できない。本 Phase では「初期値 + チューニング方針」を文書化するに留め、Phase 10 ゲートで Phase 11 の計測結果に基づき再判定する。

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 7 Case の全異常モードに recovery / detection / prevention が紐付き、production 障害の MTTR を短縮 |
| 実現性 | PASS | dedupe_key UNIQUE / remaining-scan no-op / DLQ binding はいずれも Phase 5 §4 / §5 で実装手順が確定済み |
| 整合性 | PASS | 親タスク UT-07B の Case 体系を上位互換し、queue/cron 固有 5 件 + compensation 1 件を独立 Case として追加 |
| 運用性 | PASS | 全 recovery が `scripts/cf.sh` 経由 + `audit_log` 記録で完結 |

## 受入条件（AC）

本 Phase は **AC-5（remaining-scan + idempotent batch）/ AC-7（duplicate / partial failure 網羅）** の異常モード視点での裏付けを担う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | Case 1〜7 を 6 軸（条件 / 影響 / 検出 / 予防 / recovery / evidence）で記述 + 異常検出マトリクス + batch boundary tuning |
| メタ | artifacts.json | Phase 6 状態の更新 |

## 多角的チェック観点

- **網羅性**: duplicate / partial failure / consumer crash / cron 重複 / max retry / enqueue 失敗 / batch tuning の 7 カテゴリすべてが Case として独立に列挙されているか。
- **silent vs 顕在**: 各 Case のサイレント度が明示され、サイレント Case には test / 計測ベースの検出手段が紐付いているか。
- **Phase 5 連結**: 全 Case の predict / recovery が Phase 5 §2 / §4 / §5 のいずれかに紐付いているか。
- **evidence 予約**: 全 Case の evidence パスが `outputs/phase-11/manual-evidence.md` の節として予約されているか。
- **不変条件 #5**: 全 recovery 手順が `apps/api/**` + `scripts/cf.sh` 経由で完結し、`apps/web` から D1 / Queue を触る経路を含まないか。
- **batch boundary 客観性**: Case 7 の初期値 + チューニング条件が客観的指標（応答時間 / lag / CPU / DLQ rate）で記述されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Case 1（duplicate enqueue）起草 | 6 | pending | dedupe_key UNIQUE 連結 |
| 2 | Case 2（partial failure）起草 | 6 | pending | retry_count / last_error 連結 |
| 3 | Case 3（consumer crash）起草 | 6 | pending | remaining-scan 連結 |
| 4 | Case 4（cron 重複）起草 | 6 | pending | stale 条件連結 |
| 5 | Case 5（max retry）起草 | 6 | pending | DLQ 連結 |
| 6 | Case 6（enqueue 失敗 compensation）起草 | 6 | pending | cron recover 連結 |
| 7 | Case 7（batch boundary tuning）起草 | 6 | pending | Phase 11 計測連結 |
| 8 | 異常検出マトリクス | 6 | pending | 7 Case × 5 列 |
| 9 | batch boundary tuning 独立節 | 6 | pending | 初期値 + チューニング方針 |
| 10 | evidence パス予約 | 6 | pending | Phase 11 manual-evidence.md § Case 1〜7 |

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created` へ遷移
- Case 1〜7 が 6 軸で揃っている
- silent / 半サイレント / 顕在の区別が明示
- 全 Case の recovery が Phase 5 §2 / §4 / §5 と紐付いている
- evidence パスが Phase 11 に予約されている
- batch boundary 初期値 + チューニング方針が客観指標で記述
- artifacts.json の `phases[5].status` が `spec_created`

## 実行手順

1. 親タスク UT-07B `phase-06.md` の 6 Case を確認し、queue/cron 固有の Case 1〜7 へ書き直す。
2. 各 Case の予防策を Phase 5 §2 関数シグネチャ / §4 migration / §5 binding と紐付ける。
3. batch boundary tuning（Case 7）を独立節として展開し、初期値の根拠とチューニング条件を客観指標で記述。
4. evidence パスを `outputs/phase-11/manual-evidence.md` § Case 1〜7 として予約。
5. 異常検出マトリクスを 7 Case × 5 列で起草。

## 次 Phase への引き渡し

- 次 Phase: 7（AC マトリクス）
- 引き継ぎ事項:
  - 7 異常 Case とその予防策（Phase 4 テストケース ID と紐付き）
  - recovery 手順（Phase 5 §2 / §4 / §5 と紐付き）
  - 異常検出マトリクス
  - batch boundary tuning 初期値とチューニング条件
  - Phase 11 evidence 予約パス（Case 1〜7 ごと）
- ブロック条件:
  - 7 カテゴリのいずれかが Case として欠落
  - silent / 顕在の区別が曖昧
  - recovery が Phase 5 と紐付いていない
  - batch boundary 初期値が客観指標で記述されていない
  - evidence パスが Phase 11 で予約されていない

## 統合テスト連携

- 本 Phase の検証観点は `apps/api` 配下の unit / route / workflow / repository test に接続する。
- queue at-least-once / dedupe_key UNIQUE / remaining-scan / DLQ / cron stale 条件 / batch boundary tuning は Phase 4 テスト戦略、Phase 9 品質保証、Phase 11 staging 実測へ連結する。
