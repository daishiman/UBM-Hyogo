# Phase 9: 品質保証

[実装区分: 実装仕様書] / NON_VISUAL

## 9.1 静的検証（shellcheck）— AC-7 の正本

bash タスクのため linter は **shellcheck** を正本とする。新規 lib + 移行 3 runner の計 4 ファイルが clean であることを必須とする。

### 実行コマンド

```bash
shellcheck scripts/smoke/lib/smoke-common.sh \
           scripts/smoke/runtime-attendance-provider.sh \
           scripts/smoke/runtime-admin-web.sh \
           scripts/smoke/runtime-tag-bulk.sh
```

### 重点チェック項目

| 観点 | shellcheck コード | 本タスクでの対策 |
| ---- | ----------------- | ---------------- |
| 未使用変数 | SC2034 | lib の公開変数 `SMOKE_SUMMARY_ENTRIES` / `SMOKE_OVERALL_STATUS` / `SMOKE_REDACT` は runner から参照されるため、lib 単体 shellcheck では「未使用」と誤検知され得る。**source 解決ディレクティブで抑止**するか、`# shellcheck disable=SC2034` を該当行へ局所付与（グローバル disable は禁止）。runner 内では実使用されるため検知されない |
| source 解決 | SC1090 / SC1091 | 各 runner の `source "$SCRIPT_DIR/lib/smoke-common.sh"` 直前に `# shellcheck source=scripts/smoke/lib/smoke-common.sh` ディレクティブを付与し、shellcheck が lib を辿って解決できるようにする（Phase 2.3 で規定済み） |
| 未定義変数 | SC2154 | lib が参照する `SMOKE_REDACT` は runner が source 後に設定する前提。lib 冒頭コメントに前提を明記し、`"${SMOKE_REDACT:?...}"` で未設定時 fail-fast も検討（実装は Phase 5 判断） |
| 配列展開の空安全 | SC2068 / SC2128 | `smoke_write_summary` の `"${SMOKE_SUMMARY_ENTRIES[*]:-}"` のように空配列展開を `:-` で保護（Phase 2.2 シグネチャ準拠） |
| word splitting | SC2086 | 引数 quote を徹底（`"$1"` 等） |

> **`# shellcheck source=...` ディレクティブの付与** は AC-7 の必須要素。これにより SC1091（source できない）を回避し、二段 source 経路（test→runner→lib）も静的に検証可能にする。

### PASS 基準

- 上記 4 ファイルで shellcheck の出力が **0 件（warning / error なし）**。
- `disable` ディレクティブは行単位の局所付与のみ許可。ファイル/グローバル disable は禁止。

## 9.2 actionlint（対象外の明記）

- 本タスクは **`.github/workflows/` を一切変更しない**（Phase 1.2 スコープ外）。したがって **actionlint は本タスクの直接対象外**。
- ただし CI が smoke runner を呼ぶ workflow（例: backend-ci の `*-runtime-smoke` job）が存在し、その workflow が runner を `bash` 実行 or shellcheck で lint している場合、**移行後も当該 job が通過すること**を間接 gate として確認する。
  - 確認方法: `grep -rn "runtime-.*\.sh\|smoke" .github/workflows/` で smoke を呼ぶ job を特定し、runner のインターフェース（引数 / 環境変数 / exit code）が非退化であることを Phase 11 ledger と突き合わせる。
  - 本タスクは runner の**呼び出し契約を変えない**ため、workflow 側の変更は不要（CI は移行を意識せず通過する想定）。

## 9.3 行数バジェット

| ファイル | Before | After（目安） | 評価 |
| -------- | ------ | ------------- | ---- |
| `scripts/smoke/lib/smoke-common.sh`（新規） | 0 | ~60〜80 行（9 関数 + コメント） | 単一責務の純粋部品集。100 行未満に収める |
| `runtime-attendance-provider.sh` | 291 | < 291（重複定義削除分だけ減）+ source 行 ~3 | **減少**を確認 |
| `runtime-admin-web.sh` | 217 | < 217 + source 行 ~3 | **減少**を確認 |
| `runtime-tag-bulk.sh` | 310 | < 310 + source 行 ~3（削除対象が最多） | **最大の減少**を確認 |
| 合計（runner 818 行） | 818 | runner 合計 < 818 + lib 新規分 | runner からの重複が lib へ移り、各 runner が縮む |

