# Phase 6: 異常系（しきい値誤検知 / DLQ ゼロ件 / Paid 限定 / fixture 欠落 / op secret 失効 / index drift）

[実装区分: ドキュメントのみ]

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | schema alias back-fill Queue / DLQ 監視ダッシュボード整備 (issue-502) |
| GitHub Issue | #502（CLOSED 維持 / `Refs #502`） |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系 |
| 作成日 | 2026-05-07 |
| 前 Phase | 5（仕様 runbook 作成） |
| 次 Phase | 7（AC マトリクス） |
| 状態 | spec_created |
| タスク分類 | docs-only（failure-mode-analysis） |
| taskType | docs-only（CONST_004 例外適用） |
| visualEvidence | NON_VISUAL |
| 実装区分 | **ドキュメントのみ** |

## 目的

issue-502 は read-only D1 集計 SQL とドキュメント追記に閉じるが、**Cloudflare Queue Analytics の plan 依存**・**DLQ 投入が 0 件のときの観測手順検証不能**・**`last_error` の機微情報リスク**ゆえに固有の異常モードを持つ。本 Phase は 6 件の異常 Case を「発生条件 / 影響 / 検出方法 / 対処 / 記録形式」の 5 軸で文書化し、Phase 11 実施時に「想定外」が発生しないことを保証する。

## 完了条件チェックリスト

- [ ] Case 1〜6 が 5 軸（発生条件 / 影響 / 検出方法 / 対処 / 記録形式）で揃っている
- [ ] しきい値誤検知 / DLQ ゼロ件 / Cloudflare Paid 限定 / fixture 欠落 / op secret 失効 / skill index drift の 6 カテゴリが網羅されている
- [ ] 各 Case の対処が Phase 5 step sequence と紐付いている
- [ ] 機微情報混入 Case で「原文転記禁止 / 要約のみ」のルールが明記されている（Case 5 = op secret / Case はその他に派生）
- [ ] 不変条件への影響が「なし」と明記されている
- [ ] 4 条件評価が PASS 判定で根拠付き

## 異常 Case 一覧

### Case 1: しきい値誤検知（保守的しきい値で false positive）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | 初期しきい値（DLQ ≥ 1 / `retry_count` ≥ 3 / exhausted 24h）が運用実態より厳しく、正常な再試行を異常として検出する |
| 影響 | runbook を実行する運用者が頻繁に「要調査」を発動し、DLQ 監視に対する信頼が低下（オオカミ少年化） |
| 検出方法 | Phase 11 で `outputs/phase-11/aggregation.md` に「WARN 判定回数 / 実害件数」の比率を記録、WARN ≫ 実害なら誤検知と判定 |
| 対処 | (a) 初期は **保守的（厳しめ）** で運用、(b) staging で 7 日観測した上で `retry_count` の P95 / `exhausted` 滞留 P95 を見て調整、(c) しきい値変更は runbook §5 と skill references の両方を同時更新（DRY 違反防止）、(d) 緩和方向の変更は別 unassigned task として起票（本タスクで再調整しない） |
| 記録形式 | `aggregation.md` に「しきい値判定推移」表を追加（観測日 / 値 / 判定 / 実害有無）、references には WARN / PASS の総件数のみ記録 |

### Case 2: DLQ ゼロ件で観測手順検証不可

| 項目 | 内容 |
| --- | --- |
| 発生条件 | 集計 SQL #1（`failed_items_json IS NOT NULL`）の結果が 0 件 / Cloudflare DLQ も 0 件で、観測手順が「動いている」のか「サンプルが無いだけ」なのか区別不能 |
| 影響 | runbook §3〜§4 の手順が実観測で validate されないまま正本化され、本番異常時に手順が機能しないリスク |
| 検出方法 | Phase 11 step 3〜5 の SQL 結果がすべて 0 件 |
| 対処 | (a) 本タスクでは synthetic `INSERT` / `DELETE` を実行しない（AC-7 read-only と docs-only 境界を優先）、(b) `EXPLAIN QUERY PLAN` と count=0 の実行結果で「構文上成立 / 異常なし」を確認、(c) synthetic 検証が本当に必要な場合のみ CONST_005 に従い、理由・実施場所・実施時期を明記してユーザーへエスカレーションする |
| 記録形式 | `aggregation.md` に「DLQ 0 件 / synthetic mutation なし / read-only 構文検証で close」の行を追加 |

### Case 3: Cloudflare Queue Analytics が Workers Paid 限定

