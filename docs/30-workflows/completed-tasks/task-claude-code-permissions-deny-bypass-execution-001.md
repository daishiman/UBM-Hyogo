# Claude Code permissions.deny bypass 実機検証 - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-claude-code-permissions-deny-bypass-execution-001                        |
| タスク名     | Claude Code permissions.deny bypass 実効性 isolated 実機検証                  |
| 分類         | dev-environment / tooling / security / verification                           |
| 対象機能     | `permissions.deny` × `--dangerously-skip-permissions` 優先関係                |
| 優先度       | 高（apply-001 の前提条件 / blocker 解消用）                                   |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | 未実施 (proposed) — 実機検証はユーザー承認後に開始                            |
| 親タスク     | task-claude-code-permissions-deny-bypass-verification-001（spec_created 済み）|
| 発見元       | verification-001 Phase 12 unassigned-task-detection                           |
| 発見日       | 2026-04-28                                                                    |
| visualEvidence | NON_VISUAL                                                                  |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

verification-001 タスク（spec_created）の Phase 1 公式 docs 一次調査で、`permissions.deny` が `--dangerously-skip-permissions` 適用下で実効するか否かが Anthropic 公式 docs から明示判定できない場合に、判定状態は `docs_inconclusive_requires_execution` となる。この状態を解消するには isolated 環境での実機検証が必須である。

verification-001 自体は docs-only / spec_created のため runbook までしか作成しない。実 Claude Code 起動による検証は本タスクの責務とする。

### 1.2 問題点・課題

- 推測ベースで `deny は効くはず` と仮定して apply-001（`~/.zshrc` / `~/.claude/settings.json` 反映）に進むと、判定 NO 時に手戻りが発生する
- isolated 検証 runbook（`outputs/phase-5/runbook.md`）と verification protocol（`outputs/phase-2/verification-protocol.md`）は完成しているが未実行
- Claude Code バージョン差で結果が変わる可能性があり、再現可能な記録が必要

### 1.3 放置した場合の影響

- apply-001（下流の本番反映タスク）が前提条件不確定のまま blocked になる
- 危険操作（`git push --force` / `rm -rf /` / `Write(/etc/**)`）が deny されない状態で `--dangerously-skip-permissions` を継続使用すると事故リスク

---

## 2. 何を達成するか（What）

### 2.1 目的

verification-001 の runbook を isolated 環境で実機実行し、deny 実効性を `docs_explicit_yes` / `docs_explicit_no` / `docs_inconclusive_requires_execution` のいずれかで確定させ、apply-001 の前提条件を解放する。

### 2.2 最終ゴール（想定 AC）

1. `/tmp/cc-deny-verify-*` 配下の bare repo + work dir で全観測 pattern（P-01〜P-04）を実行し結果を記録
2. 検証ログに Claude Code バージョン / 実行日時 / pattern ごとの blocked/executed/prompt 結果が揃う
3. 判定状態が 3 値のいずれかで確定し、verification-001 の R-2 BLOCKER に転記される
4. 判定 NO の場合、`outputs/phase-2/alias-fallback-diff.md` の縮小 alias 案を採用する判断が記録される
5. 実プロジェクトの `origin` / 実 ref / グローバル `~/.claude/settings.json` に変更が一切発生していない（証跡確認）
6. 検証ログに API token / OAuth token / `.env` 実値が含まれていない

### 2.3 スコープ

#### 含むもの

- isolated 環境（`/tmp/cc-deny-verify-*`）の構築と破棄
- runbook に基づく Claude Code 起動 + deny pattern 実行
- 結果ログの記録と判定値確定
- verification-001 outputs への結果転記方針実行（リンク追加のみ）

#### 含まないもの

- `~/.claude/settings.json` / `~/.zshrc` の本番反映（apply-001 の責務）
- MCP server / hook の permission 挙動検証（U4 / 別タスク）
- project-local-first 案との比較設計（U3 / 別タスク）
- whitelist 項目の追加・拡張

### 2.4 成果物

- 検証ログ（`outputs/phase-11/verification-log.md` 形式準拠）
- 判定値確定メモ（`docs_explicit_yes` / `_no` / `_inconclusive`）
- isolated 環境破棄証跡
- verification-001 R-2 への参照追加

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- ユーザーによる実機検証承認
- Claude Code が CLI から起動可能
- `/tmp` への書き込み権限

### 3.2 依存タスク

- 上流: task-claude-code-permissions-deny-bypass-verification-001（runbook / verification protocol を提供）
- 下流: `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md`（指示書は存在。実反映は本タスクの判定結果まで blocked）

### 3.3 推奨アプローチ

verification-001 の補正済み runbook をそのまま実行する。runbook に追加不備が見つかった場合は、本タスク内の検証ログに差分を記録し、verification-001 へフィードバックする。

