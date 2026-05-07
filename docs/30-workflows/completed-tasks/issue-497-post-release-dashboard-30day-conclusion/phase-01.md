# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-497 post-release-dashboard 30 日連続実行 conclusion 集計と skill feedback 化 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義（真の論点 / 30 日 gate / 苦戦箇所） |
| 作成日 | 2026-05-06 |
| Wave | 3（issue-351 main merge 後 30 日経過後） |
| 実行種別 | sequential（外部時間依存・着手 gate は Phase 10 で判定） |
| 前 Phase | なし |
| 次 Phase | 2（設計 - 集計手順 / redaction / references 追記構造） |
| 状態 | spec_created |
| 実装区分 | **ドキュメントのみ（CONST_004 例外条件適用 / コード変更なし）** |
| タスク分類 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #497（CLOSED 維持・再 OPEN しない / PR 文面は `Refs #497, Refs #351`） |
| 親タスク | issue-351-09c-post-release-dashboard-automation |

---

## 目的

issue-351 で導入した `.github/workflows/post-release-dashboard.yml`（schedule UTC 00:00 日次）について、main merge 後 30 日経過した時点で `gh run list` の実測 conclusion 分布・failure 根本原因・連続 failure 区間を集計し、`.claude/skills/aiworkflow-requirements/references/deployment-gha.md` の post-release-dashboard 章に「30 日実測 feedback」として正本化することを目的とする。

Phase 1 は決定そのものを行わず、Phase 2 が「集計手順 / redaction 設計 / references 追記構造」を一意に絞り込める粒度で、論点・苦戦箇所・依存境界・AC を固定する Phase として閉じる。

具体的には次の 4 点を入力として整える:

1. 真の論点（true issue）を「Queue / cron / retry を入れるか否か」ではなく **「30 日連続 schedule run 安定性の客観 baseline 確定 + failure 比率 trigger による次アクション分岐」** に再定義する。
2. 外部時間依存（30 日蓄積待ち）を含む依存境界を明示する。
3. 苦戦箇所 3 件以上（30 日 gate 未到達 / failure log 機微情報混入 / GitHub Actions 90 日 retention 失効リスク）を言語化する。
4. AC-1〜AC-11 を `index.md` と完全一致で固定する。

---

## 真の論点 (true issue)

「Queue を入れる」「cron を分割する」「retry を追加する」のどれにするかは表層の選択肢であり、本タスクの本質ではない。本タスクの真の論点は次の 1 点に圧縮できる。

### 論点: 30 日連続 schedule run 安定性の客観 baseline 確定 + failure 比率 trigger による次アクション分岐

issue-351 のリリース直後は run 履歴が無く、schedule の安定性（成功率・失敗パターン・retry 必要性）と artifact 継続的妥当性は実測できなかった。本タスクの責務は **「30 日分の `gh run list` 集計結果を客観 evidence として skill references に正本化し、failure 比率に応じた次アクションを `< 10%` / `>= 10%` の 2 分岐で機械的に決定する」** ことにある。

したがって、本タスクは:

- **コード変更を伴わない**（read-only `gh run list` と markdown 追記のみで完結）。
- **alert / retry / 通知の実装は本タスク責務外**（必要時は別 unassigned task として `gh issue create` 起票する）。
- **GitHub Issue #497 は CLOSED のまま据え置き**（再 OPEN しない / PR 文面は `Refs #497, Refs #351`）。

---

## 実装区分の確定

`[実装区分: ドキュメントのみ]`

CONST_004 例外条件適用根拠:

- 成果物は `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` への 30 日実測 feedback 章追記、および `changelog/20260506-issue497-30day-feedback.md`への 1 行追加に完結する。
- ソース / テスト / 設定の変更は一切伴わない。
- `< 10%` / `>= 10%` の判断結果に応じて retry / alert 追加が必要になった場合は **別 unassigned task として `gh issue create` 起票** することが起票元仕様で固定されており、本タスクスコープ外。

CONST_005 必須項目の取り扱い:

- 「変更対象ファイル」「テスト方針」「ローカル実行コマンド」「DoD」は実装仕様書同等の粒度で記述し、後続実行者が迷わない粒度を確保する。
- 「関数シグネチャ」「型定義」「コードテスト」は **N/A（コード変更なし）** と明記する。

