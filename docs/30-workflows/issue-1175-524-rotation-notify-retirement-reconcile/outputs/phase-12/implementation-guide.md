# Phase 12: 実装ガイド（implementation-guide）

## Part 1: なぜ必要か / 何をするか（中学生レベル）

### 例え話

教室の掲示板に、3 つの「お知らせ係」を書いた紙が貼ってあります。

1. 「毎週カギを交換する係を、職員室のチャットに知らせる」
2. 「毎日の見回り結果を、職員室のチャットに知らせる」
3. 「毎月の利用記録を、職員室のチャットに知らせる」

ところが、先月「毎週カギを交換する」という仕組み自体をやめました。カギ交換の道具（仕組み）も片付けて、もう使いません。

それなのに掲示板には、まだ 1 番の「カギ交換の係を知らせる」が残っています。これを読んだ人は「えっ、まだカギ交換やってるの？どこにその道具があるの？」と混乱します。さらに、その紙には「カギ交換の道具はここ」と書いた案内（リンク）も貼ってありますが、その道具はもう存在しないので、案内をたどると行き止まりになります。

### だから何をするか

- 掲示板から **1 番（カギ交換の係を知らせる）の行を消す**。
- 行き止まりになっている **2 つの案内（リンク）を消す**。
- 掲示板の上に「カギ交換はやめました。だからお知らせ係は残り 2 つです」と **ひとこと書き足す**。
- 「お知らせ係を作る作業は、残り 2 つ分です」と数を直す。

これで掲示板は今の本当の状況と合い、読んだ人が迷わなくなります。今回やるのは「掲示板を今の状況に合わせて直す」だけで、新しい道具を作ったり、残り 2 つの仕組みをいじったりはしません。

---

## Part 2: 技術者レベル

### 変更対象

| 対象 | 種別 | 操作ツール |
|------|------|-----------|
| GitHub issue #524 本文/title | リモート正本（リポジトリ外） | `gh issue edit`（実施済み） |
| `docs/30-workflows/issues/issue-524.md` | ローカルミラー | テキスト編集 |

> 親タスク `cf-token-env-contract-and-rotation-retirement` が `cf-token-rotation-reminder.yml` を削除し、`cf-token-rotation-runbook.md` を tombstone 化（`RETIRED: 2026-06-08`）した結果、#524 の通知統合スコープ 1 行目（CF rotation reminder）が実装不能化・参照 dangling 化した。本タスクはこれを current facts へ整合する。

### 4 差分（Before / After）

#### 差分 1: 冒頭に撤廃注記ブロックを追加（背景セクションの直前）

**After（追加するブロック）:**

```markdown
> **2026-06-08 更新**: CF API Token の 90 日 rotation 運用は撤廃した。
> これに伴い旧「CF rotation reminder → Slack 投稿」は**対象外**とし、本 Issue の通知統合スコープを **2 件**（post-release dashboard / analytics export）に縮小する。
> 経緯の正本: `docs/30-workflows/completed-tasks/cf-token-env-contract-and-rotation-retirement/`
```

#### 差分 2: 「通知統合対象」テーブルから #407 行を削除

**Before:**

```markdown
| 由来 | 種別 | 現状の出力先 | Slack 統合後の期待 |
| --- | --- | --- | --- |
| Issue #407 | CF API Token 90 日 rotation reminder（85 日 reminder + label self-healing） | GitHub Issue 起票 | reminder 起票時に `#ubm-hyogo-ops` へ要約投稿（Token 値 / Token ID / scope 値は post しない） |
| Issue #351 | post-release dashboard automation（24h metrics 自動収集） | GitHub Actions artifact | dashboard.md の summary を `#ubm-hyogo-ops` に投稿（PII 非露出） |
| Issue #484 | Cloudflare Analytics monthly export | GitHub Actions artifact | export 成功 / 失敗を `#ubm-hyogo-ops` に投稿（zone/account redaction 維持） |
```

**After（#407 行を除去・2 行に縮小）:**

```markdown
| 由来 | 種別 | 現状の出力先 | Slack 統合後の期待 |
| --- | --- | --- | --- |
| Issue #351 | post-release dashboard automation（24h metrics 自動収集） | GitHub Actions artifact | dashboard.md の summary を `#ubm-hyogo-ops` に投稿（PII 非露出） |
| Issue #484 | Cloudflare Analytics monthly export | GitHub Actions artifact | export 成功 / 失敗を `#ubm-hyogo-ops` に投稿（zone/account redaction 維持） |
```

#### 差分 3: 「参照」節から dangling 2 パスを除去

**Before:**

```markdown
## 参照

