# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Pages プロジェクト（staging / production）作成 (ut-28-cloudflare-pages-projects-creation) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-29 |
| 前 Phase | 11 (手動 smoke / NON_VISUAL walkthrough) |
| 次 Phase | 13 (PR 作成 / ユーザー承認後 Pages プロジェクト作成実行) |
| 状態 | pending（workflow root は `spec_created`。本 Phase は Phase 12 成果物を固定するが、実 Cloudflare apply は Phase 13 承認後まで未完了） |
| タスク種別 | implementation / NON_VISUAL / cloudflare_pages_projects_creation |
| user_approval_required | false（Phase 13 の実 `wrangler pages project create` 承認とは独立） |
| GitHub Issue | #48 |
| workflow_state | spec_created（root `artifacts.json` は据え置き、`phases[].status` のみを Phase 11/12/13 整備に合わせ更新） |

> **300 行上限超過の根拠**: 本 Phase は Phase 12 必須 5 タスク（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report）に加えて main.md と phase12-task-spec-compliance-check.md の 7 成果物を全件出力し、それぞれが Phase 11 4 階層代替 evidence と Phase 2 設定一致表 / `bash scripts/cf.sh` コマンド草案 / OpenNext アップロード判定基準と直列追跡される。責務分離不可能性を根拠に 300 行を許容超過する。

## 目的

Phase 1〜11 の成果物（仕様書 / NON_VISUAL 代替 evidence / 5 ステップ smoke の仕様レベル固定 / spec walkthrough）を、本タスクの限界（実 `wrangler pages project create` と実 push smoke は Phase 13 ユーザー承認後）に整合する形でドキュメント化する。具体的には Phase 12 必須 5 タスクと `phase12-task-spec-compliance-check.md` を出力し、本ワークフローが「Phase 1〜13 タスク仕様書整備までで spec_created、実 Cloudflare apply は Phase 13 承認後」である境界を明示する。

依存成果物は Phase 2 設計（設定一致表 / `bash scripts/cf.sh` コマンド草案 / OpenNext 判定基準 / state ownership / リスク R-1〜R-5）、Phase 3 レビュー（NO-GO ゲート / 9 観点 PASS / open question 6 件 / R-6〜R-8 補強）、Phase 11 NON_VISUAL walkthrough（保証できない範囲）とする。

## workflow_state と root artifacts.json の据え置き方針

- 本ワークフローは `workflow_state: spec_created`。
- root `docs/30-workflows/ut-28-cloudflare-pages-projects-creation/artifacts.json` は **据え置き**（Phase 1〜3 = `completed` / Phase 4〜13 = `pending`）とし、Phase 12 で書き換えない。
- 各 Phase の `status` 更新は `outputs/artifacts.json`（root と parity）でも Phase 12 仕様書の整備状況に合わせて `pending` のまま維持する。実プロジェクト作成・実 push smoke 完了後（Phase 13 後追い PR）に `completed` 化する。
- `metadata.workflow_state` を `spec_created` で固定し、Phase 13 完了後に `apply_completed` 等への昇格は別 PR に委ねる。

## 実行タスク（Phase 12 必須 5 タスク + main index・全件必須）

1. **実装ガイド作成（Part 1 中学生レベル / Part 2 開発者技術詳細）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新サマリー（Step 1-A/1-B/1-C / Step 2 判定）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴** — `outputs/phase-12/documentation-changelog.md`
4. **未タスク検出レポート（0 件でも出力必須・current/baseline 分離）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須・3 観点必須）** — `outputs/phase-12/skill-feedback-report.md`

> 加えて統合 index として `outputs/phase-12/main.md`（5 成果物へのリンクと完了判定）を作成する。

## implementation / NON_VISUAL / spec_created モード適用

