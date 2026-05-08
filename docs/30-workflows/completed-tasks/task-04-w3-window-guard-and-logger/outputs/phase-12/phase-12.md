> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md
> 実装区分: 実装仕様書

# Phase 12: ドキュメント更新 / 引き継ぎ / コンプライアンス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-04-w3-window-guard-and-logger |
| Wave | W3 |
| 実行種別 | NON_VISUAL |
| Phase 番号 | 12 / 13 |
| 上流 Phase | 11（PASS 5 点 evidence） |
| 下流 Phase | 13（commit / PR） |
| 状態 | completed |
| CONST_005 準拠 | ○ |

## 目的

Phase 11 までの成果を **strict 7 outputs（`main.md` + 6 補助ドキュメント）**に固定化し、後続 task-05 / task-09..17 への引き継ぎ点（`isBrowser()` / `logger` / ESLint rule の使い方）を一意に確定する。中学生レベル説明（Part 1）と技術者レベル仕様（Part 2）を分離する。

## strict 7 outputs / 6 必須タスク

### 0. `outputs/phase-12/main.md`（必須）

Phase 12 のトップ index。strict 7 outputs の実体確認、Phase 11 runtime evidence pending の扱い、4 条件判定を集約する。

### 1. `outputs/phase-12/implementation-guide.md`（必須）

#### Part 1（中学生レベル / 概念説明）

- 章立て:
  1. **困りごと**: 「ブラウザだけにある便利グッズ `window` を、サーバ側でうっかり開けようとして箱が空でクラッシュ」
  2. **解決後の状態**: 「箱を開ける前に `isBrowser()` で『今ブラウザ？』と確認するルールに統一」
  3. **logger って何**: 「サイトで起きたことを毎回同じ書式（JSON 一行）でメモするノート。エラーは Sentry にも自動転送」
  4. **なぜ ESLint で禁止？**: 「うっかり `window.xxx` と書いたら CI が止めてくれる安全装置」
- 専門用語は出現箇所で 1 行説明（SSR / Workers / Tree-shaking 等）

#### Part 2（技術者向け / 設計と契約）

- 章立て:
  1. **ランタイム差異マトリクス**: SSR (Node) / Workers / Browser での `window` 可否、`process.env` 可否、`console` 形式
  2. **公開 API 契約** (`is-browser.ts` / `logger.ts` の export シグネチャ・task-04 §0.7 引用)
  3. **logger 使用例**（child logger / requestId 紐付け / error capture flow）
  4. **Tree-shaking 観点**: `isBrowser()` が 1 関数に閉じることで SSR bundle から `window.` 参照が落ちる仕組み
  5. **ESLint override 方針**: `instrumentation-client.ts` / `lib/sentry/**` を `overrides` で `'off'` にする理由
  6. **PII redaction の最小実装**: `email` / `name` を含む payload key を `***` 置換する allow-list 方式
  7. **後続 task の取り込みチェックリスト**（task-05 / task-11..17）

### 2. システム仕様書更新

参照対象: `docs/00-getting-started-manual/specs/`

- 既存 spec に「SSR 安全性」「観測（logger / Sentry）」の章があれば追記、なければ **参照リンクのみ記述** する（新規 spec 章は本 task では作らない）。
- 候補:
  - `docs/00-getting-started-manual/specs/00-overview.md` のランタイム概要に `isBrowser()` / `logger` 1 行追記の可否確認
- 成果物: `outputs/phase-12/system-spec-update-summary.md`
  - 章立て: 該当章 / 追記内容 / 追記不要の根拠 / 後続 spec 改訂の予約

### 3. ドキュメント更新履歴: `outputs/phase-12/documentation-changelog.md`

- 章立て:
  - 新規ファイル一覧（phase-11.md / phase-12.md / phase-13.md / 各 outputs/）
  - 既存ファイル変更一覧（spec 追記 / 参照差し込み）
  - 変更動機（task-04 完了による logger / SSR ガード基盤の固定）

### 4. 未タスク検出レポート: `outputs/phase-12/unassigned-task-detection.md`

- task-04 の grep で残存した `window.` 参照箇所のうち、**task-04 §3「変更対象ファイル」M（最小）の範疇を超え task-11..17 に委譲**するものを列挙。
- 0 件であっても本ファイルは作成する（`検出 0 件` を明記）。
- 章立て:
  - 検出コマンド（再現性確保）
  - 検出結果テーブル（path / line / 提案修正 / 委譲先 task）
  - チェックボックス転記用 markdown スニペット（task-11..17 仕様書に貼り付け可能な形式）

### 5. スキルフィードバック: `outputs/phase-12/skill-feedback-report.md`

3 観点で 1 セクションずつ:

