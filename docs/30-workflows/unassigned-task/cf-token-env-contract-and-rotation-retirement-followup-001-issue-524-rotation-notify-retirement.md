# cf-token-env-contract-and-rotation-retirement-followup-001 issue #524 CF rotation 通知統合行の撤廃整合 - タスク指示書

## Fold-state sync metadata

```yaml
issue_number: 1175
status: spec_created
discovered_by: cf-token-env-contract-and-rotation-retirement / Phase 12 unassigned-task detection 2回目検証（関連タスク差分の見落とし補完）
discovered_at: 2026-06-08
parent_workflow: docs/30-workflows/completed-tasks/cf-token-env-contract-and-rotation-retirement/
related_open_issue: 524
note: 親タスクで .github/workflows/cf-token-rotation-reminder.yml を削除（rotation 撤廃）したことにより、open issue #524 の Slack 通知統合対象 3 件中 1 行目（CF API Token 90日 rotation reminder → Slack 投稿）が陳腐化する。#524 のライフサイクル整合タスク。
```

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | cf-token-env-contract-and-rotation-retirement-followup-001-issue-524-rotation-notify-retirement |
| タスク名     | open issue #524（Slack 通知統合）の CF rotation reminder 通知行を rotation 撤廃に整合させる |
| 分類         | 整理（Issue hygiene / Governance reconciliation）                             |
| 対象機能     | GitHub issue #524 本文 / Slack 通知統合スコープ                               |
| 優先度       | 低（runtime blocker なし・他 2 件の Slack 統合とは独立に処理可能）            |
| 見積もり規模 | 極小（issue 本文編集のみ・コード変更なし）                                    |
| ステータス   | spec_created（GitHub issue 起票済・実装は #524 ピックアップ時に同時処理可）   |
| 発見元       | cf-token-env-contract-and-rotation-retirement / Phase 12 unassigned-task detection 2回目検証 |
| 発見日       | 2026-06-08                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク `cf-token-env-contract-and-rotation-retirement` は、`staging-runtime-smoke` の `bulk-tag-runtime-smoke` ジョブが `CLOUDFLARE_API_TOKEN` 欠落で毎回赤くなる障害を恒久解消すると同時に、ユーザー承認に基づき 90日カレンダーローテーション運用を撤廃した。具体的には:

- `.github/workflows/cf-token-rotation-reminder.yml`（85日で reminder issue を起票する workflow）を**削除**
- `scripts/check-cf-rotation-reminder.sh` を**削除**
- rotation runbook を tombstone 化し、`cf-token-provisioning-and-revocation-runbook.md`（非失効・狭スコープ・環境分離・漏洩時即時失効）へ置換

一方、open GitHub issue **#524**「ops: Slack #ubm-hyogo-ops への運用通知統合」は、Slack 通知統合の対象として **3 件**を列挙しており、その**1 行目**が以下である:

| 由来 | 種別 | 現状の出力先 | Slack 統合後の期待 |
| --- | --- | --- | --- |
| Issue #407 | CF API Token 90 日 rotation reminder（85 日 reminder + label self-healing） | GitHub Issue 起票 | reminder 起票時に `#ubm-hyogo-ops` へ要約投稿 |

さらに #524 の「参照」節は削除済みの `.github/workflows/cf-token-rotation-reminder.yml` と tombstone 化した `cf-token-rotation-runbook.md` を直接参照している。

### 1.2 問題点・課題

- rotation reminder workflow が削除されたため、#524 の 1 行目「rotation reminder 起票時に Slack へ投稿」は**実装不能（起票元の workflow が存在しない）**になった。
- #524 をピックアップした実装者が、削除済み workflow への Slack 配線を実装しようとして詰まる（無駄な調査・実装着手）。
- #524 の「参照」節の 2 パス（削除済み workflow / tombstone runbook）が dangling 参照になる。

### 1.3 放置した場合の影響

- #524 着手時に「3 件中 1 件は実装対象が消えている」ことに実装者が気づかず、混乱・手戻りが発生する。
- 通知統合スコープが実態（残り 2 件 = post-release dashboard / analytics export）と乖離したまま放置される。
- rotation 撤廃の意思決定（event-based revocation へ一本化）が #524 に反映されず、ガバナンス記録の一貫性が崩れる。

---

## 2. 何を達成するか（What）

### 2.1 目的

rotation 撤廃の事実を open issue #524 に整合させ、Slack 通知統合スコープを「実装可能な残り 2 件」に正す。

### 2.2 最終ゴール

以下のいずれかで #524 を整合させる（#524 ピックアップ時に実装者が選択）:

