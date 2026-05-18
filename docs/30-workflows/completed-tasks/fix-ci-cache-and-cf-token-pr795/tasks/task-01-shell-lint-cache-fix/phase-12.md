# Phase 12 — ドキュメント更新 (task-01)

本ファイルは canonical 9 headings に準拠した implementation-guide の **テンプレート骨子**を提供する。後続実装フェーズで Part 1 (中学生レベル概念) / Part 2 (技術詳細) を埋める。

## 1. このタスクで何をしたか (Part 1: 中学生レベル)

> (実装後に埋める)
>
> 例: 「GitHub Actions というロボットが、毎回 PR ごとに自動でテストを走らせてくれている。そのロボットの設定の一部に『プログラムの部品を再利用するためのキャッシュ』という仕組みがあるが、今回シェルスクリプトのチェックだけする job ではその部品をそもそも準備しないため、キャッシュ機構が空振りしてエラーを吐いていた。今回の修正で『キャッシュを使うかどうか』を job ごとに選べるようにし、シェルスクリプトチェック job ではキャッシュをオフにした。」

## 2. 背景と動機 (Part 2)

> (実装後に埋める)
>
> - PR #795 マージ後も `workflow-shell-lint` job で `Path Validation Error` annotation が継続発生
> - 原因: `actions/setup-node@v4` の `cache: pnpm` が install 不実施の場合に pnpm store dir 未生成で post-cleanup が失敗
> - 影響: dev branch protection の required check 候補が常時 annotation 出力で red 化リスク

## 3. 設計判断 (Part 2)

> (実装後に埋める。Phase 2 の採用案 A1 を要約)
>
> - 採用: `setup-project` composite に `cache` input を追加し、`install: 'false'` caller のみ `cache: ''` で無効化
> - 不採用 A2: composite 回避 (再利用性損失)
> - 不採用 A3: `continue-on-error` 握り潰し (根本原因隠蔽)

## 4. 実装の要点 (Part 2)

> (Phase 5 の diff を引用)

## 5. テストと検証 (Part 2)

> (Phase 4 / Phase 11 の検証経路を要約)

## 6. 影響範囲 (Part 2)

> (Phase 6 / Phase 7 の caller マトリクスと grep 結果を貼付)

## 7. リスクと緩和 (Part 2)

> (Phase 2 §リスクを転記)

## 8. 運用ガイド (Part 2)

> (実装後に埋める)
>
> - 新たに `install: 'false'` の caller を追加する場合は `cache: ''` も同時指定する
> - 通常の caller (`install: 'true'`) は default で pnpm cache が効くため指定不要

## 9. 参照 (Part 2)

- `docs/30-workflows/fix-ci-cache-and-cf-token-pr795/SCOPE.md`
- `outputs/phase-1/phase-1.md` / `outputs/phase-2/phase-2.md` / `outputs/phase-3/phase-3.md`
- `.github/actions/setup-project/action.yml`
- `.github/workflows/ci.yml`
- `actions/setup-node@v4` README (cache disable 動作仕様)

---

## テンプレート利用ルール

後続実装者は以下を遵守:

- Part 1 (上記 §1) は中学生でも理解できる比喩を必ず含める
- Part 2 (§2-9) は技術用語を正確に使う
- canonical 9 headings の順序・見出し文言を変更しない (`verify:phase12-compliance` gate)
- Phase 11 evidence 表 (run URL / conclusion) を §5 に転記
