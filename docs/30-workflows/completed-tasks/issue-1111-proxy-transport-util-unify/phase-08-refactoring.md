# Phase 08 — リファクタリング

pure refactor。挙動を 1 ビットも変えず、3 ファイルに複製された transport 選択イディオムを新規 util `apps/web/src/lib/fetch/transport-select.ts` へ集約し、重複を削減する。新規 util の追加が本タスクの主作業であり、呼び出し側は import 切替と旧ヘルパー削除のみ。**機能追加・挙動変更は一切行わない（重複削減のみ・挙動不変）。**

## 1. 対象 / Before / After / 理由（FB-RT-03）

### 1.1 制御構造の重複（binding 優先 → HTTP fallback 分岐 + ログ）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `route.ts`（分岐 96-113） | binding 有無の if 分岐 + base 解決 + fetch を inline 複製（ログ無し） | `selectAndFetch({ binding, resolveBase: () => apiBase(env) }, upstreamPath, init)` 1 呼び出しへ集約 | transport 分岐骨格を 1 箇所へ。判定述語・base 戦略は注入で呼び出し側に保持し挙動不変 |
| `server-fetch.ts`（分岐 554-562） | binding 有無の if 分岐 + `resolveApiBase()` + fetch + `logAdminTransport` を inline 複製 | `selectAndFetch({ binding, resolveBase: () => resolveApiBase(), log: logAdminTransport }, path, init)` へ集約 | 同一骨格の 2 箇所目。ログ shape（scope:admin）は log fn 注入で保持 |
| `public.ts`（分岐 66-77） | binding 有無の if 分岐 + `getBaseUrl()` + fetch + `logTransport` を inline 複製 | `selectAndFetch({ binding, resolveBase: () => getBaseUrl(), log: logTransport }, path, effectiveInit)` へ集約 | 3 箇所目（Rule of Three 成立点）。PLAYWRIGHT cache bypass（effectiveInit）は呼び出し側に保持 |

→ 3 箇所の if/else 制御骨格が `selectAndFetch` 1 関数へ収束。**分岐結果・fetch URL 構築（prefix+path / base+path）・ログ呼び出し順は Before と同一**。

### 1.2 旧 binding 解決ヘルパーの統合

| 対象 | Before（呼び出し側固有名） | After（共通名） | 理由 |
| --- | --- | --- | --- |
| `route.ts` | `adminServiceBinding(env)` | `resolveServiceBinding({ binding: env.API_SERVICE, disableBinding: isTestOrPlaywright(env) && Boolean(env.INTERNAL_API_BASE_URL) })` | 3 つの別名が同一形（disable なら undefined）→ 中立名 1 つへ統合。`disableBinding` boolean のみ受領し判定式は呼び出し側に保持 |
| `server-fetch.ts` | `getAdminServiceBinding()` | `resolveServiceBinding({ binding: getAdminFetchEnv().API_SERVICE, disableBinding: isTestOrPlaywright() && Boolean(getAdminFetchEnv().INTERNAL_API_BASE_URL) })` | 同上。INTERNAL base var の差は呼び出し側の `disableBinding` 計算で吸収 |
| `public.ts` | `getServiceBinding()` | `resolveServiceBinding({ binding: getPublicFetchEnv().API_SERVICE, disableBinding: isTestOrPlaywright() && Boolean(getPublicFetchEnv().PUBLIC_API_BASE_URL) })` | 同上。PUBLIC base var の差は呼び出し側で吸収 |

→ 旧 3 ヘルパーは削除可。判定述語（`isTestOrPlaywright` の各変種）と base var 選択は呼び出し側に**残す**（真理値表 phase-01 §4-5 を保存し挙動不変）。

### 1.3 末尾スラッシュ正規化の重複

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `route.ts apiBase()` / `server-fetch.ts resolveApiBase()` | 各々 `base.replace(/\/$/, "")` を inline 複製 | `stripTrailingSlash(base)` を呼び出し（戦略本体は呼び出し側に保持） | 正規化 1 行の重複削減。`public.ts getBaseUrl()` は末尾除去を持たない既存仕様のため対象外（挙動不変） |

### 1.4 ログ literal の型昇格

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `server-fetch.ts` / `public.ts` のログ呼び出し | string literal `"service-binding"` / `"http-fallback"` を直接渡す | `TransportKind = "service-binding" \| "http-fallback"` 型を経由（`selectAndFetch` の log fn 引数が `TransportKind`） | literal の typo 不整合を型で防止。**出力文字列は不変**（型名昇格のみ・値は同一） |

## 2. navigation drift（import 経路）整理

| 呼び出し側 | 新規 import | 相対経路 |
| --- | --- | --- |
| `route.ts`（`app/api/admin/[...path]/`） | `import { resolveServiceBinding, selectAndFetch } from "../../../../src/lib/fetch/transport-select"` | app → src 越境（既存の env import と同方向） |
| `server-fetch.ts`（`src/lib/admin/`） | `import { resolveServiceBinding, selectAndFetch } from "../fetch/transport-select"` | 兄弟ディレクトリ |
| `public.ts`（`src/lib/fetch/`） | `import { resolveServiceBinding, selectAndFetch } from "./transport-select"` | 同階層 |

`type TransportKind` / `type SelectTransportResult` は実装上必要な箇所のみ `import type` で取り込む。

## 3. 据え置き（util へ移送しない）— 挙動不変の境界

| 据え置き対象 | 所有者 | 移送しない理由 |
| --- | --- | --- |
| `isTestOrPlaywright`（3 変種・真理値が異なる） | 各呼び出し側 | phase-01 §4 の差異を保存（route.ts のみ `ENVIRONMENT==="local"` 条件あり）。潰すと挙動変化 |
| fallback base 戦略（`apiBase` / `resolveApiBase` / `getBaseUrl`） | 各呼び出し側 | phase-01 §6 の null 返却差（route.ts のみ fail-fast）を保存 |
| `LOCAL_DEV_FALLBACK`（127.0.0.1:8787） | `route.ts` | task-18 焼き込み gate。util へ 127.0.0.1 系文字列を一切書かない |
| request 構築 / cache 制御 / auth header / response 後処理（text・404 warn・`AdminFetchError`） | 各呼び出し側 | transport 選択外の責務。util は分岐 + 任意ログのみ |
| route.ts のログ無し | `route.ts` | log fn を渡さず現状維持（pure refactor） |

## 4. 完了条件

- 呼び出し側固有ヘルパー `adminServiceBinding` / `getAdminServiceBinding` / `getServiceBinding` は delegate wrapper として残し、transport 選択本体は `resolveServiceBinding` + `selectAndFetch` 経由になっている。
- `transport-select.ts` に 127.0.0.1 系文字列・`process.env[...]` 直接参照が無い。
- 差分が「重複削減 + import 切替」に閉じ、判定述語・fallback 戦略・ログ shape の挙動が Before と同一。
