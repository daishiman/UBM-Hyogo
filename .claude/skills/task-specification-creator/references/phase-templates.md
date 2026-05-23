# Phase別テンプレートリファレンス（インデックス）

> 読み込み条件:
> `phase-*.md` を新規作成または大幅更新する時。

## family 構成

| file | 対象 | 役割 |
| --- | --- | --- |
| [phase-template-core.md](phase-template-core.md) | Phase 1-3 | 成果物配置ルール・変数一覧・共通ルール・要件定義/設計/レビューの共通構造 |
| [phase-template-execution.md](phase-template-execution.md) | Phase 4-10 | テスト、実装、品質、最終レビュー |
| [phase-template-phase1.md](phase-template-phase1.md) | Phase 1 | 要件定義テンプレート・P50チェック |
| [phase-template-phase8-10.md](phase-template-phase8-10.md) | Phase 8-10 | リファクタリング・品質保証・最終レビューゲート。IPC契約ドリフト検証を含む |
| [phase-template-phase11.md](phase-template-phase11.md) | Phase 11 | manual walkthrough と screenshot evidence。種別判定（設計/docs-only/UI）を含む |
| [phase-template-phase11-detail.md](phase-template-phase11-detail.md) | Phase 11 | 詳細テンプレート。インタラクション状態テーブル・N/A理由テーブル・完了条件詳細 |
| [phase-template-phase12.md](phase-template-phase12.md) | Phase 12 | 設計タスク向け補足（SF-02, SF-03）・未タスク配置先・ファイル名照合チェック |
| [phase-template-phase12-detail.md](phase-template-phase12-detail.md) | Phase 12 | 詳細テンプレート。5タスク全体の手順・成果物・完了条件・漏れやすいポイント |
| [phase-template-phase13.md](phase-template-phase13.md) | Phase 13 | user approval と PR blocked ルール |
| [phase-template-phase13-detail.md](phase-template-phase13-detail.md) | Phase 13 | 詳細テンプレート。変更サマリー・PR作成・CI確認・タスク完了処理・変数一覧 |

## artifact rotation 4段テンプレ

> 出典: [docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-12/skill-feedback-report.md](../../../../docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-12/skill-feedback-report.md)（Issue #587、親 #549）の Step 1-H で promote 判定された派生テンプレ。
>
> 適用対象: ML artifact / schema model / RAG index など、production への段階投入が必要な artifact のローテーション設計。Phase 5（テスト設計）/ Phase 6（実装）に canary workflow（GitHub Actions `workflow_dispatch` + op 参照 input）を組み込む際に参照する。
>
> 不変条件（forward-safe rollback 原則）:
> - **D1 schema は drop しない**。previous artifact path（`PROD_PREVIOUS`）を vault に保持し、production 切替後も最低 1 世代は退避しておく。
> - candidate / canary / promotion / rollback の各段で evidence を `outputs/phase-11/` 配下に canonical path で残す。
> - 各段の昇格には user approval（Gate-R0..R3）を必須とし、CI 自動 promote を行わない。

### 段階テンプレ

| 段階 | gate | 入力 | 出力 | ゲート条件 | evidence 必須事項 |
| --- | --- | --- | --- | --- | --- |
| candidate | Gate-R0（local canary） | 新 artifact 候補（local build / hash 計算済み） | `op://…/CANDIDATE` への投入、local smoke 結果 | local smoke green、hash / size / schema diff 記録 | candidate hash、local smoke log、schema diff JSON |
| canary | Gate-R1（staging canary） | candidate vault 参照、staging deploy target | staging deploy 後の health check / metrics 抜粋 | staging error rate < SLO、redaction-check / DLQ 監視 green、3-fence detection 通過 | canary workflow run URL、staging metrics snapshot、failure rate gate JSON |
| promotion | Gate-R2（production candidate）→ Gate-R3（production promotion） | staging green な candidate、`op item edit` 退避 script | `op://…/PROD_PREVIOUS` への退避 + `PROD` 更新、production deploy | R2: production 投入直前 dry-run green、R3: production smoke green かつ post-release-dashboard green | op vault lifecycle log、production smoke log、post-release-dashboard 30day-contract |
| rollback | （任意発火・user approval 必須） | `PROD_PREVIOUS` vault 参照 | `PROD` を previous 値で再上書き | forward-safe 原則: D1 schema 列を drop しない、previous path を再利用するのみ | rollback workflow run URL、rollback 後 smoke log、incident report リンク |

### canary workflow テンプレ（Phase 5/6）

- `.github/workflows/<artifact>-canary.yml` を `workflow_dispatch` 起動とし、input は op 参照（`op://Vault/Item/Field`）のみを受け取る。実値は GitHub Secrets 側に保持し、workflow log に出力しない。
- canary job は staging deploy → smoke → metrics 収集まで 1 ジョブで完結させ、production promotion は別 workflow（`promotion.yml`）として分離する。
- 失敗時は自動 rollback せず、Gate-R0..R3 のいずれかに戻して user approval を待つ。
- 横展開先: schema model / RAG index / 任意の external-time-dependent artifact。各 artifact ごとに canonical path（`phase11-evidence-canonical-paths.json`）を予約する。

## 変更履歴

| Date | Changes |
| --- | --- |
| 2026-03-12 | 1818行の monolith から family file 構成へ再編 |
| 2026-04-07 | 1247行の monolith から family file 構成へ再分割（インデックスに縮小） |
| 2026-05-10 | artifact rotation 4段テンプレ（candidate/canary/promotion/rollback）を追加（Issue #587 promote 反映） |
