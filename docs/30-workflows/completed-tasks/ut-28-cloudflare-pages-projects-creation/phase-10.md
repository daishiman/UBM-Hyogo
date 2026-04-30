# Phase 10: 受入確認 / UT-27 への命名引き渡し

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Pages プロジェクト（staging / production）作成 (ut-28-cloudflare-pages-projects-creation) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 受入確認 / UT-27 への命名引き渡し成果物 |
| 作成日 | 2026-04-29 |
| 前 Phase | 9 (統合検証 / E2E) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / cloudflare_pages_projects_creation |

## 目的

Phase 1〜9 で確定した要件・設計・レビュー・テスト戦略・実装ランブック・異常系・AC マトリクス・品質ゲート・E2E を統合し、本タスクの **受入確認** を実施する。具体的には (1) AC-1〜AC-15 全件の最終評価、(2) 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終再評価、(3) Phase 13 ユーザー承認ゲート前チェックリストの確定、(4) blocker list の最終確定、(5) 上流 2 件（01b / UT-05）完了確認の 4 重明記、(6) **UT-27 への命名引き渡し成果物**（`CLOUDFLARE_PAGES_PROJECT` Variable 値 = `ubm-hyogo-web` (production 名 suffix なし) / suffix `-staging` 連結方式 / Variable 配置責務 = UT-27）の文書化、(7) MINOR 指摘の Phase 12 unassigned-task-detection.md への formalize ルート、を確定する。本ワークフローは仕様書整備に閉じ、実 `wrangler pages project create` PUT は Phase 13 ユーザー承認後に委ねる。最終判定は **「仕様書として PASS / 実プロジェクト作成は Phase 13 ユーザー承認後の別オペレーション / status=pending」** とする。

## 30 思考法レビュー後の blocker 5 群

| 群 | 判定 | Phase 13 ゲート |
| --- | --- | --- |
| 状態管理 | root は `spec_created`、Phase 4〜13 は `pending` に統一 | artifacts parity と outputs 実体確認 |
| 実走承認 | PR 作成 / Pages 作成 / push smoke は独立承認 | 承認なしでは実行しない |
| OpenNext | `.next` 継続は正本例外がない限り実 apply ブロッカー | UT-05 修正または例外記録を確認 |
| secret hygiene | Token / Account ID / Project ID 実値を記録しない | grep とマスク運用 |
| drift | Git 連携 / compatibility / branch mapping の手動 drift | 作成直後と smoke 後に確認 |

## 実行タスク

1. AC-1〜AC-15 を pending 視点で評価し、PASS / FAIL / 仕様確定先 を全件付与する（完了条件: 15 件すべてに判定 + 確定先 Phase 番号が付与）。
2. 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終再評価を行う（完了条件: 各観点に PASS/MINOR/MAJOR + 根拠が記述）。
3. Phase 13 ユーザー承認ゲート前チェックリストを確定する（完了条件: 「上流 2 件 completed 再確認」「Phase 11 walkthrough 完了」「Phase 8 drift 検知 OK」「Phase 9 E2E 6 シナリオ green」「AC-13 機械検証 0 件」「Pages Git 連携 OFF 確認」「`production_branch` 環境別配線確認」「`compatibility_date` Workers 同期確認」「user_approval_required: true」の 9 件以上）。
4. blocker list を最終確定する（完了条件: B-01〜B-08 を含む 8 件以上、上流 2 件未完了 / API Token / Account ID 転記 / `production_branch` 取り違え / `compatibility_date` 乖離 / 命名揺れ / Pages Git 連携 ON / OpenNext red 未対応 / Variable 引き渡し未確定 を含む）。
5. **UT-27 への命名引き渡し成果物** を文書化する（完了条件: Variable 名 = `CLOUDFLARE_PAGES_PROJECT` / 値 = `ubm-hyogo-web` / scope = repository（UT-27 側で確定）/ `web-cd.yml` 内 suffix `-staging` 連結方式 / 引き渡しタイミング = 本タスク Phase 13 完了直後 / 引き渡し方法 = `outputs/phase-10/handoff-to-ut27.md` ファイル化、が記述）。
6. MINOR 指摘の Phase 12 unassigned-task-detection.md への formalize ルートを確定する（完了条件: 既知候補 6 件（Terraform 化 / 案 D / OpenNext 切替 / カスタムドメイン / 命名変更手順 / drift 月次走査自動化）が登録方針付きで記述）。
7. 上流 2 件（01b / UT-05）完了確認の 4 重明記を確定する（完了条件: Phase 1 / 2 / 3 / 10 の 4 箇所で重複明記、本 Phase が 4 重目）。
8. 最終 GO/NO-GO 判定を確定し、`outputs/phase-10/main.md` に記述する（完了条件: 「仕様書 PASS / 実プロジェクト作成は Phase 13 ユーザー承認後 / status=pending」が明示）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/index.md | AC-1〜AC-15 / Phase 一覧 / 不変条件 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-01.md | 4 条件評価初期判定 / 上流 2 件依存境界 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-02.md | base case / 命名規則 / 設定一致表 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-03.md | base case 最終判定（PASS with notes）/ 上流 2 件 NO-GO 条件 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-08.md | 品質ゲート / drift 検知 / NON_VISUAL evidence 規律 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-09.md | E2E 6 シナリオ / UT-29 責務境界 |
| 必須 | docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md §苦戦箇所・知見 | リスク源（§1〜§5） |
| 必須 | docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md | 引き渡し先 Variable 配置の正本仕様 |
| 参考 | docs/30-workflows/completed-tasks/ut-27-github-secrets-variables-deployment/phase-10.md | 同型 受入確認 phase の構造参照 |

