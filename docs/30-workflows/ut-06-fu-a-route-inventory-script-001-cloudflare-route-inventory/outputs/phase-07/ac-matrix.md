# Phase 7 成果物: AC-1〜AC-5 × test / カバレッジ対応表

> Phase 1 で確定した受入基準 AC-1〜AC-5 と、Phase 4 (UT/CT/ST) / Phase 6 (EX) / Phase 7 (TC-INT) / Phase 3 (NG) のトレースを一覧化する。
> 本 matrix は受け側実装タスクの test 着手・PR review・Phase 10 GO/NO-GO 判定で参照される。

## 受入基準（再掲）

| AC | 内容 |
| --- | --- |
| **AC-1** | inventory が JSON / Markdown 両形式で出力され、各 entry に最低限 4 field（`pattern` / `targetWorker` / `zone` / `source`）を含む |
| **AC-2** | `expectedWorker = "ubm-hyogo-web-production"` を指さない route / custom domain は `mismatches` 配列として entries 本体と分離。`mismatches` = 0 件が production deploy 承認の前提 |
| **AC-3** | secret 値・Cloudflare API Token・OAuth Token が出力 JSON / Markdown / 標準出力 / 標準エラー / コミット対象に一切現れない（`grep` gate で検証） |
| **AC-4** | script は完全 read-only。Cloudflare API mutation endpoint（`POST` / `PUT` / `PATCH` / `DELETE`）を呼ばない（API endpoint allowlist で検証） |
| **AC-5** | 実行は `bash scripts/cf.sh` ラッパー経由のみ。`wrangler` 直接呼び出し / `wrangler login` / `.env` 実値の Read を一切含まない |

## AC × test ID トレース表

| AC | unit (UT) | contract (CT) | safety (ST) | abnormal (EX) | integration (TC-INT) | NO-GO (NG) |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | UT-06, UT-08 | CT-01, CT-03, CT-04 | — | — | TC-INT-01 | NG-4 |
| AC-2 | UT-03, UT-04 | CT-01 | — | EX-3 | TC-INT-02, TC-INT-03 | NG-4 |
| AC-3 | UT-07 | — | ST-01 | EX-5 | secret-leak grep（4 正規表現） | NG-3 |
| AC-4 | UT-01, UT-02 | — | ST-02 | EX-4 | TC-INT-04, TC-INT-05, TC-INT-06 | NG-1 |
| AC-5 | UT-01 | — | ST-03 | — | （test 内 `cf.sh` 直接呼び出し禁止 / 実打ちは Phase 8 のみ） | NG-2, NG-5 |

## カバレッジ判定

| AC | カバレッジ | 根拠 |
| --- | --- | --- |
| AC-1 | ✅ 完全カバー | UT-06（writer 両形式）+ CT-03/CT-04（schema / 列順）+ TC-INT-01（fixture → 期待出力） |
| AC-2 | ✅ 完全カバー | UT-03/UT-04（detector 双方向）+ TC-INT-02/03（split-brain / custom domain target missing） |
| AC-3 | ✅ 完全カバー | UT-07 + ST-01 + secret-leak grep 4 種正規表現 + EX-5（混入時破棄経路） |
| AC-4 | ✅ 完全カバー | UT-01/UT-02（GET allowlist）+ ST-02 + TC-INT-04〜06（401/429/不在系の error 伝播） |
| AC-5 | ✅ 完全カバー | UT-01（GET only）+ ST-03（`wrangler` 直叩き grep）+ runbook spec（`bash scripts/cf.sh` 経由のみ） |

## test ID × NO-GO 軸（3 つの NO-GO 軸対応）

phase-07.md で固定された **wrangler / secret / mutation の 3 つの NO-GO 軸** に対する test 配置:

| NO-GO 軸 | NG | 一次 gate (test) | 二次 gate (grep / runbook) |
| --- | --- | --- | --- |
| `wrangler` 直叩き | NG-2 | ST-03 | runbook §3.3 grep gate |
| secret 漏洩 | NG-3 | ST-01 / UT-07 | runbook §3.1 grep gate（4 正規表現） |
| mutation method 呼び出し | NG-1 | ST-02 / UT-01 / UT-02 | runbook §3.2 grep gate |

## カバレッジ閾値の取り扱い

- 本タスクは **docs-only**。受け側実装タスク（実 test code 生成）で line / branch coverage を測る。
- 本 matrix は **「AC が設計章で完全カバーされる」ことを示す AC matrix** であり、Phase 2 の「テスト系縮退方針」表に従い数値カバレッジ閾値は規定しない。

## production / staging 実打ち境界（再掲）

| 検証層 | 実打ちの有無 | 備考 |
| --- | --- | --- |
| unit (UT) | なし | `vi.mock` / `vi.spyOn` |
| contract (CT) | なし | schema validation |
| safety (ST) | なし | grep / fixture |
| abnormal (EX) | なし | mock |
| integration (TC-INT) | **なし** | API mock のみ。`bash scripts/cf.sh` も test 内呼び出しなし |
| smoke (Phase 8) | あり（read-only / 1 回手動） | `bash scripts/cf.sh` 経由のみ |
| evidence (Phase 11) | あり（手動） | mask 済 JSON / Markdown を添付 |

## 完了条件

- [x] AC-1〜AC-5 すべてに 1 件以上の test ID が割当て済
- [x] AC × (UT / CT / ST / EX / TC-INT / NG) のトレース表が完成
- [x] 3 つの NO-GO 軸（wrangler / secret / mutation）が一次 gate / 二次 gate で二重化
- [x] production / staging 実打ち境界が本 matrix で明示

## 引き継ぎ

- 受け側実装タスク: 本 matrix を test 設計の checklist として取り込み、各 test ID に実コードを割り当てる
- Phase 10 GO/NO-GO: 本 matrix の各セルが PASS / 0 件 grep で埋まったことを承認根拠に使用
