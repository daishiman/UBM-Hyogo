# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

> Phase: 3 / 13

---

## レビュー観点

### 不変条件整合

| 不変条件 | 評価 | 根拠 |
|---------|------|------|
| #5 D1 直接アクセス禁止 | ✅ | 本タスクは transport 選択のガード強化であり、production の D1 アクセス境界(`apps/api` 経由)を強化する方向 |
| `apps/web` env 不変条件(`getEnv()`/`getPublicEnv()` 経由) | ✅(条件付き) | test runtime 判定 `isTestOrPlaywright()` は例外として 1 箇所に閉じる。コードコメントで例外を明示 |
| 既存 API endpoint surface 不変 | ✅ | `apps/api` 変更なし |
| 新規 test ファイル `*.spec.ts` 命名 | ✅ | 既存 `apps/web/src/lib/fetch/public.spec.ts` への追記方式 |
| OKLch トークン正本化 | N/A | NON_VISUAL |
| `wrangler` 直叩き禁止 | ✅ | CLI 実行なし |
| `secret` を test fixture に書かない | ✅ | mock URL はプレースホルダ(`http://127.0.0.1:8787` / `https://wrong-fallback.example.com`) |

### 設計トレードオフ

1. **`isTestOrPlaywright()` を独立 helper にする vs `getServiceBinding()` 内インライン化**
   - 独立 helper を採用。test で `vi.stubEnv()` 経由の確認が容易、env 判定キー追加時の修正範囲を 1 箇所に閉じられる。
2. **`getEnv()` schema に env 追加する vs `process.env.*` 直参照**
   - 直参照を採用(`isTestOrPlaywright()` 内に限定)。設計章で記載の通り、schema に test 判定 env を入れると production runtime parse 時の誤シグナルになる。
3. **fail-safe デフォルト**
   - `isTestOrPlaywright()` がいずれの判定にも該当しない場合は false を返す。すなわち「判定不能なら production と見做す」設計で、production 安全側に倒れる。

### 既存 task-05a との関係

- `task-05a-fetchpublic-service-binding-001` は「service binding 不在時に外向き fetch にフォールバックする」設計を確立した。
- 本タスクは「service binding 存在時に外向き fetch を優先する CI 経路」が production に侵食する regression を防ぐ追加ガードであり、設計方向は逆。
- 対応: `apps/web/src/lib/fetch/public.ts` のコメントで両者の関係を明記する。

### 開示済みリスクと判断

| リスク | 判断 |
|--------|------|
| OpenNext build 時の `NODE_ENV` 静的置換 | Phase 9 QA で bundle を確認。dead-code elimination が起きても production 側は service-binding を選ぶため安全側に倒れる |
| `wrangler.toml` への test env 混入 | 本タスクのスコープ外。grep gate は `task-18` 系に hand-off |
| 既存 `public.spec.ts` の mock 経路差異 | Phase 4 で実装ファイル確認時に既存 pattern を踏襲。新規 mock 経路は生やさない |

## レビュー結論

設計に致命的な不整合なし。Phase 4 以降へ進行可。
