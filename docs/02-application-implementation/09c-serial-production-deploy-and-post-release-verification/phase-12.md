# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-serial-production-deploy-and-post-release-verification |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | 9 |
| Mode | serial（最終） |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |

## 目的

production deploy / release tag / 24h verify / incident runbook 共有の結果を 7 ドキュメントとして閉じ、Wave 9（24 タスク全体）の完了状態を可視化する。本タスクは Wave 9 の serial 最終 / 24 タスクの最後であるため、`post-release-summary.md` は MVP リリース完了報告書の役割も兼ねる。Phase 12 で生成される 7 種は他 wave のドキュメントを参照する終端ノードとなる。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

- [ ] なぜこのタスクが必要かを、日常生活の例え話から説明する
- [ ] 専門用語を使う場合は、その場で短く説明する
- [ ] 何を作るかより先に、困りごとと解決後の状態を書く

### Part 2: 開発者・技術者レベル

- [ ] TypeScript の interface / type 定義を記載する
- [ ] API シグネチャ、使用例、エラーハンドリング、エッジケースを記載する
- [ ] 設定可能なパラメータ、定数、実行コマンド、検証コマンドを一覧化する

## 実行タスク

1. `outputs/phase-12/post-release-summary.md` 作成（MVP リリース完了報告 + 24h メトリクス + 後続タスク）
2. `outputs/phase-12/implementation-guide.md` 作成（production deploy をどう実装するか / 13 ステップ要約）
3. `outputs/phase-12/system-spec-update-summary.md` 作成（specs/ の差分要望）
4. `outputs/phase-12/documentation-changelog.md` 作成（doc 変更点）
5. `outputs/phase-12/unassigned-task-detection.md` 作成（未割当課題 + 24h 後の継続観測項目）
6. `outputs/phase-12/skill-feedback-report.md` 作成（このタスクで得たノウハウ）
7. `outputs/phase-12/phase12-task-spec-compliance-check.md` 作成（不変条件 #1-#15 への適合）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/02-application-implementation/09c-serial-production-deploy-and-post-release-verification/phase-11.md | smoke evidence 7 種 |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | scope 整合 |
| 必須 | doc/02-application-implementation/README.md | 不変条件 |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | spec 更新候補 |
| 必須 | doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-12/ | 上流 documentation-changelog |
| 必須 | doc/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/ | 上流 release / incident runbook |

## 実行手順

### ステップ 1: post-release-summary 作成（MVP リリース完了報告）
- 24h メトリクス + 不変条件 #5 / #15 の SQL 結果 + 後続観測 task の列挙

### ステップ 2: implementation-guide 作成
- production deploy の入口（09a / 09b 完了後）
- runbook 13 ステップ要約 + release tag フォーマット + share-evidence 取り方

### ステップ 3: system-spec-update-summary 作成
- specs/ の更新候補（特に 15-infrastructure-runbook.md と 14-implementation-roadmap.md）

### ステップ 4: documentation-changelog 作成
- 09c で追加 / 変更 / 削除したファイルの一覧

### ステップ 5: unassigned-task-detection 作成
- 24h 後の継続観測 / 未割当課題

### ステップ 6: skill-feedback-report 作成
- production deploy で得たノウハウ + 改善提案

### ステップ 7: phase12-task-spec-compliance-check 作成
- 不変条件 #1〜#15 すべてを点検

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR body に 7 ドキュメントへのリンクを含める |
| 上流 09a | implementation-guide で staging green 引き渡し記録を参照 |
| 上流 09b | implementation-guide で release runbook + incident runbook を参照 |
| 上位 README | post-release-summary を MVP リリース完了報告として README に link |

## 多角的チェック観点（不変条件）

