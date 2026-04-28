# Phase 4: テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト設計 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 3 |
| 下流 | Phase 5 (実装) |
| 状態 | pending |

## 目的

Phase 2 / Phase 3 で確定した検証プロトコルを、**再現可能なテストケース**として記述する。
本タスクは検証実施を行わず、テストシナリオの完全性のみを担保する。

## テスト分類

- **手動テスト**: isolated 環境での Claude Code 起動 + コマンド試行（NON_VISUAL）
- **静的検査**: 公式 docs 引用の URL 妥当性 / スニペット整合性
- **自動テスト**: 本タスクでは導入しない（spec_created）

## テストケース一覧

### TC-DOC: 公式 docs 検証

| TC | 内容 | 期待結果 |
| --- | --- | --- |
| TC-DOC-01 | Anthropic Claude Code permissions ページに `--dangerously-skip-permissions` と `permissions.deny` の優先関係が明示されているか | URL とスニペットが取得できる、または「該当なし」が確定 |
| TC-DOC-02 | CLI flags ページの `--dangerously-skip-permissions` 説明 | URL とスニペットが取得できる、または「該当なし」が確定 |
| TC-DOC-03 | settings reference の `defaultMode` 説明 | URL とスニペットが取得できる、または「該当なし」が確定 |

### TC-VERIFY: 実機検証

| TC | 内容 | 期待結果 | 前提 |
| --- | --- | --- | --- |
| TC-VERIFY-01 | isolated repo で `Bash(git push --force:*)` deny 登録下、`git push --dry-run --force` を依頼 | blocked / 実行のいずれかが観測される | TC-DOC で「該当なし」確定 |
| TC-VERIFY-02 | deny 登録なしの安全コマンド（`git status`）が prompt なしで通る | 通る（bypass が効いている確認） | 起動成功 |
| TC-VERIFY-03 | `Bash(rm -rf /:*)` 相当を isolated path 配下の dummy directory に限定して試行（pattern マッチ確認） | blocked / 通過のいずれかが観測 | 実害のない `/tmp/cc-deny-verify-*` 配下のみ |
| TC-VERIFY-04 | `Write(/etc/**)` 相当の deny 試行は、実 `/etc` へ書かず Claude Code に拒否可否を観測する。代替実行が必要な場合は isolated path へ限定 | blocked / 通過のいずれかが観測 | システム領域へ実書き込みしない |
| TC-VERIFY-05 | 検証中の `git remote -v` が `bare.git` のみを指すこと | 実 GitHub を指していない | 検証開始前 + push 試行直前 |

### TC-LOG: 検証ログ品質

| TC | 内容 | 期待結果 |
| --- | --- | --- |
| TC-LOG-01 | `verification-log.md` に `claude --version` が記録 | バージョン文字列が含まれる |
| TC-LOG-02 | `verification-log.md` に時刻 / コマンド / 観測結果が表形式で揃う | 全 TC-VERIFY 行が揃う |
| TC-LOG-03 | API token / OAuth token / `.env` 値の漏洩がない | grep で機密パターンに一致しない |

### TC-FOLLOWUP: 上流 / 下流反映

| TC | 内容 | 期待結果 |
| --- | --- | --- |
| TC-FOLLOWUP-01 | 上流 R-2 欄に判定（YES/NO/判定不能）と出典が追記 | Phase 12 で確認 |
| TC-FOLLOWUP-02 | apply-001 の前提条件欄に判定が転記 | 判定 NO 時は alias 縮小案も併記 |

## カバレッジ目標

| 観点 | 目標 | 測定方法 |
| --- | --- | --- |
| AC カバレッジ | 8/8 | TC が AC ごとに紐づくこと（成果物 test-scenarios.md にトレース表） |
| pattern カバレッジ | 4/4（P-01〜P-04） | TC-VERIFY-01〜04 で網羅 |
| リスクカバレッジ | R-1〜R-5 全件 | runbook 検証手順で対策確認 |

## 主成果物

- `outputs/phase-4/main.md`
- `outputs/phase-4/test-scenarios.md`（TC × AC のトレースマトリクス含む）

## スコープ外

- 自動テストの導入（spec_created）
- 検証実施そのもの

## Skill準拠補遺

## 実行タスク

- 本文に記載のタスクを実行単位とする
- docs-only / spec_created の境界を維持する

## 参照資料

- Phase 3: `outputs/phase-3/`
- `.claude/skills/task-specification-creator/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする

## 完了条件

- [ ] TC-DOC / TC-VERIFY / TC-LOG / TC-FOLLOWUP が test-scenarios.md に揃う
- [ ] AC × TC トレースマトリクスが完成
- [ ] カバレッジ目標が定義されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは検証実施タスクで実行する。
ここでは手順、証跡名、リンク整合のみを固定する。
