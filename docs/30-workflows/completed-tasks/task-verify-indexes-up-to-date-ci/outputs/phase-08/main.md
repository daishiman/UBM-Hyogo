# Phase 8 — DRY 化 / リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase | 8 / 13 |
| 状態 | completed |
| 上流 | Phase 7（AC マトリクス全 PASS） |
| 下流 | Phase 9（品質保証） |

## 結論サマリ

既存 4 workflow（`ci.yml` / `backend-ci.yml` / `web-cd.yml` / `validate-build.yml`）と
新規 `verify-indexes.yml` の重複を棚卸しした結果、**共通 setup の reusable workflow /
composite action 化は本タスクでは見送る（YAGNI）**。命名規則 4 階層（workflow / job / step /
concurrency）と trigger / path filter は本 Phase で確定。navigation drift 4 件は Phase 12 へ TODO 化。

## 共通 setup 抽出可否（最重要決定）

| # | 対象 | Before | After | 理由 |
| --- | --- | --- | --- | --- |
| D-1 | pnpm / Node setup の 4〜5 行ブロック | `ci.yml` / `backend-ci.yml` / `validate-build.yml` で同一手順をインライン記述 | 同形のインラインを **そのまま許容**（reusable / composite 化は **見送り**） | (a) 既存稼働 workflow の改変リスクあり、(b) gate 1 本のために共通化は YAGNI、(c) 将来 skill index 検証が増えた段階で `.github/actions/setup-pnpm-node` に切り出す方が責務明確、(d) AC-5 既存 CI 非衝突を最大限尊重 |
| D-2 | Node 24.15.0 / pnpm 10.33.2 のバージョン値 | 各 workflow に直書き | 現状維持（`verify-indexes.yml` も直書き） | (a) `.mise.toml` を SoT とする運用に既存 workflow も追従していない、(b) 本タスクで先行統一は scope 越境、(c) Phase 12 で「将来 reusable 化前提」として申し送る |
| D-3 | concurrency group 命名 | 既存 4 workflow は workflow 単位で独立 group | `verify-indexes-${{ github.ref }}` を採用 | AC-5 衝突回避の structural 担保。既存と同じ命名パターン（`<workflow-key>-${{ github.ref }}`）踏襲 |

## 命名規則（本タスクで確定）

| 種別 | After（確定） | 理由 |
| --- | --- | --- |
| workflow file 名 | `verify-indexes.yml` | 既存 4 workflow が kebab-case |
| workflow `name:` | `verify-indexes-up-to-date` | Required Status Checks 欄での発見性。元タスクの gate 名と一致 |
| job id | `verify-indexes-up-to-date` | workflow `name` と一致させ、Required Status Checks の文字列マッチで迷わない |
| step id（drift 検出） | `Detect drift` | 用途明示 |
| concurrency group | `verify-indexes-${{ github.ref }}` | 同一 ref 内のみで cancel-in-progress |

## trigger / path filter 統一

| 項目 | After | 理由 |
| --- | --- | --- |
| `on.pull_request.branches` | `[main, dev]` | 既存 ci.yml と同一構造 |
| `on.push.branches` | `[main, dev]` | 既存 web-cd.yml と整合 |
| paths filter | **採用しない**（全 PR で起動） | drift は generate-index.js / package.json の変更でも発生しうる。誤った paths filter は false negative の温床 |
| concurrency.cancel-in-progress | `true` | F-08 連続 push 時の旧 run cancel |

## navigation drift 棚卸し（Phase 12 TODO）

| # | 対象 | 現状 | 期待 After（Phase 12 で確定） |
| --- | --- | --- | --- |
| N-1 | `CLAUDE.md` の「よく使うコマンド」 | `pnpm indexes:rebuild` のみ | 「CI gate `verify-indexes-up-to-date` が drift を検出」を 1 行追記 |
| N-2 | `README.md` | 未調査 | CI 章があれば gate 名を最小追記 |
| N-3 | `.claude/skills/aiworkflow-requirements/SKILL.md` 等 | post-merge 廃止後の文面に未追従の可能性 | grep で `post-merge` / `indexes:rebuild` を洗い、CI gate 経路に誘導 |
| N-4 | `doc/00-getting-started-manual/lefthook-operations.md` | post-merge 廃止経緯のみ | 「CI 側 authoritative gate = `verify-indexes-up-to-date`」リンク追記 |

> 本 Phase は棚卸しと TODO 化のみ。実書換は Phase 12 で実施。

## test / fixture の DRY

本タスクは workflow 1 本追加であり、unit test / fixture を伴わない。Phase 4 のテスト戦略
（連続 2 回実行 / 意図的 drift fail）は手動 smoke（Phase 11）と CI 上の自然 PASS で代替。

## Before / After 集約

| カテゴリ | Before | After | 削減 |
| --- | --- | --- | --- |
| 共通 setup 抽出 | インライン重複 4 箇所 + 新規 1 = 5 箇所 | 5 箇所（抽出見送り） | 0%（YAGNI 判定） |
| 命名 | 4 種以上の揺れ候補 | kebab-case + gate 名一致で 1 種 | 100% |
| trigger / path filter | path filter で誤限定する選択肢 | 全 PR + main/dev push（filter なし） | 揺れ 0 |
| navigation drift | 4 箇所未棚卸し | 4 箇所を Phase 12 TODO 化 | 棚卸し 100% |
| test 重複 | N/A | N/A | — |

## 完了条件

- [x] 共通 setup 抽出を「見送り」と明示し理由 4 点を記録
- [x] 命名規則が workflow / job / step / concurrency の 4 階層で確定
- [x] navigation drift 4 件が Phase 12 TODO として棚卸し済み
- [x] Before/After 集約 5 カテゴリが一致
- [x] AC-5（既存 CI 非衝突）に違反する命名 / concurrency が無い

## 次 Phase

Phase 9 へ命名確定（job id / concurrency group）と navigation drift TODO（N-1〜N-4）を引き継ぐ。
共通 setup 抽出は本タスクでは行わない（YAGNI 判断）。