- `.github/workflows/cf-token-rotation-reminder.yml`
- `.github/workflows/post-release-dashboard.yml`
- `.github/workflows/cloudflare-analytics-export.yml`
- `docs/30-workflows/operations/cf-token-rotation-runbook.md`
```

**After（削除済み workflow / tombstone runbook を除去・残り 2 パスは残置）:**

```markdown
## 参照

- `.github/workflows/post-release-dashboard.yml`
- `.github/workflows/cloudflare-analytics-export.yml`
- 撤廃経緯: `docs/30-workflows/completed-tasks/cf-token-env-contract-and-rotation-retirement/`
```

#### 差分 4: 「スコープ」チェックボックスを 2 件前提へ整合

**Before:**

```markdown
- [ ] 上記 3 ワークフローからの投稿実装
```

**After:**

```markdown
- [ ] 上記 2 ワークフローからの投稿実装（post-release dashboard / analytics export）
```

> secret hygiene 行（`Token 値 / Token ID / scope 値 / zone / account の redaction 継承`）は CF token 通知撤廃後は `zone / account` のみで足りるが、redaction 方針として残置しても害がないため Phase 3 判定により **残置可**（過剰削除を避ける）。

### 適用手順

```bash
# 1. #524 の現行本文を一時ファイルへ取得
gh issue view 524 --json body -q .body > /tmp/issue-524-body.md

# 2. /tmp/issue-524-body.md に上記 4 差分を適用（差分1 追記 / 差分2 行削除 / 差分3 パス除去 / 差分4 数値整合）

# 3. リモート反映（2026-06-10 実施済み）
gh issue edit 524 \
  --title 'ops: Slack #ubm-hyogo-ops への運用通知統合（post-release dashboard / analytics export）' \
  --body-file /tmp/issue-524-body.md

# 4. ローカルミラーを整合（テキスト編集）
#    docs/30-workflows/issues/issue-524.md の本文を #524 After と一致させ、
#    メタ YAML の updated_date: 2026-05-06 → 2026-06-10 へ更新
```

### ローカルミラー整合の要点（`docs/30-workflows/issues/issue-524.md`）

| 箇所 | Before | After |
|------|--------|-------|
| メタ YAML `updated_date` | `2026-05-06` | `2026-06-10` |
| 通知統合対象テーブル | Issue #407 行あり | #407 行を削除（#351 / #484 の 2 行） |
| 参照節 | dangling 2 パスあり | dangling 除去 + 撤廃経緯リンク追加 |
| 撤廃注記 | なし | 背景の直前に差分 1 ブロックを追加 |
| スコープ | `上記 3 ワークフロー` | `上記 2 ワークフロー（post-release dashboard / analytics export）` |

### エラーハンドリング / エッジケース

- 残り 2 件（Issue #351 / Issue #484）の行・「通知先」セクション・「スコープ外」セクションを **誤削除しないこと**。削除対象は #407 行と dangling 2 パスに限定する。
- `gh` 実行には GitHub 認証が必須。`gh auth status` で認証済みを確認してから `gh issue edit` を実行する。
- `gh issue edit 524` はリモート正本を上書きする outward-facing 操作。本 cycle ではユーザーの実行指示に基づき 2026-06-10 に完了済み。
- ミラー md とリモート本文の本文部分（メタ YAML を除く）を一致させる。メタ YAML はミラー固有のため #524 本文には含めない。

### DoD

- AC-1〜AC-5 を充足する（[phase-12.md](phase-12.md) §12.3 参照）。
- 検証 6 本（VC-01〜06・[phase-4.md](../phase-4/phase-4.md)）が期待値通り。
- 回帰 3 本（RC-01〜03・[phase-6.md](../phase-6/phase-6.md)）が期待値通り。

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要（NON_VISUAL）。代替証跡として最終レビュー結果（[phase-10.md](../phase-10/phase-10.md)）と手動テスト結果（[phase-11.md](../phase-11/phase-11.md)）を参照する。
