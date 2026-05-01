# Phase 11: 手動テスト検証（NON_VISUAL 縮約）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | retry 回数と offset resume 方針の統一 (U-UT01-09) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト検証（NON_VISUAL 縮約） |
| 作成日 | 2026-04-30 |
| 前 Phase | 10 (最終レビューゲート) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク分類 | docs-only / NON_VISUAL（机上検証 / 設計確定タスク） |
| visualEvidence | NON_VISUAL |
| user_approval_required | false |
| GitHub Issue | #263 (CLOSED) |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL（縮約）**
- 判定理由:
  - 本タスクは canonical な retry / backoff / offset resume 方針の **設計確定** に閉じる docs-only タスクであり、UI / Renderer / 画面遷移を一切伴わない。
  - 実装変更は UT-09 追補へ委譲するため、本 Phase で実コード実行や migration apply は行わない。
  - 一次証跡は「Phase 9 quota 試算の再計算検証」「参照ドキュメント存在確認」「canonical 値の cross-reference 整合チェック」の机上ログである。
- **`outputs/phase-11/screenshots/` は作成しない**（NON_VISUAL のため screenshots ディレクトリ自体不要）。
- 固定文言（`outputs/phase-11/main.md` / `manual-smoke-log.md` 冒頭に必須記載）:

  ```markdown
  ## テスト方式

  UI/UX変更なしのため Phase 11 スクリーンショット不要
  ```

- 参照: `.claude/skills/task-specification-creator/references/phase-template-phase11.md`（NON_VISUAL 縮約テンプレ）

## 目的

Phase 1〜10 で確定した canonical retry 最大回数 / Exponential Backoff curve / `processed_offset` 採否 / D1 migration 影響評価 / Sheets API quota 整合 / `SYNC_MAX_RETRIES` 過渡期方針について、Phase 9 の quota 試算を独立に再計算して数値整合を再確認し、参照ドキュメントが実在し読める状態にあることを机上で検証し、canonical 値が workflow 内 / aiworkflow-requirements 索引候補 / 起票元 unassigned 仕様の各所で矛盾なくクロスリファレンスできることを最終チェックする。実コード変更・migration apply・wrangler 実行は本 Phase に含まない（UT-09 追補へ委譲）。

## 必須成果物（NON_VISUAL 縮約 4 ファイル）

| 成果物 | パス | 役割 |
| --- | --- | --- |
| 主成果物 | `outputs/phase-11/main.md` | manual smoke 結果サマリ（テスト方式固定文言 / 検証 3 観点 / 判定一覧 / 既知制限） |
| 代替 evidence | `outputs/phase-11/manual-smoke-log.md` | 机上検証の実施記録（コマンド / 期待値 / 実結果 / 一致判定） |
| 補助 | `outputs/phase-11/link-checklist.md` | workflow 内 / aiworkflow-requirements / 起票元 / 既存実装の参照リンク健全性 |

> Phase 11 では上記 3 ファイルが必須。`screenshots/.gitkeep` は **作成禁止**。

## 実行タスク

