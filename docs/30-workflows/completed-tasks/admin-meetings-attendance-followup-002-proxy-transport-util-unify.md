# admin API proxy transport 選択ロジックの共通 util 化 - タスク指示書

## メタ情報

```yaml
issue_number: 1111
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-meetings-attendance-followup-002-proxy-transport-util-unify |
| タスク名 | admin API proxy の transport 選択ロジックを共通 util に抽出する (FU-AMA-002) |
| 分類 | リファクタリング |
| 補足分類 | 内部実装の重複解消 (DRY / pure refactor) |
| 対象機能 | admin API proxy（service binding `API_SERVICE` vs HTTP `INTERNAL_API_BASE_URL` fallback の transport 選択） |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | 完了（Phase 12 完了条件に基づき completed-tasks へ移動済み） |
| GitHub Issue | [#1111](https://github.com/daishiman/UBM-Hyogo/issues/1111)（CLOSED / priority:low） |
| 発見元 | `admin-meetings-attendance-404-fix-and-ux` Phase 10 §10.6 MINOR 候補 + Phase 8.3 の YAGNI 判断 |
| 発見日 | 2026-06-03 |
| canonical source | `docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/outputs/phase-10/phase-10.md` |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`admin-meetings-attendance-404-fix-and-ux` workflow で扱った 404 の根本原因は、admin API への **transport が非対称** だったことにある。

- GET 系（Server Component からの read）は `apps/web/src/lib/admin/server-fetch.ts` が service binding `API_SERVICE` 経由で呼び、staging/production で成功していた。
- POST/PATCH/DELETE 系（mutation）は `apps/web/app/api/admin/[...path]/route.ts` が当時 HTTP fetch（`INTERNAL_API_BASE_URL`）のみで proxy しており、binding が前提の環境で 404 になっていた。

この workflow で `route.ts` を **binding 優先 → HTTP fallback** に統一し、404 は解消済み（`route.ts:96-113`）。結果として、`route.ts` と `server-fetch.ts` の **2 箇所に同型の transport 選択ロジック** が並存する状態になった。

### 1.2 問題点・課題

両ファイルに以下のロジックがほぼ同型で重複している。

- `apps/web/app/api/admin/[...path]/route.ts`
  - `LOCAL_DEV_FALLBACK = "http://127.0.0.1:8787"`（`route.ts:10`）
  - `isTestOrPlaywright(env)`（`route.ts:14-15`）
  - `apiBase(env)`（fallback base 解決, `route.ts:17-27`）
  - `adminServiceBinding(env)`（test 時 `INTERNAL_API_BASE_URL` あれば binding 無効化, `route.ts:32-35`）
  - binding 優先 → HTTP fallback の分岐（`route.ts:96-113`）
- `apps/web/src/lib/admin/server-fetch.ts`
  - `resolveApiBase()`（`server-fetch.ts:67-71`）
  - `isTestOrPlaywright()`（`server-fetch.ts:76-79`）
  - `getAdminServiceBinding()`（test 時 `INTERNAL_API_BASE_URL` あれば binding 無効化, `server-fetch.ts:81-85`）
  - `logAdminTransport("service-binding" | "http-fallback", path, status)`（`server-fetch.ts:100-111`）
  - binding 優先 → HTTP fallback の分岐 + transport ログ（`server-fetch.ts:554-562`）

判定・取得・fallback 解決・transport ログという同じ関心が 2 箇所にコピーされており、片方だけを直すと再 drift する構造になっている。

### 1.3 放置した場合の影響

- 将来 transport 仕様を変更する際（例: binding 無効化条件の見直し、fallback base 解決規則の変更、transport ログ schema の変更）に、**2 箇所を同期し忘れて再び transport 非対称になる**リスクがある。これは今回の 404 と同じクラスの不具合である。
- ただし現状は利用箇所が 2 箇所のため、共通化の便益より抽象化の維持コストの方が勝りうる。よって本タスクは **YAGNI で意図的に見送り中**であり、transport 選択の利用箇所が **3 箇所目に増えたとき**にのみ着手する（解除条件は §2.3 に明記）。

---

## 2. 何を達成するか（What）

### 2.1 目的

`route.ts` と `server-fetch.ts` に重複する transport 選択ロジック（binding 取得 / fallback base 解決 / `isTestOrPlaywright` 判定 / transport ログ）を、挙動を変えずに 1 つの共通 util に集約する。

### 2.2 最終ゴール

- transport 選択の判断点が 1 箇所に集約され、`route.ts` / `server-fetch.ts` の双方が同じ util を参照する。
- 抽出は **pure refactor** であり、外部から観測できる挙動（成功/404 の境界、transport ログ出力、エラー応答）は完全に不変。
- env 参照は `apps/web/src/lib/env.ts` の公開アクセサ経由を維持し、`process.env.*` の直接参照を新たに増やさない。

### 2.3 受け入れ基準

- [ ] **YAGNI 解除条件を満たしていること**: transport 選択ロジック（binding 優先 → HTTP fallback）の利用箇所が `route.ts` / `server-fetch.ts` 以外に **3 箇所目** として出現したことを確認したうえで着手する。2 箇所のままなら本タスクは着手しない（このチェックが false なら他基準は評価しない）。
- [ ] **挙動不変**: 共通 util 抽出の前後で、binding 優先 → HTTP fallback の分岐結果、fallback base 解決、test/playwright 時の binding 無効化条件、`logAdminTransport` の出力内容が変わらない。
- [ ] **回帰 green**: 既存の `apps/web/app/api/admin/[...path]/route.spec.ts` および server-fetch 関連 spec がすべて PASS する。
- [ ] **env アクセサ経由維持**: 共通 util 内でも env 参照は `getAuthEnv()` / `getEnv()` / `getAdminFetchEnv()` 経由のみで、`process.env.*` 直接参照を新規追加しない。
- [ ] **ローカル限定エンドポイント焼き込み禁止の維持**: `LOCAL_DEV_FALLBACK`（`http://127.0.0.1:8787`）の扱いを変えず、`127.0.0.1:8888` 等の禁止文字列を `apps/web/src` 配下へ新規に焼き込まない（task-18 grep gate を維持）。

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス | 役割 |
| --- | --- |
| `apps/web/app/api/admin/[...path]/route.ts` | mutation proxy の transport 選択（呼び出し側へ） |
| `apps/web/src/lib/admin/server-fetch.ts` | Server Component read の transport 選択（呼び出し側へ） |
| `apps/web/src/lib/admin/transport.ts`（新規・配置案） | 共通 util の集約先 |
| `apps/web/app/api/admin/[...path]/route.spec.ts` | 既存回帰テスト（挙動不変の担保） |
| `apps/web/src/lib/env.ts` | env 公開アクセサ（util から参照） |

