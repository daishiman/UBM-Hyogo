# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-serial-production-deploy-and-post-release-verification |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 9 |
| Mode | serial（最終） |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | spec_created |

## 目的

Phase 1 の AC-1〜AC-12 と Phase 4 verify suite（pre-deploy / deploy / smoke / post-release の 4 層）と Phase 5 production deploy runbook 13 ステップ、Phase 6 failure case 13 種を 1 対 1 以上で対応させ、未対応 AC を 0 にする。production deploy 用の AC matrix は 09a / 09b より厳格に「AC × suite × runbook step × failure case × 不変条件」の 5 軸で記述する。空白セルが残れば Phase 1〜6 へ差し戻す。

## 実行タスク

1. positive AC matrix（AC-1〜AC-12 × verify suite × runbook step × 不変条件）作成
2. negative AC matrix（F-1〜F-13 × 検出経路 × mitigation × 不変条件）作成
3. 空白セル check（合計セル / 空白 0）
4. matrix を `outputs/phase-07/ac-matrix.md` に保存
5. production 固有の追加観点（release tag / share-evidence / 24h verify）が漏れていないか最終確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/index.md | AC-1〜AC-12 一覧 |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-04.md | verify suite 4 層 |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-05.md | runbook 13 ステップ |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-06.md | failure case 13 種 |
| 参考 | docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-07.md | 構造の統一 |
| 参考 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-07.md | 構造の統一 |

## 実行手順

### ステップ 1: positive AC matrix 作成
- AC-1〜AC-12 を `outputs/phase-07/ac-matrix.md` に表化
- 各 AC の対応 verify suite（D-* / S-* / R-*）と runbook step（1〜13）を記載

### ステップ 2: negative AC matrix 作成
- F-1〜F-13 を AC matrix に追加（"異常系を検出可能" を AC として）
- 各 F に検出 verify suite と mitigation を併記

### ステップ 3: 不変条件列の追記
- AC-9（#4）/ AC-10（#5）/ AC-11（#10）/ AC-12（#11）/ R-8（#15）を不変条件列に紐付け

### ステップ 4: 空白セル check
- positive 12 件 × 5 列 = 60 セル / negative 13 件 × 5 列 = 65 セル
- 空白 0 件を `rg "^\| - \|" outputs/phase-07/ac-matrix.md` で再確認

### ステップ 5: production 固有の追加観点 audit
- release tag (R-1 / R-2)、share-evidence (R-3)、24h verify (R-4〜R-7) の漏れがないか

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | matrix を GO/NO-GO 判定の根拠（**特に production の最終 GO 判定**）に使用 |
| Phase 11 | matrix を production smoke checklist に転用 |
| Phase 12 | matrix を `phase12-task-spec-compliance-check.md` の根拠に再利用 |
| 上流 09a | staging で同じ AC が PASS 済みであることを再確認 |
| 上流 09b | rollback / cron 確認の AC を継承 |

## 多角的チェック観点（不変条件）

- 不変条件 #4: AC-9（本人本文 override しない）が S-3 と Step 9 / 11 で担保
- 不変条件 #5: AC-10（apps/web → D1 直接禁止）が R-6 と Step 13 で担保
- 不変条件 #10: AC-11（無料枠）が R-5 と Step 13 で担保
- 不変条件 #11: AC-12（admin 編集不可）が R-7 と Step 9 で担保
- 不変条件 #15: F-13 / R-8（attendance 重複防止）が Step 13 で担保
- 不変条件 #6: F-13 で GAS apps script trigger を含めないことを再確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | positive AC matrix | 7 | pending | AC-1〜AC-12 |
| 2 | negative AC matrix | 7 | pending | F-1〜F-13 |
| 3 | 空白セル check | 7 | pending | 0 件 |
| 4 | production 固有観点 audit | 7 | pending | tag / share / 24h |
| 5 | 09a / 09b との整合確認 | 7 | pending | 用語 / 構造 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | matrix サマリ |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × verify suite × runbook step × 不変条件 表 |
| メタ | artifacts.json | Phase 7 を completed に更新 |

## 完了条件

- [ ] positive AC 12 件すべてが matrix に対応
- [ ] negative AC 13 件すべてが matrix に対応
- [ ] 空白セル 0 件
- [ ] 不変条件 #4 / #5 / #6 / #10 / #11 / #15 の全 6 項目が matrix で参照される

## タスク100%実行確認【必須】

- 全実行タスクが completed
- ac-matrix.md が positive 12 + negative 13 = 25 件記述
- 空白セル 0 件（合計 125 セル）
- artifacts.json の phase 7 を completed に更新

## 次 Phase

- 次: 8 (DRY 化)
- 引き継ぎ事項: ac-matrix.md / 不変条件カバレッジ
- ブロック条件: 空白セル 1 件以上、または negative AC が 13 件未満で次 Phase に進まない

## AC matrix（positive）

