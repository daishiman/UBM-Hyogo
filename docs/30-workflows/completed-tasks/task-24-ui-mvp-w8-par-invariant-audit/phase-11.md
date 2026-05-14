# Phase 11: 手動テスト（NON_VISUAL 宣言）

**実装区分**: 実装仕様書（read-only audit; 成果物は audit-runner.sh + INVARIANT-AUDIT.md + evidence。`apps/` / `packages/` 変更ゼロを DoD で担保）。

## NON_VISUAL 宣言

| 項目 | 内容 |
|------|------|
| タスク種別 | NON_VISUAL / 監査タスク |
| 非視覚的理由 | UI/UX 変更なし、read-only 監査のみ |
| 代替証跡 | `outputs/phase-5/grep-evidence.txt`、`INVARIANT-AUDIT.md` matrix |
| Phase 11 スクリーンショット | **UI/UX 変更なしのため Phase 11 スクリーンショット不要** |

## 証跡の主ソース

- `outputs/phase-5/grep-evidence.txt`（6 INV × 22 task の grep 生出力）
- `outputs/phase-5/matrix.tsv`（132 セル）
- `INVARIANT-AUDIT.md`（最終 matrix + violations）

## スクリーンショットを作らない理由

監査タスクは画面遷移を伴わず、文字列ベースの evidence で完結する。視覚証跡は意思決定に寄与しない。

## 実行記録

| 観点 | 結果 |
|------|------|
| audit-runner.sh 実行 | Phase 5 で完了 |
| evidence ファイル存在 | `outputs/phase-5/grep-evidence.txt` |
| matrix セル数 | 132 (22×6) |
| read-only 担保 | `git diff apps/ packages/` 空 |

## 既知制限

- task spec のキーワード grep は false positive を含む可能性あり（自然言語のため）→ Phase 5 で人手レビューを加える
- consent キー検出は camelCase に限定（snake_case 別名は別途確認）

## メタ情報
- Phase: 11 / 手動テスト検証
- State: completed

## 目的
NON_VISUAL audit の代替証跡を固定し、スクリーンショット不要の根拠を示す。

## 実行タスク
- Phase 5 evidence を Phase 11 evidence として確認する。
- UI/UX 変更なしを確認する。

## 参照資料
- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`

## 成果物
- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`

## 完了条件
- [x] NON_VISUAL evidence が存在する
- [x] screenshot 不要理由が明記されている

## 統合テスト連携
汎用 phase validator の NON_VISUAL 補助成果物要件に接続する。
