# Phase 10: ロールアウト・ロールバック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/api `/health/db` D1 疎通 endpoint 実装仕様化 (ut-06-followup-H-health-db-endpoint) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | ロールアウト・ロールバック |
| 作成日 | 2026-04-29 |
| 前 Phase | 9 (SLO / 監視) |
| 次 Phase | 11 (手動 smoke / NON_VISUAL walkthrough) |
| 状態 | spec_created |
| タスク種別 | implementation / docs-only / NON_VISUAL / api_health |

## 目的

Phase 1〜9 で確定した設計（base case = 案 D：固定パス + X-Health-Token + WAF / IP allowlist 併用 / レスポンス schema 200 / 503 + `Retry-After: 30` / state ownership 表で apps/web 不在 / SLO は GET 200 / 503 二系統）を、本番環境へ安全に展開・撤退させるためのロールアウト 5 段階（R1〜R5）とロールバック手順を仕様レベルで固定する。

本タスクは feature flag を **採用しない**。`/health/db` は単体 endpoint であり、`apps/api` の deploy 完了 = 即時公開となる。よって rollout の粒度は「環境分割 (staging → production)」+「外周制御の解除順序 (WAF rule → endpoint disable → revert deploy)」の 2 軸で設計する。実コード適用 / 実 deploy 実行は Phase 13 ユーザー承認後の別 PR / 別オペレーションに委ねる。

## 真の論点 (true issue)

- 「rollout / rollback の手順」ではなく、**「不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）を侵害せず、WAF / 認証層 (案 D) と endpoint deploy の解除順序を逆転させない運用境界の確立」** が本質。
- 副次論点:
  1. `wrangler` 直接実行禁止の徹底（CLAUDE.md §シークレット管理 / §Cloudflare 系 CLI 実行ルール）
  2. D1 binding が `wrangler.toml` 上で staging / production 両方で `binding = "DB"` として有効化されているかの rollback ガード
  3. WAF drift（先に endpoint を生かしてから WAF rule を適用するなど順序事故）の予防
  4. UT-08 通知基盤が rollback 中の 503 を「障害」として誤検知しないための Retry-After / monitoring suppression 連携

## ロールアウト計画（R1〜R5）

> **大前提**: 全 Cloudflare CLI 操作は `bash scripts/cf.sh` ラッパー経由で実行する。`wrangler` 直接実行は CLAUDE.md §シークレット管理 で禁止されており、本 Phase でも禁止事項として固定する。`scripts/cf.sh` は `op run` による secret 注入 + `ESBUILD_BINARY_PATH` 解決 + `mise exec` 経由 Node 24 / pnpm 10 保証を兼ねる。

### R1: dev (staging) deploy → smoke S-03

| 項目 | 内容 |
| --- | --- |
| 目的 | 本番投入前の最終 smoke。`/health/db` が staging で 200 + `{ ok: true, db: "ok", check: "SELECT 1" }` を返すこと |
| 前提 | UT-22 D1 migration が staging に適用済 / WAF rule (案 D) が staging で有効 / `HEALTH_DB_TOKEN` が staging Secret に注入済 |
| 実行コマンド（仕様レベル） | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` |
| 検証 | Phase 11 §S-03（staging /health/db GET → 200 schema 一致） |
| 異常時 | 直前 deploy version へ rollback：`bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env staging` |
| GO 条件 | S-03 GREEN かつ wrangler tail で error log なし（5 分観察） |

### R2: main (production) deploy → smoke S-07

| 項目 | 内容 |
| --- | --- |
| 目的 | 本番公開。`/health/db` が production で 200 + 同 schema を返すこと |
| 前提 | R1 GO 条件達成 / UT-22 が production にも適用済 / production WAF rule + `HEALTH_DB_TOKEN` 注入済 |
| 実行コマンド | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` |
| 検証 | Phase 11 §S-07（production /health/db GET → 200 schema 一致） |
| 異常時 | 直前 deploy version へ rollback：`bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production` |
| GO 条件 | S-07 GREEN / UT-08 通知基盤側で false alert なし |

### R3: D1 binding 不一致時の rollback ガード

