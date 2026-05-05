# Phase 10: セキュリティレビュー / Design GO 判定

## Phase 概要

| 項目 | 内容 |
| --- | --- |
| 目的 | Phase 1〜9 で蓄積した設計・テスト計画・runbook をセキュリティ観点で横断レビューし、`CLOUDFLARE_API_TOKEN` scope の最小権限化、Workers binding access scope、public assets と private API の境界、Pages → Workers cutover に伴う attack surface 変化、ADR-0001 / CLAUDE.md 不変条件 #5 整合性を確認する。Phase 1〜9 全 AC 合致 + リスク残課題なしを確認し Design GO を判定する |
| 入力 | Phase 1 AC-1〜AC-6 / RISK-1〜RISK-5、Phase 2 wrangler.toml 最終形 / web-cd.yml 差分 / runbook 設計骨子、Phase 3 NG-1〜NG-5、Phase 8 smoke 計画、Phase 9 promotion / rollback runbook、ADR-0001、CLAUDE.md「Cloudflare 系 CLI 実行ルール」 |
| 出力 | `outputs/phase-10/security-review.md`、`outputs/phase-10/design-go-decision.md`、`outputs/phase-10/token-scope-check.md`、`outputs/phase-10/threat-model.md` |
| 完了条件 | レビュー観点 R-1〜R-12 が PASS / 脅威モデル T-1〜T-6 すべてに対策 / token scope 最小権限化が確定 / ADR-0001 / 不変条件 #5 整合確認 / 4 条件最終判定 PASS / Design GO 確定 / runtime GO は Phase 13 へ分離 |

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-355-opennext-workers-cd-cutover-task-spec |
| Phase 番号 | 10 / 13 |
| Phase 名称 | セキュリティレビュー / Design GO 判定 |
| Wave | 1 |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 9（ステージング検証 / QA） |
| 次 Phase | 11（NON_VISUAL evidence 取得） |
| 状態 | spec_created |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| user_approval_required | false（本 Phase は Design GO 判定のみ。実 deploy / commit / push / PR は Phase 13 で blocked 管理） |
| GitHub Issue | #355 |

## 目的

apps/web の配信形態を Pages から Workers へ切替えるにあたり、CD パイプライン / wrangler.toml / cutover runbook が「最小権限・最小攻撃面・最大可観測性・最速 rollback」を満たしているかを最終確定する。本 Phase は Design GO の判定までを担い、実 production deploy 後の挙動による runtime GO は Phase 13 で別途取得する（Design GO ≠ runtime GO の分離）。

## レビュー観点 × 状態 × 証跡

### R-1〜R-12: 観点マトリクス

| # | レビュー観点 | 状態 | 証跡パス | 判定 |
| --- | --- | --- | --- | --- |
| R-1 | `CLOUDFLARE_API_TOKEN` scope が最小権限（後述 §token-scope）に限定 | spec 確定 | `outputs/phase-10/token-scope-check.md` | PASS |
| R-2 | Workers binding access scope が apps/web 必要分のみ（D1 / KV / R2 直 binding 不在） | spec 確定 | Phase 9 領域 C grep gate / `outputs/phase-09/binding-check.md` | PASS |
| R-3 | apps/web は service binding 経由でのみ apps/api を呼ぶ（不変条件 #5） | spec 確定 | `apps/web/wrangler.toml` `[[env.<stage>.services]]` のみ存在 | PASS |
| R-4 | public assets は `[assets]` binding 経由のみで露出、private API は `API_SERVICE` binding 経由 | spec 確定 | wrangler.toml 構造 / Phase 8 SM-10〜SM-22 | PASS |
| R-5 | OpenNext entrypoint `.open-next/worker.js` は build 出力で gitignore 対象（実コード混入なし） | spec 確定 | `apps/web/.gitignore` の `.open-next` エントリ確認 | PASS |
| R-6 | `bash scripts/cf.sh` ラッパー経由統一（手動 deploy / rollback の `wrangler` 直呼び 0 件、tail のみ例外） | spec 確定 | Phase 8 ステップ 5 注記 / Phase 9 全 runbook | PASS |
| R-7 | secret-leak 防止 grep gate（`Bearer ` / `CLOUDFLARE_API_TOKEN=` / `ya29.\|ghp_\|gho_` 等）が設計 | spec 確定 | Phase 8 ステップ 6 / 本 Phase §grep-pattern | PASS |
| R-8 | production rollback 二段戦略（wrangler rollback / Pages resume）が判断基準付きで定義 | spec 確定 | Phase 9 rollback runbook | PASS |
| R-9 | Pages → Workers cutover に伴う attack surface 変化が評価済 | spec 確定 | 本 Phase §attack-surface | PASS |
| R-10 | ADR-0001（OpenNext on Workers 採用）と矛盾なし | spec 確定 | ADR-0001 / Phase 1 上流境界 | PASS |
| R-11 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」/「`.env` Read 禁止」/「OAuth token 非保持」と整合 | spec 確定 | CLAUDE.md / 本 Phase §claudemd-alignment | PASS |
| R-12 | rate limit 配慮（CD は ref ごと concurrency group で重複抑止、smoke は手動 1 セッション） | spec 確定 | `web-cd.yml` `concurrency.group` 維持（Phase 2） | PASS |

