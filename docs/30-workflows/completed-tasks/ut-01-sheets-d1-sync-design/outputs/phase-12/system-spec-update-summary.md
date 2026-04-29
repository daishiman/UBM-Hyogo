# system-spec-update-summary.md

> Task 12-2: システム仕様書更新サマリ。Step 1-A/B/C + 条件付き Step 2。

## サマリ宣言（最重要）

- **`workflow_state` 据え置き**: 本タスクは docs-only / spec_created。Phase 12 close-out で **`spec_created` のまま据え置く**（`completed` に書き換えない）。実装完了は UT-09 / UT-04 が担う。
- **aiworkflow-requirements への影響**: 正本仕様自体への直接更新は **変更不要**。ただし `sync_log` active lock、Cron pull 採択、SoT 方針は UT-04 / UT-09 へ委譲する実装入力として本仕様書に固定する。

## Step 1-A: タスク完了記録（同波更新）

| 更新対象 | 内容 |
| --- | --- |
| `task-workflow-completed.md` 等の記録 | UT-01 を「設計仕様策定 完了（spec_created）」として追記済み（実装完了ではないことを明記） |
| `index.md`（本タスク root） | `状態` 欄は `spec_created` のまま据え置き / 完了タスクセクションへの自動移動はしない |
| LOGS.md ×2（必要箇所） | UT-01 spec 完了 entry を追記済み |
| topic-map.md（必要箇所） | `scripts/generate-index.js` で反映済み |

本改善ターンでは commit / PR / push は実行しない。Step 1-A のリポジトリ横断反映は same-wave sync として実ファイルへ反映し、Phase 13 のユーザー承認ゲートは維持する。

## Step 1-B: 実装状況テーブル更新

| 項目 | 値 |
| --- | --- |
| UT-01 状態 | `spec_created`（**`completed` ではない**） |
| 関連実装タスク | UT-09（Sheets→D1 同期ジョブ実装）/ UT-04（D1 物理スキーマ） |
| 仕様書パス | `docs/30-workflows/ut-01-sheets-d1-sync-design/` |

## Step 1-C: 関連タスクテーブル更新

| タスク | 状態の current facts |
| --- | --- |
| UT-03（Sheets API 認証方式設定） | 並列着手可。本タスク採択方式（Cron pull）を前提に認証実装詳細を確定 |
| UT-04（D1 物理スキーマ） | 本タスクの `sync_log` 論理スキーマ（13 カラム）+ active lock / 冪等性キー戦略を引き継ぎ |
| UT-09（Sheets→D1 同期ジョブ実装） | 本仕様書のみで着手可能（AC-9 担保）|
| UT-08（監視 / アラート） | `sync_log` 保持期間運用と連動（TECH-M-04） |

## Step 2: aiworkflow-requirements 仕様更新（条件付き）

| 正本領域 | 判定 | 根拠 |
| --- | --- | --- |
| Cloudflare Cron / Workers | 変更不要 | Cron 採択は UT-01 固有の設計決定。Cloudflare 基盤仕様は既存 references を参照するだけで変更しない |
| D1 schema | 後続タスクへ委譲 | `sync_log` は論理設計のみ。物理 DDL / migration は UT-04 が正本化する |
| Sheets API 認証 | 後続タスクへ委譲 | 認証方式と Secret は UT-03 が担う |
| API endpoint | 後続タスクへ委譲 | `POST /admin/sync` は UT-09 実装時に API 仕様へ反映する |
| task workflow tracking | same-wave sync 対象 | `spec_created` として記録するが、root 状態を `completed` にしない |

→ Step 2 は単純な N/A ではなく、上記 3 値判定（変更不要 / 後続タスクへ委譲 / same-wave sync 対象）で完結する。

## 既存実装差分の扱い

30種思考法レビューで、現行 worktree に既存 `apps/api` 同期実装（`sync_job_logs` / `sync_locks`）が存在することを確認した。UT-01 は docs-only のためコードは変更しないが、`sync_log` 論理設計を新規物理テーブル作成指示と誤読しないよう、Phase 2 / Phase 12 に対応表と未タスク U-7〜U-10 を追加した。

| 領域 | 対応 |
| --- | --- |
| D1 schema | `sync_log` は概念名。物理実装は既存 `sync_job_logs` / `sync_locks` との整合を優先 |
| status / trigger enum | U-8 で canonical set を決定 |
| retry / offset resume | U-9 で既存 `DEFAULT_MAX_RETRIES=5` と `processed_offset` 不在を再判定 |
| shared contract | U-10 で `packages/shared` 型/Zod schema 化を検討 |

## 計画系 wording 残存確認

```bash
rg -n "仕様策定のみ|実行対象|保留として記録" \
  docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' \
  || echo "計画系 wording なし"
```

期待結果: 「計画系 wording なし」。本ファイル内の説明文以外に、完了済みと誤読される未記入欄を残さない。

## state ownership 維持確認

- `index.md` の `状態` 欄: `spec_created` のまま
- `artifacts.json.metadata.workflow_state`: `spec_created` のまま