- [ ] Task 11-1: `outputs/phase-11/main.md` に NON_VISUAL 固定文言と検証 3 観点（quota 再計算 / 参照存在確認 / canonical cross-reference）の判定サマリを記述する。
- [ ] Task 11-2: `outputs/phase-11/manual-smoke-log.md` に 3 観点の机上検証ログを「コマンド / 前提条件 / 期待結果 / 実結果 / 一致判定」の 4 項目構造で記録する。
- [ ] Task 11-3: Phase 9 `outputs/phase-09/quota-worst-case-calculation.md` の数値（canonical retry 回数 × backoff curve × batch_size × cron 間隔における 100s window 内 request 数）を独立に再計算し、500 req/100s 未満であることを再確認する。
- [ ] Task 11-4: Phase 2 `outputs/phase-02/canonical-retry-offset-decision.md` / `migration-impact-evaluation.md`、Phase 5 `outputs/phase-05/ut09-handover-runbook.md`、Phase 7 `outputs/phase-07/ac-matrix.md`、Phase 9、Phase 10 `outputs/phase-10/go-no-go.md` が実在し reachable であることを `ls` / `rg` で確認する。
- [ ] Task 11-5: canonical retry 最大回数 / backoff curve / `processed_offset` 採否の 3 値が、Phase 2 決定文書 / Phase 5 申し送り runbook / Phase 7 AC マトリクス / 起票元 `docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md` の各所で矛盾なく一致していることを `rg` で cross-reference 検証する。
- [ ] Task 11-6: 既存実装側の参照（`apps/api/src/jobs/sync-sheets-to-d1.ts` の `DEFAULT_MAX_RETRIES = 5` / `SYNC_MAX_RETRIES` / `apps/api/migrations/0002_sync_logs_locks.sql` の `processed_offset` 不在）が依然として canonical との差分として成立していることを再確認する（実装の修正は UT-09 へ委譲するため、ここでは差分の存在確認のみ）。
- [ ] Task 11-7: `outputs/phase-11/link-checklist.md` に上記参照リンク（workflow 内 / aiworkflow-requirements 索引候補 / 起票元 / 既存実装 / 上流 UT-01）の健全性を表で記録する。
- [ ] Task 11-8: 既知制限（実コード未修正 / production 適用未実施 / 実 Sheets API トラフィックでの実測未実施 等）を 4 件以上列挙し、それぞれ委譲先（UT-09 追補 / U-UT01-07 / U-UT01-08）を記載する。

## 検証 3 観点（docs-only / 設計確定タスク向け）

### 観点 A: Phase 9 quota 試算の再計算検証

- 対象: `outputs/phase-09/quota-worst-case-calculation.md` の最大 request 数算定
- 入力: canonical retry 最大回数 / canonical Backoff curve（base / 上限 / jitter 採否）/ batch_size 100 / cron 間隔 6h / 手動同期同時刻発生ケース
- 期待値: worst case 100s window 内 request 数 < 500（Sheets API quota project 上限）
- 実施手段: 表計算（電卓 / `bc` / Python REPL のいずれか）で独立に算定し、Phase 9 数値と一致することを確認
- 不一致時: Phase 9 へ差し戻し（Phase 10 GO 判定の前提が崩れるため）

### 観点 B: 参照ドキュメント存在確認

- 対象: workflow 内 Phase 1〜10 成果物 / 起票元 unassigned 仕様 / 上流 UT-01 Phase 02 成果物 / 既存実装 / 既存 migration / aiworkflow-requirements 索引候補
- 期待値: すべてのパスが実在し reachable（`ls` / `rg` で 0-exit）
- 実施手段:

  ```bash
  # workflow 内成果物の存在確認
  ls -1 docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-{02,05,07,09,10}/

  # 上流 UT-01 / 起票元 / 既存実装 / 既存 migration の存在確認
  ls -1 docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md \
        docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md \
        docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md \
        apps/api/src/jobs/sync-sheets-to-d1.ts \
        apps/api/migrations/0002_sync_logs_locks.sql
  ```

- 不一致時: 不在ファイルを Phase 8 ドキュメント整流化へ差し戻すか、参照を更新する。

### 観点 C: canonical 値の cross-reference 整合

- 対象: canonical retry 最大回数 / canonical Backoff curve / `processed_offset` 採否 / `SYNC_MAX_RETRIES` 既定値方針
- 期待値: Phase 2 決定文書 / Phase 5 UT-09 申し送り runbook / Phase 7 AC マトリクス / 起票元 unassigned 仕様の updated 状態 / aiworkflow-requirements 索引候補で同じ canonical 値を指している
- 実施手段:

  ```bash
  # canonical retry 最大回数の cross-reference
  rg -n "retry|maxRetries|MAX_RETRIES" \
     docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/

  # processed_offset 採否の cross-reference
  rg -n "processed_offset" \
     docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/ \
     docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/

  # backoff curve の cross-reference
  rg -n "backoff|baseMs|Exponential" \
     docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/
  ```

