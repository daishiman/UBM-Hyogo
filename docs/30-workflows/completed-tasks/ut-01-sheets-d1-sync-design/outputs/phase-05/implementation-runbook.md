# Phase 5 成果物: 設計実行ランブック（implementation-runbook.md / spec walkthrough）

> **ステータス**: completed
> 本タスクは docs-only / NON_VISUAL のため、ファイル名は artifacts.json と整合する `implementation-runbook.md` を維持しつつ、内実は **「設計文書作成手順 / spec walkthrough」のランブック** として運用する。
> 仕様本体は `../../phase-05.md` を参照。

## 1. ランブック概要

本ランブックは、UT-01 設計仕様タスクの outputs 群（Phase 1〜10）を **派生エージェントが単独で再現可能** な粒度で固定する手順書である。コード実装は行わず、`outputs/` 配下の Markdown 成果物の作成順序・SoT 決定プロセス・比較評価表の埋め方ルール・コミット粒度・TC Green 検証コマンド列を Step 0〜6 として確定する。Step ごとに単独コミットを切ることで、設計文書の部分的な再評価・revert を可能にする。

## 2. Step 0 事前確認（Red ログ）

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

# Red 状態スナップショット（未充足 TC を特定）
rg -in "push|pull|webhook|cron" outputs/phase-02/sync-method-comparison.md || echo "RED: TC-2-1 未充足"
rg -in "open question" outputs/phase-03/main.md || echo "RED: TC-2-9 未充足"
```

実行時の期待結果: Phase 1〜3 成果物が既に存在し、metadata が docs-only / NON_VISUAL / spec_created / design_specification の 4 値で揃っていること。Red 検出があれば該当 Phase へ戻る。

## 3. Step 1 Phase 1 outputs 作成

`outputs/phase-01/main.md` に以下を記載する:

- 背景 / 課題（原典スペック §「背景」「課題」反映）
- 苦戦箇所 6 件（index.md §「苦戦箇所・知見」と同期）
- スコープ（含む / 含まない）
- AC-1〜AC-10 の引用 + Phase 別の確定経路
- 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）
- NON_VISUAL 確定根拠（screenshot 不要・コード実装なし）

| コミット | メッセージ |
| --- | --- |
| 1 | `docs(ut-01): add phase-01 requirements (AC-1..10, NON_VISUAL fixed)` |

## 4. Step 2 Phase 2 outputs 3 点作成

### 4.1 Step 2-A `sync-method-comparison.md`

比較評価表の埋め方ルール:

| 判定 | 基準 |
| --- | --- |
| PASS | 全観点で許容圏内 + base case 候補 |
| MINOR | 1〜2 観点で軽微な懸念があるが代替案として残す |
| MAJOR | 即時性 / コスト / quota などコア観点が破綻する |

採択方式 **B: Cloudflare Workers Cron Triggers 定期 pull** の採択理由を **3 文以上** で明記:

1. 同期頻度を Workers 側で制御でき、Sheets API quota（500 req/100s/project）を batch size と cron 間隔で守れる。
2. `sync_log` に job ID / status / processed_offset / retry_count を残せるため、部分失敗後の再開と監査証跡が単純になる。
3. 実装責務が `apps/api` に閉じ、D1 直接アクセス禁止の不変条件 #5 と整合する。
4. Backfill を同じ同期関数の `full=true` 分岐で実現でき、UT-09 の実装面積が最小になる。

### 4.2 Step 2-B `sync-flow-diagrams.md`

3 フロー（手動トリガー / 定期 cron / バックフィル）を Mermaid `sequenceDiagram` で記述。各フローに以下のエラーパスを必ず含める:

- 401/403: `auth_error` として `failed` に記録、再試行しない
- Sheets 5xx / network: 最大 3 回 retry、Backoff 1s→2s→4s→8s→16s→32s
- quota exceeded: 100 秒以上待機して retry、上限到達時は `quota_exhausted`
- D1 `SQLITE_BUSY`: chunk 単位で retry、成功済み offset は戻さない

### 4.3 Step 2-C `sync-log-schema.md`

論理スキーマ（物理 DDL ではない）として 13 カラムを定義:

| # | カラム | 型 | 用途 |
| --- | --- | --- | --- |
| 1 | id | TEXT (UUID) | ジョブ ID（PK） |
| 2 | trigger_type | TEXT | manual / cron / backfill |
| 3 | status | TEXT | pending / in_progress / completed / failed |
| 4 | started_at | INTEGER | ジョブ開始時刻 |
| 5 | finished_at | INTEGER | 完了時刻 |
| 6 | processed_offset | INTEGER | resume 用オフセット |
| 7 | total_rows | INTEGER | 取得行数 |
| 8 | error_code | TEXT | 失敗カテゴリ |
| 9 | error_message | TEXT | 詳細（先頭 1000 文字） |
| 10 | retry_count | INTEGER | リトライ実施回数 |
| 11 | created_at | INTEGER | レコード作成時刻 |
| 12 | idempotency_key | TEXT | 実行単位キー |
| 13 | lock_expires_at | INTEGER | active lock stale 判定 |

| コミット | メッセージ |
| --- | --- |
| 2 | `docs(ut-01): add phase-02 sync method/flow/log-schema design` |

## 5. Step 3 Phase 3 outputs 2 点作成

### 5.1 `alternatives.md`

代替案 4 案（A push / B pull / C webhook / D hybrid）について PASS / MINOR / MAJOR を全観点で確定:

| 案 | 判定 | 主な指摘 |
| --- | --- | --- |
| A push（Apps Script webhook） | MAJOR | Apps Script 認証境界追加、Workers CPU 制限と Sheets API 応答遅延の衝突 |
| B pull（Workers Cron Triggers） | **PASS / 採択** | 無料枠完結 / 冪等性 / バックフィル / quota 適合のすべてで合格 |
| C webhook（Drive API） | MAJOR | 行レベル diff 通知 API 不在、Drive watch 経由で実装コスト過大 |
| D hybrid | MINOR | MVP 過剰投資。base B 安定後の即時性要件発生時に検討（TECH-M-01） |

### 5.2 `main.md`

PASS / MINOR / MAJOR 統合判定 + リスク R-1〜R-7 + open question を **0 件まで詰める**。残置がある場合は `unassigned-task-detection.md` 候補化。

| コミット | メッセージ |
| --- | --- |
| 3 | `docs(ut-01): add phase-03 design review (alternatives + open-question 0)` |

## 6. Step 4 SoT 決定マトリクス（最重要）

> SoT（source-of-truth）決定は本タスクの最重要意思決定。曖昧さ残置は AC-9 違反。

| 領域 | 採択 | 根拠 |
| --- | --- | --- |
| Form 回答の正本 | Google Form 実回答（Sheets 経由） | CLAUDE.md 不変条件「Google Form の実回答を正本」 |
| 同期方向 | Sheets → D1 のみ（一方向） | D1 直接アクセスは apps/api 限定（不変条件 #5） |
| 障害時の優先 | Sheets 優先（D1 を再生成可能と扱う） | D1 喪失時は Sheets から full backfill 可能 |
| 行同一性 | バンドマン固有 ID（フォーム既存項目）優先 + 行ハッシュ補助 | 苦戦箇所 #2、UT-04 への引き継ぎ事項 |
| 競合発生時 | Sheets 値で D1 を上書き（INSERT ON CONFLICT DO UPDATE） | 一方向同期前提 |

このマトリクスは `outputs/phase-02/sync-method-comparison.md` の §5 確定パラメータ + §既知制約 にも反映済（AC-5）。本ランブックを **唯一の正本** とし、他節は当該マトリクスへの参照のみに留める。

| コミット | メッセージ |
| --- | --- |
| 4 | `docs(ut-01): clarify source-of-truth decision matrix (Sheets-first)` |

## 7. Step 5 TC-1〜TC-6 Green 検証ログ

```bash
# TC-6 先行（artifacts.json 整合）
jq -r '.metadata | .taskType, .visualEvidence, .workflow_state, .scope' artifacts.json
# 期待出力: docs-only / NON_VISUAL / spec_created / design_specification
jq -r '.phases[].outputs[]' artifacts.json | while read p; do test -e "$p" || echo "PENDING: $p"; done

