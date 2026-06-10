# Phase 8: リファクタリング方針 + エラーパターン / fail-fast / rollback

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_evidence_captured |

## 目的

実装後の重複・責務漏れを除去するリファクタリング方針（対象 / Before / After / 理由 テーブル＝FB-RT-03）を確定し、Lane A / Lane B で起こり得る失敗パターンと fail-fast 条件・rollback 起点を列挙する。本サイクルはコード自体が user-gated（`implemented_local_evidence_captured`）だが、実装時に守るべき構造方針と障害時の戻り先を固定する。主眼は **builder.ts 357/429 の重複キャストを `normalizeTagSource` 1 関数へ集約（DRY 改善）** であり、新規重複を生まないことを確認する。

## 実行タスク

### 8.1 リファクタリング方針（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| builder.ts 357（`buildMemberProfile`）の source 構築 | `source: t.source as "rule" \| "ai" \| "manual"`（実 DB 値を無視する unsafe cast） | `source: normalizeTagSource(t.source)` | 値ドメインを fail-soft 正規化。seed/未知 source でも `TagSource` へ収束し safeParse 不落（AC-2/AC-4） |
| builder.ts 429（`buildAdminMemberDetailView`）の source 構築 | `source: t.source as "rule" \| "ai" \| "manual"`（357 と**同一の重複キャスト**） | `source: normalizeTagSource(t.source)` | 357 と同じ正規化を共有関数で集約 = DRY 改善。重複した inline cast を 1 関数呼び出しへ統一（Phase 3 判断 D-1） |
| source 正規化ロジックの所在 | builder.ts 内に inline cast が 2 箇所散在（正規化責務がどの層にも無い） | shared `normalizeTagSource` 純関数 1 つへ集約し、builder は consumer として呼ぶだけ | 値ドメイン正規化の所有権を shared（`TagSource` / `TagSourceZ` と同層）に置く。将来の他 consumer も再利用可（builder ローカル関数化＝不採用） |
| `TagSourceZ` の防壁 | `z.enum(["rule","ai","manual"])`（未正規化値で safeParse 失敗 → 500） | `z.enum(["rule","ai","manual"]).catch("manual")` | 層 1（正規化）をすり抜けた値の最終防壁。出力 union は不変ゆえ既存 consumer（`viewmodel.ts:71` / `identity.ts:68`）の意味は不変（AC-3/AC-7） |
| MemberDrawer の error 回復 | error 分岐は `<p role="alert">読み込み失敗: {error}</p>` のみ（retry 導線なし・依存 `[memberId]`） | error 文言 + 既存 `Button`（`variant="danger"` 相当・import 済み）の「再試行」を追加し、`reloadKey` state を `useEffect` 依存（`[memberId, reloadKey]`）へ加える | 新規 primitive を生やさず既存 `Button` を再利用。`reloadKey` 増分で同一 memberId でも再 fetch 可能化（Phase 3 判断 D-4・AC-5） |

### 8.2 navigation drift / 新規重複の確認

- **navigation drift なし**: 本サイクルは route 追加・遷移先変更・endpoint surface 変更を一切伴わない（`GET /api/admin/members/:id` の path/method/shape 不変・AC-6）。MemberDrawer の retry は同一 memberId への再 fetch のみで遷移を発生させない。
- **新規重複を生まない確認**: 357/429 の 2 箇所の重複キャストを `normalizeTagSource` 1 関数へ集約することで重複を減らす方向のみ。`normalizeTagSource` は shared 1 箇所に定義し、`builder.ts` からは import して呼ぶ（コピー実装を作らない）。`KNOWN_TAG_SOURCES` も shared 内 1 箇所定義で、`TagSourceZ` の enum 値（`primitives.ts`）と意味が一致するが、両者は別レイヤ（型/関数 vs zod）の独立した最小定義であり、相互参照による過剰結合を避ける（値ドリフトは TS-9/TS-10 の双方向テストで検知）。

### 8.3 エラーパターン一覧

