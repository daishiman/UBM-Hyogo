# Phase 6: テスト拡充 — issue-230-lefthook-edit-guard

> **[実装区分: 実装仕様書 / NON_VISUAL]**
> Phase 4 のハッピー / 基本ケースに加え、境界・異常系を追加して R-1..R-4 の堅牢性を高める。
> 追加先は同一 spec ファイル（`*.spec.ts`、invariant #8）。新規 spec ファイルは増やさない。

## 6.1 `lefthook-edit-guard.spec.ts` 追加ケース（境界・異常系）

`describe("lefthook-edit-guard.sh > boundary")` に追加する。

| ID | ケース | fixture / 前提 | 期待 exit | assertion / 意図 |
|----|--------|---------------|-----------|-----------------|
| LG-h | 複数 offender | `.git/hooks/pre-commit` と `.git/hooks/pre-push`（いずれも署名なし手書き）を同時に作る | `1` | 出力に `pre-commit` と `pre-push` の**両方**を含む（offender 累積が複数行で保持される＝process substitution が機能） |
| LG-i | CRLF 改行を含む手書き hook | `writeFileSync(.git/hooks/pre-commit, "#!/bin/sh\r\necho x\r\n")`（署名なし） | `1` | CRLF でも offender 検知される（`find -type f` はファイル名のみ評価し中身の改行に依存しない） |
| LG-j | hook がシンボリックリンク | `symlinkSync(target, .git/hooks/pre-commit)`（署名なしの実体を指す） | `1` | `find -maxdepth 1 -type f` はシンボリックリンクを `-type f` に含めないため**検知されない**ことが既定挙動。**期待は exit 0**（このケースは「検知しない」を明示的に固定する。誤検知防止の観点で安全側）。実装方針として symlink を offender に含めたい場合は `-type f,l` へ拡張するが、本タスクでは含めない（exit 0 を固定値とする） |
| LG-k | 空の `.git/hooks/`（ファイルなし） | `.git/hooks` ディレクトリは存在するが中身が空 | `0` | `find` 結果が空 → offender なし → pass |
| LG-l | `.git/hooks/` ディレクトリ自体が存在しない | `rmSync(.git/hooks, {recursive,force})` | `0` | `[ -d "$hooks_dir" ]` が false で検知ブロックを skip → pass（NPE 相当のエラーにならない） |
| LG-m | `lefthook.yml` の**削除のみ**を stage | `git rm lefthook.yml`（D = deleted を stage） | `0` | `--diff-filter=ACMR` は D（削除）を含まないため ack ゲート対象外 → pass（削除は別運用で扱う。誤ブロックしない） |
| LG-n | `lefthook.yml` を rename して stage（R） | `git mv lefthook.yml lefthook.yaml`（rename to = R） | `1`（ack 無） | `--diff-filter=ACMR` の R（rename to の新パス）が `lefthook.yml` でなくなるため**検知されない**＝期待 exit 0。**注**: rename の「to」が `lefthook.yml` でない限り対象外。逆に他ファイルを `lefthook.yml` へ rename した場合（to=lefthook.yml）は検知（exit 1）。本ケースは前者（to≠lefthook.yml）を固定し exit 0 とする |
| LG-o | `LEFTHOOK_EDIT_ACK` が `1` 以外の値（例 `0` / `true` / 空文字） | LG-b と同じ stage + `env.LEFTHOOK_EDIT_ACK="0"`（および `"true"`） | `1` | `!= "1"` 判定で `1` 厳密一致のみ通す（曖昧 ack を block） |
| LG-p | marker 網羅（`REBASE_HEAD` / `CHERRY_PICK_HEAD` / `REVERT_HEAD`） | 各 marker を順に `.git/<marker>` に作り、手書き hook + lefthook.yml stage を仕込む（3 パラメタライズ） | `0` | LG-g（MERGE_HEAD）と合わせ 4 marker すべてで skip されることを固定 |

### 補足
- **LG-j / LG-n は「検知しない」を固定するケース**。期待値は exit 0。実装の現挙動（`-type f` / `--diff-filter=ACMR`）を spec で凍結し、将来の意図しない挙動変更（過検知への drift）を検出する回帰ガードとする。表中の「期待 exit」を最終的に exit 0 で記述すること（説明文で誤解しないよう実装時に確定）。
- **LG-l** は `set -euo pipefail` 下で未定義ディレクトリ参照がエラー終了しないこと（防御的 `[ -d ]` ガード）を確認する重要ケース。

