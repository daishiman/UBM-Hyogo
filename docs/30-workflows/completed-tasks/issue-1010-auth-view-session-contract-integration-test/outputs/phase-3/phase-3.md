# Phase 3: 設計レビュー（Gate-A）

**[実装区分: 実装仕様書]** / **判定: PASS（Phase 4 へ進行可）**

## 1. レビュー観点と判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 真の論点に答えているか | PASS | 「実 session callback 出力 → resolveAuthView の橋渡し契約が未テスト」という drift gap を直接埋める設計 |
| 既存テストとの重複回避 | PASS | Issue 原案（捏造 session fixture を getAuthView に流す）を排し、実 `callbacks.session` 出力を連鎖させることで `getAuthView.spec.ts` と差別化 |
| 責務境界 | PASS | mock するのは Cloudflare context（`@opennextjs/cloudflare`）と `getAuth` のみ。session 構築・AuthView 解決の実ロジックは保持 |
| 不変条件整合 | PASS | #5（D1 直接アクセスなし：fetch stub）/ #8（`.integration.spec.ts` は `.spec.ts` で終わり許可）/ #11（fail-closed を AC-3 で固定） |
| production 変更の最小性 | PASS | 変更ゼロ（`buildAuthConfig` は既に export） |
| 1 サイクル完結（CONST_007） | PASS | 単一 spec ファイル追加。先送り要素なし |

## 2. 同サイクル改善（design-time）

- Issue 原文 Phase 2 の「session object fixture」案は drift 検知価値が薄いため、**実 callback 連鎖**へ
  格上げした（重複回避）。これは Issue 最適化の核であり、別タスクに先送りしない。
- `auth.spec.ts` が既に `callbacks.session` を直接テストしているため、本 spec は「callbacks.session 出力 →
  resolveAuthView」の**接続のみ**を新規責務として持ち、token→session.user の正規化詳細は重複させない。

## 3. リスクと対策（再掲・確定）

| リスク | 対策 |
| --- | --- |
| 実 OAuth に拡大して flaky | session object contract に限定。OAuth runtime smoke は out of scope |
| Auth.js 型に過剰依存し minor upgrade で過剰破壊 | app-level contract（`memberId`/`isAdmin`）のみ assertion。Auth.js 内部型に直接依存しない |
| `buildAuthConfig` の provider factories 未指定 throw | `auth.spec.ts` と同じ stub factories を渡す（設計済） |
| Cloudflare context 取得失敗 | `@opennextjs/cloudflare` を spec 先頭で mock（`auth.spec.ts` 踏襲） |

## 4. Gate-A 判定

- **PASS**。Phase 4（テスト作成）へ進行可。
- 本サイクルで本 Phase を sign-off する際、`artifacts.json` の Gate-A を `passed` + `passed_at`（ISO8601 offset）へ更新する。

## 完了条件（Phase 3）

- [x] 6 観点すべて PASS
- [x] 同サイクル改善（実 callback 連鎖への格上げ）を記録
- [x] リスク対策確定
- [x] Gate-A = PASS 判定
