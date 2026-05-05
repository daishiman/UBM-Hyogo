[実装区分: 実装仕様書]

# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-419-pages-project-dormant-delete-after-355 |
| phase | 10 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| 親 Issue | #355 (CLOSED) — `Refs #355` のみ使用、`Closes #355` 禁止 |

## 目的

Phase 01〜09 で構築した「Cloudflare Pages dormant 経過後の物理削除」タスク仕様の最終レビューを実施し、設計 PASS と runtime PASS を明確に分離する。本サイクルは spec_created までであり、実 deletion / dormant 観察期間 / aiworkflow-requirements 更新は別 cycle に委譲することを記録する。

## 入力

- `index.md` / `artifacts.json` / `runbook.md`
- Phase 01〜09 の各 `phase-XX.md` および `outputs/phase-XX/main.md`
- `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md`（formalize 元）
- 親仕様 `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/`（rollback path / Phase 11 evidence 境界の設計参照）

## 変更対象ファイル一覧

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-10/main.md` | Phase 10 サマリ（設計 PASS / runtime PENDING の分離記録） |

## 関数・型・モジュール

無し（ドキュメントレビューのみ）。

## 入出力・副作用

- 入力: Phase 01〜09 成果物
- 出力: `outputs/phase-10/main.md`（設計 PASS / runtime PENDING 区分の文書）
- 副作用: 無し（コード変更・コミット・push 一切なし）

## 4 条件レビュー（task-specification-creator 必須）

| 条件 | 確認ポイント | 判定基準 |
| --- | --- | --- |
| 矛盾なし | AC-1〜AC-6 と Phase 01〜09 の対応が一意 | Phase 07 / 09 の AC マトリクスで全件カバー |
| 漏れなし | destructive ops / dormant 観察期間 / user 承認 / token redaction / aiworkflow 更新の 5 軸が全て仕様化 | Phase 11 declared evidence 7 ファイルに反映 |
| 整合性 | `bash scripts/cf.sh` ラッパー方針が全コマンドで遵守されている | `wrangler` 直接呼び出し 0 件 |
| 依存関係整合 | Workers cutover (#355) 完了 → dormant 観察 ≥ 2 週間 → user 承認 → 削除実行 → aiworkflow 更新 の順序が明示 | runbook.md の手順順序と AC-1〜AC-6 が単調増加 |

## 設計 PASS と runtime PASS の分離（deploy-deferred evidence contract）

| 区分 | 本サイクルでの状態 | 完了条件 |
| --- | --- | --- |
| 設計 PASS | 本 Phase 10 で確定 | 4 条件すべて PASS、Phase 11/12/13 の declared outputs が確定 |
| runtime PASS | 別 cycle（user 承認後） | dormant 観察 ≥ 2 週間完了、`bash scripts/cf.sh pages project delete` 実行、post-deletion smoke PASS |

`spec_created` 状態では runtime evidence ファイル（`outputs/phase-11/*.md`）は `PENDING_RUNTIME_EXECUTION` placeholder として実体化される。本サイクルで `workflow_state` を `implemented` / `completed` に昇格させない。

## レビュー項目チェックリスト

| 項目 | 確認 |
| --- | --- |
| Issue #419 AC-1〜AC-6 全件カバー | Phase 07 マトリクス参照 |
| CONST_004（実装区分明記）遵守 | 各 phase-XX.md 冒頭で `[実装区分: 実装仕様書]` 明記 |
| CONST_005（必須項目）遵守 | 変更ファイル / シグネチャ / 入出力 / テスト / 実行コマンド / DoD すべて記載 |
| CONST_007（単一サイクル完結）遵守 | spec_created scope は 1 PR で完結、runtime 実行は別 cycle に分離 |
| Cloudflare CLI ラッパー方針遵守 | 全 Cloudflare 操作が `bash scripts/cf.sh` 経由 |
| シークレット handling | `.env` op:// 参照のみ、token / Bearer / sink URL の docs 直書き無し |
| 親 workflow 整合 | `Refs #355` のみ使用、`Closes #355` 不使用を Phase 13 PR template に明記 |
| solo 運用 governance | branch protection 影響なし（docs のみ） |
| destructive ops 二重承認 gate | (1) spec PR レビュー / (2) runtime cycle での user 明示承認 を Phase 11/13 に明記 |

## 残課題 / 引継ぎ

| 項目 | 引継ぎ先 |
| --- | --- |
| dormant 観察期間（≥ 2 週間）開始・終了の実日付記録 | runtime cycle（user 承認後） |
| `bash scripts/cf.sh pages project delete` 実行と redacted evidence 取得 | runtime cycle（AC-4 user 明示承認取得後） |
| `aiworkflow-requirements` references の Pages 言及書き換え | runtime cycle（削除完了後の同 wave） |
| Phase 13 PR の本作成（commit / push / gh pr create） | spec_created PR 承認後に user 指示で実行 |

## ローカル実行コマンド

```bash
# 本 Phase 10 ではドキュメントレビューのみ。コード変更を伴わない。
mise exec -- pnpm typecheck   # 既存 typecheck が green であることだけ確認（任意）
mise exec -- pnpm lint        # 同上（任意）
```

## テスト方針

- 本 Phase 10 はドキュメントレビューのため自動テストは追加しない。
- 4 条件チェックの根拠は Phase 07 / 09 マトリクスへの参照で担保する。

## 完了条件（DoD checklist）

- [ ] 4 条件（矛盾なし / 漏れなし / 整合性 / 依存関係整合）すべて PASS
- [ ] レビュー項目チェックリストの全項目が確認済
- [ ] 設計 PASS と runtime PASS の分離が `outputs/phase-10/main.md` に明記
- [ ] 残課題 3 件（runtime 実行 / aiworkflow 更新 / Phase 13 PR）が引継ぎ先付きで記録
- [ ] root `workflow_state` を `spec_created` のまま維持（昇格しない）

## 実行タスク

1. Phase 01〜09 の成果物と AC マトリクスを読み返し 4 条件を確認する。
2. 設計 PASS / runtime PASS 分離の判断を `outputs/phase-10/main.md` に記録する。
3. 残課題を引継ぎ先付きで列挙する。
4. workflow_state が `spec_created` のままであることを確認する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)
- 親仕様: `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/`
- formalize 元: `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md`

## 成果物

- `outputs/phase-10/main.md`
