# Phase 9 Output: CODEOWNERS QA 結果

> 状態: **PARTIALLY EXECUTED — static checks + `gh api` PASS**
> `.github/CODEOWNERS` は本差分で更新済み。GitHub API の構文 / owner 解決検証とローカル静的検査は実行済み。test PR による suggested reviewer 観察のみ Phase 11 の手動 smoke として未実行。

## 1. QA チェックリスト

| # | 観点 | 検証コマンド | 期待 | 結果 | 失敗時対応 |
| --- | --- | --- | --- | --- | --- |
| 1 | codeowners/errors | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` | `{"errors":[]}` | PASS: `{"errors":[]}` | glob 構文修正 / 不在ハンドル修正 / write 権限付与 |
| 2 | doc/ 残存 | `rg -n "(^\|[^a-zA-Z])doc/" ...` | 0 件 / allow リスト | WARN: 広域残置あり。Phase 12 C-4 / UT-GOV-005 で継続 | 置換 or allow リスト記録 |
| 3 | global fallback 位置 | `awk 'NF && !/^#/ {print NR": "$0}' .github/CODEOWNERS` | 冒頭 1 行のみ | PASS: line 7 に `* @daishiman` 1 行 | `*` を冒頭へ移動 / 重複削除 |
| 4 | 重要 5 パス被覆 | `for p in ...; do grep -F "$p" .github/CODEOWNERS; done` | 5/5 OK | PASS: 5/5 OK | 欠落パス追記 |
| 5 | UT-GOV-001 整合 | `rg -n 'require_code_owner_reviews' docs/30-workflows/` | `false` 明文化 | PASS: solo 運用 / `require_code_owner_reviews=false` を Phase 12 と正本へ明記 | UT-GOV-001 仕様書同期 |
| 6 | CI 連携 | 採否判断 | base case: 不要 | PASS: MVP は手動 `gh api`。CI 化は C-1 / UT-GOV-004 連携 | 採用時は UT-GOV-004 と context 同期 |
| 7 | 重複行 | `awk 'NF && !/^#/ {print $1}' .github/CODEOWNERS \| sort \| uniq -d` | 0 行 | PASS: 出力なし | 重複行を集約 |

## 2. allow リスト（doc/ 残存の不可避ケース）

今回の差分では `docs/00-getting-started-manual/` への移行を進めたが、`doc/` 文字列は履歴・過去 workflow・アーカイブ・引用に広域残置している。全件同一 wave 置換はリンク切れリスクが高いため、Phase 12 C-4 / UT-GOV-005 の継続課題として分類する。

想定カテゴリ:
- 過去 commit message / CHANGELOG への引用（改変禁止）
- 外部 URL（GitHub Wiki 旧 URL 等）
- `docs/30-workflows/completed-tasks/**` 内の歴史的記録（globally excluded）

## 3. codeowners/errors 実行結果

実行日: 2026-04-29

コマンド:

```bash
gh api repos/daishiman/UBM-Hyogo/codeowners/errors
```

結果:

```json
{"errors":[]}
```

実走時の出力例（エラー時）:
```json
{
  "errors": [
    {
      "line": 12,
      "column": 1,
      "kind": "Unknown owner",
      "source": "@nonexistent-user",
      "suggestion": null,
      "message": "Unknown owner on line 12: @nonexistent-user is not a known user, team, or email address.",
      "path": ".github/CODEOWNERS"
    }
  ]
}
```

## 4. 対象外項目（明記）

| 項目 | 判定 | 備考 |
| --- | --- | --- |
| 無料枠見積 | 対象外 | GitHub API 無料枠内 |
| secret hygiene | 対象外 | secret 導入なし |
| a11y | 対象外 | UI なし |

## 5. UT-GOV-001 整合チェック

確認項目:
- [x] 本タスク Phase 12 と `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` に `require_code_owner_reviews=false` を明文化
- [x] CODEOWNERS が「ownership 文書としてのみ機能」と明記
- [x] solo 運用方針との矛盾なし

UT-GOV-001 の branch protection 本適用は別タスクのため、本タスクでは current applied の CODEOWNERS 文書化のみを正本へ反映する。

## 6. CI 連携判断（pending）

- **採用判断**: 不要（MVP / solo 運用）
- **理由**: `gh api` 手動実行で十分。実装 PR レビュー時 + 任意の月次監査で実走する運用で足りる。
- **将来採用条件**: contributor 体制移行時 / `require_code_owner_reviews=true` 切替時。
- **採用時の追加タスク**: UT-GOV-004 へ status check context `codeowners-lint` を同期登録。

## 7. 残課題（次 Phase へ）

- Phase 10 で 4 条件 (価値性 / 実現性 / 整合性 / 運用性) 再評価。
- `doc/` 広域残置の allow-list / 置換計画は Phase 12 C-4 / UT-GOV-005 で継続。
- test PR による suggested reviewer 観察は Phase 11 に残す。

> CODEOWNERS API / 静的検査は実行済み。GitHub PR UI の suggested reviewer 観察は未実行。
