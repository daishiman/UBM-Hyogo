# Phase 6: 異常系（migration 失敗 / back-fill 中断 / CPU budget 超過 / D1 batch 失敗 / 同時 apply 競合）

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | Schema alias apply hardening / 大規模 back-fill 再開可能化 (UT-07B) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系 |
| 作成日 | 2026-05-01 |
| 前 Phase | 5（仕様 runbook 作成） |
| 次 Phase | 7（AC マトリクス） |
| 状態 | spec_created |
| タスク分類 | implementation（failure-mode-analysis） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

UT-07B が運用中に遭遇しうる異常モードを **FMEA 風** に列挙し、各モードに対する (1) 発生条件 (2) 影響 (3) 検出方法 (4) 予防策（本タスクの設計決定との対応） (5) recovery 手順 (6) evidence の 6 軸で文書化する。本 Phase は Phase 5 の rollback runbook と Phase 4 のテストケースを「異常モード視点」で再編成し、実装 Phase（Phase 8〜10）と Phase 11 staging 実測時に「想定外」が発生しないことを保証する入力を作る。

## 完了条件チェックリスト

- [ ] 想定異常 Case が 6 件以上列挙されている（migration 失敗 / back-fill 中断 / CPU budget 超過 / D1 batch 失敗 / 同時 apply 競合 / partial UNIQUE 除外条件メンテミス を網羅）
- [ ] 各 Case に「発生条件 / 影響 / 検出方法 / 予防策 / recovery 手順 / evidence」の 6 項目が揃っている
- [ ] silent failure（沈黙した壊れ方）と顕在失敗が明確に区別されている
- [ ] recovery 手順が Phase 5 rollback runbook の該当節（A〜E）と紐付いている
- [ ] evidence パス（Phase 11 で残す計測値 / log）が予約されている
- [ ] 異常検出マトリクス（Case × サイレント度 × 検出層 × 対応 Phase）が補助表として記述されている

## 実行タスク

1. Case 1〜6 の 6 軸（発生条件 / 影響 / 検出方法 / 予防策 / recovery / evidence）を起草する。
2. 異常検出マトリクスを起草する（完了条件: 6 Case × 4 列）。
3. recovery 手順を Phase 5 rollback runbook §A〜E と紐付ける。
4. evidence パス（`outputs/phase-11/manual-evidence.md` の予約セクション）を確定する。
5. 成果物 `outputs/phase-06/failure-cases.md` の章立てを確定する。

## 異常ケース一覧

### Case 1: partial UNIQUE index 追加 migration 失敗（既存データ衝突）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | Phase 5 Step 0 検出 SQL を skip して partial UNIQUE 追加 migration を apply、既存に確定 stable_key の重複行が存在 |
| 影響 | migration 全体が `SQLITE_CONSTRAINT` で abort、production migration の自動 rollback が走り index 未適用のまま放置（race condition リスク継続） |
| 検出方法 | staging で意図的に重複行を仕込み Phase 5 Step 0 を skip して実行し、`SQLITE_CONSTRAINT` を再現 |
| 予防策（本タスク） | Phase 5 migration-runbook で Step 0（検出 SQL）を必須化、衝突 ≥ 1 件の場合は rollback runbook §B を先に適用する契約 |
| recovery 手順 | rollback runbook §B「既存データ衝突解消」を適用 → Step 0 再実行 0 件確認 → partial UNIQUE 再 apply |
| evidence | `outputs/phase-11/manual-evidence.md` § Case 1 に staging で実行した検出 SQL 結果（0 件 / N 件）を記録 |

### Case 2: back-fill 中断（runtime 例外 / D1 一時障害）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | Stage 2 の UPDATE batch 実行中に D1 binding 一時エラー / Workers runtime 例外が発生 |
| 影響 | Stage 1（alias 確定）は commit 済みのため `schema_questions.stable_key` は確定状態。Stage 2 cursor 進行が途中で停止し `backfill_status='in_progress'` のまま放置されると、外部から「処理中なのか hung なのか」判別不能 |
| 検出方法 | route test で Stage 2 内に強制例外を注入し、`backfill_status='failed'` セット + 例外伝播確認（T-W-* 系の派生テスト） |
| 予防策（本タスク） | Stage 1 と Stage 2 を別 commit に分離（Phase 2 設計判断 2）。Stage 2 例外時は `backfill_status='failed'` を最終 step として set し、cursor を保持 |
| recovery 手順 | rollback runbook §D を適用（`failed` セット + audit_log 記録）→ 原因解消後に同 payload で `POST /admin/schema/aliases` 再実行 → cursor 起点に残件のみ走査（idempotent） |
| evidence | `outputs/phase-11/manual-evidence.md` § Case 2 に Workers Logs から exception trace + final cursor + audit_log 行を記録 |

