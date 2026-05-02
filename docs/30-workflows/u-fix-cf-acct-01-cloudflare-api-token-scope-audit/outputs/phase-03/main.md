# Phase 3: 設計レビュー — 代替案比較とゲート判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 3（設計レビュー） |
| 状態 | spec_created → planned |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 上流 | Phase 1 / Phase 2 成果物 |

## 1. 目的

Phase 2 で確定した Token スコープ最小化設計が、代替案
「広め Token / scope 別 Token / OIDC 連携」に対して **設計上優位** であることを根拠付きで示し、
Phase 4 進行可否を **PASS / MINOR / MAJOR** で判定する。

## 2. 代替案比較

### Option A（採用）: API Token を正本 4 種の必要最小権限に絞り、staging/prod で値分離

| 項目 | 内容 |
| --- | --- |
| 変更量 | Cloudflare Dashboard で 2 本の Token を最小権限で発行 + GitHub Environment Secret 更新（staging/prod 各 1 回） |
| セキュリティ | 漏洩時のブラスト半径を **Workers Scripts:Edit / D1:Edit / Pages:Edit / Account Settings:Read の 4 権限内** に限定 |
| 公式慣行 | wrangler-action README が必要権限を例示しており、本案はそれに整合 |
| 工数 | 中（Dashboard 操作 + staging 三段検証 + 24h 観測） |
| 採用理由 | 既存運用との互換が高く、副作用が小さい。OIDC 移行（Option D）の前段として最小コストで実現可能 |
| 判定 | **採用** |

### Option B（不採用）: 既存「Edit Cloudflare Workers」テンプレート Token を継続利用

| 項目 | 内容 |
| --- | --- |
| 変更量 | ゼロ |
| セキュリティ | 漏洩時 Account 全 Workers / KV を編集可能で影響範囲が過大。Pages / D1 はテンプレートに含まれないため、現行 Token はテンプレ + Custom 拡張の可能性が高い（監査結果は Phase 11 で実測） |
| 監査追跡性 | 「監査結果」として残せない（priority HIGH の seed spec 要件に反する） |
| 不採用理由 | priority HIGH のリスク評価に反する。コストゼロでも本タスクの存在意義（最小化と評跡）を満たさない |
| 判定 | **不採用** |

### Option C（不採用）: 用途別に scope 別 Token を複数発行（D1 専用 / Workers 専用 / Pages 専用）

| 項目 | 内容 |
| --- | --- |
| 変更量 | 大（GitHub Environment Secret を 3 本に分割: `CF_TOKEN_D1` / `CF_TOKEN_WORKERS` / `CF_TOKEN_PAGES`、workflow yaml の step ごとに参照切替） |
| セキュリティ向上効果 | 部分的にはあるが、CI runner 上で同一プロセス（同一 job）から参照できる構造のため実質的な分離効果は限定的 |
| 運用コスト | ローテーション頻度 ×3、命名規約・レビュー観点が増。発行直後 1 度しか平文表示できない制約が 3 倍になる |
| 不採用理由 | MVP 段階では過剰最適化。Option A 完了後に scope 拡大が観測された場合のみ再評価。U-FIX-CF-ACCT-02 と合わせた ADR で将来課題化 |
| 判定 | **不採用（将来候補）** |

### Option D（不採用・将来課題）: GitHub OIDC → Cloudflare Trust Policy 連携で API Token を廃止

| 項目 | 内容 |
| --- | --- |
| 変更量 | 大（Cloudflare 側 Trust Policy 整備、wrangler-action 側 OIDC 入力対応の確認、Account ID / Workspace 整合の再設計） |
| セキュリティ向上効果 | 大（長命 Token を廃止、短命 STS 風 token を都度発行、漏洩時の window が分単位） |
| wrangler-action v3 サポート | 限定的（Token を主軸とした入力構造、OIDC ネイティブ対応はまだ十分でない） |
| 不採用理由 | wrangler-action v3 の OIDC ネイティブ対応が成熟していない時点で導入すると、回避ロジック（OIDC → STS → Token 短命発行）の追加実装が必要。Option A 完了後に再評価 |
| 判定 | **不採用（将来課題、Phase 12 で起票候補として記録）** |