- 不一致時: drift の所在を `link-checklist.md` Blocker として記録し、Phase 8 へ差し戻す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/canonical-retry-offset-decision.md | canonical 値の正本（cross-reference の中心） |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/migration-impact-evaluation.md | migration 影響机上評価（再確認対象） |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-05/ut09-handover-runbook.md | UT-09 申し送り内容との整合 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-07/ac-matrix.md | AC1〜AC6 の証跡パス整合 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-09/quota-worst-case-calculation.md | quota 再計算の検証元 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-10/go-no-go.md | GO 判定の前提確認 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md | 起票元仕様（canonical 入力） |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md | retry 仕様の上流（仕様 3 回 / backoff 1s〜32s） |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md | `processed_offset` の論理定義 |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 既存実装側の差分対象（`DEFAULT_MAX_RETRIES = 5` / `withRetry({ baseMs: 50 })`） |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 既存 migration（`processed_offset` 不在） |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase11.md | NON_VISUAL 縮約テンプレ |
| 参考 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | sync / retry / offset 索引（Phase 12 で更新対象） |

## 代替 evidence 差分表（NON_VISUAL 必須）

| Phase 11 シナリオ | 元前提 | 代替手段 | カバー範囲 | 保証外 / 申し送り先 |
| --- | --- | --- | --- | --- |
| S-A: quota 再計算 | 実 Sheets API トラフィック観測 | 表計算による独立再算定 | canonical 値での 100s window worst case | 実トラフィックでの実測（→ UT-09 phase-11） |
| S-B: 参照存在確認 | reviewer 目視 | `ls` / `rg` 0-exit | パス到達性 | 参照先の意味的正しさ（→ Phase 8 / Phase 10 で担保） |
| S-C: canonical cross-reference | reviewer 目視突合 | `rg` による全文 cross-reference | 値の文字列一致 | 文脈整合（→ Phase 3 / Phase 10 ゲートで担保済み） |
| S-D: 既存実装差分 | 実コード修正 | コード grep による差分の存在確認のみ | canonical との乖離が消えていないこと | 実装の修正（→ UT-09 追補） |
| S-E: production 影響 | 実 production 同期実行 | 机上 migration 影響評価 | DDL / DEFAULT / rollback 手順の論理整合 | 実 production 適用（→ U-UT01-07 / UT-09） |

> **NON_VISUAL のため screenshot 不要**。本表により「何を保証し、何を保証できないか」を明示する。

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | 実コード修正（`DEFAULT_MAX_RETRIES = 5` → canonical 値）は本 Phase で実施しない | 実装側の差分が残存 | UT-09 追補（または UT-09 受入条件への canonical 申し送り） |
| 2 | `processed_offset` カラム追加 migration は本 Phase で実施しない | D1 schema 物理対応未了 | U-UT01-07（`sync_log` 物理対応）/ UT-09 |
| 3 | 実 Sheets API quota 観測は実施しない | worst case 数値は机上算定のみ | UT-09 phase-11（実 sync ジョブ smoke）/ UT-08 monitoring |
| 4 | `SYNC_MAX_RETRIES` wrangler 環境変数の実値変更は実施しない | 実環境の挙動は据え置き | UT-09 追補で wrangler.toml / .dev.vars 反映 |
| 5 | NON_VISUAL のため screenshot 不要、机上ログが一次証跡 | 視覚証跡なし | `manual-smoke-log.md` / `link-checklist.md` で補完 |
| 6 | enum リネーム / ledger 整合は対象外 | 値ポリシーに閉じる | U-UT01-08（enum 統一）/ U-UT01-07（ledger 整合） |

## ウォークスルーシナリオ発見事項リアルタイム分類欄

各観点の実行中に発見した事項を即座に分類するためのテンプレート。

| # | 観点 | 発見事項 | 分類 | 対応方針 |
| - | ---- | -------- | ---- | -------- |
| 1 | A/B/C | （実施時に記入） | Blocker / Note / Info | （実施時に記入） |

