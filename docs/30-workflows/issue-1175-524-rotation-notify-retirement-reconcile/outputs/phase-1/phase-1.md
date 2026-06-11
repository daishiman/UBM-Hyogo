# Phase 1: 要件定義

## タスク分類

| 項目 | 値 |
|------|-----|
| タスク種別 | docs-only task（GitHub issue 本文整合 + ローカルミラー md 整合） |
| 実装区分 | **ドキュメントのみ**（CONST_004 例外） |
| visualEvidence | NON_VISUAL |
| implementation_mode | `new`（#524 本文編集は未実施のため通常フロー。ただし「コード実装」ではなく「ドキュメント編集」） |
| 命名規則 | N/A（コードシンボルを追加しない。GitHub issue 本文と markdown のみ） |

## 実装区分判定（CONST_004 準拠）

### 結論: ドキュメントのみ仕様書として作成する

本タスクの成果物は以下 2 つのみであり、いずれもコード surface を一切変更しない:

1. GitHub issue #524 の本文編集（`gh issue edit 524`）
2. ローカルミラー `docs/30-workflows/issues/issue-524.md` の整合編集

### 判定根拠

CONST_004 の docs-only 許可条件「対象タスクが純粋にドキュメント・調査・合意形成で完結し、コード変更なしで目的が達成できる場合」に該当する:

- 「動作させる」「改善する」「修正する」等のコード変更を含意する目的は存在しない。整合対象は **issue 本文テキスト**である。
- ファイル変更・関数追加・API 変更・データモデル変更のいずれも含意しない。rotation reminder workflow（`.github/workflows/cf-token-rotation-reminder.yml`）は**親タスクで既に削除済み**であり、本タスクでコードを触る余地がない。
- 「実態優先」原則でも実態は docs（issue 本文 / mirror md）であり、ラベルと実態が一致する。

> 後続実装プロンプト（03.実装.md）が確実に作業を遂行できるよう、docs-only であっても CONST_005 相当の必須項目（変更対象・手順・検証コマンド・DoD）を Phase 5 / Phase 12 に明記する。

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク `cf-token-env-contract-and-rotation-retirement`（2026-06-08 完了）は、ユーザー承認に基づき CF API Token の 90 日カレンダーローテーション運用を撤廃した:

- `.github/workflows/cf-token-rotation-reminder.yml`（85 日で reminder issue を起票する workflow）を**削除**
- `scripts/check-cf-rotation-reminder.sh` を**削除**
- rotation runbook を tombstone 化し、`cf-token-provisioning-and-revocation-runbook.md`（非失効・狭スコープ・環境分離・漏洩時即時失効）へ置換

一方、open GitHub issue **#524**「ops: Slack #ubm-hyogo-ops への運用通知統合」は、Slack 通知統合対象として **3 件**を列挙しており、その **1 行目**が削除済み workflow を前提とする CF rotation reminder である。

### 1.2 問題点・課題（2026-06-10 現行検証で確認）

- #524 は **OPEN** のままで、本文の `updatedAt` は **2026-05-06**（#1175 起票より前から不変）。つまり #1175 の実作業は未実施。
- #524 本文の通知統合対象テーブルに **Issue #407（CF API Token 90 日 rotation reminder）行が残存**しており、削除済み workflow への Slack 配線という**実装不能なスコープ**が記載されたまま。
- #524「参照」節が削除済み `.github/workflows/cf-token-rotation-reminder.yml` と tombstone 化した `docs/30-workflows/operations/cf-token-rotation-runbook.md` を直接参照しており **dangling** になっている。
- ローカルミラー `docs/30-workflows/issues/issue-524.md` も同じ陳腐化内容を保持している。

### 1.3 issue #1175 が CLOSED である件の扱い

- #1175 は 2026-06-10 に CLOSED されているが、記述された作業（#524 本文編集）は遂行されていない（上記検証より administrative close と判断）。
- ユーザー指示により、**#1175 は closed のまま**で本仕様書を作成する。本仕様書は closed issue のライフサイクル整合作業を formalize し、後続実装プロンプトが #524 を整合できるようにする目的を持つ。