## 上流 2 件完了確認 — 重複明記 4/4（最終）

> **01b（Cloudflare base bootstrap）/ UT-05（CI/CD パイプライン実装）の 2 件すべてが completed であることが、Phase 13 実プロジェクト作成着手の必須前提である。**
> 1 件でも未完了なら gate 通過 NO-GO。Phase 1 §依存境界・Phase 2 §依存タスク順序・Phase 3 §NO-GO 条件・本 Phase §gate 通過判定 の 4 箇所で重複明記する（本 Phase が 4 重目）。

### 4 重明記の根拠

| # | 明記箇所 | 役割 |
| --- | --- | --- |
| 1 | Phase 1 §依存境界 | 要件レベルでの前提宣言 |
| 2 | Phase 2 §依存タスク順序 | 設計レベルでの前提再宣言 |
| 3 | Phase 3 §NO-GO 条件 / §着手可否ゲート | 設計レビューレベルでの最終 gate |
| 4 | Phase 10 §上流確認 / §Phase 13 進入判定 | 実 PUT 着手前の最終 gate（本 Phase） |

## AC × PASS/FAIL マトリクス（pending 視点）

> **評価基準**: 「Phase 1〜9 で具体的に確定し、Phase 5 / 11 / 13 で実装・実走可能な粒度に分解されているか」で判定する。実 `wrangler pages project create` PUT は未実行。

| AC | 内容（要約） | 仕様確定先 | 判定 |
| --- | --- | --- | --- |
| AC-1 | production プロジェクト `ubm-hyogo-web` を `production_branch=main` で作成 | Phase 2 §設定一致表 / Phase 5 lane 3 | PASS |
| AC-2 | staging プロジェクト `ubm-hyogo-web-staging` を `production_branch=dev` で作成 | Phase 2 §設定一致表 / Phase 5 lane 4 | PASS |
| AC-3 | `nodejs_compat` フラグの両プロジェクト ON 化 | Phase 2 §設定一致表 / Phase 8 §drift 検知 | PASS |
| AC-4 | `compatibility_date` を Workers `2025-01-01` と整合 | Phase 2 §設定一致表 / Phase 8 §drift 検知 | PASS |
| AC-5 | OpenNext アップロード判定基準 + UT-05 フィードバック条件 | Phase 2 §OpenNext 判定 / Phase 9 §シナリオ 5 | PASS |
| AC-6 | 命名規則「`<base>` / `<base>-staging`」+ Variable 値 = production 名（suffix なし） | Phase 2 §命名規則 / 本 Phase §UT-27 引き渡し | PASS |
| AC-7 | Pages Git 連携 OFF 方針 | Phase 2 §設定一致表 / Phase 8 §重複起動防止 | PASS |
| AC-8 | dev push で staging プロジェクト deploy 成功 | Phase 9 §シナリオ 1 / Phase 11 smoke | PASS |
| AC-9 | main push で production プロジェクト deploy 成功 | Phase 9 §シナリオ 2 / Phase 11 smoke | PASS |
| AC-10 | 苦戦箇所 5 件 → R-1〜R-5 マッピング | Phase 2 §リスク表 | PASS |
| AC-11 | 4 条件 PASS（Phase 1 / 3 双方）| Phase 1 / Phase 3 / 本 Phase | PASS |
| AC-12 | 上流 2 件完了確認 3 重明記（→ 本 Phase で 4 重目に拡張）| Phase 1 / 2 / 3 / 10 | PASS |
| AC-13 | API Token / Account ID / プロジェクト ID 値転記禁止 | 全 Phase / Phase 8 §AC-13 機械検証 | PASS |
| AC-14 | `bash scripts/cf.sh` 経由（`wrangler` 直接禁止）| Phase 2 §コマンド草案 / Phase 8 §重複起動防止 / 全 Phase | PASS |
| AC-15 | Phase 1〜13 が artifacts.json と一致 | artifacts.json / index.md | PASS |