---

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | 対象は GitHub Actions schedule の `gh run list` 集計と markdown 追記。UI 変更なし |
| 成果物の物理形態 | Markdown 追記（references / changelog）+ raw JSON（outputs/phase-11/）+ 集計表 markdown | スクリーンショット不要 |
| 検証方法 | `gh run list` 出力 / `rg` redaction grep / markdown diff の人手レビュー | NON_VISUAL 縮約手順を Phase 11 で適用 |

`artifacts.json.metadata.visualEvidence` は `NON_VISUAL` で固定。

---

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | `issue-351-09c-post-release-dashboard-automation`（完了済 / main merge 済） | `.github/workflows/post-release-dashboard.yml`（schedule UTC 00:00）/ scripts/post-release-dashboard/ collector / artifact retention 90 日設定 | 30 日連続 schedule run の `gh run` 履歴 |
| 上流（外部） | GitHub Actions runner / API（`gh run list` / `gh run view`） | OAuth scope `actions:read` / API rate limit | conclusion / createdAt / databaseId / status / log-failed |
| 関連 | `aiworkflow-requirements`（`references/deployment-gha.md` / `changelog/20260506-issue497-30day-feedback.md` / `workflow-local close-out`） | post-release-dashboard 章の現行 markdown | 「30 日実測 feedback (since YYYY-MM-DD)」セクション 4 サブセクション + changelog 1 行 |
| 下流 | 運用（Phase 12 後・別 unassigned task） | failure 比率判定結果 | retry / alert 追加が必要な場合の `gh issue create` 起票 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Issue #497 body | 起票仕様（CLOSED 維持・参照のみ）。`gh issue view 497` で取得 |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/index.md` | 本タスク metadata / AC-1〜AC-11 / スコープ正本 |
| 必須 | `docs/30-workflows/unassigned-task/task-issue-351-post-release-dashboard-30day-conclusion-001.md` | 起票元仕様（U-1 / defer allowed） |
| 必須 | `.github/workflows/post-release-dashboard.yml` | 集計対象 workflow（schedule / artifact 設定） |
| 必須 | `scripts/post-release-dashboard/` | collector スクリプト群（artifact 構造の前提） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 30 日実測 feedback 追記先 |
| 必須 | `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` | changelog 1 行追加先 |
| 参考 | `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/unassigned-task-detection.md` | 検出根拠（U-1 defer allowed） |
| 参考 | `.claude/skills/task-specification-creator/references/phase-template-phase1.md` | Phase 1 テンプレ |

---

## 苦戦箇所【記入必須】

### 1. 外部時間依存（30 日蓄積待ち）で前倒し着手不可

- **対象**: GitHub Actions schedule run の蓄積期間
- **症状**: schedule run は UTC 00:00 daily 起動で、30 日分の連続 run が存在しなければ「連続期間カバー」AC-1 を満たせない。issue-351 main merge 直後に着手すると **仮 evidence しか作れず**、本タスクの目的（客観 baseline 確定）と矛盾する。
- **本タスクへの影響**: Phase 10 を **30 日 gate** とし、最古 run の `createdAt` が「着手日 - 30 日」以前であることを `gh run list --limit=80 --json createdAt --jq '[.[].createdAt] | min'` で確認するまで Phase 11 以降を実施しない。gate 不成立時は仕様書を `spec_created` のまま据え置き、30 日経過時点で再起動する。仮 evidence の生成は禁止。
- **参照**: 起票元仕様 `task-issue-351-post-release-dashboard-30day-conclusion-001.md` リスク表 / index.md「実行フロー」

### 2. failure log に token / bearer / Authorization 等の機微情報が含まれる可能性 → redaction grep 必須

- **対象**: `gh run view <id> --log-failed` の標準出力
- **症状**: failure 根本原因が token 失効 / 認証エラーの場合、log に Authorization ヘッダ値や bearer token、API secret が echo される可能性がある。これを無加工で `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` に転記すると、機微情報が public リポジトリ + skill コンテキストに混入する。
- **本タスクへの影響**: Phase 2 で redaction 設計を確定し、`rg -i -e "token" -e "bearer" -e "secret" -e "Authorization"` を **必須前処理** とする。マッチが 1 件でもあれば、当該 run の log 内容を skill references に書かず「（redacted: pattern matched）」のメタ情報のみ記録する方針を base case として固定する。AC-8 で redaction 実施を明示。
- **参照**: 起票元仕様 リスク表「failure 原因が token 失効で機微情報を含む」