**分類基準**:
- **Blocker**: Phase 12 完了前に修正必須。canonical 値 drift / 参照リンク切れ / quota 上限超過の数値矛盾。
- **Note**: 改善推奨だが Phase 12 完了をブロックしない。未タスク化を `unassigned-task-detection.md` で検討。
- **Info**: 記録のみ。今後の参考情報。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC1〜AC6 の証跡列に本 Phase の `manual-smoke-log.md` パスを記入 |
| Phase 9 | quota 再計算が一致しない場合は Phase 9 へ差し戻し |
| Phase 10 | GO 判定の前提として本 Phase の 3 観点 PASS を確認 |
| Phase 12 | 本 Phase で発見した Note / Info を `unassigned-task-detection.md` / `skill-feedback-report.md` に渡す |
| UT-09 | canonical 申し送り内容（retry / backoff / offset / SYNC_MAX_RETRIES）の引き渡し |
| U-UT01-07 | `processed_offset` 物理対応の申し送り |

## 多角的チェック観点

- 価値性: canonical 値が UT-09 実装着手に必要十分な解像度で確定しているか。
- 実現性: 机上検証で 3 観点すべてが 0-exit / 数値一致で成立するか。
- 整合性: workflow 内 / 上流 UT-01 / 起票元 unassigned / 既存実装の各所で canonical 値が矛盾なく参照されているか。
- 運用性: `SYNC_MAX_RETRIES` 過渡期方針が UT-09 担当者に伝達可能な記述になっているか。
- 認可境界: 実 token / 実 database_id / 実会員データが evidence に混入していないか（NON_VISUAL ログでも secret hygiene 適用）。
- Secret hygiene: `manual-smoke-log.md` / `link-checklist.md` に `wrangler` 直接呼び出しの痕跡が無いこと（CLAUDE.md「Cloudflare 系 CLI 実行ルール」遵守）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | main.md 作成（NON_VISUAL 固定文言 + 3 観点判定サマリ） | 11 | spec_created | 観点 A/B/C すべて記録 |
| 2 | manual-smoke-log.md 作成（机上検証ログ） | 11 | spec_created | 4 項目構造（コマンド / 前提 / 期待 / 実結果） |
| 3 | quota 再計算（観点 A） | 11 | spec_created | Phase 9 数値と一致確認 |
| 4 | 参照存在確認（観点 B） | 11 | spec_created | `ls` / `rg` 0-exit |
| 5 | canonical cross-reference（観点 C） | 11 | spec_created | `rg` で値一致確認 |
| 6 | 既存実装差分の存在再確認 | 11 | spec_created | UT-09 申し送り根拠 |
| 7 | link-checklist.md 作成 | 11 | spec_created | 参照リンク健全性表 |
| 8 | 既知制限 4 件以上列挙 | 11 | spec_created | 委譲先明記 |

## manual evidence（実施時に採取するログの placeholder）【必須】

| 項目 | コマンド | 採取先 | 採取済 |
| --- | --- | --- | --- |
| 観点 A: quota 再計算 | 表計算 / `bc` / Python REPL | `outputs/phase-11/manual-smoke-log.md` §A | TBD |
| 観点 B: 参照存在 | `ls -1 ...` / `rg -n ...` | `outputs/phase-11/manual-smoke-log.md` §B | TBD |
| 観点 C: cross-reference | `rg -n "retry\|maxRetries\|processed_offset\|backoff" ...` | `outputs/phase-11/manual-smoke-log.md` §C | TBD |
| 既存実装差分再確認 | `rg -n "DEFAULT_MAX_RETRIES\|SYNC_MAX_RETRIES\|baseMs" apps/api/src/jobs/sync-sheets-to-d1.ts` | `outputs/phase-11/manual-smoke-log.md` §D | TBD |
| migration 列不在再確認 | `rg -n "processed_offset" apps/api/migrations/0002_sync_logs_locks.sql \|\| echo "ABSENT (canonical 差分継続)"` | `outputs/phase-11/manual-smoke-log.md` §E | TBD |
| 参照リンク検証 | `rg -n "u-ut01-09\|UT-01\|UT-09\|U-UT01-07\|U-UT01-08" docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment` | `outputs/phase-11/link-checklist.md` | TBD |

