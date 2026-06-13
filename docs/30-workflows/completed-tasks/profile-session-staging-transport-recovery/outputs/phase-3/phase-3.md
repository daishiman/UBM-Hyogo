# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 3 / 13 |
| 前提 | Phase 1・2 完了 |
| 判定 | **Phase 4 へ進行可（GO）** |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

Phase 2 の多層防御設計が不変条件（`/me` 契約・認証境界 fail-closed・cookie 信頼境界・apps/api 非接触）を侵さないかをレビューし、Phase 4 以降（タスク仕様書作成）への進行を判定する。後続のタスク仕様書がコード実装可能な粒度になるよう、対象モジュールと想定変更ファイル群を俯瞰する。

## 実行タスク

### 3.1 モジュール俯瞰（想定変更ファイル）

| モジュール | ファイル | T | 変更の性質 |
| --- | --- | --- | --- |
| env アクセサ | `apps/web/src/lib/env.ts` | T01/T02 | `getEnvironmentResolution` 追加（merge）→ `getAuthEnv` 内部を field 単位 safeParse 化（公開シグネチャ不変） |
| transport | `apps/web/src/lib/fetch/transport.ts` | T01/T03 | `ApiTransportError`/`describeTransport`（merge）→ `resolveApiTransportChain`/`fetchViaApiTransportChain` 追加 |
| authed fetch | `apps/web/src/lib/fetch/authed.ts` | T01/T03 | 内部を chain 化（`fetchAuthed<T>` の公開契約不変） |
| safe fetch / errors | `safe-fetch.ts` / `errors.ts` | T01 のみ | merge そのまま（追加変更なし） |
| 診断 | `scripts/diagnose-profile-session.sh` | T04 | probe 2 系統化 + data-cause 抽出 + 版数手順 |
| テスト | env/transport/authed/safe-fetch spec + page.spec.tsx | T02/T03 | ケース追加・回帰固定 |

### 3.2 設計妥当性レビュー（採否判断）

| 論点 | 判定 | 根拠 |
| --- | --- | --- |
| fallback を `ApiTransportError` のみに限定 | 採用 | HTTP Response に介入すると status 体系（401→redirect / 404→再ログイン / 410・5xx→区別バナー）が崩れ AC-7 違反になるため |
| fallback を GET/HEAD に限定 | 採用 | service-binding throw 時に API へ届いていた可能性が残り、POST 再送は二重適用リスク。`/me`（GET）の復旧には十分 |
| `NEXT_PUBLIC_API_BASE_URL` を最終 fallback に追加 | 採用（staging/production のみ） | 同一 API ホストで信頼境界の拡大なし。`INTERNAL_API_BASE_URL` だけが drift した場合の最後の砦 |
| `getAuthEnv` の field-tolerant 化 | 採用 | 全 drop は「無関係 field の drift が transport 全断に化ける」増幅器（F-A）。tolerant 化しても各 consumer は従来から optional 前提（AuthEnvSchema.partial()）で型不変 |
| `/profile` UI・session-error-display への変更 | 不採用（非接触） | 復旧後は正常描画。真の全断時のみ既存バナーが出るのが正しい挙動 |

### 3.3 不変条件 非侵襲レビュー

| 不変条件 | 侵襲なしの根拠 |
| --- | --- |
| `/me` 契約・status 体系不変（AC-7） | chain は Response を無加工で返す。エラーコード生成（`MEMBER_SESSION_*`）も不変 |
| 認証境界 fail-closed（AC-4） | 候補 0 かつ非 local は throw。localhost は `ENVIRONMENT=local` **明示**時のみ（T01 の `environmentExplicit` 維持） |
| cookie 信頼境界 | fallback 先は従来の http transport と同一の自 API ホストのみ。新たな送信先は増えない |
| apps/api 非接触 | 変更ファイルに `apps/api/**` なし（Phase 9 で grep 検証） |
| process.env 直接参照禁止 | すべて `getAuthEnv`/`getPublicEnvSafe` 等アクセサ内で完結 |
| PII 非出力 | 新ログ 2 イベントは key 名・transportKind・baseHost・path のみ |

### 3.4 Phase 11 の特化宣言

Phase 11 は「staging 復旧の実機検証 + sub-cause（S1〜S4）の最終確定」に特化する（user-gated: merge→deploy→`bash scripts/diagnose-profile-session.sh`→`/profile` 正常描画 screenshot→新ログ transportKind/baseHost の読解）。前身 WF の MT-A〜MT-D はこの復旧検証に統合され、独立の調査ステップとしては実施しない。

### 3.5 4条件評価（設計レビュー判定）

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | F-1〜F-3（transport throw 確定）と T01〜T04（transport 層対策）が一致。UI 層対策を含まない理由も F-1 で説明される |
| 漏れなし | PASS | S1〜S4 の全経路に対し復旧手段（S1/S3/S4→chain・S2→fail-closed+chain）と検知手段（ログ/診断）が対応 |
| 整合性あり | PASS | 識別子（S/F/T/AC）・命名規則・ログイベント名が SSOT と一致 |
| 依存関係整合 | PASS | T01→{T02,T03} の直列制約と T04 独立が Phase 5 のタスク分割に反映可能 |

### 3.6 MINOR 指摘の追跡

- MINOR-1: `fetchViaApiTransport`（単発）と chain の共存は一時的な重複。Phase 8 で chain の内部要素として整理する（追跡先: phase-8）。
- MINOR-2: 診断スクリプトの旧 probe（web `/me`）は誤誘導出力のため T04 で必ず是正する（追跡先: task-04）。

## 完了条件

- [x] 想定変更ファイル俯瞰が揃い、タスク仕様書がコード実装可能な粒度で書ける状態
- [x] 不変条件 6 項目すべて非侵襲と判定
- [x] 4条件評価 PASS・GO 判定
- [x] Phase 11 特化宣言を記録
- [x] MINOR 指摘に追跡先を付与

## 成果物

- `outputs/phase-3/phase-3.md`（本ファイル）

## 参照資料

- `_shared-context.md` §2・§3・§7
- `outputs/phase-1/phase-1.md` / `outputs/phase-2/phase-2.md`
- `CLAUDE.md`（不変条件・env アクセス規約・cf.sh 規約）

## 統合テスト連携

3.2/3.3 の各判定は Phase 4 の契約表・Phase 6 のテストケース・Phase 9 の grep ゲート（apps/api 非接触・localhost 焼き込みなし）として機械検証へ落とし込む。