### 3. GitHub Actions artifact retention が 90 日のため 30 日経過 ASAP 着手しないと取得漏れリスク

- **対象**: GitHub Actions artifact retention 設定（default 90 日）
- **症状**: 30 日経過後さらに 60 日以上放置すると、最古の artifact / run log が retention 失効で取得不能になる。本タスクは「30 日連続 run 履歴」を集計対象としているため、retention 失効後は AC-1（30 日連続期間カバー）を満たせない。
- **本タスクへの影響**: Phase 10 で 30 日 gate 成立を確認した直後（ASAP）に Phase 11 を実行する運用方針を Phase 5 runbook へ引き継ぐ。30 日 gate 成立から 30 日以内に Phase 11 / 12 を完了させ、retention 失効リスクを回避する。Phase 6（異常系）で「retention 失効済 run の存在」を扱う。
- **参照**: 起票元仕様 リスク表「GitHub Actions retention（90 日）超過」

---

## 価値とコスト

- **価値**: schedule の沈黙的失敗（cron 停止 / token 失効 / GraphQL schema drift / artifact retention 漏れ）の早期検知ベースラインを客観 evidence で確定。failure 比率 `< 10%` なら「現状維持」を正本化、`>= 10%` なら別 unassigned task として retry / alert 起票へ機械的に分岐できる状態を作る。
- **コスト**: read-only `gh run list` 集計 + skill references 1 章追記 + changelog 1 行のみ。コード変更ゼロ・migration ゼロ・production 副作用ゼロ。小〜中規模見積もり。
- **機会コスト**: 放置すると、09c が解消しようとした「比較不能・属人的な 24h 観測」へ逆戻りし、retention 失効後は再現も不可能になる。

---

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 30 日実測 baseline を skill references に正本化することで、schedule 沈黙的失敗の早期検知と次アクション機械分岐を確立する |
| 実現性 | PASS | `gh run list` / `gh run view --log-failed` / markdown 追記のみで実装可能。コード変更ゼロ。30 日 gate は最古 run createdAt で機械判定可能 |
| 整合性 | PASS | 不変条件 1〜7 すべて影響なし（コード変更なし / D1 アクセスなし / フォーム関連変更なし）。aiworkflow-requirements 同期で正本一貫性を維持 |
| 運用性 | PASS | 30 日 gate を `gh run list --json createdAt` で客観判定。redaction grep を必須前処理として固定。retention 失効リスクは Phase 6 で扱う |

---

## 受入条件（AC）

`index.md` AC-1〜AC-11 と完全一致。

- [ ] AC-1: `gh run list --workflow=post-release-dashboard.yml --limit=80` の取得対象が **30 日以上の連続期間**（最古 run の `createdAt` ≦ 着手日 - 30 日）をカバーしている
- [ ] AC-2: conclusion 分布表（success / failure / cancelled / startup_failure / timed_out / action_required の件数と比率）が `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` に追記されている
- [ ] AC-3: failure run の根本原因分類表（token 失効 / GraphQL 5xx / cron schedule drift / schema drift / artifact retention / その他）が同 references に追記されている
- [ ] AC-4: 連続 failure 区間の最大日数が記録されている（0 日でも明記）
- [ ] AC-5: failure 比率に応じた次アクション（`< 10%`: 現状維持 / `>= 10%`: retry/alert 追加を別 unassigned task 起票）が判断され、判断根拠と起票 issue 番号（起票時のみ）が記録されている
- [ ] AC-6: `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md`（または `workflow-local close-out`）に 30 日 feedback 反映行が追加されている
- [ ] AC-7: 取得した raw JSON が `outputs/phase-11/post-release-dashboard-30d.json` として保存され、後続再現性が担保されている
- [ ] AC-8: failure log redaction（`token` / `bearer` / `secret` / `Authorization` の grep）が実施され、機微情報が skill references に混入していない
- [ ] AC-9: GitHub Issue #497 は CLOSED のまま据え置き（再 OPEN しない / PR 文面は `Refs #497, Refs #351`）
- [ ] AC-10: 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き
- [ ] AC-11: Phase 12 で 7 必須成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）と aiworkflow-requirements skill 同期が完了