## token scope 最小権限化（§token-scope）

`CLOUDFLARE_API_TOKEN`（GitHub Secrets `CLOUDFLARE_API_TOKEN`）に必要な scope を以下に限定する。

| scope | 用途 | 必須 / 任意 |
| --- | --- | --- |
| Account → Workers Scripts:Edit | `wrangler deploy --env <stage>` | 必須 |
| Account → Workers Routes:Edit | custom domain / route 関連 API | 必須（production rollout / rollback 時） |
| Account → Workers KV Storage:Edit | OpenNext 内部キャッシュ用 KV を使う場合 | 任意（本タスク範囲では使用しない、将来用） |
| Account → D1:Edit | apps/web は D1 binding を持たないため | **不要**（不変条件 #5 整合） |
| Zone → Workers Routes:Edit | custom domain を Workers script に紐付け | 必須（production のみ） |
| Zone → Zone:Read | Zone ID 解決 | 必須 |
| Account → Account Settings:Read | account 情報取得 | 必須 |

**禁止 scope**: `Account → D1:Edit`、`Account → R2:Edit`、`Zone → DNS:Edit`（DNS は Workers custom domain UI が内部処理、トークンに直接付与しない）、`User Details:Read`。

token rotation 想定:
- 90 日ごとに rotate（運用慣行）
- rotate 手順: 1Password で新 token を生成 → GitHub Secrets `CLOUDFLARE_API_TOKEN` を更新 → 旧 token を Cloudflare Dashboard から revoke
- rotate 中の CD 実行は serial を維持（concurrency group が gate）

## attack surface 変化評価（§attack-surface）

Pages → Workers の cutover で edge 実行面が変化する。差分を以下に整理。

| 観点 | Pages（旧） | Workers（新） | 差分の評価 |
| --- | --- | --- | --- |
| edge function 実行 | Pages Functions（`functions/` ディレクトリ）が limited 実行 | OpenNext `worker.js` が SSR / middleware / API ルートをすべて実行 | 増加。ただし `nodejs_compat` 上で Next.js が動く想定で、追加コードは OpenNext build 出力のみ。手書き edge code は混入しない |
| 静的 asset 配信経路 | Pages CDN（自動） | `[assets]` binding（`directory = ".open-next/assets"`、`not_found_handling = "single-page-application"`） | 同等。public 露出範囲に差なし |
| 環境変数到達範囲 | Pages env（dashboard） | `wrangler.toml` `[env.<stage>.vars]` + Secrets | 集約化される（toml 一元管理）。secret 値は wrangler.toml に **書かない**（既存方針維持） |
| 認証 / 認可境界 | apps/web → apps/api は HTTP 経由 | apps/web → apps/api は service binding 経由（同 account 内 RPC） | **狭まる**。public network を経由しないため intercept リスク低減 |
| log / observability | Pages Functions log | Workers observability（`[observability] enabled = true`） | 強化 |
| rate limit / DDoS 表面 | Cloudflare WAF / Pages level | 同 WAF + Workers script level | 同等 |
| rollback 時間 | Pages deploy 履歴経由（数分） | `wrangler rollback`（5 分以内）+ Pages 二次（dormant 期間内） | 改善 |

**結論**: edge 実行面は増加するが、コードは OpenNext build 出力に閉じ、手書き worker code は本タスクで導入しない。service binding 経由化により Web→API の中間層暴露が減少し、ネット差分は **改善側**。

## 脅威モデル（T-1〜T-6）

