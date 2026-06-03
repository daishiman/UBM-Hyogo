# Phase 8: リファクタリング方針 + エラーパターン / fail-fast / rollback

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

実装後の重複・責務漏れを除去するリファクタリング方針（対象 / Before / After / 理由）を確定し、3 タスクで起こり得る失敗パターンと fail-fast 条件・rollback 起点を列挙する。本サイクルはコード自体は user-gated だが、実装時に守るべき構造方針と障害時の戻り先を固定する。

## 実行タスク

### 8.1 リファクタリング方針（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| T01 正規化ロジックの所在 | `/me` 専用の `app.get("/me/", ...)` を route ごとに追加 | `app.use("*", trailingSlash)` を 1 箇所登録（`corsFromEnv` の後・route mount の前） | `/me` 専用ハードコードを増やさず全 route 共通化（Phase 3 案A）。他 route の同種 404 を取りこぼさない |
| T01 308 生成の重複 | 各所で `new Response(null, { status: 308, headers })` を書く | 正規化関数内に 1 関数として集約し、query 保持・末尾スラッシュ除去を単一実装に閉じる | 308 生成ロジックの分散を防ぎ TS-1〜TS-6 で一括被覆 |
| T02 upstream URL 構築 | `\`${apiBase()}/me/${path.join("/")}${url.search}\``（空 path で `/me/` 生成） | `const tail = path.join("/"); const target = \`${apiBase()}/me${tail ? \`/${tail}\` : ""}${url.search}\`;` | 空 path 時に末尾スラッシュを生成しない。子 path は従来どおり（PX-1〜PX-5） |
| T03 エラー文言の散在 | `SectionError` 呼び出し側に生 message（`fetchAuthed failed: 404`）を渡し得る | 固定の一般文言 + CTA を error code 分岐内で写像し、生 message を渡さない | 技術文字列のユーザー露出を構造的に断つ（AC-1 / AC-2） |
| T03 CTA primitive | エラー CTA を別 component で新設 | `SectionError` に `actionHref?` / `actionLabel?` の optional props を追加し再利用 | 新規 primitive を生やさない（Phase 2 §2.3）。既存呼び出しは後方互換 |

### 8.2 エラーパターン一覧

| # | 段階 | エラー | 検出 | ハンドリング |
|---|------|--------|------|--------------|
| E-1 | T01 local | `trailing-slash.spec.ts`（TS-x）が fail（308 / Location 不一致） | Phase 9 L-3 | 正規化関数の末尾スラッシュ判定・query 保持を Phase 3 §3.2 と照合し修正 |
| E-2 | T01 local | `me-route-mount.integration.spec.ts` MM-2 が 404 のまま | Phase 9 L-3 | middleware 登録順（mount より前）を `index.ts` で再確認。案A の登録位置を Phase 3 §3.2 に戻す |
| E-3 | T01 local | MM-4（存在しない path）が 404 を返さず 308/401 化 | Phase 9 L-3 | 正規化が全 path を吸っている。「末尾スラッシュ付きのみ発火」条件を厳格化 |
| E-4 | T01 local | MM-5 正常系が 200 でなく shape 変化 | Phase 9 L-3 | レスポンス shape 不変（AC-7）違反。`/me` ハンドラを触っていないか diff 確認、触れていれば revert |
| E-5 | T02 local | PX-1 が `/me/` を生成（バグ未修正） | Phase 9 L-3 | 三項分岐 `tail ? ... : ""` の適用漏れ。route.ts を修正 |
| E-6 | T02 local | PX-2〜PX-5（子 path）が回帰し path 破損 | Phase 9 L-3 | `tail` 連結を再確認。query 連結位置を修正 |
| E-7 | T03 local | PF-1 で生文字列 `fetchAuthed failed: 404` が DOM に残る | Phase 9 L-3 | error 分岐で `detail` に生 message を渡している。固定一般文言へ差し替え |
| E-8 | T03 local | PF-3（401）の redirect が回帰し `/login` へ飛ばない | Phase 9 L-3 | `AuthRequiredError` rethrow 経路を変更していないか確認、変更していれば revert（AC-3） |
| E-9 | T03 local | SE-2 後方互換が崩れ既存呼び出しで CTA が混入 | Phase 9 L-3 | `actionHref && actionLabel` の両揃いガードを確認（SE-4） |
| E-10 | 横断 local | `pnpm typecheck` / `pnpm lint` が exit≠0 | Phase 9 L-1/L-2 | unused import / 型注釈漏れを最小差分で修正。`lint --fix` を先に試す |

### 8.3 fail-fast / 縮退の方針

- Phase 9 の L-1（typecheck）/ L-2（lint）/ L-3（対象 vitest）の **いずれか 1 件でも fail したら commit へ進まない**（gate）。
- AC-3（401 redirect 回帰なし）・AC-7（`/me` shape / path / D1 / Form 不変）は **NO-GO 条件**。これらが崩れた場合は該当タスクの diff を revert し、Phase 3 の方針へ戻る。
- 本サイクルはコード未コミットの仕様作成段階のため、実装着手後でも変更は worktree 内で完全に戻せる（cap=worktree）。

### 8.4 rollback 起点

| 状況 | rollback 起点 |
|------|---------------|
| T01 で `/me` 200 系が壊れる（MM-5 失敗） | `apps/api/src/index.ts` の middleware 登録 1 行と `trailing-slash.ts` を revert。`/me` ハンドラは元から無変更 |
| T02 で子 path 回帰（PX-2〜PX-5 失敗） | `apps/web/app/api/me/[...path]/route.ts` の `target` 構築のみ revert（cookie/認証透過は元から無変更） |
| T03 で 401 redirect 回帰（PF-3 失敗） | `apps/web/app/(member)/profile/page.tsx` の error 分岐追加と `SectionError.tsx` の props 追加を revert |
| 横断 typecheck/lint 不能 | 3 タスクは関心分離・独立のため、失敗タスクの diff のみ revert し他 2 タスクは保持 |

> 3 タスクは API ルーティング / web proxy / web UI で責務分離しており、いずれか 1 タスクの revert が他タスクの成果を巻き込まない。

## 完了条件

- [x] リファクタリング方針を 対象 / Before / After / 理由 テーブルで確定
- [x] E-1〜E-10 のエラーパターンを段階・検出・ハンドリング付きで列挙
- [x] fail-fast 条件（L-1/L-2/L-3 gate）と NO-GO 条件（AC-3 / AC-7）を明示
- [x] タスク別 rollback 起点を確定

## 成果物

- `outputs/phase-8/phase-8.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401 redirect 経路（AC-3 NO-GO の根拠） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` shape / path 不変（AC-7 NO-GO の根拠） |
| UI/UX | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | エラー表示と CTA 方針（T03 文言写像） |

- `outputs/phase-3/phase-3.md`（案A / T02 URL 構築 / T03 CTA props）
- `outputs/phase-6/phase-6.md`（テストケース TS/MM/PX/PF/SE）

## 統合テスト連携

E-1〜E-10 の検出は Phase 9 のテスト層（L-1/L-2/L-3）に紐づき、NO-GO（AC-3 / AC-7）違反は Phase 10 の最終レビューで blocker 判定の根拠になる。
