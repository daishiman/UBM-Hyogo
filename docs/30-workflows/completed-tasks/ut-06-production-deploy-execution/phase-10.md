# Phase 10: 最終レビュー（GO / NO-GO）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番デプロイ実行 (UT-06) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー（GO / NO-GO） |
| 作成日 | 2026-04-27 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | pending |

## 目的

Phase 1〜9 の成果物を総合評価し、4 条件（価値性 / 実現性 / 整合性 / 運用性）と AC-1 〜 AC-8 の証跡見込みを確認したうえで、Phase 11 の本番 smoke test に進むか、即時ロールバック/差し戻しに進むかを判定する。
本番への不可逆操作の実行承認は Phase 4 の `production-approval.md` に前置きし、本 Phase は Phase 5 実行後の受入・継続・ロールバック判断を担う。

## 実行タスク

- 4 条件（価値性 / 実現性 / 整合性 / 運用性）を最終評価する
- AC-1 〜 AC-8 の証跡見込みと Phase 5 までの実績を確認する（Phase 7 の AC matrix を参照）
- verify suite（Phase 4）・abnormal-case-matrix（Phase 6）・quality-report（Phase 9）の結果を確認する
- secret hygiene（Phase 9）と無料枠評価（Phase 9）を確認する
- ロールバック手順 rehearsal（Phase 6）の完了を確認する
- Phase 4 の本番実行承認が Phase 5 前に取得済みであることを確認する
- GO / 条件付き GO / NO-GO 判定を行い、`outputs/phase-10/go-nogo.md` と `outputs/phase-10/final-review-report.md` に記録する
- NO-GO 時の差し戻し先 Phase を確定し、エスカレーション手順を実行する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/index.md | AC-1 〜 AC-8 の正本 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-07/ac-matrix.md | AC 全トレース表 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-09/quality-report.md | 品質保証結果（無料枠 / secret hygiene） |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-06/abnormal-case-matrix.md | 異常系・ロールバック検証結果 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-05/deploy-execution-log.md | デプロイ実施記録 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-05/d1-backup-evidence.md | D1 export バックアップ証跡 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-04/verify-suite-result.md | 事前検証 verify suite 結果 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-02/rollback-runbook.md | ロールバック手順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | go-live / rollback 方針 |
| 参考 | CLAUDE.md | ブランチ戦略・シークレット管理方針 |
| 参考 | artifacts.json | Phase 1〜9 の状態確認 |

## 実行手順

### ステップ 1: Phase 1〜9 完了状態の確認

- `artifacts.json` を参照し、Phase 1 〜 Phase 9 の `status` が全て `completed` であることを確認する
- 未完了 Phase が残っている場合は本 Phase を中止し、該当 Phase に差し戻す
- 各 Phase の主成果物（`outputs/phase-XX/`）が指定パスに配置されていることを確認する

### ステップ 2: 4 条件最終評価

- 価値性 / 実現性 / 整合性 / 運用性を Phase 1〜9 の成果物を根拠に評価する
- 各条件で PASS / CONDITIONAL / FAIL を判定する
- FAIL が 1 件でもあれば NO-GO とし、該当 Phase に差し戻す
- CONDITIONAL は条件解消手順を `final-review-report.md` に明記する

### ステップ 3: AC-1 〜 AC-8 証跡見込み確認

- Phase 7 の AC matrix を参照し、AC-1 〜 AC-8 の証跡パスと担当 Phase が定義されていることを確認する
- Phase 11 で初めて確定する AC-1 / AC-2 / AC-4 / AC-5 は「Phase 11 pending」として扱い、未実施を理由に循環ブロックしない
- Phase 5 までに確定すべき AC-3 / AC-6 / AC-7 / AC-8 が未 PASS の場合は GO 判定不可とし、対応 Phase に差し戻す
- 特に AC-7（D1 バックアップ取得）と AC-8（ロールバック runbook）は不可逆操作の前提として厳格に確認する

### ステップ 4: verify suite / 異常系 / 品質保証の確認

- Phase 4 verify suite が全件 PASS であることを確認する
- Phase 6 abnormal-case-matrix で「smoke test FAIL」「Workers バインディング解決失敗」「D1 マイグレーション失敗」「Pages 初回 project 未作成」等の異常系がカバーされており、ロールバック手順 rehearsal が完了していることを確認する
- Phase 9 quality-report で secret hygiene（`.dev.vars` の git ignore・Secrets が `wrangler secret list --env production` に存在）と無料枠（Pages 500 builds/month・Workers 100k req/day・D1 5GB）が PASS であることを確認する

### ステップ 5: 本番実行承認の確認

- `outputs/phase-04/production-approval.md` に delivery 担当・レビュアー・対象 commit SHA・実行ウィンドウ・abort 条件が記録済みであることを確認する
- 承認が Phase 5 実行前に取得されていない場合は NO-GO とし、運用責任者へエスカレーションする
- Phase 11 への進行可否は、本 Phase の受入判断と Phase 4 承認の両方で判定する

