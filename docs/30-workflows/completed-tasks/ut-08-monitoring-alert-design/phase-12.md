# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 名称 | ドキュメント更新 |
| タスク | UT-08 モニタリング/アラート設計 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 状態 | completed |
| GitHub Issue | #10（CLOSED） |
| タスク種別 | design / non_visual / spec_created |

---

## 目的

UT-08 で完成した監視設計の正本を、システム仕様書群および将来の Wave 2 実装担当者へ引き継ぐ。
本タスクは `spec_created` 設計タスクであるため、SKILL.md「`spec_created` UI task の Phase 12 close-out ルール」に従い、
Step 1-A〜1-C を **N/A 扱いにせず same-wave sync で閉じる**。
新規インターフェース追加はないが、閾値・Secret 名・監視設定候補を新規定数 / 設定値として扱い、Step 2 は design-local domain sync として実施する。

本 Phase は 6 種の必須成果物を全て出力し、Phase 13（PR 作成）への引き継ぎを完了させる。

---

## なぜドキュメント更新が必要か（中学生レベル）

監視設計を作っただけでは、3 ヶ月後の自分や別の担当者が「どの閾値を使うんだっけ？」「Slack Webhook の Secret 名なに？」
と毎回読み返す必要が出てくる。
Phase 12 では「**取扱説明書を整える作業**」を行う。

家のセキュリティアラームに例えると：
- **Phase 1〜10**：「どこにセンサーを置く」「どの音量で鳴らす」を決める設計工程（=これまでに完了済み）
- **Phase 11**：センサー配置図に書いた住所が現実の家の住所と一致しているかを確認する点検（=ドキュメント整合性チェック）
- **Phase 12**：「家を留守にするときはこのスイッチを ON」「誤報が鳴ったらこの番号に電話」のような**運用マニュアル**を、家族全員が見える場所（玄関の壁＝システム仕様書）に貼り出す工程

この工程をスキップすると、設計者が転勤した瞬間にアラームが「なぜ鳴っているのか分からない箱」になってしまう。

---

## 実行タスク

1. implementation-guide.md を Part 1 / Part 2 の 2 部構成で作成する
2. system-spec-update-summary.md に Step 1-A / 1-B / 1-C / Step 2 design-local domain sync を記録する
3. documentation-changelog.md に workflow-local sync と global skill sync を分離して記録する
4. unassigned-task-detection.md を 0 件の場合も作成する
5. skill-feedback-report.md を改善点なしの場合も作成する
6. phase12-task-spec-compliance-check.md で Task 1〜5 の完了を確認する

| Task | 名称 | 必須 | 出力先 |
| ---- | --- | ---- | --- |
| Task 1 | 実装ガイド作成（Part 1 / Part 2） | ✅ | outputs/phase-12/implementation-guide.md |
| Task 2 | システム仕様更新（Step 1-A / 1-B / 1-C / Step 2 判定） | ✅ | outputs/phase-12/system-spec-update-summary.md |
| Task 3 | ドキュメント変更履歴作成 | ✅ | outputs/phase-12/documentation-changelog.md |
| Task 4 | 未タスク検出（0 件でも出力必須） | ✅ | outputs/phase-12/unassigned-task-detection.md |
| Task 5 | スキルフィードバックレポート（改善点なしでも出力必須） | ✅ | outputs/phase-12/skill-feedback-report.md |
| Task 6 | Phase 12 準拠確認 | ✅ | outputs/phase-12/phase12-task-spec-compliance-check.md |

---

## Task 1: 実装ガイド作成（implementation-guide.md）

`outputs/phase-12/implementation-guide.md` を **Part 1 / Part 2 の 2 部構成**で作成する。

### Part 1 — 中学生レベル概念説明（必須要件）

- 日常の例え話を必ず含める
- 専門用語は使わない（出てきた瞬間に説明する）
- 「なぜ必要か」→「何をするか」の順で説明する

