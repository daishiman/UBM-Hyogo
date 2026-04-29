# Phase 11: 手動 smoke test（dev push による CD 動作確認 — NON_VISUAL / 仕様レベル固定）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub Secrets / Variables 配置実行 (ut-27-github-secrets-variables-deployment) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test（dev push → CD green / Discord 通知 / 未設定耐性） |
| 作成日 | 2026-04-29 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL / github_secrets_variables_cd_enablement |
| user_approval_required | false（Phase 13 の実 secret 配置 + 実 push 承認とは独立。本 Phase は仕様レベル固定のみ） |
| GitHub Issue | #47 |

## VISUAL / NON_VISUAL 判定（冒頭固定文言）

> **本タスクは UI / Renderer / 画面遷移を一切伴わない NON_VISUAL タスクである。**
> **したがって Phase 11 のスクリーンショットは不要であり、`outputs/phase-11/screenshots/` ディレクトリは `.gitkeep` 含めて一切作成しない。**

- **mode: NON_VISUAL**
- **taskType: implementation（GitHub governance / secrets 配置）**
- 判定理由:
  - 本ワークフローは GitHub REST API（`gh secret set` / `gh variable set` / `gh api repos/.../environments/...`）への PUT 操作と、その結果として走る GitHub Actions CD ワークフローの green / red 確認が中心であり、UI 描画は一切発生しない。
  - 実 secret 配置・実 dev push・実 CD run trigger は **Phase 13 ユーザー承認後** の別オペレーションで実行する。本 Phase 11 では「コマンド系列の仕様レベル固定 + spec walkthrough」までを成果物とする。
  - secret 配置タスクの性質上、描画される画面は存在しない。証跡の主ソースは `gh run view <id>` の URL / `dev` push の commit SHA / `gh secret list` のマスク済み出力に集約する。

## 必須 outputs（spec_created Phase 11 / NON_VISUAL 代替証跡 2 点 + index）

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 walkthrough のトップ index。NON_VISUAL 代替 evidence プレイブック（L1/L2/L3/L4）の適用結果と「実地操作不可 / Phase 13 ユーザー承認後実走」を冒頭明記 |
| `outputs/phase-11/manual-smoke-log.md` | dev push smoke の 4 ステップ（前提確認 → dev 空コミット push → CD green 確認 → Discord 通知 / 未設定耐性確認）を **NOT EXECUTED** ステータスで列挙 |
| `outputs/phase-11/manual-test-result.md` | NON_VISUAL 宣言と代替証跡の出所明示（証跡の主ソース = `gh run view <id>` の URL / `dev` push の commit SHA / `gh secret list` のマスク出力 / スクリーンショットを作らない理由 = secret 配置タスクで描画なし） |
| `outputs/phase-11/link-checklist.md` | 仕様書間の参照リンク健全性チェック（index.md / phase-NN.md / outputs / 親仕様 / .github/workflows/） |

> `outputs/phase-11/screenshots/` は**作成しない**（NON_VISUAL）。

## 目的

Phase 1〜10 で固定された設計（lane 1〜5 / Secret 3 件 + Variable 1 件 / 配置決定マトリクス / 1Password 同期手順 / `gh` CLI コマンド草案 / 動作確認手順 3 件 / 4 条件 + 5 観点 PASS / 上流 3 件 NO-GO ゲート 3 重明記）に対し、NON_VISUAL 代替 evidence プレイブックを適用して spec walkthrough を実施し、以下を確定する。

1. 仕様書の自己完結性（前提・AC-1〜AC-15・成果物パス）が満たされている
2. dev push smoke の 4 ステップ（**前提確認 → `git commit --allow-empty && git push origin dev` → `gh run watch` で deploy-staging green 確認 → Discord 通知到達 / 未設定耐性確認**）のコマンド系列が Phase 2 §動作確認手順の固定通りに `manual-smoke-log.md` で再現可能な形に展開されている
3. 全リンク（index.md ↔ phase-NN.md ↔ outputs ↔ 親仕様 ↔ `.github/workflows/`）が健全である
4. NON_VISUAL の限界（runtime CD response / GitHub Actions の eventual consistency / Discord Webhook の到達遅延 / `if: secrets.X != ''` の評価不能再現性）を明示し、保証できない範囲を Phase 12 `unassigned-task-detection.md` 候補として記録する

依存成果物として Phase 2 設計（lane 5 動作確認 / `gh` CLI 草案 / Discord 未設定耐性）、Phase 3 レビュー（NO-GO ゲート / 9 観点 PASS）、Phase 10 最終レビューを入力する。本 Phase 11 は実走ではなく walkthrough と手順仕様固定に限定する。

