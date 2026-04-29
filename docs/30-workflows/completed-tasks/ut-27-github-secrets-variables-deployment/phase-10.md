# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub Secrets / Variables 配置実行 (ut-27-github-secrets-variables-deployment) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test / dev push → CD green / Discord 通知 / 未設定耐性) |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / github_secrets_variables_cd_enablement |

## 目的

Phase 1〜9 で確定した要件・設計・レビュー・テスト戦略・実装ランブック・異常系・AC マトリクス・DRY 化・QA を統合し、(1) AC-1〜AC-15 全件カバレッジの最終評価、(2) 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終再評価、(3) Phase 13 ユーザー承認ゲート前チェック、(4) blocker list の最終確定、(5) 上流 3 件（UT-05 / UT-28 / 01b）完了確認の 4 重明記を実施する。本ワークフローは仕様書整備に閉じるため、最終判定は **「仕様書として PASS / 実 secret 配置は Phase 13 ユーザー承認後の別オペレーション」** とし、MINOR 指摘は Phase 12 unassigned-task-detection.md へ formalize する方針を明文化する。Phase 13（PR 作成 + ユーザー承認後の実 `gh secret set` / `gh variable set` / `gh api ... environments` 実行）への進入判定（gate 通過判定）を本 Phase で確定する。

## 実行タスク

1. AC-1〜AC-15 を pending 視点で評価し、PASS / FAIL / 仕様確定先 を全件付与する（完了条件: 15 件すべてに判定 + 確定先 Phase 番号が付与）。
2. 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終再評価を行う（完了条件: 各観点に PASS/MINOR/MAJOR + 根拠が記述）。
3. Phase 13 ユーザー承認ゲート前チェックリストを確定する（完了条件: 「上流 3 件 completed 再確認」「workflow 参照整合 PASS」「1Password 参照実在 PASS」「AC-13 機械検証 0 件」「mirror parity」「未設定耐性確認」「同名併存禁止」「Token 最小スコープ」「user_approval_required: true」の 9 件以上）。
4. blocker list を最終確定する（完了条件: B-01〜B-09 を含む 8 件以上、上流 3 件未完了 / secret 値転記 / token スコープ過剰 / 同名 scope 併存 / Discord 評価不能未対応 を含む）。
5. MINOR 指摘の未タスク化方針を確定する（完了条件: Phase 12 unassigned-task-detection.md への formalize ルートが記述、helper 化 3 件 / 案 D / 案 C を含む）。
6. 上流 3 件（UT-05 / UT-28 / 01b）完了確認の 4 重明記を確定する（完了条件: Phase 1 / 2 / 3 / 10 の 4 箇所で重複明記、本 Phase が 4 重目）。
7. 最終 GO/NO-GO 判定を確定し、`outputs/phase-10/main.md` に記述する（完了条件: 「仕様書 PASS / 実 secret 配置は Phase 13 ユーザー承認後 / status=pending」が明示）。
8. Phase 13 進入判定（gate 通過判定）を確定する（完了条件: Phase 11 / 12 完了 + 承認ゲート前チェック 9 件 PASS が gate 通過の必要十分条件として記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/index.md | AC-1〜AC-15 / Phase 一覧 / 不変条件 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-01.md | 4 条件評価初期判定 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-03.md | base case 最終判定（with notes）|
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-08.md | DRY 化 SSOT / helper 化候補 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-09.md | QA 12 項目 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-02/main.md | lane 1〜5 設計 |
| 必須 | docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md §苦戦箇所・知見 | リスク源（§1〜§6） |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-10.md | 最終レビュー phase の構造参照 |

## 上流 3 件完了確認 — 重複明記 4/4（最終）

> **UT-05（CI/CD パイプライン実装）/ UT-28（Cloudflare Pages プロジェクト作成）/ 01b（Cloudflare base bootstrap）の 3 件が completed であることが、Phase 13 実 secret 配置着手の必須前提である。**
> 1 件でも未完了なら gate 通過 NO-GO。Phase 1 §依存境界・Phase 2 §依存タスク順序・Phase 3 §NO-GO 条件・本 Phase §gate 通過判定の 4 箇所で重複明記する（本 Phase が 4 重目）。

### 4 重明記の根拠

