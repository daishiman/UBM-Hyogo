# Phase 8: DRY 化 / リファクタリング — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 8 / 13 |
| wave | 06b-fu |
| mode | parallel（実依存は serial: 06b-A → 06b-B → 06b-C） |
| 作成日 | 2026-05-02 |
| taskType | feature（UI 実装スペック） |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 5-7 で確定した実装上の重複候補を洗い出し、3 occurrence rule に基づく DRY 化と過剰抽象化回避を両立させる。
RequestDialog の confirm pattern、error code → message マッピング、API client の共通 fetch wrapper の 3 領域を対象に、リファクタ手順と回帰テスト保証を確定する。

## 実行タスク

1. 共通化候補 3 領域（confirm pattern / error mapping 辞書 / fetch wrapper）の occurrence を Phase 2 設計から抽出する。完了条件: 各候補の occurrence count が記録される。
2. 3 occurrence rule（同一概念 3 箇所以上で抽出開始）を適用し、抽出 / 据置 / 不採用を判定する。完了条件: 各候補に判定理由が付く。
3. リファクタ手順（before / after の配置 / API / 移行手順）を確定する。完了条件: 手順が手で実行可能な粒度で書かれている。
4. 回帰テスト保証（既存 unit / E2E をどの順で再実行するか、coverage しきい値変動の許容）を確定する。完了条件: 再実行コマンドが明記される。
5. 過剰抽象化を避ける線引き（Yagni / 単一画面・2 dialog の規模で導入しないもの）を記録する。完了条件: 不採用候補に理由が付く。

## 参照資料

| 資料名 | パス | 用途 |
| --- | --- | --- |
| Phase 2 設計 | `outputs/phase-02/main.md` | component / helper / error mapping の正本 |
| Phase 5 ランブック | `outputs/phase-05/main.md` | 実装着地点 |
| 既存 fetch helper | `apps/web/src/lib/fetch/authed.ts` | `fetchAuthed` / `AuthRequiredError` / `FetchAuthedError` |
| 既存 client api | `apps/web/src/lib/api/`（既存ファイル群） | API client 配置の慣行 |
| /me schemas | `apps/api/src/routes/me/schemas.ts` | shared zod / type 同期元 |

## 実行手順

### 1. 共通化候補と occurrence

| 候補 ID | 内容 | occurrence（予定） | 場所 |
| --- | --- | --- | --- |
| DRY-1 | confirm dialog pattern（open / submitting / error / accepted の state machine）| 2（Visibility / Delete） | `_components/VisibilityRequestDialog.tsx` / `DeleteRequestDialog.tsx` |
| DRY-2 | error code → 日本語文言の dict（`DUPLICATE_PENDING_REQUEST` / `INVALID_REQUEST` / `RATE_LIMITED` / `NETWORK` / `SERVER` / `RULES_CONSENT_REQUIRED`） | 3+（Visibility dialog / Delete dialog / `RequestErrorMessage.tsx`） | 上記 + `_components/RequestErrorMessage.tsx` |
| DRY-3 | `fetchAuthed` を base にした `/me/*-request` 共通 client wrapper（status → RequestErrorCode 変換） | 2（`requestVisibilityChange` / `requestDelete`） | `apps/web/src/lib/api/me-requests.ts` |
| DRY-4 | shared schema 型（`MeVisibilityRequestBodyZ` / `MeDeleteRequestBodyZ`）の client 側再 export | 2 | `apps/web/src/lib/api/me-requests.types.ts` |

### 2. 3 occurrence rule 適用判定