**合計: 15/15 PASS（pending 視点）**

> **注**: 本評価は「仕様書整備として確定済み」の意味。実 `wrangler pages project create` PUT は未実行。Phase 13 ユーザー承認後の別オペレーションで AC-1〜AC-15 が実走確認される。

## 4 条件最終再評価

| 条件 | 判定 | 根拠（Phase 9 までの確定事項を統合） |
| --- | --- | --- |
| 価値性 | PASS | dev push → staging deploy success / main push → production deploy success / 公開 URL 200 / UT-29 ハンドオフ成立。`web-cd.yml` の dev/main 経路が空振りに終わるリスクを除去。UT-06 / UT-16 / UT-27 / UT-29 の前提が確定 |
| 実現性 | PASS | `bash scripts/cf.sh pages project create` は既存ラッパーで実行可能、追加依存ゼロ。Phase 8 drift 検知 / Phase 9 E2E 6 シナリオで機械検証可能。Phase 11 smoke で実走確認 |
| 整合性 | PASS | 不変条件 #5 を侵害しない（D1 不関与）/ CLAUDE.md「`wrangler` 直接実行禁止 / `scripts/cf.sh` 経由 / 1Password 正本 / API Token 値転記禁止」と完全整合 / Workers 正本（`apps/api/wrangler.toml` `compatibility_date = 2025-01-01` / `compatibility_flags = ["nodejs_compat"]`）と Pages 派生の境界が drift 検知で保証 |
| 運用性 | PASS | 命名「`<base>` / `<base>-staging`」固定 + Variable 値 production 名 suffix なし + `web-cd.yml` 側 suffix 連結方式で UT-27 引き渡しが明快 / Pages Git 連携 OFF で二重起動回避 / 切り戻し 3 段（rerun / 再作成 / revert）/ 月次 drift 検知運用 |

**最終判定: PASS（仕様書として）**

## Phase 13 ユーザー承認ゲート前チェックリスト

> Phase 13 で実 `bash scripts/cf.sh pages project create ...` を実行する**前**に、実行者本人（solo 運用）が以下のチェックリストを 1 件ずつ確認すること。1 件でも未充足なら gate 通過 NO-GO。

| # | チェック項目 | 確認方法 | 期待結果 |
| --- | --- | --- | --- |
| 1 | 上流 2 件 completed 再確認（01b / UT-05） | `bash scripts/cf.sh whoami` 成功 + `gh pr list --search "UT-05" --state merged` + Phase 3 §上流チェックポイント | 2 件すべて completed |
| 2 | Phase 11 walkthrough 完了（post-apply smoke 手順固定 / 実 smoke は Phase 13 承認後） | `outputs/phase-11/manual-smoke-log.md` 存在 + NOT EXECUTED 理由確認 | 存在、手順固定 |
| 3 | Phase 8 drift 検知 OK（2 環境 × 4 項目 = 8 セル） | Phase 8 §3.3 `verify_pages_drift` 実走 | 全 OK |
| 4 | Phase 9 E2E 6 シナリオ green | `outputs/phase-09/*.json` evidence 確認 | 全 conclusion = success / HTTP 200 |
| 5 | AC-13 機械検証 0 件 | Phase 8 §5.2 `verify_no_secret_leak` 実走 | 0 ヒット |
| 6 | Pages Git 連携 OFF 確認（2 プロジェクト） | `bash scripts/cf.sh pages project info` で `source = null` | 2 件とも null |
| 7 | `production_branch` 環境別配線確認 | production = main / staging = dev | 一致 |
| 8 | `compatibility_date` Workers 同期確認 | Workers 側 `2025-01-01` と Pages 側一致 | 一致 |
| 9 | OpenNext 判定 (A) or (B) の決着 | Phase 9 §シナリオ 5 結果 | (A) または (B) のどちらかが確定 |
| 10 | UT-27 引き渡しドキュメント存在 | `outputs/phase-10/handoff-to-ut27.md` 存在 | 存在 |
| 11 | `user_approval_required: true` ゲート | `artifacts.json` の Phase 13 設定 | true |

