# Phase 4: 手動テストシナリオ TC-01〜TC-05

## 共通前提

| 項目 | 値 |
| --- | --- |
| OS | macOS（darwin 25.x） |
| Shell | zsh |
| Claude Code | 既定インストール（`claude` コマンド利用可） |
| 実施タイミング | Phase 5 ランブックの Step 1〜4 完了後 |
| 環境変数 | API token 値はログへ書き出さない |

## TC-01: cc 起動直後のモード表示確認

| 項目 | 内容 |
| --- | --- |
| ID | TC-01 |
| 名称 | cc 起動直後の bypassPermissions 表示確認 |
| 要件 | F-1（settings 統一）/ F-2（alias 強化） |
| AC | AC-1, AC-2, AC-5 |
| 前提 | Phase 5 ランブック Step 1〜4 完了。新しいターミナルタブを開く |
| 操作 | `cc` を実行し、起動 banner / 状態表示を確認 |
| 期待結果 | (1) `bypassPermissions` モードが表示される / (2) 任意の Bash / Read 操作で permission prompt が出ない |
| 失敗時挙動 | モードが `acceptEdits` または `default` のまま、もしくは prompt が表示される |
| 判定 | PASS / FAIL / BLOCKED |
| 復旧 | Phase 5 Step 6 のロールバック手順を実行 |

## TC-02: reload / session 切替後のモード維持確認

| 項目 | 内容 |
| --- | --- |
| ID | TC-02 |
| 名称 | session 切替後の bypassPermissions 維持確認 |
| 要件 | F-1（settings 統一） |
| AC | AC-1, AC-5 |
| 前提 | TC-01 が PASS であること |
| 操作 | (1) claude session 内で `/exit` → 再度 `cc` 起動 / (2) `/clear` 相当でセッションリセット |
| 期待結果 | 再起動後も `bypassPermissions` が維持され、prompt が出ない |
| 失敗時挙動 | `acceptEdits` に戻る / prompt 出現 |
| 判定 | PASS / FAIL / BLOCKED |
| 復旧 | settings 3 層を再確認、bak ファイルから復元 |

## TC-03: 別プロジェクトでの cc 起動影響確認

| 項目 | 内容 |
| --- | --- |
| ID | TC-03 |
| 名称 | 他プロジェクトでの cc 起動時の影響範囲確認 |
| 要件 | F-2（alias 強化）/ F-4（階層優先順位文書化） |
| AC | AC-4, AC-5, AC-6 |
| 前提 | TC-01 PASS。`<project>/.claude/settings.json` を持たない別ディレクトリへ移動 |
| 操作 | 別プロジェクト直下で `cc` 起動、モード表示を確認 |
| 期待結果 | グローバル `bypassPermissions` が適用される（案 A の想定通り） |
| 失敗時挙動 | 想定外モード / 想定外 prompt |
| 判定 | PASS / FAIL / BLOCKED |
| 備考 | Phase 3 impact-analysis.md の波及範囲評価とつき合わせる |

## TC-04: whitelist allow 効果確認（保険）

| 項目 | 内容 |
| --- | --- |
| ID | TC-04 |
| 名称 | bypass を意図的に外した状態での allow whitelist 効果確認 |
| 要件 | F-3（whitelist 整備） |
| AC | AC-3, AC-5 |
| 前提 | `--dangerously-skip-permissions` を **意図的に外した** 起動コマンドを使用（例: `claude --verbose --permission-mode default`） |
| 操作 | `pnpm --version` を実行 |
| 期待結果 | `Bash(pnpm *)` allow により permission prompt 無しで実行 |
| 失敗時挙動 | prompt が発生（whitelist 不備） |
| 判定 | PASS / FAIL / BLOCKED |
| 備考 | bypass モード下では whitelist は no-op の可能性がある（Phase 2 設計の保険レイヤ） |

## TC-05: whitelist deny 効果確認

| 項目 | 内容 |
| --- | --- |
| ID | TC-05 |
| 名称 | deny ルールによる危険コマンドのブロック確認 |
| 要件 | F-3（whitelist 整備） |
| AC | AC-3, AC-5 |
| 前提 | TC-04 と同条件（bypass 外し） |
| 操作 | `git push --dry-run --force origin <dummy-ref>` を実行（**本番 main に push しない**） |
| 期待結果 | deny ルールでブロックされる |
| 失敗時挙動 | コマンドが実行されてしまう |
| 判定 | PASS / FAIL / BLOCKED |
| 安全策 | (1) `--dry-run` を必ず付ける / (2) ref は `refs/heads/dummy-tc05` 等の存在しない名前を使う / (3) 本番 main へは絶対に push しない |

## 判定基準サマリ

| 区分 | 条件 |
| --- | --- |
| ALL PASS | TC-01〜TC-05 すべて PASS、EC-01〜EC-03 のいずれにも非該当 |
| 部分 PASS | TC-04 / TC-05 が bypass モード下で no-op の場合は WARN 扱い（Phase 2 仕様内） |
| FAIL | TC-01 / TC-02 のいずれかが FAIL → 即時ロールバック |
| BLOCKED | 環境要因で実施不能 → `[WEEKGRD-01]` で記録、再実施日決定 |

## エビデンス記録テンプレート

```
- TC-ID: TC-01
- 実施日時: 2026-04-28T10:00:00+09:00
- 実行コマンド: cc
- 期待: bypassPermissions 表示 / prompt なし
- 観測: <記入>
- 判定: PASS / FAIL / BLOCKED
- 補足: <記入>
```

## 参照

- `phase-04.md`
- `outputs/phase-2/{settings-diff,alias-diff,whitelist-design}.md`
- `outputs/phase-3/impact-analysis.md`