| 項目 | 内容 |
| --- | --- |
| トリガ | deploy 直後に `c.env.DB` が undefined / `Cannot read properties of undefined (reading 'prepare')` 系の runtime エラーが観測される |
| 原因 | `apps/api/wrangler.toml` の `[[d1_databases]]` binding が当該 env で欠落 / database_id 不整合 / UT-22 未完 |
| ガード手順 | (a) deploy 前: `bash scripts/cf.sh d1 list` で `ubm-hyogo-db-staging` / `ubm-hyogo-db-prod` の存在確認、`bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` で migration drift なきこと確認 |
| | (b) deploy 後: `wrangler.toml` 上の `binding`/`database_id` を git diff で snapshot 化（`outputs/phase-10/wrangler-binding-snapshot.txt` に保管予定） |
| rollback 順序 | (1) 直前 deploy version へ revert（`bash scripts/cf.sh rollback <VERSION_ID> ...`）→ (2) `wrangler.toml` の binding 修正 PR → (3) UT-22 適用状況の再確認 → (4) 修正後の再 deploy |
| 禁止事項 | binding 不整合のまま endpoint だけ disable する hotfix 直接 push（CLAUDE.md ブランチ戦略違反） |

### R4: 認証 (案 D) / Retry-After が WAF と整合しない場合の rollback 順序

| 状況 | 解除順序（必ず外周から） |
| --- | --- |
| WAF rule が誤って解除され、unauth で `/health/db` が叩かれている | (1) 先に WAF rule を再適用 / IP allowlist を再導入（外周層を閉じる）→ (2) endpoint を一時 disable（`apps/api/src/index.ts` で 410 Gone を返す軽量パッチを deploy）→ (3) 直前 deploy version へ revert |
| `Retry-After` 値が UT-08 閾値と不整合で 503 連発 → false alert 暴走 | (1) UT-08 通知基盤側で当該 endpoint の suppression を一時有効化（運用通知）→ (2) `Retry-After` 値を再合意して別 PR で修正 → (3) 旧 deploy への rollback は不要（203/503 schema は維持） |
| 認証トークン `HEALTH_DB_TOKEN` 漏洩 | (1) 先に WAF rule を tighten（IP allowlist のみで一時封鎖）→ (2) `bash scripts/cf.sh secret put HEALTH_DB_TOKEN --config apps/api/wrangler.toml --env <env>` で rotation → (3) endpoint deploy はそのまま、token 失効の伝播確認 |

> **核心**: WAF / 認証層を「先に削除してから」endpoint を revert すると、revert window 中に unauth で D1 ping が打てる時間帯が発生する。**外周 → endpoint の順序を絶対に逆転させない** ことを Phase 13 実走の必須ゲートとする。

### R5: ロールバック後の再開条件

| 条件 | 確認方法 |
| --- | --- |
| UT-22 D1 migration が production / staging で適用済 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` で未適用 0 件 |
| WAF rule（案 D）が staging / production で有効、ヘッダ token + IP allowlist が一致 | Cloudflare dashboard / `gh api` 等で WAF rule snapshot を取得 |
| `HEALTH_DB_TOKEN` が両 env で valid / rotation 後の伝播完了 | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <env>` で存在確認（値は読まない） |
| smoke S-03 (staging) が GREEN | Phase 11 §S-03 |
| smoke S-07 (production) が GREEN | Phase 11 §S-07 |
| UT-08 通知基盤が当該 endpoint で false alert なし | UT-08 dashboard / log で 24h observation |

→ 上記 6 条件すべて GREEN で「再開可能」。1 件でも未充足なら再開 NO-GO。

## ロールバック手順（共通）

```bash
# 0. 直前 deploy の VERSION_ID を確認（実走時は wrangler deployments list を scripts/cf.sh 経由で）
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env <env>

# 1. 直前 version へ revert
bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env <env>

# 2. revert 直後の smoke
#    staging → Phase 11 §S-03 / production → Phase 11 §S-07

# 3. 4 階層代替 evidence の保全（Phase 11 §evidence 参照）
#    L1: コマンド stdout / L2: wrangler tail log / L3: 応答 JSON / L4: CF Analytics dashboard snapshot ID
```

