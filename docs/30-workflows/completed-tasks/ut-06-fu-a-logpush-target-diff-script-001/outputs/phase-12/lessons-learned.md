# Lessons learned — UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001

本タスク実装中に遭遇した苦戦箇所・原因・解決策・再発防止を記録する。後続タスク (特に shell ベースの redaction / Cloudflare read-only ツール / `scripts/cf.sh` 拡張) で同じ罠を踏まないための参照資料。

## サマリ表

| # | 苦戦箇所 | 原因 | 解決策 | 再発防止 |
| --- | --- | --- | --- | --- |
| 1 | macOS BSD sed と GNU sed の文字クラス解釈差で R-03 URL redaction が初回失敗 | BSD sed は `[^/?...]` 内の `?` を「リテラル `?`」として扱うが、一部環境では `?` が前文字の量化子と曖昧解釈されパターンが想定通りに negate しない。GNU sed と挙動が一致せず、CI と開発機 (macOS) で結果が分岐 | 文字クラスを `[^?[:space:]]` 系の POSIX 文字クラス + 明示的な記号列挙に書き換え、BSD/GNU 両方で同一動作することを `tests/unit/redaction.test.sh` で固定 | redaction module の正規表現は (a) POSIX 文字クラス優先、(b) macOS (BSD) と Linux (GNU) の両方で unit test を回す、(c) 新規ルール追加時は両環境で fixtures を更新する |
| 2 | redaction の適用順序依存性で token prefix が消失 | R-01 (40 文字以上の英数字) を先に適用すると `ya29.xxxxx` (R-06) や `AKIA....` (R-04) の prefix も貪欲マッチで吸収され、特化ルールが届く前に `***REDACTED_TOKEN***` に一括置換される | 適用順序を **R-02 → R-06 → R-04 → R-05 → R-01 → R-03** に固定し、(1) header/credential 系 → (2) 形式が明確な token prefix → (3) generic random → (4) URL query の段階適用で特化情報を保護 | `scripts/lib/redaction.sh` の適用順序を関数最上部にコメントで明示し、unit test で順序依存ケース (`ya29.` 含む混在入力) を必ず 1 ケース以上含める |
| 3 | `cf.sh` 統合 vs スタンドアロン分離の方針転換による documentation 手戻り | 初期方針では「`cf.sh` に手を入れず `scripts/observability-target-diff.sh` をスタンドアロン公開」としていたが、運用入口を `cf.sh` に一元化するという既存ポリシー (CLAUDE.md `Cloudflare 系 CLI 実行ルール`) に整合させるため最終的に `observability-diff` / `api-get` を追加。documentation-changelog / implementation-guide が「変更ファイル: なし」のまま残り Phase-12 outputs に整合不一致が発生 | `scripts/cf.sh` に 2 サブコマンドを追加 (`observability-diff` / `api-get`) し、本 lessons-learned 作成と同時に Phase-12 outputs を実態反映に修正 | 「既存スクリプトに手を入れる/入れない」の方針は Phase-2 設計レビュー (Phase-3) までに確定させ、Phase-5 以降での方針転換時は Phase-12 outputs 更新を必須チェック項目化する |
| 4 | read-only 保証が 2 経路に分岐する設計上の難しさ | `cf.sh observability-diff` は呼び出し先 script の `cf_call` allowlist に依存、`cf.sh api-get` は curl default GET に依存。前者は wrangler サブコマンド allowlist、後者は HTTP method の暗黙デフォルトという**性質の異なる安全機構**。後者は `-X POST` 等を渡されると破綻するため、テストで固定化が必要 | `cf.sh api-get` 側で `/client/v4/...` パス prefix 限定 + 引数を 1 つに固定し `-X` を受け付けない構造に変更。integration test で経路ごとに read-only 性を独立に検証 | 新たに `cf.sh` へ external API 呼び出し subcommand を追加する場合は、(1) HTTP method の固定方法、(2) パス allowlist、(3) 引数本数を README/コメントに明記し、(4) integration test で mutation 不可能性を経路別に assert する |

## 補足説明

### 1 と 2 は redaction module の本質的な脆さ

`scripts/lib/redaction.sh` は単純な sed pipeline だが、(a) sed 方言差、(b) 適用順序、(c) 文字クラスの記号扱い、の 3 点が組み合わさると「ローカルで通って CI で落ちる」「prefix が消えて全部 generic redaction になる」といった silent failure を起こしやすい。今後ルールを追加する際は、**新ルール単体テスト + 既存ルールとの順序依存テスト + macOS/Linux 両環境テスト** の 3 軸を必ず回すこと。

### 3 は Phase-12 整合の構造的な弱点

「変更ファイルなし」という記述は実装初期時点で固定され、後続 Phase で実装方針が変わっても自動更新されない。Phase-12 では必ず `git diff main -- <変更ファイル候補>` を一度実行し、実態と documentation の整合を機械的にチェックする習慣を Phase-12 チェックリストに組み込むのが望ましい (本タスクは事後修正で対応)。

### 4 は今後の `cf.sh` 拡張の指針

`cf.sh` は (a) wrangler ラッパー、(b) shell script ラッパー (observability-diff)、(c) curl ラッパー (api-get) の 3 系統に分岐した。今後 (d) 別の curl 系 subcommand を追加する場合、`api-get` の構造を踏襲して「path prefix allowlist + 引数本数固定 + curl default method 依存」を採用するのが最小コスト。逆に POST/PUT を要する mutation 系を追加する場合は、別 subcommand に明示的に分け、本タスクの read-only 保証線を破らないこと。

## 関連 evidence

- `outputs/phase-11/redaction-verification.md` — redaction の現実 trace
- `outputs/phase-11/cf-sh-tail-cross-check.md` — `cf.sh` 経由の read-only 確認
- `tests/unit/redaction.test.sh` — 順序依存・sed 方言テスト
- `tests/integration/observability-target-diff.test.sh` — 経路別 read-only テスト
