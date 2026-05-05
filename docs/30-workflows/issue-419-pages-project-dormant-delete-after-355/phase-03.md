# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-419-pages-project-dormant-delete-after-355 |
| phase | 03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| destructiveOperation | true |

## レビュー観点

| 観点 | 評価 | 根拠 |
| --- | --- | --- |
| reversibility | リスク（受容） | Pages 削除は revert 不可。Workers 前 VERSION_ID を NFR-05 補償として記録することで Workers 側の rollback 経路は確保するが、Pages 自体は戻らない。観察期間 gate（最低 2 週間）と AC-4 user 承認で受容する |
| production 影響 | OK | Workers cutover 完了後にのみ着手。Pages dormant 状態 (active domain 0 / トラフィック 0) 確認を AC-2 で gate 化 |
| secret / token 露出 | OK | NFR-01 / AC-5 を redaction grep で gate 化。`.env` 値は op:// 参照のみ（NFR-03） |
| CLI ラッパー方針整合 | OK | 全操作を `bash scripts/cf.sh` 経由に集約（NFR-02）。`wrangler` 直接実行を含まない |
| 親 Issue #355 整合 | OK | `Refs #355` のみ使用、`Closes #355` を含めない（NFR-06）。親仕様の Phase 12 implementation-guide rollback 設計と整合 |
| destructive operation gate | OK | AC-4 で user 明示承認を `outputs/phase-11/user-approval-record.md` + PR description / Issue comment の二重記録 |
| aiworkflow-requirements 整合 | OK | AC-6 で Pages 言及箇所を「削除済み（YYYY-MM-DD）」へ更新する diff 案を Phase 12 で確定 |
| CONST_004（実装区分） | OK | 仕様書だけでは目的達成不可（scripts/cf.sh 拡張 + evidence + references 更新が必要）。実装仕様書として整合 |
| CONST_007（単一サイクル） | 部分 OK | 本仕様書サイクル = spec のみ。runtime 実走（観察 / 削除 / references 書き換え）は user 承認後の別 cycle に分離（destructive のため意図的） |

## 4 条件評価

| 条件 | 評価 |
| --- | --- |
| 矛盾なし | 観察期間 gate / user 承認 / redaction / CLI ラッパー方針が相互に矛盾しない |
| 漏れなし | AC-1〜AC-6 を FR-01〜FR-07 / NFR-01〜NFR-06 で全件カバー。preflight / 削除 / 事後 smoke / redaction / references 更新を網羅 |
| 整合性 | CLAUDE.md（CLI ラッパー / op:// / `Refs #355`）/ 親仕様（rollback / Phase 11 evidence 境界）/ aiworkflow-requirements 方針すべてと整合 |
| 依存関係整合 | Workers cutover 完了 / 1Password vault 稼働 / scripts/cf.sh ラッパー稼働 の 3 依存を Depends On に明示 |

## ユビキタス言語整合

- **dormant**: Pages プロジェクトが「最終 deploy 完了 / active custom domain 0 / 新規トラフィック 0」の状態
- **cutover**: Workers production route が Pages から Workers へ切替完了している状態（親 Issue #355 で完了）
- **preflight**: 削除実行前に AC-1 / AC-2 を確認する evidence 取得段階
- **runtime**: 仕様書ではなく実コマンド実行のフェーズ（本仕様書サイクル外）

## rollback readiness

- Pages 削除は revert 不可
- 補償として削除実行前に **Workers 前 VERSION_ID** を `outputs/phase-11/workers-prev-version-id.md` に記録（NFR-05）
- 万一 Workers 側に問題が発生した場合の rollback は `bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production` で対応（CLAUDE.md の rollback コマンド参照）

## 残課題

- Phase 05 grep gate で `scripts/cf.sh` の pages サブコマンド実装有無を確定する
- Phase 05 grep gate で aiworkflow-requirements の Pages 言及箇所候補を確定する
- Phase 11 で観察期間中の Workers 4xx・5xx 取得経路（Cloudflare ダッシュボード / Logpush どちらを正本にするか）を確定する

## 完了条件（DoD）

- [ ] 上記レビュー観点 / 4 条件評価 / ユビキタス言語整合 / rollback readiness が `outputs/phase-03/main.md` に記録されていること

## 目的

Phase 03 の判断と成果物境界を明確にする。

## 実行タスク

- Phase 02 設計の 4 条件評価
- destructive operation 受容性の判定
- Phase 05 / Phase 11 への申し送り事項の確定

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [phase-01.md](phase-01.md)
- [phase-02.md](phase-02.md)

## 成果物

- `outputs/phase-03/main.md`

## 統合テスト連携

- redaction grep / preflight dry-run の test 戦略は Phase 04 で確定する。