| 項目 | 適用内容 |
| --- | --- |
| Step 1-G 検証コマンド | docs validator と outputs 実体確認のみ実行（実コードに対する typecheck / lint / app test は対象外） |
| implementation-guide Part 2 | Cloudflare Pages プロジェクト概念 / `bash scripts/cf.sh pages project create` コマンド系列 / `production_branch` 環境別配線 / `compatibility_date` Workers 同期 / OpenNext アップロード判定 (A)/(B) / Pages Git 連携 OFF 既定 / 命名規則「`<base>` / `<base>-staging`」/ Variable `CLOUDFLARE_PAGES_PROJECT` 引き渡し / API Token 最小スコープ |
| Step 1-B 実装状況 | `spec_created`（実 `wrangler pages project create` と実 push smoke は Phase 13 ユーザー承認後の別オペレーション） |
| Step 2 判定 | aiworkflow-requirements の `deployment-core.md` / `deployment-gha.md` への反映を Step 1-A/1-B/1-C と分離して精査し、Pages プロジェクト命名・`production_branch`・互換性同期方針に変更がある場合は REQUIRED 判定 |

## 実行手順

### ステップ 1: 実装ガイド作成（Part 1 + Part 2）

`outputs/phase-12/implementation-guide.md` に **2 パート構成必須**。

**Part 1（中学生レベル / 日常の例え話）— Cloudflare Pages を日常に例える**:

- 「Cloudflare Pages プロジェクトは『お店の本店と支店』」: 本店（production: `ubm-hyogo-web`）はお客様が来る正式な店、支店（staging: `ubm-hyogo-web-staging`）は店員が新メニューをこっそり試すお試し店。両方を別々の場所に作っておかないと、新メニューの実験が本店のお客様にいきなり出てしまう。
- 「`production_branch` は『どの倉庫の在庫を本店に並べるか』」: 本店には `main` 倉庫の在庫だけを並べる。支店には `dev` 倉庫の在庫を並べる。倉庫を取り違えると「本店なのにお試しメニュー」「支店なのに本物のメニュー」になって混乱する。
- 「`compatibility_date` は『お店の営業ルール改定日』」: ルール改定日（`2025-01-01`）を本店と支店で揃えておく。Workers（API: 厨房）と Pages（Web: フロアサービス）でルール改定日が違うと、「厨房ではこの食材使えるのに、フロアでは使えない」みたいな矛盾が起きる。
- 「Pages Git 連携 OFF は『お店の発注を 1 本化する』」: 配送業者（GitHub Actions）が在庫を運ぶのに、もう一つ別の配送業者（Pages 自動 Git 連携）が同じ在庫を運ぶと、「古い在庫が新しい在庫を上書きする」事故が起きる。配送は 1 本化する（GitHub Actions 主導 / Pages 連携は OFF）。
- 「命名規則は『本店 = `<base>` / 支店 = `<base>-staging`』」: お店の名前は本店 = 「UBM-Hyogo Web」、支店 = 「UBM-Hyogo Web Staging」のように `-staging` を後ろにつけて統一する。GitHub Variable には本店名（`<base>`）だけを置いて、ワークフローで「-staging」を後ろにつける設計にする。両方を Variable に置くと「-staging-staging」になる事故が起きる。
- 「`bash scripts/cf.sh` 経由は『金庫の鍵をその場でだけ取り出す』」: API Token を直接 `wrangler` に渡すと shell history に残る。`scripts/cf.sh` 経由なら 1Password から「使う瞬間だけ」鍵を取り出して、終わったら金庫に戻す。鍵がパソコンの履歴に残らない。
- 「OpenNext は『料理の盛り付け方の違い』」: 素の Next.js は `.next` フォルダに料理を盛り付ける。OpenNext は `.open-next/assets/` + `_worker.js` という別の盛り付け方をする。Pages 側がどっちの盛り付けを期待しているかを確認しないと、料理が出てこない（500 エラー）。

**Part 1 専門用語セルフチェック**:

