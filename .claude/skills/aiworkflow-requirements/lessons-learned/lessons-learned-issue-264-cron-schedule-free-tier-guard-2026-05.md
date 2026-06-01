---
timestamp: 2026-05-31T00:00:00Z
branch: docs/issue-264-cron-schedule-free-tier-guard-spec
author: claude-code
type: lessons-learned
task: docs/30-workflows/completed-tasks/issue-264-cron-schedule-free-tier-guard/
skill: aiworkflow-requirements
related-files:
  - apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts
  - apps/api/wrangler.toml
  - .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
---

# Issue #264: wrangler cron free-tier guard（zero-dep TOML パース）実装での苦戦点

CLOSED Issue #264 の obsolete な「Sheets 24h staging 実測」要求を、現行 Forms ベースの
3-cron free-tier 制約を守る回帰ガードへ再スコープし、`apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts`
として実装した。依存追加ゼロで `apps/api/wrangler.toml` の `[triggers]` / `[env.production.triggers]` /
`[env.staging.triggers]` を `["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` に固定し、3 本以下・legacy
`0 * * * *` 不在をテストで担保する。TOML を専用パーサなしの正規表現だけで section 単位に抽出する過程で、
fetch mock では露見しない複数のエッジケースに遭遇した。本ファイルは将来同種の「設定ファイル invariant を
guard test 化する」タスクを高速に解くための知見を記録する。

---

## L-I264-001: section header の部分文字列衝突（素朴 `indexOf` は誤検出する）

`"[triggers]"` は `"[env.staging.triggers]"` / `"[env.production.triggers]"` の**末尾部分文字列**である。
素朴な `tomlText.indexOf("[triggers]")`（Phase 12 implementation-guide の初稿 L70 が採用していた版）では
default セクションを探したつもりで env セクションを誤ヒットし得る。shipped 実装は行アンカー付き正規表現
`new RegExp('^\\[' + escaped + '\\]\\s*(?:#.*)?$', 'm')`（spec L21）で `^...$` 行境界に固定し、
末尾コメント `# ...` も許容して一意化した。

**教訓**: TOML/INI 系の section 名は他 section の suffix になり得るため、見出し探索は必ず
`^\[name\]$` 行アンカーで行う。substring 一致は使わない。implementation-guide の参照実装が
素朴版のまま残ると将来の流用で同じ罠を踏むため、ガイドと shipped 実装は同一手法へ揃える。

## L-I264-002: `headerMatch.index === 0` の falsy 判定（先頭 section を absent と誤認しかけた）

`if (!headerMatch?.index)`（spec L23）は、見出しがファイル**先頭**にあると `index === 0` で `!0 === true`
となり「未発見」分岐に入りかける。実際は内側で `if (!headerMatch) return []` のみ実行し、`headerMatch` が
真値なので素通りし、L27 の `headerMatch.index ?? 0` で 0 を正しく復元している。動作は正しいが
「`0` を falsy として absent 扱いする」典型バグの構造を残している。

**教訓**: `match.index` の存在判定に truthy チェックを使わない。`index === 0`（先頭マッチ）は valid。
`headerMatch == null` で存在を判定し、offset は `?? 0` で補完する。

## L-I264-003: section 名の `[` `]` `.` は RegExp メタ文字（二段正規化が必要）

`env.staging.triggers` の `.` や bracketed 入力 `"[triggers]"` の `[` `]` を正規表現へ素のまま埋めると
意図しないマッチになる。実装は `normalizeSectionHeader`（L15-17, `^\[` / `\]$` を剥がす）で bracketed /
非 bracketed の両入力を吸収し、`escapeRegExp`（L11-13）でメタ文字をエスケープしてから RegExp を組む二段処理にした。
テスト L89-93 が `"[triggers]"` 入力で同結果になることを担保する。

**教訓**: 動的に組む RegExp の埋め込み値は必ず escape。利用側が括弧付き/なしの両方を渡し得る API は
入力正規化を先に通す。

