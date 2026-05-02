# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 7 |
| 状態 | spec_created |
| taskType | implementation |
| subtype | security-audit |
| visualEvidence | NON_VISUAL |
| 上流 | outputs/phase-02/main.md, outputs/phase-04/main.md, outputs/phase-05/main.md, outputs/phase-06/main.md |
| 下流 | outputs/phase-09/main.md, outputs/phase-10/main.md, outputs/phase-11/main.md |

## 1. 目的

`index.md` の AC-1〜AC-12 を、Phase 4 のテストケース（TC-*）／Phase 5 のランブック手順（Step）／Phase 6 の異常系シナリオ（FC-*）／Phase 2 の設計成果物に **完全トレース** し、Phase 11 evidence で close 可能であることを保証する。

## 2. AC × 検証手段 × 成果物トレース表

| AC | 内容（要約） | 検証手段（TC / FC / Step / 設計） | 検証 Phase | 証跡成果物 |
| --- | --- | --- | --- | --- |
| AC-1 | `CLOUDFLARE_API_TOKEN` の不要権限が 0 件 | TC-S01, TC-N01〜N03, TC-P03, FC-07〜FC-09 + Phase 11 で Cloudflare Dashboard Token 詳細の権限行数を 4 行（または条件付き昇格時 5〜6 行）と目視確認 | Phase 4 / 6 / 11 | outputs/phase-02/main.md, outputs/phase-11/main.md |
| AC-2 | 必要権限マトリクス（4 種正本 + 条件付き 2 種候補）が根拠付きで記載 | Phase 2 §3 マトリクス、TC-R01〜R06 で実測根拠取得 | Phase 2 / 3 / 4 / 11 | outputs/phase-02/main.md |
| AC-3 | `cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` exit=0 | TC-R03, Phase 5 Step 4 | Phase 5 / 11 | outputs/phase-05/main.md, outputs/phase-11/main.md |
| AC-4 | `cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` exit=0 | TC-R04, Phase 5 Step 4 | Phase 5 / 11 | outputs/phase-05/main.md, outputs/phase-11/main.md |
| AC-5 | `cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` exit=0 | TC-R05, Phase 5 Step 4 | Phase 5 / 11 | outputs/phase-05/main.md, outputs/phase-11/main.md |
| AC-6 | production 適用順序（旧保持→切替→失効）が図解 | Phase 2 §4 適用順序図（T0〜T5）, Phase 5 Step 5〜8 | Phase 2 / 5 | outputs/phase-02/main.md, outputs/phase-05/main.md |
| AC-7 | rollback 手順記載 | Phase 2 §5 Rollback 設計, Phase 5 Step 7, Phase 6 FC-14〜FC-16 | Phase 2 / 5 / 6 | outputs/phase-02/main.md, outputs/phase-05/main.md, outputs/phase-06/main.md |
| AC-8 | Phase 11 evidence に Token 値が含まれず権限名・検証結果・日時のみ | TC-S06 / TC-N04（grep gate）, Phase 5 §6 ガード, Phase 6 FC-10〜FC-13 | Phase 4 / 5 / 6 / 11 | outputs/phase-11/main.md（grep 0 件確認ログ） |
| AC-9 | 不変条件 #5（D1 直アクセスは apps/api 限定）を侵害しない | Phase 1 真の論点, Phase 3 設計レビュー, Phase 9 §5 再確認 | Phase 1 / 3 / 9 | outputs/phase-01/main.md, outputs/phase-03/main.md, outputs/phase-09/main.md |
| AC-10 | Token 分離 ADR 方針が U-FIX-CF-ACCT-02 と整合 | Phase 2 §9 ADR 化方針, Phase 3 Option C/D 議論, Phase 8 cross-reference | Phase 2 / 3 / 8 / 12 | outputs/phase-02/main.md, outputs/phase-08/main.md, outputs/phase-12/system-spec-update-summary.md（Phase 12 で生成） |
| AC-11 | skill 検証 4 条件 PASS | Phase 3 設計レビュー, Phase 9 §4 4 条件再点検, Phase 10 GO 判定 | Phase 3 / 9 / 10 | outputs/phase-03/main.md, outputs/phase-09/main.md, outputs/phase-10/main.md |
| AC-12 | `gh secret list --env {staging,production}` で Secret 名のみ確認・値非出力 | TC-S03 / TC-S04, Phase 5 Step 1-A | Phase 4 / 5 / 11 | outputs/phase-05/main.md, outputs/phase-11/main.md |

