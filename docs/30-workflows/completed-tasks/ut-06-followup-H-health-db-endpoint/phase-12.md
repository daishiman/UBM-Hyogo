# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/api `/health/db` D1 疎通 endpoint 実装仕様化 (ut-06-followup-H-health-db-endpoint) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-29 |
| 前 Phase | 11 (手動 smoke / NON_VISUAL walkthrough) |
| 次 Phase | 13 (PR 作成 / ユーザー承認後の別 PR で実コード実装) |
| 状態 | spec_created |
| タスク種別 | implementation / workflow_mode: docs-only / visualEvidence: NON_VISUAL / scope: api_health |
| user_approval_required | false（本仕様書は仕様レベル定義に閉じる。実コード適用 PR は Phase 13 承認後の別オペレーション） |

> **300 行上限超過の根拠**: 本 Phase は Phase 12 必須 5 タスク（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report）を全件「仕様レベル定義」として網羅する責務に加え、Phase 11 4 階層 evidence trace（自動テスト / 手動 smoke spec / NON_VISUAL 代替 evidence / FU-I 整合）と Phase 2 §認証 4 案 / §state ownership / §smoke 同期方針への双方向 trace を直列追跡する必要があるため、責務分離不可能性を根拠に 300 行を許容超過する。

## 目的

Phase 1〜11 で確定した「不変条件 #5 侵害なし + 503/Retry-After 運用境界 + UT-22 完了前提 + AC-1〜AC-9 + base case = 案 D（固定パス + X-Health-Token + WAF）」を docs validator が読み取れる形で固定し、本ワークフローが「Phase 1〜13 タスク仕様書整備までで完了し、実コード実装は Phase 13 ユーザー承認後の別 PR」である境界を明示する。

本 Phase 12 仕様書では **5 タスクの仕様レベル定義** に閉じる。Phase 12 outputs 配下の 5 成果物（implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md）の **実体作成は Phase 13 承認後の別 PR** で行う。本仕様書はその 5 タスクが「何をどの粒度で書くべきか」を Phase 13 実行者と reviewer が突合できる仕様レベル定義として固定する。

依存成果物は Phase 1（AC-1〜AC-9 / 真の論点）/ Phase 2（擬似コード / レスポンス schema / 認証 4 案 / state ownership）/ Phase 3（base case = 案 D / NO-GO 条件 / open question 5 件）/ Phase 11（smoke S-03/S-07 期待値テンプレ）とする。

## 実行タスク（Phase 12 必須 5 タスク・全件必須）

1. **実装ガイド作成（Part 1 中学生レベル / Part 2 開発者技術詳細）の仕様レベル定義** — 出力先 `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新サマリー（Step 1-A/1-B/1-C + 条件付き Step 2 判定）の仕様レベル定義** — 出力先 `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴の仕様レベル定義** — 出力先 `outputs/phase-12/documentation-changelog.md`
4. **未タスク検出レポート（0 件でも出力必須・current/baseline 分離）の仕様レベル定義** — 出力先 `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須・3 観点必須）の仕様レベル定義** — 出力先 `outputs/phase-12/skill-feedback-report.md`

> 上記 5 タスクの**実体ファイル**は本 PR では作成しない。Phase 13 承認後に別 PR で生成する。本仕様書は「実体ファイルが満たすべき必須セクション / セルフチェック項目 / pitfalls 参照」を仕様レベルで固定するに留まる。

## docs-only / spec_created モード適用表

| 項目 | 適用内容 |
| --- | --- |
| workflow_mode | docs-only（実コード変更ゼロ。`apps/api/src/index.ts` への endpoint 追加は Phase 13 承認後の別 PR） |
| visualEvidence | NON_VISUAL（API 内部 health endpoint。UI なし） |
| scope | api_health |
| Step 1-A | REQUIRED（spec_created でも N/A 不可。同 wave で LOGS.md×2 + topic-map + 親タスク双方向リンク） |
| Step 1-B | 実装状況 = `spec_created`（実コード実装は Phase 13 承認後の別 PR） |
| Step 1-C | REQUIRED（関連タスク UT-22 / UT-06 親 / UT-06-FU-I / UT-08 のステータス current 化） |
| Step 1-G 検証コマンド | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-06-followup-H-health-db-endpoint`（docs validator のみ。実コード関連 typecheck / lint は対象外） |
| Step 2 判定 | aiworkflow-requirements の API 章 / health check 章 / `01-api-schema.md` への `/health/db` 追記が REQUIRED か OPTIONAL かを §タスク 2 で判定 |

