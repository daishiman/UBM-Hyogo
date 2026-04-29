# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub Secrets / Variables 配置実行 (ut-27-github-secrets-variables-deployment) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-29 |
| 前 Phase | 11 (手動 smoke / NON_VISUAL walkthrough) |
| 次 Phase | 13 (PR 作成 / ユーザー承認後 secret 配置実行) |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL / github_secrets_variables_cd_enablement |
| user_approval_required | false（Phase 13 の実 secret 配置承認とは独立） |
| GitHub Issue | #47 |

> **300 行上限超過の根拠**: 本 Phase は Phase 12 必須 6 成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を全件出力し、それぞれが Phase 11 4 階層代替 evidence と Phase 2 配置決定マトリクス / 1Password 同期手順 / `gh` CLI 草案と直列追跡される。責務分離不可能性を根拠に 300 行を許容超過する。

## 目的

Phase 1〜11 の成果物（仕様書 / NON_VISUAL 代替 evidence / dev push smoke 4 ステップの仕様レベル固定 / spec walkthrough）を、本タスクの限界（実 secret 配置と実 dev push trigger は Phase 13 ユーザー承認後）に整合する形でドキュメント化する。具体的には、必須 6 成果物を出力し、本ワークフローが「Phase 1〜13 タスク仕様書整備までで完了」する境界を明示する。

依存成果物は Phase 2 設計（配置決定マトリクス / Secret/Variable 一覧 / 1Password 同期手順 / `gh` CLI 草案）、Phase 3 レビュー（NO-GO ゲート / 9 観点 PASS / open question 6 件）、Phase 11 NON_VISUAL walkthrough（保証できない範囲）とする。

## 実行タスク（Phase 12 必須 6 成果物・全件必須）

1. **実装ガイド作成（Part 1 中学生レベル / Part 2 開発者技術詳細）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新サマリー（Step 1-A/1-B/1-C / Step 2 判定）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴** — `outputs/phase-12/documentation-changelog.md`
4. **未タスク検出レポート（0 件でも出力必須・current/baseline 分離）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須・3 観点必須）** — `outputs/phase-12/skill-feedback-report.md`
6. **Phase 12 タスク仕様準拠チェック** — `outputs/phase-12/phase12-task-spec-compliance-check.md`

## docs-only / spec_created モード適用

| 項目 | 適用内容 |
| --- | --- |
| Step 1-G 検証コマンド | docs validator のみ実行（実コードに対する typecheck / lint / app test は対象外） |
| implementation-guide Part 2 | GitHub Secrets / Variables / Environments 概念 / `gh` CLI コマンド系列 / 1Password 一時環境変数 + unset パターン / dev push smoke 4 ステップ / 同名併存禁止 / API Token 最小スコープ |
| Step 1-B 実装状況 | `spec_created`（実 secret 配置と実 dev push trigger は Phase 13 ユーザー承認後の別オペレーション） |
| Step 2 判定 | aiworkflow-requirements の `deployment-gha.md` / `deployment-secrets-management.md` / `environment-variables.md` への反映を Step 1-A/1-B/1-C と分離して精査し、Secret/Variable 配置スコープに変更がある場合は REQUIRED 判定 |

## 実行手順

### ステップ 1: 実装ガイド作成（Part 1 + Part 2）

`outputs/phase-12/implementation-guide.md` に **2 パート構成必須**。

**Part 1（中学生レベル / 日常の例え話）— secret 管理を日常に例える**:

- 「GitHub Secrets は『家の鍵をしまう金庫』」: 家の鍵（Cloudflare API Token）を玄関に置いておくと泥棒に取られる。金庫（GitHub Secrets）にしまうと、必要なときだけ取り出される。
- 「Variables は『玄関に貼る家族の名前』」: 名前は秘密じゃないからログにそのまま出ても OK。`CLOUDFLARE_PAGES_PROJECT` のプロジェクト名は秘密じゃないので「金庫」じゃなく「玄関の貼り紙」（Variable）に書く。
- 「Environments は『部屋ごとに別の鍵を用意する』」: リビング（staging）と書斎（production）で別の鍵をつけると、リビングの鍵が落ちても書斎は守られる。これが environment-scoped。同じ鍵を玄関全体（repository-scoped）に置くと、片方の鍵が落ちると両方の部屋に入れてしまう。
- 「1Password は『鍵の本物』、GitHub Secrets は『鍵の写し』」: 本物は 1Password に保管し、GitHub にはコピーを置く。本物を更新したら、必ずコピーも更新する（同期手順）。GitHub の方を直接書き換えると「どっちが本物か分からなくなる」事故（drift）が起きる。
- 「`if: secrets.X != ''` は『誰もいないのに玄関で「ただいま」と言う』」: GitHub の仕様で、この書き方は「ただいま」と言ってるつもりが**実は誰にも届かない**ことがある。代わりに「いつでも玄関に入って、家族がいるか目視で確認してから挨拶する」（env で受けてシェルで空文字判定する）方式にする。

