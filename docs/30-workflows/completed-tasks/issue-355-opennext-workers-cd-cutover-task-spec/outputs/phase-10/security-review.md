# Phase 10 — セキュリティレビュー / Design GO 判定

> 本ファイルは `phase-10.md` の outputs 受け皿として、レビュー観点 R-1〜R-12 / token scope / attack surface / secret-leak grep pattern / ADR-0001・不変条件 #5・CLAUDE.md 整合確認 / 4 条件最終判定 / Design GO 判定 / Design GO と runtime GO の分離 / blocker / MAJOR 戻りフロー / ユーザー承認ゲート を 1 ファイルに集約する。

---

## 1. Phase 概要

| 項目 | 内容 |
| --- | --- |
| 目的 | Phase 1〜9 で蓄積した設計・テスト計画・runbook をセキュリティ観点で横断レビューし、`CLOUDFLARE_API_TOKEN` scope の最小権限化、Workers binding access scope、public assets と private API の境界、Pages → Workers cutover に伴う attack surface 変化、ADR-0001 / CLAUDE.md 不変条件 #5 整合性を確認する。Phase 1〜9 全 AC 合致 + リスク残課題なしを確認し Design GO を判定する |
| 入力 | Phase 1 AC-1〜AC-6 / RISK-1〜RISK-5、Phase 2 wrangler.toml 最終形 / web-cd.yml 差分 / runbook 設計骨子、Phase 3 NG-1〜NG-5、Phase 8 smoke 計画、Phase 9 promotion / rollback runbook、ADR-0001、CLAUDE.md「Cloudflare 系 CLI 実行ルール」 |
| 完了条件 | R-1〜R-12 PASS / 脅威モデル T-1〜T-6 すべて対策 / token scope 最小権限化確定 / ADR-0001 / 不変条件 #5 整合 / 4 条件最終判定 PASS / Design GO 確定 / runtime GO は Phase 13 へ分離 |
| visualEvidence | NON_VISUAL |
| user_approval_required | false（本 Phase は Design GO 判定のみ。実 deploy / commit / push / PR は Phase 13 で blocked 管理）|
| GitHub Issue | #355（CLOSED、`Refs #355`）|

## 2. レビュー観点マトリクス（R-1〜R-12）

| # | レビュー観点 | 状態 | 証跡パス | 判定 |
| --- | --- | --- | --- | --- |
| R-1 | `CLOUDFLARE_API_TOKEN` scope が最小権限に限定 | spec 確定 | 本ファイル §3 | PASS |
| R-2 | Workers binding access scope が apps/web 必要分のみ（D1 / KV / R2 直 binding 不在）| spec 確定 | Phase 9 領域 C grep gate | PASS |
| R-3 | apps/web は service binding 経由でのみ apps/api を呼ぶ（不変条件 #5）| spec 確定 | `apps/web/wrangler.toml` `[[env.<stage>.services]]` のみ存在 | PASS |
| R-4 | public assets は `[assets]` binding 経由のみで露出、private API は `API_SERVICE` binding 経由 | spec 確定 | wrangler.toml 構造 / Phase 8 SM-10〜SM-22 | PASS |
| R-5 | OpenNext entrypoint `.open-next/worker.js` は build 出力で gitignore 対象 | spec 確定 | `apps/web/.gitignore` の `.open-next` エントリ | PASS |
| R-6 | `bash scripts/cf.sh` ラッパー経由統一（`wrangler` 直呼び 0 件、tail のみ例外）| spec 確定 | Phase 8 ステップ 5 注記 / Phase 9 全 runbook | PASS |
| R-7 | secret-leak 防止 grep gate が設計 | spec 確定 | Phase 8 ステップ 6 / 本ファイル §5 | PASS |
| R-8 | production rollback 二段戦略が判断基準付きで定義 | spec 確定 | Phase 9 rollback runbook | PASS |
| R-9 | Pages → Workers cutover に伴う attack surface 変化が評価済 | spec 確定 | 本ファイル §4 | PASS |
| R-10 | ADR-0001（OpenNext on Workers 採用）と矛盾なし | spec 確定 | ADR-0001 / Phase 1 上流境界 | PASS |
| R-11 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」/「`.env` Read 禁止」/「OAuth token 非保持」と整合 | spec 確定 | CLAUDE.md / 本ファイル §6 | PASS |
| R-12 | rate limit 配慮（CD は ref ごと concurrency group、smoke は手動 1 セッション）| spec 確定 | `web-cd.yml` `concurrency.group` 維持 | PASS |

## 3. token scope 最小権限化（§token-scope）

`CLOUDFLARE_API_TOKEN`（GitHub Secrets `CLOUDFLARE_API_TOKEN`）に必要な scope を以下に限定する。