### 3.2 実装方針

- 共通 util の配置案: `apps/web/src/lib/admin/transport.ts`。集約する関心は以下。
  - **binding 取得**: `isTestOrPlaywright` 時に `INTERNAL_API_BASE_URL` があれば binding を無効化する規則（`route.ts:32-35` と `server-fetch.ts:81-85` の共通化）。
  - **fallback base 解決**: 末尾 `/` 除去と、local dev 限定の `LOCAL_DEV_FALLBACK` 許可・staging/production での fail-fast（`route.ts:17-27`）。`server-fetch.ts:67-71` の `resolveApiBase()` と差異がある点に注意（§苦戦箇所参照）。
  - **isTestOrPlaywright 判定**: `route.ts` 版と `server-fetch.ts` 版の判定経路の差異を吸収する（§苦戦箇所参照）。両者の真理値が一致するケース・しないケースを明文化してから統合する。
  - **transport ログ**: `logAdminTransport("service-binding" | "http-fallback", path, status)`（`server-fetch.ts:100-111`）を util 側に移す。`route.ts` は現状 transport ログを出していないため、ログ追加は「挙動変更」になる。pure refactor を守るため、`route.ts` 側のログ有無は現状を維持する（ログ呼び出しを呼び出し側のオプトインにするなど）。
- 共通化は呼び出し側 2 ファイルの import 切替に留め、proxy/fetch の制御フロー・エラー応答・fixture 分岐（`server-fetch.ts` の playwright fixture 群）には手を入れない。

