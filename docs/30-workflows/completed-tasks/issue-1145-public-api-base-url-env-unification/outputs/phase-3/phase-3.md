# Phase 3: 設計レビュー — Phase 4 進行可否判定

> **[実装区分: 実装仕様書]** NON_VISUAL

## 1. メタ情報

| 項目 | 内容 |
| ---- | ---- |
| Phase | 3（設計レビュー） |
| 入力 | Phase 1（要件）/ Phase 2（設計） |
| 出力 | 本 `phase-3.md`（GO/NO-GO 判定） |

## 2. レビュー観点と判定

| 観点 | 判定 | 根拠 |
| ---- | ---- | ---- |
| scope 完全性 | ✅ | 19 ファイルを grep で網羅的に特定。漏れ防止に grep gate（AC-7）を最終判定条件化 |
| 型結合の安全性 | ✅ | Step 1（env.ts 先行）→ Step 2（public.ts）順序で typecheck が取りこぼしを機械検出 |
| 挙動不変性 | ✅ | base URL 値・解決優先順位・transport 選択を変えない（重複除去 / rename のみ・D-5） |
| apps/og rename の妥当性 | ✅ | semantics 違和は許容済（D-4・ユーザー承認）。runtime 不変 |
| `getApiBaseEnv` 削除の安全性 | ✅ | production consumer 0 件を grep 確認済。削除後 `grep -rn 'getApiBaseEnv\|ApiBaseEnv' apps/` 0 件を AC-2 で再担保 |
| CONST_007 単一サイクル充足 | ✅ | 全 19 ファイルを今回サイクル内で完了。先送りなし |
| 親不変条件遵守 | ✅ | API surface 不変 / D1 直接アクセスなし / process.env 直接参照増やさない |

## 3. リスクと対策（設計レビュー時点）

| リスク | 重大度 | 対策 | 反映先 |
| ------ | ------ | ---- | ------ |
| public.ts の `?? env.PUBLIC_API_BASE_URL` 取りこぼし | 高 | Step 1 先行で typecheck 露見させる。同一 PR で整理 | Phase 5 Step 1-2 |
| wrangler 片側のみ削除し環境間で base URL 乖離 | 中 | 旧キーは NEXT_PUBLIC_ と常に同値の重複行 → 3 セクションまとめて削除（値の付け替えではない） | Phase 5 Step 4 |
| spec のテスト名だけ旧キーが残り grep gate が 0 件にならない | 中 | seed/assert/テスト名すべて移行。意図保持 | Phase 5 Step 5 / Phase 9 |
| `getApiBaseEnv` 過剰削除で別所参照を壊す | 低 | 削除前後で grep 0 件確認（AC-2） | Phase 5 Step 6 |
| apps/og rename 漏れ（wrangler だけ / コードだけ） | 中 | OgEnv 型 + member-source.ts + wrangler を Lane C で同時 rename。型が結合 | Phase 5 Step 3 |
| Cloudflare Secret に旧キーがあると誤認し余計な mutation | 低 | 非機密 `[vars]` 管理で Secret 不在。`scripts/cf.sh` 確認に留め put/delete しない | スコープ外 §5 |

## 4. 判定

**GO（Phase 4 へ進行可）**。

- 設計に未解決の矛盾・不明点なし。
- scope は grep で確定し、grep gate で完了判定を機械化できる。
- 型結合の順序設計（Step 1→2）で最重要 struggle point を機械検出に変換済み。

## 5. 完了条件

- [x] 全レビュー観点を判定（全 ✅）
- [x] リスク 6 件を Phase 5/9 へ反映先付きで記録
- [x] GO/NO-GO 判定（GO）

## 6. 参照資料

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 起点 phase-3 設計決定 | `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/outputs/phase-3/` | 2 段階削除の 1 段目（残置）根拠 |
| 元 unassigned spec §3 | `docs/30-workflows/unassigned-task/staging-api-url-and-session-recovery-followup-001-public-api-base-url-schema-removal.md` | struggle points の前例 |