- 不変条件 #1〜#15 を `phase12-task-spec-compliance-check.md` で全 15 項目チェック
- production 文脈での #4 / #5 / #6 / #10 / #11 / #15 が 24h evidence で裏付けられているか
- specs/ の差分提案が runbook と整合するか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | post-release-summary.md | 12 | pending | MVP リリース完了報告 |
| 2 | implementation-guide.md | 12 | pending | 実装ガイド |
| 3 | system-spec-update-summary.md | 12 | pending | spec 差分提案 |
| 4 | documentation-changelog.md | 12 | pending | doc 変更点 |
| 5 | unassigned-task-detection.md | 12 | pending | 未割当 + 継続観測 |
| 6 | skill-feedback-report.md | 12 | pending | ノウハウ |
| 7 | phase12-task-spec-compliance-check.md | 12 | pending | 不変条件 #1-#15 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | サマリ |
| ドキュメント | outputs/phase-12/post-release-summary.md | MVP リリース完了報告 + 24h メトリクス |
| ドキュメント | outputs/phase-12/implementation-guide.md | production deploy 実装ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | specs/ 更新候補 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | doc 変更点 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未割当課題 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | ノウハウ |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 不変条件 適合 |
| メタ | artifacts.json | Phase 12 を completed に更新 |

## 完了条件

- [ ] 7 ドキュメントすべて作成
- [ ] 不変条件 #1-#15 が compliance check で全項目 PASS
- [ ] post-release-summary.md に 24h メトリクス記載
- [ ] 上位 README から post-release-summary.md への参照を提案

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 7 ドキュメント配置済み
- 不変条件 15 項目 PASS
- artifacts.json の phase 12 を completed に更新

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ事項: 7 ドキュメントと post-release-summary
- ブロック条件: 7 ドキュメントいずれかが欠ける、または不変条件 1 件でも違反があれば次 Phase に進まない

## 7 ドキュメント詳細

### 1. post-release-summary.md

```markdown
# Production Release Summary（MVP）

## リリース基本情報
- リリース日時: 2026-04-26 15:30 JST  # placeholder
- release tag: v20260426-1530  # placeholder
- main commit: <commit_hash>  # placeholder
- production URL: ${PRODUCTION_WEB} / ${PRODUCTION_API}
- D1: ${PRODUCTION_D1}

## 24h メトリクス（Cloudflare Analytics）
| メトリクス | 計測値 | 上限 | 余裕 |
| --- | --- | --- | --- |
| Workers req | <値> | 100k/day | <%> |
| D1 reads | <値> | 500k/day | <%> |
| D1 writes | <値> | 100k/day | <%> |

## 不変条件 24h 確認
- #5（apps/web → D1 直接禁止）: PASS（rg 0 hit）
- #15（attendance 重複防止）: PASS（SQL 0 行）

## 後続継続観測項目
- 1 週間後: D1 reads / writes の増加トレンド確認
- 1 ヶ月後: cron 頻度の見直し検討
- 不定期: incident response runbook の演習
```

### 2. implementation-guide.md

- production deploy の実装着手手順（09a / 09b 完了後の入口）
- 13 ステップ runbook 要約
- release tag フォーマット（`vYYYYMMDD-HHMM`）と immutable 原則
- share-evidence.md の作り方（Slack / Email 両経路）
- 24h verify の自動化将来案（spec のみ）

### 3. system-spec-update-summary.md

| 提案 | 対象 spec | 理由 |
| --- | --- | --- |
| "production deploy 13 ステップ" を runbook 章に追加 | `specs/15-infrastructure-runbook.md` | 09c の AC-1〜AC-8 を spec へ昇格 |
| release tag フォーマット (`vYYYYMMDD-HHMM`) を正本化 | `specs/15-infrastructure-runbook.md` | 09c で固定したものを spec へ |
| 24h post-release verify チェックリストを追加 | `specs/15-infrastructure-runbook.md` | AC-8 / AC-11 の運用化 |
| Phase 7 受け入れ条件に "24h メトリクス" を追加 | `specs/14-implementation-roadmap.md` | release 完了の定義 |
| MVP リリース完了報告テンプレを追加 | `specs/14-implementation-roadmap.md` | post-release-summary の正本化 |

### 4. documentation-changelog.md

