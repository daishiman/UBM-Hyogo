# Phase 5: 実装ランブック（設計実行ランブック / spec walkthrough）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（docs-only のため設計文書作成手順ランブック） |
| 作成日 | 2026-04-29 |
| 上流 | Phase 4（テスト戦略） |
| 下流 | Phase 6（異常系検証） |
| 状態 | spec_created |
| user_approval_required | false |

## 目的

本タスクは **docs-only / NON_VISUAL** の設計仕様タスクのため、コード実装は行わない。代わりに **「設計文書を作成・更新するためのランブック」** を Step 単位で確定し、`outputs/` 配下の成果物（Phase 1〜3 を中心に Phase 4〜10 の全 outputs）を **派生エージェントが単独で再現可能** な粒度で固定する。

具体的には、

1. `outputs/` 配下のファイル作成順序（依存関係に沿った先後）
2. **source-of-truth（SoT）の決定プロセス**（Sheets vs D1 / push vs pull / 行ハッシュ vs 一意 ID）の意思決定フロー
3. **比較評価表の埋め方**（PASS / MINOR / MAJOR の判定基準と引用ルール）
4. コミット粒度・PR 粒度・revert 単位
5. Phase 4 で確定した TC-1〜TC-6 を Green にする検証コマンド列

を `outputs/phase-05/implementation-runbook.md` に書き出す（artifacts.json と整合。docs-only タスクのため内実は「設計実行ランブック / spec walkthrough」）。

## 入力

- `outputs/phase-01/main.md`（要件定義 / AC-1〜AC-10）
- `outputs/phase-02/*.md`（設計 3 点）
- `outputs/phase-03/main.md` / `alternatives.md`（PASS/MINOR/MAJOR・open question）
- `outputs/phase-04/test-strategy.md`（TC-1〜TC-6 / IMPL-T-1〜9）

## 実行手順

### Step 0: 事前確認（Red）

```bash
# Phase 1〜3 成果物がすべて存在するか
ls outputs/phase-01/main.md \
   outputs/phase-02/sync-method-comparison.md \
   outputs/phase-02/sync-flow-diagrams.md \
   outputs/phase-02/sync-log-schema.md \
   outputs/phase-03/main.md \
   outputs/phase-03/alternatives.md

# artifacts.json と index.md の整合
jq -r '.metadata | .taskType, .visualEvidence, .workflow_state, .scope' artifacts.json
# 期待: docs-only / NON_VISUAL / spec_created / design_specification

# Red: TC-2-1〜TC-2-10 のうち未充足項目を特定
rg -in "push|pull|webhook|cron" outputs/phase-02/sync-method-comparison.md || echo "RED: TC-2-1 未充足"
```

### Step 1: 要件定義 outputs（Phase 1）の作成

`outputs/phase-01/main.md` に以下を記載:

- 背景 / 課題（原典スペック §「背景」「課題」を反映）
- 苦戦箇所 7 件（index.md §「苦戦箇所・知見」と同期）
- スコープ（含む / 含まない）
- AC-1〜AC-10 の引用 + 「本 Phase でどう確定するか」のリンク
- 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）
- NON_VISUAL 確定根拠（screenshot 不要・コード実装なし）

| コミット | メッセージ |
| --- | --- |
| 1 | `docs(ut-01): add phase-01 requirements (AC-1..10, NON_VISUAL fixed)` |

### Step 2: 設計 outputs（Phase 2）3 点の作成

#### Step 2-A: `sync-method-comparison.md`

比較評価表の埋め方ルール:

| 判定 | 基準 |
| --- | --- |
| PASS | 全観点で許容圏内 + base case 候補 |
| MINOR | 1〜2 観点で軽微な懸念があるが代替案として残す |
| MAJOR | 即時性 / コスト / quota などコア観点が破綻する |

採択方式（B: Workers Cron Triggers pull）の **採択理由を 3 文以上** で明記。

#### Step 2-B: `sync-flow-diagrams.md`

3 フロー（手動トリガー / 定期 cron / バックフィル）を Mermaid sequenceDiagram で記述。各フローに **エラーパス（リトライ / 部分失敗 / quota 超過）** を含める。

#### Step 2-C: `sync-log-schema.md`

論理スキーマ（物理 DDL ではない）として以下のカラムを定義:

| カラム | 型（論理） | 用途 |
| --- | --- | --- |
| job_id | UUID | 同期ジョブ識別 |
| status | enum(pending/in_progress/completed/failed) | 状態遷移 |
| offset | integer | 部分失敗時の resume 用オフセット（処理済 row 数） |
| started_at | timestamp | ジョブ開始時刻 |
| finished_at | timestamp | ジョブ終了時刻 |
| error_message | text | 失敗時のエラー詳細 |
| trigger_type | enum(manual/cron/backfill) | 起動経路 |
| row_count_processed | integer | 処理済件数（監査） |

