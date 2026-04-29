# Phase 4: テスト作成（TDD Red）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-apply-001 |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト作成（TDD Red） |
| 作成日 | 2026-04-28 |
| 上流 | Phase 3（設計レビュー Go 判定済） |
| 下流 | Phase 5（実装＝実機反映） |
| 状態 | blocked（Phase 3 Go + user 承認まで着手禁止） |
| user_approval_required | false |
| Issue | [#140](https://github.com/daishiman/UBM-Hyogo/issues/140) |

## 目的

Phase 3 で **Go 判定済**の topology / validation-path に基づき、実機反映前に **失敗する状態のテストシナリオ集**（TDD Red）を成果物として確定する。
本タスクは shell / JSON / alias の host 環境編集であり、xUnit 系の自動テスト framework ではなく、**手動実行可能なテスト手順 + 期待結果 + 検証コマンド**として記述する。

## 入力

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 3 main | `outputs/phase-03/main.md` | Go 判定結果の取り込み |
| Phase 3 go-no-go | `outputs/phase-03/go-no-go.md` | Go 判定済を確認 |
| Phase 3 impact-analysis | `outputs/phase-03/impact-analysis.md` | 採用案・deny 実効性の最終結論 |
| Phase 2 validation-path | `outputs/phase-02/validation-path.md` | TC-01〜TC-05 / TC-F-01〜TC-F-02 / TC-R-01 の元定義 |
| 元タスク TC 一覧 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-12/implementation-guide.md` | TC 詳細・エラーハンドリング表・エッジケース表 |
| 元タスク Phase 4 参考 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/phase-04.md` | テスト構造の参考 |

## 前提チェック（着手前必須）

- [ ] Phase 3 `go-no-go.md` の最終判定が **Go**
- [ ] 必須前提タスク 2 件が completed である（standalone 未実施タスクの存在だけでは不可）
- [ ] Phase 3 user approval が `go-no-go.md` に記録済み
- [ ] worktree esbuild 整合チェック (`bash scripts/cf.sh whoami` が ESBUILD_BINARY_PATH 自動解決でエラーなく終了する)（[FB-MSO-002]）
- [ ] mise / pnpm のバージョン確認: `mise exec -- node -v` が `v24.x`、`mise exec -- pnpm -v` が `10.x`

## テスト対象シナリオ

### Happy path

| TC ID | 概要 | 検証ポイント |
| --- | --- | --- |
| TC-01 | グローバル `~/.claude/settings.json` の `defaultMode` が `bypassPermissions` | `jq -r '.defaultMode'` が完全一致 |
| TC-02 | グローバル `~/.claude/settings.local.json` の `defaultMode` が `bypassPermissions` | 同上 |
| TC-03 | `<project>/.claude/settings.json` の `permissions.allow` / `deny` が設計と完全一致 | `jq -S '.permissions'` を期待 JSON と diff |
| TC-04 | `cc` alias 1 行が `CC_ALIAS_EXPECTED` と完全一致 | `type cc` 出力 1 行 + `grep -nE '^alias cc=' <定義ファイル>` 1 ヒット |
| TC-05 | bypass モード起動時に permission prompt が出ない（`task-claude-code-permissions-deny-bypass-verification-001` の結論と整合） | 前提タスク結論を引用、独自検証は行わない |

### Fail path

| TC ID | 概要 | 検証ポイント |
| --- | --- | --- |
| TC-F-01 | `defaultMode` が typo（例: `bypassPermisson`）の場合、Claude Code は permission prompt にフォールバック | typo 注入で再現を確認、本 Phase では**期待値の記述のみ**（実注入は Phase 6） |
| TC-F-02 | `cc` alias が複数定義されている場合、後勝ちで意図しないモードで起動される | 期待: `grep -c '^alias cc='` が 1 |

### Regression

| TC ID | 概要 | 検証ポイント |
| --- | --- | --- |
| TC-R-01 | `~/.zshrc` 以外の zsh conf（例: `~/.config/zsh/conf.d/*`）に古い `cc` alias が残っていない | `grep -rn '^alias cc=' ~/.zshrc ~/.zshenv ~/.zprofile ~/.config/zsh 2>/dev/null` ヒットが 1 のみ |

## 期待値定数（`expected-results.md` に集約）

```
CC_ALIAS_EXPECTED='alias cc='\''claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'\'''
DEFAULT_MODE_EXPECTED="bypassPermissions"
PROJECT_PERMISSIONS_ALLOW_EXPECTED=<元タスク phase-2/whitelist-design.md の allow 配列を JSON で固定>
PROJECT_PERMISSIONS_DENY_EXPECTED=<同 deny 配列を JSON で固定>
BACKUP_SUFFIX_PATTERN='\.bak\.[0-9]{8}-[0-9]{6}$'
```

## 手順

1. **Go 判定確認**: `outputs/phase-03/go-no-go.md` の最終判定が `Go` であることを `main.md` 冒頭に転記する。No-Go なら Phase を中断し Phase 2 / 3 にループバック。
2. **worktree esbuild 整合チェック**: 上記「前提チェック」を実行し、結果を `main.md` に記録（[FB-MSO-002]）。
3. **TC 一覧の test-scenarios.md 展開**:
   - TC-01〜TC-05 / TC-F-01〜TC-F-02 / TC-R-01 を元タスク `implementation-guide.md` の TC 表から引用し、本タスクの実機パスに置換
   - 各 TC に「前提」「実行コマンド」「期待出力」「Pass 判定基準」を記述
4. **expected-results.md 整理**:
   - 上記期待値定数（`CC_ALIAS_EXPECTED` / `DEFAULT_MODE_EXPECTED` / `PROJECT_PERMISSIONS_ALLOW_EXPECTED` / `PROJECT_PERMISSIONS_DENY_EXPECTED` / `BACKUP_SUFFIX_PATTERN`）を definition section に集約
   - 各 TC ID と期待値定数のマッピング表を併記
5. **Red 状態の確認**: 現状（Phase 5 実装前）に各 TC を実行すると、TC-01〜TC-04 のいずれかが FAIL することを `test-scenarios.md` の「現在の Red 状態」欄に記録する（実機反映前提のため、少なくとも 1 件は Red であるべき）
6. **fail-path / regression は Phase 6 へ carry-over**: TC-F-01 / TC-F-02 / TC-R-01 の **本格的な fail injection 手順**は Phase 6 で記述する旨を `main.md` に明示

## 成果物

`artifacts.json` の Phase 4 outputs と 1:1 一致:

| ファイル | 内容要件 |
| --- | --- |
| `outputs/phase-04/main.md` | Phase 4 サマリ。Go 判定転記、esbuild チェック結果、TC ID 一覧、Red 状態の確認結果 |
| `outputs/phase-04/test-scenarios.md` | TC-01〜TC-05 / TC-F-01〜TC-F-02 / TC-R-01 の前提・実行コマンド・期待出力・Pass 判定基準 |
| `outputs/phase-04/expected-results.md` | 期待値定数定義 + TC ID と期待値のマッピング表 |

## 完了条件

- [ ] `main.md` 冒頭に Phase 3 Go 判定が転記されている
- [ ] worktree esbuild 整合チェック結果が記録されている
- [ ] `test-scenarios.md` に 8 件（TC-01〜05, TC-F-01, TC-F-02, TC-R-01）すべてが定義されている
- [ ] `expected-results.md` に 5 種の期待値定数と TC マッピング表がある
- [ ] Phase 5 実装前の Red 状態が `test-scenarios.md` で確認されている（最低 1 件 FAIL）
- [ ] artifacts.json `phases[3].outputs` 配列と本 Phase 成果物パスが完全一致

## 検証コマンド

```bash
# 期待値定数のシェル展開チェック（typo 検出）
grep -E '^(CC_ALIAS_EXPECTED|DEFAULT_MODE_EXPECTED|BACKUP_SUFFIX_PATTERN)=' \
  outputs/phase-04/expected-results.md | wc -l   # 3 以上であること

# 現在の Red 状態 dry-run（実機編集はしない）
jq -r '.defaultMode' ~/.claude/settings.json 2>/dev/null
type cc 2>/dev/null
```

## 依存 Phase

- 上流: Phase 3（Go 判定済）
- 下流: Phase 5（実装＝実機反映）
- carry-over 先: Phase 6（fail-path 実注入）

## 想定 SubAgent / 並列性

- 単一 agent で直列実行
- TC 文書化は test-scenarios.md / expected-results.md を別 agent で並列化可

## ゲート判定基準

- TC 8 件すべての記述完了 + Red 状態の確認完了で Phase 5 着手可
- Go 判定が転記されていない / esbuild チェック未実施 → 本 Phase 内で再実施

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 期待値定数の typo（特に `bypassPermissions` の綴り） | TC-F-01 で typo 注入を Phase 6 にて検証する設計を Phase 4 で約束 |
| TC-05 を独自検証してしまう | 本 Phase では「前提タスク結論の引用のみ」と明記し、再検証を禁止 |
| worktree esbuild 不整合で `cf.sh` 系が動かない | Phase 4 着手時の前提チェックで早期検出（[FB-MSO-002]） |
| Red 状態未確認で Phase 5 に進む | 完了条件に「Red 状態確認」を必須化 |

## 実行タスク

本 Phase の実行タスクは上記「手順」セクションを正本とする。blocked 状態の Phase は、上流 gate が Go になるまで実行しない。

## 参照資料

- `docs/30-workflows/task-claude-code-permissions-apply-001/index.md`
- `docs/30-workflows/task-claude-code-permissions-apply-001/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`

## 統合テスト連携

NON_VISUAL / host 環境設定タスクのため、UI 統合テストは対象外。検証は各 Phase の CLI 証跡、JSON validity、artifact 同期、Phase 11 manual smoke log で担保する。