| scope | 用途 | 必須 / 任意 |
| --- | --- | --- |
| Account → Workers Scripts:Edit | `wrangler deploy --env <stage>` | 必須 |
| Account → Workers Routes:Edit | custom domain / route 関連 API | 必須（production rollout / rollback 時）|
| Account → Workers KV Storage:Edit | OpenNext 内部キャッシュ用 KV を使う場合 | 任意（本タスク範囲では使用しない、将来用）|
| Account → D1:Edit | apps/web は D1 binding を持たないため | **不要**（不変条件 #5 整合）|
| Zone → Workers Routes:Edit | custom domain を Workers script に紐付け | 必須（production のみ）|
| Zone → Zone:Read | Zone ID 解決 | 必須 |
| Account → Account Settings:Read | account 情報取得 | 必須 |

**禁止 scope**: `Account → D1:Edit` / `Account → R2:Edit` / `Zone → DNS:Edit` / `User Details:Read`。

token rotation 想定:
- 90 日ごとに rotate（運用慣行）
- 手順: 1Password で新 token を生成 → GitHub Secrets `CLOUDFLARE_API_TOKEN` を更新 → 旧 token を Cloudflare Dashboard から revoke
- rotate 中の CD 実行は serial を維持（concurrency group が gate）

## 4. attack surface 変化評価（§attack-surface）

| 観点 | Pages（旧）| Workers（新）| 差分の評価 |
| --- | --- | --- | --- |
| edge function 実行 | Pages Functions が limited 実行 | OpenNext `worker.js` が SSR / middleware / API ルートを実行 | 増加。ただし手書き edge code は混入しない |
| 静的 asset 配信経路 | Pages CDN（自動）| `[assets]` binding（`directory = ".open-next/assets"`、`not_found_handling = "single-page-application"`）| 同等 |
| 環境変数到達範囲 | Pages env（dashboard）| `wrangler.toml` `[env.<stage>.vars]` + Secrets | 集約化される（toml 一元管理）|
| 認証 / 認可境界 | apps/web → apps/api は HTTP 経由 | apps/web → apps/api は service binding 経由（同 account 内 RPC）| **狭まる** |
| log / observability | Pages Functions log | Workers observability（`[observability] enabled = true`）| 強化 |
| rate limit / DDoS 表面 | Cloudflare WAF / Pages level | 同 WAF + Workers script level | 同等 |
| rollback 時間 | Pages deploy 履歴経由（数分）| `wrangler rollback`（5 分以内）+ Pages 二次 | 改善 |

**結論**: edge 実行面は増加するが、コードは OpenNext build 出力に閉じる。service binding 経由化により Web→API の中間層暴露が減少し、ネット差分は **改善側**。

## 5. secret-leak grep pattern（§grep-pattern）

| # | パターン | 用途 | 期待件数 |
| --- | --- | --- | --- |
| 1 | `Bearer\s+[A-Za-z0-9._-]+` | Authorization header の token 値 | 0 |
| 2 | `CLOUDFLARE_API_TOKEN\s*[:=]\s*\S+` | CF API token 直書き | 0 |
| 3 | `ya29\.\|ghp_\|gho_` | Google OAuth / GitHub PAT prefix | 0 |
| 4 | `[A-Za-z0-9+/]{40,}={0,2}` | base64-like 長文字列 | 手検査推奨（false positive 多）|
| 5 | `Authorization:\s*\S+` | header 直書き | 0 |
| 6 | `secret\s*[:=]\s*['\"][^'\"]+['\"]` | secret 値直書き | 0 |

適用対象: `outputs/phase-08/*.md`, `outputs/phase-08/*.txt`, `outputs/phase-09/*.md`, `outputs/phase-11/*.md`, `outputs/phase-11/*.log`, `outputs/phase-11/*.txt`。

## 6. ADR-0001 / 不変条件 #5 / CLAUDE.md 整合確認（§claudemd-alignment）

| 上流 | 整合確認 |
| --- | --- |
| ADR-0001（OpenNext on Workers 採用）| 本タスク CD は `wrangler deploy --env <stage>` + `.open-next/worker.js` を deploy 対象とする → 整合 |
| 不変条件 #5（D1 直アクセスは apps/api に閉じる）| apps/web `wrangler.toml` に D1 binding が **不在**、apps/api を service binding 経由で呼ぶ → 整合 |
| 不変条件 #6（GAS prototype を本番昇格させない）| 本タスク変更範囲に GAS 関連なし → 整合 |
| CLAUDE.md「Cloudflare 系 CLI 実行ルール」| runbook 全体で `bash scripts/cf.sh` 経由を強制、`wrangler tail` のみ例外 → 整合 |
| CLAUDE.md「`.env` Read 禁止」| 本タスク仕様 / runbook で `.env` の cat / Read を行わない → 整合 |
| CLAUDE.md「OAuth token 非保持」| `wrangler login` を runbook に含めない、CD は GitHub Secrets `CLOUDFLARE_API_TOKEN` 経由のみ → 整合 |
| Branch protection（solo dev）| `web-cd.yml` の environment protection rule で production のみ手動承認 → 整合 |

