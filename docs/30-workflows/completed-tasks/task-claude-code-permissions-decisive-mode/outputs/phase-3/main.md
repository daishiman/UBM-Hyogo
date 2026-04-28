# Phase 3: 設計レビュー — 成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13（設計レビュー） |
| 種別 | docs-only / spec_created |
| 作成日 | 2026-04-28 |
| 上流 | Phase 2 |
| 下流 | Phase 4（テスト設計） |

## 1. レビュー結論サマリ

| 項目 | 判定 | 備考 |
| --- | --- | --- |
| R-1 グローバル変更の波及範囲 | CONDITIONAL PASS | `impact-analysis.md` に列挙、許容可能と暫定判定 |
| R-2 `--dangerously-skip-permissions` 挙動範囲 | BLOCKED | 公式仕様または実機確認が必要（実装タスクで実施） |
| R-3 whitelist 整合性 | PASS | 既存 `permissions` との衝突は実装タスク側で再走査 |
| R-4 案 A / 案 B 最終決定 | 案 A 採用（条件付） | R-2 BLOCKED 解消まで実装は保留 |

**Phase 4 への Go/No-Go 判定: Go（設計仕様としては承認、実装承認は別タスクで）**

> 本タスクは spec_created。Phase 4 以降も「設計の検証手順」を文書化するに留め、実装承認は R-2 の BLOCKER 解消後の別タスクで行う。

## 2. R-1: グローバル settings 変更の波及範囲

| 確認項目 | 判定 | 内容 |
| --- | --- | --- |
| 他プロジェクトでの `defaultMode` override 確認方針 | PASS | 実装前に他 worktree / 他リポジトリの `<project>/.claude/settings.json` を grep で再走査することを実装タスクの前提条件として明記 |
| プロジェクト未定義リポジトリでの bypass 常時適用 | CONDITIONAL PASS | 個人開発マシンのみのため許容。共有マシンへの拡張時は再レビュー |
| `permissions.allow` / `deny` を global へ追記しない方針 | PASS | 案 A でも `permissions` は project 層に閉じる |

詳細は `impact-analysis.md` 参照。

## 3. R-2: `--dangerously-skip-permissions` 挙動範囲（BLOCKER）

| 確認項目 | 判定 | 残存リスク |
| --- | --- | --- |
| MCP server 起動時の permission も skip されるか | UNKNOWN | 公式 docs / 実機で確認必要 |
| Hook（PreToolUse 等）が依然動作するか | LIKELY YES | hook は permission 系統と独立の hooks API 上で動くと推測 |
| skip 対象から外れる prompt の存在 | UNKNOWN | 残存リスクとして明記 |
| `permissions.deny` が skip 環境下で実効するか | UNKNOWN | これが blocker の核心 |

### 結論

R-2 は BLOCKED。実装タスクで以下のいずれかを実施するまで、`--dangerously-skip-permissions` を「保険として deny で守られている」前提にしない:

1. Anthropic 公式ドキュメントで `permissions.deny` が `--dangerously-skip-permissions` 適用時に実効することの記述を取得
2. 実機検証で `Bash(rm -rf ~/*)` 等の deny パターンが skip 環境下で blocked されることを確認

R-2 が NG（deny が実効しない）の場合のフォールバック:

- alias から `--dangerously-skip-permissions` を削除
- project-local settings + `--permission-mode bypassPermissions` の組合せに戻す

## 4. R-3: whitelist の整合性

| 確認項目 | 判定 | 備考 |
| --- | --- | --- |
| 既存 `<project>/.claude/settings.json` の `permissions` との衝突 | DEFERRED | 実装タスク開始時に grep で再走査 |
| `Bash(wrangler *)` deny と `scripts/cf.sh` 内部呼び出しの整合 | PASS | スクリプト内 wrangler 呼び出しは shell プロセス完結で Claude Bash tool 経由ではない |
| `Edit(*)` / `Write(*)` の path 限定構文 | DEFERRED | 公式仕様未確認。実装タスクで拡張可否を判断 |

## 5. R-4: 案 A / 案 B 最終決定

- **採用: 案 A（全層 `bypassPermissions` 統一）**
- 条件: R-2 BLOCKER の解消が前提。BLOCKER が NG（deny 不実効）と判明した場合は alias を縮小し案 A を維持（settings 部分のみ実装）
- 案 B（global からキー削除）はフォールバック保持。R-1 で「他プロジェクト波及不可」と判定された場合に切替

## 6. レビューチェックリスト

- [x] R-1 の波及範囲が `impact-analysis.md` に明文化されている
- [x] R-2 の残存リスク（4 項目）が列挙されている
- [x] R-3 の whitelist 衝突確認方針が決まっている（実装タスクで grep 走査）
- [x] 案 A / 案 B の最終決定（案 A 採用、案 B フォールバック保持）が記録されている
- [x] Phase 4 着手の Go/No-Go 判定が明示されている（Go: 設計仕様として、実装承認は別タスク）

## 7. 既知の落とし穴と防止策

| パターン | 防止策 |
| --- | --- |
| グローバル設定変更の silent 波及 | 実装前に grep で他プロジェクトの `defaultMode` override を再走査（必須前提条件） |
| `--dangerously-skip-permissions` の過信 | R-2 BLOCKER 解消まで「deny が保険」と表現しない |
| alias 適用の取り消し漏れ | `alias-diff.md` のロールバック手順を Phase 5 runbook に転記 |
| whitelist の重複・過剰許可 | 実装タスク開始時に既存 allow / deny との diff を取り、最小差分で適用 |

## 8. Phase 4 へのハンドオフ

- 採用案 A の前提でテストシナリオを設計
- R-2 BLOCKER の確認手順（Anthropic 公式 docs 参照 + 実機 deny 検証）を Phase 4 / Phase 11 に組み込む
- フォールバック（案 B / alias 縮小）も検証可能な形でテストシナリオ化

## 9. 完了条件

- [x] `main.md`（本ファイル）に R-1〜R-4 のレビュー結論を記録
- [x] `impact-analysis.md` に他プロジェクトへの波及範囲を記録
- [x] BLOCKER（R-2）の取扱いを明文化
