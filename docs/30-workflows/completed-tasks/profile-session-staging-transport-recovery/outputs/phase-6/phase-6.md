# Phase 6: テスト拡充

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 6 / 13 |
| taskType | implementation |
| implementation_mode | `edit` |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

T02（field-tolerant）/ T03（transport chain）の変更に対し、**S1〜S4 ×（fallback 成功 / 全滅）× HTTP エラー非 fallback × POST 非 fallback × 401 `AuthRequiredError` 回帰 × ログ PII なし × page.spec.tsx 回帰**を網羅するテストケースを確定する。テストファイルは **SSOT §5 の test_files（既存 5 spec）への追加のみ**とし、新規 spec ファイルは作らない（T04 は shell のため vitest 対象外・task-04 §5 の DG 系で担保）。

## 実行タスク

### 6.1 テストファイルとケース群の対応（既存 5 spec への追加のみ）

| ファイル | 追加ケース群 | タスク |
| --- | --- | --- |
| `apps/web/src/lib/__tests__/env.spec.ts` | EV-1〜EV-6 | T02 |
| `apps/web/src/lib/fetch/transport.spec.ts` | CH-1〜CH-6 / FB-1〜FB-6 | T03 |
| `apps/web/src/lib/fetch/authed.spec.ts` | AU-1〜AU-5 | T03 |
| `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | transport ログ追従（既存 410 診断テストへ transportKind/baseHost null 期待を追加 + flat フィールド展開テスト 1 件新規。T01 取込時に spec 追従が漏れていたため 2026-06-12 に是正） | T01 |
| `apps/web/app/(member)/profile/page.spec.tsx` | PG-1〜PG-5（回帰固定） | T03 |

### 6.2 T02: `getAuthEnv` field-tolerant（env.spec.ts）

task-02 §4 の表を正とする。要点のみ再掲:

| ID | 観点 | 期待 |
| --- | --- | --- |
| EV-1 | F-A 回帰の正本 | 空文字 `GOOGLE_CLIENT_ID` 混在でも `INTERNAL_API_BASE_URL` 保持（AC-2） |
| EV-2 | warn 契約 | `auth_env_field_dropped {keys}`・key 名のみ・値非出力（AC-5） |
| EV-3 | 複数 drop | 不正 2 field とも drop・valid 保持 |
| EV-4 / EV-6 | 後方互換 | 全 valid / 空入力で warn なし・従来同一戻り値 |
| EV-5 | binding 透過 | `API_SERVICE` は schema 外透過で保持 |

### 6.3 T03: chain 構成と fallback 判定（transport.spec.ts）

S1〜S4 を chain の単体レベルへ写像する。FB 系は `vi.fn()` の fetch stub と `console.warn` spy で検証する。

| ID | サブ原因 / マトリクス | 入力 | 期待 |
| --- | --- | --- | --- |
| CH-1 | 構成順序 | binding + internal + public（staging） | `[service-binding, http(internal), http(public)]` 順序固定 |
| CH-2 | 最後の砦 | public のみ（staging） | `[http(public)]`（INTERNAL drift 時の復旧経路） |
| CH-3 | S1 / fail-closed | 候補 0・staging | throw（`MEMBER_SESSION_FAILED` へ至る既存経路維持） |
| CH-4 | 明示 local | 候補 0・local 明示 | `[http(localhost:8787)]`（AC-4 の許容側） |
| CH-5 | S2 遮断 | 候補 0・`environmentExplicit` なし | throw（**非 local 環境で localhost に絶対に落ちない**・AC-4） |
| CH-6 | test 決定性 / 重複排除 | `isTest:true`+baseUrl / baseUrl===publicBaseUrl | 単一 http / http 候補 1 本に縮約 |
| FB-1 | S3 → fallback 成功（M-1） | GET・binding reject → internal 200 | Response 200 + `api_transport_fallback {from,to,path}` warn 1 回 |
| FB-2 | S4 → 2 段 fallback（M-1） | GET・binding reject → internal reject → public 200 | Response 200 + warn 2 回 |
| FB-3 | HTTP エラー非介入（M-2） | binding が 503 Response | 503 をそのまま返す・fallback なし・warn なし（AC-3/AC-7） |
| FB-4 | POST 非 fallback（M-3） | POST・binding reject・次候補あり | `ApiTransportError` 即伝播・warn なし（二重適用防止） |
| FB-5 | 全滅（M-4） | GET・全候補 reject | 最後の `ApiTransportError` rethrow（diagnostic は最終候補） |
| FB-6 | ログ PII なし（AC-5） | FB-1 の warn payload | payload 文字列に cookie / memberId / secret / Authorization 値を含まない。`from`/`to` は `{transportKind, baseHost}` のみ |

### 6.4 T03: fetchAuthed 統合（authed.spec.ts）

| ID | サブ原因 / 観点 | 入力 | 期待 |
| --- | --- | --- | --- |
| AU-1 | S3 復旧の正本（AC-3） | binding fetch throw・internal が `/me` 200 JSON | `fetchAuthed<T>("/me")` が JSON を返す（公開契約不変のまま劣化運転） |
| AU-2 | 401 回帰（M-2） | 応答 401 Response | `AuthRequiredError` throw（fallback なし・redirect 経路不変） |
| AU-3 | 非 2xx 回帰 + 診断値 | 応答 503 Response | `FetchAuthedError(503)`・`transport` descriptor が**実際に応答した transport** のもの |
| AU-4 | 全滅（M-4・S1〜S4） | 全候補 throw | `ApiTransportError` 伝播 → 上位 `safeServerFetch` で `MEMBER_SESSION_FAILED`（既存正規化不変） |
| AU-5 | cookie 信頼境界 | fallback 後の http 呼び出し | cookie header が従来の http transport と同一の付与のされ方（送信先は chain 内の自 API ホストのみ） |

### 6.5 401 回帰・page.spec.tsx 回帰（PG 系・AC-7 の固定）

`/profile` の UI 文言・分岐が**一切変わらない**ことを既存ケースの green 維持 + 以下の固定で確認する（UI 実装ファイルは非接触。spec への追加のみ）。

| ID | `/me` 結果 | 期待（従来と同一） |
| --- | --- | --- |
| PG-1 | `AuthRequiredError`（401） | `redirect("/login?redirect=/profile")`・バナー非描画 |
| PG-2 | `FetchAuthedError(404)` | 「再ログイン」CTA（`/login?redirect=/profile`） |
| PG-3 | `FetchAuthedError(410)` | `data-cause` 区別バナー・文言不変 |
| PG-4 | `FetchAuthedError(503)` | 同上（5xx 族） |
| PG-5 | transport 失敗（`ApiTransportError` 相当の status 無し throw） | `MEMBER_SESSION_FAILED` バナー「通信経路でセッション確認に失敗しました…」文言不変（F-1 の文言を変えない） |

### 6.6 網羅マトリクス（主問題 → テストの対応）

| 軸 | S1 | S2 | S3 | S4 |
| --- | --- | --- | --- | --- |
| 単体（chain） | CH-3（候補 0 throw） | CH-5（非明示 localhost 不落・遮断） | FB-1（binding reject→fallback） | FB-2（http reject→fallback） |
| fallback 成功 | —（S1 は構成段階） | —（遮断が正） | FB-1 / AU-1 | FB-2 |
| 全滅 | CH-3 → AU-4 | CH-5 → AU-4 | FB-5 / AU-4 | FB-5 / AU-4 |
| 誘発元の遮断（F-A） | EV-1（INTERNAL 保持で S1 を予防） | EV-1 同左 | — | — |

横断軸: HTTP エラー非 fallback = FB-3 / AU-2 / AU-3。POST 非 fallback = FB-4。401 回帰 = AU-2 / PG-1。ログ PII なし = EV-2 / FB-6。UI 回帰 = PG-1〜PG-5。

### 6.7 実行補助コマンド（apps/web package 内・SSOT §8 形式）

```bash
cd apps/web
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/__tests__/env.spec.ts \
  apps/web/src/lib/fetch/transport.spec.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  'apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts' \
  'apps/web/app/(member)/profile/page.spec.tsx'