## blocker 判定基準

> 以下のいずれかに該当する場合、Phase 13 実プロジェクト作成は **着手 NO-GO**。本ワークフロー（pending）は仕様書整備に閉じるが、これらの blocker は Phase 13 着手前の必須 gate として機能する。

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | 上流 2 件（01b / UT-05）のいずれかが completed でない | 上流タスク（最重要・4 重明記） | 2 件すべて main マージ済み | Phase 3 §上流チェックポイント |
| B-02 | API Token / Account ID 値が payload / runbook / Phase outputs / shell history に転記されている | secret 漏洩（最重要） | `verify_no_secret_leak` 実走で 0 ヒット、必要なら token ローテーション | Phase 8 §5.2 |
| B-03 | `production_branch` の環境別配線が逆（production=dev / staging=main 等）| 設計違反（§2 苦戦箇所） | `bash scripts/cf.sh pages project info` で正しい配線 | drift 検知 |
| B-04 | `compatibility_date` が Workers 側（`2025-01-01`）と乖離 | 設計違反（§3 苦戦箇所） | Workers / Pages の値一致 | drift 検知 |
| B-05 | プロジェクト命名が `<base>` / `<base>-staging` から外れる、または Variable 引き渡し値が production 名以外 | 設計違反（§4 苦戦箇所 / AC-6） | 命名規則固定 + Variable 値 = production 名 | grep + handoff doc |
| B-06 | Pages Git 連携が ON（自動 deploy 二重起動）| 設計違反（§5 苦戦箇所） | `pages project info` で `source = null` | drift 検知 |
| B-07 | OpenNext 判定 (B) で UT-05 フィードバックが未登録 | 動作違反（§1 苦戦箇所） | Phase 12 unassigned-task-detection.md に登録 / 本タスクではプロジェクト作成のみ | Phase 12 確認 |
| B-08 | UT-27 への引き渡しドキュメント `handoff-to-ut27.md` が未生成 | 引き渡し違反（AC-6） | `outputs/phase-10/handoff-to-ut27.md` 生成 | `[ -f ]` 存在確認 |

### blocker 優先順位

1. **B-01（上流 2 件未完了）**: 最重要。401 / 8000017 / 命名ミスマッチ事故の唯一の再発防止策。Phase 1 / 2 / 3 / 10 で 4 重明記済み。
2. **B-02（API Token / Account ID 転記）**: secret 漏洩は不可逆。Phase 8 §5 で機械検証。
3. **B-03 / B-04 / B-05 / B-06（設計違反）**: drift 検知 / 命名規則 / Variable 引き渡しで予防。
4. **B-08（引き渡し違反）**: UT-27 が後続作業で待機する。
5. **B-07（OpenNext red 未対応）**: 機能欠落。Phase 12 で確実に formalize する。

## UT-27 への命名引き渡し成果物（本 Phase の核心成果物）

### 5.1 引き渡し対象

| 項目 | 値 | 備考 |
| --- | --- | --- |
| Variable 名 | `CLOUDFLARE_PAGES_PROJECT` | GitHub Actions Variables（Repository scope）/ scope 確定は UT-27 側 |
| 値（production 名）| `ubm-hyogo-web` | suffix なし。`apps/web/wrangler.toml` の `name` と一致 |
| staging 用 suffix 連結方式 | `${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging` | `web-cd.yml` 内で連結。Variable 自体は production 名のみ保持 |
| 連結結果（staging）| `ubm-hyogo-web-staging` | `apps/web/wrangler.toml` `[env.staging] name` と一致 |
| 引き渡しタイミング | 本タスク Phase 13 完了直後 | プロジェクト 2 件作成成功後に UT-27 へ通知 |
| 引き渡し方法 | `outputs/phase-10/handoff-to-ut27.md` をファイル化、PR description にリンク | UT-27 着手者が読む |
| Variable 配置責務 | UT-27（本タスクは値の出所を提供のみ）| `gh variable set` 実行は UT-27 |

### 5.2 `handoff-to-ut27.md` の必須セクション

