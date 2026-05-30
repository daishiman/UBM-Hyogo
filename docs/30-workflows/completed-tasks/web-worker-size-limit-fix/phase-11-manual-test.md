# Phase 11: 手動テスト（NON_VISUAL / docs walkthrough）

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `web-worker-size-limit-fix` |
| phase | 11（手動テスト） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | `implemented_local_evidence_captured`（本サイクルは spec walkthrough。実測証跡は実装後取得） |
| 作成日 | 2026-05-29 |
| 依存 | phase-9（QA） / phase-10（最終レビュー） |

## 目的

visualEvidence=NON_VISUAL のため screenshot は **不要（生成禁止）**。テスト方式は **docs walkthrough（spec の手順読み合わせ）+ 実装後の NON_VISUAL 証跡**（typecheck / lint / test / build / grep / wasm find / size 計測ログ）とする。本フェーズの証跡は `outputs/phase-11/` の 3 ファイル（`main.md` / `manual-smoke-log.md` / `link-checklist.md`）に集約する。

## 実行タスク

| # | 手動テスト項目 | 方式 | 期待 |
| --- | --- | --- | --- |
| 11-1 | spec walkthrough | docs walkthrough | phase-1〜10 の手順が矛盾なく辿れ、Task A/B の対象ファイルが一意に特定できる |
| 11-2 | NON_VISUAL コマンド証跡（typecheck/lint/test/build） | コマンド実行ログ | phase-9 の 9-1〜9-4 が全 green |
| 11-3 | 撤去検証証跡（grep / wasm find） | コマンド実行ログ | `next/og` grep 0 件・wasm find 0 件 |
| 11-4 | size 証跡（check-worker-size.sh / dry-run） | コマンド実行ログ | gzip < 3072 KiB・dry-run で `[code: 10027]` 不発 |
| 11-5 | リンク健全性 | docs walkthrough | index.md → phase-*.md・phase 間・phase-12 strict7・参照 spec へのリンクが有効 |

## 参照資料

- `phase-9-qa.md`（コマンド一覧と期待結果）
- `phase-10-final-review.md`（go/no-go 基準）
- `outputs/phase-11/main.md`（証跡インデックス）
- `outputs/phase-11/manual-smoke-log.md`（コマンド × 期待 × 実測表）
- `outputs/phase-11/link-checklist.md`（参照リンク健全性表）

## 実行手順

1. **spec walkthrough**: phase-1〜10 を順に読み、Task A（`next/og` 撤去 → 静的 OG）・Task B（production minify 維持 + size gate）の手順が一貫しているかを確認する。発見事項があれば `outputs/phase-11/main.md` に記録する。
2. **証跡誘導**: 本実装で phase-9 の各コマンドを実行し、結果を `outputs/phase-11/manual-smoke-log.md` の実測列へ追記する。本サイクルは `implemented_local_evidence_captured` のため実測列は「取得済み」と記録する。
3. screenshot は NON_VISUAL のため作成しない（生成禁止）。証跡の主ソースは spec walkthrough + 実装後コマンドログとする。
4. `outputs/phase-11/link-checklist.md` で index.md / phase 間 / phase-12 strict7 / 参照 spec のリンク健全性を OK/Broken で記録する。
5. 3 ファイルがそろい、リンク健全性が全 OK であることを確認して phase-12 へ進む。

## 統合テスト連携

- 11-2〜11-4 の証跡は phase-9 の統合テスト（public-metadata.spec / opennext-config-regression.spec / size gate / dry-run）の実測結果そのものであり、`manual-smoke-log.md` に転記する。
- 統合テストの最終 PASS / FAIL 判定は本フェーズの証跡で確定し、phase-10 の go/no-go 判定へ反映される。

## 多角的チェック観点（AIが判断）

- **証跡の十分性**: NON_VISUAL でも コマンドログ + walkthrough で完了根拠が示せているか。
- **screenshot 非作成の妥当性**: visualEvidence=NON_VISUAL のため screenshot を作らない判断が正しいか。
- **リンク健全性**: 参照リンクに Broken が混入していないか。
- **状態整合**: 本サイクルが implemented_local_evidence_captured で実測列が「実装後取得」となっているか。
- **secret 非含有**: ログに secret が混入せず redaction が不要か。

## サブタスク管理

| サブタスク | 出力先 | 状態 |
| --- | --- | --- |
| 11-1 spec walkthrough | `outputs/phase-11/main.md` | `implemented_local_evidence_captured` |
| 11-2 コマンド証跡（4 ゲート） | `outputs/phase-11/manual-smoke-log.md` | `implemented_local_evidence_captured` |
| 11-3 撤去検証証跡 | `outputs/phase-11/manual-smoke-log.md` | `implemented_local_evidence_captured` |
| 11-4 size 証跡 | `outputs/phase-11/manual-smoke-log.md` | `implemented_local_evidence_captured` |
| 11-5 リンク健全性 | `outputs/phase-11/link-checklist.md` | `implemented_local_evidence_captured` |

## 成果物

- 本ファイル `phase-11-manual-test.md`
- `outputs/phase-11/main.md`（証跡インデックス）
- `outputs/phase-11/manual-smoke-log.md`（コマンド × 期待 × 実測表）
- `outputs/phase-11/link-checklist.md`（参照リンク健全性表）

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイルが存在する
- [ ] テスト方式が NON_VISUAL（docs walkthrough + コマンド証跡）であることを記録した
- [ ] screenshot を作成していない（NON_VISUAL 生成禁止）
- [ ] spec walkthrough で phase-1〜10 の手順整合を確認した
- [ ] リンク健全性チェックが全 OK
- [ ] coverage AC: apps/web 4 軸 >= 80%、`bash scripts/coverage-guard.sh` exit 0

## タスク100%実行確認【必須】

- [ ] NON_VISUAL のため screenshot を作成していないことを明示した
- [ ] outputs/phase-11 の 3 ファイルへ誘導した
- [ ] 本サイクルが implemented_local_evidence_captured で実測列が「実装後取得」であることを記録した
- [ ] coverage AC（apps/web 4 軸 >= 80% / coverage-guard exit 0）を完了条件に含めた
- [ ] 統合テスト連携・成果物・次Phase を記載した

## 次Phase

phase-12（ドキュメント同期）: strict 7 成果物（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）と Phase11 証跡参照の整合へ進む。