> 各セクションには「コマンド」「実行日時」「stdout 抜粋」「期待値との一致 / 不一致」を記録する。実 token / database_id / 会員データは混入させない。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | 3 観点判定サマリ + NON_VISUAL 固定文言 + 既知制限 |
| ログ | outputs/phase-11/manual-smoke-log.md | 観点 A/B/C/D/E の机上検証ログ（4 項目構造） |
| 参照検証 | outputs/phase-11/link-checklist.md | workflow 内 / 上流 / 起票元 / 既存実装の参照健全性表 |
| メタ | artifacts.json | Phase 11 状態の更新（`phases[10].status` のみ。`metadata.workflow_state` は spec_created 据え置き） |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイルが揃っている
- [ ] `main.md` / `manual-smoke-log.md` 冒頭に NON_VISUAL 固定文言「UI/UX変更なしのため Phase 11 スクリーンショット不要」が記載されている
- [ ] 観点 A: Phase 9 quota 試算と独立再計算の数値が一致し、worst case が 500 req/100s 未満であることが確認されている
- [ ] 観点 B: workflow 内 / 上流 UT-01 / 起票元 unassigned / 既存実装 / 既存 migration のすべての参照パスが reachable
- [ ] 観点 C: canonical retry 最大回数 / backoff curve / `processed_offset` 採否の 3 値が cross-reference で矛盾なく一致
- [ ] 既存実装側の差分（`DEFAULT_MAX_RETRIES = 5` / `processed_offset` カラム不在）が依然として canonical との差分として再確認されている
- [ ] 既知制限が 4 件以上列挙され、それぞれ委譲先（UT-09 / U-UT01-07 / U-UT01-08 / UT-08）が明記されている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] 実コード変更 / migration apply / wrangler 実行が本 Phase で発生していない（docs-only 境界遵守）

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物 3 ファイルが `outputs/phase-11/` 配下に配置される設計
- AC1〜AC6 の証跡採取コマンドが定義済み
- production 適用 / 実コード修正 が UT-09 / U-UT01-07 へ委譲されることが明記
- artifacts.json の `phases[10]`（Phase 11）が完了時に `completed`、`metadata.workflow_state` は `spec_created` 据え置き

## Phase 完了スクリプト呼出例

```bash
# 1. 成果物 3 ファイルが揃っているか確認
ls -1 docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-11/main.md \
      docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-11/manual-smoke-log.md \
      docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-11/link-checklist.md

# 2. NON_VISUAL 固定文言の存在確認
rg -n "UI/UX変更なしのため Phase 11 スクリーンショット不要" \
     docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-11/main.md \
     docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-11/manual-smoke-log.md

# 3. screenshots/ 不在確認
test ! -d docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-11/screenshots && echo "OK: NON_VISUAL"

# 4. canonical 値 cross-reference 0-exit
rg -n "processed_offset|maxRetries|backoff" \
     docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/

# 5. artifacts.json の phase 11 status を completed に更新（root + outputs 両方）
#    metadata.workflow_state は "spec_created" のまま据え置き
```

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - 観点 A/B/C の判定サマリを Phase 12 `system-spec-update-summary.md` に転記
  - 既知制限 #1〜#4 を Phase 12 `unassigned-task-detection.md` に formalize（UT-09 追補 / U-UT01-07 / UT-08 への申し送り）
  - 発見事項のうち Note / Info を Phase 12 `skill-feedback-report.md` の改善候補に集約
  - canonical 値（retry 最大回数 / backoff curve / `processed_offset` 採否 / `SYNC_MAX_RETRIES` 既定値方針）の確定状態を Phase 12 `implementation-guide.md` Part 2 に渡す
- ブロック条件:
  - 必須 3 ファイルのいずれかが欠落
  - NON_VISUAL 固定文言が未記載
  - 観点 A の数値が Phase 9 と不一致（→ Phase 9 へ差し戻し）
  - 観点 B で reachable でない参照が 1 件以上（→ Phase 8 へ差し戻し）
  - 観点 C で canonical 値の drift を検出（→ Phase 8 / Phase 10 へ差し戻し）
  - `screenshots/` ディレクトリが誤って作成されている
  - 実コード変更 / migration apply / wrangler 実行が本 Phase 内で混入
