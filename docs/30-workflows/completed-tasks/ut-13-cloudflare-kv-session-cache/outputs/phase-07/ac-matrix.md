# Phase 7: AC matrix（AC-1〜AC-7 全トレース）

## AC matrix

| AC | 内容 | 検証項目 | 証跡パス | 担当 Phase | 状態 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | KV Namespace 作成手順・命名規約（prod/staging） | `wrangler kv:namespace create` 手順と命名規約（`ubm-hyogo-kv-prod` / `ubm-hyogo-kv-staging`） | outputs/phase-02/kv-namespace-design.md / outputs/phase-05/kv-bootstrap-runbook.md | Phase 2 / Phase 5 | **PASS** |
| AC-2 | wrangler.toml バインディング設計 | `[[env.production.kv_namespaces]]` / `[[env.staging.kv_namespaces]]` の TOML 例（バインディング名 `SESSION_KV`） | outputs/phase-02/kv-namespace-design.md / outputs/phase-05/kv-bootstrap-runbook.md | Phase 2 / Phase 5 | **PASS** |
| AC-3 | Workers からの read/write 動作確認 | wrangler CLI 経由 / Workers コード経由の確認手順 | outputs/phase-05/read-write-verification.md | Phase 5 | **PASS** |
| AC-4 | TTL 設定方針ドキュメント化 | 用途別 TTL 表（セッション / 設定キャッシュ / レートリミット） | outputs/phase-02/ttl-policy.md | Phase 2 | **PASS** |
| AC-5 | 無料枠運用方針明文化 | 100k read/day, 1k write/day, 1 GB storage の運用ルール + 監視 + 枯渇時フォールバック | outputs/phase-02/free-tier-policy.md / outputs/phase-06/failure-cases.md (FC-02/06) | Phase 2 / Phase 6 | **PASS** |
| AC-6 | Namespace/バインディング名 下流タスク向けドキュメント化 | バインディング名対応表（ID 除く）+ 1Password 管理ルール | outputs/phase-05/kv-binding-mapping.md | Phase 5 | **PASS** |
| AC-7 | 最終的一貫性制約の設計指針明記 | put 直後 read 禁止 / 即時整合性が必要な操作の代替設計指針 | outputs/phase-02/eventual-consistency-guideline.md / outputs/phase-06/failure-cases.md (FC-01) | Phase 2 / Phase 6 | **PASS** |

## 機密情報非掲載確認

| 確認項目 | 期待 | 結果 |
| --- | --- | --- |
| 成果物に Namespace ID（32 桁 hex）を含まない | 含まない | PASS |
| 成果物に Account ID を含まない | 含まない | PASS |
| 成果物に API Token を含まない | 含まない | PASS |
| バインディング名 / Namespace 名のみ記載 | 記載 OK | PASS |

## 差し戻し判定

| 状況 | 差し戻し | 結果 |
| --- | --- | --- |
| AC-1 / AC-2 の証跡が outputs/phase-05/ に存在しない | Phase 5 | 該当なし（PASS） |
| AC-3 の動作確認が記録されていない | Phase 5 | 該当なし（PASS） |
| AC-4 の TTL 方針ドキュメントが存在しない | Phase 2 | 該当なし（PASS） |
| AC-5 の無料枠運用方針が未明文化 | Phase 2 / Phase 6 | 該当なし（PASS） |
| AC-6 のバインディング対応表に Namespace ID が含まれている | Phase 5 | 該当なし（PASS） |
| AC-7 の最終的一貫性指針が未記載 | Phase 2 | 該当なし（PASS） |

## 結論

- AC-1〜AC-7 全件が PASS
- 機密情報の非掲載が確認済み
- 差し戻し対象なし → Phase 8 に進行可

## 完了条件

- [x] AC-1〜AC-7 全行に検証項目・証跡パス・担当 Phase が記載されている
- [x] 全 AC が PASS で証跡確認済み
- [x] 機密情報（Namespace ID）が成果物に含まれていないことを確認済み