- 09c で追加: `index.md` / `artifacts.json` / `phase-01.md`〜`phase-13.md` / `outputs/phase-{01..13}/...`
- 09c で更新: 上位 `README.md`（post-release-summary への link 追加提案）
- 09c で削除: なし

### 5. unassigned-task-detection.md

| 課題 | 取り扱い | 担当 |
| --- | --- | --- |
| 24h verify の自動 dashboard 化（GitHub Actions schedule） | 未割当（将来 task） | TBD |
| release tag → GitHub Releases の自動連携 | 未割当 | TBD |
| incident response runbook の Slack bot 自動配信 | 未割当 | TBD |
| 1 週間 / 1 ヶ月後の継続観測 | 未割当（運用 task として spec 化推奨） | TBD |
| Cloudflare Analytics の長期保存（CSV export） | 未割当（無料枠範囲内で再検討） | TBD |
| postmortem の自動テンプレ生成 | 未割当 | TBD |

### 6. skill-feedback-report.md

- 学んだこと:
  - production deploy は 13 ステップに分解しても sanity check と rollback 経路を併記しないと再現性が低い
  - release tag は immutable に運用するのが GitHub Releases / external tool との整合上正解
  - share-evidence は placeholder で十分、実値は別管理（CLAUDE.md ポリシー準拠）
  - 24h verify は手動 click で十分、自動化は別 task で
- 改善提案:
  - production deploy runbook を `.github/runbooks/` に置く
  - release tag フォーマットを `wrangler` 出力でも再利用できるよう env var 化
  - share-evidence の Slack post URL を `gh` CLI で取得できる手順を追加
- 不要だった作業: なし（13 ステップは spec で過不足なし）

### 7. phase12-task-spec-compliance-check.md

| 不変条件 | 適合 | 根拠 |
| --- | --- | --- |
| #1 schema を固定しすぎない | PASS | production sync で schema_versions を D1 へ反映、コードに直書きなし |
| #2 consent キー統一 | PASS | production smoke で AuthGateState を確認、`publicConsent` / `rulesConsent` のみ |
| #3 responseEmail は system field | PASS | production sync 後の member_responses で確認 |
| #4 本人本文を D1 override しない | PASS | production `/profile` に編集 form 不在を screenshot 注釈で証跡化 |
| #5 apps/web → D1 直接禁止 | PASS | production deploy 後 `rg D1Database apps/web/.vercel/output` で 0 hit |
| #6 GAS prototype 昇格しない | PASS | production runbook に GAS apps script trigger 不在、Workers Cron Triggers のみ |
| #7 responseId と memberId を混同しない | PASS | type test (08a) で担保、production smoke でも UI 表示で確認 |
| #8 localStorage を正本にしない | PASS | production smoke で route/session/data の localStorage 依存なし |
| #9 /no-access 専用画面に依存しない | PASS | production smoke で AuthGateState 出し分け確認 |
| #10 Cloudflare 無料枠 | PASS | production 24h で Workers < 5k / D1 reads / writes 無料枠 10% 以下 |
| #11 admin は本人本文を直接編集できない | PASS | production admin UI に編集 form 不在を目視 + screenshot |
| #12 admin_member_notes を view model に混ぜない | PASS | 04c の API 設計で担保、production smoke でも漏洩なし |
| #13 tag は admin queue 経由 | PASS | 07a で担保、production admin UI で queue 確認 |
| #14 schema 変更は /admin/schema | PASS | production sync は API 経由のみ、`/admin/schema` で UI 操作 |
| #15 meeting attendance 重複 / 削除済み除外 | PASS | production 24h で `SELECT ... HAVING c > 1` が 0 行 |

## 上位 README への提案

- `doc/02-application-implementation/README.md` に「Wave 9 完了 / MVP リリース」セクション追加
- post-release-summary.md への link を追加
- 24h メトリクス結果と次の運用 task（継続観測）を簡潔に記載

## 同 wave / 上流 sync 通知

- 上流 09a / 09b に通知: production deploy 完了、release tag、24h evidence の link
- 上位 README に通知: MVP リリース完了報告、post-release-summary.md への link