| # | 明記箇所 | 役割 |
| --- | --- | --- |
| 1 | Phase 1 §依存境界 | 要件レベルでの前提宣言 |
| 2 | Phase 2 §依存タスク順序 | 設計レベルでの前提再宣言 |
| 3 | Phase 3 §NO-GO 条件 / §着手可否ゲート | 設計レビューレベルでの最終 gate |
| 4 | Phase 10 §上流確認 / §Phase 13 進入判定 | 実 PUT 着手前の最終 gate（本 Phase） |

## AC × PASS/FAIL マトリクス（pending 視点）

> **評価基準**: 「Phase 1〜9 で具体的に確定し、Phase 5 / 11 / 13 で実装・実走可能な粒度に分解されているか」で判定する。実 secret 配置は未着手。

| AC | 内容（要約） | 仕様確定先 | 判定 |
| --- | --- | --- | --- |
| AC-1 | API Token 必要スコープ手順（Pages / Workers Scripts / D1 / Account Settings） | Phase 1 §苦戦箇所 §5 / Phase 2 §API Token / Phase 5 lane 3 | PASS |
| AC-2 | ACCOUNT_ID 配置先・手順 | Phase 2 §配置決定マトリクス / Phase 5 lane 3 | PASS |
| AC-3 | DISCORD_WEBHOOK_URL 未設定耐性 | Phase 2 §動作確認 / Phase 6 異常系 / Phase 11 smoke | PASS |
| AC-4 | CLOUDFLARE_PAGES_PROJECT を Variable とする理由 | Phase 1 §苦戦箇所 §2 / Phase 2 §Variable 一覧 / Phase 8 §用語 | PASS |
| AC-5 | environments staging / production 作成手順 | Phase 2 lane 2 / Phase 5 lane 2 / Phase 8 テンプレ | PASS |
| AC-6 | repository vs environment 配置決定マトリクス | Phase 2 §配置決定マトリクス | PASS |
| AC-7 | dev push で backend-ci deploy-staging green | Phase 2 §動作確認 / Phase 11 smoke | PASS |
| AC-8 | dev push で web-cd deploy-staging green | Phase 2 §動作確認 / Phase 11 smoke | PASS |
| AC-9 | Discord 通知成功 / 未設定耐性 | Phase 2 §動作確認 / Phase 6 / Phase 11 | PASS |
| AC-10 | 1Password 同期手順（手動 + 将来 op SA） | Phase 2 §同期手順 / Phase 12 documentation / Phase 8 §helper 化候補 | PASS |
| AC-11 | 4 条件 PASS（Phase 1 / 3 双方） | Phase 1 / Phase 3 / 本 Phase | PASS |
| AC-12 | 上流 3 件完了確認 3 重明記（→ 本 Phase で 4 重目に拡張） | Phase 1 / 2 / 3 / 10 | PASS |
| AC-13 | secret 値転記禁止 | 全 Phase / Phase 8 §削除対象 / Phase 9 §AC-13 機械検証 | PASS |
| AC-14 | `if: secrets.X != ''` 評価不能の代替設計 | Phase 2 §動作確認 / Phase 6 / Phase 11 / Phase 8 §削除対象 | PASS |
| AC-15 | Phase 1〜13 が artifacts.json と一致 | artifacts.json / index.md | PASS |

**合計: 15/15 PASS（pending 視点）**

> **注**: 本評価は「仕様書整備として確定済み」の意味。実 PUT は未実行。Phase 13 ユーザー承認後の別オペレーションで AC-1〜AC-15 が実走確認される。

## 4 条件最終再評価

| 条件 | 判定 | 根拠（Phase 9 までの確定事項を統合） |
| --- | --- | --- |
| 価値性 | PASS | dev push → backend-ci deploy-staging green / web-cd deploy-staging green / Discord 通知の 3 経路が成立し、UT-06 / UT-29 の前提が確定。CD 配線が空振りに終わるリスクを除去 |
| 実現性 | PASS | `gh` CLI + `op` CLI + 1Password Environments で完結、新規依存ゼロ。Phase 8 テンプレ関数 5 件で SRP 化、Phase 9 QA 12 項目で機械検証可能 |
| 整合性 | PASS | 不変条件 #5 を侵害しない / CLAUDE.md「1Password 正本 / `.env` 実値禁止 / `wrangler` 直接禁止」と整合（本タスクは `gh` 側操作で `wrangler` 不使用）/ Phase 8 用語統一（正本 / 派生コピー / scope / 未設定耐性）/ `scripts/cf.sh` 思想と同型 |
| 運用性 | PASS | 1Password 正本 + GitHub 派生コピー + Last-Updated メモ運用 + `enforce_admins` 等の rollback は本タスク対象外（branch protection は UT-GOV-001 側）。secret rollback は `gh secret delete` + 1Password 再注入で復旧可能。Token 最小スコープで漏洩影響限定 |