| 用語 | 日常語への言い換え |
| --- | --- |
| Cloudflare Pages プロジェクト（production / staging） | 本店 / 支店 |
| `production_branch` | どの倉庫の在庫を本店に並べるか |
| `compatibility_date` / `compatibility_flags` | お店の営業ルール改定日 / 使える食材の許可リスト |
| Workers 正本 / Pages 派生 | 厨房（Workers）が正本、フロア（Pages）はそれに合わせる |
| Pages Git 連携 OFF | 配送業者を 1 本化する |
| 命名規則「`<base>` / `<base>-staging`」 | 本店 = `<base>` / 支店 = `<base>-staging` |
| Variable `CLOUDFLARE_PAGES_PROJECT` = production 名 | GitHub Variable には本店名だけを置く |
| `bash scripts/cf.sh` 経由 | 金庫の鍵をその場でだけ取り出す |
| OpenNext のアップロード対象（`.next` vs `.open-next/...`） | 料理の盛り付け方の違い |
| API Token 最小スコープ | 鍵に「Pages だけ開く」と書いておく |

**Part 2（開発者向け技術詳細）**:

| セクション | 内容 |
| --- | --- |
| Cloudflare Pages プロジェクトの構成要素 | `name` / `production_branch` / `compatibility_date` / `compatibility_flags` / アップロード成果物パス / Git 連携 ON/OFF の 6 軸。各軸の影響範囲（preview 扱い / runtime API 可用性 / 二重 deploy リスク） |
| 設定一致表（最終状態） | production = `ubm-hyogo-web` / `production_branch=main` / staging = `ubm-hyogo-web-staging` / `production_branch=dev` / 両者 `compatibility_date=2025-01-01` / `compatibility_flags=["nodejs_compat"]` / Git 連携 OFF |
| `bash scripts/cf.sh` 経由コマンド系列 | 上流確認 → OpenNext 判定 → production 作成 → staging 作成 → 設定/動作確認 の 5 段（Phase 2 §コマンド草案と同一） |
| `wrangler` 直接実行禁止 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」/ AC-14。`scripts/cf.sh` の役割（`op run` 動的注入 / `ESBUILD_BINARY_PATH` / `mise exec --` / Node 24 + pnpm 10 保証） |
| API Token 最小スコープ | `Account.Cloudflare Pages.Edit` / `Account.Account Settings.Read`（必要なら Workers Scripts.Edit / D1.Edit を別 token として分離）。Token 命名規則 `ubm-hyogo-pages-{env}-{yyyymmdd}` |
| OpenNext アップロード判定 (A)/(B) | (A) `.next` 継続で smoke green = 現状維持 / (B) `_worker.js` 不在で smoke red = `.open-next/assets` への切替を **UT-05 にフィードバック**（本タスクではプロジェクトのみ作成し、`web-cd.yml` / `apps/web/wrangler.toml` は触らない） |
| 命名規則 / Variable 引き渡し | production = `<base>` / staging = `<base>-staging` の suffix 方式 / Variable `CLOUDFLARE_PAGES_PROJECT` には production 名 = `ubm-hyogo-web`（suffix なし）を渡し、`web-cd.yml` 側で `${{ vars.X }}-staging` 連結 |
| `production_branch` 環境別配線 | production = `main` / staging = `dev`。逆配線時は preview 扱いでカスタムドメイン未反映、URL がプレビューエイリアス化 |
| `compatibility_date` Workers 同期 | `apps/api/wrangler.toml` の `2025-01-01` を正本として Pages 側を同期。Workers 側更新時は Pages 側も同時に同期する運用を 01b ドキュメントに追記 |
| Pages Git 連携 OFF 既定 | create 直後の連携なし状態を維持。Dashboard で OFF 確認。ON で運用すると GHA と二重 deploy で古い commit 採用レース |
| 5 ステップ smoke | 前提確認 → `pages project list` → dev push → main push → Git 連携 OFF / OpenNext 整合性（Phase 11 manual-smoke-log.md と同一） |
| rollback 経路 | (1) `bash scripts/cf.sh pages project delete <name>` + 再 create / (2) Cloudflare Dashboard で API Token 失効・再発行 / (3) Variable 値の同時更新（命名変更時） |
| Workers 正本 / Pages 派生境界 | Workers 側 (`apps/api/wrangler.toml`) を正本、Pages 側を派生コピーで揃える。Dashboard 手動編集による drift は `pages project list` 出力照合で検出 |

