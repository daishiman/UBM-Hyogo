# Phase 6: テスト拡充（fail-path / 回帰補強）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-apply-001 |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト拡充（fail-path / regression 補強） |
| 作成日 | 2026-04-28 |
| 上流 | Phase 5（実機反映完了） |
| 下流 | Phase 7（カバレッジ確認） |
| 状態 | blocked（Phase 5 実反映完了まで着手禁止） |
| user_approval_required | false |
| Issue | [#140](https://github.com/daishiman/UBM-Hyogo/issues/140) |

## 目的

Phase 5 で実機反映が Green 化した状態を前提に、Phase 4 で **期待値定義のみ**だった
TC-F-01 / TC-F-02 / TC-R-01 を **実 fail injection** + **回帰 guard** として補強する。
本 Phase は破壊的注入を含むため、Phase 5 の `backup-manifest.md` を必ず先に確認する。

## 入力

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 5 main | `outputs/phase-05/main.md` | Green 状態確認 |
| Phase 5 backup-manifest | `outputs/phase-05/backup-manifest.md` | 注入後の rollback 元データ |
| Phase 5 runbook-execution-log | `outputs/phase-05/runbook-execution-log.md` | rollback 手順引用元 |
| Phase 4 test-scenarios | `outputs/phase-04/test-scenarios.md` | TC-F-01 / TC-F-02 / TC-R-01 の期待値 |
| 元タスク エッジケース表 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-12/implementation-guide.md` | 注入バリエーション参考 |

## 拡充対象 TC

### TC-F-01: `defaultMode` typo 注入

| 項目 | 内容 |
| --- | --- |
| 注入対象 | `~/.claude/settings.json`（テスト用 sandbox copy 推奨） |
| 注入内容 | root `defaultMode` を `bypassPermisson`（typo）に書き換え |
| 期待挙動 | Claude Code 起動時に bypass が効かず permission prompt にフォールバックする |
| 観測方法 | 新シェルで `claude` 起動 → permission prompt の有無を観測 |
| rollback | `cp -p ~/.claude/settings.json.bak.<TS> ~/.claude/settings.json` |

**重要**: typo 注入は **`~/.claude/settings.json` の copy を別パスに作って** 検証する手段も許容する。直接書き換える場合は注入直後に rollback を実施し、Claude Code セッション破壊を最小化する。

### TC-F-02: `cc` alias 重複定義注入

| 項目 | 内容 |
| --- | --- |
| 注入対象 | `~/.zshrc` の末尾 |
| 注入内容 | `alias cc='claude'`（最小定義）を追記し、`grep -c '^alias cc=' ~/.zshrc` を `2` にする |
| 期待挙動 | 新シェル起動時に **後勝ち**で意図しない alias が選ばれ、`type cc` 出力が `CC_ALIAS_EXPECTED` と不一致 |
| 観測方法 | `zsh -i -c 'type cc'` 出力を確認 |
| rollback | 追加した 1 行を削除し、`grep -c '^alias cc='` が `1` に戻ることを確認 |

### TC-R-01: 回帰 guard 用 grep スクリプト案

`fail-path-tests.md` に下記スクリプトを **記述のみ**（CI 化はしない）:

```bash
#!/usr/bin/env bash
# alias 重複検出 guard（手動実行用）
set -euo pipefail
hits=$(grep -rcE '^alias cc=' ~/.zshrc ~/.zshenv ~/.zprofile ~/.config/zsh 2>/dev/null \
  | awk -F: '{s+=$2} END{print s+0}')
if [[ "$hits" -ne 1 ]]; then
  echo "[FAIL] alias cc 定義が $hits 件検出されました（期待: 1）" >&2
  exit 1
fi
echo "[PASS] alias cc 定義は 1 件です"
```

> **未タスク候補**: 上記 guard を CI 化（GitHub Actions の zsh job として）する案は本タスク範囲外。
> Phase 12 `unassigned-task-detection.md` に記録する候補として `fail-path-tests.md` 末尾に明記する。

## 手順

1. **前提確認**:
   - Phase 5 `main.md` が Green、`backup-manifest.md` に 4 件の backup 記録
   - `TS` 値を控え、注入後の rollback 経路を `fail-path-tests.md` 冒頭に転記
2. **TC-F-01 注入**:
   - 安全策として `cp ~/.claude/settings.json /tmp/settings-fail-f01.json` を作り、そちらに typo を入れて `jq -r` で読み出すドライ検証を **優先**
   - 直接注入する場合は **即時 rollback** を完了条件化
   - 観測結果（permission prompt 出現の有無、または読み出し値）を `fail-path-tests.md` に記録
3. **TC-F-02 注入**:
   - `~/.zshrc` 末尾に `alias cc='claude'` を append
   - `zsh -i -c 'type cc'` 出力を取得し、`CC_ALIAS_EXPECTED` 由来の文字列と差分があることを確認
   - 追加行を削除し `grep -c '^alias cc=' ~/.zshrc` が `1` に戻ることを確認
4. **TC-R-01 guard 記述**:
   - 上記スクリプトを `fail-path-tests.md` の Code Block に記載
   - **CI 化は未タスク**として明記（実装しない）
   - 手動実行例を 1 回だけ実行し、`[PASS]` 出力を `fail-path-tests.md` に転記
5. **Green 復帰確認**:
   - Phase 5 TC-01〜TC-04 を再実行し、全 PASS であることを `main.md` に追記

## 成果物

`artifacts.json` の Phase 6 outputs と 1:1 一致:

| ファイル | 内容要件 |
| --- | --- |
| `outputs/phase-06/main.md` | Phase 6 サマリ。前提（Phase 5 Green）、注入結果、Green 復帰確認、未タスク候補一覧 |
| `outputs/phase-06/fail-path-tests.md` | TC-F-01 / TC-F-02 / TC-R-01 の注入手順・観測結果・rollback 結果・回帰 guard スクリプト・未タスク候補 |

## 完了条件

- [ ] Phase 5 Green 状態が `main.md` 冒頭に転記されている
- [ ] TC-F-01 注入と rollback、観測結果が `fail-path-tests.md` に記録されている
- [ ] TC-F-02 注入と rollback、`type cc` 出力差分が記録されている
- [ ] TC-R-01 guard スクリプトが `fail-path-tests.md` に Code Block で掲載され、`[PASS]` 出力が転記されている
- [ ] CI 化案が「未タスク候補」として記録されている（実装はしない）
- [ ] 注入後に Phase 5 TC-01〜TC-04 が再 PASS
- [ ] artifacts.json `phases[5].outputs` と本 Phase 成果物が完全一致

## 検証コマンド

```bash
# 注入後の rollback 確認
jq -r '.defaultMode' ~/.claude/settings.json   # 'bypassPermissions' に戻っていること
grep -cE '^alias cc=' ~/.zshrc                              # 1 に戻っていること

# guard スクリプト手動実行
bash -c 'hits=$(grep -rcE "^alias cc=" ~/.zshrc ~/.zshenv ~/.zprofile ~/.config/zsh 2>/dev/null | awk -F: "{s+=\$2} END{print s+0}"); echo "hits=$hits"'
```

## 依存 Phase

- 上流: Phase 5（Green 状態 + backup-manifest）
- 下流: Phase 7（coverage-matrix への TC-F / TC-R 反映）

## 想定 SubAgent / 並列性

- **単一 agent で直列実行**（host 環境への破壊的注入を含むため）
- TC-F-01 / TC-F-02 を並列に注入しない（rollback の取り違えリスク）

## ゲート判定基準

- 完了条件すべて PASS で Phase 7 着手可
- 注入後の rollback 失敗 → Phase 5 backup から強制復元し、Phase 5 main.md に異常記録

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 注入後の rollback 漏れで Claude Code セッション崩壊 | 注入と rollback を 1 ペアの手順として記述、ドライ検証を推奨 |
| typo 注入が他 project に波及 | 必要に応じて `/tmp` への copy 上で検証する dry path を優先 |
| guard スクリプト誤実装で false negative | `[PASS]` 出力を 1 回手動確認し転記 |
| CI 化を独断で実装 | Phase 6 では「未タスク候補」記録のみと完了条件で明示制限 |
| シークレット情報の混入 | 注入対象は `defaultMode` / alias のみ。token 系は触らない |

## 実行タスク

本 Phase の実行タスクは上記「手順」セクションを正本とする。blocked 状態の Phase は、上流 gate が Go になるまで実行しない。

## 参照資料

- `docs/30-workflows/task-claude-code-permissions-apply-001/index.md`
- `docs/30-workflows/task-claude-code-permissions-apply-001/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`

## 統合テスト連携

NON_VISUAL / host 環境設定タスクのため、UI 統合テストは対象外。検証は各 Phase の CLI 証跡、JSON validity、artifact 同期、Phase 11 manual smoke log で担保する。