| 項目 | 内容 |
| --- | --- |
| 発生条件 | Cloudflare の plan 上、Queue Analytics（messages / dead-letters / retries の dash metrics）が Workers Paid plan 限定で本リポジトリの plan で表示されない |
| 影響 | runbook §3（Cloudflare dash 観測手順）が plan 依存で動かず AC-1 が部分達成にとどまる |
| 検出方法 | Phase 11 step 2 で `bash scripts/cf.sh whoami` 後に dash アクセスを試みた時点で plan 制限が判明 |
| 対処 | (a) Cloudflare dash 観測は **best-effort** とし、plan で見えない場合は runbook §3 に「plan 依存 / 表示不可時は §4 の D1 SQL のみで運用」を明記、(b) D1 集計 SQL 3 種（runbook §4）を **正本観測経路** として位置付け、dash は補助、(c) plan 昇格は本タスクのスコープ外として別 unassigned task で扱う |
| 記録形式 | `aggregation.md` に「Cloudflare Queue Analytics: 不可視（plan 制限）」行を追加、references の DLQ 監視 topic に「dash は補助 / D1 SQL が正本」を明記 |

### Case 4: fixture 欠落（ローカル D1 fixture で SQL 構文検証不可）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | ローカル / staging の `schema_diff_queue` に fixture がなく、`bash scripts/cf.sh d1 execute --command "..."` で「table is empty」または「no rows」を返し SQL の `julianday` / `CAST` 構文が validate されない |
| 影響 | SQL 構文ミスがあっても 0 件結果と区別できず、本番投入時に runtime error の可能性 |
| 検出方法 | Phase 9 品質保証で SQL 構文 grep + EXPLAIN を実施し、構文 OK でも fixture 0 件で empty result が返る状態を検知 |
| 対処 | (a) fixture 投入は本タスクのスコープ外（docs-only / read-only 境界を優先）、(b) 代替として SQL 文を `EXPLAIN QUERY PLAN` で wrap し構文だけ validate、(c) `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "EXPLAIN QUERY PLAN <SQL>;"` で plan が返れば構文 PASS、(d) Phase 11 で構文確認だけ行い、データ検証は Case 2 の count=0 close と統合 |
| 記録形式 | `outputs/phase-11/sql-explain.log` に EXPLAIN 結果を保存、`aggregation.md` に「構文 PASS / データ検証 deferred」を 1 行明記 |

### Case 5: op secret 失効（`scripts/cf.sh` 経由の `CLOUDFLARE_API_TOKEN` が 1Password で失効）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `scripts/cf.sh whoami` または `scripts/cf.sh d1 execute` 実行時に `op run --env-file=.env` 経由で 1Password から取得する `CLOUDFLARE_API_TOKEN` が失効 / 権限不足で 401 / 403 を返す |
| 影響 | step 2〜5 がすべて実行不能。runbook 検証 / 集計 SQL 取得が完全停止 |
| 検出方法 | `bash scripts/cf.sh whoami` の exit code 非ゼロ + stderr に `unauthorized` / `forbidden` |
| 対処 | (a) 1Password で token を再発行し vault を更新、(b) `.env` の `op://...` 参照は変更しない（実値を `.env` に書かない不変条件遵守）、(c) 再発行後に `bash scripts/cf.sh whoami` で 200 を確認してから再開、(d) **token 値・stderr の生メッセージを runbook / references / commit message に転記しない**（CLAUDE.md「シークレット管理 / AI 学習混入防止」） |
| 記録形式 | `aggregation.md` に「op secret 再発行 by <date>」行を 1 行追加（token 値は記載しない）、redaction-grep 対象として再 scan |

### Case 6: skill index drift（`pnpm indexes:rebuild` で diff 発生）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | step 8 で references に DLQ 監視 topic を追加した後、`pnpm indexes:rebuild` で `topic-map.md` / `keywords.json` / `quick-reference.md` / `resource-map.md` のいずれかに drift が残る |
| 影響 | AC-6 が FAIL。CI 側の `verify-indexes-up-to-date` gate が fail し PR が merge 不可 |
| 検出方法 | `git status .claude/skills/aiworkflow-requirements/indexes/` で uncommitted diff |
| 対処 | (a) drift をそのまま commit に含める、(b) 不整合（手動編集の topic-map と generator 出力が衝突）の場合は手動編集を破棄して generator 出力を採用、(c) Phase 9 品質保証で再 rebuild → drift 0 を必須ゲート化、(d) 再発時は `references/dlq-monitoring.md` の見出し / フロントマターが index generator の規約と整合しているか確認（exemplar: 既存 `references/deployment-gha.md` 等と同じ構造に揃える） |
| 記録形式 | `outputs/phase-12/skill-references-diff.md` に drift 解消の trace（rebuild 前 / 後の diff 要約）を 1 段落で記録 |

## 異常検出マトリクス

