---
phase: 12
title: Compliance check — canonical 9 headings / 中学生説明
workflow_id: ut-cicd-composite-setup-rollout
status: completed
---

# Phase 12: Compliance Check

[実装区分: 実装仕様書]

## 1. なぜこの Phase が必要か（中学生にも分かる説明）

### composite action とは何か

GitHub Actions では、「checkout する」「Node を入れる」「pnpm を入れる」「依存をインストールする」
という**準備の手順**を、たくさんのワークフロー（CI 設定ファイル）が毎回繰り返し書いています。

**composite action（コンポジット・アクション）** とは、これらの繰り返し手順を **1 箇所にまとめて、別の場所から呼び出して使い回す仕組み** です。
例えるなら、「お弁当の準備」を毎朝「ご飯を炊く・おかずを焼く・水筒を入れる」と全部書くのではなく、
「お弁当準備セット.yaml」を 1 個作っておいて、毎朝「お弁当準備セット使う」と一言書くだけで済むようにする工夫です。

### なぜ DRY 化するのか

DRY（Don't Repeat Yourself = 同じことを 2 回書かない）化すると、

- Node のバージョンを `24.15.0` から `24.16.0` に上げたい時、**1 ファイルだけ直せば全 18 workflow に反映** される
- pnpm のバージョンを変えたい時も同様
- cache 設定や install 経路を変えたい時も同様

になります。今は 13 workflow が「Node を入れる手順」を**全部別々にコピペで書いている**ため、
バージョンを上げたい時に 13 ファイル全部を直す必要があり、書き忘れが発生して環境差分（drift）の原因になっています。
これを `setup-project` という共通部品にまとめる、というのが今回のタスクです。

### どんなリスクがあるか

DRY 化すると、

- **共通部分（setup-project）の変更が全 workflow に同時波及する**

というリスクが生まれます。例えば setup-project に書かれた Node 24.15.0 を間違えて 22.0.0 に変えたら、
**18 workflow 全部が一気に壊れる** ことになります。
今までは個別に書かれていたのでバラバラに壊れるだけでしたが、共通化するとまとめて壊れます。

このリスクを抑えるため、

- composite action 自体を変更する PR はレビューを慎重にする
- 変更前後で 13 〜 18 workflow が依然 green であることを CI で確認する
- このタスクでは composite action 自体は**一切触らず**、呼び出し側 13 workflow だけを変更する

という方針にしています。

## 2. Self-check 項目

| # | チェック項目 | 検証コマンド |
|---|------------|--------------|
| 1 | Phase 1〜13 の md ファイルが 13 個揃っている | `ls docs/30-workflows/ut-cicd-composite-setup-rollout/phase-*.md \| wc -l` → `13` |
| 2 | 各 md の冒頭に YAML frontmatter（`phase:`/`title:`/`workflow_id:`/`status:`）がある | `head -6 phase-*.md` で目視 |
| 3 | 各 md の Phase 直後に `[実装区分: 実装仕様書]` が記載 | `grep -l '\[実装区分: 実装仕様書\]' phase-*.md \| wc -l` → `13` |
| 4 | `artifacts.json` が zod schema に通る | `mise exec -- pnpm exec tsx scripts/gate-metadata.ts` |
| 5 | `outputs/phase-11/` の必須 9 evidence ファイルが物理存在 | `ls outputs/phase-11/ \| wc -l` ≥ `9`（実装後） |
| 6 | workflow_state が `spec_created` または `runtime_pending` 以上 | frontmatter `status` を確認 |
| 7 | Phase 12 canonical 9 headings の SSOT に整合 | `mise exec -- pnpm exec tsx scripts/verify-phase12-compliance.ts` |

## 3. canonical 9 headings 整合（SSOT）

本 Phase 12 ファイルは task-specification-creator skill の Phase 12 SSOT に従って以下 9 headings を含む構造にする:

1. なぜこの Phase が必要か（中学生にも分かる説明）
2. Self-check 項目
3. canonical 9 headings 整合（SSOT）
4. workflow_state transition の整合
5. evidence 実在の整合
6. Phase 11 inventory との突合
7. 不整合時の対応
8. 自動 CI gate
9. 完了判定

## 4. workflow_state transition の整合

| 段階 | status | 遷移条件 |
|------|--------|---------|
| 仕様作成完了 | `spec_created` | Phase 1〜13 md が全件揃った時点 |
| 実装中 | `implemented_local_evidence_captured` / `runtime_pending` | 13 yaml 編集と local evidence 取得済、PR run の green 待ち |
| 実装完了 | `completed` | PR merge 完了 + Issue #284 close + evidence #1〜#9 取得済 |

本サイクルでは workflow yaml 13 件を実変更済み。root state は `implemented_local_evidence_captured`、Phase 13 は commit / PR / remote CI 待ちの `runtime_pending` とする。

## 5. evidence 実在の整合

Phase 11 inventory に記載した 9 evidence は `outputs/phase-11/` 配下へ物理配置済み。`ci-run-urls.md` は PR 作成後の remote CI URL 待ちとして存在ファイル内で境界を明示する。

## 6. Phase 11 inventory との突合

- [x] Phase 11 inventory の 9 evidence ファイル名と本 Phase 12 self-check §2 #5 の件数が一致
- [x] evidence ファイル名が `outputs/phase-11/` 直下の flat 配置（サブディレクトリなし）
- [x] visual evidence は NOT_APPLICABLE として artifacts.json の `metadata.visualEvidence` に明記

## 7. 不整合時の対応

| 不整合パターン | 対応 |
|--------------|------|
| Phase md 欠落 | 該当 Phase を新規作成し frontmatter を整える |
| frontmatter 不足 | `gate-metadata.ts` の出力を参照して修正 |
| evidence 欠落（実装サイクル時） | Phase 11 §2 のコマンドを再実行して生成 |
| `[実装区分:` 記載漏れ | 該当 phase md の Phase 見出し直後に追記 |
| canonical 9 heading 欠落 | 本 Phase 12 §3 の見出しを追加 |

## 8. 自動 CI gate

| gate | 役割 |
|------|------|
| `verify-phase12-compliance` | canonical 9 headings / Phase 11 evidence 表の物理存在を強制 |
| `verify-gate-metadata` | `artifacts.json` zod schema 検証 |
| `verify-indexes` | indexes drift 検出（本タスクは indexes 影響なし） |

## 9. 完了判定

- [x] §2 self-check 7 項目すべてパス
- [x] §3 canonical 9 headings がすべて存在
- [x] §4 workflow_state が `implemented_local_evidence_captured` で artifacts.json と一致
- [x] §6 Phase 11 inventory と evidence ファイル名が 1:1 で一致
- [x] §8 の自動 CI gate がローカル pre-push で green
