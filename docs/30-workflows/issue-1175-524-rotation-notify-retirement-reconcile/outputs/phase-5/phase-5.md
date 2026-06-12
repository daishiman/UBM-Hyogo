# Phase 5: 実装（ドキュメント編集手順）

## 5.1 docs-only における Phase 5 の読み替え

「実装」を **「ドキュメント編集手順」** と読み替える。コード surface は一切変更しない。
成果物は GitHub issue #524 本文（リモート正本）とローカルミラー md の 2 つのみ。

## 5.2 変更対象ファイル一覧

| 対象 | 種別 | 変更種別 | 適用方法 |
|------|------|----------|----------|
| GitHub issue #524 本文 | リモート（GitHub） | 編集 | `gh issue edit 524 --body-file /tmp/issue-524-body.md` |
| `docs/30-workflows/issues/issue-524.md` | ローカル md | 編集 | テキスト編集（本文 + メタ YAML） |

> `.github/workflows/cf-token-rotation-reminder.yml` と `docs/30-workflows/operations/cf-token-rotation-runbook.md` は **変更しない**（親タスクで削除/tombstone 済み。本タスクでは参照のみ除去）。

## 5.3 編集手順（ステップ）

### Step 1: 現本文の取得

```bash
gh issue view 524 --json body -q .body > /tmp/issue-524-body.md
```

### Step 2: Phase 2 の 4 差分を適用

`/tmp/issue-524-body.md` に対し Phase 2（`outputs/phase-2/phase-2.md` §2.3）の Before/After を厳密に適用する:

| 差分 | 内容 | 対応 AC | 対応 VC |
|------|------|---------|---------|
| 差分 1 | 冒頭（背景セクション直前）に rotation 撤廃の経緯注記ブロックを追加（先頭行 `> **2026-06-08 更新**:` を固定マーカーとする） | AC-3 | VC-04 |
| 差分 2 | 「通知統合対象」テーブルから Issue #407 行（CF API Token 90 日 rotation reminder）を削除（3 行→2 行） | AC-1 | VC-01 |
| 差分 3 | 「参照」節から dangling 2 パス（`cf-token-rotation-reminder.yml` / `cf-token-rotation-runbook.md`）を除去し、撤廃経緯ディレクトリ参照に置換 | AC-2 | VC-02 / VC-03 |
| 差分 4 | スコープのチェックボックス表現を「上記 3 ワークフロー」→「上記 2 ワークフロー（post-release dashboard / analytics export）」へ調整 | AC-3 | — |

> 過剰削除回避（Phase 3 §3.5）: secret hygiene 行の `Token 値 / Token ID / scope 値` 列挙、および「通知先」セクション（Workspace / Channel）は **残置**する。残り 2 件の Slack 実装に必要なため削除しない。

### Step 3: リモート反映（user-gated）

```bash
gh issue edit 524 --body-file /tmp/issue-524-body.md
```

> **user-gated**: 実際の実行はユーザー承認後にのみ行う。本仕様書内では実行しない。

### Step 4: ローカルミラーの整合

`docs/30-workflows/issues/issue-524.md` を編集する:

- 本文部分（背景以降）を Step 2 適用後の #524 本文 After と同一にする。
- メタ情報 YAML の `updated_date: 2026-05-06` → `updated_date: 2026-06-10` へ更新。
- 「参照」節を #524 After と一致させ、dangling 2 パスを除去する。

## 5.4 入力・出力・副作用の定義

| 区分 | 内容 |
|------|------|
| 入力 | 現状の #524 本文（`gh issue view 524`）/ Phase 2 §2.3 の Before/After 設計 / 現状のローカルミラー md |
| 出力 | 整合済み #524 本文（リモート）/ 整合済みローカルミラー md |
| 副作用 | **リモート GitHub issue 本文の書き換え**（outward-facing）。このため Step 3 は **user-gated**。ローカル md 編集はリポジトリ内副作用のみ。 |

## 5.5 DoD（Definition of Done）

- AC-1: #524 本文から Issue #407 行が削除されている。
- AC-2: #524「参照」節から dangling 2 パスが除去されている。
- AC-3: #524 冒頭に撤廃注記があり、スコープが 2 件へ縮小されている。
- AC-4: ローカルミラー md が AC-1〜3 と同一内容で、`updated_date` が 2026-06-10。
- AC-5: 検証コマンド 6 本（VC-01〜VC-06）が期待値通り。

## 5.6 不変条件

| 不変条件 | 内容 |
|----------|------|
| #1175 ライフサイクル | closed のまま（再オープンしない） |
| 残り 2 件スコープ | post-release dashboard（#351）/ analytics export（#484）の行・「通知先」セクションには触れない |
| コード surface | コード・workflow・runbook の実体ファイルは変更しない（参照除去のみ） |
| secret hygiene | redaction 方針の列挙行は過剰削除せず残置 |

## 5.7 重要注意

> **この仕様書内で実際の `gh issue edit` は実行しない。** 手順を記述するのみ。実行は実装プロンプト（03.実装.md）にてユーザー承認後に行う。

## 完了条件（Phase 5）

- [x] 変更対象ファイル一覧（パス + 変更種別 + 適用方法）を明記した。
- [x] 編集手順を Step 1〜4 で明記し、各 Step に AC/VC 対応を付した。
- [x] 入力・出力・副作用（user-gated 理由含む）を定義した。
- [x] DoD（AC-1〜AC-5）と不変条件を明記した。
- [x] 本仕様書内で `gh issue edit` を実行しない旨を明記した。