**最終判定: PASS（仕様書として）**

## Phase 13 ユーザー承認ゲート前チェックリスト

> Phase 13 で実 `gh secret set` / `gh variable set` / `gh api ... environments` を実行する**前**に、実行者本人（solo 運用）が以下のチェックリストを 1 件ずつ確認すること。1 件でも未充足なら gate 通過 NO-GO。

| # | チェック項目 | 確認方法 | 期待結果 |
| --- | --- | --- | --- |
| 1 | 上流 3 件 completed 再確認（UT-05 / UT-28 / 01b） | `gh pr list --search "UT-05 in:title" --state merged` ほか + Phase 3 §上流チェックポイント | 3 件すべて completed |
| 2 | workflow 参照整合 PASS（4 キー × 2 ファイル） | Phase 9 §1 `verify_workflow_refs` 実走 | 全 OK |
| 3 | 1Password 参照実在 PASS（4 fields） | Phase 9 §2 `verify_op_field_exists` 実走（値非出力） | 全 OK |
| 4 | AC-13 機械検証 0 件 | Phase 9 §6 `verify_no_secret_leak` 実走 | 0 ヒット |
| 5 | Phase 11 smoke 完了（dev push → CD green / Discord 通知 / 未設定耐性） | `outputs/phase-11/manual-smoke-log.md` 存在 + ログ確認 | 存在、3 経路 green |
| 6 | mirror parity（Phase 11 / 13 runbook が apply-runbook.template.md 参照） | Phase 9 §4 section heading diff | drift 0 |
| 7 | 同名 repository-scoped と environment-scoped 併存禁止 | `gh secret list` + `gh secret list --env staging,production` 突合 | 同名重複 0 |
| 8 | API Token 最小スコープ確認（Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read のみ） | Cloudflare ダッシュボード目視 + Token 名命名規則 | 最小スコープ確認済み |
| 9 | `lock_branch` / `enforce_admins` 等の branch protection 側設定は本タスクで触らない | 本タスクの scope = secret/variable/environment のみ | 範囲外確認 |
| 10 | `user_approval_required: true` ゲート | `artifacts.json` の Phase 13 設定 | true |

## blocker 判定基準

> 以下のいずれかに該当する場合、Phase 13 実 secret 配置は **着手 NO-GO**。本ワークフロー（pending）は仕様書整備に閉じるが、これらの blocker は Phase 13 着手前の必須 gate として機能する。

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | 上流 3 件（UT-05 / UT-28 / 01b）のいずれかが completed でない | 上流タスク（最重要・4 重明記） | 3 件すべて main マージ済み | Phase 3 §上流チェックポイント |
| B-02 | workflow 参照キー（4 件）と Phase 8 SSOT インベントリ表が不一致 | 設計違反 | grep + SSOT 表との完全一致 | Phase 9 §1 |
| B-03 | 1Password 参照（4 fields）のいずれかが実在しない | 前提違反 | `op item get --fields ... | jq '.value | length > 0'` で全 true | Phase 9 §2 |
| B-04 | secret 値が payload / runbook / Phase outputs / shell history に転記されている | secret 漏洩（最重要） | `verify_no_secret_leak` 実走で 0 ヒット | Phase 9 §6 |
| B-05 | API Token のスコープが Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read を超えている | 運用違反（§5 苦戦箇所） | Cloudflare ダッシュボード確認 + Token 名命名規則遵守 | 目視 |
| B-06 | 同名 repository-scoped と environment-scoped が併存している | 設計違反（§1 苦戦箇所） | `gh secret list` + `--env` 突合で同名重複 0 | gh CLI |
| B-07 | `if: ${{ secrets.X != '' }}` 評価不能問題への代替設計（env で受けてシェル空文字判定）が `web-cd.yml` / `backend-ci.yml` 側に未実装 | 動作違反（§3 苦戦箇所） | Phase 11 smoke で Discord 未設定耐性が成立しなければ Phase 12 で UT-05 にフィードバック | Phase 11 / 12 |
| B-08 | `CLOUDFLARE_PAGES_PROJECT` が Variable ではなく Secret として配置されている | 設計違反（§2 苦戦箇所 / AC-4） | 4 payload 全件で `vars.CLOUDFLARE_PAGES_PROJECT` 参照 / `secrets.CLOUDFLARE_PAGES_PROJECT` 参照 0 | Phase 9 §1 |
| B-09 | 1Password 正本 / GitHub 派生コピーの境界が runbook に記述されておらず、GitHub UI 直編集が許容状態にある | 二重正本 drift（§6 苦戦箇所） | runbook §state ownership に「GitHub UI 直編集禁止」明記 | grep |

