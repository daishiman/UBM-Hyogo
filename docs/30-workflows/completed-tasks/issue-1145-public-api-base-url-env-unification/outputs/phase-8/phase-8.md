# Phase 8: リファクタリング — 重複除去確認

> **[実装区分: 実装仕様書]** NON_VISUAL

## 1. メタ情報

| 項目 | 内容 |
| ---- | ---- |
| Phase | 8（リファクタリング） |
| 入力 | Phase 5（実装）/ Phase 7（カバレッジ） |
| 出力 | 本 `phase-8.md`（重複除去の Before/After 記録） |
| 段階 | implemented_local_evidence_captured（手順仕様。実測値は2026-06-08 実測 PASS） |
| タスク種別 | env schema cleanup（NON_VISUAL・新規実装ゼロ・削除/rename のみ） |

## 2. リファクタリングの位置づけ

本タスク自体が「同義 env キー二重化の解消」というリファクタリングであり、Phase 5 の削除/rename がリファクタリング本体に相当する。本 Phase 8 では、Phase 5 完了後に **重複除去が構造的に成立したか** を 3 観点（wrangler 二重定義 / fallback dead path / `getApiBaseEnv` dead 関数）で Before/After 検証する。新たなコード変更は行わず、Phase 5 の結果が「重複を残していない」ことを確認するゲートとして機能する。

> 挙動不変原則（D-5）: base URL 値・解決優先順位・transport 選択は変更しない。本 Phase で行うのは「重複の物理的除去が完了したか」の確認であり、ロジック変更は伴わない。

## 3. 重複除去テーブル（**[Feedback RT-03]** 対象 / Before / After / 理由）

| # | 対象 | Before（実装前の重複構造） | After（実装後の単一化） | 理由（なぜ重複が負債か） |
| - | ---- | -------------------------- | ----------------------- | ------------------------ |
| RT-1 | `apps/web/wrangler.toml` の API base URL var | `[vars]`（L17）/ `[env.staging.vars]`（L33）/ `[env.production.vars]`（L61）に `NEXT_PUBLIC_API_BASE_URL` と `PUBLIC_API_BASE_URL` の **2 キーが同一値で並記**（計 3 セクション × 2 キー） | 各セクション `NEXT_PUBLIC_API_BASE_URL` の 1 キーのみ | 2 キーが別個に編集可能なため、片方だけ更新されると環境間で base URL が乖離する事故源。同一値の二重保持は単一情報の冗長化 |
| RT-2 | `apps/og/wrangler.toml` の API base URL var | `[vars]`（L10）/ `[env.staging.vars]`（L16）/ `[env.production.vars]`（L29）に `PUBLIC_API_BASE_URL`（単一キーだが repo 内で命名が web と不一致） | 各セクション `NEXT_PUBLIC_API_BASE_URL` へ rename | repo 全体で同一 base URL に 2 命名が併存し、grep gate を 1 本に張れない。命名統一で監査を単一化 |
| RT-3 | `apps/web/src/lib/fetch/public.ts` の fallback dead path | `getBaseUrl()`（L24）/ `getServiceBinding()`（L48）が `env.NEXT_PUBLIC_API_BASE_URL ?? env.PUBLIC_API_BASE_URL` 形式で旧キーへ **到達不能 fallback** を持つ（NEXT_PUBLIC_ が常に同値で seed されるため右辺は実行されない dead path） | `?? env.PUBLIC_API_BASE_URL` を削除し `env.NEXT_PUBLIC_API_BASE_URL` 単独参照 | dead path は「両方書く」先例を後続コードへ波及させる。除去で命名一貫性と読み手の誤解防止 |
| RT-4 | `apps/web/src/lib/env.ts` の `getApiBaseEnv()` 関数 + `ApiBaseEnv` 型 | `getApiBaseEnv()`（L168 付近）が旧キー fallback を含み `ApiBaseEnv`（L76 付近）型を返す。production consumer 0 件（定義 + env.spec のみ） | 関数 + 型を完全削除。env.spec の対応 2 テスト（L252 / L262）も削除 | 旧キー分岐を消すと `INTERNAL_API_BASE_URL` 単一フィールドのみ返す dead-ish 関数になり残す合理性ゼロ。dead code 残置は将来 reader の混乱源（D-3） |
| RT-5 | `getPublicFetchEnv()` 内の旧キー fallback 分岐 | `apps/web/src/lib/env.ts` の `getPublicFetchEnv()`（L187-192,197 付近）が `PUBLIC_API_BASE_URL` を読む fallback 分岐を保持 | 旧キー分岐を削除し `NEXT_PUBLIC_API_BASE_URL` 単一解決 | accessor 層に重複解決ロジックを残すと consumer が旧キー経由でも値を得られてしまい、grep gate が 0 件にならない構造を温存する |