### 1.4 放置した場合の影響

- #524 着手時に「3 件中 1 件は実装対象が消えている」ことに実装者が気づかず、削除済み workflow への Slack 配線を実装しようとして手戻りが発生する。
- 通知統合スコープが実態（残り 2 件 = post-release dashboard / analytics export）と乖離したまま放置される。
- rotation 撤廃の意思決定（event-based revocation へ一本化）が #524 に反映されず、ガバナンス記録の一貫性が崩れる。

## 2. 何を達成するか（What）

### 2.1 目的

rotation 撤廃の事実を open issue #524 に整合させ、Slack 通知統合スコープを「実装可能な残り 2 件」に正す。あわせてローカルミラー md を同一内容へ揃え、リポジトリ側の整合も取る（current-code 整合）。

### 2.2 スコープ

#### 含むもの

- AC-1: #524 本文の通知統合対象テーブルから CF rotation reminder 行（Issue #407）を削除。
- AC-2: #524「参照」節から dangling 2 パス（`cf-token-rotation-reminder.yml` / `cf-token-rotation-runbook.md`）を除去。
- AC-3: #524 冒頭に rotation 撤廃の経緯注記を追加し、通知統合スコープを 2 件（post-release dashboard / analytics export）に縮小。
- AC-4: ローカルミラー `docs/30-workflows/issues/issue-524.md` を AC-1〜3 と同一内容へ整合。
- AC-5: 検証（`gh issue view 524` で行削除・dangling 除去を確認、`grep` でミラーの整合を確認）。

#### 含まないもの（スコープ外）

- 残り 2 件（post-release dashboard / analytics export）の Slack 通知**実装**（#524 本体スコープ）。
- event-based revocation 通知の新規実装（YAGNI）。
- 親タスクのコード差分への変更（rotation 撤廃は親で完結済み）。
- #1175 の再オープン（closed のまま）。

### 2.3 成果物

- 整合済みの GitHub issue #524 本文。
- 整合済みのローカルミラー `docs/30-workflows/issues/issue-524.md`。

## 3. inventory（変更対象の棚卸し）

| 対象 | 種別 | 変更種別 | 備考 |
|------|------|----------|------|
| GitHub issue #524 本文 | リモート（GitHub） | 編集 | `gh issue edit 524 --body-file` で適用 |
| `docs/30-workflows/issues/issue-524.md` | ローカル md | 編集 | リポジトリ側ミラーの整合 |
| `.github/workflows/cf-token-rotation-reminder.yml` | コード | 変更なし | 親タスクで削除済み（参照のみ除去対象） |
| `docs/30-workflows/operations/cf-token-rotation-runbook.md` | doc | 変更なし | tombstone 済み（参照のみ除去対象） |

## 4. carry-over 確認

- 直近コミット（`git log --oneline -5`）は #1182 / #1180 / #1176 等の独立 UI/admin タスクで、本タスク（ops issue hygiene）と重複しない。
- 親タスク `cf-token-env-contract-and-rotation-retirement` の成果物（workflow 削除・runbook tombstone）は landed 済み。本タスクはその副作用（#524 陳腐化）の整合のみを担う。

## 5. P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在する | No（#524 本文編集は未実施） | 通常フロー（実装＝ドキュメント編集） |
| upstream にマージ済み | 親タスクの workflow 削除は landed | 親の前提（workflow 不在）を所与として整合作業を行う |
| 前提タスク（親 rotation 撤廃 PR）が完了済み | Yes | 「issue 本文確定は親 PR merge 後」の不変条件は既に満たされている |

## 完了条件（Phase 1）

- [x] タスク分類（docs-only task / NON_VISUAL）を記録した。
- [x] 実装区分判定（ドキュメントのみ・CONST_004 例外）と根拠を明記した。
- [x] 受入条件 AC-1〜AC-5 を固定した。
- [x] inventory・carry-over・P50 を記録した。