---

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1 | 実フォーム schema をコードに固定しすぎない | なし | コード変更なし |
| 2 | consent キー（`publicConsent` / `rulesConsent`）統一 | なし | コード変更なし |
| 3 | `responseEmail` は system field | なし | コード変更なし |
| 4 | Google Form schema 外は admin-managed data として分離 | なし | コード変更なし |
| 5 | D1 直接アクセスは `apps/api` 限定 | なし | D1 アクセスなし |
| 6 | GAS prototype は本番昇格しない | なし | GAS 非対象 |
| 7 | MVP では Google Form 再回答が本人更新の正式経路 | なし | フォーム関連変更なし |

---

## 変更対象ファイル

| パス | 変更種別 | 備考 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | markdown 追記 | post-release-dashboard 章配下に「30 日実測 feedback (since YYYY-MM-DD)」セクション |
| `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` | 1 行追記 | 30 日 feedback 反映行 |
| `outputs/phase-11/post-release-dashboard-30d.json` | 新規（成果物） | raw JSON（後続再現性担保） |
| `outputs/phase-11/conclusion-distribution.md` | 新規（成果物） | 集計表 markdown 草稿 |
| `outputs/phase-12/skill-references-diff.md` | 新規（成果物） | 追記差分記録 |

関数シグネチャ / 型定義 / コードテスト: **N/A（コード変更なし）**

---

## ローカル実行コマンド

```bash
# 30 日 gate 判定（最古 run の createdAt 確認）
gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json createdAt --jq '[.[].createdAt] | min'

# 30 日連続 run の取得
gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json conclusion,createdAt,databaseId,status \
  > outputs/phase-11/post-release-dashboard-30d.json

# conclusion 分布の集計
jq 'group_by(.conclusion) | map({conclusion: .[0].conclusion, count: length})' \
  outputs/phase-11/post-release-dashboard-30d.json

# failure log redaction grep（機微情報混入チェック）
gh run view <FAILED_RUN_ID> --log-failed | \
  rg -i -e "token" -e "bearer" -e "secret" -e "Authorization"
```

---

## DoD（Definition of Done / Phase 1）

- [ ] 真の論点が「30 日連続 schedule run 安定性の客観 baseline 確定 + failure 比率 trigger による次アクション分岐」に再定義されている
- [ ] 苦戦箇所 3 件（30 日 gate 未到達 / 機微情報 redaction / 90 日 retention 失効リスク）が言語化されている
- [ ] 依存境界（上流 2 / 関連 1 / 下流 1）が記述されている
- [ ] AC-1〜AC-11 が `index.md` と完全一致
- [ ] 4 条件評価が全 PASS で根拠付き
- [ ] 不変条件 1〜7 への影響が「すべてなし」と確定
- [ ] Issue #497 を再 OPEN しない方針が明示されている
- [ ] `artifacts.json.phases[0].status` が `spec_created`、`metadata.visualEvidence` が `NON_VISUAL`

---

## 次 Phase への引き渡し

- 次 Phase: 2（設計 - 集計手順 / redaction / references 追記構造）
- 引き継ぎ事項:
  - 真の論点 = 30 日連続安定性の客観 baseline + failure 比率 2 分岐
  - 苦戦箇所 3 件（30 日 gate / redaction 必須 / 90 日 retention）
  - AC-1〜AC-11（index.md と完全一致）
  - ドキュメントのみ仕様書（CONST_004 例外条件適用 / コード変更なし）
- ブロック条件:
  - 4 条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-11 が `index.md` と乖離
  - visualEvidence が NON_VISUAL 以外で誤確定
  - Issue #497 が再 OPEN されている

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| Phase spec | 本ファイル | 本 Phase の実行可能仕様 |
| outputs | `outputs/phase-XX/` | 実行時に生成する Phase evidence / summary |

## 完了条件

- [ ] 本 Phase の目的、実行タスク、成果物、次 Phase への引き渡しが矛盾なく記録されている
- [ ] docs-only / NON_VISUAL / Issue #497 CLOSED 維持の境界が崩れていない
- [ ] 必要な参照資料と evidence path が実在パスで記録されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として `gh run list` raw JSON の `jq empty`、redaction grep、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