## L-I264-004: 行コメント除去の順序依存（配列キャプチャ前に `#.*$` を消す）

`# crons = ["0 * * * *"]` のようにコメントアウトされた legacy cron を誤って拾わないため、配列を
キャプチャする**前**に section body の各行から `#.*$` を除去する（spec L31-34）。これは cron 式自体に
`#` が出現しない前提に安全性を依存している（cron 構文上 `#` は曜日の nth 指定に使われ得るが、本プロジェクトの
3 式は未使用）。テスト L95-98 がコメント行無視を担保。

**教訓**: 設定値抽出はコメント除去 → 値抽出の順序を固定する。除去を後段にすると commented-out 値を
拾う。値構文にコメント記号が現れ得る場合は前提を lessons / ガイドに明記する。

## L-I264-005: 複数行 cron 配列のキャプチャ（`[^\]]*` が改行を含む）

`crons = [\n  "0 18 * * *",\n  "*/15 * * * *",\n]` のような複数行配列に対応するため、
`/crons\s*=\s*\[([^\]]*)\]/m`（spec L35）の `[^\]]*` が改行込みで `]` 直前まで貪欲にキャプチャする。
`.` ではなく否定文字クラスを使うことで `s`（dotAll）フラグ不要。テスト L106-110 が multiline を担保。

**教訓**: 角括弧で閉じる配列の中身は `[^\]]*` で取ると改行を跨げる。`.*` + dotAll より副作用が少ない。

## L-I264-006: 次 section への漏れ防止（`afterHeader.search(/^\s*\[/m)` で body を限定）

見出し直後から次の `[...]` 見出しの直前までを section body に切り出さないと、次 section の `crons` を
誤読する（spec L29）。`search(/^\s*\[/m)` で次 section 開始位置を求め、無ければ末尾までを body とする。
テスト L100-104 が「次 section の crons を読まない」ことを担保。

**教訓**: section 単位抽出では「次見出しまで」の上界を必ず設ける。見出し検出だけで下界を切らないと
ファイル全体が 1 section の body になる。

## L-I264-007: CLOSED / obsolete issue の再スコープ判定（再 open せず真の残課題へ付け替え）

Issue #264 の原 AC「Sheets 24h staging 実測で cron 間隔を決める」は、Sheets→Forms 移行と 3-cron 確定で
**陳腐化**していた。実測で間隔を決める作業は不要（解析で確定済み）だが、「確定した 3 本が将来 4 本目混入や
legacy 再登録で壊れない保証」が欠けている点が真の残課題と再定義した。Issue を再 open せず、
`artifacts.json.metadata.supersedes` に旧 unassigned task
（`U-UT01-02-cron-interval-staging-measurement.md`）を記録し、間隔測定要求を guard test へ付け替えた。

**教訓**: CLOSED issue の obsolete AC は「要求自体が陳腐化」と「未達の本質課題」を分離する。
陳腐化部分は supersede 記録のみ、本質課題だけを実行可能な成果物に落とす。再 open は不要。

## L-I264-008: 文書だけでは drift を防げない → 実行可能 guard で enforcement 化（CONST_004）

cron 予算（free-tier 5 本上限に対し 3 本）は ADR / deployment-cloudflare.md の解析記述で結論できるが、
**文書は 4 本目の混入や legacy `0 * * * *` の再登録を検知できない**。そこで「解析で結論が出る ⇒ 実測不要 /
drift 防止 ⇒ test 必須」の二段構えとし、wrangler.toml を読む guard spec を実行可能な enforcement として追加した。
default / staging / production の 3 section parity もテストで固定（spec の parity test）。

**教訓**: 「予算・上限・一致」系の invariant は文書化に加えて必ず guard test で固定する。文書は意思決定の
記録、test は drift の番人として責務分離する。zero-dep を守るなら専用パーサを足さず正規表現 + 既存 vitest で閉じる。