| 候補 ID | occurrence | 判定 | 理由 |
| --- | --- | --- | --- |
| DRY-1 confirm pattern | 2 | **据置（抽出しない）** | 2 箇所のみ。Visibility は単段、Delete は二段確認とフォーム形状が異なる。共通化すると条件分岐 prop が増えて可読性が落ちる |
| DRY-2 error mapping | 3+ | **抽出（採用）** | 同一辞書が 3 箇所で必要。dict を `_components/requestErrorMessages.ts` に切り出し、`RequestErrorMessage.tsx` から参照する。dialog 側からも import |
| DRY-3 fetch wrapper | 2 | **抽出（採用）** | helper file 内で 2 関数が同型のエラー変換を持つため、private 関数 `mapErrorToCode(status, body): RequestErrorCode` を 1 つにまとめる（module 内重複の排除）。export はしない |
| DRY-4 shared schema 再 export | 2 | **抽出（採用）** | `me-requests.types.ts` 1 ファイルに集約し、各 dialog からの直接 import を禁止する |

### 3. リファクタ手順

#### 3.1 DRY-2: error mapping 辞書の集約

**before**:
- `VisibilityRequestDialog.tsx` 内で switch 文 / object literal で error code → 文言を保持
- `DeleteRequestDialog.tsx` 内でも同様
- `RequestErrorMessage.tsx` でも同様

**after**:
- 新規ファイル `apps/web/app/profile/_components/requestErrorMessages.ts` を作成し、`Record<RequestErrorCode, string>` を export
- `RequestErrorMessage.tsx` はこの辞書のみを参照
- 各 dialog は `RequestErrorMessage` component に code を渡すだけにし、文言を直接持たない

**手順**:
1. `requestErrorMessages.ts` を新規作成し、Phase 2 のエラーマッピング表をそのまま反映
2. `RequestErrorMessage.tsx` を辞書参照に書き換え
3. 各 dialog から文言定義を削除し、`<RequestErrorMessage code={state.code} retry={...}/>` に統一
4. unit `RequestErrorMessage.test.tsx::all-codes-mapped` を追加し、code union 全網羅を保証

#### 3.2 DRY-3: client helper 内の status → code 変換の共通化

**before**: `requestVisibilityChange` / `requestDelete` の各 catch 節で同じ status 振り分けを記述
**after**: module-private 関数 `mapErrorToCode(err: unknown): RequestErrorCode` を 1 つ用意し、両関数から呼ぶ

**手順**:
1. `me-requests.ts` 内に `mapErrorToCode` を実装（401 / 403 / 409 / 422 / 429 / 5xx / network → code）
2. 両 export 関数を thin wrapper に縮約
3. unit `me-requests.test.ts::map-error-to-code::*` を追加し、全 status を網羅
4. AuthRequiredError は throw 維持（401 はリダイレクト責務を呼び出し側に委譲）

#### 3.3 DRY-4: 型の単一 export point

**before**: 各 dialog が `apps/api/src/routes/me/schemas.ts` の zod を直接 import するリスク
**after**: `apps/web/src/lib/api/me-requests.types.ts` で `VisibilityRequestInput` / `DeleteRequestInput` / `QueueAccepted` / `RequestErrorCode` / `RequestResult` を集約 export し、dialog / panel は `me-requests.types` のみを import する

**手順**:
1. `me-requests.types.ts` を作成し、shared schema 由来の型を再 export
2. dialog / panel / helper の import を `me-requests.types` に統一
3. ESLint rule の追加は本タスクでは行わない（rule 追加自体が他タスクの DRY 範囲）。代わりに Phase 9 の grep gate で監視

### 4. 不採用 / 据置候補（過剰抽象化を避ける線引き）

| 不採用候補 | 理由 |
| --- | --- |
| `useRequestSubmit<T>` カスタム Hook 化 | 2 箇所のみで利用形態が異なる（Visibility は単段、Delete は二段）。Hook 化すると prop ドリリング先が増える |
| 汎用 `<ConfirmDialog>` component | shadcn/ui 等の library 採用方針が project 全体で未確定。ここで先行抽出すると後段で書き直し |
| 楽観的更新ユーティリティ | Phase 2 で「楽奨更新は採用しない」決定済み |
| API 全体の generic `apiClient` | 既存 `fetchAuthed` で十分。本タスク範囲を逸脱 |
| reason 文字数バリデーションの shared util | 500 字制限は API zod 側で正本。client 側は zod を再利用するだけで util 不要 |