> **確認方法**: `wc -l scripts/smoke/lib/smoke-common.sh scripts/smoke/runtime-*.sh` を実装後に実行し、各 runner の行数が Before（291/217/310）より減っていることを Phase 11 ledger に記録する。lib 追加分を含めても「重複が 1 箇所に集約され、修正点が減る」ことが本質的な改善であり、総行数の微増は許容する。

## 9.4 mirror parity（N/A の明記）

- 本タスクの変更対象は **`scripts/` 配下の bash**であり、`.claude/skills/**` ではない。したがって **skill mirror（`.agents/skills` symlink parity）は N/A**。
- 一方、**仕様書 docs（`docs/30-workflows/issue-1138-.../`）は drift 確認対象**。Phase 12 で strict 7 ドキュメント同期 + `pnpm indexes:rebuild` 冪等性を確認し、docs と実装の乖離（path / 関数名 / AC 参照）が無いことを担保する。

## 9.5 「削除」の PASS 基準 [FB-UI-02-1]

> [FB-UI-02-1] 「削除した」と主張する箇所は、**実際に live なコードから消えている**ことを grep で機械検証する。

| 削除/置換対象 | PASS 基準（grep 検証） |
| ------------- | ---------------------- |
| 各 runner の自前 `write_summary` 本体 JSON 構築 | runner 内の `write_summary` が **薄ラッパー 1 行**に置換されている（自前 `printf '{"status"...` の重複が消えている） |
| `summary_pass`（tag-bulk）/ `log_redacted`（tag-bulk）の自前定義 | runner 内に当該自前定義が **無い**（呼び出しは lib 関数へ置換） |
| `SUMMARY_ENTRIES=()` / `OVERALL_STATUS="PASS"` の自前初期化 | runner 内に自前グローバル初期化が **無い**（`smoke_summary_init` 呼び出しに置換） |
| host allowlist grep / env prefix `tr` | runner 内の自前 grep / tr が lib 呼び出しに置換されている |

### 検証コマンド（live な重複が grep でゼロ）

```bash
# 自前 write_summary 本体（JSON 直構築）の重複が runner から消えていること
grep -rn 'printf .*"status".*"\(routes\|checks\)"' scripts/smoke/runtime-*.sh
#  → 期待: 0 件（JSON 直構築は lib smoke_write_summary のみ）

# 自前 summary 初期化の重複が消えていること
grep -rn '^SUMMARY_ENTRIES=()\|^OVERALL_STATUS="PASS"' scripts/smoke/runtime-*.sh
#  → 期待: 0 件（smoke_summary_init へ集約）

# lib への source が 3 runner すべてに存在すること
grep -rln 'lib/smoke-common.sh' scripts/smoke/runtime-*.sh
#  → 期待: 3 ファイル（attendance / admin-web / tag-bulk）
```

→ 「削除」の PASS は **runner 内に live な重複定義が grep で 0 件** かつ **lib 呼び出しへの置換が確認できる**ことで判定する。コメントアウト残置は不可（live なコードから消えていること）。

## 9.6 完了条件（Phase 9）

- [x] `shellcheck` を 4 ファイル（lib + 3 runner）に実行し 0 件 clean を PASS 基準とした（AC-7）。`# shellcheck source=...` ディレクティブ付与・`SMOKE_` prefix・`local` 化を規定した。
- [x] actionlint は本タスク対象外（workflow 非変更）と明記し、CI smoke job の間接通過確認方法を記した。
- [x] 行数バジェット（lib ~60〜80 行 / 各 runner が Before より減少）を確認方法込みで記した。
- [x] mirror parity は N/A（scripts 配下）と明記し、docs drift 確認は Phase 12 に委譲した。
- [x] [FB-UI-02-1]「削除」PASS 基準（live な重複が grep ゼロ + lib 置換）を検証コマンド付きで規定した。