## 3. automation-30 思考法 3 系統適用

### 3.1 システム系（System Thinking）

- Token は GitHub Actions と Cloudflare の **境界に置かれる single point of compromise**。境界に置く資格情報の権限を最小化することは「境界の薄壁化」に相当し、システム全体の脆弱性密度を下げる。
- 旧 Token を T2〜T5 で 24h 残す設計は「**冗長なリンクを一時的に保持して切替リスクを吸収する**」典型的な fail-safe パターンと整合し、デプロイパイプラインの可用性とセキュリティのトレードオフを最適化する。
- 環境分離（staging Environment Secret / production Environment Secret）と Token 値分離の二重化により、staging 漏洩時に production が影響を受けない構造を作る。

### 3.2 戦略系（Strategic Thinking）

- 短期戦略（Option A: 最小権限 Token + 値分離）と長期戦略（Option D: OIDC）を分離し、ADR で両者の関係を明示することで「**現在の最適解**」と「**将来の理想形**」の両立を図る。
- Option C を将来オプションとして留めることで、漏洩時のインシデント対応が `Token 1 本ローテ` で済むメリットを優先する（運用シンプリシティ vs 細粒度分離のトレードオフ判断）。
- U-FIX-CF-ACCT-02 と ADR を共有することで、CI/CD 周辺の意思決定が散逸しないようにする。

### 3.3 問題解決系（Problem Solving）

- 「Token 値が見えない」制約に対する解決策として、Cloudflare Dashboard の Token 詳細ページの **権限名一覧（値は写さない）** を Phase 11 evidence の正本にする。
- 「権限を削りすぎて deploy 失敗」リスクは、staging を T2 として明示し、`--dry-run` 系の非破壊検証で吸収する。Phase 2 §3.2 の追加候補（KV / User Details）昇格手順を Phase 6 異常系に引き継ぐ。
- 「旧 Token を失念」リスクには、Phase 5 ランブックで Cloudflare Dashboard 上に旧 Token を 24h 残す手順を明示し、人為記録を排除した状態で安全に切替えられるようにする。

## 4. レビュー観点

| 観点 | 判定 | コメント |
| --- | --- | --- |
| 価値性 | PASS | 漏洩時影響範囲の縮小は priority HIGH に値する。監査可能性の向上が ADR 化で文書化される |
| 実現性 | PASS | Cloudflare Dashboard 操作 + Secret 更新で完結、追加実装不要 |
| 整合性 | PASS | Cloudflare 公式 Permissions Reference / wrangler-action README / `scripts/cf.sh` 運用ルールと一致 |
| 運用性 | PASS | staging 三段検証 + R1〜R5 rollback で deploy 失敗を吸収。24h 観測が手順に組み込まれている |
| 責務境界 | PASS | wrangler.toml warning 対応（U-FIX-CF-ACCT-02）と排他、`apps/web` D1 直接アクセスを生まない |
| セキュリティ | PASS | 不要権限を 0 にし、staging/prod 値分離を ADR 化、Token 値の人手記録を全面禁止 |
| テスタビリティ | PASS | 三段検証（static / runtime / production）で網羅、各 AC に検証コマンドを割当 |
| 不変条件遵守 | PASS | 不変条件 #5 を侵害しない（Phase 1 §10 / Phase 2 §10） |