## タスク 1: 実装ガイド作成（Part 1 + Part 2）の仕様レベル定義

**担当 Phase**: 12（仕様レベル定義のみ。実成果物作成は Phase 13 承認後の別 PR）
**出力先パス**: `outputs/phase-12/implementation-guide.md`
**pitfalls 参照**: phase-12-pitfalls.md `[Feedback W1-02b-3]`（identifier drift）/ `[UBM-011]`（smoke 期待 endpoint と実装の突合）/ `[UBM-012]`（wrangler 直接呼び出し禁止）

### 必須セクション

#### Part 1（中学生レベル / 日常の例え話・専門用語禁止）

- 「**health check ってなに？**」: 学校の保健室で毎朝「具合悪い人いる？」って聞くのと同じ。サーバーにも「ちゃんと動いてる？」って聞く窓口がいる。それが `/health`。
- 「**データベースに ping するってどういうこと？**」: 友達にトランシーバーで「聞こえる？」って呼んで「聞こえるよ」と返ってくるか確かめるのと同じ。データベース（D1）にも「ねぇ動いてる？」（`SELECT 1`）と聞いて返事が来るか確かめる。これが `/health/db`。
- 「**なんで `/health` と `/health/db` を分けるの？**」: 「学校全体が無事か」と「保健室の先生がいるか」は別の質問。学校（API サーバー）が動いてても、保健室（データベース）だけ閉まってることもある。だから 2 つの窓口を分ける。これを「SLO 分離」と呼ぶ（= サービスごとに別々に健康診断する）。
- 「**失敗したとき 503 と Retry-After って？**」: 保健室の先生が今ちょっと席を外してるとき「30 秒後にまた来てね」と紙を貼る。サーバーも DB が一時的に応答しないときは「503（一時的に使えない）」+「Retry-After: 30（30 秒後に再試行して）」を返す。
- 「**なんで unauth で公開しないの？**」: 保健室の窓口を校門の外からも自由にノックできる状態にすると、いたずらで何百回もノックされて先生が疲れる。だから「合言葉付きの窓（ヘッダ token）」と「校門の警備員（WAF）」の二重で守る。

**Part 1 専門用語セルフチェック表**:

| 専門用語 | 日常語への言い換え |
| --- | --- |
| health check | 保健室の朝の点呼 |
| ping / `SELECT 1` | トランシーバーの「聞こえる？」 |
| SLO 分離 | 学校全体と保健室を別々に健康診断 |
| 503 Service Unavailable | 「ちょっと今使えません」の貼り紙 |
| Retry-After | 「○秒後にまた来てね」の指示 |
| WAF | 校門の警備員 |
| ヘッダ token | 合言葉付きの隠し窓 |
| D1 binding | 教室とデータベースをつなぐ専用ケーブル |

#### Part 2（開発者技術詳細）