```markdown
# UT-28 → UT-27 命名引き渡し

## Variable 設定値（UT-27 側で `gh variable set` 実行）

| Variable 名 | 値 | scope（推奨） |
| --- | --- | --- |
| CLOUDFLARE_PAGES_PROJECT | ubm-hyogo-web | repository（UT-27 側判断）|

## `web-cd.yml` 内連結方式

- production deploy: `--project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}`
- staging deploy:    `--project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging`

## 既存 Cloudflare Pages プロジェクト（本タスクで作成済み）

- production: ubm-hyogo-web      （production_branch = main / nodejs_compat ON / 2025-01-01）
- staging:    ubm-hyogo-web-staging （production_branch = dev  / nodejs_compat ON / 2025-01-01）

## 検証コマンド（UT-27 配置後の整合確認）

```bash
gh variable get CLOUDFLARE_PAGES_PROJECT
# 期待出力: ubm-hyogo-web

grep -nE 'project-name=\$\{\{ vars\.CLOUDFLARE_PAGES_PROJECT \}\}' .github/workflows/web-cd.yml
# 期待: 2 件以上ヒット（production 用 + staging 用 -staging suffix 付き）

bash scripts/cf.sh pages project list | grep -E '^(ubm-hyogo-web|ubm-hyogo-web-staging)\s'
# 期待: 2 件ヒット
```

## 注意

- API Token / Account ID 値はこのドキュメントに含めない（UT-27 が独自に 1Password から取得）。
- 命名変更が将来必要になった場合は、Pages プロジェクト delete → create + Variable 値同時更新が必須（Phase 12 ドキュメント化済）。
```

### 5.3 引き渡しの完了確認

- 本 Phase 完了時点で `outputs/phase-10/handoff-to-ut27.md` の **テンプレート** がコミットされていること（プレースホルダ可）。
- Phase 13 本適用直後に **実値で更新**（プロジェクト名 / Variable 推奨値 / `web-cd.yml` 内連結方式の確定済み grep 結果）して再コミット。
- UT-27 着手者は本ドキュメントを起点に `gh variable set CLOUDFLARE_PAGES_PROJECT --body ubm-hyogo-web` を実行する。

## MINOR 指摘の未タスク化方針

- 本 Phase 10 では **MINOR 判定 0**（AC 15 件 / 4 条件すべて PASS）。
- 仮に Phase 11 / 12 / 13 で MINOR が発生した場合のルール:
  1. MINOR は **必ず未タスク化**（本ワークフロー内で抱え込まない）。
  2. `outputs/phase-12/unassigned-task-detection.md` に新規 ID を割り当てて登録。
  3. Phase 12 `implementation-guide.md` / `documentation-changelog.md` に該当 ID を記載。
  4. 該当 task は次 Wave 以降の優先度評価に回す。
- 既知候補（Phase 3 / Phase 9 由来）:
  - #1（OpenNext アップロード切替: `.next` → `.open-next/assets` への UT-05 フィードバック）→ Phase 12 unassigned（Phase 11 smoke 結果次第で formalize）
  - #2（Terraform Cloudflare Provider 化、案 C）→ Phase 12 unassigned（将来 IaC 化フェーズ）
  - #3（Pages Git 連携自動 deploy、案 D）→ Phase 12 unassigned（非推奨、参考登録のみ）
  - #4（カスタムドメイン本登録、UT-16 のスコープ）→ Phase 12 unassigned 確認 only
  - #5（命名変更が将来必要になった場合の delete → create 手順を runbook 化）→ Phase 12 implementation-guide.md
  - #6（drift 検知の月次走査自動化）→ Phase 12 unassigned（将来 helper script 化）

## Phase 13 進入判定（gate 通過判定）

### gate 通過の必要十分条件

| 条件 | 確認 | 該当 Phase |
| --- | --- | --- |
| Phase 1〜10 がすべて completed / 本 Phase が PASS | artifacts.json | Phase 1〜10 |
| Phase 11 walkthrough 完了（NON_VISUAL 代替 evidence と post-apply smoke 手順固定） | `outputs/phase-11/manual-smoke-log.md` | Phase 11 |
| Phase 12 ドキュメント更新完了 | `outputs/phase-12/*.md` | Phase 12 |
| Phase 13 ユーザー承認ゲート前チェックリスト 11 件すべて PASS | 本 Phase §チェックリスト | Phase 13 着手前 |
| 上流 2 件 completed（4 重明記） | Phase 3 §上流チェックポイント | 本 Phase 4 重目 |
| `user_approval_required: true` でユーザー承認取得 | artifacts.json + ユーザー対話 | Phase 13 |
| `outputs/phase-10/handoff-to-ut27.md` 存在 | `[ -f ]` | 本 Phase |