---

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260602-192059-wt-15/apps/web/app/api/admin/[...path]/route.ts` と `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260602-192059-wt-15/apps/web/src/lib/admin/server-fetch.ts`
- 症状1（`isTestOrPlaywright` の判定経路が微妙に異なる）:
  - `route.ts:14-15` は `process.env["NODE_ENV"] === "test" || process.env["PLAYWRIGHT_TEST"] === "1" || env.ENVIRONMENT === "local"` と **`process.env` 直接参照を併用**している。
  - `server-fetch.ts:76-79` は `getAdminFetchEnv()` 経由で `env.NODE_ENV === "test" || env.PLAYWRIGHT_TEST === "1"`（`ENVIRONMENT === "local"` 条件を持たない）。
  - 単純に片方へ寄せると判定真理値が変わり「pure refactor」を破る。共通化前に両者の真理値表を作り、`ENVIRONMENT === "local"` 条件と `process.env` 直接参照を util の中でどう扱うか（アクセサ経由へ寄せるか・呼び出し側差分として残すか）を決め切る必要がある。
- 症状2（binding 無効化条件の差異）:
  - `route.ts:33` は `if (isTestOrPlaywright(env) && env.INTERNAL_API_BASE_URL) return undefined;`、`server-fetch.ts:83` も同型だが、症状1 の `isTestOrPlaywright` 差異がそのまま binding 有効/無効の差として伝播する。fixture テスト（`server-fetch.ts` の playwright fixture 群）が binding 無効化前提で組まれている可能性があるため、統合後に fixture 経路が壊れないか確認が必要。
- 症状3（fallback base 解決の差異）:
  - `route.ts:17-27` の `apiBase()` は **`LOCAL_DEV_FALLBACK = "http://127.0.0.1:8787"` を local dev 限定で返し、staging/production では `null` を返して fail-fast** する。
  - `server-fetch.ts:67-71` の `resolveApiBase()` は `getAdminFetchEnv().INTERNAL_API_BASE_URL ?? getEnv().INTERNAL_API_BASE_URL` を末尾 `/` 除去するだけで、`LOCAL_DEV_FALLBACK` も `null` 返却も持たない。挙動不変を守るには、この 2 つを単一関数に潰さず「呼び出し側ごとの fallback 戦略」を引数で切り替えられる形に整理する必要がある。
- 症状4（ローカル限定エンドポイント焼き込み gate）:
  - `LOCAL_DEV_FALLBACK` を util へ移動する際、`127.0.0.1` 系文字列が `apps/web/src` 配下に集約される。task-18 の grep gate（`127.0.0.1:8888` 等の禁止）に抵触しないよう、移動先の文字列と gate 対象パターンを事前に突き合わせること。`8787` は現状許容されているが、誤って `8888` 等へ書き換えない。

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 共通化の過程で `isTestOrPlaywright` / fallback 解決の真理値が変わり transport が drift する | 高（今回の 404 と同クラスの再発） | 抽出前に両ファイルの判定真理値表を作成し、`route.spec.ts` を pure refactor の回帰ガードとして緑のまま維持する |
| `server-fetch.ts` の playwright fixture 分岐や binding 無効化前提が壊れる | 中 | fixture 経路は呼び出し側に残し、util は transport 選択のみに限定。fixture を使う spec を抽出後も実行して PASS を確認 |
| `LOCAL_DEV_FALLBACK` 移動で `127.0.0.1` 焼き込み gate（task-18）に抵触 | 中 | 移動先文字列と禁止パターンを突き合わせ、`8787` を維持し `8888` 等へ改変しない。静的検証で grep gate を実行 |
| 利用 2 箇所のまま over-abstraction し維持コストが便益を上回る | 中 | YAGNI 解除条件（3 箇所目の出現）を受け入れ基準の前提とし、満たさない限り着手しない |

---

## 検証方法

### 単体検証

`apps/web` には `vitest.config.ts` が無いため、リポジトリルートの設定でパス指定して実行する。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/app/api/admin/[...path]/route.spec.ts
```

期待: transport 選択（binding 優先 / HTTP fallback）・fallback base 解決・test 時 binding 無効化の assertion が、抽出前後で同一結果で PASS。server-fetch 関連の spec が存在する場合は同コマンドにパスを追加して併せて実行する。

### 統合検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: 共通 util 抽出後も型・lint が緑。`route.ts` / `server-fetch.ts` の挙動を変えていないため、既存の admin proxy 経路（read/mutation 双方）が回帰しない。

### 静的検証

```bash
# env アクセサ経由の維持（process.env 直接参照を新規に増やしていないか目視確認）
rg -n "process\.env\[" apps/web/src/lib/admin/

# ローカル限定エンドポイント焼き込み gate（task-18）
rg -n "127\.0\.0\.1:8888" apps/web/src || echo "OK: no forbidden local endpoint"
```

期待: `process.env.*` の新規直接参照がなく、`127.0.0.1:8888` 等の禁止文字列が `apps/web/src` 配下に焼き込まれていない。

---

## スコープ

### 含む

- `apps/web/app/api/admin/[...path]/route.ts` と `apps/web/src/lib/admin/server-fetch.ts` の transport 選択ロジック（binding 取得 / fallback base 解決 / `isTestOrPlaywright` 判定 / transport ログ）の共通 util 化。
- 共通 util（`apps/web/src/lib/admin/transport.ts` 想定）の新規追加と、上記 2 ファイルの import 切替。
- 抽出に伴う回帰テスト（`route.spec.ts` ほか）の維持・確認。

### 含まない

- transport の **挙動変更**（binding 無効化条件の変更、fallback 解決規則の変更、`route.ts` への transport ログ新規追加など）。
- 新規 endpoint の追加、`apps/api` 側の変更、D1 schema / Google Form 仕様の変更。
- `INTERNAL_API_BASE_URL` の実値修正・環境変数注入経路の変更（別件）。
- production / staging deploy、commit、push、PR、Issue 起票・close。

---

## 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/`
- canonical source（MINOR 候補 / YAGNI 判断）: `docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/outputs/phase-10/phase-10.md`（§10.6 / §8.3）
- 重複対象1: `apps/web/app/api/admin/[...path]/route.ts`（`LOCAL_DEV_FALLBACK` / `apiBase` / `adminServiceBinding` / `isTestOrPlaywright` / 分岐 96-113）
- 重複対象2: `apps/web/src/lib/admin/server-fetch.ts`（`resolveApiBase` / `getAdminServiceBinding` / `isTestOrPlaywright` / `logAdminTransport` / 分岐 554-562）
- env アクセサ正本: `apps/web/src/lib/env.ts`（`getAuthEnv` / `getEnv` / `getAdminFetchEnv`）
- 既存回帰テスト: `apps/web/app/api/admin/[...path]/route.spec.ts`
- 不変条件: `CLAUDE.md`（task-02 env アクセサ経由 / task-18 ローカル限定エンドポイント焼き込み禁止 grep gate）
