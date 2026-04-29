# Phase Template Phase12

## 対象

Phase 12 の documentation update。

## 必須タスク

1. implementation guide
2. system spec update summary
3. documentation changelog
4. unassigned-task detection
5. skill feedback report
6. phase12-task-spec-compliance-check（Task 1〜5 の全完了確認）

## Phase 10 MINOR 追跡テーブル

Phase 10 で MINOR 判定された指摘がある場合、Phase 12 で追跡結果を記録する。

| MINOR ID | 指摘内容 | 解決予定Phase | 解決確認Phase | 解決方法 | ステータス |
| -------- | -------- | ------------- | ------------- | -------- | ---------- |
| ...      | ...      | Phase 5/8/12  | Phase 10/12   | ...      | 解決済/未タスク化 |

- Phase 10 MINOR は全て未タスク仕様書に変換するか、Phase 12 内で解決する（省略不可）
- `documentation-changelog.md` に追跡結果を記録する

## Step 2 = N/A vs BLOCKED 判定基準

`system-spec-update-summary.md` の Step 2（aiworkflow-requirements 仕様更新）は **N/A** と **BLOCKED** を厳密に区別する。両者を取り違えると「正本登録すべき変更が放置される」「不要な spec 追記でノイズが増える」事故が起きる。

| ステータス | 適用条件 | 例 |
| --- | --- | --- |
| **N/A** | ドメイン仕様（API endpoint / D1 schema / IPC 契約 / UI route / auth / Cloudflare Secret）に **無影響** で、正本登録自体が不要 | git 管理境界変更（`.gitignore` / `.gitattributes`）、worktree governance、lefthook hook 整備、skill ledger の派生物管理 |
| **BLOCKED** | 正本登録が **必要** だが上流方針が未確定で書けない | 新規 API endpoint の schema が確定待ち、D1 migration 方針が staging で未検証 |

判定フロー: 「ドメイン仕様（不変条件 #1〜#7）に touch するか？」→ No なら **N/A**、Yes かつ方針確定なら **実施**、Yes だが方針未確定なら **BLOCKED**。

実例: skill-ledger-a1-gitignore（2026-04-28）は git 管理境界変更のみで API/D1/IPC/UI/auth/Cloudflare 全て非影響のため Step 2 = N/A。

## docs-only モードフラグ

設計タスク（docs-only）の場合、以下の挙動が変わる:

| 項目 | 通常タスク | docs-only タスク |
| ---- | ---------- | ---------------- |
| Step 1-G 検証コマンド | 実行して結果記録 | **必要コマンドを実行して結果記録**（`verify/validate/links/skill validation` を含む） |
| implementation-guide Part 2 | 実装詳細・コード例 | 型定義・配置ルール・使用例 |
| Step 1-B 実装状況 | `completed` | `spec_created` |

## 出力テンプレ

| file | 最低限必要な内容 |
| --- | --- |
| `implementation-guide.md` | Part 1 / Part 2、validator 要件 |
| `system-spec-update-summary.md` | Step 1 / Step 2 の結果 |
| `documentation-changelog.md` | 変更ファイル、validator 結果、current/baseline |
| `unassigned-task-detection.md` | 0件でも summary を残す |
| `skill-feedback-report.md` | 改善点 or 改善点なし |
| `phase12-task-spec-compliance-check.md` | Task 12-1〜12-6 の準拠チェック |
| `phase12-task-spec-compliance-check.md` | Task 12-1〜12-5 の準拠チェック |

## 設計タスク向け補足（SF-02, SF-03対応）

### システム仕様書更新の2段階方式（SF-02対応）

設計タスクでは `.claude/skills/` への実更新がPR時まで保留されがちなため、以下の2段階方式を標準とする。

> **worktree 環境での注意（P57 再発防止）**: worktree でのコンフリクトリスクを理由に `.claude/skills/` の実更新を先送りしてはならない。`仕様策定のみ` / `実行予定` などの planned wording を残さず、Phase 12 完了前に実更新を行うこと。コンフリクトリスクより仕様書と実装の乖離リスクの方が高い。

| ステージ | タイミング | 内容 | 必須 |
| --- | --- | --- | --- |
| Step 2A: 計画記録 | Task 2 開始時 | 更新予定ファイルと変更内容を列挙し、完了前に必ず実更新結果へ置換する形で `system-spec-update-summary.md` に記録 | ✅ |
| Step 2B: 実更新 | Task 2 完了前 | 実際に `.claude/skills/` 配下の仕様書を更新し、planned wording を除去 | ✅ |

`仕様策定のみ` / `実行予定` / `保留として記録` 等の planned wording は Phase 12 完了前に全て実更新ログへ昇格すること。

**planned wording 残存確認コマンド（完了前に必ず実行）**:

```bash
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/{{FEATURE_NAME}}/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' || echo "planned wording なし"
```

### 設計タスク特有の未タスク検出パターン（SF-03対応）