## 実行タスク

1. NON_VISUAL 代替 evidence 差分表（L1/L2/L3/L4）を `outputs/phase-11/main.md` に作成する（完了条件: 4 階層が漏れなく記述）。
2. dev push smoke 4 ステップのコマンド系列を `outputs/phase-11/manual-smoke-log.md` に **NOT EXECUTED** ステータスで列挙する（完了条件: Phase 2 §動作確認手順のコマンド系列が網羅 + 期待結果 + 担当者）。
3. NON_VISUAL 宣言と代替証跡の出所（`gh run view` URL / commit SHA / `gh secret list` マスク出力）、スクリーンショット非作成理由を `manual-test-result.md` に明示する。
4. spec walkthrough を実施し、phase-01〜phase-13 / index.md / artifacts.json / outputs/* / 親仕様 / `.github/workflows/{backend-ci,web-cd}.yml` 間の参照リンクを `outputs/phase-11/link-checklist.md` に記録する（完了条件: 全リンクが OK / Broken で表記）。
5. 「実地操作不可 / Phase 13 ユーザー承認後実走」を `main.md` 冒頭に明記する。
6. 保証できない範囲（GitHub Actions の eventual consistency / `gh api` rate limit / Discord Webhook 到達遅延 / `if: secrets.X != ''` 評価不能の再現実験不可 / 1Password Last-Updated メモの drift）を Phase 12 申し送り候補として最低 3 項目列挙する。

## NON_VISUAL 代替 evidence の 4 階層（本タスク適用版）

| 階層 | 代替手段 | 何を保証するか | 何を保証できないか（→ 申し送り先） |
| --- | --- | --- | --- |
| **L1: 型** | `gh secret set NAME --body "$VAR"` / `gh variable set NAME --body "VALUE"` / `gh api repos/.../environments/{env} -X PUT` のコマンド構文と引数型（`--env` の値域 = `staging` / `production`、Secret/Variable 名 = UPPER_SNAKE_CASE）を仕様レベルで検証 | コマンド型整合（CLI 引数名 / 値域 / scope flag の有無） | 実 PUT 応答の意味的整合（401 / 404 / 422 判定） |
| **L2: lint / boundary** | 「Secret = マスクされる / Variable = マスクされない」「repository-scoped vs environment-scoped 同名併存禁止」の用途分離 boundary を設計レベルで検証。`CLOUDFLARE_PAGES_PROJECT` を Secret に置く誤りを赤として明示 | 二重正本事故 / マスク事故 / 同名併存事故 の境界 | 実走時の人為ミス（誤スコープ指定）— `apply-runbook.md` で別途緩和 |
| **L3: in-memory test** | dev push smoke の 4 ステップ（前提確認 → 空コミット push → `gh run watch` → Discord/未設定耐性）の **コマンド系列を仕様レベルで固定**（`manual-smoke-log.md` に NOT EXECUTED で列挙） | 「再現する手順」の網羅性 | GitHub Actions eventual consistency / Discord Webhook 到達遅延 / `gh api` rate limit |
| **L4: 意図的 violation snippet** | (a) `CLOUDFLARE_PAGES_PROJECT` を Secret として `gh secret set` した場合に CI ログマスクで suffix 連結結果が追えなくなる赤ケース、(b) repository-scoped と environment-scoped に同名 secret を併存させた場合の上書き混線、(c) `DISCORD_WEBHOOK_URL` 未設定で `if: secrets.X != ''` が無音失敗するケース を spec walkthrough で red 確認 | 「赤がちゃんと赤になる」(マスク事故 / 同名併存 / 無音失敗 検出) | （L4 自体は green 保証ではない） |

## dev push smoke 4 ステップ コマンド系列（NOT EXECUTED）

> 本 Phase では実走しない。Phase 13 ユーザー明示承認後に別オペレーションで走らせる前提。
> ここで列挙するのはコマンドの「仕様レベル固定」のみであり、実行ログ・実 CD 応答・実 Discord 到達ログは本 Phase では取得しない。

```bash
# === STEP 0: 前提確認（NOT EXECUTED）===
# UT-05 / UT-28 / 01b 完了か（重複明記の最終地点）
gh pr list --search "UT-05" --state merged
bash scripts/cf.sh pages project list           # UT-28 のプロジェクト名確定確認
op item get "Cloudflare" --vault UBM-Hyogo > /dev/null  # 01b の API Token / Account ID 存在確認
gh auth status                                   # actions:write / administration:write スコープ確認

# Phase 13 で実 secret 配置 + environment 作成済みであること
gh secret list
gh secret list --env staging
gh secret list --env production
gh variable list

# === STEP 1: dev 空コミット push（NOT EXECUTED — Phase 13 ユーザー承認後）===
git switch dev
git pull --ff-only origin dev
git commit --allow-empty -m "chore(cd): trigger deploy-staging smoke [UT-27]"
git push origin dev
# 期待結果: dev branch に commit SHA が記録され、backend-ci.yml / web-cd.yml がトリガーされる

# === STEP 2: CD green 確認（NOT EXECUTED）===
gh run list --branch dev --limit 5
gh run watch                                     # backend-ci.yml deploy-staging を watch
gh run watch                                     # web-cd.yml deploy-staging を watch
# 期待結果:
#   - backend-ci.yml の deploy-staging job が green
#   - web-cd.yml の deploy-staging job が green
#   - Cloudflare Pages / Workers Deploys に staging deploy が記録

# 個別の job ログから secret 参照失敗（401 / 404）が無いか確認
gh run view <run-id> --log | rg -nE "401|403|404|Unauthorized|invalid token" || echo "secret error なし"

# === STEP 3: Discord 通知 / 未設定耐性確認（NOT EXECUTED）===
# 3-A: 通常通知到達確認
#   Discord チャンネルに success / failure 通知が届いたか目視
#   通知文面に commit SHA / job 名 / 結果判定が含まれるか

# 3-B: 未設定耐性確認（苦戦箇所 §3 / R-3）
#   一時的に DISCORD_WEBHOOK_URL を空に切替（または別 worktree で空文字環境）し、
#   通知ステップが skip / early-return して CI 全体が success になるか確認
#   `if: ${{ always() && secrets.DISCORD_WEBHOOK_URL != '' }}` が評価できないケース→
#   env で受けてシェル空文字判定する代替設計が workflow 側に入っているか確認
#   入っていない場合は Phase 12 unassigned-task-detection に UT-05 へのフィードバックとして登録

# === STEP 4: 1Password Last-Updated メモ更新確認（NOT EXECUTED）===
# 1Password Item Notes の Last-Updated 日時が同期実施日と一致するか目視
# （値ハッシュは記載しない / 値の内容を間接推測されるリスクを避ける）
```

> **担当者**: solo 運用のため実行者本人。`gh secret delete` / 1Password から再注入による即時復旧経路を `outputs/phase-13/apply-runbook.md` に明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-02/main.md | lane 5 動作確認 / `gh` CLI 草案 / Discord 未設定耐性の正本 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-03/main.md | NO-GO 条件 / 9 観点 PASS / R-1〜R-8 |
| 必須 | docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md | 親仕様（苦戦箇所 §1〜§6） |
| 必須 | .github/workflows/backend-ci.yml | secret/variable 参照キー確認 |
| 必須 | .github/workflows/web-cd.yml | secret/variable 参照キー確認 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase11.md | docs-only / spec_created Phase 11 必須 outputs フォーマット |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | L1〜L4 プレイブックの正本 |
| 必須 | CLAUDE.md（シークレット管理 / ブランチ戦略） | 1Password 正本 / dev push 戦略の確認 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-11.md | NON_VISUAL Phase 11 構造リファレンス |

## 実行手順

1. NON_VISUAL 代替 evidence の 4 階層を `outputs/phase-11/main.md` へ記録する。
2. dev push smoke 4 ステップのコマンド系列を `manual-smoke-log.md` に NOT EXECUTED として記録する。
3. `manual-test-result.md` に NON_VISUAL 宣言・代替証跡の主ソース・スクリーンショット非作成理由を明示する。
4. `link-checklist.md` で index.md / phase-NN.md / outputs / 親仕様 / `.github/workflows/` の参照リンクを確認する。
5. 「Phase 13 ユーザー承認後に実走」を `main.md` 冒頭で明記する。

## 統合テスト連携

本 Phase は spec walkthrough のため smoke を実走しない。Phase 13 ユーザー明示承認後に同じコマンド系列を実走し、`outputs/phase-13/verification-log.md` / `apply-runbook.md` / `op-sync-runbook.md` を確定させる。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| walkthrough | outputs/phase-11/main.md | NON_VISUAL 代替 evidence の記録（L1〜L4）+ 「実地操作不可」明記 |
| smoke log | outputs/phase-11/manual-smoke-log.md | dev push smoke 4 ステップの NOT EXECUTED コマンド系列 |
| 代替証跡宣言 | outputs/phase-11/manual-test-result.md | NON_VISUAL 宣言 / 証跡主ソース / スクリーンショット非作成理由 |
| link check | outputs/phase-11/link-checklist.md | 仕様書間リンク確認 |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `manual-test-result.md` / `link-checklist.md` の 4 ファイルが揃っている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] NON_VISUAL 代替 evidence 差分表（L1/L2/L3/L4）が `main.md` に記載
- [ ] dev push smoke 4 ステップ（前提確認 / 空コミット push / `gh run watch` / Discord 未設定耐性）のコマンド系列が `manual-smoke-log.md` に NOT EXECUTED ステータスで網羅
- [ ] `manual-test-result.md` に「証跡の主ソース = `gh run view <id>` の URL / commit SHA / `gh secret list` マスク出力」と「スクリーンショットを作らない理由 = secret 配置タスクで描画なし」が明記
- [ ] spec walkthrough のリンク健全性が `link-checklist.md` に OK/Broken で記録
- [ ] 「実地操作不可 / Phase 13 ユーザー承認後実走」が `main.md` 冒頭で明記
- [ ] 保証できない範囲が Phase 12 申し送り候補として最低 3 項目列挙
- [ ] 上流 3 件（UT-05 / UT-28 / 01b）完了前提が NO-GO 条件として再掲（4 重明記の 4 箇所目）

## 検証コマンド

```bash
# 必須 4 ファイルの存在
ls docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-11/
# main.md / manual-smoke-log.md / manual-test-result.md / link-checklist.md の 4 件

# screenshots/ が存在しないこと
test ! -d docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-11/screenshots && echo OK

# NOT EXECUTED が manual-smoke-log.md に明記されていること
rg -n "NOT EXECUTED" docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-11/manual-smoke-log.md

# 4 ステップ smoke の各ステップが記述されているか
rg -n "STEP [0-4]" docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-11/manual-smoke-log.md

# secret 値転記なし確認（マスク済 op 参照のみ）
rg -nE "ya29\.|-----BEGIN PRIVATE|gho_|ghp_|CLOUDFLARE_API_TOKEN=[A-Za-z0-9]" docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-11/ \
  || echo "Secret 値転記なし"
```

## 苦戦防止メモ

1. **screenshots/ を作らない**: NON_VISUAL タスクで `.gitkeep` を作ると validator が VISUAL と誤判定する。
2. **「実走した」と書かない**: 本 Phase は spec walkthrough。`manual-smoke-log.md` には必ず `NOT EXECUTED` ステータスを残す。実 push / 実 secret 配置は Phase 13 ユーザー承認後。
3. **`CLOUDFLARE_PAGES_PROJECT` を Secret に置くケースを赤として明示**: マスクで suffix 連結結果が追えなくなる。L4 で意図的 violation として記録する。
4. **同名併存禁止を「設計参照」ではなく「drift 検証」として位置づけ**: repository / environment 同名併存で意図せぬ上書き事故を起こす。`gh secret list` / `gh secret list --env X` の照合手順を `manual-smoke-log.md` STEP 0 で固定する。
5. **上流 3 件完了 NO-GO の 4 重明記**: Phase 1 / 2 / 3 に加え、本 Phase 11 でも `manual-smoke-log.md` STEP 0 に再掲する。
6. **`if: secrets.X != ''` 無音失敗の再現実験は spec walkthrough では行わない**: 実走でしか再現できないため Phase 13 で `verification-log.md` / `apply-runbook.md` に記録し、本 Phase では参照のみ。
7. **secret 値を一切書かない**: コマンド例にも実値を書かず、`"$VAR"` / `op://...` 参照のみ記述する。

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - L3/L4 で発見した「保証できない範囲」を `unassigned-task-detection.md` の current 区分へ転記
  - dev push smoke 4 ステップのコマンド系列を `implementation-guide.md` Part 2 に再掲
  - `link-checklist.md` の Broken 項目があれば Phase 12 で同 sprint 修正
  - `if: secrets.X != ''` 代替設計の有無確認結果を UT-05 へのフィードバック候補として `unassigned-task-detection.md` に登録
- ブロック条件:
  - `screenshots/` ディレクトリが誤って作成されている
  - `manual-smoke-log.md` が「実走済」と誤記している
  - `link-checklist.md` が空（spec walkthrough 未実施）
  - 4 ステップのいずれかが欠落
  - secret 値が outputs に転記されている