| セクション | 仕様レベル必須内容 |
| --- | --- |
| `D1Database` 型 / Hono Bindings ジェネリクス | `Env.DB: D1Database` 型定義 / `const app = new Hono<{ Bindings: Env }>()` ジェネリクス記述 / `c.env.DB` 参照経路（Phase 2 §3 の擬似コードを再掲） |
| `c.env.DB.prepare("SELECT 1").first()` シーケンス | 成功時 `{ ok: true, db: "ok", check: "SELECT 1" }` 200 / 失敗時 `c.header("Retry-After", "30") + { ok: false, db: "error", error: <message> }` 503（Phase 2 §4 擬似コード再掲）|
| 4 ステップ実装手順 | (1) `Env.DB` 型追加 / (2) `app.get("/health/db", ...)` ハンドラ追加 / (3) `wrangler.toml` の `[[d1_databases]]` binding=DB 確認 / (4) Phase 11 smoke S-03/S-07 期待値テンプレ同期 |
| WAF + ヘッダ token案 D の運用 | endpoint パス例 `/health/db` / Cloudflare Secrets による token 注入 / WAF rule で rate limit + IP 制御 / `apps/web` 側からは fetch しない（不変条件 #5 遵守） |
| Retry-After 設計 | 仮値 30 秒 / 最終値は Phase 11 smoke 実走 + UT-08 通知基盤閾値合意で確定 / 503 + Retry-After で UT-08 誤検知抑制の運用境界 |
| ロールバック | endpoint 削除 + `HEALTH_DB_TOKEN` secret 廃止 + WAF rule 解除の 1〜2 コミット粒度（Phase 3 base case 採用根拠と一致） |

> **Part 2 で含めない事項**: `apps/web` 側コード変更（不変条件 #5 違反）/ D1 schema 変更（UT-22 別タスク）/ wrangler 直接呼び出し（`scripts/cf.sh` 経由を厳守, `[UBM-012]` 準拠）

### セルフチェック項目

- [ ] Part 1 が 5 つの例え話を含む（health check / ping / SLO 分離 / 503+Retry-After / WAF+ヘッダ token）
- [ ] Part 1 専門用語セルフチェック表が 8 行以上
- [ ] Part 2 の擬似コードが Phase 2 §3〜§5 と identifier drift していない（`Env.DB` / `Hono<{ Bindings: Env }>` / `c.env.DB.prepare("SELECT 1").first()` 一致）
- [ ] Part 2 が 4 ステップ実装手順を含む
- [ ] `apps/web` への変更指示が含まれていない（不変条件 #5）
- [ ] `wrangler` 直接コマンドが含まれていない（`scripts/cf.sh` ラッパー経由のみ）

## タスク 2: システム仕様書更新サマリーの仕様レベル定義

**担当 Phase**: 12（仕様レベル定義のみ）
**出力先パス**: `outputs/phase-12/system-spec-update-summary.md`
**pitfalls 参照**: phase-12-pitfalls.md Step 1-C 関連タスクテーブル未実行 / topic-map 未更新 / LOGS.md 1 ファイルのみ更新

### Step 1-A: 仕様書修正対象（REQUIRED）

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | `/health/db` の成功 200 / 失敗 503 + Retry-After を API contract として追記 |
| `apps/api` README（存在すれば） | `/health/db` endpoint と D1 binding 名 `DB` の関係を追記 |
| API contract docs（`docs/30-workflows/` 配下既存スペック） | `/health` と `/health/db` の SLO 分離方針を追記 |
| `docs/30-workflows/LOGS.md` | UT-06-FU-H spec_created 行追加 |
| `.claude/skills/task-specification-creator/LOGS.md` | docs-only / NON_VISUAL implementation 適用例として記録 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | API health check 章への `/health/db` 反映を index 再生成で同期 |
| 親タスク `completed-tasks/ut-06-production-deploy-execution` への双方向リンク | UNASSIGNED-H が UT-06-FU-H として spec 化された旨を記録 |

### Step 1-B: 実装状況テーブル更新（REQUIRED）

- 実装状況 = **`spec_created`**
- 理由: 本ワークフローは仕様書整備に閉じ、実コード実装（`apps/api/src/index.ts` への endpoint 追加）は Phase 13 ユーザー承認後の別 PR で行う。
- `docs/30-workflows/LOGS.md` の UT-06 関連テーブルで UT-06-FU-H 行を `spec_created`（completed ではない）に更新。