| コミット | メッセージ |
| --- | --- |
| 2 | `docs(ut-01): add phase-02 sync method/flow/log-schema design` |

### Step 3: 設計レビュー outputs（Phase 3）の作成

#### Step 3-A: `alternatives.md`

代替案 4 案（A push / B pull / C webhook / D hybrid）について **PASS / MINOR / MAJOR** を全観点で確定。base case = B。

#### Step 3-B: `main.md`

PASS / MINOR / MAJOR 統合判定 + リスク R-1〜R-N + open question を **0 件まで詰める**。残った場合は `unassigned-task-detection.md` 候補化。

| コミット | メッセージ |
| --- | --- |
| 3 | `docs(ut-01): add phase-03 design review (alternatives + open-question 0)` |

### Step 4: SoT 決定プロセスの文書化

> **SoT（source-of-truth）決定は本タスクの最重要意思決定**。曖昧さ残置は AC-9 違反。

| 領域 | 採択 | 根拠 |
| --- | --- | --- |
| Form 回答の正本 | Google Form 実回答（Sheets 経由） | CLAUDE.md 不変条件「Google Form の実回答を正本」 |
| 同期方向 | Sheets → D1 のみ（一方向） | D1 直接アクセスは apps/api 限定（不変条件 #5） |
| 障害時の優先 | Sheets 優先（D1 を再生成可能と扱う） | D1 喪失時は Sheets から full backfill 可能 |
| 行同一性 | バンドマン固有 ID（フォーム既存項目）優先 + 行ハッシュ補助 | 苦戦箇所 #2、UT-04 への引き継ぎ事項 |
| 競合発生時 | Sheets 値で D1 を上書き（ON CONFLICT DO UPDATE） | 一方向同期前提 |

このマトリクスを `outputs/phase-02/sync-method-comparison.md` または専用節に必ず含める（AC-5）。

| コミット | メッセージ |
| --- | --- |
| 4 | `docs(ut-01): clarify source-of-truth decision matrix (Sheets-first)` |

### Step 5: TC-1〜TC-6 の Green 検証

```bash
# TC-6 先行（artifacts.json 整合）
jq -r '.metadata | .taskType, .visualEvidence, .workflow_state, .scope' artifacts.json
jq -r '.phases[].outputs[]' artifacts.json | while read p; do test -e "$p" || echo "PENDING: $p"; done

# TC-1（成果物存在 + 章立て）
ls outputs/phase-02/{sync-method-comparison.md,sync-flow-diagrams.md,sync-log-schema.md}
rg -n "比較" outputs/phase-02/sync-method-comparison.md
rg -n "Cron" outputs/phase-02/sync-method-comparison.md
rg -n "手動|定期|バックフィル" outputs/phase-02/sync-flow-diagrams.md
rg -n "ジョブ|status|offset|timestamp|error" outputs/phase-02/sync-log-schema.md

# TC-2（AC × 成果物 整合）
rg -in "push|pull|webhook|cron" outputs/phase-02/sync-method-comparison.md
rg -n "リトライ|Backoff|冪等|failed" outputs/phase-02/
rg -in "source-of-truth|SoT|ロールバック" outputs/phase-02/
rg -n "500|バッチ|Backoff" outputs/phase-02/
rg -in "ハッシュ|ON CONFLICT|一意" outputs/phase-02/
rg -n "PASS|MINOR|MAJOR" outputs/phase-03/alternatives.md
rg -in "open question" outputs/phase-03/main.md

# TC-3（リンクチェック）
rg -o 'doc/[^ )]+\.md|docs/[^ )]+\.md' index.md | sort -u | while read p; do test -e "$p" || echo "MISSING: $p"; done

# TC-4（曖昧表現検出）
rg -in "実装で判断|TBD|要検討|後で決める" outputs/ && echo "FAIL: 曖昧表現あり" || echo "OK"

# TC-5（副作用なし）
mise exec -- pnpm typecheck
mise exec -- pnpm lint
git diff --name-only main -- apps packages
```

| コミット | メッセージ |
| --- | --- |
| 5 | `docs(ut-01): record phase-04 TC green logs in runbook` |

### Step 6: ランブック自体の文書化

`outputs/phase-05/implementation-runbook.md` に Step 0〜5 の実行ログ・コミット ID・出力サマリーを転記。

| コミット | メッセージ |
| --- | --- |
| 6 | `docs(ut-01): add phase-05 spec-authoring runbook with green logs` |

## ロールバック設計