| Case | 検出層 | 検出 step | 影響 AC | 対処 Phase |
| --- | --- | --- | --- | --- |
| Case 1: しきい値誤検知 | 運用観測 | step 6（aggregation） | AC-3 | Phase 11 で WARN/実害比を記録、別 issue で再調整 |
| Case 2: DLQ ゼロ件 | jq / SQL 結果 | step 3〜5 | AC-2 | Phase 11 で「DLQ 0 件 / synthetic mutation なし / read-only 構文検証で close」明記 |
| Case 3: Paid 限定 | dash アクセス | step 2 | AC-1 | runbook §3 に plan 依存注記、§4 を正本化 |
| Case 4: fixture 欠落 | SQL 結果 | step 3〜5 | AC-7 | EXPLAIN QUERY PLAN で構文のみ validate |
| Case 5: op secret 失効 | `cf.sh` exit code | step 2 | AC-1, AC-2, AC-7 | 1Password 再発行、token 値転記禁止 |
| Case 6: index drift | `pnpm indexes:rebuild` | step 9 | AC-6 | Phase 9 で必須ゲート化、rebuild 出力採用 |

## skill references / runbook への記録形式まとめ

| Case | references / runbook への記録 | 記録粒度 |
| --- | --- | --- |
| Case 1 | runbook §5 にしきい値推移表 / references には WARN/PASS 件数のみ | 数値のみ |
| Case 2 | aggregation.md に deferred 行 / references には記録しない | 後続 issue 番号のみ |
| Case 3 | references に「dash は補助 / D1 SQL が正本」明記 | 経路優先順位のみ |
| Case 4 | aggregation.md に「構文 PASS / データ検証 deferred」 | 1 行 |
| Case 5 | aggregation.md に「op secret 再発行」記録 / token 値は転記禁止 | 日付のみ |
| Case 6 | `outputs/phase-12/skill-references-diff.md` に drift 解消 trace | diff 要約 |

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | CLAUDE.md 全項目 | **影響なし** | 全 Case がドキュメント追記 / read-only D1 SQL / 1Password 経路維持で完結。schema 変更 / Forms 変更 / GAS 昇格 / `apps/web` 直接 D1 アクセスはいずれも発生しない |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 6 Case の検出 / 対処 / 記録形式が固定され、後続実行者が想定外なく Phase 11 を完遂できる |
| 実現性 | PASS | 全 Case の検出が `bash scripts/cf.sh` / `jq` / `rg` / `git status` のみで完結 |
| 整合性 | PASS | 全 Case の対処が Phase 5 step 1〜9 と紐付き、references 記録形式が step 8 のセクション構造を拡張する形で整合。CONST_004 例外（docs-only）と整合 |
| 運用性 | PASS | DLQ 0 件 / Paid 制限 / op secret 失効など「異常ではないが明示すべき状態」も含めて記録形式が確定 |

## 受入条件（AC）

本 Phase は **AC-1（観測手順）/ AC-2（SQL）/ AC-6（index drift）/ AC-7（read-only）** の異常モード視点裏付けを担う。AC-3 / AC-4 / AC-5 についても異常時の代替記録形式を定義する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/phase-05.md` | step sequence 連結 |
| 必須 | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` § 7. リスクと対策 | リスク正本 |
| 参考 | CLAUDE.md § シークレット管理 | op secret 失効時の運用ポリシー |
| 参考 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-06.md` | 異常系フォーマット exemplar |

## 苦戦箇所【記入必須】

- 「DLQ ゼロ件」（Case 2）と「fixture 欠落」（Case 4）は表面的に同じ「結果 0 件」だが、Case 2 は **観測対象が無い**、Case 4 は **観測手段が validate されない** という別事象。本 Phase では aggregation.md の記録粒度を分け、Case 2 = synthetic deferred / Case 4 = EXPLAIN による構文のみ validate、と切り分けた
- Case 5（op secret 失効）の対処に「token 値を転記しない」を入れる必要がある。stderr の生メッセージに token 断片が含まれる可能性があるため、Phase 9 redaction grep の対象を `last_error` に限定せず `cf.sh` の stderr ログ全体に拡張する方針を引き継ぎ事項に含めた

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-06/failure-cases.md` | Case 1〜6 を 5 軸で記述 + 異常検出マトリクス + 記録形式まとめ |
| メタ | `artifacts.json` | Phase 6 状態の更新 |

## 次 Phase への引き渡し

- 次 Phase: 7（AC マトリクス）
- 引き継ぎ事項:
  - 6 異常 Case と検出 step / 対処
  - references / runbook への記録形式（Case ごと）
  - redaction grep を `cf.sh` stderr にも拡張する方針
  - 不変条件への影響「なし」
- ブロック条件:
  - 6 カテゴリのいずれかが Case として欠落
  - op secret / token 値の「原文転記禁止」ルールが欠落
  - DLQ 0 件 / fixture 欠落の補完記録形式が欠落

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として D1 SQL の read-only grep 検証、redaction grep、`pnpm indexes:rebuild` drift 0、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