# TC-1（成果物存在 + 章立て）
ls outputs/phase-02/{sync-method-comparison.md,sync-flow-diagrams.md,sync-log-schema.md}
rg -n "比較" outputs/phase-02/sync-method-comparison.md
rg -n "Cron" outputs/phase-02/sync-method-comparison.md
rg -n "手動|定期|バックフィル" outputs/phase-02/sync-flow-diagrams.md
rg -n "id|status|offset|started_at|error" outputs/phase-02/sync-log-schema.md

# TC-2（AC × 成果物 整合）
rg -in "push|pull|webhook|cron" outputs/phase-02/sync-method-comparison.md
rg -n "リトライ|Backoff|冪等|failed" outputs/phase-02/
rg -in "source-of-truth|SoT|Sheets 優先|ロールバック" outputs/phase-02/
rg -n "500|バッチ|Backoff|待機" outputs/phase-02/
rg -in "ハッシュ|ON CONFLICT|一意|UPSERT" outputs/phase-02/
rg -n "PASS|MINOR|MAJOR" outputs/phase-03/alternatives.md
rg -in "open question" outputs/phase-03/main.md

# TC-3（リンクチェック）
rg -o 'doc/[^ )]+\.md|docs/[^ )]+\.md' index.md | sort -u | while read p; do test -e "$p" || echo "MISSING: $p"; done

