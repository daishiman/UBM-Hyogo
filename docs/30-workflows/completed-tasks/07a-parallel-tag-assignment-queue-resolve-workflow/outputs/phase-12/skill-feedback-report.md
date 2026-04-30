# skill feedback report

## 仕様 vs 既存 code drift の対処パターン

本タスクでは仕様（`candidate/confirmed/rejected`）と既存実装（`queued/reviewing/resolved`）の drift があり、application 層 alias で解決した。
このパターンは、Wave をまたいで仕様改版が積み重なった際に再発し得るため、`task-specification-creator` skill に「実装着手前に既存 schema と spec の status enum を照合する」というガード step を追加すると効率的。

反映済み: `.claude/skills/task-specification-creator/references/phase-template-core.md` の Phase 2 ポイントに、仕様語 ↔ 実装語の対応表と backend route / web client / shared zod / type / docs の追従対象明示を追加した。

## 既存 02b の transitionStatus / assignTagsToMember との関係

02b の repo helper を本 workflow で利用しなかった理由:
- `transitionStatus` は raw SQL の `WHERE status='queued'` race guard を内蔵していないため、本 workflow の guarded write では使えない
- `assignTagsToMember` は直接 tag 書き込み API として残るため、不変条件 #13 の観点では cleanup 対象になる

これは「02b の repo は CRUD に最適化、07a の workflow は guarded write に最適化」という責務の差が出た例。今後の repo 設計で「guarded-write-friendly な statement 返り値を返す関数」を別途用意すると 07b/c で再利用できる。

## test infra の良かった点

`setupD1` (Miniflare D1 + migration loader) のおかげで unit / integration の境界がほぼ無くなり、workflow を本物に近い状態で test できた。新規 workflow 追加コストは「test fixture 1 個＋describe 1 個」で済んだ。
