# Lessons Learned — shell script + redaction タスクパターン

> 起源: UT-06-FU-A logpush-target-diff-script-001 (2026-05-02)
> Feedback 源: `docs/30-workflows/completed-tasks/ut-06-fu-a-logpush-target-diff-script-001/outputs/phase-12/skill-feedback-report.md`
> 関連 outputs:
> - `outputs/phase-02/redaction-rules.md`
> - `outputs/phase-05/script-implementation.md`
> 関連 references: [phase-template-core.md](../references/phase-template-core.md) / [phase-template-execution.md](../references/phase-template-execution.md) / [quality-gates.md](../references/quality-gates.md) / [quality-standards.md](../references/quality-standards.md)

## 適用条件

以下を **同時に満たす** タスクで本パターンを使う。

1. taskType = implementation で、成果物が **shell script (`scripts/**/*.sh`)** を含む
2. visualEvidence = NON_VISUAL（CLI 出力のみで完了判定）
3. 機密情報 (API token / Authorization header / OAuth / AWS key / URL credential 等) を **redact してから stdout/stderr に出す** 不変条件がある
4. 規模が小〜中 (200 行以下 / 単一スクリプト + 1〜2 lib)

## パターン本体

### 1. Phase 1〜2 の統合判断

- 小規模 shell script タスクでは Phase 1（要件分解）と Phase 2（設計）を **`phase-01-02` 統合 main.md** にしてもよい
- 統合可否の判定:
  - AC 数が 8 件以下
  - 設計の主要関心が「CLI interface + redaction policy」のみ
  - 外部 API 呼び出しが 1 種類 (例: Cloudflare API) に閉じる
- 統合する場合も **redaction policy は独立した `redaction-rules.md` を必ず分離** する（不変条件を 1 箇所に集約するため）
- 13 phase の枠は維持しつつ、Phase 1/2 が同一ファイルになる軽量化のみ許容

### 2. redaction policy は単一ファイルに集約する

`outputs/phase-02/redaction-rules.md` 1 ファイルに以下をまとめる:

- **allowlist**: 出力可能な値（Worker 名 / dataset 名 / host 部 / boolean flag / sampling rate 等）
- **denylist**: 置換対象の正規表現テーブル（ID / 種別 / regex / 置換後）
- **適用範囲**: stdout / stderr / log file の方針
- **golden 安定化**: LF / 末尾改行 / 動的値 placeholder 化ルール

> NG: 「stdout も redact」「一時ファイル禁止」「on-memory のみ」を C-2 / C-6 / C-7 と複数 constraint に分散して書く（運用時に追跡しづらい）
> OK: redaction-rules.md の "適用範囲" 1 セクションに集約し、Phase 1 constraint からは参照のみ

### 3. regex design rule（macOS BSD sed / GNU sed 互換）

- **POSIX 文字クラスのみ使用**: `[:space:]` / `[:alnum:]` / `[:alpha:]` / `[:digit:]` を使う。`\s` / `\w` / `\d` など Perl 系拡張は使わない
- **bracket expression `[...]` 内に `?` を置かない**: BSD sed は `[^/?...]` の `?` を literal でなくメタ扱いする処理系が存在する。代わりに `[^/[:space:]]+` のように POSIX class で組み立てる
- **bracket expression 内で literal が必要な特殊文字** (`-` `]` `^`): 位置で escape する（`-` は末尾、`]` は先頭、`^` は先頭以外）
- **prefix 付きトークン (Bearer / ya29 / AKIA / Authorization:) は generic catch-all より先に処理**: 適用順序は「具体性が高い → 低い」の単調減少を守る
- 生成 regex は **`bash` + `sh` (POSIX) + macOS BSD sed + GNU sed** の 4 環境で smoke 確認することを Phase 5 / Phase 9 に組み込む

#### redaction 適用順テンプレート（実証済み）

