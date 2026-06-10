# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_evidence_captured |

## 目的

AC-1〜AC-7 の充足を、各 AC を担保するタスク（Lane A / Lane B）・テスト・検査と対応付けて最終確認し、blocker の有無を判定する。本サイクルは仕様書作成段階（`implemented_local_evidence_captured`）のため、判定列は「実装時に満たすべき条件」と「充足エビデンス（実行時に取得）」を分離し、エビデンスは **pending（本実装サイクルで取得）** とする。あわせて本経路外の MINOR 指摘を Phase 12 未タスク化候補として baseline 列挙する（機能影響なしを理由に省略しない）。

## 実行タスク

### 10.1 AC 充足トレース表

| AC | 内容（要約） | 担保 Lane / 変更 | 充足テスト / 検査 | 判定 |
|----|--------------|-----------------|--------------------|------|
| AC-1 | `GET /api/admin/members/:id` が seed source タグ保有メンバー（TEST-MEM-09）で 200 | A: `builder.ts:429` の `normalizeTagSource()` 置換 → `AdminMemberDetailViewZ.safeParse` 成功 | BD-2（builder detail 回帰）/ L-3b | implemented_local_evidence_captured: 実装時 PASS 予定（pending） |
| AC-2 | `normalizeTagSource` が既知値恒等・未知/空/null/undefined → `'manual'`、例外なし | A: `common.ts` 新規純関数 | TS-1〜TS-8 / L-3a | 同上（pending） |
| AC-3 | `TagSourceZ` が `.catch("manual")` で safeParse 不落 | A: `primitives.ts` の `.catch("manual")` | TS-9（恒等）/ TS-10（失敗→`'manual'`）/ L-3a | 同上（pending） |
| AC-4 | builder.ts 357/429 が `normalizeTagSource()` 置換（マイページ詳細も 500 回避） | A: `builder.ts:357`（`buildMemberProfile`）/ `:429`（`buildAdminMemberDetailView`） | BD-1（profile）/ BD-2（detail）/ L-3b / L-1b | 同上（pending） |
| AC-5 | `MemberDrawer` fetch 失敗時に再試行ボタン表示・押下で回復 | B: `MemberDrawer.tsx` の `reloadKey` state + 依存配列 `[memberId, reloadKey]` + retry ボタン（`data-testid="member-detail-retry"`） | MD-1（失敗→retry 表示）/ MD-2（押下→回復）/ MD-3（成功系回帰）/ L-3c | 同上（pending・VISUAL） |
| AC-6 | endpoint surface / response shape / D1 schema / Form 不変 | A/B: 値正規化は view object 構築時のみ・UI は既存 fetch 踏襲 | Q-4（diff 静的検査） | 同上（NO-GO 対象・pending） |
| AC-7 | `TagSource` union 非拡張・新規 test は `*.spec.*`・HEX 直書きなし | A/B | Q-1（HEX 0）/ Q-2（命名）/ Q-4（union 非拡張）/ Q-5（削除なし） | 同上（NO-GO 対象・pending） |

### 10.2 blocker 判定

| 観点 | blocker か | 根拠 |
|------|-----------|------|
| 設計の実現性 | 非 blocker | 純関数 1 + zod 1 行 + キャスト 2 置換 + UI retry の最小差分（Phase 3 §5/§6 PASS） |
| AC-6 / AC-7（NO-GO 条件） | 実行時に要厳格確認 | union 拡張・shape 変更・HEX 混入・`*.test.*` 命名のいずれかが起きれば blocker。Q-1/Q-2/Q-4/Q-5 で検知し、崩れた場合は該当 Lane を revert（Phase 8 §8.5） |
| identity 系回帰（`.catch` 影響） | 解消方針確定 | `.catch` は失敗時フォールバックのみで出力 union 不変。正常データは既知値ゆえ意味不変（E-5 / Phase 2 §7） |
| 未決事項 | なし | Lane A / Lane B は独立・並列実装可能。本サイクル内で完結し先送り / 別 PR / バックログ送り無し |

**判定: blocker なし。** 実装着手後は AC-6 / AC-7 の NO-GO を最優先で監視し、L-1〜L-3 全 PASS かつ Q-1〜Q-5 違反 0 をもって品質充足とする。