### blocker 優先順位

1. **B-01（上流 3 件未完了）**: 最重要。CD 401 / 404 / 値ミスマッチ事故の唯一の再発防止策。Phase 1 / 2 / 3 / 10 で 4 重明記済み。
2. **B-04（secret 値転記）**: secret 漏洩は不可逆。Phase 9 §6 で機械検証。
3. **B-05（Token スコープ過剰）**: 漏洩時の影響範囲拡大、最小スコープ厳守。
4. **B-02 / B-03（参照整合 / 1Password 実在）**: 配置直後の 401 事故予防。
5. **B-06 / B-08（設計違反）**: Phase 8 SSOT で予防。
6. **B-07（Discord 評価不能）**: Phase 11 smoke で実検証。
7. **B-09（二重正本 drift）**: 運用上の長期リスク。Last-Updated メモで継続検証。

## MINOR 指摘の未タスク化方針

- 本 Phase 10 では **MINOR 判定 0**（AC 15 件 / 4 条件すべて PASS）。
- 仮に Phase 11 / 12 / 13 で MINOR が発生した場合のルール:
  1. MINOR は **必ず未タスク化**（本ワークフロー内で抱え込まない）。
  2. `outputs/phase-12/unassigned-task-detection.md` に新規 ID を割り当てて登録。
  3. Phase 12 `implementation-guide.md` / `documentation-changelog.md` に該当 ID を記載。
  4. 該当 task は次 Wave 以降の優先度評価に回す。
- 既知候補（Phase 3 / Phase 8 由来）:
  - #1（`CLOUDFLARE_API_TOKEN` を staging / production で別 token にするか）→ Phase 5 で確定予定
  - #2（`DISCORD_WEBHOOK_URL` のチャンネル分離 / environment-scoped 化）→ Phase 11 smoke 後に判断
  - #3（案 D `1password/load-secrets-action` の将来導入時期）→ Phase 12 unassigned
  - #4（案 C Terraform GitHub Provider の将来導入時期）→ Phase 12 unassigned
  - #5（helper 化 3 件: `gh-secret-set-from-op.sh` / `gh-env-create.sh` / `gh-variable-set.sh`）→ Phase 12 unassigned
  - #6（Last-Updated メモ運用の自動化）→ Phase 12 unassigned

## Phase 13 進入判定（gate 通過判定）

### gate 通過の必要十分条件

| 条件 | 確認 | 該当 Phase |
| --- | --- | --- |
| Phase 1〜10 がすべて completed / 本 Phase が PASS | artifacts.json | Phase 1〜10 |
| Phase 11 smoke 完了（dev push → CD green / Discord 通知 / 未設定耐性） | `outputs/phase-11/manual-smoke-log.md` | Phase 11 |
| Phase 12 ドキュメント更新完了 | `outputs/phase-12/*.md` 6 種 | Phase 12 |
| Phase 13 ユーザー承認ゲート前チェックリスト 10 件すべて PASS | 本 Phase §チェックリスト | Phase 13 着手前 |
| 上流 3 件 completed（4 重明記） | Phase 3 §上流チェックポイント | 本 Phase 4 重目 |
| `user_approval_required: true` でユーザー承認取得 | artifacts.json + ユーザー対話 | Phase 13 |

### gate 通過 NO-GO 条件（一つでも該当）

- Phase 11 smoke が未完了 / red
- Phase 12 ドキュメント更新が未完了
- 承認ゲート前チェック 10 件のいずれかが未充足
- blocker B-01〜B-09 のいずれかが未解消
- ユーザー承認が取得されていない

## 最終 GO / NO-GO 判定

### 判定: **PASS（仕様書として）/ status=pending**