設計タスクでは未タスクが「全て実装タスク」になるパターンが標準。以下の4パターンを必ずチェックする。

| パターン | 候補の例 | 優先度目安 |
| --- | --- | --- |
| **型定義→実装** | 型を定義したが、ハンドラ側のランタイム実装が未完了 | 高 |
| **契約→テスト** | IPC契約・インターフェースを設計したが、対応する統合テストが未作成 | 中 |
| **UI仕様→コンポーネント** | 画面仕様を設計したが、Reactコンポーネントが未実装 | 中 |
| **仕様書間差異→設計決定** | 複数仕様書で矛盾する記述が残り、どちらが正しいか決定できていない | 高 |

**SF-03 チェック手順**:

1. Phase 1 要件定義の受入基準を再確認し「将来対応」とした項目を列挙する
2. Phase 2/3 設計・レビューの MINOR 判定事項をリストアップする
3. 上記4パターンと照合し、未タスク化対象を確定する
4. 0件でも `unassigned-task-detection.md` に「設計タスクパターン確認済み、0件」と明記する

## 未タスク配置先ディレクトリの明示（P38 再発防止）

未タスク指示書は必ず以下のディレクトリに配置する。配置先の判断を省略しない。

| 条件 | 配置先 |
| --- | --- |
| 未完了の未タスク（通常） | `docs/30-workflows/unassigned-task/` |
| completed workflow 由来の継続 backlog | `docs/30-workflows/completed-tasks/<workflow>/unassigned-task/` |
| 完了済み standalone UT | `docs/30-workflows/completed-tasks/*.md` |
| legacy | `docs/30-workflows/completed-tasks/unassigned-task/` |

**確認コマンド（Phase 12 完了前に必ず実行）**:

```bash
# 未タスク指示書の物理ファイル存在を確認
ls docs/30-workflows/unassigned-task/

# current workflow 起点でのリンク整合確認
node .claude/skills/task-specification-creator/scripts/verify-unassigned-links.js \
  --source docs/30-workflows/{{FEATURE_NAME}}/outputs/phase-12/unassigned-task-detection.md
```

## 成果物ファイル名の照合チェック

Phase 12 の成果物ファイル名がテンプレートと一致していることを確認する。名前の不一致はバリデーションスクリプトの検出漏れを引き起こす。

| テンプレート上の名前 | 正しいファイル名 |
| --- | --- |
| 未タスク検出レポート | `unassigned-task-detection.md` |
| ドキュメント更新履歴 | `documentation-changelog.md` |
| 実装ガイド | `implementation-guide.md` |
| スキルフィードバック | `skill-feedback-report.md` |
| 仕様書更新サマリー | `system-spec-update-summary.md` |

**注意**: `unassigned-task-report.md` のような類似名ファイルを作成しないこと。正式名称は `unassigned-task-detection.md` である。

## 設計タスク特有: 全タスク実装化パターン（IMPL 派生）

設計タスク（`spec_created`）の Phase 12 で、設計成果物全体が次 Wave で実装される場合、`unassigned-task-detection.md` だけでなく以下を実施する:

1. 派生実装タスクを `docs/30-workflows/unassigned-task/UT-XX-IMPL-<task-name>-implementation.md` として独立起票する
2. 元 design タスクは `state: spec_created` で確定し、`scope.含まない` に「実装コード作成」を明記する
3. 派生実装タスクには以下を必ず記載する:
   - 上流設計パス（`docs/30-workflows/<task>/` への参照）
   - 元タスク ID と派生関係
   - 実装前ゲート（外部 SaaS 無料枠再確認、関連タスクの確定状況など）
   - 受入条件（実装側）と参照資料（phase-02 SSOT 群へのリンク）
4. 元タスクから IMPL タスクへの一方向リンクを `参照資料` セクションに残す

参考実例: UT-08 monitoring-alert-design → `docs/30-workflows/unassigned-task/UT-08-IMPL-monitoring-alert-implementation.md`

## 設計タスク特有: 上流 runbook 差分追記タイミング判定

上流タスク（例: 05a observability-and-cost-guardrails）の runbook へ差分を追記する場合、追記タイミングを以下の 3 判定で決定する:

| 判定基準 | same-wave 追記 | Wave N+1 別 PR | baseline 留置 |
| --- | --- | --- | --- |
| 上流 outputs 実体生成済み | 必須 | 任意 | - |
| 設計と実装の責務分離 | 不要 | 必要 | - |
| 実装ブロッカーの有無 | なし | あり（差分が実装入力） | 上流再合意待ち |

判定結果は `outputs/phase-02/runbook-diff-plan.md` に明記し、Phase 12 の `system-spec-update-summary.md` で実施有無を明示する。

## phase-12.md の 300 行上限と設計タスクの例外条項

通常の Phase 12 仕様書は 300 行以内に収めることを推奨する。ただし、以下のいずれかに該当する場合は条件付きで超過を許容する。

