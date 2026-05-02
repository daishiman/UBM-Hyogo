# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 3 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 実行タスク

1. Phase 2 設計に対し代替案を 3 件以上比較する。
2. automation-30 の 3 系統思考法（システム系 / 戦略系 / 問題解決系）を適用してエレガンス検証を行う。
3. 4 条件評価を再実施し、Phase 4 進行可否を PASS / MINOR / MAJOR で判定する。

## 目的

Token スコープ最小化の設計が「広め Token / scope 別 Token / OIDC 連携」の代替案に対して優位であることを示し、ゲート判定を行う。

## 参照資料

- Phase 1 / Phase 2 成果物
- `index.md` / `artifacts.json`
- 並列タスク: U-FIX-CF-ACCT-02
- Cloudflare API Token Permissions Reference
- GitHub OIDC ↔ Cloudflare Trust Policy（参考）

## 代替案比較

### Option A（採用）: API Token を正本 4 種の必要最小権限に絞り、staging/prod で値分離

| 項目 | 内容 |
| --- | --- |
| 変更量 | Cloudflare Dashboard で Token 1 本の権限編集 + 値再発行 + Secret 更新（staging/prod） |
| セキュリティ | 漏洩時のブラスト半径を Workers/KV/D1/Pages の Edit までに限定 |
| 公式慣行 | wrangler-action README が必要権限を例示しており、本案はそれに整合 |
| 工数 | 中（Dashboard 操作 + smoke + 観測 24h） |
| 採用理由 | 既存運用との互換が高く、副作用が小さい。OIDC 移行の前段として最小コストで実現可能 |

### Option B（不採用）: 既存「Edit Cloudflare Workers」テンプレート Token を継続利用

| 項目 | 内容 |
| --- | --- |
| 変更量 | ゼロ |
| セキュリティ | 漏洩時 Account 全 Workers / KV を編集可能で影響範囲が過大 |
| 不採用理由 | priority HIGH の seed spec のリスク評価に反する。コストゼロでも「監査結果」として残せない |

### Option C（不採用）: 用途別に scope 別 Token を複数発行（D1 専用 / Workers 専用 / Pages 専用）

| 項目 | 内容 |
| --- | --- |
| 変更量 | 大（Secret を 3 本に分割、workflow yaml 側も step ごとに切替） |
| セキュリティ向上効果 | 部分的にはあるが、CI runner 上で同一プロセスから参照できるため実質的な分離効果は限定的 |
| 運用コスト | ローテーション頻度 ×3、レビュー・命名規約整備が増 |
| 不採用理由 | MVP 段階では過剰最適化。U-FIX-CF-ACCT-02 と合わせた ADR で将来課題化 |

### Option D（不採用・将来課題）: GitHub OIDC → Cloudflare Trust Policy 連携で Token を廃止

| 項目 | 内容 |
| --- | --- |
| 変更量 | 大（Cloudflare 側 Trust Policy 整備、wrangler-action 側 OIDC 入力対応の確認） |
| セキュリティ向上効果 | 大（長命 Token を廃止、短命 STS 風 token を都度発行） |
| 不採用理由 | wrangler-action v3 時点で OIDC ネイティブ対応が限定的。ADR で将来課題化し、Option A 完了後に再評価 |

## automation-30 思考法 3 系統適用

### システム系（System Thinking）

- Token は GitHub Actions と Cloudflare の境界に置かれる single point of compromise。境界に置く資格情報の権限を最小化することは「境界の薄壁化」に相当し、システム全体の脆弱性密度を下げる。
- 旧 Token を 24h 残す設計は「冗長なリンクを一時的に保持して切替リスクを吸収する」典型的な fail-safe パターンと整合。

### 戦略系（Strategic Thinking）

- 短期戦略（Option A）と長期戦略（Option D = OIDC）を分離し、ADR で両者の関係を明示することで「現在の最適解」と「将来の理想形」の両立を図る。
- Option C を将来オプションとして留めることで、漏洩時のインシデント対応が `Token 1 本ローテ` で済むメリットを優先する。

### 問題解決系（Problem Solving）

- 「Token 値が見えない」制約に対する解決策として、Cloudflare Dashboard の Token 詳細ページの権限名一覧（値は写さない）を Phase 11 evidence の正本にする。
- 「権限を削りすぎて deploy 失敗」リスクは staging 検証段階を T2 として明示することで吸収。

## レビュー観点

| 観点 | 判定 | コメント |
| --- | --- | --- |
| 価値性 | PASS | 漏洩時影響範囲の縮小は HIGH priority に値する |
| 実現性 | PASS | Cloudflare Dashboard 操作 + Secret 更新で完結 |
| 整合性 | PASS | Cloudflare 公式 / wrangler-action / scripts/cf.sh ルールと一致 |
| 運用性 | PASS | staging 検証 + rollback 経路で deploy 失敗を吸収 |
| 責務境界 | PASS | wrangler.toml warning 対応（U-FIX-CF-ACCT-02）と排他 |
| セキュリティ | PASS | 不要権限を 0 にし、staging/prod 値分離を ADR 化 |
| テスタビリティ | PASS | 三段検証（static / runtime / production）で網羅 |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | Option A の権限集合が wrangler-action 必要 API と矛盾なく対応 |
| 漏れなし | PASS | wrangler-action / D1 / Pages の 3 経路すべてに権限と検証コマンドが割当済み |
| 整合性 | PASS | 公式リファレンスと scripts/cf.sh 運用ルールに整合 |
| 依存関係整合 | PASS | 上流（FIX-CF-ACCT-ID-VARS-001）完了済み・並列（U-FIX-CF-ACCT-02）と ADR 共有 |

## 指摘事項

| Severity | 内容 | 対応 |
| --- | --- | --- |
| MINOR | OIDC 移行（Option D）が ADR で言及されるだけで具体タスク化されない | Phase 12 `unassigned-task-detection.md` で起票候補として記録 |
| MINOR | Token 命名規約（staging-prefix / prod-prefix）が現時点で曖昧 | Phase 5 ランブックで命名規則を明文化 |
| MAJOR | なし | - |

## ゲート判定

**PASS**: Phase 4 へ進行可。MINOR 指摘 2 件は Phase 5 / Phase 12 で吸収する。

## 完了条件

- [ ] 代替案が 3 件以上比較されている（Option A / B / C / D）
- [ ] 不採用理由が明記されている
- [ ] automation-30 の 3 系統が適用されている
- [ ] 4 条件評価が再評価され PASS で記録されている
- [ ] ゲート判定が PASS / MINOR / MAJOR で記録されている

## 成果物

- `outputs/phase-03/main.md`
