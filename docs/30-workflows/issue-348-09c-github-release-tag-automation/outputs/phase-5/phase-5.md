# Phase 5 正本: スクリプト実装仕様

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 実装区分 | 実装仕様書（コード未実装、関数 I/F のみ確定） |
| 対象 | `scripts/release/generate-release-notes.sh` / `scripts/release/create-github-release.sh` |

## 目的
release tag (`vYYYYMMDD-HHMM`) を入力に、Phase 12 changelog と Phase 11 evidence URL を埋め込んだ release note を決定論的に生成し、`gh release create` の dry-run / apply 2 段ゲートを通すスクリプトを仕様化する。本 Phase はコード実装を行わず、関数シグネチャ・引数・stdin/stdout・exit code・エラー条件を箇条書きで確定させる。

## Step 0: P50 チェック（必須）
- [ ] `which gh git sed awk` が全て成功（lookup gate）
- [ ] `bash --version` が 4.x 以上（連想配列・`[[ =~ ]]` 利用前提）
- [ ] `set -euo pipefail` を全スクリプト先頭に配置することを仕様として固定
- [ ] log artifact: 検証コマンドは `tee outputs/phase-5/p50-precheck.log` で保存

```bash
{ which gh git sed awk; bash --version | head -1; } 2>&1 \
  | tee outputs/phase-5/p50-precheck.log
```

## 5-A. `scripts/release/generate-release-notes.sh` 仕様

### 引数
| flag | 必須 | 値 | 用途 |
| --- | --- | --- | --- |
| `--tag` | 必須 | `vYYYYMMDD-HHMM` | release note の `{{TAG}}` 置換 |
| `--commit` | 必須 | 40 桁 commit SHA | `{{COMMIT}}` 置換 |
| `--changelog-path` | 任意 | path | Phase 12 changelog ファイルパス |
| `--evidence-url` | 必須 | URL | Phase 11 evidence の URL |
| `--template` | 任意 | path | 既定 `scripts/release/release-notes.template.md` |

### 入出力契約
- stdin: 不要
- stdout: 完成した release note markdown（**改行・順序が決定論的**）
- stderr: 進捗ログ（`[INFO]` / `[WARN]` prefix）
- 副作用: なし（ファイル書き出し禁止。呼び元が `>` でリダイレクト）

### 処理ステップ
1. 引数 parse（`--tag` `--commit` のいずれか欠落で exit 2）
2. template ファイル存在確認（不在で exit 3）
3. changelog 読み込み（`--changelog-path` 不在 or ファイル不在時は fallback 文言を埋め込み、`[WARN] changelog not found` を stderr 出力）
4. `sed -e 's/{{TAG}}/.../g'` 等で placeholder 置換（複雑な markdown は `awk` で section 単位）
5. evidence URL は `--evidence-url` の値をそのまま release note に埋め込む
6. stdout に書き出し → exit 0

### exit code
| code | 条件 |
| --- | --- |
| 0 | 正常 |
| 2 | 引数不正 |
| 3 | template / changelog 必須ファイル欠落（changelog は warn 扱いなので 3 にしない） |
| 4 | placeholder 残存検出（`grep -E '\{\{[A-Z_]+\}\}'` がヒット） |

## 5-B. `scripts/release/create-github-release.sh` 仕様

### 引数
| flag | 必須 | 値 | 用途 |
| --- | --- | --- | --- |
| `--tag` | 必須 | `vYYYYMMDD-HHMM` | release 対象 tag |
| `--dry-run` | 排他 | flag | markdown を stdout 出力して終了 |
| `--apply` | 排他 | flag | `gh release create` を実行 |
| `--changelog-path` / `--evidence-url` | 必須 | generate-release-notes.sh に転送 |

### 処理ステップ
1. tag format 検証: `[[ "$TAG" =~ ^v[0-9]{8}-[0-9]{4}$ ]]`、不一致で exit 2
2. tag 存在確認: `git rev-parse --verify "refs/tags/$TAG" >/dev/null` 失敗で exit 3
3. commit 解決: `COMMIT=$(git rev-parse "${TAG}^{commit}")`
4. tmp file: `mktemp -t release-notes.XXXXXX.md`（trap で cleanup）
5. `generate-release-notes.sh --tag $TAG --commit $COMMIT ...` を呼び、tmp に redirect
6. `--dry-run`: tmp の内容を stdout に cat → exit 0
7. `--apply`: `gh release create "$TAG" --notes-file "$TMP" --target "$COMMIT"` 実行。`--draft` 指定時は draft release とする
8. `gh` 失敗時 exit 5、成功時 release URL を stdout に出力

### exit code
| code | 条件 |
| --- | --- |
| 0 | 正常 |
| 2 | tag format 不一致 / 引数不正（`--dry-run` と `--apply` 同時指定など） |
| 3 | tag が local に不在 |
| 4 | generate-release-notes.sh が非 0 |
| 5 | `gh release create` 失敗 |

### エラーハンドリングルール
- `set -euo pipefail` 必須、`trap 'rm -f "$TMP"' EXIT` で tmp 確実 cleanup
- secret は決して echo / log しない（`gh` の `GITHUB_TOKEN` は環境変数経由で渡す）
- 既存 release が同名 tag に存在する場合は `gh release view "$TAG" >/dev/null 2>&1` で先に検出し、stderr に明示して exit 5（上書き禁止）

## 動作確認チェックリスト（仕様確定）
- [ ] 2 スクリプトの引数表が確定
- [ ] exit code 表が確定
- [ ] template / changelog 不在時の挙動が確定
- [ ] 同名 tag 既存時の上書き禁止が仕様化

## 次 Phase の前提条件
template の placeholder 命名規則と section 構造が Phase 6 で確定すること。
