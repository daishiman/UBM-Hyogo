# Phase 12: 正本同期 (中学生レベル概念説明 + 7 必須 output)

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 12 / 13 |
| 前 Phase | 11 (NON_VISUAL evidence) |
| 次 Phase | 13 (PR・振り返り) |
| 状態 | spec_created |

## 中学生レベル概念説明

### このタスクが解決する問題はなに？

GitHub Actions（自動でいろんな処理を順番にやってくれる仕組み）の中に、「1 時間に 1 回、Cloudflare の監視ログを取りに行く」という仕事が組まれています。これが 10 時間連続で**失敗**していました。

理由はかんたんで、「Cloudflare にアクセスするための鍵（secret）」が、本来あるべき場所（GitHub repository の secret 置き場）に**入っていなかった**からです。鍵を入れずにドアを開けようとしているので、当然ドアは開きません。

### なぜ「入っていなかった」のか？

以前、別のタスク（Issue #720）で「鍵を repository の置き場に入れ替える計画」を立てました。でも、計画書はできたものの、**実際に鍵を入れる作業（user 承認が必要）が止まっていた**んです。鍵置き場には鍵がない状態で、ドアを 1 時間に 1 回叩き続けて、10 回連続で失敗していた、というのが実態です。

### Issue #772 は何のために作られた？

Issue #720 を片付けたあと、「不要になった古い鍵を捨てる片付けタスク」として #772 が作られました。ところが、調べてみると **そもそも古い鍵は最初から残っていなかった**（あるいは別経路で消えていた）。つまり「片付ける対象がない」状態でした。

### このタスクで実際にやること

3 つあります:

1. **本来やるべきだった鍵入れ作業を完了させる**: 4 つの secret を repository の置き場に入れる（user が承認したうえで実行）
2. **6 時間ぶんの自動実行を見守って、ちゃんと動くことを確認する**: 連続 6 回成功すれば「治った」と認められます
3. **「片付ける対象は最初からなかった」ことを記録する**: Issue #772 の本来のスコープは「no-op（やることなし）で完了」と正式に宣言する

### なぜ Issue は CLOSED のまま？

GitHub Issue を再オープンすると workflow の状態管理がぐちゃぐちゃになります（過去の Issue #720 でも同じ問題があった）。なので Issue は閉じたまま、コードベース側のドキュメント（unassigned-task のステータス）を `consumed_via_issue_772_runtime_restoration_spec`（このタスク仕様書で消化済み）に更新します。

### このタスクで何が変わる？

- 1 時間に 1 回の Cloudflare 監視ログ収集が**ちゃんと動くようになる**
- そのログを使う `cf-audit-log-7day-summary.yml`（7 日分まとめる仕組み）が**正しく動く前提条件が回復**
- 「監視系の鍵は repository に、本番デプロイ系の鍵は production environment に」というルール（ADR）が**改めて成文化される**

### このタスクで何が変わらない？

- 本番環境の保護ルール（branch policy など）は触らない
- Cloudflare 側の D1 / Workers AI などの設定値は変えない
- secret の中身（実値）は変えない（rotate しない）

## 7 必須 output（task-specification-creator skill 規定）

各 output は `outputs/phase-12/` 配下に配置する。

### main.md

タスク全体の summary。本 phase-12.md の中学生レベル概念説明と AC 達成状況の要約。

### implementation-guide.md

後続実行者向けの実装指示書。Phase 06 T-01〜T-09 の運用フローを 1 ファイルに集約。Phase 13 の `diff-to-pr` 用の参照源としても機能。

### system-spec-update-summary.md

本タスクで更新される正本仕様の差分要約:

- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` 末尾 ADR 追記（Issue #772 cleanup no-op confirmation + monitor read-only token boundary reaffirmation）
- runbook の environment-separation ADR が最新ステータスを反映する

### documentation-changelog.md

本サイクルで発生したドキュメント差分の一覧:

- `docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup/` 全 phase + outputs 配置
- `docs/30-workflows/unassigned-task/followup-issue-720-001-prod-env-monitor-secret-cleanup.md` fold-state sync
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` ADR 末尾追記

### unassigned-task-detection.md

本タスク完了後に**新規発生**した未割当タスクの検出と記録:

- 候補 1: `cf-audit-log-7day-summary.yml` の 168h 集約が `cf-audit-log-monitor.yml` 復旧後にも fail する場合、別 followup として記録
- 候補 2: variables 値が production env 既設値踏襲で問題発生した場合、value rotation followup を記録
- 候補 3: 6 連続 success 観測中に Cloudflare API incident が混入した場合、観測延長 followup

また、**fold-state sync** として `docs/30-workflows/unassigned-task/followup-issue-720-001-prod-env-monitor-secret-cleanup.md` に `consumed_via_issue_772_runtime_restoration_spec` を同期した記録を本 output に含める。

### skill-feedback-report.md

本タスクで得た skill 改善フィードバック:

- task-specification-creator: 「CLOSED issue を最新コードに最適化して再起動する」パターンの Phase 1 要件定義テンプレートに、現状実態調査の表（期待 vs 実態 vs 根拠）を組み込むと再現性が上がる
- aiworkflow-requirements: runbook ADR の「runtime restoration pending」「cleanup no-op decision」ステータス語彙を正本に追加候補

### phase12-task-spec-compliance-check.md

task-specification-creator skill の strict compliance check:

| check | 結果 |
| --- | --- |
| 全 phase ファイル存在（01-13） | PASS |
| 実装区分明記 | PASS（index / 各 phase 冒頭） |
| CONST_005 必須項目 | PASS（Phase 02 / 06 で網羅） |
| CONST_007（1 サイクル完了） | PASS（external mutation のみ user-gated、先送り無し） |
| Phase 12 中学生レベル概念説明 | PASS（本 phase-12.md） |
| 7 必須 output 揃い | PASS（`outputs/phase-12/` に 7 ファイル配置済み） |
| fold-state sync 計画 | PASS（unassigned-task-detection に記載済み） |

## 完了条件

- [x] 中学生レベル概念説明明記
- [x] 7 必須 output 計画明記
- [x] 7 ファイルの outputs 配置（runtime evidence は Phase 11 / 13 の user-gated 領域として分離）

## 次 Phase

- 次: 13 (PR・振り返り)