cd ../..
```

> T04 の検証（DG-1〜DG-5）は task-04 §5・§6 のとおり `bash -n` + 出力 key 検査で担保し、vitest には含めない。

## 完了条件

- [x] テスト追加先が SSOT §5 の既存 5 spec のみ（新規 spec ファイルなし・`*.spec.{ts,tsx}` 規則維持）
- [x] S1〜S4 ×（fallback 成功 / 全滅）の全組合せがケース表で被覆されている（6.6）
- [x] HTTP エラー非 fallback（M-2）・POST 非 fallback（M-3）・401 `AuthRequiredError` 回帰がケース化されている
- [x] ログ PII なし（`auth_env_field_dropped` / `api_transport_fallback`）の負方向検証（EV-2 / FB-6）がある
- [x] page.spec.tsx 回帰（PG-1〜PG-5・F-1 文言不変）が固定されている
- [x] 実行補助コマンドが SSOT §8 形式で固定されている

## 成果物

- `outputs/phase-6/phase-6.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401/410 境界（AU-2 / PG-1 の正本） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` shape 不変（AU-1 正常系の判定基準） |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | session 未解決→401→redirect の正本 |

- `_shared-context.md` §1（S1〜S4・F-A/F-B）・§4（AC）・§5（test_files・命名規則）
- `outputs/phase-4/phase-4.md`（I/O 契約・M-1〜M-4・RED 観点）
- `outputs/phase-5/task-02..04`（各タスクのテスト方針）

## 統合テスト連携

本ケース表（EV / CH / FB / AU / PG）を Phase 7 の変更ブロック限定カバレッジで被覆判定し、Phase 9 の品質ゲート（focused vitest 一括 + `bash -n` + grep）で一括 PASS を確認する。staging 実機での S1〜S4 確定と復旧 screenshot は Phase 11（user-gated）。