### 5. 回帰テスト保証

| ステップ | コマンド | 期待 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | 緑 |
| lint | `mise exec -- pnpm lint` | 緑 |
| unit（client helper / error mapping） | `mise exec -- pnpm --filter @ubm/web test -- me-requests RequestErrorMessage` | 緑 |
| unit（dialog） | `mise exec -- pnpm --filter @ubm/web test -- VisibilityRequestDialog DeleteRequestDialog` | 緑 |
| coverage | `mise exec -- pnpm --filter @ubm/web test:coverage` | line / branch / function / statement 80%+ |
| E2E（refactor 影響範囲のみ） | `mise exec -- pnpm --filter @ubm/web test:e2e -- profile.visibility-request profile.delete-request` | 全シナリオ緑 |
| static grep（不変条件 #4 / #5 / #11） | Phase 9 で実行 | 0 hit |

### 6. coverage しきい値の許容変動

- リファクタで重複コードを削減した結果、line coverage が一時的に上昇する可能性は許容する
- 80% 未達に転落した場合は Phase 6 へ戻りテスト追加（coverage-standards.md の loop）
- 大規模ファイル（500 行超）に該当しないため新規追加コードは line 80% / branch 80% を必須とする

## 統合テスト連携

| 判定項目 | 基準 | 確認 |
| --- | --- | --- |
| typecheck / lint | 緑 | Phase 8 完了直前 |
| unit | 緑 / 80%+ | リファクタ各ステップ後 |
| E2E（visibility / delete） | 緑 | Phase 8 完了直前 |
| static grep gate | 0 hit | Phase 9 |

- 上流: Phase 5 実装ランブック / Phase 7 AC マトリクス
- 下流: Phase 9 品質保証 / Phase 11 evidence 取得

## 多角的チェック観点

- 3 occurrence rule に従い、2 箇所のみで抽出していないか（DRY-1 据置の根拠）
- 抽出後の export 面が必要最小に絞られているか（dict / module-private 関数 / type re-export のみ）
- 不採用候補の理由が「YAGNI」「規模逸脱」「他タスク範疇」のいずれかで明確化されているか
- リファクタが AC-1..AC-8 のいずれも壊さないことが回帰テストで保証されているか
- 不変条件 #4 / #5 / #11 をリファクタで間接的に弱めていないか（特に shared 型 import を増やすことで `cloudflare:d1` の間接参照が発生しないか）

## サブタスク管理

- [ ] DRY-1..DRY-4 の occurrence と判定理由を表で固定
- [ ] DRY-2 / DRY-3 / DRY-4 のリファクタ手順を before/after で記述
- [ ] 不採用候補と理由を表で固定
- [ ] 回帰テスト保証コマンドを `mise exec --` 付きで明記
- [ ] coverage しきい値変動の許容範囲を記録
- [ ] `outputs/phase-08/main.md` を作成

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| 重複分析報告 | `outputs/phase-08/main.md` | DRY 候補表 / リファクタ手順 / 不採用理由 / 回帰テスト保証 |

## 完了条件

- [ ] DRY 候補 4 件すべてに 3 occurrence rule 判定が付いている
- [ ] 抽出採用 3 件のリファクタ手順が before/after で書かれている
- [ ] 不採用候補 5 件以上に YAGNI 由来の理由が付いている
- [ ] 回帰テストコマンドが `mise exec --` 経由で明記されている
- [ ] coverage しきい値の許容範囲が記録されている
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク 100% 実行確認【必須】

- [ ] DRY 化が AC を一切壊さない構造になっている
- [ ] 過剰抽象化候補（generic ConfirmDialog / useRequestSubmit / 汎用 apiClient）が不採用理由付きで記録されている
- [ ] 不変条件 #4 / #5 / #11 をリファクタで弱めていない
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 9 へ、抽出採用候補 3 件、回帰テストコマンド一覧、coverage 許容範囲、不採用理由を渡す。