## 6.2 `verify-hook-integrity.spec.ts` 追加ケース（境界・異常系）

`describe("verify-hook-integrity.sh > boundary")` に追加する。

| ID | ケース | fixture / 前提 | 期待 exit | assertion / 意図 |
|----|--------|---------------|-----------|-----------------|
| VI-e | 複数の欠落参照 | `lefthook.yml` が `missing1.sh` と `missing2.sh` を参照（両方不在） | `1` | `::error::` が両 script について出力される（`fail=1` が累積で潰れない＝各検査が独立に動く） |
| VI-f | 引数付き `run:` 行（誤検出回避） | `run: bash scripts/hooks/foo.sh --changed --strict`（`foo.sh` は実在） | `0` | §3.4-3 補正で `--changed` / `--strict` を script path と誤検出しない＝exit 0 |
| VI-g | `node` ランナー参照 | `run: node scripts/lint-x.mjs --strict`（`lint-x.mjs` 実在） | `0` | runword が `node` でも第2トークン抽出が機能する |
| VI-h | `run:` 行が 1 本も無い lefthook.yml | commands なし or `run:` を含まない最小 YAML（`min_version` あり） | `0` | 参照抽出が空でも `while` が安全に何もしない（空入力ハンドリング） |
| VI-i | stray 候補だが `hooks/` 配下でない（誤検出回避） | `scripts/hooks/foo.sh` のみ tracked（`scripts/hooks/` は正規配置） | `0` | stray パターン `(^|/)hooks/(pre-commit\|...)` は `scripts/hooks/foo.sh` にマッチしない＝誤検出しない |
| VI-j | stray が途中パス（`apps/x/hooks/pre-commit`） | `apps/x/hooks/pre-commit` を tracked | `1` | `(^|/)hooks/` の `/` 前方一致で途中パスも捕捉する |
| VI-k | `lefthook.yml` 自体が不在 | repo に `lefthook.yml` を作らない | `1`（非ゼロ） | `grep ... lefthook.yml` がファイル不在で失敗 → 検査 C / A で fail。`set -e` で落ちる場合も**非ゼロ exit** であることを確認（exit 0 でないこと）。assertion は `code !== 0` |

### 補足
- **VI-f / VI-g** は Phase 3 §3.4-3 補正（第2トークン抽出）の回帰ガード。引数や runword 種別に頑健であることを固定する。
- **VI-k** は lefthook.yml 不在という異常系。`set -e` 下で `grep` がファイル不在エラーで落ちるか、明示 `fail=1` になるかは実装次第だが、**いずれにせよ非ゼロ exit** を期待値とする（exit 0 で素通りしないこと）。

## 6.3 パラメタライズ実装方針

- marker 網羅（LG-g + LG-p の 4 marker）は `it.each(["MERGE_HEAD","REBASE_HEAD","CHERRY_PICK_HEAD","REVERT_HEAD"])` でパラメタライズすると簡潔。
- ack 値網羅（LG-c + LG-o）は `it.each([["1", 0], ["0", 1], ["true", 1], ["", 1]])` でパラメタライズ可能。

## 6.4 実行コマンド

```bash
mise exec -- pnpm vitest run scripts/hooks/__tests__/lefthook-edit-guard.spec.ts scripts/__tests__/verify-hook-integrity.spec.ts
```

## 完了条件（Phase 6）

- `lefthook-edit-guard.spec.ts` に境界・異常系（複数 offender / CRLF / symlink / 空 hooks dir / hooks dir 不在 / 削除のみ stage / rename / 曖昧 ack / marker 網羅）が追加されている。
- `verify-hook-integrity.spec.ts` に境界・異常系（複数欠落 / 引数付き run / node ランナー / run なし / 誤検出回避 / 途中パス stray / lefthook.yml 不在）が追加されている。
- 「検知しない」を固定するケース（LG-j / LG-n / VI-f / VI-g / VI-i）が回帰ガードとして明記されている。
- 全ケースの期待 exit code が確定し、パラメタライズ方針が記述されている。