## 7. 4 条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | Pages 二重運用解消 / service binding 経由 Web→API 統合 / rollback 高速化（5 分以内）が同時達成 |
| 実現性 | PASS | wrangler.toml / build:cloudflare / scripts/cf.sh が既設定。残作業は workflow 1 ファイル + runbook |
| 整合性 | PASS | ADR-0001 / 不変条件 #5 / CLAUDE.md「Cloudflare 系 CLI 実行ルール」と矛盾なし |
| 運用性 | PASS | 24h 観測 + 二段 rollback + Pages dormant 14 日で復旧経路を多重化 |

**最終判定: Design GO（PASS）**

## 8. Design GO と runtime GO の分離

| GO 種別 | 判定タイミング | 判定者 | 根拠 |
| --- | --- | --- | --- |
| Design GO | 本 Phase（Phase 10）完了時 | R-1〜R-12 + 4 条件 | docs / spec / runbook が deploy 可能な完成度 |
| runtime GO | Phase 13 production deploy 実測 PASS 時 | Phase 13 promotion-decision + production smoke | 実 production で 5xx 率 / レイテンシ / smoke 全件 PASS |

Design GO は spec が実装に進めることのみを意味し、production への実 deploy 許可ではない。

## 9. blocker 一覧

| ID | blocker | 種別 | 解消条件 |
| --- | --- | --- | --- |
| B-01 | 1Password に `CLOUDFLARE_API_TOKEN`（最小 scope）登録済み | 環境 | `bash scripts/cf.sh whoami` 成功 |
| B-02 | GitHub Secrets `CLOUDFLARE_API_TOKEN` が新 token に更新済み（最小 scope）| 環境 | GitHub Actions log で deploy 成功 |
| B-03 | `apps/web/wrangler.toml` に D1/KV/R2 binding 不在 | 設計 | grep 0 件 |
| B-04 | `.open-next/` が `.gitignore` 対象 | 設計 | grep 1 件以上ヒット |
| B-05 | Phase 8 / Phase 9 の runbook が確定 | 設計 | spec_created |

## 10. MAJOR 検出時の戻りフロー

| 検出例 | 戻り先 Phase | 再評価条件 |
| --- | --- | --- |
| token scope に禁止 scope（D1:Edit 等）が含まれる | Phase 2 → Phase 10 再実行 | scope を最小権限に絞り直し |
| `apps/web/wrangler.toml` に D1/KV/R2 binding が追加されている | Phase 2 | binding を削除し service binding 経由へ |
| runbook 内に `wrangler deploy` 直呼び（CD 内 wrangler-action 以外）| Phase 8 / Phase 9 | `bash scripts/cf.sh` 経由に統一 |
| evidence サンプルに API token 実値 | Phase 8 ステップ 6 強化 | grep gate を追加正規表現で再実行 |
| Pages dormant 期間に削除手順が含まれている | Phase 9 rollback-runbook | 14 日 dormant 維持を明記 |

## 11. ユーザー承認ゲート【Phase 13 blocked】

| 段階 | アクション | 承認証跡パス |
| --- | --- | --- |
| 1. 観点マトリクス提示 | R-1〜R-12 + 4 条件 + 脅威モデル + blocker をユーザーに提示 | 本ファイル §2 |
| 2. MAJOR 不在の確認 | MAJOR 0 を明示 | 本ファイル §10 |
| 3. ユーザー承認取得 | commit / push / PR / production deploy の明示的応答 | Phase 13 `pr-info.md` / `pr-creation-result.md` / `production-deploy-approval.md` |
| 4. 承認後 Phase 13 実行 | 承認後のみ commit / PR / production deploy 実行 | Phase 13 |

## 12. 完了条件チェックリスト

- [x] R-1〜R-12 がすべて PASS
- [x] 脅威モデル T-1〜T-6 すべてに対策記述（`outputs/phase-10/threat-model.md` 参照）
- [x] token scope 一覧が必須 / 任意 / 禁止の 3 区分で明示
- [x] attack surface 変化が 7 観点で表化
- [x] secret-leak grep pattern 6 種が列挙
- [x] ADR-0001 / 不変条件 #5 / CLAUDE.md「Cloudflare 系 CLI 実行ルール」整合確認済
- [x] 4 条件最終判定が PASS
- [x] Design GO と runtime GO の分離が明示
- [x] blocker B-01〜B-05 が記述
- [x] MAJOR 検出時戻りフローが 5 件定義
- [x] ユーザー承認ゲートが Phase 13 と連動
- [x] `wrangler` 直叩きが本仕様書内ゼロ（`wrangler tail` 例外言及のみ許容）