### Case 3: Workers CPU budget 超過（恒常的）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | 100,000 行 fixture で 1 リクエスト内に back-fill 完走できず、`backfill_cpu_budget_exhausted` を返却。retry を繰り返しても 5 回以上 `exhausted` が連発 |
| 影響 | サイレントではなく顕在（クライアント側で retry ループが目立つ）。だが運用上の処理時間が許容を超え、SLO 違反 |
| 検出方法 | Phase 11 staging 実測（T-S-03）で 100,000 行 fixture の retry 回数を計測 |
| 予防策（本タスク） | Phase 2 設計判断 4 + Phase 3 軸 D で「100,000 行 で 3 retry 以下に収束しない場合は queue / cron 分離 follow-up 起票」の分岐を事前定義 |
| recovery 手順 | (1) 短期: 該当 alias を `unknown` 戻し（rollback runbook §B 案 A）し本番影響を停止 (2) 長期: queue / cron 分離 follow-up タスクを起票（実装委譲） |
| evidence | `outputs/phase-11/manual-evidence.md` § Case 3 に 10K / 50K / 100K 行の retry 回数 + CPU 時間ヒストグラムを記録 |

### Case 4: D1 batch 失敗（partial UPDATE）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | Stage 2 の `UPDATE response_fields ... LIMIT N` が D1 trasaction の途中でエラー（disk full / lock timeout / 一時的な internal error） |
| 影響 | batch 単位の transaction で commit 制御していれば部分 UPDATE は発生しない（all-or-nothing）。ただし transaction 境界が batch 外側にあると部分 UPDATE で cursor との整合性が崩れる可能性 |
| 検出方法 | T-W-09（Miniflare D1 で batch transaction 強制中断）で部分 UPDATE が発生しないこと（cursor 進行 = UPDATE changes 数）を assert |
| 予防策（本タスク） | Phase 2 resumable-backfill-design で「1 batch = 1 D1 transaction」を契約として固定。batch 失敗時は cursor 未進行で例外伝播 |
| recovery 手順 | Case 2 と同じ（rollback runbook §D）。cursor 未進行のため idempotent retry で同一 batch を再実行可能 |
| evidence | `outputs/phase-11/manual-evidence.md` § Case 4 に batch transaction 境界の Miniflare 動作 log を記録 |

### Case 5: 同時 apply 競合（同一 revision に並列リクエスト）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | 同一 revision_id + 同一 stable_key を 2 つのリクエストが並列に apply、双方が pre-check を通過してから INSERT に到達 |
| 影響 | partial UNIQUE が無い世界では race condition で重複 INSERT 成立。運用ですると「alias が複数 question に重複付与」で集計が歪む |
| 検出方法 | T-W-01（Miniflare D1 で同一 revision + 同一確定 stable_key の 2 行 INSERT を試行）で 2 行目が `SQLITE_CONSTRAINT` で reject されることを確認 |
| 予防策（本タスク） | partial UNIQUE index（Phase 2 設計判断 1）+ repository pre-check の二段防御。pre-check race を index で物理的に塞ぐ |
| recovery 手順 | 後続リクエストは route test T-R-07 のとおり 409 stable_key_collision で reject。クライアントは rollback runbook §B 相当の手動マージ判断を行う |
| evidence | `outputs/phase-11/manual-evidence.md` § Case 5 に staging で curl 並列 2 本送信した結果（1 本 200, 1 本 409）の log を記録 |

### Case 6: partial UNIQUE 除外条件メンテミス（`__extra__:` 形式変更時の silent drift）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | 将来 `__extra__:<questionId>` 命名規約が変更され（例: `__legacy__:` 追加）、partial UNIQUE WHERE 句のメンテが追従しない |
| 影響 | 変更後の暫定キーが UNIQUE 制約に引っかかり、本来許容すべき重複暫定行で migration / INSERT が失敗 |
| 検出方法 | T-W-02 / T-W-03（partial UNIQUE 除外条件の SQL レベル検証）を CI に組み込み、命名規約変更時に test 失敗で気付く |
| 予防策（本タスク） | Phase 2 db-constraint-design.md の Ownership 宣言で partial UNIQUE WHERE 句の更新責任 = UT-07B（同期 PR で更新）と固定。`aiworkflow-requirements/references/database-schema.md` 差分にも除外条件を明記 |
| recovery 手順 | partial UNIQUE を一旦 DROP（rollback runbook §A）→ WHERE 句を新規約に追従して CREATE UNIQUE INDEX 再適用 |
| evidence | `outputs/phase-11/manual-evidence.md` § Case 6 に partial UNIQUE WHERE 句の現行値を snapshot として記録（命名規約変更検知時の差分検出基点） |

## 異常検出マトリクス