> **Part 2 で扱わない事項**:
> - GitHub Secrets / Variables の配置（UT-27 のスコープ）
> - Cloudflare Secrets / Service Account JSON 配置（UT-25 のスコープ）
> - 本番デプロイ実行（UT-06 のスコープ）
> - カスタムドメイン本登録（UT-16 のスコープ）
> - `apps/web/wrangler.toml` / `web-cd.yml` の編集（UT-05 のスコープ。OpenNext 切替が必要なら UT-05 にフィードバック）
> - Terraform Cloudflare Provider 化（案 C）は将来 IaC 化フェーズで再評価
> - Pages Git 連携自動 deploy（案 D）は MVP / 将来とも非推奨

### ステップ 2: システム仕様更新サマリー（Step 1-A/B/C / Step 2 判定）

`outputs/phase-12/system-spec-update-summary.md` に以下を記述。

**Step 1-A: 完了タスク記録 + 関連 doc リンク + LOGS.md×2 + topic-map**

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/30-workflows/LOGS.md` | UT-28 Phase 1〜13 の `spec_created` 行追記（Phase 1〜3 = completed / Phase 4〜13 = pending） |
| `.claude/skills/task-specification-creator/LOGS.md` | 実ファイルなしの場合は対象外（パス補正）。改善候補は skill feedback に記録 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `deployment-core.md` / `deployment-gha.md` への UT-28 反映見出しを index 再生成（`pnpm indexes:rebuild`）で同期 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | `cloudflare-pages-projects` / `production_branch` / `compatibility_date` キーワードの登録を index 再生成で同期 |
| `CLAUDE.md`「シークレット管理 / Cloudflare 系 CLI 実行ルール」章 | 追記不要。CLAUDE.md は一次正本（`scripts/cf.sh` 経由 / `wrangler` 直接実行禁止）を保持し、UT-28 固有の Pages プロジェクト命名・互換性同期は aiworkflow-requirements の `deployment-core.md` / `deployment-gha.md` に集約 |
| 関連 doc リンク | 親タスク `unassigned-task/UT-28-...md` と本ワークフローの双方向リンク追加 |

**Step 1-B: 実装状況テーブル更新**

- `docs/30-workflows/LOGS.md` のテーブルで `ut-28-cloudflare-pages-projects-creation` 行を `spec_created`（仕様書整備済 / 実 Pages プロジェクト作成は Phase 13 ユーザー承認後）に更新。
- `unassigned-task/UT-28-...md` から本ワークフローへのリンク追加。

**Step 1-C: 関連タスクテーブル更新**

- 上流: 01b（Cloudflare base bootstrap）/ UT-05（CI/CD パイプライン実装）の各仕様書から本ワークフローへの双方向リンクを追加。
- 下流: UT-27（GitHub Secrets / Variables 配置）/ UT-06（本番デプロイ実行）/ UT-16（カスタムドメイン）/ UT-29（CD 後スモーク）の各仕様書から本ワークフローへの双方向リンクを追加。
- 上流 2 件完了前提が UT-28 着手の必須条件である旨を 5 箇所目（Phase 1 / 2 / 3 / Phase 11 STEP 0 / 本サマリ）として再掲。

**Step 1-A/1-B/1-C の判定込み**: 3 サブステップすべて **REQUIRED**（spec_created でも N/A 不可）。

**Step 2: aiworkflow-requirements 仕様更新 = REQUIRED**

> 本タスクは Cloudflare Pages プロジェクト命名・`production_branch`・互換性同期・Git 連携方針を新規確定する。
> apps/web / apps/api / D1 / IPC 契約 / UI 仕様は変更しないが、運用正本である `.claude/skills/aiworkflow-requirements/references/deployment-core.md` / `deployment-gha.md` には UT-28 の設定一致表と `bash scripts/cf.sh` コマンド草案、Workers 正本 / Pages 派生境界、Variable 引き渡し値（`CLOUDFLARE_PAGES_PROJECT = ubm-hyogo-web`）を反映する必要がある。

**aiworkflow-requirements 反映対象（Step 2）**:

- `.claude/skills/aiworkflow-requirements/references/deployment-core.md`: Pages プロジェクト 2 件の命名・`production_branch` 環境別配線・Workers 正本 / Pages 派生境界 / Git 連携 OFF 既定 を追記
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`: `web-cd.yml` の Variable suffix 連結仕様 / `bash scripts/cf.sh pages project create` コマンド草案 / 5 ステップ smoke を追記
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` / `keywords.json`: `pnpm indexes:rebuild` で再生成

### ステップ 3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を記録（**Step 1-A / 1-B / 1-C / Step 2 全て個別記録**）。

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-29 | 新規 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/ | Phase 11/12/13 仕様書 + outputs/phase-{11,12,13}/ + artifacts.json |
| 2026-04-29 | 同期（Step 1-A） | docs/30-workflows/LOGS.md | UT-28 spec_created 行追加 |
| 2026-04-29 | 判定（Step 1-A） | .claude/skills/task-specification-creator/LOGS.md | 実ファイルなしのため対象外（パス補正） |
| 2026-04-29 | 同期（Step 1-A） | .claude/skills/aiworkflow-requirements/indexes/topic-map.md / keywords.json | deployment-core / deployment-gha への UT-28 反映見出しを `pnpm indexes:rebuild` で再生成 |
| 2026-04-29 | 判定（Step 1-A） | CLAUDE.md「シークレット管理 / Cloudflare 系 CLI 実行ルール」章 | 追記不要（一次正本維持） |
| 2026-04-29 | 同期（Step 1-B） | docs/30-workflows/LOGS.md | UT-28 行 spec_created |
| 2026-04-29 | 同期（Step 1-C） | docs/30-workflows/unassigned-task/{01b-...,UT-05,UT-27,UT-06,UT-16,UT-29}-*.md | UT-28 への双方向リンク追加 + 上流 2 件完了前提の 5 重明記 |
| 2026-04-29 | 同期（Step 2） | .claude/skills/aiworkflow-requirements/references/deployment-core.md | UT-28 の Pages プロジェクト 2 件命名・`production_branch` 環境別配線・Workers 正本/Pages 派生境界・Git 連携 OFF 既定を追記 |
| 2026-04-29 | 同期（Step 2） | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | UT-28 の `web-cd.yml` Variable suffix 連結仕様・`bash scripts/cf.sh pages project create` コマンド草案・5 ステップ smoke を追記 |
| 2026-04-29 | 追記方針 | doc/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/ | `compatibility_date` Workers→Pages 同期手順の正本ドキュメント追記方針（実追記は本 PR スコープ外） |

### ステップ 4: 未タスク検出レポート（0 件でも出力必須・current/baseline 分離）

`outputs/phase-12/unassigned-task-detection.md` に **current / baseline 分離形式** で記述。

- **baseline（既知の派生タスク群）**: 01b（Cloudflare base bootstrap）/ UT-05（CI/CD パイプライン実装）（上流）/ UT-27（GitHub Secrets / Variables 配置）/ UT-06（本番デプロイ実行）/ UT-16（カスタムドメイン）/ UT-29（CD 後スモーク）/ UT-25（Cloudflare Secrets / SA JSON deploy）。これらは独立タスクとして既起票済のため、**本タスクの未タスク検出ではカウントしない**。
- **current（本タスク Phase 1〜11 で発見した派生課題）**: Phase 11 で挙がった「保証できない範囲」（OpenNext 切替判定が runtime smoke でしか確定不可 / `compatibility_date` Workers 同期の継続運用 / Pages Dashboard 手動編集による drift / Terraform Cloudflare Provider 化（案 C）/ API Token を staging/production で別発行するか同一かの open question #2）を current 候補として精査し、formalize 要否を判定する。

| 区分 | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- | --- |
| baseline | 01b / UT-05 / UT-27 / UT-06 / UT-16 / UT-29 / UT-25 | 既存タスク | （本タスクで発見していない既存タスクのため記録不要） | 既起票済 |
| current | OpenNext アップロード対象切替（`.next` → `.open-next/assets`）が dev push smoke で必要と判明した場合 | UT-05 へのフィードバック | `apps/web/wrangler.toml` `pages_build_output_dir` と `web-cd.yml` `pages deploy` のパス変更 | unassigned-task として formalize 候補（UT-05 内に吸収可） |
| current | `compatibility_date` Workers→Pages 同期の継続運用（Workers 側更新時に Pages 側を必ず同期する運用ルール） | 運用効率化 | 01b ドキュメントに同期手順を追記 / `pages project list` 出力照合の定期実行 | Phase 13 apply-runbook §運用注記 |
| current | Pages Dashboard 手動編集による drift 検出 | 運用判断 | 「Pages プロジェクト設定編集は本仕様書 Phase 13 runbook 経由のみ」運用ルール化 / 定期 drift 検証 | unassigned-task として formalize 候補 |
| current | Terraform Cloudflare Provider（案 C）化 | 将来 IaC 化 | 次 Wave 以降 IaC 化フェーズで再評価 | unassigned-task として formalize 候補 |
| current | staging / production で API Token を別発行するか同一か | UT-27 連携の open question #2 | 漏洩影響限定の観点では別 token 推奨。MVP は UT-27 側の判断に委ねる | UT-27 内処理 / open question |
| current | Pages Git 連携自動 deploy（案 D）への将来移行検討 | 非推奨明示 | MVP / 将来とも非推奨。CD アーキテクチャ転換と矛盾するため記録のみ | 不採用記録 |

> **0 件の場合も「該当なし」セクション必須**。本タスクは current=3 件 formalize 候補 + 2 件 Phase 13 内処理 / open question + 1 件 不採用記録のため非該当。「設計タスクパターン（型→実装 / 契約→テスト / UI仕様→コンポーネント / 仕様書間差異）4 種を確認した」を明記。

### ステップ 5: スキルフィードバックレポート（改善点なしでも出力必須・3 観点必須）

`outputs/phase-12/skill-feedback-report.md` に 3 観点（テンプレ改善 / ワークフロー改善 / ドキュメント改善）でテーブル必須。

| 観点 | フィードバック | 改善提案 |
| --- | --- | --- |
| テンプレ改善 | NON_VISUAL implementation（Cloudflare Pages プロジェクト作成）で「実 `wrangler pages project create` + 実 push smoke は Phase 13 承認後」を Phase 11 で固定する流れが phase-template-phase11.md docs-only 代替 evidence で表現できた | `manual-test-result.md`（NON_VISUAL 宣言 + 証跡主ソース + スクリーンショット非作成理由）を NON_VISUAL Phase 11 の必須 4 ファイル目としてテンプレに昇格する余地（UT-27 と同型） |
| ワークフロー改善 | `bash scripts/cf.sh pages project create` 経由 + 1Password op 参照 only パターンが Token 値の history 残存抑制と「op 参照のみ記述」を両立した。Workers 正本 / Pages 派生境界の表化が drift 検出に有効 | adapter（`scripts/cf.sh` ラッパー）の bash 系列を workflow-generation patterns に再利用テンプレ化する候補。`compatibility_date` 同期運用の正本 / 派生境界パターンを `patterns-success-implementation.md` に追加候補 |
| ドキュメント改善 | 上流 2 件完了前提を Phase 1 / 2 / 3 / 11 / 12 で 5 重明記する規約が `phase-template-core.md` に定型化されていない | 「順序事故防止のための N 重明記」を `patterns-success-implementation.md` に追加候補（UT-27 / ut-gov-001 の 5 重明記とも整合）。OpenNext 採用時の Pages アップロード対象判定基準を `deployment-core.md` の頻出パターンとして追記候補 |

> **改善点なしでも 3 観点テーブル必須**。空テーブル禁止。観察事項なしの行は「観察事項なし」の文言で埋める。

## 統合テスト連携

NON_VISUAL implementation のため app 統合テストは対象外。Phase 11 の NON_VISUAL 代替 evidence と Phase 12 の 5+1 成果物を docs validator の入力として扱う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| index | outputs/phase-12/main.md | Phase 12 統合 index（5 成果物へのリンクと完了判定） |
| 実装ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生レベル）+ Part 2（技術者レベル） |
| 仕様更新サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/B/C と Step 2=REQUIRED（理由明記） |
| 更新履歴 | outputs/phase-12/documentation-changelog.md | 変更履歴（Step 1-A/B/C/Step 2 個別記録） |
| 未タスク検出 | outputs/phase-12/unassigned-task-detection.md | current / baseline 分離（0 件でも出力） |
| skill feedback | outputs/phase-12/skill-feedback-report.md | 3 観点テーブル（改善点なしでも出力） |
| compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 skill 準拠 evidence |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase12.md | Phase 12 テンプレ正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 必須タスク詳細 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | Phase 12 落とし穴 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | Step 1-A/B/C / Step 2 詳細手順 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-11/main.md | NON_VISUAL 代替 evidence 引き継ぎ |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-02/main.md | 設定一致表 / `bash scripts/cf.sh` コマンド草案 / OpenNext 判定基準 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/index.md | AC-1〜AC-15 の参照 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | Step 2 反映先 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | Step 2 反映先 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-12.md | NON_VISUAL Phase 12 構造リファレンス |
| 参考 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-12.md（UT-27 完成版）| NON_VISUAL Phase 12 構造リファレンス（同型） |

## 完了条件

- [ ] 必須 5 ファイル + main.md + compliance check（計 7 ファイル）が `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1（中学生レベル例え話 5 つ以上）+ Part 2（技術者向け技術詳細）構成
- [ ] system-spec-update-summary に Step 1-A/1-B/1-C + Step 2 = REQUIRED（理由明記）が記述
- [ ] documentation-changelog に Step 1-A/1-B/1-C/Step 2 が個別記録
- [ ] unassigned-task-detection が current / baseline 分離形式で記述（0 件でも出力）
- [ ] skill-feedback-report が 3 観点（テンプレ / ワークフロー / ドキュメント）テーブル必須
- [ ] API Token / Account ID / Project ID 等の実値が implementation-guide / 全 outputs に**含まれていない**ことを grep で確認
- [ ] `wrangler` 直接実行が implementation-guide / 全 outputs / コマンド系列に**混入していない**ことを grep で確認
- [ ] 計画系 wording（`仕様策定のみ` / `実行予定` / `保留として記録`）が Phase 12 outputs に**残っていない**
- [ ] CLAUDE.md「シークレット管理 / Cloudflare 系 CLI 実行ルール」章への注記追加が Step 1-A の範囲で「追記不要」と判定されている
- [ ] 上流 2 件完了前提が本 Phase 12 でも再掲されている（5 重明記の 5 箇所目）
- [ ] `workflow_state: spec_created` が冒頭メタに明記され、root `artifacts.json` の据え置き方針が記述されている