- 仕様書としての完成度: **PASS**（AC 15/15 / 4 条件すべて PASS / blocker 判定基準 9 件確定 / 承認ゲート前チェック 10 件確定 / 上流 4 重明記）
- 実装ステータス: **pending**（実 secret 配置は Phase 13 ユーザー承認後）
- Phase 11 進行可否: 「仕様レベルの smoke コマンド系列レビュー + dev 空 commit push 実走」可。
- Phase 12 進行可否: implementation-guide.md / documentation-changelog.md / unassigned-task-detection.md / system-spec-update-summary.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md の 6 種整備が本ワークフロー内で可能。
- Phase 13 進行可否: 仕様書としては可だが、実 `gh secret set` / `gh variable set` / `gh api ... environments` PUT は **user_approval_required: true** ゲート + §Phase 13 ユーザー承認ゲート前チェックリスト 10 件すべて充足が必須。

### GO 条件（すべて満たすこと）

- [x] AC 15 件すべて PASS
- [x] 4 条件最終判定が PASS
- [x] blocker 判定基準が 5 件以上記述（本仕様では 9 件）
- [x] Phase 13 ユーザー承認ゲート前チェックリストが 5 件以上（本仕様では 10 件）
- [x] 上流 3 件完了確認が 4 重明記（本 Phase が 4 重目）
- [x] MAJOR ゼロ
- [x] MINOR を抱え込まず未タスク化方針を明記
- [x] open question すべてに受け皿 Phase が指定済み

### NO-GO 条件（一つでも該当）

- 4 条件のいずれかに MAJOR が残る
- AC のうち PASS でないものがある
- blocker 判定基準が 5 件未満
- 承認ゲート前チェックリストが 5 件未満
- 上流 3 件完了確認の 4 重明記のいずれかが欠落
- secret 値転記が 1 件でも検出される（B-04）

## 実行手順

### ステップ 1: AC マトリクス再評価
- AC-1〜AC-15 を pending 視点で全件再評価。

### ステップ 2: 4 条件最終再評価
- Phase 1 / Phase 3 base case を継承、Phase 9 QA 結果で再確認。

### ステップ 3: Phase 13 ユーザー承認ゲート前チェックリスト確定
- 10 件のチェック項目を確定（上流 / workflow 参照 / op 参照 / AC-13 / smoke / parity / 同名併存 / Token / scope 範囲外 / user_approval）。

### ステップ 4: blocker list 最終確定
- B-01〜B-09 の 9 件を確定、優先順位付き。

### ステップ 5: 上流 3 件完了確認の 4 重明記
- Phase 1 / 2 / 3 / 10 の 4 箇所で重複明記、本 Phase が 4 重目。

### ステップ 6: MINOR 未タスク化方針明文化
- 本 Phase で MINOR 0 を確認、ルールのみ記述（既知候補 6 件含む）。

### ステップ 7: Phase 13 進入判定（gate 通過判定）確定
- 必要十分条件 + NO-GO 条件を確定。

### ステップ 8: GO/NO-GO 確定
- `outputs/phase-10/main.md` に「仕様書 PASS / 実 secret 配置は Phase 13 ユーザー承認後 / status=pending」を明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に手動 smoke test（dev push → CD green / Discord 通知 / 未設定耐性）を実走 |
| Phase 12 | unassigned-task 候補 6 件を formalize / implementation-guide.md にまとめ / phase12-task-spec-compliance-check.md で本仕様の compliance を再確認 |
| Phase 13 | GO/NO-GO 結果と承認ゲート前チェックリスト 10 件を PR description に転記、user_approval_required: true gate |

## 多角的チェック観点

- 価値性: AC-7 / AC-8 / AC-9（CD green / Discord 通知 / 未設定耐性）の根拠が Phase 1〜9 で確定。
- 実現性: Phase 9 QA で workflow 参照 / op 実在 / リンク / mirror parity / AC-13 / drift の 6 観点で機械検証可能。
- 整合性: 不変条件 #5 / Phase 8 SSOT / artifacts.json と一致 / CLAUDE.md「1Password 正本」と整合。
- 運用性: 承認ゲート前 10 件チェック + blocker 9 件 + 上流 4 重明記 + Last-Updated メモ運用。
- 認可境界: secret hygiene 対象内、AC-13 機械検証で値転記事故を予防、Token 最小スコープ厳守。
- 無料枠: resource 消費なし、対象外明記済み（Phase 9）。
- 同名併存禁止: B-06 で gate ゲート化、`gh secret list` + `--env` 突合で機械検証。
- 二重正本: 1Password 正本 / GitHub 派生コピーの境界を B-09 で gate 化、Last-Updated メモで継続検証。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-15 達成状態評価 | 10 | pending | 15 件 PASS |
| 2 | 4 条件最終再評価 | 10 | pending | PASS |
| 3 | Phase 13 ユーザー承認ゲート前チェックリスト確定 | 10 | pending | 10 件 |
| 4 | blocker list 最終確定 | 10 | pending | 9 件 |
| 5 | 上流 3 件完了確認 4 重明記 | 10 | pending | 本 Phase 4 重目 |
| 6 | MINOR 未タスク化方針確定 | 10 | pending | 既知 6 件 |
| 7 | Phase 13 進入判定（gate 通過判定）確定 | 10 | pending | 必要十分条件 + NO-GO |
| 8 | GO/NO-GO 判定 | 10 | pending | 仕様書 PASS / status=pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | AC × 4 条件 × 承認ゲート前チェック × blocker × 上流 4 重明記 × MINOR × gate 通過判定 × GO/NO-GO 最終判定 |
| メタ | artifacts.json | Phase 10 状態の更新 |