### Step 1-C: 検証コマンド

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  docs/30-workflows/ut-06-followup-H-health-db-endpoint
```

### Step 2 判定: aiworkflow-requirements 仕様更新

| 反映対象章 | 判定 | 理由 |
| --- | --- | --- |
| API 章（`/health/db` endpoint 追加） | **REQUIRED** | 新規 endpoint contract が aiworkflow-requirements 正本に存在しないため、API 章に追記が必要 |
| health check 章（SLO 分離方針） | **REQUIRED** | `/health` と `/health/db` の SLO 分離は運用方針の変更。aiworkflow-requirements 正本へ反映が必要 |
| WAF / ヘッダ token運用章 | **OPTIONAL** | 案 D の運用詳細は Phase 12 implementation-guide で十分。正本への反映は UT-GOV-001 等の governance 系で別途吸収可 |

### セルフチェック項目

- [ ] Step 1-A の同期対象が 7 行以上
- [ ] Step 1-B が `spec_created` で固定（`completed` 誤記禁止）
- [ ] Step 1-C 検証コマンドが workflow ディレクトリを正確に指している
- [ ] Step 2 が章ごとに REQUIRED / OPTIONAL を判定（理由付き）
- [ ] LOGS.md 2 ファイル（aiworkflow-requirements + task-specification-creator）の更新指示が両方含まれている

## タスク 3: ドキュメント更新履歴の仕様レベル定義

**担当 Phase**: 12（仕様レベル定義のみ）
**出力先パス**: `outputs/phase-12/documentation-changelog.md`
**pitfalls 参照**: phase-12-pitfalls.md「documentation-changelog.md が不完全」/ workflow-local と global sync を別ブロックで記録（[Feedback BEFORE-QUIT-003]）

### エントリフォーマット必須項目

| 列 | 必須記載 |
| --- | --- |
| 日付 | YYYY-MM-DD（Phase 13 実行日） |
| 影響ファイル | 絶対パス（`docs/...` / `.claude/skills/...` / `CLAUDE.md` 等） |
| 変更概要 | 1〜2 行 / 何をどう変えたか |
| 起源タスク | UT-06-FU-H |
| Step 区分 | Step 1-A / Step 1-B / Step 1-C / Step 2 のいずれか（個別記録） |

### 必須エントリ（Phase 13 実体生成時に最低限記録すべき行）

| 日付 | 変更種別 | 対象ファイル | 変更概要 | Step |
| --- | --- | --- | --- | --- |
| 実行日 | 新規 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/ | Phase 1〜13 仕様書 + outputs/phase-{01,02,03,11,12,13}/ | 新規 |
| 実行日 | 同期 | docs/30-workflows/LOGS.md | UT-06-FU-H spec_created 行追加 | Step 1-A |
| 実行日 | 同期 | .claude/skills/task-specification-creator/LOGS.md | docs-only / NON_VISUAL implementation 適用例 | Step 1-A |
| 実行日 | 同期 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | API health check 章への `/health/db` 反映 | Step 1-A |
| 実行日 | 同期 | docs/30-workflows/LOGS.md | UT-06 関連テーブル UT-06-FU-H 行 spec_created | Step 1-B |
| 実行日 | 同期 | completed-tasks/ut-06-production-deploy-execution / outputs/phase-12/unassigned-task-detection.md | UT-06-FU-H への双方向リンク追加 | Step 1-C |
| 実行日 | 追記 | docs/00-getting-started-manual/specs/01-api-schema.md | `/health/db` API contract 追記 | Step 2 |
| 実行日 | 追記 | .claude/skills/aiworkflow-requirements/references（API / health 章） | `/health/db` SLO 分離方針追記 | Step 2 |

### セルフチェック項目

- [ ] Step 1-A / 1-B / 1-C / Step 2 の 4 区分が個別行として記録（マージ禁止）
- [ ] workflow-local 同期と global skill sync が別ブロック扱いで記述
- [ ] 「該当なし」の場合も明示的に行を残す（空欄禁止）

## タスク 4: 未タスク検出レポートの仕様レベル定義（0 件でも出力必須）

**担当 Phase**: 12（仕様レベル定義のみ）
**出力先パス**: `outputs/phase-12/unassigned-task-detection.md`
**pitfalls 参照**: phase-12-pitfalls.md「未タスク検出レポートで 0 件判定のまま未修正」/ unassigned-task-required-sections.md（4 必須セクション）

### current / baseline 分離フォーマット必須

#### baseline（UT-06 親タスクから継承した既知未タスク群）

| 検出項目 | 種別 | 推奨対応 | 区分 |
| --- | --- | --- | --- |
| UT-22 D1 migration SQL 適用 | 既存独立タスク | 本タスク上流前提として参照固定 | baseline（既起票済） |
| UT-06-FU-I（/health 期待値同期） | 既存独立タスク | 本タスクと prefix 整合のみ約束 | baseline（既起票済） |
| UT-08 通知基盤の Retry-After 閾値合意 | 既存独立タスク | 本タスク Phase 11 smoke で値確定 | baseline（既起票済） |

#### current（本ワークフローで派生した未タスク）

| 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- |
| `Retry-After` 値の UT-08 側合意タスク | runbook 注記 + UT-08 連携 | UT-08 内に「`/health/db` 503 の Retry-After=30 を誤検知させない閾値」合意行を追加 | unassigned-task として formalize 候補（UT-08 内吸収可） |
| `HEALTH_DB_TOKEN` rotation SOP タスク | 運用 SOP | 1Password 管理 + Cloudflare Secrets 注入 + rotation 周期 / 手順を SOP 化 | unassigned-task として formalize 必須（governance 系） |
| FU-I `/health` prefix 整合最終確認タスク | docs 整合 | UT-06-FU-I 内で `{ ok: ... }` prefix 整合を最終確認 | UT-06-FU-I 内に吸収（独立 formalize 不要） |

### 未タスクテンプレ 4 必須セクション（formalize 時に必ず含める）

1. 苦戦箇所【記入必須】
2. リスクと対策
3. 検証方法
4. スコープ（含む / 含まない）

### セルフチェック項目

- [ ] current / baseline が完全分離（混在禁止）
- [ ] 0 件の場合も「該当なし」セクションを明示
- [ ] 設計タスクパターン 4 種（型→実装 / 契約→テスト / UI 仕様→コンポーネント / 仕様書間差異）の確認跡が含まれる
- [ ] formalize 候補には割り当て先候補（UT-XX 内吸収 or 独立タスク）を明記
- [ ] `HEALTH_DB_TOKEN` rotation SOP は formalize 必須として扱う（運用上の必須）

## タスク 5: スキルフィードバックレポートの仕様レベル定義（改善点なしでも出力必須・3 観点必須）

**担当 Phase**: 12（仕様レベル定義のみ）
**出力先パス**: `outputs/phase-12/skill-feedback-report.md`
**pitfalls 参照**: phase-12-pitfalls.md「改善点なしでも出力必須」/ 3 観点テーブル必須・空テーブル禁止

### 3 観点必須テーブル

| 観点 | 仕様レベル必須内容 |
| --- | --- |
| **task-specification-creator skill** | `docs-only / NON_VISUAL implementation` の Phase 12 close-out が `spec_created` ステータスで適切に完結できたか / 5 タスク仕様レベル定義の粒度が phase-12-spec.md / phase-12-pitfalls.md と整合したか / Part 1 中学生レベルの例え話が「health check / ping / SLO 分離」で再利用可能なテンプレ化候補になるか |
| **aiworkflow-requirements skill** | `/health/db` の API contract / SLO 分離方針を正本（API 章 / health check 章）へ反映する経路が Step 2=REQUIRED で適切に判定できたか / topic-map.md 再生成と LOGS.md 同期が二重でカバーできたか |
| **scripts/cf.sh ラッパ運用** | 本タスクは `apps/api/wrangler.toml` の D1 binding 確認のみで `scripts/cf.sh` を直接利用しないが、Phase 13 実コード適用 PR では `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` を必ず使う旨が implementation-guide に反映されているか / `[UBM-012]` の wrangler 直接呼び出し禁止規約と整合しているか |

### セルフチェック項目

- [ ] 3 観点（task-specification-creator / aiworkflow-requirements / scripts/cf.sh）すべてに行がある
- [ ] 改善点なしの場合も「観察事項なし」の文言で行を埋める（空テーブル禁止）
- [ ] フィードバック ID（UBM-NNN 等）は append-only で再利用しない（既存 ID と衝突確認）

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| Phase 7 AC trace 表 | AC-1〜AC-9 → タスク 1 implementation-guide Part 2 / タスク 2 system-spec-update-summary に各 AC が trace される |
| Phase 11 smoke S-03 / S-07 | smoke 期待値テンプレ → タスク 1 Part 2 4 ステップ手順「(4) Phase 11 smoke 期待値テンプレ同期」へ trace |
| Phase 13 PR description | タスク 3 documentation-changelog → PR description 草案の根拠 / タスク 4 unassigned-task-detection の current → PR body の「related work」節 / タスク 1 implementation-guide Part 2 4 ステップ → Phase 13 実コード適用 PR の手順正本 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 必須 5 タスクの正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | Phase 12 落とし穴 / Feedback ID |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase12.md | Phase 12 テンプレ正本 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/index.md | AC-1〜AC-9 / 苦戦箇所 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-01.md | 真の論点 / 4 条件評価 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-02.md | 擬似コード / state ownership / 認証 4 案 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-03.md | base case = 案 D / NO-GO / open question |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-11/smoke-test-result.md | smoke S-03 / S-07 期待値テンプレ |
| 必須 | CLAUDE.md §重要な不変条件 #5 / §Cloudflare 系 CLI 実行ルール | apps/web からの D1 直接アクセス禁止 / `scripts/cf.sh` ラッパ強制 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-12.md | NON_VISUAL Phase 12 の heavy reference 例 |

## 実行手順

### ステップ 1: タスク 1（implementation-guide）の仕様レベル定義

- Part 1 の例え話 5 つ（health check / ping / SLO 分離 / 503+Retry-After / WAF+ヘッダ token）と専門用語セルフチェック表 8 行以上を §タスク 1 に固定。
- Part 2 の 6 セクション（D1Database 型 / `c.env.DB.prepare` シーケンス / 4 ステップ手順 / WAF+ヘッダ token案 D / Retry-After 設計 / ロールバック）を §タスク 1 に固定。

### ステップ 2: タスク 2（system-spec-update-summary）の仕様レベル定義

- Step 1-A 同期対象 7 行以上 + Step 1-B `spec_created` + Step 1-C 検証コマンド + Step 2 章別 REQUIRED/OPTIONAL を §タスク 2 に固定。

### ステップ 3: タスク 3（documentation-changelog）の仕様レベル定義

- エントリフォーマット 5 列 + 必須エントリ 8 行以上を §タスク 3 に固定。

### ステップ 4: タスク 4（unassigned-task-detection）の仕様レベル定義

- baseline 3 行（UT-22 / FU-I / UT-08）+ current 3 行（Retry-After 合意 / `HEALTH_DB_TOKEN` rotation / FU-I prefix 整合）+ 4 必須セクション規約を §タスク 4 に固定。

### ステップ 5: タスク 5（skill-feedback-report）の仕様レベル定義

- 3 観点（task-specification-creator / aiworkflow-requirements / scripts/cf.sh）テーブルを §タスク 5 に固定。

## 多角的チェック

- **不変条件 #5 違反なし**: タスク 1 Part 2 4 ステップに `apps/web` 編集指示が含まれていないか / state ownership 表（Phase 2 §6）が implementation-guide に正しく引用されるか。
- **5 タスク全件出力（仕様レベル定義として）**: 本仕様書 §タスク 1〜§タスク 5 が漏れなく書かれているか。1 件でも欠けたら FAIL。
- **docs-only 整合**: 本 Phase 12 仕様書では実成果物（5 ファイル）の実体を作らない。実体作成は Phase 13 承認後の別 PR である旨が冒頭・成果物節・完了条件で 3 重明記されているか。
- **identifier drift なし**: タスク 1 Part 2 で参照する識別子（`Env.DB` / `Hono<{ Bindings: Env }>` / `c.env.DB.prepare("SELECT 1").first()` / `Retry-After: 30`）が Phase 2 §3〜§5 と完全一致するか。
- **`scripts/cf.sh` 強制**: タスク 5 観点 3 で wrangler 直接呼び出し禁止規約（`[UBM-012]`）が反映されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | タスク 1（implementation-guide）の仕様レベル定義 | 12 | spec_created | Part 1 + Part 2 必須セクション + セルフチェック |
| 2 | タスク 2（system-spec-update-summary）の仕様レベル定義 | 12 | spec_created | Step 1-A/B/C + Step 2 章別判定 |
| 3 | タスク 3（documentation-changelog）の仕様レベル定義 | 12 | spec_created | エントリフォーマット + 必須エントリ 8 行 |
| 4 | タスク 4（unassigned-task-detection）の仕様レベル定義 | 12 | spec_created | current/baseline 分離 + 4 必須セクション |
| 5 | タスク 5（skill-feedback-report）の仕様レベル定義 | 12 | spec_created | 3 観点必須 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-12.md | 本ファイル（Phase 12 5 タスクの仕様レベル定義） |

> **重要**: Phase 12 outputs の 5 実体ファイル（implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md）は **本 PR では作成しない**。Phase 13 ユーザー承認後の別 PR で生成する。

## 完了条件

- [ ] タスク 1〜5 すべての仕様レベル定義（必須セクション + セルフチェック + pitfalls 参照）が本仕様書に記述されている
- [ ] 各タスクで「担当 Phase: 12 / 出力先パス / 必須セクション / セルフチェック / pitfalls 参照」の 5 要素が揃っている
- [ ] docs-only / spec_created モード適用表が記述されている
- [ ] 300 行上限超過の根拠が冒頭に記述されている
- [ ] 統合テスト連携（Phase 7 / Phase 11 / Phase 13）が記述されている
- [ ] 多角的チェック（不変条件 #5 / 5 タスク全件 / docs-only 整合 / identifier drift / scripts/cf.sh 強制）が記述されている
- [ ] 「実成果物 5 件は Phase 13 承認後の別 PR で生成」が冒頭・成果物節・完了条件で 3 重明記されている

## タスク 100% 実行確認【必須】

- 実行タスク 5 件（タスク 1〜タスク 5 の仕様レベル定義）すべてが本仕様書に記述済み
- 本仕様書の状態 = `spec_created`
- 実成果物（5 ファイル）は Phase 13 承認後の別 PR で生成（本 PR では未作成が正）
- artifacts.json の `phases[11].status` 更新は別タスク

## 次 Phase への引き渡し

- 次 Phase: 13（PR 作成 / **user_approval_required: true**）
- 引き継ぎ事項:
  - 本 Phase 12 仕様書（5 タスクの仕様レベル定義）→ Phase 13 実コード適用 PR の docs 同期スコープ
  - タスク 1 Part 2 4 ステップ手順 → Phase 13 `apply-runbook` 相当の実装手順正本
  - タスク 3 必須エントリ 8 行 → Phase 13 PR description 草案の根拠
  - タスク 4 current 3 件（特に `HEALTH_DB_TOKEN` rotation SOP）→ Phase 13 後続の formalize 候補
  - タスク 5 観点 3（`scripts/cf.sh` 強制）→ Phase 13 deploy 系コマンド規約
- ブロック条件:
  - 5 タスクのいずれかの仕様レベル定義が欠落
  - 実成果物（5 ファイル）が本 PR で誤って作成されている（spec_created モード違反）
  - identifier drift（Phase 2 §3〜§5 と本仕様書 §タスク 1 Part 2 の不一致）
  - 不変条件 #5 違反（`apps/web` 編集指示が implementation-guide 仕様に混入）
  - `wrangler` 直接呼び出し（`scripts/cf.sh` 経由でない deploy 手順）が implementation-guide 仕様に混入