#### 例え話の設計指針：「家のセキュリティアラーム」

| 監視概念 | 家のアラームの例え |
| --- | --- |
| メトリクス収集 | 各部屋に設置したセンサー（人感・煙・窓の開閉） |
| 閾値（WARNING / CRITICAL） | 「煙センサーが少し反応＝WARNING / 大きく反応＝CRITICAL」のような段階別感度設定 |
| Cloudflare Workers Analytics Engine（WAE） | センサー検知を全部記録する「監視日誌」 |
| 通知（Slack Webhook / メール） | アラームが鳴ったときに家主のスマホへ電話する仕組み |
| 外部監視（UptimeRobot） | 警備会社の人が定期巡回して家のドアが閉まっているか確認すること |
| アラート疲れ抑止（WARNING 中心の段階運用） | 警報を鳴らしすぎると家主が無視するようになるので、最初は控えめに、慣れてから本格運用する |
| 1Password Environments で Secret 管理 | 鍵を金庫にしまい、家中に貼らない |
| 05a runbook 差分追記 | 家の取扱説明書（既存）を上書きせず、巻末に「2026 年改修分」のページを追加する |

#### Part 1 の必須セクション

1. なぜ監視・アラートが必要か（家を留守にする間の不安）
2. システム全体の見取り図（Workers / Pages / D1 = 部屋、Sheets→D1 同期 = 配管）
3. WARNING / CRITICAL の二段階の意味
4. アラート疲れとは何か、なぜ最初は控えめに運用するか
5. 通知が来たら何をするか（runbook を読む = 取扱説明書を開く）
6. 監視ツールが「無料プラン」に限定されている理由（家計を圧迫しない）

### Part 2 — 技術者レベル詳細

#### Part 2 の必須セクション

1. **メトリクス一覧**：`outputs/phase-02/metric-catalog.md` の SSOT を引用形式で参照
2. **WAE 計装ポイント**：データセット名・イベント名・フィールド・サンプリングレート
3. **閾値マトリクス**：WARNING / CRITICAL の値と根拠（無料枠 / SLA / アラート疲れ抑止）
4. **通知 API 設計**：
   - Slack Incoming Webhook の payload 構造
   - メール通知のフォーマット（件名規則・本文テンプレ）
   - Secret 名一覧と 1Password 取り込み手順
5. **失敗検知ルール**：D1 クエリ失敗・Sheets→D1 同期失敗の判定条件
6. **外部監視**：UptimeRobot 無料プランの 5 分間隔制約・SLA 整合
7. **05a runbook 差分**：observability-matrix.md / cost-guardrail-runbook.md への追記ブロック雛形
8. **Wave 2 実装着手チェックリスト**：
   - 必要 Secret の 1Password 登録完了
   - WAE バインディングの `wrangler.toml` 追記項目
   - 計装コードを書くファイル候補（`apps/api/src/middleware/` 等）

#### Part 2 のスニペット引用ルール

- スニペットは設計成果物（`outputs/phase-02/*.md`）から**引用**する
- 手書きスニペットを書かない（identifier drift 防止：SKILL.md「Feedback W1-02b-3」遵守）
- メトリクス名・データセット名は `metric-catalog.md` / `wae-instrumentation-plan.md` の SSOT を参照

---

## Task 2: システム仕様更新（system-spec-update-summary.md）

`outputs/phase-12/system-spec-update-summary.md` に Step 1-A 〜 Step 2 の判定結果を記録する。

### Step 1-A：完了タスク記録（必須）

| 更新対象 | 更新内容 |
| --- | --- |
| `docs/30-workflows/ut-08-monitoring-alert-design/index.md` | 状態を `spec_created` で確定（既に記載済みなら同期確認） |
| `.claude/skills/task-specification-creator/LOGS.md` | UT-08 完了行を追記（同タスクが Phase 12 まで到達した記録） |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | 監視設計タスクの完了記録を追記 |
| index 導線（task-specification-creator `references/resource-map.md` / aiworkflow-requirements `indexes/topic-map.md`） | 「monitoring」「alert」「observability」のキーワードに UT-08 を追加 |