| # | 段階 | エラー | 検出 | ハンドリング |
|---|------|--------|------|--------------|
| E-1 | A local | `viewmodel.spec.ts`（TS-1〜TS-8）が fail（既知値が恒等にならない / 未知値が `'manual'` にならない） | Phase 9 L-3a | `normalizeTagSource` の `includes` 判定・三項返却を `_shared-context.md §2-1` と照合し修正 |
| E-2 | A local | TS-9/TS-10 が fail（`TagSourceZ.safeParse('seed')` が success かつ `data='manual'` にならない / 正規値が恒等でない） | Phase 9 L-3a | `primitives.ts` の `.catch("manual")` 適用漏れ。enum 定義へ `.catch` を付与 |
| E-3 | A local | BD-1/BD-2 が fail（seed source タグで `safeParse` が通らない＝500 回帰） | Phase 9 L-3b | builder.ts 357/429 の置換漏れ。`as` キャストが残っていないか diff 確認し `normalizeTagSource()` へ置換 |
| E-4 | A local | builder 経由で `tags[].source` の出力型が `TagSource` 以外に化ける | Phase 9 L-1（typecheck） | `normalizeTagSource` 戻り値 `TagSource` を builder の `source` 型に一致させる。型注釈漏れを修正 |
| E-5 | A local | `identity.ts:68` 系の `TagSourceZ` 利用が回帰（意味変化） | Phase 9 L-3a / L-1 | `.catch` は失敗時フォールバックのみで出力 union 不変。正常データは既知値ゆえ挙動不変を回帰テストで確認 |
| E-6 | B local | MD-1 が fail（fetch 500 時に retry ボタン（`data-testid="member-detail-retry"`）が描画されない） | Phase 9 L-3c | error 分岐の Button 追加漏れ。`role="alert"` 保持 + testid 付与を確認 |
| E-7 | B local | MD-2 が fail（retry 押下で再 fetch されず回復しない） | Phase 9 L-3c | 押下ハンドラ `setError(null); setData(null); setReloadKey((k)=>k+1)` と `useEffect` 依存 `[memberId, reloadKey]` を確認 |
| E-8 | B local | MD-3（既存成功系）が回帰（初回描画が壊れる） | Phase 9 L-3c | 依存配列追加のみで初回挙動は不変のはず。既存 `MemberDrawer.tags.spec.tsx` / `MemberDrawer.tagInlineCreate.spec.tsx` を回帰実行 |
| E-9 | B local | retry ボタンに HEX 直書き / `bg-[#xxx]` が混入 | Phase 9 Q-1 | 既存 `Button` primitive + `--ubm-color-danger` 系トークンのみ使用へ修正（HEX 0） |
| E-10 | 横断 local | `pnpm typecheck` / `pnpm lint` が exit≠0 | Phase 9 L-1/L-2 | unused import / 型注釈漏れ / export-import 不整合を最小差分で修正。`lint --fix` を先に試す |

### 8.4 fail-fast / 縮退の方針

- Phase 9 の L-1（typecheck）/ L-2（lint）/ L-3a〜L-3c（対象 vitest）の **いずれか 1 件でも fail したら commit へ進まない**（gate）。
- AC-6（endpoint surface / response shape / D1 schema / Form 不変）・AC-7（`TagSource` union 非拡張・`*.spec.*` 命名・HEX 直書きなし）は **NO-GO 条件**。これらが崩れた場合は該当 Lane の diff を revert し、Phase 3 の方針へ戻る。
- 本サイクルはコード未コミットの仕様作成段階（`implemented_local_evidence_captured`）のため、実装着手後でも変更は worktree 内で完全に戻せる（cap=worktree）。

### 8.5 rollback 起点

| 状況 | rollback 起点 |
|------|---------------|
| Lane A で既存表示分岐（`TagPill` 等）が壊れる / identity 系回帰（E-5） | `primitives.ts` の `.catch` 追加と `common.ts` の `normalizeTagSource` 追加を revert。`TagSource` union は元から無変更 |
| Lane A で builder の型推論崩れ（E-4）/ seed 回帰未解消（E-3） | `builder.ts` 357/429 の置換 + import 追記のみ revert。他フィールド組み立ては元から無変更 |
| Lane B で既存 drawer 挙動が壊れる（MD-3 失敗） | `MemberDrawer.tsx` の `reloadKey` state・依存配列拡張・retry ボタンを revert（成功時 `MemberDrawerBody` / `MemberTagsEditor` は元から無変更） |
| 横断 typecheck/lint 不能 | Lane A / Lane B は完全独立並列ゆえ、失敗 Lane の diff のみ revert し他 Lane は保持 |

> Lane A（shared/api の値正規化）と Lane B（web UI の error 回復）は責務分離しており、いずれか 1 Lane の revert が他 Lane の成果を巻き込まない。

## 完了条件

- [x] リファクタリング方針を 対象 / Before / After / 理由 テーブル（FB-RT-03）で確定（主眼 = builder 357/429 重複キャストの `normalizeTagSource` 集約）
- [x] navigation drift なし・新規重複を生まないことを明示
- [x] E-1〜E-10 のエラーパターンを段階・検出・ハンドリング付きで列挙
- [x] fail-fast 条件（L-1/L-2/L-3 gate）と NO-GO 条件（AC-6 / AC-7）を明示
- [x] Lane 別 rollback 起点を確定

## 成果物

- `outputs/phase-8/phase-8.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | response shape 不変（AC-6 NO-GO の根拠） |
| Admin 管理 | `docs/00-getting-started-manual/specs/11-admin-management.md` | `/admin/members` ドロワー（Lane B retry の文脈） |
| 設計トークン | `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/09b-design-tokens.md` | `--ubm-color-danger` 系（E-9 HEX 0 の根拠） |

- `_shared-context.md §2-4`（builder 357/429 / `normalizeTagSource` / MemberDrawer の逐語固定）
- `outputs/phase-3/phase-3.md`（判断 D-1〜D-4・代替案）

## 統合テスト連携

E-1〜E-10 の検出は Phase 9 のテスト層（L-1/L-2/L-3a〜c）に紐づき、NO-GO（AC-6 / AC-7）違反は Phase 10 の最終レビューで blocker 判定の根拠になる。