> `wrangler rollback` を **直接呼ばない**。CLAUDE.md §Cloudflare 系 CLI 実行ルールに従い、必ず `bash scripts/cf.sh rollback ...` 経由で実行する。

## 依存

| 種別 | 対象 | 受け取る前提 |
| --- | --- | --- |
| 上流 | Phase 8 認証 / WAF | base case = 案 D（ヘッダ token + WAF / IP allowlist 併用）/ `HEALTH_DB_TOKEN` の Secret 注入経路 |
| 上流 | Phase 9 SLO / 監視 | 503 の許容閾値 / `Retry-After: 30` の運用合意 / UT-08 通知基盤との連携手順 |
| 上流（必須） | UT-22 D1 migration | staging / production で binding `DB` が runtime 有効 |
| 関連 | UT-06-FU-I (/health) | revert 中も `/health` 側応答が drift しない |
| 下流 | Phase 11 smoke | R1 / R2 GO 判定の根拠 |
| 下流 | Phase 13 実 deploy | 本 Phase で固定した順序を runbook 化 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-08.md | 認証 (案 D) 採用根拠 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-09.md | SLO / Retry-After / UT-08 連携 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-02.md | 設計（state ownership / file 変更計画） |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-03.md | NO-GO 条件 / 4 条件 PASS |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-11/smoke-test-result.md | S-03 / S-07 期待値テンプレ |
| 必須 | CLAUDE.md §Cloudflare 系 CLI 実行ルール | `scripts/cf.sh` 徹底 / `wrangler` 直接実行禁止 |
| 必須 | CLAUDE.md §重要な不変条件 #5 | apps/web から D1 直接アクセス禁止 |
| 必須 | scripts/cf.sh | rollout / rollback の唯一の実行経路 |
| 必須 | apps/api/wrangler.toml | D1 binding 確認対象（R3 ガード） |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-10.md | 最終レビュー Phase 構造リファレンス |

## 実行タスク

1. R1〜R5 の rollout 手順を固定する（完了条件: staging / production / observe / rollback / close-out がある）。
2. UT-22 完了確認を deploy 前 gate として再定義する（完了条件: 未完了なら Phase 5 へ進めない）。
3. `scripts/cf.sh` 経由の deploy / tail / rollback 手順を固定する（完了条件: wrangler 直接実行がない）。
4. Phase 11 smoke S-03 / S-07 を GO 判定に接続する（完了条件: staging / production の GREEN 条件がある）。
5. rollback trigger と rollback 手順を定義する（完了条件: 503 連発 / WAF 誤設定 / `c.env.DB` undefined に対応する）。
6. post-deploy evidence の保存先を Phase 11 と接続する（完了条件: 4 階層 evidence に trace される）。
7. Phase 12 close-out へ引き渡す運用記録を固定する（完了条件: documentation-changelog と implementation-guide に trace される）。

## 実行手順

### ステップ 1: R1〜R5 の手順確定

- 5 段階それぞれを「目的 / 前提 / 実行コマンド / 検証 / 異常時 / GO 条件」の 6 軸で記述する。

### ステップ 2: ロールバック共通手順の固定

- `bash scripts/cf.sh rollback ...` を唯一の経路として明記し、`wrangler` 直接実行は禁止と明記。

### ステップ 3: WAF / endpoint 解除順序の固定

- R4 で「外周（WAF）→ 内側（endpoint）→ revert」の順序を絶対に逆転させない旨を warning として明記。

### ステップ 4: 再開条件の確定

- R5 の 6 条件をすべて GREEN にしないと再開不可と確定する。

### ステップ 5: artifacts.json への登録予約

- Phase 10 状態を `spec_created` で登録予約。実 deploy / 実 rollback は Phase 13 ユーザー承認後の別オペレーションで実行する旨を冒頭で明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | R1 / R2 の GO 判定根拠として S-03 / S-07 を引き渡す |
| Phase 12 | apply-runbook / rollback-runbook の本文を ledger 化 |
| Phase 13 | ユーザー承認ゲート前チェックリスト（UT-22 完了 / WAF 有効 / Token 注入 / smoke GREEN / `scripts/cf.sh` 経由実行）に R1〜R5 を反映 |
| UT-08 通知基盤 | R4 / R5 の 503 / Retry-After 連携を運用通知として共有 |