### Step 1-B：実装状況テーブル更新（必須）

UT-08 は `spec_created`（仕様書作成のみ完了）であり、`completed` ではない。
実装状況テーブルが存在するファイル（task-workflow / unassigned-task index 等）で、
UT-08 のステータスを **`spec_created`** として記録する。

### Step 1-C：関連タスクテーブル更新（必須）

| 関連タスク | 更新内容 |
| --- | --- |
| UT-09（Sheets→D1 同期ジョブ実装） | 「監視・アラート設計の入力先として UT-08 spec_created」を備考に追記 |
| UT-07（通知基盤） | 「アラート通知チャネルとして利用可能（任意）」を備考に追記 |
| 05a parallel observability | 「自動監視追加分は UT-08 phase-02 へ差分追記計画あり」を備考に追記 |

### Step 2：システム仕様更新（条件付き）

| 判定 | 結論 |
| --- | --- |
| 新規インターフェース追加 | **なし**（設計のみ。WAE 計装コード・通知 API 実装は Wave 2 へ委譲） |
| 既存インターフェース変更 | なし |
| 新規定数 / 設定値 | あり（閾値・Secret 名）だが**設計成果物内 SSOT に閉じ、global skill spec への昇格はしない** |
| 結論 | **Step 2 は実施**（design-local domain sync として、閾値・Secret 名・監視設定候補をシステム仕様更新サマリーに登録する） |
| 再判定条件 | Wave 2 実装タスク開始時に、実コード・API・定数ファイルへ昇格するかを再判定する |

---

## Task 3: ドキュメント変更履歴（documentation-changelog.md）

`outputs/phase-12/documentation-changelog.md` に以下を**workflow-local 同期**と**global skill sync**の 2 ブロックに分けて記録する（SKILL.md「Feedback BEFORE-QUIT-003」遵守）。

```markdown
# ドキュメント変更履歴 — UT-08 Phase 12（YYYY-MM-DD）

## workflow-local 同期（docs/30-workflows/ut-08-monitoring-alert-design 配下）

### 新規作成
- docs/30-workflows/ut-08-monitoring-alert-design/index.md
- docs/30-workflows/ut-08-monitoring-alert-design/artifacts.json
- docs/30-workflows/ut-08-monitoring-alert-design/phase-01.md 〜 phase-13.md
- outputs/phase-01〜phase-11 の各成果物
- outputs/phase-12/ 配下 6 種

### 更新
- なし（新規ワークフロー）

## global skill sync（.claude/skills 配下）

### Step 1-A 同期
- .claude/skills/task-specification-creator/LOGS.md（UT-08 完了行追記）
- .claude/skills/aiworkflow-requirements/LOGS.md（監視設計完了記録）
- .claude/skills/aiworkflow-requirements/indexes/topic-map.md（monitoring 関連エントリ追加）
- .claude/skills/task-specification-creator/references/resource-map.md（同上）

### Step 2 同期
- design-local domain sync として `system-spec-update-summary.md` に閾値・Secret 名・監視設定候補の SSOT を記録
- 新規 IF 実装やコード定数化は Wave 2 実装タスクで再判定

### mirror parity（.agents/skills 同期）
- .claude/skills と .agents/skills の差分を Phase 9 で確認済み。差分があれば本 Phase で rsync で同期する。
```

---

## Task 4: 未タスク検出（unassigned-task-detection.md）

`outputs/phase-12/unassigned-task-detection.md` に **0 件でも必ず出力**する（SKILL.md 必須要件）。
Phase 10 の MINOR 指摘・Phase 11 の発見事項・Phase 2 のスコープ外項目を漏れなく記録する。