```
1. R-02a Authorization header 値        (prefix: "authorization:")
2. R-02b Bearer / Basic header 値       (prefix: "bearer " / "basic ")
3. R-06  OAuth token (Google ya29)      (prefix: "ya29.")
4. R-04  AWS Access Key                 (prefix: "AKIA")
5. R-05  named credentials (key=val)    (prefix: "dataset_credential" 等)
6. R-01  generic 40+ char random        (no prefix, sweep)
7. R-03  URL query string after host    (anchor: "?")
```

根拠: 特定 prefix を持つパターンを先に保護的 marker (`***REDACTED_*` 等) に置換 → 最後に generic catch-all で sweep する。逆順だと R-01 が Bearer token を `***REDACTED_TOKEN***` で先に潰してしまい、種別情報を失う。

### 4. Phase 9 quality gate に shellcheck を含める

shell script を成果物に含むタスクでは Phase 9 (品質ゲート) のチェックリストに以下を必ず入れる:

| 項目 | 実行コマンド | 合格基準 |
| --- | --- | --- |
| shellcheck | `shellcheck -x scripts/<target>.sh scripts/lib/<lib>.sh` | warning 0 (info は要件次第) |
| shfmt | `shfmt -d -i 2 -ci scripts/<target>.sh` | diff 0 |
| bash -n | `bash -n scripts/<target>.sh` | exit 0 |
| POSIX sed smoke | macOS / linux 両方で smoke 実行 | golden 一致 |
| redaction unit test | `tests/unit/<lib>.test.sh` | 全 R-* 行に対し PASS |

CI で shellcheck job が未整備な場合は Phase 9 main.md にその旨を **明示**（"CI 未整備のためローカル実行で代替" と記録）し、後続タスクで CI 整備を起こす。

### 5. AC × TC 番号空間を Phase 4 / 6 で分離する

- Phase 4 (テスト戦略 / unit) → TC-01..TC-06
- Phase 6 (異常系 / integration) → TC-07..TC-12
- 番号空間を分けると「どの phase で carry した TC か」が一目で追える
- redaction module の unit test は Phase 4 範囲、script 全体の smoke は Phase 6 範囲、と境界を AC 単位で記述する

## 必須チェック

- [ ] redaction policy を `outputs/phase-02/redaction-rules.md` 1 ファイルに集約した（denylist / allowlist / 適用範囲 / golden ルール）
- [ ] denylist regex が POSIX 文字クラスのみで構成されている（`\s` / `\w` / `\d` 不使用）
- [ ] bracket expression 内に `?` などメタ文字解釈が処理系依存の文字を含めていない
- [ ] redaction 適用順が「具体性高 → 低」の単調減少になっている
- [ ] Phase 9 main.md に shellcheck / shfmt / bash -n / POSIX smoke の合格基準を明示した
- [ ] Phase 4 / Phase 6 の TC 番号空間が分離されている
- [ ] Phase 1〜2 統合する場合でも redaction-rules.md は独立ファイルとして残した

## やってはいけないこと

- redaction 不変条件を constraint C-* に分散して redaction-rules.md を作らない
- Perl 系 regex 拡張 (`\s` / `\d` / `\w` / non-greedy) を sed パイプに直接書く
- generic catch-all (40+ 文字 sweep) を prefix 付き credential パターンより先に適用する
- shellcheck / shfmt を Phase 9 から省く（warning が後続タスクでバグ化する）
- Phase 1/2 を統合した結果として redaction-rules.md を Phase 1 constraint 内に inline 化する

## 参照実例

- `docs/30-workflows/completed-tasks/ut-06-fu-a-logpush-target-diff-script-001/outputs/phase-02/redaction-rules.md`
- `docs/30-workflows/completed-tasks/ut-06-fu-a-logpush-target-diff-script-001/outputs/phase-05/script-implementation.md`
- `docs/30-workflows/completed-tasks/ut-06-fu-a-logpush-target-diff-script-001/outputs/phase-12/skill-feedback-report.md`
- 実装本体: `scripts/observability-target-diff.sh` / `scripts/lib/redaction.sh`