### 3.4 観測対象 pattern（runbook より引用）

- P-01: `Bash(git push --force:*)`
- P-02: `Bash(rm -rf /:*)`
- P-03: `Write(/etc/**)`
- P-04: `Bash(git push --force-with-lease:*)`

---

## 4. 実行手順

1. ユーザー承認を確認し、Claude Code バージョンを記録する。
2. verification-001 の `outputs/phase-5/runbook.md` に従い、`/tmp/cc-deny-verify-*` 配下へ isolated repo を作成する。
3. `work/.claude/settings.local.json` の deny pattern と local bare remote を確認する。
4. TC-VERIFY-01〜04 を順に実行し、`blocked` / `executed` / `prompt` / `not_attempted` を記録する。
5. 判定結果を verification-001 の検証ログ形式へ転記し、apply-001 の前提条件として参照できる形にする。
6. `/tmp/cc-deny-verify-*` を破棄し、実プロジェクトに変更がないことを確認する。

影響範囲:

- `/tmp/cc-deny-verify-*`（一時ディレクトリ・実行後破棄）
- verification-001 の outputs（参照リンク追加のみ）
- 実プロジェクトには変更なし（不変条件）

---

## 5. 完了条件チェックリスト

- [ ] 破壊的検証は **必ず isolated 環境のみ** で実施
- [ ] 実プロジェクトの `origin` / 実 ref / グローバル `~/.claude/settings.json` を一切変更しない
- [ ] 平文 `.env` をコミットしない（CLAUDE.md ルール準拠）
- [ ] `wrangler` 直接実行禁止（`scripts/cf.sh` 経由）を破らない
- [ ] Claude Code バージョンを検証ログに記録
- [ ] 判定結果を `docs_explicit_yes` / `docs_explicit_no` / `docs_inconclusive_requires_execution` のいずれかで固定
- [ ] apply-001 は判定確定まで実反映 blocked のまま維持

---

## 6. 検証方法

推奨タスクタイプ: verification / execution（Phase 1〜13 構成のフル仕様書化を推奨）

| 検証 | コマンド / 観点 | 成功条件 |
| --- | --- | --- |
| isolated path | `pwd` | `/tmp/cc-deny-verify-*` 配下 |
| local remote | `git remote -v` | `../bare.git` のみ |
| ref existence | `git rev-parse --verify main` | `main` ref が存在 |
| settings load | `test -f .claude/settings.local.json` + JSON parse | settings が存在し JSON として妥当 |
| deny observation | runbook TC-VERIFY-01〜04 | `blocked` / `executed` / `prompt` / `not_attempted` を記録 |

### 苦戦箇所【記入必須】

| 苦戦箇所 | 内容 | 対策 |
| --- | --- | --- |
| 実害のある deny pattern を安全に観測する | `rm -rf /` や `/etc/**` write は実行できない | refusal-only 観測または permission handling の事前ブロックを記録し、tool call が出たら承認せず中止 |
| missing ref による false negative | 空 repo の `git push --dry-run --force origin main` は permission 以前に失敗しうる | runbook で `main` ref と dummy commit を作成し、`git rev-parse --verify main` を必須化 |
| apply-001 との状態混同 | 指示書は completed-tasks 配下に存在するが、実反映は未実施 | 「既存指示書 / 実反映 blocked」として扱う |

---

## 7. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 実プロジェクト remote への誤 push | 破壊的変更 | `/tmp/cc-deny-verify-*` と local `../bare.git` 以外なら中止 |
| `/etc/**` への実書き込み | OS 破損 / 権限事故 | refusal-only 観測に限定し、tool call が出た場合は承認しない |
| Claude Code バージョン差 | 判定再現性低下 | `claude --version`、実行日時、settings 内容をログ化 |
| 判定不能のまま apply-001 実行 | 危険フラグの誤適用 | `docs_inconclusive_requires_execution` の場合は execution 完了まで apply-001 を blocked |

---

## 8. 参照情報

- 上流タスク: `docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001/`
- runbook: `outputs/phase-5/runbook.md`
- verification protocol: `outputs/phase-2/verification-protocol.md`
- alias fallback: `outputs/phase-2/alias-fallback-diff.md`
- 検証ログ template: `outputs/phase-11/verification-log.md`
- 検出ログ: `outputs/phase-12/unassigned-task-detection.md`
- 上位上流: `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/main.md`（R-2 BLOCKER 文脈）

---

## 9. 備考

verification-001 の AC-4 は再確認で更新され、apply-001 指示書は `completed-tasks` 配下に存在することを確認した。本メモは、apply-001 の実反映前 blocker を解くための条件付き execution タスクとして扱う。フル仕様書（Phase 1〜13）への昇格はユーザー承認時に別 PR で実施する。
