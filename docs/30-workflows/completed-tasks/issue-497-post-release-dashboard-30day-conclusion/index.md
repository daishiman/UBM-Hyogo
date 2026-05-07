# issue-497-post-release-dashboard-30day-conclusion - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | post-release-dashboard 30 日連続実行 conclusion 集計と skill feedback 化 |
| GitHub Issue | #497（CLOSED 維持 / 再 OPEN しない / PR 文面は `Refs #497, Refs #351`） |
| 親タスク | issue-351-09c-post-release-dashboard-automation |
| 起票元仕様 | `docs/30-workflows/unassigned-task/task-issue-351-post-release-dashboard-30day-conclusion-001.md` |
| 検出仕様書 | `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/unassigned-task-detection.md`（U-1 / defer allowed） |
| 作成日 | 2026-05-06 |
| ステータス | spec_created（外部時間依存 / 30 日経過後に着手 / defer allowed） |
| 総 Phase 数 | 13 |
| taskType | docs-only（実態優先：成果物は skill references markdown 追記と changelog 1 行のみ。コード変更を伴わない） |
| visualEvidence | NON_VISUAL |
| Wave | 3（issue-351 main merge 後 30 日経過後） |
| 優先度 | MEDIUM |
| 見積もり規模 | 小〜中規模（read-only `gh run list` 集計 + skill references 1 章追記 + changelog 1 行） |

---

## 実装区分

`[実装区分: ドキュメントのみ]`

判定根拠（CONST_004 例外条件適用）:

- 本タスクの成果物は **`gh run list` の read-only 集計結果を skill references markdown へ追記し、skill changelog に 1 行追加する** ことに完結する。
- 達成条件 5 件（issue body と起票元仕様）はすべて markdown 追記・分類・判断記録で達成可能であり、コード変更（ソース / テスト / 設定）を一切伴わない。
- failure 比率 `>= 10%` で retry / alert 追加が必要となった場合は、本仕様書スコープ外として **別 unassigned task を起票** することが起票元仕様の方針として固定されている（issue body「スコープ外」節に明記）。
- したがって、ユーザー指示「デフォルトは実装仕様書」「実態優先」を踏まえても、本タスクは目的達成にコード変更が**不要**であるため、ドキュメントのみ仕様書として作成する。
- 後続実行者は本仕様書に従って `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` と `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md`を編集するのみで完了する。
- **Scope Extension（親 #351 同サイクル hardening）**: close-out review 中に親契約欠落（`redaction-check.md` artifact 未出力 / `pnpm post-release-dashboard:test` が CI 未組込）が検出されたため、`scripts/post-release-dashboard/lib/redaction-check.sh` / `scripts/post-release-dashboard/__tests__/redaction-check.test.sh` / `.github/workflows/ci.yml` の最小 hardening を同サイクルで実施する。本拡張は L-497-003（`lessons-learned-issue-497-post-release-dashboard-30day-conclusion-2026-05.md`）の正規経路に従う。

CONST_005 必須項目の取り扱い:

- 「変更対象ファイル」「テスト方針」「ローカル実行コマンド」「DoD」は本仕様書内で実装仕様書同等の粒度で記述する（後続実行者が迷わない粒度を確保）。
- ただし「関数シグネチャ」「型定義」「コードテスト」は本タスクの責務外のため空欄ではなく **N/A（コード変更なし）** と明記する。

---

## 目的

issue-351 で導入した `.github/workflows/post-release-dashboard.yml`（schedule UTC 00:00 日次）の 30 日連続 run の conclusion / failure パターンを実測値で集計し、`.claude/skills/aiworkflow-requirements/references/deployment-gha.md` の post-release-dashboard 章に「30 日実測 feedback」として正本化する。

issue-351 のリリース直後は run 履歴が無く、schedule の安定性（成功率・失敗パターン・retry 必要性）と artifact 継続的妥当性は実測できなかった。本タスクは時間依存 follow-up として、schedule 沈黙的失敗（cron 停止 / token 失効 / GraphQL schema drift / artifact retention 漏れ）の早期検知ベースラインを確定する。

---

## スコープ

### 含む

- `gh run list --workflow=post-release-dashboard.yml --limit=80` による 30 日以上連続期間の **schedule run** 取得（read-only / `event=="schedule"`）
- conclusion 分布（success / failure / cancelled / startup_failure / timed_out / action_required）の集計
- artifact 存在 / downloadability / retention と run 所要時間（`createdAt`〜`updatedAt`）の集計
- failure run の `gh run view <id> --log-failed` による根本原因分類（token 失効 / GraphQL 5xx / cron schedule drift / schema drift / その他）
- 連続 failure 区間（最長連続失敗日数）の算出
- 集計結果を `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` の post-release-dashboard 章へ「30 日実測 feedback」として追記
- failure 比率に応じた次アクション判断（`< 10%`: 現状維持 / `>= 10%`: retry または alert 追加を別 unassigned task で起票）
- `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` への 30 日 feedback 反映行追加
- aiworkflow-requirements skill indexes（必要時のみ）の再生成
- Scope Extension: 親 Issue #351 hardening（`scripts/post-release-dashboard/lib/redaction-check.sh` の `redaction-check.md` artifact 出力 / 同 `__tests__/redaction-check.test.sh` の検証 / `.github/workflows/ci.yml` の `pnpm post-release-dashboard:test` 組込み）— close-out review で検出された親契約欠落の同サイクル補修

### 含まない

