# Phase 6: AC-1〜AC-7 最終確認結果

## AC 最終確認

| AC | 内容 | 確認状態 | 確認方法 / 証跡 |
| --- | --- | --- | --- |
| AC-1 | KV Namespace 作成（prod/staging） | **PASS** | outputs/phase-05/kv-bootstrap-runbook.md の Step 1 で `wrangler kv:namespace create ubm-hyogo-kv-prod` / `ubm-hyogo-kv-staging` の手順が定義済み |
| AC-2 | wrangler.toml バインディング設定 | **PASS** | outputs/phase-05/kv-bootstrap-runbook.md の Step 3 / outputs/phase-02/kv-namespace-design.md で `[[env.production.kv_namespaces]]` / `[[env.staging.kv_namespaces]]` の TOML 例を定義済み |
| AC-3 | Workers からの read/write 動作確認 | **PASS** | outputs/phase-05/read-write-verification.md に wrangler CLI 経由・Workers コード経由の両方式の手順を定義済み |
| AC-4 | TTL 設定方針ドキュメント化 | **PASS** | outputs/phase-02/ttl-policy.md に用途別 TTL 表（セッション 24h / 設定キャッシュ 1h / レートリミット 60s〜10min）を記録済み |
| AC-5 | 無料枠運用方針明文化 | **PASS** | outputs/phase-02/free-tier-policy.md に 100k read/day, 1k write/day, 1 GB storage の運用ルールと枯渇時フォールバックを記録済み |
| AC-6 | Namespace/バインディング名 下流タスク向けドキュメント化 | **PASS** | outputs/phase-05/kv-binding-mapping.md に対応表（実 ID 除く）を記録済み |
| AC-7 | 最終的一貫性制約の設計指針明記 | **PASS** | outputs/phase-02/eventual-consistency-guideline.md に「put 直後 read 禁止」「即時反映用途は D1/Durable Objects」設計指針を記録済み。failure-cases.md FC-01 で再確認 |

## 異常系の AC への影響確認

| failure case | 影響 AC | 反映状態 |
| --- | --- | --- |
| FC-01 最終的一貫性 | AC-7 | eventual-consistency-guideline.md に明文化済み |
| FC-02 / FC-06 無料枠枯渇 | AC-5 | free-tier-policy.md に明文化済み |
| FC-03 バインディング取り違え | AC-2 / AC-6 | kv-binding-mapping.md / kv-bootstrap-runbook.md に 1Password 管理ルール記載済み |
| FC-04 TTL 失効 | AC-4 | ttl-policy.md に「TTL 失効時のフォールバック」記載、Phase 8 以降の実装ガイドへ申し送り |
| FC-05 ID コミット | AC-6 | kv-binding-mapping.md / runbook で 1Password 管理を明記 |

## 未解決事項

なし。全 AC が PASS で、failure cases も全て mitigation が定義済み。

## 完了条件

- [x] AC-1〜AC-7 全件の最終確認が完了
- [x] 全 AC が PASS
- [x] failure cases が AC に反映されている

## 次 Phase 引き継ぎ事項

- AC-1〜AC-7 全 PASS の状態で Phase 7 AC matrix に進行可
- 未解決の failure case なし
