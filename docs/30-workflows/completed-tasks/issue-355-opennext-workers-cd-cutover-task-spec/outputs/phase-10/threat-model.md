# Phase 10 — 脅威モデル（T-1〜T-6）

> 本ファイルは `phase-10.md` §「脅威モデル」を outputs として確定したもの。STRIDE 寄りのカテゴリで cutover 固有のシナリオと対策・残存リスクを整理する。

---

## 1. 前提

| 項目 | 内容 |
| --- | --- |
| 対象 | apps/web の配信形態を Cloudflare Pages から OpenNext on Workers へ切替える CD cutover |
| 信頼境界 | (a) GitHub Actions runner / (b) Cloudflare account / (c) apps/api Worker / (d) public internet |
| データ分類 | (a) production secret（CLOUDFLARE_API_TOKEN, Auth.js secret, Google OAuth）/ (b) D1 内 PII / (c) public HTML / static asset |
| 関連 RISK | Phase 1 RISK-1〜RISK-5 |

## 2. 脅威モデル T-1〜T-6

| # | 脅威カテゴリ | シナリオ | 対策 | 残存リスク |
| --- | --- | --- | --- | --- |
| T-1 | 情報漏洩（Confidentiality）| `CLOUDFLARE_API_TOKEN` 値 / Auth.js secret / Google OAuth token が CD log / curl 結果 / tail log / commit 履歴に残る | (a) GitHub Secrets / 1Password で揮発注入のみ (b) Phase 8 ステップ 6 grep gate (c) CLAUDE.md「`.env` Read 禁止」(d) evidence は key 名 / pattern 名のみ | grep pattern が新型 token 形式を漏らす可能性 → §grep-pattern を網羅化 |
| T-2 | 権限昇格（Authorization）| 過剰 scope の token で意図せぬ DNS 編集 / D1 削除等が発生 | §token-scope で scope を `Workers Scripts:Edit` 等に限定。`D1:Edit` / `R2:Edit` / `DNS:Edit` を禁止 scope として明示 | token rotate 時に旧 token revoke 漏れ → rotate 手順に revoke を必須化 |
| T-3 | 否認（Non-repudiation）| production deploy / rollback 実行者が追跡不能 | (a) CD 経由 deploy は GitHub Actions の actor / SHA で記録 (b) 手動 rollback は `outputs/phase-11/rollback-readiness.md` に GitHub Issue 通知テンプレで記録 | 手動 UI 操作（custom domain 移譲）の actor は Cloudflare audit log に依存 |
| T-4 | 改ざん（Integrity）| OpenNext build 出力（`.open-next/worker.js`）が CI とローカルで diff、想定外コードが deploy される | (a) `.open-next/` は `.gitignore` で commit 禁止 (b) build:cloudflare は `opennextjs-cloudflare` 固定バージョン + `patch-open-next-worker.mjs` の決定論性 (c) CD 実行のたびにクリーンな worktree から build | `@opennextjs/cloudflare` package supply chain リスクは Renovate による version pin で監視 |
| T-5 | DoS（Availability）| OpenNext SSR が CPU 時間上限を超え、Worker invocation が連鎖失敗 | (a) Phase 9 24h 観測で CPU 時間 / req を 50ms 未満で gate (b) NG-4 trigger で `wrangler rollback` 即実行 (c) Pages dormant 期間中は二次 rollback 経路保持 | 大量 traffic 時の挙動は staging では完全再現不可 → Phase 13 production smoke で再観測 |
| T-6 | 仕様逸脱（Scope creep）| wrangler.toml に D1 / KV / R2 binding が追加され不変条件 #5 を破る | (a) Phase 9 領域 C grep gate (b) Phase 13 PR diff レビューで `[[d1_databases]]` `[[kv_namespaces]]` `[[r2_buckets]]` の追加 0 件を確認 | レビュー漏れリスク → CI 側 grep 化を将来タスクで検討 |

## 3. RISK-1〜RISK-5 マトリクス対応

| RISK（Phase 1）| 主に対応する T# |
| --- | --- |
| RISK-1（cutover 中の 5xx 連発）| T-5 |
| RISK-2（secret 漏洩）| T-1 |
| RISK-3（service binding 失敗）| T-5 |
| RISK-4（rollback 不通）| T-3 / T-5 |
| RISK-5（不変条件 #5 違反）| T-6 |

## 4. 残存リスクのモニタリング

| 残存リスク | 観測点 | 監視主体 |
| --- | --- | --- |
| 新型 token 形式の漏出 | Phase 8 grep gate / 手検査 | 運用者 |
| token rotate 時の revoke 漏れ | rotate 手順 §3 / Cloudflare Dashboard token 一覧 | 運用者 |
| 手動 UI 操作の actor 不明確化 | Cloudflare audit log | 運用者 |
| `@opennextjs/cloudflare` supply chain | Renovate / lockfile diff | 運用者 |
| production traffic burst 時の挙動 | Phase 13 production smoke / 24h 観測 | 運用者 |
| wrangler.toml への binding 追加レビュー漏れ | Phase 13 PR diff / 将来 CI grep | 運用者 |

## 5. Design GO 連動

本脅威モデル T-1〜T-6 すべてに対策が定義され、残存リスクが受容可能であることを Phase 10 §7「4 条件最終判定」の「整合性」「運用性」根拠の 1 つとする。