### gate 通過 NO-GO 条件（一つでも該当）

- Phase 11 walkthrough が未完了、または Phase 13 post-apply smoke 手順が未定義
- Phase 12 ドキュメント更新が未完了
- 承認ゲート前チェック 11 件のいずれかが未充足
- blocker B-01〜B-08 のいずれかが未解消
- ユーザー承認が取得されていない
- UT-27 引き渡しドキュメント未生成

## 最終 GO / NO-GO 判定

### 判定: **PASS（仕様書として）/ status=pending**

- 仕様書としての完成度: **PASS**（AC 15/15 / 4 条件すべて PASS / blocker 判定基準 8 件確定 / 承認ゲート前チェック 11 件確定 / 上流 4 重明記 / UT-27 引き渡し成果物確定）
- 実装ステータス: **pending**（実プロジェクト作成は Phase 13 ユーザー承認後）
- Phase 11 進行可否: 「仕様レベルの smoke コマンド系列レビュー + dev 空 commit push 実走（Pages プロジェクト未作成のため deploy は 8000017 期待 / または Phase 13 で先に作成してから push）」可。具体的進行は Phase 11 で確定。
- Phase 12 進行可否: implementation-guide.md / documentation-changelog.md / unassigned-task-detection.md / system-spec-update-summary.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md の 6 種整備が本ワークフロー内で可能。
- Phase 13 進行可否: 仕様書としては可だが、実 `bash scripts/cf.sh pages project create ...` PUT は **user_approval_required: true** ゲート + §Phase 13 ユーザー承認ゲート前チェックリスト 11 件すべて充足が必須。

### GO 条件（すべて満たすこと）

- [x] AC 15 件すべて PASS
- [x] 4 条件最終判定が PASS
- [x] blocker 判定基準が 5 件以上記述（本仕様では 8 件）
- [x] Phase 13 ユーザー承認ゲート前チェックリストが 5 件以上（本仕様では 11 件）
- [x] 上流 2 件完了確認が 4 重明記（本 Phase が 4 重目）
- [x] MAJOR ゼロ
- [x] MINOR を抱え込まず未タスク化方針を明記
- [x] UT-27 引き渡し成果物（Variable 名・値・suffix 連結方式・引き渡しタイミング・引き渡し方法）が確定
- [x] open question すべてに受け皿 Phase が指定済み

### NO-GO 条件（一つでも該当）

- 4 条件のいずれかに MAJOR が残る
- AC のうち PASS でないものがある
- blocker 判定基準が 5 件未満
- 承認ゲート前チェックリストが 5 件未満
- 上流 2 件完了確認の 4 重明記のいずれかが欠落
- secret 値転記が 1 件でも検出される（B-02）
- UT-27 引き渡し成果物が確定していない（B-08）

## 実行手順

### ステップ 1: AC マトリクス再評価
- AC-1〜AC-15 を pending 視点で全件再評価。

### ステップ 2: 4 条件最終再評価
- Phase 1 / Phase 3 base case を継承、Phase 8 / 9 結果で再確認。

### ステップ 3: Phase 13 ユーザー承認ゲート前チェックリスト確定
- 11 件のチェック項目を確定（上流 / Phase 11 smoke / drift 検知 / E2E / AC-13 / Pages Git 連携 OFF / production_branch / compatibility_date / OpenNext 判定 / UT-27 引き渡し / user_approval）。

### ステップ 4: blocker list 最終確定
- B-01〜B-08 の 8 件を確定、優先順位付き。

### ステップ 5: UT-27 引き渡し成果物の確定
- `outputs/phase-10/handoff-to-ut27.md` のテンプレートを Phase 10 で配置（プレースホルダ可、Phase 13 で実値更新）。

### ステップ 6: 上流 2 件完了確認の 4 重明記
- Phase 1 / 2 / 3 / 10 の 4 箇所で重複明記、本 Phase が 4 重目。

### ステップ 7: MINOR 未タスク化方針明文化
- 本 Phase で MINOR 0 を確認、ルールのみ記述（既知候補 6 件含む）。

### ステップ 8: Phase 13 進入判定（gate 通過判定）確定
- 必要十分条件 + NO-GO 条件を確定。