- **案A（推奨・最小）**: #524 本文の通知統合対象テーブルから CF rotation reminder 行を削除し、「参照」節から削除済み workflow / tombstone runbook の 2 パスを除去。冒頭に「2026-06-08 rotation 撤廃により CF rotation reminder 通知は対象外。詳細は親タスク `cf-token-env-contract-and-rotation-retirement` を参照」と注記。スコープを 2 件（post-release dashboard / analytics export）に縮小。
- **案B（任意・拡張）**: CF token に関する Slack 通知を「定期 rotation reminder」から「漏洩時の event-based revocation 通知」へ**置換**する形で 1 行目を書き換える。ただしこれは新規通知ソースの設計を伴うため、別タスクとして切り出すのが望ましい（#524 では案Aで縮小し、event-based 通知は YAGNI として保留）。

### 2.3 スコープ

#### 含むもの

- #524 本文の通知統合対象テーブルの CF rotation reminder 行の削除（または event-based 通知への注記置換）
- #524「参照」節の dangling 2 パス除去
- rotation 撤廃の経緯注記の追記

#### 含まないもの

- 残り 2 件（post-release dashboard / analytics export）の Slack 通知**実装**（#524 本体スコープであり本 follow-up の責務外）
- event-based revocation 通知の新規**実装**（YAGNI・必要時に別タスク化）
- 親タスクのコード差分への変更（rotation 撤廃は親で完結済み）

### 2.4 成果物

- 整合済みの GitHub issue #524 本文
- 本 follow-up 起票 issue（rotation 撤廃 → #524 整合の依存関係を追跡）

---

## 3. 実施可能になる条件（When）

- 即時実施可能（本 follow-up の issue 編集自体は親タスクの merge を待たずに行える）。
- ただし親タスク（`cf-token-rotation-reminder.yml` 削除）の PR が merge される前に #524 本文を確定させると、rollback 時に整合が崩れるため、**親タスク PR の merge 後**に #524 本文を確定するのが安全（merge 前は本 follow-up issue にコメントで予告のみ）。

---

## 4. 苦戦箇所・知見（親サイクルでの学び）

将来同種タスクで再度ハマらないために、本サイクルで判断に時間を要した箇所を記録する。

### 4.1 「関連タスク差分確認」で open issue の逆参照を見落としやすい

親タスクの Phase 12 検出レポートは、関連タスク差分として「親 issue-1081」「先行 staging-mint-bearer-env-contract-guard」を確認していたが、**削除するファイルを参照している open issue**（#524）を見落としていた。

**判定 gate**: workflow / script を**削除**する変更を含むタスクでは、Phase 12 の「関連タスク差分確認」で必ず `gh issue list --state open --search "<削除ファイル名>"` を実行し、削除対象を参照する open issue がないか逆引きする。削除は「自タスク内で完結」でも、他タスク（issue）の前提を壊す副作用を持つ。

### 4.2 削除の副作用 = current か baseline かの判定

削除済み workflow を参照する open issue の整合は、

- 「親タスクの責務範囲」では完結しない（#524 は別スコープ）が、
- 「投機的将来候補（baseline）」でもない（削除という**確定した帰結**が #524 を陳腐化させる）。

→ **current 未タスク**として起票するのが正。baseline（YAGNI / user-gated gating）とは性質が異なる。2回目検証（独立 Explore）がこの分類を補正した。

### 4.3 dangling 参照は「現役コード内」と「open issue 本文」を分けて評価

`grep` で削除ファイル名を全文検索すると completed-tasks 配下の履歴記録（正当）が大量にヒットする。現役コード（`.github/`, `scripts/`, `package.json`）内の dangling は 0 件でも、**open issue 本文**の参照は別途 `gh issue list --search` で評価する必要がある（git grep では拾えない）。

---

## 5. 参照資料

| 種別 | パス / URL | 用途 |
| --- | --- | --- |
| 必須 | GitHub issue #524 | 整合対象の open issue |
| 必須 | `docs/30-workflows/completed-tasks/cf-token-env-contract-and-rotation-retirement/` | 親 workflow（rotation 撤廃の正本・completed-tasks 配下の現行パス） |
| 必須 | `docs/30-workflows/operations/cf-token-provisioning-and-revocation-runbook.md` | rotation 撤廃後の正本 runbook（#524 注記の参照先） |
| 参考 | `docs/30-workflows/operations/cf-token-rotation-runbook.md` | tombstone 化済みの旧 runbook（#524「参照」節から除去対象） |
| 参考 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | RETIRED 2026-06-08 マーカー |

---

## 6. 不変条件

1. issue 本文の確定は**親タスク PR の merge 後**（rollback 整合のため）。merge 前は予告コメントのみ。
2. #524 の残り 2 件（post-release dashboard / analytics export）のスコープ・実装には触れない。
3. event-based revocation 通知の新規実装は YAGNI として本 follow-up に含めない（必要時に別タスク化）。
4. rotation 撤廃の経緯は親タスクを正本として参照し、#524 側に経緯を重複記述しすぎない（リンクで誘導）。