### ステップ 6: GO / 条件付き GO / NO-GO 判定と記録

- 判定マトリクスに従い最終判定を確定する
- `outputs/phase-10/go-nogo.md` に判定結果・根拠 Phase・承認者・実施予定日時を記録する
- `outputs/phase-10/final-review-report.md` に 4 条件評価詳細・AC カバレッジ・エスカレーション履歴を記録する
- NO-GO の場合は差し戻し先 Phase を特定し、エスカレーションマトリクスに従って関係者に通知する

## 4 条件最終評価【必須】

| 条件 | 評価観点 | 根拠 Phase | 判定 | 備考 |
| --- | --- | --- | --- | --- |
| 価値性 | 本番 go-live が後続タスク（UT-08 / UT-09 / 02-application-implementation）のクリティカルパス解放に直結するか | Phase 1, 2 | TBD | Wave 1 の最終成果物 |
| 実現性 | wrangler@3.x で Pages / Workers / D1 初回デプロイが完結し、無料枠超過リスクがないか | Phase 4, 5, 9 | TBD | wrangler バージョン整合 |
| 整合性 | local / staging / production の binding（D1 / KV / R2 / Vars / Secrets）が完全分離されており、env-binding-matrix と wrangler.toml が一致しているか | Phase 2, 7 | TBD | 03-serial / 04-serial 整合 |
| 運用性 | ロールバック手順（Pages / Workers / D1）が rehearsal 済みかつ 5 分以内判断可能・バックアップ取得が必須前置きとして組み込まれているか | Phase 2, 6, 8 | TBD | runbook の再現性 |

## GO / NO-GO 判定基準【必須】

| 判定項目 | 基準 | 根拠 Phase | 状態 | 判定 |
| --- | --- | --- | --- | --- |
| Phase 1〜9 全完了 | artifacts.json の status が全て completed と一致 | artifacts.json | pending | TBD |
| AC-1 〜 AC-8 証跡計画整合 | Phase 7 の AC matrix で全件の証跡パス・担当 Phase が定義済み。AC-1 / AC-2 / AC-4 / AC-5 は Phase 11 pending 可 | Phase 7 | pending | TBD |
| verify suite 全件 PASS | Phase 4 verify-suite-result.md で全件 PASS | Phase 4 | pending | TBD |
| 異常系・ロールバック rehearsal PASS | Phase 6 abnormal-case-matrix.md で全異常系のロールバック手順が rehearsal 済み | Phase 6 | pending | TBD |
| secret hygiene PASS | `.dev.vars` 未コミット・本番 Secrets 配置確認済み | Phase 9 | pending | TBD |
| 無料枠 PASS | Pages / Workers / D1 全て無料枠内 | Phase 9 | pending | TBD |
| 4 条件全 PASS | 価値性 / 実現性 / 整合性 / 運用性 全て PASS | 本 Phase | pending | TBD |
| Phase 4 本番実行承認取得 | production-approval.md に承認者・対象 commit SHA・abort 条件 | Phase 4 | pending | TBD |

**最終判定: TBD（GO / 条件付き GO / NO-GO）**

## 判定マトリクス

| 判定 | 閾値定義 | Phase 11 進行可否 |
| --- | --- | --- |
| GO | 全判定項目が PASS、かつ 4 条件全 PASS、かつ承認取得済み | 進行可（本番デプロイ実行・smoke test 実施） |
| 条件付き GO | 1 件以上の CONDITIONAL がある（FAIL ゼロ）。CONDITIONAL の解消条件と期限を `final-review-report.md` に明記すること | 条件解消後に進行可。CONDITIONAL 解消の証跡を `outputs/phase-10/conditional-resolution.md` に記録する |
| NO-GO | 1 件以上の FAIL、または AC 未完了、または承認未取得 | 差し戻し（Phase 11 進行不可） |

## エスカレーションマトリクス（NO-GO 時の差し戻し先 Phase）

| 失敗カテゴリ | 差し戻し先 Phase | エスカレーション先 | 対応期限目安 |
| --- | --- | --- | --- |
| AC 未完了（AC-1 〜 AC-5） | Phase 5（本番デプロイ実行）または Phase 4（事前検証） | delivery 担当 | 即日対応 |
| AC-6（実施記録）未完了 | Phase 5 | delivery 担当 | 即日対応 |
| AC-7（D1 バックアップ）未完了 | Phase 5 | delivery 担当 + レビュアー | 即日対応（不可逆操作の前提） |
| AC-8（ロールバック runbook）未完了 | Phase 2（設計） | delivery 担当 + レビュアー | 1 営業日 |
| verify suite FAIL | Phase 4 | delivery 担当 | 即日対応 |
| 異常系・rollback rehearsal 未完 | Phase 6 | delivery 担当 + レビュアー | 1 営業日 |
| secret hygiene FAIL | Phase 9 + 04-serial 上流 | セキュリティ担当 + delivery | 即日対応（公開前 Block） |
| 無料枠超過 | Phase 9 | delivery 担当 + プロダクト責任者 | 1 営業日 |
| 4 条件いずれか FAIL | Phase 2（設計） | delivery 担当 + レビュアー | 1 営業日 |
| 承認権者未承認 | 本 Phase 内で再調整 | 運用責任者 | 即日対応 |