| AC | 内容 | verify suite | runbook step | 不変条件 | 備考 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | production D1 migration 最新まで Applied | D-1 | Step 4 / Step 5 | - | `bash scripts/cf.sh d1 migrations list` 全 Applied |
| AC-2 | production secrets 必須 7 種が確認済み | D-2 + D-3 | Step 6 | - | api 4 種 + pages 3 種 |
| AC-3 | api / web の production deploy が exit 0 | D-4 + D-5 | Step 7 / Step 8 | - | bash scripts/cf.sh deploy 出力確認 |
| AC-4 | production 10 ページ smoke 200 / 認可境界通り | S-1〜S-4 | Step 9 | #4, #11 | 公開 3 + login 1 + protected 6 |
| AC-5 | production で `POST /admin/sync/*` success + sync_jobs success 記録 | S-5 | Step 10 | - | 手動 trigger + SQL 確認 |
| AC-6 | release tag (`vYYYYMMDD-HHMM`) 付与 + push | R-1 + R-2 | Step 11 | - | local + remote 両方確認 |
| AC-7 | incident response runbook 関係者共有記録あり | R-3 | Step 12 | - | share-evidence.md に記載 |
| AC-8 | 24h Cloudflare Analytics req < 5k/day、D1 reads / writes 無料枠 10% 以下 | R-4 + R-5 | Step 13 | #10 | dashboard screenshot |
| AC-9 | 不変条件 #4（本人本文 override しない）production 確認 | S-3 | Step 9 | #4 | `/profile` 編集 form 不在 |
| AC-10 | 不変条件 #5（web → D1 直接禁止）production artifact 再確認 | R-6 | Step 13 | #5 | `rg D1Database` 0 hit |
| AC-11 | 不変条件 #10（無料枠）24h メトリクス PASS | R-5 | Step 13 | #10 | dashboard で 10% 以下 |
| AC-12 | 不変条件 #11（admin は本文編集不可）production admin UI 確認 | R-7 | Step 9 | #11 | admin UI に編集 form 不在 |

## AC matrix（negative）

| Failure | 検出 verify suite | 検出 runbook step | mitigation | 不変条件 |
| --- | --- | --- | --- | --- |
| F-1 main merge conflict | (gh pr merge 出力) | Step 1 | dev で rebase → 再 PR | - |
| F-2 上流 AC pending | P-2 | Step 2 | 09a / 09b へ差し戻し、09c 中断 | - |
| F-3 D1 backup 失敗 | P-3 | Step 3 | Cloudflare Status 確認、リトライ、export なしで Step 4 へ進まない | - |
| F-4 migration list 取得失敗 | D-1 失敗 | Step 4 | wrangler version / D1 binding 確認 | - |
| F-5 migration apply 失敗 | D-1 関連 | Step 5 | backup から戻す + 後方互換 fix migration | - |
| F-6 secrets 不足 | D-2 + D-3 失敗 | Step 6 | 04 infra で secret 登録 → 09c 再開 | - |
| F-7 api deploy 失敗 | D-4 失敗 | Step 7 | code error は 03/04 へ、wrangler.toml は 02c へ | - |
| F-8 web deploy 失敗 | D-5 失敗 | Step 8 | `@opennextjs/cloudflare` 設定を 02c で再確認 | - |
| F-9 smoke 404 / 403 / 500 | S-1〜S-4 失敗 | Step 9 | 該当 wave へ差し戻し、条件を満たす場合は api/web rollback (procedure A/B) | #4, #11 |
| F-10 manual sync 失敗 | S-5 失敗 | Step 10 | 03a / 03b へ差し戻し、cron 一時停止 (procedure D) | - |
| F-11 release tag push 失敗 | R-1 / R-2 失敗 | Step 11 | GitHub access 確認、再 push、上書き禁止 | - |
| F-12 incident runbook 共有失敗 | R-3 不在 | Step 12 | 別経路（Slack + Email）で再送 | - |
| F-13 24h verify 異常 | R-4 / R-5 / R-8 失敗 | Step 13 | cron 頻度低下、query 最適化、条件を満たす場合は api rollback (procedure A) | #5, #6, #10, #15 |

## 空白セル check

- positive 12 件 × 5 列（AC / 内容 / verify suite / runbook step / 不変条件）= 60 セル → 全埋め
- negative 13 件 × 5 列（Failure / 検出 / runbook step / mitigation / 不変条件）= 65 セル → 全埋め
- 合計 125 セル空白 0 件

## production 固有観点（追加 audit）

| 観点 | matrix 上の対応 | 備考 |
| --- | --- | --- |
| release tag 付与 | AC-6 / R-1 / R-2 / Step 11 / F-11 | `vYYYYMMDD-HHMM` 形式固定 |
| share-evidence | AC-7 / R-3 / Step 12 / F-12 | placeholder Slack channel / Email |
| 24h verify (Workers) | AC-8 / R-4 / Step 13 / F-13 | 5k req/day MVP |
| 24h verify (D1) | AC-8 / R-5 / Step 13 / F-13 | 無料枠 10% 以下 |
| post-release 不変条件 #5 | AC-10 / R-6 / Step 13 / F-13 | bundle inspect |
| post-release 不変条件 #15 | (R-8) / Step 13 | attendance 重複 0 |
