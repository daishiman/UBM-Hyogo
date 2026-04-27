# Phase 3: 設計レビュー結果

## レビュー対象

- outputs/phase-02/kv-namespace-design.md
- outputs/phase-02/ttl-policy.md
- outputs/phase-02/env-diff-matrix.md
- outputs/phase-02/free-tier-policy.md
- outputs/phase-02/eventual-consistency-guideline.md

## 代替案の検討結果

| 案 | 内容 | メリット | デメリット | 採否 |
| --- | --- | --- | --- | --- |
| A: KV + JWT 併用（採用案） | JWT を主とし、KV はブラックリスト・設定キャッシュ・レートリミットのみ | 書き込み回数を最小化でき無料枠内に収まる / 既存 Cloudflare スタックと整合 | 最終的一貫性 60s を許容できない用途に使えない | **採用** |
| B: KV にセッション本体を保管 | ログイン毎に KV に書き込み | 設計が単純 | 書き込み枠 1,000/日 を簡単に枯渇 / 即時無効化不可 | 不採用 |
| C: D1 にセッションテーブル | D1 で全セッション管理 | 強整合性・即時無効化可 | D1 read/write 量が増加 / レイテンシが KV より高い | **部分採用**（即時反映用途のみ D1 を併用） |
| D: Durable Objects | DO でセッション・レートリミット管理 | 強整合性・カウンタが正確 | コスト増 / 実装複雑度高 / MVP 段階では過剰 | 不採用（将来再検討） |
| E: クライアント完結 JWT のみ | KV を一切使わない | インフラコスト最小 | ブラックリスト不可 / レートリミット不可 | 不採用（セキュリティ要件で却下） |

採用案: **A（KV + JWT 併用）+ C（即時反映用途のみ D1）の組み合わせ**

## PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 理由 |
| --- | --- | --- |
| 命名規約の完全性（AC-1 / AC-6） | **PASS** | `ubm-hyogo-kv-prod` / `ubm-hyogo-kv-staging` / `-staging-preview` の 3 形態が分離されており、既存 D1/R2 命名と整合 |
| wrangler.toml バインディング設計の完全性（AC-2） | **PASS** | `[env.production]` / `[env.staging]` 配下に `[[kv_namespaces]]` を配置、バインディング名 `SESSION_KV` で統一 |
| KV ID 非掲載（CLAUDE.md / no-doc-for-secrets 準拠） | **PASS** | Phase 2 の全成果物に実 ID は含まれず、プレースホルダー `<staging-kv-namespace-id>` 等のみ使用 |
| TTL 方針と無料枠の整合性（AC-4 / AC-5） | **PASS** | セッション本体を KV に置かない方針により、書き込み 1,000/日 に収まる試算が可能 |
| env 差異マトリクスの網羅性 | **PASS** | local（miniflare / `--remote`）/ staging / production の 4 ケース網羅 |
| 「KV を使わない判断」分岐の存在（AC-7） | **PASS** | eventual-consistency-guideline.md に「ログアウト・権限変更は D1 / Durable Objects」と明記、Mermaid 設計図にも分岐あり |
| rollback / 無料枠枯渇時退避方針の存在 | **PASS** | free-tier-policy.md に枯渇時のフォールバック表（write/read/storage 別）を記載 |
| AC との整合（AC-1〜AC-7） | **PASS** | AC-1〜AC-7 すべてに対応する設計成果物が Phase 2 で揃っている（Phase 7 の AC matrix で再確認） |

## MINOR 指摘事項

- 監視・アラート実装は本タスクのスコープ外だが、`free-tier-policy.md` に「下流の運用タスクで実施」と申し送りが明記されているため許容
- `wrangler.toml` への実 ID 記載 vs. CI 経由生成の最終判断は Phase 5 runbook で確定する旨、Phase 2 設計から Phase 5 への引き継ぎが明確であること

## MAJOR 指摘事項

- なし

## 最終判定

**PASS** - Phase 4（事前検証手順）に進行可。

## 次 Phase 引き継ぎ事項

- 採用設計（KV + JWT + 即時反映用途は D1）を Phase 4 verify suite の対象として渡す
- バインディング名 `SESSION_KV` を Phase 4 「バインディング名衝突確認」のチェック項目として渡す
- Phase 5 で確定する runbook に「実 ID 掲載 vs. CI 経由生成」の判断ステップを含めること

## ブロック条件

- MAJOR 指摘事項なし → Phase 4 に進行可