# TC-4（曖昧表現検出 / 期待: 0 件）
rg -in "実装で判断|TBD|要検討|後で決める" outputs/ && echo "FAIL: 曖昧表現あり" || echo "OK"

# TC-5（副作用なし）
mise exec -- pnpm typecheck   # exit 0 期待
mise exec -- pnpm lint        # exit 0 期待
git diff --name-only main -- apps packages   # 出力 0 行期待
```

実行ログの取得後、本節に標準出力 / exit code / コミット ID を転記する。Phase 9 品質保証で再走させる際の基準値とする。

| コミット | メッセージ |
| --- | --- |
| 5 | `docs(ut-01): record phase-04 TC green logs in runbook` |

## 8. Step 6 ランブック本体仕上げ

`outputs/phase-05/implementation-runbook.md` 自体に Step 0〜5 の実行サマリー / コミット ID / Green ログを最終転記する。本ファイルが完成した時点で Phase 6 着手可能。

| コミット | メッセージ |
| --- | --- |
| 6 | `docs(ut-01): add phase-05 spec-authoring runbook with green logs` |

## 9. ロールバック設計

| Step | ロールバック手段 | 影響範囲 |
| --- | --- | --- |
| Step 1 | `git revert <commit-1>` | `outputs/phase-01/main.md` のみ |
| Step 2 | `git revert <commit-2>` | `outputs/phase-02/*.md` 3 点のみ |
| Step 3 | `git revert <commit-3>` | `outputs/phase-03/*.md` 2 点のみ |
| Step 4 | `git revert <commit-4>` | SoT マトリクス追記分のみ |
| Step 5 | `git revert <commit-5>` | TC ログ追記分のみ |
| Step 6 | `git revert <commit-6>` | ランブック本体のみ |

粒度を保つ理由: 設計文書は再評価で部分修正が頻発する。Step ごとにコミット分離することで、評価表だけ・SoT マトリクスだけを revert 可能にし、他 Step 成果物との関係を壊さない。

## 10. 自己適用順序ゲート確認

| ゲート | 条件 |
| --- | --- |
| Phase 5 → Phase 6 | TC-1〜TC-6 全 GREEN（Step 5 ログ取得済） |
| Phase 5 → Phase 11 | open question 0 件 + SoT マトリクス確定 + 採択方式 B 確定 |
| Phase 5 → UT-09 着手 | 本ランブック完了 + AC-9 PASS（UT-09 が独立着手可能と判定） |

## 11. DoD チェック

- [x] Step 1〜6 を単独コミットで完了する手順が記述済
- [x] 各コミットが `git revert` 単独で戻せる粒度
- [x] SoT 決定マトリクスが本ランブック §6 と `sync-method-comparison.md` §5 で整合
- [x] TC-1〜TC-6 検証コマンドが §7 に網羅
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` PASS（実行ログ取得は Phase 9）
- [ ] open question 0 件（Phase 3 main.md §9 で達成済）
- [ ] 曖昧表現（実装で判断 / TBD / 要検討 / 後で決める）0 件（Phase 9 grep で再確認）

## 12. 苦戦箇所・注意事項の遵守

- **混在コミット禁止**: Step 1〜6 を 1 コミットに混ぜない。
- **比較評価表を空欄で残さない**: PASS/MINOR/MAJOR 全観点 × 全案を必ず埋める（AC-8）。
- **SoT 揺れ禁止**: 「Sheets 優先」と「D1 優先」を文中で混在させない。本ランブック §6 を唯一の正本とする。
- **`sync_log` 物理 DDL 禁止**: 論理設計のみ。CREATE TABLE は UT-04 に引き継ぐ。
- **コード実装に踏み出さない**: scheduled() ハンドラ実装に踏み出した瞬間に docs-only スコープ違反。実装は UT-09。
- **rg / grep 互換性**: 本ランブックは `rg` 前提。CI 互換性が必要な場合は Phase 9 で `grep -rn` 代替を再評価。

## 13. 次 Phase 引き継ぎ

- Phase 6（異常系検証）へ Step 1〜6 のコミット ID / Green ログ / SoT 決定マトリクス確定 / open question 0 件証跡を引き継ぎ
- UT-09 着手ゲートとして本ランブック完了 + AC-9 PASS を要求