## 多角的チェック観点

- **不変条件 #5 違反**: rollback 中に `apps/web` から D1 を直接叩く逃げ道が混入していないか。state ownership 表（Phase 2）と整合するか。
- **監視誤検知**: revert 中の 503 / Retry-After で UT-08 通知基盤が暴走しないか。R4 / R5 で suppression 経路が確保されているか。
- **WAF drift**: WAF rule が解除されたまま endpoint だけ生きる時間帯が発生していないか（R4 の解除順序）。
- **D1 binding 不一致**: `wrangler.toml` の binding が deploy 環境で揃っているか（R3 ガード）。
- **`scripts/cf.sh` 徹底**: 本 Phase / Phase 11 / 13 のすべての実行例が `bash scripts/cf.sh ...` で書かれているか。`wrangler` 直接呼び出しが残っていないか。
- **Token 漏洩耐性**: `HEALTH_DB_TOKEN` rotation 経路（R4）が defense in depth として機能するか。
- **再開条件の網羅性**: R5 の 6 条件で「片方の env だけ復旧」状態を検出できるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | R1 (staging deploy + S-03) 仕様確定 | 10 | spec_created | `scripts/cf.sh deploy --env staging` |
| 2 | R2 (production deploy + S-07) 仕様確定 | 10 | spec_created | `scripts/cf.sh deploy --env production` |
| 3 | R3 (D1 binding 不一致 rollback ガード) 確定 | 10 | spec_created | `wrangler.toml` 同期確認 |
| 4 | R4 (WAF / 認証 解除順序) 確定 | 10 | spec_created | 外周 → endpoint → revert |
| 5 | R5 (再開条件 6 件) 確定 | 10 | spec_created | UT-22 / WAF / Token / S-03 / S-07 / UT-08 |
| 6 | ロールバック共通手順 + `scripts/cf.sh` 徹底 | 10 | spec_created | `wrangler` 直接禁止 |
| 7 | 不変条件 #5 / 監視誤検知 / WAF drift の多角的チェック | 10 | spec_created | 7 観点記述 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-10.md | 本ファイル（ロールアウト R1〜R5 / ロールバック共通手順 / 多角的チェック） |
| メタ | artifacts.json | Phase 10 状態の更新（spec_created） |

> 本 Phase の主成果物は `phase-10.md` 単独。`outputs/phase-10/` 配下のサブ成果物は Phase 13 実走時にのみ生成される（apply-runbook / rollback-runbook 等）。本 Phase では生成しない。

## 完了条件

- [ ] R1 / R2 / R3 / R4 / R5 の 5 段階すべて手順 / 検証 / 異常時 / GO 条件が記述されている
- [ ] ロールバック共通手順が `bash scripts/cf.sh rollback ...` 経由で記述されている（`wrangler` 直接実行が一切現れない）
- [ ] R4 で「外周 (WAF) → endpoint → revert」の解除順序が warning として明記されている
- [ ] R5 で再開条件 6 件（UT-22 / WAF / Token / S-03 / S-07 / UT-08）が記述されている
- [ ] 不変条件 #5 / 監視誤検知 / WAF drift の 3 観点が多角的チェックに含まれる
- [ ] Phase 8 認証 / Phase 9 SLO への依存が §依存 で明示されている
- [ ] 本 Phase の status が spec_created で artifacts.json と整合する

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- `phase-10.md` 配置済み
- `wrangler` 直接実行が文中に存在しない
- 不変条件 #5 / `scripts/cf.sh` 徹底 / `wrangler` 直接実行禁止 が明記されている
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke / NON_VISUAL walkthrough)
- 引き継ぎ事項:
  - R1 GO 条件 = S-03 GREEN
  - R2 GO 条件 = S-07 GREEN
  - R5 再開条件 6 件
  - WAF / endpoint / revert の解除順序（外周優先）
  - `scripts/cf.sh` 経由徹底ルール
- ブロック条件:
  - `wrangler` 直接実行が記述に残っている
  - R4 解除順序が逆転している記述がある
  - UT-22 完了前提が R3 / R5 で欠落
  - 不変条件 #5 違反の rollback パス（apps/web からの D1 直接アクセス）が混入