## 検証コマンド

```bash
# 必須 5+2 ファイル確認
test -f docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/main.md
test -f docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/implementation-guide.md
test -f docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/system-spec-update-summary.md
test -f docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/documentation-changelog.md
test -f docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/unassigned-task-detection.md
test -f docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/skill-feedback-report.md
test -f docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/phase12-task-spec-compliance-check.md

# 計画系 wording 残存確認
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/ \
  || echo "計画系 wording なし"

# API Token / Account ID / Project ID 値転記なし確認
rg -nE "ya29\.|-----BEGIN PRIVATE|CLOUDFLARE_API_TOKEN=[A-Za-z0-9_-]{10,}|CLOUDFLARE_ACCOUNT_ID=[a-f0-9]{32}" \
  docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/ \
  || echo "Secret 値転記なし"

# wrangler 直接実行混入なし確認
rg -nE "^\s*wrangler\s|`wrangler\s" docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/ \
  | rg -v "scripts/cf.sh" \
  && echo "NG: wrangler 直接実行混入の可能性" || echo "OK: scripts/cf.sh 経由のみ"

# Part 1 / Part 2 構造確認
rg -n "^## Part [12]|^### Part [12]" docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/implementation-guide.md

# Step 1-A/B/C と Step 2 REQUIRED 確認
rg -n "Step 1-[ABC]|Step 2.*REQUIRED" docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/system-spec-update-summary.md

