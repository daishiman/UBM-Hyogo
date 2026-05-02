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

## 実行タスク

1. `index.md` の AC-1〜AC-12 を検証手段・検証 Phase・証跡成果物にトレースする。
2. AC ごとに上流／下流 Phase の依存エッジを明示する。
3. Runtime AC（staging / production）はマージ後 Phase 11 で確認することを明記する。

## 目的

12 件の AC が Phase 4〜6 のテスト戦略・ランブック・異常系すべてとマッピングされ、Phase 11 evidence でクローズ可能であることを保証する。

## 参照資料

- `index.md`（AC-1〜AC-12）
- `artifacts.json`
- `phase-02.md`（権限マトリクス）
- `phase-04.md`（TC ID）
- `phase-05.md`（実行 Step）
- `phase-06.md`（FC ID）

## 入力

- index.md の AC 一覧
- Phase 4 / 5 / 6 成果物

## AC × 検証 × 成果物 マトリクス

| AC | 内容 | 検証手段（TC / FC / Step） | 検証 Phase | 証跡成果物 |
| --- | --- | --- | --- | --- |
| AC-1 | `CLOUDFLARE_API_TOKEN` の不要権限が 0 件 | Phase 11 で Cloudflare Dashboard Token 詳細の権限行数を 6 行と目視確認（FC-07/08/09 を陰性） | Phase 11 | outputs/phase-11/main.md（権限名一覧） |
| AC-2 | 正本 4 種の根拠付きマトリクス + 条件付き追加候補 | phase-02.md の権限マトリクス表 | Phase 2 / 3 | outputs/phase-02/main.md |
| AC-3 | `cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` が exit=0 | TC-R03 | Phase 5 / 11 | outputs/phase-05/main.md, outputs/phase-11/main.md |
| AC-4 | apps/api の `cf.sh deploy --env staging --dry-run` が exit=0 | TC-R04 | Phase 5 / 11 | 同上 |
| AC-5 | apps/web の `cf.sh deploy --env staging --dry-run` が exit=0 | TC-R05 | Phase 5 / 11 | 同上 |
| AC-6 | production Token への適用順序（旧保持→切替→失効）が図解 | phase-02.md の適用順序図 + phase-05.md Step 5〜8 | Phase 2 / 5 | outputs/phase-02/main.md, outputs/phase-05/main.md |
| AC-7 | rollback 手順の記載 | phase-05.md Step 7、phase-06.md FC-14 | Phase 5 / 6 | outputs/phase-05/main.md, outputs/phase-06/main.md |
| AC-8 | Phase 11 evidence に Token 値が含まれず、権限名・検証結果・日時のみ | TC-S06 / TC-N04（grep gate） | Phase 11 | outputs/phase-11/main.md（grep 0 件確認ログ） |
| AC-9 | 不変条件 #5（D1 直アクセスは apps/api 限定）を侵害しない | 設計レビュー（D1:Edit は CI 経由のみ） | Phase 1 / 3 | phase-01.md, phase-03.md |
| AC-10 | Token 分離 ADR 方針が U-FIX-CF-ACCT-02 と整合 | phase-02.md ADR セクション、phase-03.md Option C/D 議論 | Phase 2 / 3 / 12 | outputs/phase-02/main.md, outputs/phase-12/system-spec-update-summary.md |
| AC-11 | skill 検証 4 条件 PASS | Phase 3 / 10 のレビュー判定 | Phase 3 / 10 | phase-03.md, outputs/phase-10/main.md |
| AC-12 | `gh secret list --env {staging,production}` で Secret 名のみ確認・値非出力 | TC-S03 / TC-S04 | Phase 4 / 5 / 11 | outputs/phase-05/main.md, outputs/phase-11/main.md |

## 依存エッジ

| AC | 上流 Phase | 下流 Phase |
| --- | --- | --- |
| AC-1 | Phase 2（権限定義） | Phase 5（権限編集）→ Phase 11（行数確認） |
| AC-2 | - | Phase 2 / 3 |
| AC-3, AC-4, AC-5 | Phase 2 + Phase 5 Step 2-3 | Phase 11（runtime 証跡） |
| AC-6 | Phase 2 | Phase 5 / 11 |
| AC-7 | Phase 5 | Phase 6（FC-14 復旧） |
| AC-8 | Phase 4（TC-S06） | Phase 11 gate |
| AC-9 | - | Phase 1 / 3（review） |
| AC-10 | U-FIX-CF-ACCT-02 並列調整 | Phase 2 / 3 / 12 |
| AC-11 | - | Phase 3 / 10 |
| AC-12 | Phase 4 | Phase 5 / 11 |

## Runtime / Production AC の確認タイミング

| AC | staging で確認 | production で確認 |
| --- | --- | --- |
| AC-3, AC-4, AC-5 | Phase 5 Step 4 | Phase 11 で main run の green を TC-P01 / TC-P02 で間接確認 |
| AC-1, AC-12 | Phase 5 Step 1 / Step 4 | Phase 11 で再 grep |
| AC-8 | - | Phase 11 完了直前の grep gate |

## 統合テスト連携

- アプリ統合テストは追加しない。
- 全 AC は grep / `gh api` / `cf.sh` exit code / Cloudflare Dashboard 目視のみで close する。

## 完了条件

- [ ] AC-1〜AC-12 が ID 付きで検証手段（TC / FC / Step）にマッピングされている
- [ ] 各 AC の証跡成果物が指定されている
- [ ] Runtime AC（AC-3〜AC-5）と Production AC（AC-1, AC-8, AC-12 の最終 gate）の確認タイミングが分離されている
- [ ] 不変条件 #5（AC-9）と並列タスク整合（AC-10）の依存先が明示されている

## 成果物

- `outputs/phase-07/main.md`