- alert / retry / 通知の **実装**（必要時は別 unassigned task として起票し、本タスクではトリガーのみ）
- production deploy / Cloudflare 設定変更
- `.github/workflows/post-release-dashboard.yml` の編集（workflow file 自体の修正は判断結果として別タスク化）
- artifact 内 metrics 値（Cloudflare metrics / D1 reads/writes）の傾向分析（schedule **安定性**に観点を絞る）
- 30 日経過前の前倒し実行（時間依存 gate 不成立で実施不可）
- GitHub Issue #497 の再 OPEN（CLOSED 維持）

---

## 受入条件（AC）

- AC-1: `gh run list --workflow=post-release-dashboard.yml --limit=80` の取得対象が **30 日以上の連続 schedule run 期間**（`event=="schedule"`、最古 run の `createdAt` ≦ 着手日 - 30 日、日次 gap 0）をカバーしている
- AC-2: conclusion 分布表（成功 / 失敗 / cancelled / startup_failure / timed_out / action_required の件数と比率）が `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` に追記されている
- AC-3: failure run の根本原因分類表（token 失効 / GraphQL 5xx / cron schedule drift / schema drift / artifact retention / その他）が同 references に追記されている
- AC-4: 連続 failure 区間の最大日数が記録されている（0 日でも明記）
- AC-5: artifact downloadability / retention と run 所要時間分布が記録され、failure 比率に応じた次アクション（`< 10%`: 現状維持 / `>= 10%`: retry/alert 追加を別 unassigned task 起票）が判断されている
- AC-6: `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md`（または同等 changelog）に 30 日 feedback 反映行が追加されている
- AC-7: 取得した raw JSON が `outputs/phase-11/post-release-dashboard-30d.json` として保存され、後続再現性が担保されている
- AC-8: failure log redaction（`token` / `bearer` / `secret` / `Authorization` の grep）が実施され、機微情報が skill references に混入していない
- AC-9: GitHub Issue #497 は CLOSED のまま据え置き（再 OPEN しない / PR 文面は `Refs #497`）
- AC-10: 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き
- AC-11: Phase 12 で 7 必須成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）と aiworkflow-requirements skill 同期が完了

---

## Phase 一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義（真の論点 / 30 日 gate / 苦戦箇所） | [phase-01.md](phase-01.md) | spec_created |
| 2 | 設計（集計手順 / redaction / references 追記構造） | [phase-02.md](phase-02.md) | spec_created |
| 3 | 設計レビューゲート | [phase-03.md](phase-03.md) | spec_created |
| 4 | 検証戦略（NON_VISUAL / read-only） | [phase-04.md](phase-04.md) | spec_created |
| 5 | 仕様 runbook 作成（gh コマンド sequence / jq 集計） | [phase-05.md](phase-05.md) | spec_created |
| 6 | 異常系（30 日未達 / retention 失効 / 機微情報混入） | [phase-06.md](phase-06.md) | spec_created |
| 7 | AC マトリクス | [phase-07.md](phase-07.md) | spec_created |
| 8 | DRY 化 / 仕様間整合 | [phase-08.md](phase-08.md) | spec_created |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | spec_created |
| 10 | 最終レビューゲート（30 日 gate 含む） | [phase-10.md](phase-10.md) | spec_created |
| 11 | 手動検証（NON_VISUAL 縮約 / 30 日 gh run 集計実行） | [phase-11.md](phase-11.md) | spec_created |
| 12 | ドキュメント更新（skill references / changelog） | [phase-12.md](phase-12.md) | spec_created |
| 13 | PR 作成 | [phase-13.md](phase-13.md) | spec_created |

---

## 実行フロー

```
Phase 1 → Phase 2 → Phase 3 (Gate) → Phase 4 → Phase 5 → Phase 6 → Phase 7
                         ↓                                      ↓
                    (MAJOR→戻り)                           (未達→戻り)
                         ↓                                      ↓
Phase 8 → Phase 9 → Phase 10 (Gate / 30日 gate) → Phase 11 → Phase 12 → Phase 13 → 完了
                                          ↓
                                  (30日未達→spec据え置き)
```

Phase 10 で「最古 run の `createdAt` が着手日 - 30 日以前か」の **30 日 gate** を判定する。gate 不成立の場合、Phase 11 以降は実施せず仕様書を spec_created のまま据え置き、30 日経過時点で再起動する。

---

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1 | 実フォーム schema をコードに固定しすぎない | なし | コード変更なし |
| 2 | consent キーは `publicConsent` / `rulesConsent` 統一 | なし | コード変更なし |
| 3 | `responseEmail` は system field | なし | コード変更なし |
| 4 | Google Form schema 外は admin-managed data として分離 | なし | コード変更なし |
| 5 | D1 直接アクセスは `apps/api` 限定 | なし | D1 アクセスなし |
| 6 | GAS prototype は本番昇格しない | なし | GAS 非対象 |
| 7 | MVP では Google Form 再回答が本人更新の正式経路 | なし | フォーム関連変更なし |

---

## 参照情報

- 起票元仕様: `docs/30-workflows/unassigned-task/task-issue-351-post-release-dashboard-30day-conclusion-001.md`
- 親タスク Phase 12 検出: `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/unassigned-task-detection.md`
- 対象 workflow: `.github/workflows/post-release-dashboard.yml`
- 関連 collector: `scripts/post-release-dashboard/`
- 追記先 references: `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- changelog: `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md`
