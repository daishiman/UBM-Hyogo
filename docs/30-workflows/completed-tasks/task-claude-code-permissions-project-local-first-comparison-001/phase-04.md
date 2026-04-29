# Phase 4: テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-project-local-first-comparison-001 |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト設計 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 3 |
| 下流 | Phase 5 (実装 = 比較表本体作成) |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |
| 状態 | pending |

## 目的

本タスクは spec_only / docs-only / NON_VISUAL のため、ここでの「テスト」は **比較表（4 層 × 5 軸）と採用方針の検証シナリオ** を意味する。
ソース MD の §6「検証方法」TC-01〜TC-04 を入力として、比較表が

- 採用方針確定の根拠となるエビデンスを欠落なく持っているか
- 受入条件（AC-x）と相互にトレース可能か
- `task-claude-code-permissions-apply-001` がそのまま実装入力として使える粒度か

を判定する **手動レビューシナリオ**を定義する。実 `~/.claude/settings.json` / `~/.zshrc` / 他プロジェクト settings の書き換えは一切行わない（読み取りのみ）。

## 真の論点

- spec_only でも「比較表が誤った採用方針を導かないこと」を担保する検証ステップが必要
- 公式仕様引用と実機観測ログのどちらを採用するかで TC-01 の合否基準が変わる
- 案 A 採用時の他プロジェクト副作用（`scripts/cf.sh` / `op run` / 他 worktree）を網羅できているか
- TC-04 の rollback 手順 dry-run は、実書き換え禁止制約と両立する形で読み合わせのみで PASS とする

## テストシナリオ（ソース MD §6 を踏襲）

### TC-01: project-local-first 単独で fresh プロジェクトの `defaultMode` が `bypassPermissions` を維持するか

| 項目 | 内容 |
| --- | --- |
| 前提 | Phase 5 で比較表が確定し、Phase 2 の再発判定メモが揃っている |
| 操作 | 比較表の「fresh 環境挙動」列の根拠が、公式 docs 引用 or 実機観測ログ（書き換えなし）で裏付けられているか確認 |
| 期待結果 | project-local-first 単独では fresh プロジェクトで `bypassPermissions` を維持できないことが明示されている（再発する判定の場合）、または維持できる根拠が引用付きで存在する |
| 失敗時挙動 | 根拠が任意推論のみで出典が無い |

### TC-02: 案 A 適用後、他プロジェクトの最終 `defaultMode` がシナリオ A / B で変化しないこと

| 項目 | 内容 |
| --- | --- |
| 前提 | Phase 3 シナリオ A / B との対応表が比較表に記載されている |
| 操作 | 評価順序 `global → global.local → project → project.local`、勝ち順序 `project.local > project > global.local > global` から、シナリオ A / B の最終値が案 A 採用後も不変であることを表で読み取り |
| 期待結果 | シナリオ A / B では最終 `defaultMode` が変化しないことが、優先順位の評価過程付きで記述されている |
| 失敗時挙動 | 評価過程が省略されており、結論のみ記載 |

### TC-03: 案 A 適用後、fresh 環境（シナリオ C）で意図せず bypass 化することの許容判断

| 項目 | 内容 |
| --- | --- |
| 前提 | 比較表の「fresh 環境挙動」列にシナリオ C の挙動と許容判断が書かれている |
| 操作 | 「個人開発マシン限定」の前提下で、fresh 環境 bypass 化を ACCEPT / CONDITIONAL ACCEPT / REJECT のいずれで扱うか確認 |
| 期待結果 | 許容判断が明文化され、`task-claude-code-permissions-deny-bypass-verification-001` 結果との依存関係が記載されている |
| 失敗時挙動 | 許容判断が欠落、または deny 検証タスクとの依存関係が不明 |

### TC-04: rollback 手順を dry-run で読み合わせ（実書き換えは禁止）