## 本番デプロイ実施承認手順

1. delivery 担当が `outputs/phase-10/final-review-report.md` の draft を作成し、4 条件評価・AC カバレッジ・verify suite 結果・rollback rehearsal 結果を記載する
2. レビュアー 1 名が独立観点で内容を確認し、レビューコメントを記録する
3. 運用責任者（実装承認権者）が最終判定を行い、`final-review-report.md` の承認者欄に署名する
4. 承認取得後、`go-nogo.md` に GO 判定と Phase 11 実施予定日時（本番デプロイ実行時刻）を記入する
5. 承認取得前は Phase 11 への進行を一切行わない（不可逆操作のため）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 1 〜 9 | 全成果物を最終評価の根拠として使用 |
| Phase 11 | GO 判定後に手動 smoke test（本番環境への実 smoke）を実施 |
| Phase 12 | GO 判定の結果と承認履歴を close-out / spec-update に記録 |
| Phase 13 | GO 判定済みであることを PR 説明欄に明記 |

## 多角的チェック観点（AIが判断）

- 価値性: GO 判定が後続 Wave（UT-08 / UT-09 / 02-application-implementation）のクリティカルパスを解放するか
- 実現性: 本番デプロイ実行コマンド（wrangler）が承認時点で実行可能であり、必要権限が delivery 担当に付与されているか
- 整合性: GO 判定が AC・4 条件・verify suite・rollback rehearsal の全証跡と矛盾しないか
- 運用性: NO-GO 時のエスカレーション・差し戻し手順が明示されており、関係者が即時対応可能か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Phase 1〜9 完了状態確認 | 10 | pending | artifacts.json と一致 |
| 2 | 4 条件最終評価 | 10 | pending | 根拠 Phase を明記 |
| 3 | AC-1 〜 AC-8 全件確認 | 10 | pending | Phase 7 AC matrix 参照 |
| 4 | verify suite / 異常系 / 品質保証確認 | 10 | pending | Phase 4 / 6 / 9 参照 |
| 5 | secret hygiene / 無料枠確認 | 10 | pending | Phase 9 quality-report 参照 |
| 6 | ロールバック rehearsal 完了確認 | 10 | pending | Phase 6 abnormal-case-matrix 参照 |
| 7 | 承認権者への承認手順実行 | 10 | pending | 運用責任者の署名取得 |
| 8 | GO / 条件付き GO / NO-GO 判定記録 | 10 | pending | go-nogo.md / final-review-report.md |
| 9 | NO-GO 時のエスカレーション実行 | 10 | pending | 差し戻し先 Phase に通知 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-nogo.md | GO / 条件付き GO / NO-GO 判定表・承認者・実施予定日時 |
| ドキュメント | outputs/phase-10/final-review-report.md | 4 条件評価詳細・AC カバレッジ・verify suite 結果・rollback rehearsal 結果・エスカレーション履歴 |
| ドキュメント | outputs/phase-10/conditional-resolution.md | （条件付き GO の場合のみ）CONDITIONAL 解消条件と証跡 |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- 4 条件全 PASS（または条件付き GO の場合は CONDITIONAL 解消手順が明記されている）
- AC-1 〜 AC-8 の証跡計画が Phase 7 AC matrix で確認され、Phase 5 までに確定すべき AC-3 / AC-6 / AC-7 / AC-8 が PASS している
- verify suite（Phase 4）/ 異常系（Phase 6）/ secret hygiene・無料枠（Phase 9）が全て PASS である
- ロールバック手順 rehearsal（Phase 6）が完了している
- 運用責任者の承認が `final-review-report.md` に署名済みである
- GO / 条件付き GO / NO-GO 判定が `go-nogo.md` に記録されている
- NO-GO の場合はエスカレーションが完了し、差し戻し先 Phase が特定されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（承認未取得・AC 未完了・rollback rehearsal 未完）も確認済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 11 (手動 smoke test)
- 引き継ぎ事項: GO / 条件付き GO 判定結果・承認者署名・本番デプロイ実施予定日時・rollback runbook 参照パスを Phase 11 に引き継ぐ
- ブロック条件: GO 判定が得られていない、または承認権者の署名が未取得の場合は Phase 11 に進まない（本番不可逆操作の前提）
