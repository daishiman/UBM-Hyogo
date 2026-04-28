# impact-analysis: 他プロジェクトへの波及範囲レビュー

## 対象変更

| 変更対象 | 採用案 | 影響半径 |
| --- | --- | --- |
| `~/.claude/settings.json` の `defaultMode` を `acceptEdits` → `bypassPermissions` | 案 A | 全プロジェクト共通（マシン全体） |
| `<project>/.claude/settings.json` の `permissions.allow` / `deny` 追加 | 案 A | 当該プロジェクトのみ |
| `cc` alias に `--dangerously-skip-permissions` 追加 | 案 A | ユーザーシェル全体（全プロジェクト・全 worktree で `cc` が変化） |

## 影響マトリクス

| 対象 | 影響 | 判定 | 根拠 |
| --- | --- | --- | --- |
| global `~/.claude/settings.json`（本体） | 全プロジェクトへ波及 | CONDITIONAL ACCEPT | 個人開発マシン限定 / 既に local + project で bypass 設定済みのため最終値は変わらない |
| project `<project>/.claude/settings.json` | 当該 repo 限定 | ACCEPT | 影響範囲が局所的 |
| shell alias (`cc`) | ユーザーシェル全体（全 cc 起動） | CONDITIONAL ACCEPT | R-2 BLOCKER 解消まで実装承認は保留 |
| `--dangerously-skip-permissions` フラグ | 全 prompt 経路を skip | BLOCKED | deny 実効性が確認できるまで未承認 |

## 他プロジェクトへの波及シナリオ別評価

### シナリオ A: 他プロジェクトに `<project>/.claude/settings.json` が存在し `defaultMode` を明示している

| 観点 | 結果 |
| --- | --- |
| 最終 `defaultMode` | 当該プロジェクトの project 層値（global 変更の影響なし） |
| 副作用 | なし |
| 判定 | ACCEPT |

### シナリオ B: 他プロジェクトに `<project>/.claude/settings.json` が存在しない / `defaultMode` 未指定

| 観点 | 結果 |
| --- | --- |
| 最終 `defaultMode` | global.local の `bypassPermissions`（既存）→ 案 A 適用後も同じ |
| 副作用 | global.local が既に bypass のため挙動変化なし |
| 判定 | ACCEPT |

### シナリオ C: global.local が破損 / 削除された別マシン or fresh 環境

| 観点 | 結果 |
| --- | --- |
| 最終 `defaultMode` | 案 A 適用後: global 本体の `bypassPermissions` |
| 副作用 | fresh 環境で意図せず bypass が常時適用される（個人開発マシン限定なので暫定許容） |
| 判定 | CONDITIONAL ACCEPT（共有マシン拡張時は再レビュー） |

### シナリオ D: 案 B（global からキー削除）に切り替えた場合の C 環境

| 観点 | 結果 |
| --- | --- |
| 最終 `defaultMode` | Claude Code の組み込み default（仕様未確定） |
| 副作用 | bypass が外れる可能性あり。fresh 環境では prompt が出る |
| 判定 | 案 A よりリスクが低い反面、本タスクの目的（bypass を恒久化）に反する |

## 実装前の必須事前作業

実装タスク開始時に以下を順守すること（本タスクで設計化）:

1. ホームディレクトリ配下の他 worktree / 他リポジトリで `<project>/.claude/settings.json` の `defaultMode` を grep
2. 値が `acceptEdits` または `plan` のプロジェクトがあれば、当該リポジトリ管理者に確認
3. 個別 override が意図的なら、そのプロジェクトは案 A の影響を受けないことを確認した上で進める

```bash
# 参考: 実装タスクで実行する grep 例（本タスクでは実行しない）
# grep -r "defaultMode" ~/dev/**/.claude/settings.json 2>/dev/null
```

## 残存リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| `--dangerously-skip-permissions` が deny を無効化する | R-2 BLOCKER 解消まで実装承認しない。NG なら alias から削除 |
| 別マシンでの `cc` alias 同期忘れ | dotfiles 管理外の alias は適用範囲が当該マシンに閉じる |
| 共有マシン / CI runner への意図せぬ伝播 | 適用対象を「個人開発マシンのみ」と alias-diff.md / runbook に明記 |
| グローバル `permissions.allow` の汚染 | 案 A 採用時も global 層に `allow` / `deny` を追加しない方針を維持 |

## 判定総括

- **案 A 採用**: 個人開発マシン限定の前提で、他プロジェクトへの実質的な挙動変化はなし（最終値が変わらないため）
- **案 B 待機**: シナリオ C のリスクが許容不可と判明した場合のみ切替
- **alias 強化（`--dangerously-skip-permissions`）**: R-2 BLOCKER の解消後に実装可。それまでは設計のみ
- **whitelist project 層配置**: ACCEPT（影響半径が局所的）

## Phase 4 へのハンドオフ

- 上記シナリオ A〜D を Phase 4 のテストシナリオの起点として渡す
- R-2 BLOCKER 解消の検証手順（公式 docs 参照 + 実機 deny 検証）をテスト計画に組み込む