| Step | ロールバック手段 | 影響範囲 |
| --- | --- | --- |
| Step 1 | `git revert <commit-1>` | `outputs/phase-01/main.md` のみ |
| Step 2 | `git revert <commit-2>` | `outputs/phase-02/*.md` 3 点のみ |
| Step 3 | `git revert <commit-3>` | `outputs/phase-03/*.md` 2 点のみ |
| Step 4 | `git revert <commit-4>` | SoT マトリクス追記分のみ |
| Step 5 | `git revert <commit-5>` | TC ログ追記分のみ |
| Step 6 | `git revert <commit-6>` | ランブック本体のみ |

> **粒度を保つ理由**: 設計文書は再評価で部分修正が頻繁に発生する。Step ごとにコミットを分離し、評価表だけ・SoT マトリクスだけを revert 可能にする。

## 自己適用順序ゲート

| ゲート | 条件 |
| --- | --- |
| Phase 5 → Phase 6 | TC-1〜TC-6 全 GREEN（Step 5 ログ取得済） |
| Phase 5 → Phase 11 | open question 0 件 + SoT マトリクス確定 + 採択方式 B 確定 |
| Phase 5 → UT-09 着手 | 本ランブック完了 + AC-9 PASS（UT-09 が独立着手可能と判定） |

## 実行タスク

1. Step 0 事前確認（Red）
2. Step 1 Phase 1 outputs 作成 → 単独コミット
3. Step 2 Phase 2 outputs 3 点作成 → 単独コミット
4. Step 3 Phase 3 outputs 2 点作成 → 単独コミット
5. Step 4 SoT 決定マトリクス追記 → 単独コミット
6. Step 5 TC-1〜TC-6 Green 検証 → ログを Step 6 ランブックへ転記する単独コミット
7. Step 6 ランブック本体作成 → 単独コミット

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-01/main.md` |
| 必須 | `outputs/phase-02/sync-method-comparison.md` |
| 必須 | `outputs/phase-02/sync-flow-diagrams.md` |
| 必須 | `outputs/phase-02/sync-log-schema.md` |
| 必須 | `outputs/phase-03/main.md` |
| 必須 | `outputs/phase-03/alternatives.md` |
| 必須 | `outputs/phase-04/test-strategy.md` |
| 必須 | `index.md` / `artifacts.json` |
| 参考 | `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/phase-05.md`（フォーマット模倣元） |

## 依存Phase明示

- Phase 1 / 2 / 3 / 4 成果物を参照する。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-05/implementation-runbook.md` | Step 0〜6 / 比較評価表の埋め方 / SoT 決定マトリクス / コミット粒度 / TC Green ログ / ロールバック設計（docs-only タスクのため「設計実行ランブック」として運用） |

## 完了条件 (DoD)

- [ ] Step 1〜6 が単独コミットで完了
- [ ] 各コミットが `git revert` 単独で戻せる粒度になっている
- [ ] SoT 決定マトリクスが `sync-method-comparison.md` に含まれる
- [ ] TC-1〜TC-6 すべて GREEN（ログをランブックに転記）
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` 成功
- [ ] open question 0 件
- [ ] 曖昧表現（`実装で判断` / `TBD` / `要検討` / `後で決める`）0 件

## 苦戦箇所・注意

- **混在コミット禁止**: Step 1〜6 を 1 コミットに混ぜると revert 粒度を失う。**必ず Step ごとに分離**
- **比較評価表を空欄で残さない**: PASS/MINOR/MAJOR を埋めずに先に進むと AC-8 違反。Step 3-A で全観点 × 全案の table を **必ず埋める**
- **SoT 揺れ**: 「Sheets 優先」と「D1 優先」を文中で混在記述すると AC-5 違反。**Step 4 のマトリクスを唯一の正本** とし、他の節は当該マトリクスへの参照のみに留める
- **`sync_log` 物理 DDL を書かない**: 本タスクは論理設計のみ。物理 DDL（CREATE TABLE）は UT-04 に引き継ぐ。誤って書くと UT-04 とコンフリクト
- **コード実装に踏み出さない**: Cloudflare Workers の `scheduled()` ハンドラ実装に踏み出した瞬間に docs-only スコープ違反。**実装は UT-09**
- **rg と grep の挙動差**: 本ランブックは `rg`（ripgrep）前提。CI 互換性が必要な場合は `grep -rn` 代替を Phase 9 で再評価

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の設計仕様であり、アプリケーション統合テストは追加しない。
- 統合検証は TC-1〜TC-6（rg / jq / diff / pnpm）と Phase 11 縮約テンプレ自己適用 smoke で代替する。
- 実コードの統合テストは UT-09 が IMPL-T-6〜IMPL-T-9 雛形に基づき実施する。

## 次 Phase

- 次: Phase 6（異常系検証）
- 引き継ぎ: Step 1〜6 のコミット ID / Step 5 Green ログ / SoT 決定マトリクス確定 / open question 0 件証跡