### 10.3 MINOR 指摘（Phase 12 未タスク化候補・baseline）

> 以下は本経路（詳細 API 500 + ドロワー本体の retry）の解消には不要だが、「機能影響なし」を理由に省略せず、必ず baseline 候補として列挙する（Phase 12 `unassigned-task-detection.md` で起票要否を判定）。

| ID | 指摘 | 本サイクル外の理由 | baseline 起票候補 |
|----|------|-------------------|-------------------|
| MINOR-1 | `MemberTagsEditor` 等ドロワー内子コンポーネントの子 fetch（tags 取得）に個別 retry 強化が無い | 子 fetch は詳細 fetch 成功時の `MemberDrawerBody` 内でのみマウントされ、本不具合（詳細 fetch 500）の経路では走らない（`_shared-context.md §1 真因 B`）。本サイクルはドロワー本体の回復で症状を解消 | 子 fetch 個別エラー回復の UX 強化タスク（VISUAL・apps/web 単独） |
| MINOR-2 | `member_tags.source` への DB CHECK 制約が無く、DB レベルでは任意文字列が今後も入りうる | schema / migration 変更は不変条件で禁止（本ワークフロー方針はコード層 fail-soft 吸収を正本）。CHECK 制約追加は migration を伴う別タスク | `member_tags.source` への DB CHECK 制約追加 migration タスク（NON_VISUAL・apps/api migrations） |
| MINOR-3 | `01-api-schema.md` に tag `source` の値ドメイン（DB は任意文字列・view は 3 値正規化）の注記が無い | 契約 shape は不変ゆえ仕様更新は必須ではない（Phase 2 §8）。ただし将来の混乱回避に注記が有用 | API schema へ source 値ドメイン注記を追記する docs タスク（docs-only） |

これらは Phase 12 の未タスク検出で「今サイクルで起票するか / baseline として記録するか」を判定する。機能影響の有無で列挙自体を省略しない。

### 10.4 VISUAL エビデンス取扱い

- Lane B は `MemberDrawer` の error 分岐 UI に再試行ボタンを追加する（VISUAL）。`implemented_local_evidence_captured` 段階のため PNG は未取得とし、staging スクリーンショットは認証必須ゆえ user-gated（実装後 staging で取得）。
- `screenshots/` には実 PNG を置かず、capture metadata の `status` を `staging_visual_pending_user_gate` とし、`screenshots/.gitkeep` は validator error 回避のため**置かない**（PNG 0 件のディレクトリを残さない）。
- ローカルでの描画担保は MD-1〜MD-3（jsdom render・fetch モック）で代替し、Phase 11 で撮影計画（error → retry → 回復、修正後の詳細ドロワー正常表示）を記述する。

## 完了条件

- [x] AC-1〜AC-7 を担保 Lane・充足テスト / 検査と対応付け（充足エビデンスは `implemented_local_evidence_captured` ゆえ pending）
- [x] blocker 判定（blocker なし）と NO-GO 監視対象（AC-6 / AC-7）を明示
- [x] MINOR-1〜MINOR-3 を Phase 12 未タスク化候補として baseline 列挙（機能影響なしを理由に省略しない）
- [x] VISUAL エビデンスの user-gated・`staging_visual_pending_user_gate` 取扱いを記録

## 成果物

- `outputs/phase-10/phase-10.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | AC-6 の shape / status 不変基準・MINOR-3 注記候補 |
| Admin 管理 | `docs/00-getting-started-manual/specs/11-admin-management.md` | `/admin/members` ドロワー（AC-5 文脈） |
| 設計トークン | `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/09b-design-tokens.md` | AC-7 HEX 0 基準 |

- `outputs/phase-1/phase-1.md`（AC 正本）
- `outputs/phase-9/phase-9.md`（L-1〜L-3 / Q-1〜Q-5）
- `_shared-context.md §5/§6`（AC・スコープ外 = MINOR の根拠）

## 統合テスト連携

AC-1 / AC-4 を担保する BD-1 / BD-2（builder 回帰）が seed source 500 再発検知の正本。Phase 11 で `/admin/members` ドロワーの手動テスト計画とスクリーンショット証跡（user-gated）を記述し、Phase 12 で実装ガイド・SSOT 同期・未タスク（MINOR-1〜MINOR-3）・compliance へ引き継ぐ。