| 項目 | 内容 |
| --- | --- |
| 前提 | Phase 5 で global 採用時の rollback 手順がコマンドレベルで記述されている |
| 操作 | rollback 手順を上から順に「読み」、各コマンドが副作用なしで dry-run できるか確認（実行はしない） |
| 期待結果 | バックアップ取得 → 差分復元 → `source ~/.zshrc` 等が抜けなく並び、各コマンドが他プロジェクト副作用を生まない |
| 失敗時挙動 | 手順に抜け or 順序ミスがある、`wrangler` 直接実行や `scripts/cf.sh` / `op run` 経路を破る記述がある |

## 受入条件 traceability（AC × TC）

| AC（index.md と同期） | 概要 | 紐付け TC |
| --- | --- | --- |
| AC-1 | 4 層責務表 | TC-01 / TC-02 |
| AC-2 | project-local-first の再発判定 | TC-01 |
| AC-3 | 3 案 × 5 軸の比較表 | TC-02 / TC-03 |
| AC-4 | 採用方針 1 案確定 | TC-02 / TC-03 |
| AC-5 | global 採用時 rollback 手順 | TC-04 |
| AC-6 | 他プロジェクト副作用一覧（`scripts/cf.sh` / `op run` / 他 worktree） | TC-02 / TC-03 / TC-04 |

## エッジケース

| EC | シナリオ | 期待 |
| --- | --- | --- |
| EC-01 | `task-claude-code-permissions-deny-bypass-verification-001` が未着の段階で本タスク完了 | 比較表に「deny 実効性」軸を保留扱いで明示し、結果到着後に追記する旨を残す |
| EC-02 | `~/dev` 配下の他リポジトリに `defaultMode` 明示プロジェクトが存在 | 全件列挙し、案 A 採用時の最終値変化有無を表化 |
| EC-03 | fresh 環境で `~/.claude/settings.json` 自体が未配置 | 公式 docs の組み込み default を引用し、bypass 化リスクを評価 |

## 証跡フォーマット

NON_VISUAL のため `outputs/phase-4/test-scenarios.md` にチェックリスト形式で記録。各 TC について:

- 実施日時
- 参照したコマンド or 引用 URL（読み取りのみ）
- 期待結果 / 実観測結果
- PASS / FAIL / BLOCKED
- 環境ブロッカー（deny 検証タスク未着）は別カテゴリで記録

## スコープ外

- 自動テスト（settings ファイルは claude プロセス再起動が必要、かつ本タスクは spec_only）
- bypass モード下の deny 実効性検証（→ `task-claude-code-permissions-deny-bypass-verification-001`）
- 実 `~/.claude/settings.json` / `~/.zshrc` の書き換え（→ `task-claude-code-permissions-apply-001`）

## 主成果物

- `outputs/phase-4/main.md`
- `outputs/phase-4/test-scenarios.md`

## 完了条件

- [ ] TC-01〜TC-04 が `outputs/phase-4/test-scenarios.md` に記載されている
- [ ] AC × TC のトレーサビリティ表が `outputs/phase-4/main.md` に記載されている
- [ ] 本文と `artifacts.json` の Phase outputs が矛盾しない

## 実行タスク

- 本文に記載済みのタスクを実行単位とする
- docs-only / spec_only の境界を維持する（実書き換えは行わない）

## 参照資料

- Phase 1: `outputs/phase-1/` を参照する
- Phase 2: `outputs/phase-2/` を参照する
- Phase 3: `outputs/phase-3/` を参照する
- ソース MD: `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001.md` §6
- 関連タスク: `task-claude-code-permissions-decisive-mode`（前提）
- 関連タスク: `task-claude-code-permissions-apply-001`（後続ハンドオフ先）
- 関連タスク: `task-claude-code-permissions-deny-bypass-verification-001`（並行）
- `.claude/skills/task-specification-creator/SKILL.md`

## 成果物/実行手順

- `artifacts.json` の該当 Phase outputs を正本とする
- `outputs/phase-4/main.md` と `outputs/phase-4/test-scenarios.md` を作成し、TC-01〜TC-04 と AC traceability を記録する

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テスト（実機書き換えを伴う検証）は `task-claude-code-permissions-apply-001` で実行する。ここでは手順、証跡名、リンク整合を固定する。