| # | 脅威カテゴリ | シナリオ | 対策 | 残存リスク |
| --- | --- | --- | --- | --- |
| T-1 | 情報漏洩（Confidentiality） | `CLOUDFLARE_API_TOKEN` 値 / Auth.js secret / Google OAuth token が CD log / curl 結果 / tail log / commit 履歴に残る | (a) GitHub Secrets / 1Password で揮発注入のみ (b) Phase 8 ステップ 6 grep gate (c) CLAUDE.md「`.env` Read 禁止」(d) evidence は key 名 / pattern 名のみ | grep pattern が新型 token 形式を漏らす可能性 → §grep-pattern で正規表現を網羅化 |
| T-2 | 権限昇格（Authorization） | 過剰 scope の token で意図せぬ DNS 編集 / D1 削除等が発生 | §token-scope で scope を `Workers Scripts:Edit` 等に限定。`D1:Edit` / `R2:Edit` / `DNS:Edit` を禁止 scope として明示 | token rotate 時に旧 token revoke 漏れ → rotate 手順に revoke を必須化 |
| T-3 | 否認（Non-repudiation） | production deploy / rollback 実行者が追跡不能 | (a) CD 経由 deploy は GitHub Actions の actor / SHA で記録 (b) 手動 rollback は `outputs/phase-11/rollback-readiness.md` に GitHub Issue 通知テンプレで記録 | 手動 UI 操作（custom domain 移譲）の actor は Cloudflare audit log に依存 |
| T-4 | 改ざん（Integrity） | OpenNext build 出力（`.open-next/worker.js`）が CI とローカルで diff、想定外コードが deploy される | (a) `.open-next/` は `.gitignore` で commit 禁止 (b) build:cloudflare は `opennextjs-cloudflare` 固定バージョン + `patch-open-next-worker.mjs` の決定論性 (c) CD 実行のたびにクリーンな worktree から build | `@opennextjs/cloudflare` package supply chain リスクは Renovate による version pin で監視 |
| T-5 | DoS（Availability） | OpenNext SSR が CPU 時間上限を超え、Worker invocation が連鎖失敗 | (a) Phase 9 24h 観測で CPU 時間 / req を 50ms 未満で gate (b) NG-4 trigger で `wrangler rollback` 即実行 (c) Pages dormant 期間中は二次 rollback 経路保持 | 大量 traffic 時の挙動は staging では完全再現不可 → Phase 13 production smoke で再観測 |
| T-6 | 仕様逸脱（Scope creep） | wrangler.toml に D1 / KV / R2 binding が追加され不変条件 #5 を破る | (a) Phase 9 領域 C grep gate (b) Phase 13 PR diff レビューで `[[d1_databases]]` `[[kv_namespaces]]` `[[r2_buckets]]` の追加 0 件を確認 | レビュー漏れリスク → CI 側 grep 化を将来タスクで検討 |

## secret-leak grep pattern（§grep-pattern）

| # | パターン | 用途 | 期待件数 |
| --- | --- | --- | --- |
| 1 | `Bearer\s+[A-Za-z0-9._-]+` | Authorization header の token 値 | 0 |
| 2 | `CLOUDFLARE_API_TOKEN\s*[:=]\s*\S+` | CF API token 直書き | 0 |
| 3 | `ya29\.\|ghp_\|gho_` | Google OAuth / GitHub PAT prefix | 0 |
| 4 | `[A-Za-z0-9+/]{40,}={0,2}` | base64-like 長文字列（Auth.js NEXTAUTH_SECRET 等の漏出疑い） | 手検査推奨（false positive 多） |
| 5 | `Authorization:\s*\S+` | header 直書き | 0 |
| 6 | `secret\s*[:=]\s*['\"][^'\"]+['\"]` | secret 値直書き | 0 |

適用対象: `outputs/phase-08/*.md`, `outputs/phase-08/*.txt`, `outputs/phase-09/*.md`, `outputs/phase-11/*.md`, `outputs/phase-11/*.log`, `outputs/phase-11/*.txt`。

## ADR-0001 / 不変条件 #5 整合確認（§claudemd-alignment）