```markdown
# 未タスク検出レポート — UT-08

## 検出日: YYYY-MM-DD

## current（本タスク Phase 内で発生したもの）

| # | 内容 | 優先度 | 推奨アサイン先 | 発見 Phase | formalize 状態 |
| --- | --- | --- | --- | --- | --- |
| 1 | （例）WAE データ保持期間 公式保持期間超のデータ長期保管設計が未策定 | LOW | 新規 UT を起票 | Phase 2 | 未起票 / 起票済み |

## baseline（既存課題から再確認したもの）

| # | 内容 | 元タスク | 現状 |
| --- | --- | --- | --- |
| 1 | UT-07（通知基盤）との接続設計 | UT-08 スコープ外 | UT-07 着手時に再評価 |

## 0 件の場合の記録例

「Phase 1〜11 のレビュー記録を全件再確認した結果、UT-08 タスクのスコープ外として明示する未タスクは 0 件であった。」と必ず記載する。

## Phase 10 MINOR 指摘の取扱い

| MINOR 指摘 | 未タスク化判定 | 理由 |
| --- | --- | --- |
| （Phase 10 で挙がった項目） | 未タスク化 / 不要 | （根拠） |

> 「機能に影響なし」は不要判定の理由にならない（SKILL.md 遵守）。
```

---

## Task 5: スキルフィードバックレポート（skill-feedback-report.md）

`outputs/phase-12/skill-feedback-report.md` に**改善点なしでも必ず出力**する。

```markdown
# task-specification-creator スキルフィードバック — UT-08

## 対象タスク
UT-08 モニタリング/アラート設計（spec_created / non_visual）

## テンプレート改善
（Phase テンプレートの漏れや未確定箇所。なければ「該当なし」と明記）

## ワークフロー改善
（機械検証・手順分岐の改善余地）

## ドキュメント改善
（横断ガイドライン化の候補）

## NON_VISUAL Phase 11 の改善観点
- 設計タスクで Phase 11 の自動チェック対象が SKILL.md UBM-002 / UBM-003 通り運用できたか
- screenshot 不要判定で `screenshots/.gitkeep` を残してしまうケースがなかったか
```

---

## Task 6: Phase 12 準拠確認（phase12-task-spec-compliance-check.md）

`outputs/phase-12/phase12-task-spec-compliance-check.md` を root evidence として残す。

```markdown
# Phase 12 同期ルール遵守確認 — UT-08

## same-wave sync（UT-08 と並走している関連タスク）

| 関連タスク | 確認観点 | 整合状態 |
| --- | --- | --- |
| UT-09 | sheets→D1 同期失敗検知ルールが UT-09 失敗モードと整合 | PASS / FAIL / 要確認 |
| UT-07 | アラート通知チャネルが UT-07 通知基盤と矛盾しない | PASS / FAIL / 要確認 |
| 05a parallel observability | 既存 runbook を上書きせず差分追記方針が確立 | PASS / FAIL / 要確認 |

## Phase 12 同期ルール遵守確認

- [ ] spec-update-workflow.md の手順通りに実施した
- [ ] LOGS.md（aiworkflow-requirements / task-specification-creator）両方を更新した
- [ ] topic-map.md（両方）を更新した
- [ ] same-wave sync を全関連タスクに対して実施した
- [ ] 未タスク検出レポートを 0 件でも出力した
- [ ] スキルフィードバックレポートを改善点なしでも出力した
- [ ] artifacts.json と outputs ディレクトリ実体の 1 対 1 整合を確認した
- [ ] Step 1-A / 1-B / 1-C を `spec_created` ルールで実施した
- [ ] Step 2 design-local domain sync の結果と Wave 2 再判定条件を明記した

## 確認日: YYYY-MM-DD
```

---

## 多角的チェック観点（AI が判断）

