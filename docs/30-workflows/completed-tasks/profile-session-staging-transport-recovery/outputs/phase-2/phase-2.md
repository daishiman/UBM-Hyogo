# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 2 / 13 |
| 前提 | Phase 1 完了（確定事実 F-1〜F-6・サブ原因 S1〜S4・横断要因 F-A/F-B 固定済み） |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

サブ原因 S1〜S4 の**どれであっても復旧する多層防御**を、最小差分・契約不変（`/me` status 体系・認証境界・UI 文言）で設計する。「真因確定待ちで復旧が止まる」前身 WF の停滞構造（MT 系 user-gated 待ち）を、復旧と観測の同時 deploy で断ち切る。

## 実行タスク

### 2.1 真の論点と因果

staging では binding（service-binding）と URL（http）の**2 経路が設定済み**なのに、コードが 1 経路しか試さず（F-B）、かつ env 読み取りが all-or-nothing（F-A）のため、いずれかの劣化が即「通信経路でセッション確認に失敗」全断になる。対策は (1) env 読み取りの部分故障耐性 (2) transport の劣化運転（fallback chain）(3) 劣化の検知（構造化ログ + 診断）の 3 層。

### 2.2 多層防御の責務分離（T01〜T04）

| タスク | 層 | 解消対象 | 依存 |
| --- | --- | --- | --- |
| T01 観測性成果統合 | 検知 + S2 fail-closed | F-6・S2 | なし（最初・直列） |
| T02 `getAuthEnv` field-tolerant | env 部分故障耐性 | F-A（S1/S2 の誘発元） | T01 後（T03 と並列可） |
| T03 transport fallback chain | 劣化運転 | F-B（S1/S3/S4 で復旧） | T01 後（T02 と並列可） |
| T04 診断スクリプト拡張 | 運用検知 | probe 経路の欠陥是正 | 独立並列 |

T01 を最初に置く理由: T02/T03 の差分は T01 がもたらす `ApiTransportError` / `getEnvironmentResolution` / `environmentExplicit` の上に積むため、先に統合しないと同一ファイルへの二重実装・コンフリクトになる。

### 2.3 transport chain の設計（T03 の核心）

候補構成（`resolveApiTransportChain`）:

```
1. service-binding（API_SERVICE があれば）
2. http: INTERNAL_API_BASE_URL（あれば）
3. http: NEXT_PUBLIC_API_BASE_URL（staging/production のみ・最終 fallback）
（local 明示時のみ: http://localhost:8787 を最後に追加）
候補 0 件 かつ 非 local → throw（fail-closed 維持・T01 の environmentExplicit 準拠）
```

fallback 判定規則（`fetchViaApiTransportChain`）:

| 条件 | 挙動 |
| --- | --- |
| transport 層 throw（`ApiTransportError`） かつ method が GET/HEAD かつ 次候補あり | 次候補で再試行 + `api_transport_fallback {from, to, path}` warn |
| HTTP エラー Response（401/404/410/5xx） | **fallback しない**。Response をそのまま返す（status 体系・`AuthRequiredError` 不変） |
| 非冪等 method（POST 等）の transport throw | fallback しない（二重適用防止）。`ApiTransportError` を伝播 |
| 全候補 throw | 最後の `ApiTransportError` を rethrow（→ 既存どおり `MEMBER_SESSION_FAILED`） |

### 2.4 既存コンポーネント再利用可否

- `resolveApiFetch` / `fetchViaApiTransport`（T01 統合後）: chain の内部要素として**再利用**（Phase 8 で単発 resolve と chain の重複排除を行う）。
- `safeServerFetch` / `session-error-display.ts` / `SectionError`: **変更しない**（chain が全滅した時のみ従来どおり `MEMBER_SESSION_FAILED` バナー）。
- `getPublicEnvSafe`: `NEXT_PUBLIC_API_BASE_URL` の取得に再利用（safeParse・throw しない）。
- 新規 primitive・新規 endpoint は作らない。

### 2.5 状態所有権 / ログ設計

- 認証判定（401/410）の所有権は **api/session-guard**（不変）。web は transport 選択・劣化運転・観測のみを所有。fallback は Response status に介入しない。
- ログイベント（すべて snake_case・PII なし）:
  - `auth_env_field_dropped {keys: string[]}`（T02。値・secret は出さない）
  - `api_transport_fallback {from, to, path}`（T03。from/to は transportKind+baseHost）
  - `server_fetch_failed {code, path, status, transportKind, baseHost}`（T01 統合で既設）

### 2.6 因果ループ / validation path

- B1: 単一 transport 依存 → 片系不調で全断 → 緊急対応、を「chain fallback（劣化運転）+ fallback warn（検知）」で断ち切る。
- B2: all-or-nothing parse → 無関係 drift で transport 喪失 → 原因不可視、を「field-tolerant + dropped-key warn」で断ち切る。
- validation path: Phase 4 契約表 → Phase 6 テスト → Phase 9 一括ゲート → Phase 11 staging 復旧検証（deploy → diagnose → `/profile` 描画 → 新ログで S1〜S4 確定）。

## 完了条件

- [x] T01〜T04 の責務と依存（T01 先行・T02/T03/T04 並列）が確定
- [x] chain の候補構成と fallback 判定規則（ApiTransportError のみ / GET・HEAD のみ / HTTP Response 非介入 / 全滅時 rethrow）が確定
- [x] 再利用方針（resolveApiFetch 再利用・safeServerFetch 等不変）が確定
- [x] ログ設計（3 イベント・PII なし）が確定
- [x] 因果ループ B1/B2 と validation path が記録されている

## 成果物

- `outputs/phase-2/phase-2.md`（本ファイル）

## 参照資料

- `_shared-context.md` §2（対策設計）・§7（因果ループ）
- `outputs/phase-1/phase-1.md`（F/S/F-A/F-B・AC）
- `apps/web/src/lib/fetch/transport.ts` / `authed.ts` / `apps/web/src/lib/env.ts`（現行実装）
- `git diff origin/dev...fix/profile-session-staging-localhost-endpoint`（T01 統合対象の実差分）

### システム仕様（aiworkflow-requirements）

- `docs/00-getting-started-manual/specs/02-auth.md`（認証境界 fail-closed・本設計は侵さない）

## 統合テスト連携

2.3 の fallback 判定規則の各行が Phase 4 の I/O 契約表の行に 1:1 で対応し、Phase 6 でテストケース化される。HTTP エラー Response 非介入は `/profile` page.spec.tsx の既存分岐回帰テストで二重に固定する。