## 5. 4 条件評価（再評価）

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | Option A の権限集合（Phase 2 §3.1）が wrangler-action / D1 migration / Pages deploy の必要 API と矛盾なく対応。staging 先行 → production の順序が CLAUDE.md ブランチ戦略（dev → main）と矛盾しない |
| 漏れなし | PASS | wrangler-action / D1 / Pages の 3 経路すべてに権限と検証コマンドが割当済み（Phase 2 §3 / §6）。AC-1〜12 がすべてどこかの Phase 2 セクションに紐付く |
| 整合性 | PASS | 公式リファレンス・wrangler-action README・`scripts/cf.sh` 運用ルールに整合。ADR 配置は Phase 12 ガイドと整合 |
| 依存関係整合 | PASS | 上流（FIX-CF-ACCT-ID-VARS-001）完了済み・並列（U-FIX-CF-ACCT-02）と ADR 共有のみで blocking なし。下流（main 本番デプロイ）は Phase 11 で green 確認 |

## 6. 指摘事項

| Severity | 内容 | 対応先 |
| --- | --- | --- |
| MINOR-1 | OIDC 移行（Option D）が ADR で言及されるだけで具体タスク化されない | Phase 12 `unassigned-task-detection.md` で起票候補として記録 |
| MINOR-2 | Token 命名規約（`ubm-{staging|production}-YYYYMMDD`）が Phase 2 §9 に置かれるが、Phase 5 ランブックでの実行タイミング・ハンドラが暗黙 | Phase 5 ランブックで命名規則の適用タイミング（T0 発行時）を明文化 |
| MINOR-3 | §3.2 追加候補（KV / User Details）の昇格判定が Phase 6 任せになっている | Phase 6 異常系で「昇格判定フロー」を明示するよう引き継ぎ |
| MAJOR | なし | - |

## 7. ゲート判定

**PASS（Phase 4 へ進行可）**

- 採用方針（Option A）は 4 条件評価すべて PASS、レビュー観点 8 項目すべて PASS。
- MAJOR 指摘なし。MINOR 指摘 3 件は Phase 5 / Phase 6 / Phase 12 で吸収する明確な引き継ぎ先を持つ。
- AC-1〜AC-12 のうち、Phase 1 / Phase 2 で完結する AC（AC-1, AC-2, AC-6, AC-7, AC-9, AC-10, AC-11）はすべて満たす設計が確定。Phase 11 完結 AC（AC-3, AC-4, AC-5, AC-8, AC-12）は実測に向けた手順が用意されている。

## 8. AC マッピング（Phase 3 で再確認）

| AC | レビュー観点による再確認 |
| --- | --- |
| AC-1 | §4 セキュリティ PASS、§2 Option A 採用根拠 |
| AC-2 | §4 整合性 PASS、Phase 2 §3.1 が wrangler-action README 整合 |
| AC-3〜AC-5 | §4 テスタビリティ PASS（実測は Phase 11） |
| AC-6 / AC-7 | §4 運用性 PASS（Phase 2 §4 / §5 の図解と rollback） |
| AC-8 | §3.3 問題解決系で Token 値非記録方針を再確認 |
| AC-9 | §4 不変条件遵守 PASS |
| AC-10 | §6 MINOR-1 経由で U-FIX-CF-ACCT-02 と整合（ADR 共有） |
| AC-11 | §5 4 条件評価 PASS |
| AC-12 | §4 セキュリティ PASS（Phase 2 §6.1 Static 検証で実測） |

## 9. 完了条件

- [x] 代替案が 3 件以上比較されている（Option A / B / C / D の 4 件）
- [x] 不採用理由が明記されている（§2 Option B / C / D）
- [x] automation-30 の 3 系統が適用されている（§3.1 / §3.2 / §3.3）
- [x] 4 条件評価が再評価され PASS で記録されている（§5）
- [x] ゲート判定が PASS / MINOR / MAJOR で記録されている（§7、PASS + MINOR-1〜3、MAJOR なし）

## 10. 成果物

- 本ファイル: `outputs/phase-03/main.md`
- 引き継ぎ先: Phase 4（テスト戦略）/ Phase 5（実装ランブック・MINOR-2 吸収）/ Phase 6（異常系・MINOR-3 吸収）/ Phase 12（MINOR-1 OIDC 起票候補）