**Part 1 専門用語セルフチェック**:

| 用語 | 日常語への言い換え |
| --- | --- |
| GitHub Secrets | 家の鍵をしまう金庫 |
| GitHub Variables | 玄関に貼る家族の名前（秘密じゃない情報） |
| Environments（staging/production） | 部屋ごとに別の鍵を用意する |
| repository-scoped vs environment-scoped | 玄関全体の鍵 vs 部屋ごとの鍵 |
| 1Password 正本 / GitHub 派生コピー | 鍵の本物 / 鍵の写し |
| `op read` + `unset` | 必要なときだけ鍵を出して、使い終わったら金庫に戻す |
| `if: secrets.X != ''` 無音失敗 | 誰もいない玄関で「ただいま」と言って気づかないこと |
| API Token 最小スコープ | 鍵に「リビングだけ開く」と書いておく（書斎は開けられない） |

**Part 2（開発者向け技術詳細）**:

| セクション | 内容 |
| --- | --- |
| GitHub Secrets / Variables / Environments の関係 | repository scope / environment scope / organization scope の 3 層と解決順序。`environment: name:` 宣言があるジョブは environment-scoped が優先解決される |
| Secret / Variable 判定基準 | マスクが必要 = Secret / マスク不要かつログ可視性が欲しい = Variable。`CLOUDFLARE_PAGES_PROJECT` を Variable にする理由（suffix 連結結果がログから追える） |
| 配置決定マトリクス再掲 | Phase 2 §配置決定マトリクスの 4 件（CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / DISCORD_WEBHOOK_URL / CLOUDFLARE_PAGES_PROJECT）を再掲 |
| `gh` CLI コマンド系列 | environment 作成 → secret 配置 → variable 配置 → 動作確認 → 同期検証 の 5 段（Phase 2 §`gh` CLI コマンド草案 と同一） |
| 1Password 一時環境変数 + unset パターン | `op read` で一時 export → `gh secret set --body "$VAR"` → `unset` の 3 段。shell history 残存抑制の根拠 |
| dev push smoke 4 ステップ | 前提確認 → `git commit --allow-empty && git push origin dev` → `gh run watch` → Discord/未設定耐性確認（Phase 11 manual-smoke-log.md と同一） |
| 同名併存禁止 | repository-scoped と environment-scoped に同名 secret を併存させない理由（どちらが効いているか曖昧化）。`gh secret list` / `gh secret list --env X` で照合する手順 |
| API Token 最小スコープ | Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read のみ。Token 命名規則 `ubm-hyogo-cd-{env}-{yyyymmdd}` |
| `if: secrets.X != ''` 代替設計 | 「常に通知ステップに入って env で受け、シェル側で空文字判定して early-return」のパターン |
| rollback 経路 | (1) `gh secret delete` + 1Password から再注入 / (2) Cloudflare 側で API Token 失効・再発行 / (3) `gh api repos/.../environments/{env} -X DELETE` |
| 二重正本 drift 防止 | 1Password 正本 / GitHub 派生 / GitHub UI 直編集禁止 / Last-Updated メモ運用 |

> **Part 2 で扱わない事項**:
> - Cloudflare 側のシークレット注入（`scripts/cf.sh` 経由の Cloudflare Secrets 配置）は本タスクと無関係（UT-25 のスコープ）。
> - `1Password secret URI` 形式の op SA 即時導入（案 D）は将来移行候補で、本タスクでは方針言及のみ。
> - Terraform GitHub Provider（案 C）は IaC 化フェーズに先送り。

### ステップ 2: システム仕様更新サマリー（Step 1-A/B/C / Step 2 判定）

`outputs/phase-12/system-spec-update-summary.md` に以下を記述。