### ステップ 9: GO/NO-GO 確定
- `outputs/phase-10/main.md` に「仕様書 PASS / 実プロジェクト作成は Phase 13 ユーザー承認後 / status=pending」を明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に NON_VISUAL walkthrough を実施し、Phase 13 承認後の post-apply smoke（dev push → staging deploy green / 公開 URL 200）手順を固定 |
| Phase 12 | unassigned-task 候補 6 件を formalize / implementation-guide.md にまとめ / phase12-task-spec-compliance-check.md で本仕様の compliance を再確認 / handoff-to-ut27.md を documentation-changelog.md に記載 |
| Phase 13 | GO/NO-GO 結果と承認ゲート前チェックリスト 11 件を PR description に転記、user_approval_required: true gate / handoff-to-ut27.md を実値で更新 |
| UT-27 | `outputs/phase-10/handoff-to-ut27.md` を起点に Variable 配置（`gh variable set CLOUDFLARE_PAGES_PROJECT --body ubm-hyogo-web`）|

## 多角的チェック観点

- 価値性: AC-1〜AC-9（プロジェクト作成 / 設定整合 / OpenNext 判定 / Git 連携 OFF / dev/main deploy 成功）の根拠が Phase 1〜9 で確定。
- 実現性: Phase 8 / 9 で workflow 参照 / drift 検知 / E2E / AC-13 機械検証可能。
- 整合性: 不変条件 #5 / Phase 8 SSOT / artifacts.json と一致 / CLAUDE.md「`wrangler` 直接実行禁止 / `scripts/cf.sh` 経由 / 1Password 正本 / API Token 値転記禁止」と整合。
- 運用性: 承認ゲート前 11 件チェック + blocker 8 件 + 上流 4 重明記 + UT-27 引き渡し成果物 + 切り戻し 3 段 + 月次 drift 検知。
- 認可境界: API Token / Account ID 転記禁止（B-02 機械検証）/ Token 最小スコープ（01b 由来）。
- 引き渡し境界: UT-27 = Variable 配置 / UT-28 = 値の出所提供 / UT-29 = アプリ機能スモーク の責務分離が明示。
- 命名規則: 「`<base>` / `<base>-staging`」固定、Variable 値 = production 名 suffix なし、suffix `-staging` 連結は `web-cd.yml` 側 で全 Phase 一貫。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-15 達成状態評価 | 10 | pending | 15 件 PASS |
| 2 | 4 条件最終再評価 | 10 | pending | PASS |
| 3 | Phase 13 ユーザー承認ゲート前チェックリスト確定 | 10 | pending | 11 件 |
| 4 | blocker list 最終確定 | 10 | pending | 8 件 |
| 5 | UT-27 引き渡し成果物確定（handoff-to-ut27.md テンプレート）| 10 | pending | Variable 名 / 値 / suffix 連結方式 |
| 6 | 上流 2 件完了確認 4 重明記 | 10 | pending | 本 Phase 4 重目 |
| 7 | MINOR 未タスク化方針確定 | 10 | pending | 既知 6 件 |
| 8 | Phase 13 進入判定（gate 通過判定）確定 | 10 | pending | 必要十分条件 + NO-GO |
| 9 | GO/NO-GO 判定 | 10 | pending | 仕様書 PASS / status=pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | AC × 4 条件 × 承認ゲート前チェック × blocker × 上流 4 重明記 × MINOR × gate 通過判定 × GO/NO-GO 最終判定 |
| ドキュメント | outputs/phase-10/handoff-to-ut27.md | UT-27 への命名引き渡し成果物（Variable 名 / 値 / suffix 連結方式 / 検証コマンド） |
| メタ | artifacts.json | Phase 10 状態の更新 |

> **path 表記正規化メモ**: Phase 10 outputs は `outputs/phase-10/main.md` および `outputs/phase-10/handoff-to-ut27.md` に統一。artifacts.json / index.md / phase 本文の表記も同一。

## 完了条件