## 4. 重複除去の検証手順（実装後に実行・実測は記録欄に追記）

```bash
# RT-1/RT-2: wrangler 二重定義の解消確認（旧キー行が 0 件）
grep -n 'PUBLIC_API_BASE_URL' apps/web/wrangler.toml | grep -v 'NEXT_PUBLIC_API_BASE_URL'   # 期待: 0 行
grep -n 'PUBLIC_API_BASE_URL' apps/og/wrangler.toml | grep -v 'NEXT_PUBLIC_API_BASE_URL'    # 期待: 0 行

# RT-3: public.ts の fallback dead path 除去確認
grep -n 'PUBLIC_API_BASE_URL' apps/web/src/lib/fetch/public.ts | grep -v 'NEXT_PUBLIC_API_BASE_URL'  # 期待: 0 行

# RT-4: getApiBaseEnv / ApiBaseEnv の完全削除確認
grep -rn 'getApiBaseEnv\|ApiBaseEnv' apps/   # 期待: 0 件

# RT-5: env.ts の旧キー fallback 除去確認
grep -n 'PUBLIC_API_BASE_URL' apps/web/src/lib/env.ts | grep -v 'NEXT_PUBLIC_API_BASE_URL'  # 期待: 0 行
```

### 実測記録欄（実装後に追記）

| 項目 | 期待値 | 実測値 |
| ---- | ------ | ------ |
| RT-1 apps/web/wrangler.toml 旧キー | 0 行 | 2026-06-08 実測 PASS |
| RT-2 apps/og/wrangler.toml 旧キー | 0 行 | 2026-06-08 実測 PASS |
| RT-3 public.ts 旧キー fallback | 0 行 | 2026-06-08 実測 PASS |
| RT-4 getApiBaseEnv\|ApiBaseEnv 参照 | 0 件 | 2026-06-08 実測 PASS |
| RT-5 env.ts 旧キー | 0 行 | 2026-06-08 実測 PASS |

## 5. 重複除去で導入しないもの（過剰リファクタリング防止）

- 新規 accessor / 新規 helper / 新規 module は導入しない（Phase 2 §2 新規実装ゼロ方針）。
- `getBaseUrl()` / `getServiceBinding()` のシグネチャ・戻り値型は変更しない（呼び出し側互換維持）。
- transport 選択（`resolveServiceBinding` / `selectAndFetch`）のロジックは触れない。
- 旧キー以外の env キー（`INTERNAL_API_BASE_URL` / `AUTH_URL` 等）は整理対象外（§スコープ外）。

## 6. 完了条件（PASS）

- [x] RT-1〜RT-5 の Before/After が実コードで成立（重複除去テーブルの After 列を満たす）
- [x] §4 の 5 grep がすべて期待値（0 行 / 0 件）
- [x] 新規 accessor / module を一切導入していない
- [x] `getBaseUrl()` / `getServiceBinding()` のシグネチャ不変

> 2026-06-08 本サイクル実装後に実測 PASS。上記チェックは完了済み。

## 7. 参照資料

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 削除順序 | 本 workflow `outputs/phase-2/phase-2.md` §5 | Step 1-7 の型結合順序 |
| 設計判断 D-3/D-5 | 本 workflow `index.md` §3 | getApiBaseEnv 削除 / 挙動不変 |
| env アクセス不変条件 | `CLAUDE.md`「apps/web env アクセス不変条件（task-02 wrangler-env-injection）」 | accessor 経由のみ / `process.env.*` 直接禁止 |