| 上流 | 整合確認 |
| --- | --- |
| ADR-0001（OpenNext on Workers 採用） | 本タスク CD は `wrangler deploy --env <stage>` + `.open-next/worker.js` を deploy 対象とする → 整合 |
| 不変条件 #5（D1 直アクセスは apps/api に閉じる） | apps/web `wrangler.toml` に D1 binding が **不在**、apps/api を service binding 経由で呼ぶ → 整合（Phase 9 領域 C grep gate で gate 化） |
| 不変条件 #6（GAS prototype を本番昇格させない） | 本タスク変更範囲に GAS 関連なし → 整合 |
| CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | runbook 全体で `bash scripts/cf.sh` 経由を強制、`wrangler tail` のみ例外として明示 → 整合 |
| CLAUDE.md「`.env` Read 禁止」 | 本タスク仕様 / runbook で `.env` の cat / Read を行わない → 整合 |
| CLAUDE.md「OAuth token 非保持」 | `wrangler login` を runbook に含めない、CD は GitHub Secrets `CLOUDFLARE_API_TOKEN` 経由のみ → 整合 |
| Branch protection（solo dev） | `web-cd.yml` の environment protection rule で production のみ手動承認推奨（Phase 2 open question 3 解） → 整合 |

## 4 条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | Pages 二重運用解消 / service binding 経由 Web→API 統合 / rollback 高速化（5 分以内）が同時達成 |
| 実現性 | PASS | wrangler.toml / build:cloudflare / scripts/cf.sh が既設定。残作業は workflow 1 ファイル + runbook |
| 整合性 | PASS | ADR-0001 / 不変条件 #5 / CLAUDE.md「Cloudflare 系 CLI 実行ルール」と矛盾なし |
| 運用性 | PASS | 24h 観測 + 二段 rollback + Pages dormant 14 日で復旧経路を多重化 |

**最終判定: Design GO（PASS）**

## Design GO と runtime GO の分離

| GO 種別 | 判定タイミング | 判定者 | 根拠 |
| --- | --- | --- | --- |
| Design GO | 本 Phase（Phase 10）完了時 | 本 Phase R-1〜R-12 + 4 条件 | docs / spec / runbook が deploy 可能な完成度 |
| runtime GO | Phase 13 production deploy 実測 PASS 時 | Phase 13 promotion-decision + production smoke | 実 production で 5xx 率 / レイテンシ / smoke 全件 PASS |

Design GO は spec が実装に進めることのみを意味し、production への実 deploy 許可ではない。Phase 13 で promotion 判定基準（Phase 9 GO 条件 8 件）を満たした場合に runtime GO を取得する。

## blocker 一覧

| ID | blocker | 種別 | 解消条件 |
| --- | --- | --- | --- |
| B-01 | 1Password に `CLOUDFLARE_API_TOKEN`（最小 scope）登録済み | 環境 | `bash scripts/cf.sh whoami` 成功 |
| B-02 | GitHub Secrets `CLOUDFLARE_API_TOKEN` が新 token に更新済み（最小 scope） | 環境 | GitHub Actions log で deploy 成功 |
| B-03 | `apps/web/wrangler.toml` に D1/KV/R2 binding 不在 | 設計 | grep 0 件 |
| B-04 | `.open-next/` が `.gitignore` 対象 | 設計 | grep 1 件以上ヒット |
| B-05 | Phase 8 / Phase 9 の runbook が確定 | 設計 | spec_created |

## MAJOR 検出時の戻りフロー

| 検出例 | 戻り先 Phase | 再評価条件 |
| --- | --- | --- |
| token scope に禁止 scope（D1:Edit 等）が含まれる | Phase 2（設計）→ Phase 10 再実行 | scope を最小権限に絞り直し |
| `apps/web/wrangler.toml` に D1/KV/R2 binding が追加されている | Phase 2 | binding を削除し service binding 経由へ |
| runbook 内に `wrangler deploy` 直呼び（CD 内 wrangler-action 以外） | Phase 8 / Phase 9 | `bash scripts/cf.sh` 経由に統一 |
| evidence サンプルに API token 実値 | Phase 8 ステップ 6 強化 | grep gate を追加正規表現で再実行 |
| Pages dormant 期間に削除手順が含まれている | Phase 9 rollback-runbook | 14 日 dormant 維持を明記 |

## ユーザー承認ゲート【Phase 13 blocked】