- [ ] AC 15 件すべて PASS で評価
- [ ] 4 条件最終判定が PASS
- [ ] Phase 13 ユーザー承認ゲート前チェックリストが 5 件以上（本仕様では 11 件）
- [ ] blocker 判定基準が 5 件以上記述（本仕様では 8 件）
- [ ] 上流 2 件完了確認が 4 箇所で重複明記（Phase 1 / 2 / 3 / 10）
- [ ] UT-27 引き渡し成果物（`handoff-to-ut27.md`）テンプレートが配置済み（プレースホルダ可）
- [ ] handoff-to-ut27.md に Variable 名（`CLOUDFLARE_PAGES_PROJECT`）/ 値（`ubm-hyogo-web`）/ suffix `-staging` 連結方式 / 検証コマンドが記述
- [ ] MINOR 未タスク化方針が明文化（既知 6 件含む）
- [ ] Phase 13 進入判定（gate 通過判定）が必要十分条件 + NO-GO 条件で確定
- [ ] 最終判定が「仕様書 PASS / 実プロジェクト作成は Phase 13 ユーザー承認後 / status=pending」で確定
- [ ] outputs/phase-10/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（9 件）が `pending`
- 成果物 `outputs/phase-10/main.md` および `outputs/phase-10/handoff-to-ut27.md` 配置予定
- AC × 4 条件 × 承認ゲート前 × blocker × 上流 4 重 × MINOR × gate × UT-27 引き渡し × GO/NO-GO の 9 観点すべて記述
- artifacts.json の `phases[9].status` が `pending`

## 苦戦防止メモ

- 本ワークフローの最終成果物は「タスク仕様書」と「`handoff-to-ut27.md` テンプレート」。実 `bash scripts/cf.sh pages project create ...` は Phase 13 ユーザー承認後の別オペレーション。本 Phase で「実装 PASS」と書かない。常に **「仕様書 PASS / 実プロジェクト作成は Phase 13 ユーザー承認後 / status=pending」** と三段で表現する。
- blocker B-01（上流 2 件未完了）は最重要・4 重明記。Phase 13 着手 PR の reviewer（= 実行者本人）は本仕様書 §blocker を必ず参照すること。
- blocker B-02（API Token / Account ID 値転記）は不可逆事故。Phase 8 §5.2 機械検証を Phase 13 着手直前に必ず再実走する。検出 0 でなければ即時修正、修正後に commit を rewrite するか、最悪 token ローテーション。
- UT-27 引き渡しドキュメントには **Variable 名 / 値 / suffix 連結方式 / 検証コマンド** のみ含める。**API Token / Account ID 値は絶対に含めない**（UT-27 が独自に 1Password から動的取得）。
- Variable 値（`ubm-hyogo-web`）と Pages プロジェクト名は完全一致が要件。Phase 11 / 13 のどこかで命名揺れが起きると `web-cd.yml` の `${{ vars.X }}-staging` 連結結果と Pages プロジェクト名がミスマッチして `pages deploy` が `8000017 Project not found` を返す（B-05）。命名変更時は必ず Variable 値も同時更新（Phase 12 implementation-guide.md に記述）。
- MINOR をその場で対応したくなる衝動を抑え、必ず Phase 12 unassigned-task ルートを通す。OpenNext 切替（B-07）/ Terraform 化 / カスタムドメイン / 命名変更手順 / drift 月次走査自動化 を本タスクで実装すると scope 違反。
- Phase 13 ユーザー承認ゲート前チェックリスト 11 件は、実行者本人が 1 件ずつ目視確認する運用。自動化は IaC 化フェーズで再評価。
- gate 通過判定は「Phase 11 walkthrough / Phase 12 完了 + 11 件チェック PASS + ユーザー承認 + handoff-to-ut27.md 存在」の 4 段。1 段でも欠けると Phase 13 着手 NO-GO。

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke test)
- 引き継ぎ事項:
  - 最終判定: 仕様書 PASS / 実プロジェクト作成は Phase 13 ユーザー承認後 / status=pending
  - blocker 8 件（実プロジェクト作成着手前に再確認必須）
  - Phase 13 ユーザー承認ゲート前チェックリスト 11 件
  - 上流 2 件完了確認の 4 重明記（本 Phase 4 重目）
  - UT-27 引き渡し成果物（`handoff-to-ut27.md` テンプレート）
  - MINOR 未タスク化候補 6 件
  - Phase 13 gate 通過の必要十分条件 / NO-GO 条件
- ブロック条件:
  - 4 条件のいずれかが MAJOR
  - AC で PASS でないものが残る
  - blocker 判定基準が 5 件未満
  - 承認ゲート前チェックリストが 5 件未満
  - 上流 2 件完了確認の 4 重明記のいずれかが欠落
  - UT-27 引き渡し成果物が未確定（B-08）
  - MINOR を未タスク化せず抱え込んでいる
  - API Token / Account ID 値転記が 1 件でも検出される（B-02）