- **価値性**：Wave 2 実装担当者が `implementation-guide.md` のみで監視計装に着手できる十分性があるか
- **実現性**：Step 1-A〜1-C の更新が既存 LOGS.md / topic-map.md と矛盾なく追記できるか
- **整合性**：same-wave sync で UT-09・UT-07・05a との矛盾が検出されないか
- **運用性**：将来 Service Account / Webhook ローテーション時に implementation-guide.md が手順書として機能するか

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | implementation-guide.md（Part 1 / 2）作成 | 12 | pending |
| 2 | system-spec-update-summary.md 作成（Step 1-A / 1-B / 1-C / Step 2 判定） | 12 | pending |
| 3 | LOGS.md（2 ファイル）追記 | 12 | pending |
| 4 | topic-map.md（2 ファイル）更新 | 12 | pending |
| 5 | documentation-changelog.md（workflow-local + global sync 2 ブロック）作成 | 12 | pending |
| 6 | unassigned-task-detection.md（0 件でも）作成 | 12 | pending |
| 7 | skill-feedback-report.md（改善点なしでも）作成 | 12 | pending |
| 8 | phase12-task-spec-compliance-check.md 作成 | 12 | pending |
| 9 | mirror parity（.claude ↔ .agents）確認 | 12 | pending |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 重要仕様・`spec_created` close-out ルール |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 手順正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | implementation-guide フォーマット |
| 必須 | .claude/skills/task-specification-creator/references/unassigned-task-guidelines.md | 未タスク化ルール |
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/index.md | 本タスク全体概要 |
| 参考 | docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/ | 設計成果物 SSOT |
| 参考 | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/ | 既存 runbook（差分追記対象） |

---

## 成果物（artifacts.json phase-12 と完全一致）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド（Part 1 / Part 2） |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | システム仕様更新サマリー（Step 1-A〜Step 2 判定） |
| ドキュメント | outputs/phase-12/documentation-changelog.md | ドキュメント変更履歴（workflow-local + global sync） |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク検出（current / baseline 分離） |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | スキルフィードバック |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 準拠確認 |
| 更新 | .claude/skills/task-specification-creator/LOGS.md | UT-08 完了記録追記 |
| 更新 | .claude/skills/aiworkflow-requirements/LOGS.md | 監視設計完了記録追記 |
| 更新 | .claude/skills/task-specification-creator/references/resource-map.md | monitoring 関連エントリ追加 |
| 更新 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | 同上 |
| メタ | artifacts.json | phase-12 を completed に更新 |

---

## 完了条件

- [ ] 6 種の必須成果物が全て `outputs/phase-12/` に配置されている
- [ ] implementation-guide.md が **Part 1（中学生レベル）** と **Part 2（技術者レベル）** の 2 部構成である
- [ ] system-spec-update-summary.md に Step 1-A / 1-B / 1-C の更新結果と Step 2 design-local domain sync の結果が明記されている
- [ ] LOGS.md（2 ファイル）と topic-map.md（2 ファイル）が更新されている（4 ファイル更新ルール遵守）
- [ ] documentation-changelog.md に workflow-local と global sync が**別ブロック**で記録されている
- [ ] unassigned-task-detection.md が 0 件でも出力されている（current / baseline 分離）
- [ ] skill-feedback-report.md が改善点なしでも出力されている
- [ ] phase12-task-spec-compliance-check.md の全チェックボックスが確認済みである
- [ ] artifacts.json と `outputs/phase-12/` 実体が 1 対 1 で整合している
- [ ] mirror parity（`.claude/skills` ↔ `.agents/skills`）が確認されている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物（6 種 + 4 ファイル更新）が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-12 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次 Phase: 13（PR 作成）
- 引き継ぎ: `documentation-changelog.md` の変更ファイル一覧を Phase 13 の PR change-summary として使用する
- ブロック条件: 6 種の必須成果物が未作成 / same-wave sync で重大矛盾検出 / mirror parity 差分未解消の場合は Phase 13 に進まない
- ユーザー承認ゲート: Phase 13 はユーザーの明示的承認後にのみ実行する