| 段階 | アクション | 承認証跡パス |
| --- | --- | --- |
| 1. 観点マトリクス提示 | R-1〜R-12 + 4 条件 + 脅威モデル + blocker をユーザーに提示 | `outputs/phase-10/security-review.md` §「観点マトリクス」 |
| 2. MAJOR 不在の確認 | MAJOR 0 を明示 | `outputs/phase-10/design-go-decision.md` §「MAJOR 判定結果」 |
| 3. ユーザー承認取得 | commit / push / PR / production deploy の明示的応答 | Phase 13 `pr-info.md` / `pr-creation-result.md` / `production-deploy-approval.md` |
| 4. 承認後 Phase 13 実行 | 承認後のみ commit / PR / production deploy 実行 | Phase 13 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 1 | AC-1〜AC-6 / RISK-1〜RISK-5 を本 Phase R-1〜R-12 / T-1〜T-6 で再評価 |
| Phase 2 | wrangler.toml / web-cd.yml / runbook 設計が R-2〜R-6 / R-12 を満たすか確認 |
| Phase 3 | NG-1〜NG-5 と T-1〜T-6 / R-7〜R-8 の対応関係を整理 |
| Phase 8 | smoke 計画の secret-leak grep が R-7 / §grep-pattern を満たすか確認 |
| Phase 9 | promotion / rollback runbook が R-8 を満たすか確認 |
| Phase 11 | Design GO 判定 + 脅威モデル対策結果を NON_VISUAL evidence の検証項目として転記 |
| Phase 13 | Design GO + production deploy 実測で runtime GO を取得し PR description に転記 |

## 多角的チェック観点

- 価値性: cutover 後の本番安全性を spec 段階で保証
- 実現性: 既存資産（scripts/cf.sh / GitHub Secrets / 1Password）で完結
- 整合性: ADR-0001 / 不変条件 #5 / CLAUDE.md と矛盾なし
- 運用性: 二段 rollback + 14 日 dormant + 90 日 token rotate
- 認可境界: token scope を §token-scope で 7 行に明示、禁止 scope を 4 行で明示
- Secret hygiene: §grep-pattern 6 種で gate、`.env` Read 禁止維持

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | R-1〜R-12 観点マトリクス確定 | spec_created |
| 2 | token scope 最小権限化（§token-scope） | spec_created |
| 3 | attack surface 変化評価（§attack-surface） | spec_created |
| 4 | 脅威モデル T-1〜T-6 確定 | spec_created |
| 5 | secret-leak grep pattern 6 種確定 | spec_created |
| 6 | ADR-0001 / 不変条件 #5 / CLAUDE.md 整合確認 | spec_created |
| 7 | 4 条件最終判定 | spec_created |
| 8 | Design GO / runtime GO 分離宣言 | spec_created |
| 9 | blocker B-01〜B-05 整理 | spec_created |
| 10 | MAJOR 戻りフロー定義 | spec_created |
| 11 | ユーザー承認ゲート（Phase 13 連動）設計 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-10/security-review.md` | R-1〜R-12 + §grep-pattern + §claudemd-alignment + 4 条件 |
| ドキュメント | `outputs/phase-10/design-go-decision.md` | Design GO 判定 + runtime GO 分離 + blocker + MAJOR 戻りフロー |
| ドキュメント | `outputs/phase-10/token-scope-check.md` | `CLOUDFLARE_API_TOKEN` scope 最小権限一覧 + 禁止 scope + rotation 手順 |
| ドキュメント | `outputs/phase-10/threat-model.md` | T-1〜T-6 詳細 + 残存リスク評価 |
| メタ | `artifacts.json` | Phase 10 状態更新（`spec_created`） |

## 完了条件

- [ ] R-1〜R-12 がすべて PASS
- [ ] 脅威モデル T-1〜T-6 すべてに対策記述
- [ ] token scope 一覧が必須 / 任意 / 禁止の 3 区分で明示
- [ ] attack surface 変化が 7 観点で表化
- [ ] secret-leak grep pattern 6 種が列挙
- [ ] ADR-0001 / 不変条件 #5 / CLAUDE.md「Cloudflare 系 CLI 実行ルール」整合確認済
- [ ] 4 条件最終判定が PASS
- [ ] Design GO と runtime GO の分離が明示
- [ ] blocker B-01〜B-05 が記述
- [ ] MAJOR 検出時戻りフローが 5 件以上定義
- [ ] ユーザー承認ゲートが Phase 13 と連動
- [ ] `wrangler` 直叩きが本仕様書内ゼロ（`wrangler tail` 例外言及のみ許容）

## タスク100%実行確認【必須】

- 実行サブタスク 11 件すべてが `spec_created`
- 成果物 4 ファイルが `outputs/phase-10/` 配下に配置予定
- artifacts.json の Phase 10 status が `spec_created`
- secret 値の記述例にも実トークンが登場しない（key 名 / pattern のみ）
- production deploy 実行は本 Phase で 0 件、Phase 13 へ blocked

## 次の Phase

Phase 11: NON_VISUAL evidence 取得（Phase 8 / Phase 9 で計画した evidence path に実出力を保存し、Design GO 根拠として完成させる）