**Step 1-A: 完了タスク記録 + 関連 doc リンク + LOGS.md×2 + topic-map**

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/30-workflows/LOGS.md` | UT-27 Phase 1〜13 の `spec_created` 行追記（Phase 1〜3 = completed / Phase 4〜13 = pending） |
| `.claude/skills/task-specification-creator/LOGS.md` | 実ファイルなしのため対象外（パス補正）。改善候補は skill feedback に記録 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `deployment-gha.md` / `deployment-secrets-management.md` / `environment-variables.md` への UT-27 反映見出しを index 再生成で同期 |
| `CLAUDE.md`「シークレット管理」章 | 追記不要。CLAUDE.md は一次正本（ローカル `.env` / CLI ルール）を保持し、UT-27 固有の GitHub 派生コピー運用は aiworkflow-requirements 3 正本へ集約 |
| 関連 doc リンク | 親タスク `unassigned-task/UT-27-...md` と本ワークフローの双方向リンク追加 |

**Step 1-B: 実装状況テーブル更新**

- `docs/30-workflows/LOGS.md` のテーブルで `ut-27-github-secrets-variables-deployment` 行を `spec_created`（仕様書整備済 / 実 secret 配置は Phase 13 ユーザー承認後）に更新。
- `unassigned-task/UT-27-...md` から本ワークフローへのリンク追加。

**Step 1-C: 関連タスクテーブル更新**

- 上流: UT-05 / UT-28 / 01b の各仕様書から本ワークフローへの双方向リンクを追加。
- 下流: UT-06 / UT-29 / UT-25 の各仕様書から本ワークフローへの双方向リンクを追加。
- 上流 3 件完了前提が UT-27 着手の必須条件である旨を 5 箇所目（Phase 1 / 2 / 3 / Phase 11 STEP 0 / 本サマリ）として再掲。

**Step 1-A/1-B/1-C の判定込み**: 3 サブステップすべて **REQUIRED**（spec_created でも N/A 不可）。

**Step 2: aiworkflow-requirements 仕様更新 = REQUIRED**

> 本タスクは GitHub Secrets / Variables / Environments の配置設計を新規確定する。
> apps/web / apps/api / D1 / IPC 契約 / UI 仕様は変更しないが、運用正本である `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` / `deployment-secrets-management.md` / `environment-variables.md` には UT-27 の配置決定マトリクスと 1Password 同期手順を反映する必要がある。

### ステップ 3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を記録（**Step 1-A / 1-B / 1-C / Step 2 全て個別記録**）。

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-29 | 新規 | docs/30-workflows/ut-27-github-secrets-variables-deployment/ | Phase 11/12/13 仕様書 + outputs/phase-{11,12,13}/ |
| 2026-04-29 | 同期（Step 1-A） | docs/30-workflows/LOGS.md | UT-27 spec_created 行追加 |
| 2026-04-29 | 判定（Step 1-A） | .claude/skills/task-specification-creator/LOGS.md | 実ファイルなしのため対象外（パス補正） |
| 2026-04-29 | 同期（Step 1-A） | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | deployment-gha / deployment-secrets-management / environment-variables の UT-27 反映見出し index 再生成 |
| 2026-04-29 | 判定（Step 1-A） | CLAUDE.md「シークレット管理」章 | 追記不要 |
| 2026-04-29 | 同期（Step 1-B） | docs/30-workflows/LOGS.md | UT-27 行 spec_created |
| 2026-04-29 | 同期（Step 1-C） | docs/30-workflows/unassigned-task/UT-{05,28,06,29,25}-*.md | UT-27 への双方向リンク追加 + 上流 3 件完了前提の 5 重明記 |
| 2026-04-29 | 同期（Step 2） | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | UT-27 の Secret/Variable 配置決定マトリクスを追記 |
| 2026-04-29 | 同期（Step 2） | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | UT-27 の 1Password 一時環境変数 + unset パターンを追記 |
| 2026-04-29 | 同期（Step 2） | .claude/skills/aiworkflow-requirements/references/environment-variables.md | UT-27 の 1Password 正本 + Last-Updated メモ運用を追記 |
| 2026-04-29 | 追記方針 | doc/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/ | 同期手順の正本ドキュメント追記方針（実追記は本 PR スコープ外） |

### ステップ 4: 未タスク検出レポート（0 件でも出力必須・current/baseline 分離）

`outputs/phase-12/unassigned-task-detection.md` に **current / baseline 分離形式** で記述。

- **baseline（既知の派生タスク群）**: UT-05 / UT-28 / 01b（上流）/ UT-06 / UT-29 / UT-25（関連）。これらは独立タスクとして既起票済のため、**本タスクの未タスク検出ではカウントしない**。
- **current（本タスク Phase 1〜11 で発見した派生課題）**: Phase 11 で挙がった「保証できない範囲」（`if: secrets.X != ''` 評価不能の workflow 側代替設計有無 / op SA 即時導入 / Terraform GitHub Provider 化 / 1Password Last-Updated メモ運用の自動化 / Discord チャンネル分離）を current 候補として精査し、formalize 要否を判定する。

| 区分 | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- | --- |
| baseline | UT-05 / UT-28 / 01b / UT-06 / UT-29 / UT-25 | 既存タスク | （本タスクで発見していない既存タスクのため記録不要） | 既起票済 |
| current | `if: secrets.X != ''` の workflow 側代替設計（env 受け + シェル空文字判定） | UT-05 へのフィードバック | 該当代替設計が `web-cd.yml` / `backend-ci.yml` に未導入なら UT-05 側別 PR で組み込み | unassigned-task として formalize 候補（UT-05 内に吸収可） |
| current | `1password/load-secrets-action`（案 D）導入 | 将来移行 | 次 Wave 以降 CI セキュリティ強化フェーズ | unassigned-task として formalize 候補 |
| current | Terraform GitHub Provider（案 C）化 | 将来 IaC 化 | 次 Wave 以降 IaC 化フェーズ | unassigned-task として formalize 候補 |
| current | 1Password Last-Updated メモ運用の自動化 | 運用効率化 | 1Password CLI / op SA で同期日時を自動更新 | Phase 13 op-sync-runbook §運用注記 |
| current | Discord チャンネル分離（staging / production 別） | 運用判断 | 通知混線が気になれば environment-scoped に切替 | Phase 13 内処理 / open question #2 |

> **0 件の場合も「該当なし」セクション必須**。本タスクは current=3 件 formalize 候補 + 2 件 Phase 13 内処理 / open question のため非該当。「設計タスクパターン（型→実装 / 契約→テスト / UI仕様→コンポーネント / 仕様書間差異）4 種を確認した」を明記。

### ステップ 5: スキルフィードバックレポート（改善点なしでも出力必須・3 観点必須）

`outputs/phase-12/skill-feedback-report.md` に 3 観点（テンプレ改善 / ワークフロー改善 / ドキュメント改善）でテーブル必須。

| 観点 | フィードバック | 改善提案 |
| --- | --- | --- |
| テンプレ改善 | NON_VISUAL implementation（secrets 配置）で「実 secret 配置 + 実 push trigger は Phase 13 承認後」を Phase 11 で固定する流れが phase-template-phase11.md docs-only 代替 evidence で表現できた | `manual-test-result.md`（NON_VISUAL 宣言 + 証跡主ソース + スクリーンショット非作成理由）を NON_VISUAL Phase 11 の必須 4 ファイル目としてテンプレに昇格する余地 |
| ワークフロー改善 | 1Password 一時環境変数 + `unset` パターンが shell history 残存抑制と「op 参照のみ記述」を両立した | adapter（`op read` → `gh secret set --body`）の bash 系列を workflow-generation patterns に再利用テンプレ化する候補 |
| ドキュメント改善 | 上流 3 件完了前提を Phase 1 / 2 / 3 / 11 / 12 で 5 重明記する規約が `phase-template-core.md` に定型化されていない | 「順序事故防止のための N 重明記」を `patterns-success-implementation.md` に追加候補（ut-gov-001 の 5 重明記とも整合） |

> **改善点なしでも 3 観点テーブル必須**。空テーブル禁止。観察事項なしの行は「観察事項なし」の文言で埋める。

### ステップ 6: Phase 12 タスク仕様準拠チェック

`outputs/phase-12/phase12-task-spec-compliance-check.md` に Phase 12 必須要件の準拠状況を check list で記録。

## 統合テスト連携

NON_VISUAL implementation のため app 統合テストは対象外。Phase 11 の NON_VISUAL 代替 evidence と Phase 12 の 6 成果物を docs validator の入力として扱う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| index | outputs/phase-12/main.md | Phase 12 統合 index（6 成果物へのリンクと完了判定） |
| 実装ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生レベル）+ Part 2（技術者レベル） |
| 仕様更新サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/B/C と Step 2=REQUIRED（理由明記） |
| 更新履歴 | outputs/phase-12/documentation-changelog.md | 変更履歴（Step 1-A/B/C/Step 2 個別記録） |
| 未タスク検出 | outputs/phase-12/unassigned-task-detection.md | current / baseline 分離（0 件でも出力） |
| skill feedback | outputs/phase-12/skill-feedback-report.md | 3 観点テーブル（改善点なしでも出力） |
| 準拠チェック | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 必須要件 check list |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase12.md | Phase 12 テンプレ正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 必須タスク詳細 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | Phase 12 落とし穴 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | Step 1-A/B/C / Step 2 詳細手順 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-11/main.md | NON_VISUAL 代替 evidence 引き継ぎ |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-02/main.md | 配置決定マトリクス / `gh` CLI 草案 / 1Password 同期手順 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/index.md | AC-1〜AC-15 の参照 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-12.md | NON_VISUAL Phase 12 構造リファレンス |

## 完了条件

- [ ] 必須 6 ファイル + main.md（計 7 ファイル）が `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1（中学生レベル例え話 5 つ以上）+ Part 2（技術者向け技術詳細）構成
- [ ] system-spec-update-summary に Step 1-A/1-B/1-C + Step 2 = REQUIRED（理由明記）が記述
- [ ] documentation-changelog に Step 1-A/1-B/1-C/Step 2 が個別記録
- [ ] unassigned-task-detection が current / baseline 分離形式で記述（0 件でも出力）
- [ ] skill-feedback-report が 3 観点（テンプレ / ワークフロー / ドキュメント）テーブル必須
- [ ] secret 値（API Token / Webhook URL / Account ID 等の実値）が implementation-guide / 全 outputs に**含まれていない**ことを grep で確認
- [ ] 計画系 wording（`仕様策定のみ` / `実行予定` / `保留として記録`）が Phase 12 outputs に**残っていない**
- [ ] CLAUDE.md「シークレット管理」章への注記追加が Step 1-A の範囲で処理されている
- [ ] 上流 3 件完了前提が本 Phase 12 でも再掲されている（5 重明記の 5 箇所目）