# workflow_state: spec_created 明記確認
rg -n "workflow_state.*spec_created" docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-12.md
```

## 苦戦防止メモ

1. **API Token / Account ID / Project ID の実値を Part 2 に書かない**: token / Account ID / Project ID の実値は payload / runbook / Phase outputs に**一切転記しない**。`op://` 参照と環境変数のみ記述する。公開 URL（`https://ubm-hyogo-web-staging.pages.dev` 等）は記録可。
2. **`wrangler` 直接実行禁止**: implementation-guide Part 2 / 全 outputs のコマンド例は **必ず `bash scripts/cf.sh ...` 経由**。CLAUDE.md / AC-14 違反を Phase 12 完了前に grep で検出する。
3. **Step 2 = REQUIRED の理由を必ず明記**: 設定一致表と `bash scripts/cf.sh` コマンド草案を aiworkflow-requirements の `deployment-core.md` / `deployment-gha.md` 運用正本へ反映する。
4. **上流 2 件（01b / UT-05）を current 未タスクにカウントしない**: 既に独立タスクとして起票済のため baseline 区分に分離する。
5. **改善点なしでも skill-feedback-report 3 観点テーブル必須**: 「観察事項なし」の文言で行を埋める。空テーブル禁止。
6. **計画系 wording 禁止**: `仕様策定のみ` / `実行予定` / `保留として記録` は Phase 12 完了前にすべて実更新ログへ昇格。
7. **CLAUDE.md は追記不要**: `scripts/cf.sh` 経由 / `wrangler` 直接実行禁止 の一次正本を保持し、UT-28 固有の Pages プロジェクト命名・互換性同期は aiworkflow-requirements `deployment-core.md` / `deployment-gha.md` に集約する。
8. **上流 2 件完了前提の N 重明記**: Phase 1 / 2 / 3 / Phase 11 STEP 0 / Phase 12 Step 1-C で 5 重明記。漏れると順序事故が発生する。
9. **`workflow_state: spec_created` 据え置き**: root `artifacts.json` を本 Phase で書き換えない。Phase 各 status は Phase 13 完了後に別 PR で更新する。
10. **OpenNext 切替フィードバックは UT-05 に切る**: 本タスク内では `apps/web/wrangler.toml` / `web-cd.yml` を編集しない。判定 (B) でも本タスクは Pages プロジェクト作成のみで完了し、切替 PR は UT-05 のスコープに渡す。
11. **300 行超過の根拠を冒頭に明記**（本ファイルでは記載済）。

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成 / **user_approval_required: true**)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - 必須 5 成果物 + main.md + compliance check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection の current（OpenNext 切替フィードバック / `compatibility_date` 同期運用 / Dashboard drift / Terraform 移行候補 / Token 別発行 / Git 連携不採用記録）→ PR body の「related work」節
  - implementation-guide Part 2 の `bash scripts/cf.sh pages project create` コマンド系列 + 設定一致表 + OpenNext 判定 → Phase 13 `apply-runbook.md` の正本
  - rollback 経路 3 種 → Phase 13 `apply-runbook.md` の rollback 章の正本
  - `workflow_state: spec_created` → Phase 13 PR body に明記し、実 PUT 完了後の昇格は別 PR で処理
- ブロック条件:
  - 必須 5 ファイル + main.md + compliance check のいずれかが欠落
  - 計画系 wording が残存
  - implementation-guide / 全 outputs に API Token / Account ID / Project ID 値が混入
  - `wrangler` 直接実行が混入
  - skill-feedback-report が 3 観点テーブル未充足
  - 上流 2 件完了前提の 5 重明記が崩れている
  - root `artifacts.json` を Phase 12 で書き換えてしまっている