## 3. 依存エッジ

| AC | 上流 Phase | 下流 Phase |
| --- | --- | --- |
| AC-1 | Phase 2（権限定義）, Phase 4（TC-S01/N01-N03） | Phase 5（権限編集）→ Phase 11（Dashboard 行数確認） |
| AC-2 | Phase 1（論点抽出） | Phase 2 / 3, Phase 11（実測昇格判定） |
| AC-3, AC-4, AC-5 | Phase 2 §3, Phase 5 Step 2-3 | Phase 11（runtime 証跡） |
| AC-6 | Phase 2 §4 | Phase 5 Step 5-8, Phase 11 |
| AC-7 | Phase 2 §5, Phase 5 Step 7 | Phase 6 FC-14-16 復旧 |
| AC-8 | Phase 4 TC-S06 / TC-N04, Phase 5 §6, Phase 6 §3 | Phase 11 grep gate |
| AC-9 | Phase 1 不変条件再確認 | Phase 3 / 9 review |
| AC-10 | U-FIX-CF-ACCT-02 並列調整 | Phase 2 / 3 / 8 / 12 |
| AC-11 | Phase 3 設計レビュー | Phase 9 / 10 |
| AC-12 | Phase 4 TC-S03/S04 | Phase 5 Step 1-A / Phase 11 |

## 4. Runtime / Production AC の確認タイミング

| AC | staging で確認 | production で確認 |
| --- | --- | --- |
| AC-3 / AC-4 / AC-5 | Phase 5 Step 4（T2） | Phase 11 で main run の green を TC-P01 / TC-P02 で間接確認 |
| AC-1 / AC-12 | Phase 5 Step 1（T0）／ Step 4（T2） | Phase 11 で再 grep / Dashboard 再確認 |
| AC-8 | - | Phase 11 完了直前の grep gate（TC-S06 / TC-N04） |
| AC-2（条件付き昇格） | Phase 5 Step 4 で 4 権限のみで失敗時に昇格判定 | Phase 11 で根拠ログ確認 |

## 5. 統合テスト連携

- アプリケーション統合テストは追加しない。
- 全 AC は `grep` / `gh api` / `gh secret list` / `cf.sh` exit code / Cloudflare Dashboard 目視のみで close する。

## 6. 不変条件 / governance トレース

| 観点 | AC | 結果 |
| --- | --- | --- |
| 不変条件 #5（D1 直アクセスは apps/api 限定） | AC-9 | 侵害なし（CI 経路の D1:Edit 権限付与のみ） |
| solo 運用 governance | AC-12 | secret list 値非出力で運用ポリシー整合 |
| 並列タスク整合（U-FIX-CF-ACCT-02） | AC-10 | ADR 独立配置 + cross-reference（Phase 8 採用案） |

## 7. 完了条件

- [ ] AC-1〜AC-12 が ID 付きで検証手段（TC / FC / Step / 設計）にマッピングされている
- [ ] 各 AC の証跡成果物（パス）が指定されている
- [ ] Runtime AC（AC-3〜AC-5）と Production AC（AC-1, AC-8, AC-12 の最終 gate）の確認タイミングが分離されている
- [ ] 不変条件 #5（AC-9）と並列タスク整合（AC-10）の依存先が明示されている
- [ ] 12/12 のカバレッジ漏れがないこと

## 8. 成果物

- 本ファイル: `outputs/phase-07/main.md`