> **path 表記正規化メモ**: Phase 10 outputs は `outputs/phase-10/main.md` に統一。artifacts.json / index.md / phase 本文の表記も同一。

## 完了条件

- [ ] AC 15 件すべて PASS で評価
- [ ] 4 条件最終判定が PASS
- [ ] Phase 13 ユーザー承認ゲート前チェックリストが 5 件以上（本仕様では 10 件）
- [ ] blocker 判定基準が 5 件以上記述（本仕様では 9 件）
- [ ] 上流 3 件完了確認が 4 箇所で重複明記（Phase 1 / 2 / 3 / 10）
- [ ] MINOR 未タスク化方針が明文化（既知 6 件含む）
- [ ] Phase 13 進入判定（gate 通過判定）が必要十分条件 + NO-GO 条件で確定
- [ ] 最終判定が「仕様書 PASS / 実 secret 配置は Phase 13 ユーザー承認後 / status=pending」で確定
- [ ] outputs/phase-10/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `pending`
- 成果物 `outputs/phase-10/main.md` 配置予定
- AC × 4 条件 × 承認ゲート前 × blocker × 上流 4 重 × MINOR × gate × GO/NO-GO の 8 観点すべて記述
- artifacts.json の `phases[9].status` が `pending`

## 苦戦防止メモ

- 本ワークフローの最終成果物は「タスク仕様書」。実 `gh secret set` / `gh variable set` / `gh api ... environments` は Phase 13 ユーザー承認後の別オペレーション。本 Phase で「実装 PASS」と書かない。常に **「仕様書 PASS / 実 secret 配置は Phase 13 ユーザー承認後 / status=pending」** と三段で表現する。
- blocker B-01（上流 3 件未完了）は最重要・4 重明記。Phase 13 着手 PR の reviewer（= 実行者本人）は本仕様書 §blocker を必ず参照すること。
- blocker B-04（secret 値転記）は不可逆事故。Phase 9 §6 機械検証を Phase 13 着手直前に必ず再実走する。検出 0 でなければ即時修正、修正後に commit を rewrite するか、最悪 token ローテーション。
- MINOR をその場で対応したくなる衝動を抑え、必ず Phase 12 unassigned-task ルートを通す。helper 化 3 件 / 案 C / 案 D を本タスクで実装すると scope 違反。
- Phase 13 ユーザー承認ゲート前チェックリスト 10 件は、実行者本人が 1 件ずつ目視確認する運用。自動化は IaC 化フェーズで再評価。
- gate 通過判定は「Phase 11 / 12 完了 + 10 件チェック PASS + ユーザー承認」の 3 段。1 段でも欠けると Phase 13 着手 NO-GO。

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke test / dev push → CD green / Discord 通知 / 未設定耐性)
- 引き継ぎ事項:
  - 最終判定: 仕様書 PASS / 実 secret 配置は Phase 13 ユーザー承認後 / status=pending
  - blocker 9 件（実 secret 配置着手前に再確認必須）
  - Phase 13 ユーザー承認ゲート前チェックリスト 10 件
  - 上流 3 件完了確認の 4 重明記（本 Phase 4 重目）
  - MINOR 未タスク化候補 6 件
  - Phase 13 gate 通過の必要十分条件 / NO-GO 条件
- ブロック条件:
  - 4 条件のいずれかが MAJOR
  - AC で PASS でないものが残る
  - blocker 判定基準が 5 件未満
  - 承認ゲート前チェックリストが 5 件未満
  - 上流 3 件完了確認の 4 重明記のいずれかが欠落
  - MINOR を未タスク化せず抱え込んでいる
  - secret 値転記が 1 件でも検出される（B-04）