- **テンプレート観点**: task-specification-creator skill が 13-phase で本 task を出した際に欠けた / 過剰だった項目
- **ワークフロー観点**: phase-11 の NON_VISUAL evidence 採取の自動化余地（grep-gate の CI gate 昇格提案）
- **ドキュメント観点**: `claude-design-prototype` 系仕様には載っていない「観測 / SSR 安全性」軸の正本不在を改善提案

### 6. タスク仕様書コンプライアンス: `outputs/phase-12/phase12-task-spec-compliance-check.md`

- 章立て:
  - phase ごとの準拠表（Phase 1〜13 / 状態 / 不足セクションの有無）
  - task-04 §9 DoD 全項目への evidence path 紐付け表
  - CLAUDE.md 不変条件（D1 直接アクセス禁止 / 平文 `.env` 禁止 / Cloudflare CLI ラッパー使用）の touch 確認

## 章立て統一ルール

各成果物は次の頭付けを必ず持つ:

```
> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md
> 実装区分: 実装仕様書
> 生成 phase: phase-12
```

## 実行手順

```bash
WORKDIR=docs/30-workflows/task-04-w3-window-guard-and-logger
mkdir -p $WORKDIR/outputs/phase-12

# 1. implementation-guide.md
$EDITOR $WORKDIR/outputs/phase-12/implementation-guide.md

# 2. system-spec-update-summary.md
$EDITOR $WORKDIR/outputs/phase-12/system-spec-update-summary.md

# 3. documentation-changelog.md
$EDITOR $WORKDIR/outputs/phase-12/documentation-changelog.md

# 4. unassigned-task-detection.md（再 grep して結果を貼る）
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n '\bwindow\.' src/ \
  | grep -v 'is-browser.ts' \
  | grep -v 'instrumentation-client.ts' \
  > /tmp/window-residual.txt
$EDITOR $WORKDIR/outputs/phase-12/unassigned-task-detection.md

# 5. skill-feedback-report.md
$EDITOR $WORKDIR/outputs/phase-12/skill-feedback-report.md

# 6. phase12-task-spec-compliance-check.md
$EDITOR $WORKDIR/outputs/phase-12/phase12-task-spec-compliance-check.md
```

## 統合テスト連携

| Phase | 内容 |
| --- | --- |
| 13 | implementation-guide.md / changelog を PR 本文に転記 |
| task-05 | logger.error 呼び出し点を `app/error.tsx` に組み込む際の参照 |
| task-11..17 | unassigned-task-detection.md のチェックボックスを各画面 task で消化 |

## 多角的チェック観点（不変条件参照）

- **CLAUDE.md 不変条件 #5**: D1 直接アクセス禁止 → logger payload に SQL / binding を入れない
- **CLAUDE.md 不変条件 #3**: ランタイムシークレット → logger に DSN / AUTH_SECRET を流さない
- **task-04 §0.5 #4**: 平文 `.env` 禁止 → logger 出力先は `getEnv()` 経由

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | implementation-guide.md (Part 1 + Part 2) | completed |
| 2 | system-spec-update-summary.md | completed |
| 3 | documentation-changelog.md | completed |
| 4 | unassigned-task-detection.md（0 件でも作成） | completed |
| 5 | skill-feedback-report.md | completed |
| 6 | phase12-task-spec-compliance-check.md | completed |
| 7 | outputs/phase-12/main.md strict index | completed |
| 8 | outputs/phase-12/phase-12.md 集約コピー | completed |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-12/main.md |
| ドキュメント | outputs/phase-12/implementation-guide.md |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md |
| ドキュメント | outputs/phase-12/documentation-changelog.md |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md |
| ドキュメント | outputs/phase-12/skill-feedback-report.md |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md |
| サマリ | outputs/phase-12/phase-12.md |

## 完了条件 (DoD)

- [ ] strict 7 outputs 全配置
- [ ] implementation-guide.md に Part 1 / Part 2 分離が存在
- [ ] unassigned-task-detection.md は 0 件でも生成（再 grep コマンドを記録）
- [ ] phase12-task-spec-compliance-check.md に task-04 §9 DoD 全 8 項目への evidence path が紐付く
- [ ] CONST_005: canonical path 規約準拠

## 次 Phase

- 次: Phase 13（commit / PR / G1-G4 ゲート）
- 引き継ぎ: implementation-guide.md（PR 本文の主見出し転記元） / changelog.md / unassigned-task list
- ブロック条件: strict 7 outputs 不足、または DoD 紐付け不全

## 実行タスク

1. `outputs/phase-12/main.md` と 6 補助ドキュメントを作成する。
2. Phase 11 runtime evidence pending と Phase 12 spec completeness を分離する。
3. `phase12-task-spec-compliance-check.md` で 4 条件を再検証する。

## 参照資料

| 種別 | パス |
| --- | --- |
| task-specification-creator | `.claude/skills/task-specification-creator/references/phase-12-spec.md` |
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` |