| 条件 | 根拠 | 必須記載 |
| ---- | ---- | -------- |
| 設計タスク（`spec_created` / docs-only）で 6 必須成果物の構成が意味的に分割不可能 | 6 タスク × 16〜17 項目の compliance マトリクスは横断参照のため分割すると追跡性を損なう | phase-12.md 冒頭に「分割しない理由」を 1 段落で明示 |
| NON_VISUAL タスクで Phase 11 代替証跡（main / manual-smoke-log / link-checklist）と Phase 12 outputs を直列記述する必要がある | NON_VISUAL の証跡が分散すると mirror parity 監査時に追跡コストが増大する | phase-12.md 冒頭に「Phase 11 NON_VISUAL 連動」を 1 段落で明示 |

**判定原則**: 「行数」より「責務分離不可能性の根拠」を優先する。300 行を超える場合は冒頭に根拠を必ず残し、後続の監査者が分割可否を再判断できるようにする。

## タスク種別ごとの Phase 12 outputs 必須セット

| outputs ファイル | VISUAL タスク | NON_VISUAL タスク | spec_created（設計）タスク |
| ---- | ---- | ---- | ---- |
| `implementation-guide.md` | Part 1（アナロジー）+ Part 2（実装詳細） | Part 1 + Part 2（型定義・配置・使用例） | Part 1 + Part 2（仕様サマリ・参照） |
| `system-spec-update-summary.md` | Step 1 必須、Step 2 条件付き | Step 1 必須、Step 2 条件付き | Step 1 必須、Step 2A/2B（planned wording 残禁止） |
| `documentation-changelog.md` | 変更ファイル + validator 結果 | 変更ファイル + validator 結果 | 仕様書差分中心、current/baseline 分離 |
| `unassigned-task-detection.md` | 0 件でも理由明記 | 0 件でも理由明記 | SF-03 4 パターン照合の有無を明記 |
| `skill-feedback-report.md` | 改善点 or 「なし」明記 | 同左 | 同左（観察事項を含む） |
| `phase12-task-spec-compliance-check.md` | Task 12-1〜12-6 全項目 | 同左 + NON_VISUAL 代替証跡項目 | 同左 + spec_created 専用項目（planned wording 残無し等） |

## 関連ガイド

- [phase-12-documentation-guide.md](phase-12-documentation-guide.md) — Task 12-1〜12-6 の詳細手順
- [spec-update-workflow.md](spec-update-workflow.md) — Step 1/2 / Step 1-D の実行フロー
- [spec-update-validation-matrix.md](spec-update-validation-matrix.md) — 完了判定コマンド
- [phase-11-12-guide.md](phase-11-12-guide.md) — Phase 12 完了条件チェックリスト（全項目）
- [unassigned-task-workflow-integration.md](unassigned-task-workflow-integration.md) — 設計タスク全体実装化の処理 / `spec_created` → 実装派生タスク化パターン

## Part 2 必須5項目チェック対応表（C12P2-1〜C12P2-5）

SKILL.md Part 2「実装ガイド技術者向け」記述と `phase-12-completion-checklist.md` の判定基準を 1:1 で対応させ、ドリフトを構造的に排除する。

| # | チェック項目 | SKILL.md 記述 | implementation-guide.md Part 2 内の判定基準 |
| --- | --- | --- | --- |
| C12P2-1 | TypeScript 型定義 | SKILL.md Part 2「型定義」 | ` ```ts ` ブロックまたは `interface` / `type` 定義が 1 件以上 |
| C12P2-2 | API シグネチャ | SKILL.md Part 2「API シグネチャ」 | 関数シグネチャ / メソッド定義が 1 件以上 |
| C12P2-3 | 使用例 | SKILL.md Part 2「使用例」 | コード例（ts / bash / md）が 1 件以上 |
| C12P2-4 | エラー処理 | SKILL.md Part 2「エラー処理」 | try/catch / Result / Either / エラー型定義が 1 件以上 |
| C12P2-5 | 設定可能パラメータ・定数 | SKILL.md Part 2「設定値」 | env / `as const` / config table が 1 件以上 |

### docs-only タスク向けの代替判定

docs-only タスクでは Part 2 が「型定義 / 配置ルール / 使用例」で代替されるため、本チェックも docs-only ブランチで以下のように相当する記述として判定する。

| # | docs-only での相当記述 |
| --- | --- |
| C12P2-1 | 型定義（YAML スキーマ / JSON スキーマ / メタフィールド型） |
| C12P2-2 | API 相当（SKILL.md セクション参照経路 / 発火条件式） |
| C12P2-3 | 使用例（タスク仕様書テンプレ実例 / 適用 PR） |
| C12P2-4 | エラー処理相当（NO-GO 条件 / 差戻しルール） |
| C12P2-5 | 設定値相当（artifacts.json.metadata 必須フィールド / 環境変数） |

詳細は [phase-12-completion-checklist.md](phase-12-completion-checklist.md) §「docs-only 用判定ブランチ: 状態分離」を参照。
