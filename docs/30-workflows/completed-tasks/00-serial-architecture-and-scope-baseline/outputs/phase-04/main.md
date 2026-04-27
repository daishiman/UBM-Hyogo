# Phase 4 出力: main.md
# 事前検証手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | architecture-and-scope-baseline |
| Phase | 4 / 13 (事前検証手順) |
| 作成日 | 2026-04-23 |
| 状態 | completed |
| 入力 | outputs/phase-03/main.md (総合判定: PASS / GO) |

---

## 1. 検証コマンド一覧表

本タスクは docs-only であるため、全ての検証はファイルシステムとドキュメント内容の確認を通じて行う。実サービスへのアクセスは不要。

| # | コマンド | 目的 | 期待結果 |
| --- | --- | --- | --- |
| V-01 | `git diff --stat -- doc/00-serial-architecture-and-scope-baseline` | このタスクの変更範囲が doc 配下に限定されていることを確認 | `doc/00-serial-architecture-and-scope-baseline` 配下のファイルのみ差分に含まれること。`apps/` `packages/` 等のコード領域に差分がないこと |
| V-02 | `rg -n "dev\|main\|D1\|Sheets\|1Password" doc/00-serial-architecture-and-scope-baseline` | 主要キーワード (ブランチ名/サービス名/シークレット管理) が全出力ファイルで正しく使われているか横断確認 | `dev` / `main` がブランチ名として使用されている。`D1` が canonical DB として参照されている。`Sheets` が入力源 (non-canonical) として参照されている。`1Password` がローカル秘密情報の正本として参照されている |
| V-03 | `find doc/00-serial-architecture-and-scope-baseline/outputs -type f` | 全 Phase の成果物ファイルが所定のパスに存在することを確認 | Phase 1〜12 の全 outputs ファイルが一覧に含まれること。Phase 13 は未完了のため除外 |
| V-04 | `rg -n "develop" doc/00-serial-architecture-and-scope-baseline` | 旧表記 `develop` が残っていないことを確認 (DRY 化前提) | ヒットなし。全箇所が `dev` に統一されていること |
| V-05 | `rg -n "OpenNext" doc/00-serial-architecture-and-scope-baseline` | 非採用案 OpenNext の記述が採用設計に混入していないことを確認 | decision-log.md の NA-02 説明文のみにヒット。canonical-baseline.md や runbook には含まれないこと |
| V-06 | `rg -n "実値\|password\|token\|secret" doc/00-serial-architecture-and-scope-baseline` | シークレット実値がドキュメントに混入していないことを確認 | 実値の文字列がヒットしないこと。`placeholder` や `<YOUR_*>` 形式のみ許容 |
| V-07 | `rg -rn "outputs/phase-" doc/00-serial-architecture-and-scope-baseline/index.md` | index.md から各 Phase outputs への参照パスが正しいことを確認 | 全 Phase (1〜13) の参照パスが index.md に記載されていること |

---

## 2. 期待出力表（検証項目 × PASS 条件）

| 検証項目 | 検証対象 | PASS 条件 | 判定方法 |
| --- | --- | --- | --- |
| 変更範囲限定 | git diff の出力範囲 | `doc/00-serial-architecture-and-scope-baseline` 配下のみに変更が存在する | V-01 コマンドの出力をレビュー |
| ブランチ記法統一 | 全 outputs ファイル | `dev` / `main` / `feature/*` の3種類のみ。`develop` `master` `staging` 等は不使用 | V-02 / V-04 コマンドの出力をレビュー |
| D1 canonical 参照 | canonical-baseline.md / decision-log.md | D1 が canonical、Sheets が non-canonical として全箇所で一貫して記述されている | V-02 コマンドの出力をレビュー |
| 1Password ローカル秘密情報の正本 | シークレット配置マトリクス | 1Password Environments が local secret source として canonical-baseline.md に記載されている | V-02 コマンドの出力をレビュー |
| 成果物存在確認 | outputs 配下の全ファイル | Phase 1〜12 の出力ファイルが全て存在する | V-03 コマンドの出力をレビュー |
| シークレット漏洩なし | 全 outputs ファイル | 実値のシークレットが含まれない | V-06 コマンドの出力をレビュー |
| 非採用案の混入なし | canonical-baseline.md | OpenNext, develop ブランチ, Sheets canonical の記述が設計本文に含まれない | V-04 / V-05 コマンドの出力をレビュー |
| AC-1 充足 | canonical-baseline.md セクション3 | web/api/db/input source の責務境界が1行で定義されている | 目視確認 |
| AC-2 充足 | canonical-baseline.md セクション2 | feature→dev→main と local→staging→production の対応表が完全に記載されている | 目視確認 |
| AC-3 充足 | decision-log.md DL-03/DL-04/NA-01 | Google Sheets input / D1 canonical の判断根拠が記録されている | 目視確認 |
| AC-4 充足 | decision-log.md セクション3 | OOS-01〜OOS-08 でスコープ外が分離されている | 目視確認 |
| AC-5 充足 | phase-03/main.md セクション1 | 価値性/実現性/整合性/運用性の4条件が PASS と判定されている | 目視確認 |

---

## 3. Phase 5 への引き継ぎ

### Blockers

なし。Phase 4 の事前検証手順策定時点で MAJOR 項目は検出されなかった。

### Open Questions

| # | 質問 | 対応先 | 優先度 |
| --- | --- | --- | --- |
| OQ-04-01 | `rg` コマンドが実行環境にインストールされていない場合、`grep -rn` で代替可能か確認 | 実行者の環境依存 / `grep -rn` で代替可 | LOW |
| OQ-04-02 | index.md の Phase 参照パスは Phase 12 成果物作成後に更新が必要か | Phase 12 完了時に確認 | LOW |

### Phase 5 実行時の注意事項

- docs-only タスクのため、Phase 5 では「実値ファイルではなく runbook と placeholder を成果物にする」方針を明示すること
- 検証コマンド (V-01〜V-07) は Phase 5 完了後の sanity check として再実行可能な形式で維持すること
- Phase 5 の sanity check では scope 外サービス (通知基盤等) が追加されていないことを必ず確認すること

---

## 完了確認

- [x] 検証コマンド一覧表作成済み (V-01〜V-07 / 7件)
- [x] 期待出力表作成済み (12検証項目)
- [x] Phase 5 への引き継ぎ記載済み (blockers なし)
- [x] AC-1〜AC-5 との対応付け確認済み