## 検証コマンド

```bash
# 必須 6+1 ファイル確認
ls docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-12/

# 計画系 wording 残存確認
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-12/ \
  || echo "計画系 wording なし"

# secret 値転記なし確認
rg -nE "ya29\.|-----BEGIN PRIVATE|gho_|ghp_|discord\.com/api/webhooks/[0-9]+/" \
  docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-12/ \
  || echo "Secret 値転記なし"

# Part 1 / Part 2 構造確認
rg -n "^## Part [12]" docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-12/implementation-guide.md

# Step 1-A/B/C と Step 2 REQUIRED 確認
rg -n "Step 1-[ABC]|Step 2.*REQUIRED" docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-12/system-spec-update-summary.md
```

## 苦戦防止メモ

1. **secret 値を Part 2 に書かない**: token / Webhook URL / Account ID の実値は payload / runbook / Phase outputs に**一切転記しない**。`op://` 参照と `"$VAR"` のみ記述する。
2. **Step 2 = REQUIRED の理由を必ず明記**: 配置決定マトリクスを aiworkflow-requirements の運用正本へ反映する。
3. **上流 3 件（UT-05 / UT-28 / 01b）を current 未タスクにカウントしない**: 既に独立タスクとして起票済のため baseline 区分に分離する。
4. **改善点なしでも skill-feedback-report 3 観点テーブル必須**: 「観察事項なし」の文言で行を埋める。空テーブル禁止。
5. **計画系 wording 禁止**: `仕様策定のみ` / `実行予定` / `保留として記録` は Phase 12 完了前にすべて実更新ログへ昇格。
6. **CLAUDE.md は追記不要**: ローカル `.env` / CLI ルールの一次正本を保持し、UT-27 固有の GitHub 派生コピー運用は aiworkflow-requirements 3 正本に集約する。
7. **上流 3 件完了前提の N 重明記**: Phase 1 / 2 / 3 / Phase 11 STEP 0 / Phase 12 Step 1-C で 5 重明記。漏れると順序事故が発生する。
8. **300 行超過の根拠を冒頭に明記**（本ファイルでは記載済）。

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成 / **user_approval_required: true**)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - 必須 6 成果物の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection の current（UT-05 blocker 1 件 + 再判定トリガ付き将来候補 2 件 + Phase 13 内処理 3 件）→ PR body の「related work」節
  - implementation-guide Part 2 の `gh` CLI コマンド系列 + 1Password 一時環境変数 + unset パターン → Phase 13 `apply-runbook.md` / `op-sync-runbook.md` の正本
  - rollback 経路 3 種 → Phase 13 `apply-runbook.md` の rollback 章の正本
- ブロック条件:
  - 必須 6 ファイルのいずれかが欠落
  - 計画系 wording が残存
  - implementation-guide / 全 outputs に secret 値が混入
  - skill-feedback-report が 3 観点テーブル未充足
  - 上流 3 件完了前提の 5 重明記が崩れている