| Case | サイレント度 | 検出層 | 対応 Phase | rollback 節 |
| --- | --- | --- | --- | --- |
| Case 1 | 顕在（migration abort） | DB | Phase 5 Step 0 | rollback §B |
| Case 2 | 半サイレント（status hang）| workflow | Phase 4 T-W-* + Phase 5 §D | rollback §D |
| Case 3 | 顕在（retry ループ）| Workers | Phase 11 T-S-03 | rollback §D + follow-up 起票 |
| Case 4 | サイレント（cursor ずれリスク） | DB / workflow | Phase 4 T-W-09 | rollback §D |
| Case 5 | 顕在（409） | DB / route | Phase 4 T-W-01 / T-R-07 | rollback §B |
| Case 6 | サイレント（規約 drift） | CI / migration | Phase 4 T-W-02/03 | rollback §A |

## 後続実装 Phase（Phase 8〜10）への引き渡し

- 各 Case の予防策が Phase 4 テストケース ID と紐付くため、実装時はそのテストを通すことで予防が達成される。
- recovery 手順は Phase 5 rollback runbook §A〜E に集約されているため、本 Phase はこれを参照するのみ。
- queue / cron 分離 follow-up 起票条件（Case 3）は Phase 11 実測結果に基づき Phase 10 ゲートで判定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-02.md` | 設計判断との紐付け |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-04.md` | テストケース ID（T-U/T-R/T-W/T-S）との紐付け |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-05.md` | rollback runbook §A〜E との紐付け |
| 必須 | `docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md` | 起票仕様 § 苦戦箇所 |
| 参考 | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/skill-feedback-report.md` | 既出 lessons learned |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | Case 1〜6 を 6 軸（条件 / 影響 / 検出 / 予防 / recovery / evidence）で記述 + 異常検出マトリクス |
| メタ | artifacts.json | Phase 6 状態の更新 |

## 多角的チェック観点

- **網羅性**: migration 失敗 / back-fill 中断 / CPU budget 超過 / D1 batch 失敗 / 同時 apply 競合 / 規約 drift の 6 カテゴリすべてが Case として独立に列挙されているか。
- **silent vs 顕在**: 各 Case のサイレント度が明示され、サイレント Case には CI / 計測ベースの検出手段が紐付いているか。
- **rollback 連結**: 全 Case の recovery が Phase 5 rollback runbook §A〜E のいずれかに紐付いているか。
- **evidence 予約**: 全 Case の evidence パスが `outputs/phase-11/manual-evidence.md` の節として予約されているか。
- **不変条件 #5**: 全 recovery 手順が `apps/api/**` + `scripts/cf.sh` 経由で完結し、`apps/web` から D1 を触る経路を含まないか。
- **follow-up 接続**: Case 3（CPU 恒常超過）が queue / cron 分離 follow-up タスク起票条件と整合しているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Case 1（migration 失敗）起草 | 6 | pending | rollback §B 連結 |
| 2 | Case 2（back-fill 中断）起草 | 6 | pending | rollback §D 連結 |
| 3 | Case 3（CPU budget 超過）起草 | 6 | pending | follow-up 起票条件連結 |
| 4 | Case 4（D1 batch 失敗）起草 | 6 | pending | 1 batch = 1 transaction 契約 |
| 5 | Case 5（同時 apply 競合）起草 | 6 | pending | 二段防御の物理証明 |
| 6 | Case 6（規約 drift）起草 | 6 | pending | partial UNIQUE WHERE 句メンテ |
| 7 | 異常検出マトリクス | 6 | pending | 6 Case × 4 列 |
| 8 | evidence パス予約 | 6 | pending | Phase 11 manual-evidence.md § Case 1〜6 |

## タスク 100% 実行確認【必須】

- 全実行タスク（5 件）が `spec_created` へ遷移
- Case 1〜6 が 6 軸（条件 / 影響 / 検出 / 予防 / recovery / evidence）で揃っている
- silent failure と顕在失敗の区別が明示
- 全 Case の recovery が rollback runbook §A〜E と紐付いている
- evidence パスが Phase 11 に予約されている
- artifacts.json の `phases[5].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 7（AC マトリクス）
- 引き継ぎ事項:
  - 6 異常 Case とその予防策（テストケース ID と紐付き）
  - recovery 手順（rollback runbook §A〜E と紐付き）
  - 異常検出マトリクス
  - Phase 11 evidence 予約パス（Case 1〜6 ごと）
- ブロック条件:
  - 6 カテゴリのいずれかが Case として欠落
  - silent / 顕在の区別が曖昧
  - recovery が rollback runbook と紐付いていない
  - evidence パスが Phase 11 で予約されていない

## 統合テスト連携

- 本 Phase の検証観点は `apps/api` 配下の unit / route / workflow integration test に接続する。
- D1 物理制約、`schema_aliases` write target、back-fill retry、NON_VISUAL evidence は Phase 4 / Phase 9 / Phase 11 で実測またはテスト証跡へ連結する。
