# UT-05 Follow-up 004: Environment Secret 上書き監査

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-05-followup-004 |
| タスク名 | Environment Secret 上書き監査 |
| 優先度 | LOW |
| 推奨 Wave | secrets rotation 周期に合わせ 90 日ごと |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 種別 | security |
| 由来 | UT-05 Phase 6 A-18 / Phase 7 §8 |
| 依存 | secrets rotation runbook, 04-serial-cicd-secrets-and-environment-sync |

## 目的

GitHub Environment Secrets の `staging` / `production` 値が、運用ミスや誤コピーにより意図せず同一化していないかを定期的に確認する手順を作る。同一化していると staging の検証が production の安全性を保証しなくなる（環境分離の前提が崩れる）ため、90 日 rotation と同時に検知できる仕組みを整える。

## スコープ

### 含む

- Environment Secrets の棚卸し対象一覧（`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / 他 secrets matrix 記載分）
- 値そのものをログ・成果物に出さない監査方式（ハッシュ比較方式）の設計
- staging / production 同一値検知ロジックの仕様
- 90 日 rotation runbook への組み込み手順
- 監査結果の記録先（incident log / rotation log）と保存期間

### 含まない

- secrets 値そのものの rotation 実行（rotation runbook の責務）
- Cloudflare Secrets（Workers binding）の監査（本タスクは GitHub Environment Secrets のみ）
- 1Password Environments の正本側監査（secrets-management 正本に委譲）
- アクセス権限監査（環境別 reviewer 設定は 01a の責務）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04-serial-cicd-secrets-and-environment-sync | secrets-placement-matrix.md が確定している必要がある |
| 上流 | secrets rotation runbook | 90 日サイクルの正本が存在する必要がある |
| 並走 | UT-05 followup-003 | token rotation 時の billing 取得 token 整合性確認 |
| 下流 | incident response runbook | 同一化検知時のエスカレーション経路 |

## 苦戦箇所・知見

**secret 値そのものをログ化しない監査の実装難所**: GitHub Actions の `secrets.*` 参照は自動マスクされるが、`echo "$SECRET" | sha256sum` のように加工した値も masking 対象になる場合がある（GitHub 側の masking 判定が partial match で発火する）。SHA-256 ハッシュの先頭 8 文字のみを比較に使う、または `::add-mask::` で明示マスクしてから比較する等、出力に値が漏れない設計が必要。テスト時に誤って実値が log に出ると revoke + re-issue が必要になり、secret rotation コストが跳ねる。

**staging/production 同一値検知のロジック**: 単純な「ハッシュが一致したら同一」では false positive がある。例えば `CLOUDFLARE_ACCOUNT_ID` は本来 staging/production で同一値（同一アカウントを共有）であるべき secret なので、検知対象から除外する必要がある。secrets-placement-matrix.md に「環境別必須」「環境共通許容」のフラグを追加し、検知ロジックがそれを参照する設計にする。

**GitHub API での Environment Secrets 取得制限**: Environment Secrets は API 経由で値を取得できない（write only）。値を比較するには「同じ workflow run 内で両 environment の secret を参照してハッシュ化」する必要がある。これには `environment:` ブロックを跨ぐ job が必要だが、1 job は 1 environment しか指定できないため、(a) 2 つの job を建て、それぞれが artifact としてハッシュをアップロード→3 つ目の job で比較、という 3 段構成が必須。

**監査の自動化と承認フローの両立**: 監査 workflow を自動 trigger（schedule）にすると、production environment への job 起動も自動化されるため、production environment の reviewer 設定を bypass する経路を作ってしまう。reviewer 0 名運用なら問題ないが、将来 reviewer を追加した際に監査が止まるリスクがある。監査専用の environment（`audit-readonly`）を新設し、両 secret を read-only で参照可能にする設計が安全。

**90 日 rotation との同時実施**: rotation 直後はハッシュが当然変わるため、「rotation 完了後すぐに監査を回す」運用ルールにしないと、検知の意味が薄れる。rotation runbook の最終ステップとして監査 workflow の `workflow_dispatch` を組み込むこと。

## 受入条件

- [ ] Environment Secrets の棚卸し対象一覧と「環境別必須 / 環境共通許容」フラグが記録されている
- [ ] 値そのものをログ・artifact・成果物に出さない監査方式（ハッシュ比較 + masking）が定義されている
- [ ] staging / production 同一値検知のロジックと false positive 除外ルールが明文化されている
- [ ] 90 日 rotation runbook の最終ステップに監査 workflow 起動が組み込まれている
- [ ] 監査結果の記録先と保存期間が定義されている
- [ ] 検知時のエスカレーション経路（incident response）が記録されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-05-cicd-pipeline/phase-06.md | A-18 異常系・回帰 guard の根拠 |
| 必須 | docs/30-workflows/ut-05-cicd-pipeline/phase-07.md | §8 secrets スコープ整合性 |
| 必須 | docs/30-workflows/ut-05-cicd-pipeline/outputs/phase-12/unassigned-task-detection.md | 由来記録 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | secrets 配置正本 |
| 参考 | https://docs.github.com/en/actions/security-guides/encrypted-secrets | GitHub Secrets masking 仕様 |
