# Phase 12: 実装ガイド（implementation-guide）

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 12 / 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |

---

## Part 1: 中学生レベルの概念説明（なぜ → 何を）

### なぜこの修正が必要か（日常の例え話）

マイページを開くと、画面の裏側では「受付係」（web Worker）が「名簿係」（API Worker）に内線電話をかけて、あなたの会員情報を取り寄せています。今 staging で起きているのは、**内線電話そのものがつながらない**という故障です。名簿係が「あなたは退会済みです」と答えたわけでも、「名簿が壊れています」と答えたわけでもなく、**呼び出し音すら鳴らないまま切れている**ことが、画面の文言（「通信経路でセッション確認に失敗しました」）から確定しています。

さらに調べると、今の作りには 2 つの弱点があることが分かりました。

- **弱点 1（F-A）**: 受付係は「連絡先メモ帳」（環境変数）を読むとき、**1 か所でも書き間違いがあるとメモ帳ごと全部捨ててしまう**ルールになっています。無関係な 1 行のミスで、名簿係の内線番号まで失われます。
- **弱点 2（F-B）**: 受付係は内線（service binding）と外線（URL 直通）の**2 本の回線を持っているのに、いつも 1 本しか試しません**。1 本目が故障していたら、2 本目が無事でもあきらめてしまいます。

### 何をするか

今回は「電話が 1 本切れてもマイページは開ける」ようにする 4 つの工事をします。

1. **T01 通話記録装置の設置（観測性成果統合）**: すでに別の作業場（未マージブランチ）で作ってあった「どの回線で・どこ宛てに失敗したか」を記録する装置を、今回の工事に合流させます。これで次に故障しても記録だけで原因（S1〜S4 のどれか）が分かります。
2. **T02 メモ帳の読み方を直す（field-tolerant 化）**: 書き間違いの行だけ捨てて、正しい行は使うようにします。捨てた行の「見出し名だけ」を記録します（中身の秘密は書きません）。
3. **T03 回線の掛け直し（fallback chain）**: 内線がダメなら外線、外線がダメなら公開番号、と**順番に掛け直す**ようにします。ただし「相手が出て断られた」場合（401 や 410 などの正式な返事）は掛け直しません。掛け直すのは「呼び出し音すら鳴らない」場合だけ、しかも読み取り（GET/HEAD）だけです。
4. **T04 点検キットの改良（診断スクリプト拡張）**: 点検スクリプトが今まで**存在しない窓口**を点検していた欠陥を直し、本当の 2 つの経路（web 経由と API 直通）を点検できるようにします。

この 4 つを入れれば、S1〜S4 のどの故障パターンでもマイページは復旧し、もし再発しても記録を読むだけで原因が特定できます。名簿係（apps/api）そのものには一切手を入れません。

---

## Part 2: 技術者向け実装ガイド

### 背景

staging `/profile` で `MEMBER_SESSION_FAILED` 専用文言（PR #1194 導入・F-1/F-2）が表示されており、`/me` fetch が HTTP 応答に至らず throw した transport 失敗が確定している（F-3）。web 側 Auth.js decode と middleware env 読みは正常（F-4）、`wrangler.toml [env.staging]` の設定も正しい（F-5）。観測性 + fail-closed の先行実装は未マージブランチ `fix/profile-session-staging-localhost-endpoint` にあり staging 未デプロイ（F-6）。残るサブ原因は S1（transport unresolved throw）/ S2（localhost fallback 接続失敗）/ S3（service-binding fetch throw）/ S4（http fetch throw）で、横断要因 F-A（`getAuthEnv` all-or-nothing safeParse）と F-B（単一 transport 依存）がある。

### 要約

T01（観測性成果統合）→ {T02（env field-tolerant）∥ T03（transport fallback chain）} ∥ T04（診断スクリプト拡張）の 4 タスクで、**S1〜S4 のいずれであっても復旧する多層防御**を 1 サイクルで実装する。`/me` の path・shape・status 体系・`apps/api` 全体・D1 schema・Google Form 仕様・`/profile` UI 文言/分岐は一切変更しない（AC-7）。サブ原因の最終確定は deploy 後の Phase 11 RT-D（user-gated）。

### 実行順序（本実行サイクル の正本）

```
T01（直列・最初）: origin/fix/profile-session-staging-localhost-endpoint を work branch へ merge
   │   （T02/T03 は T01 がもたらす ApiTransportError / getEnvironmentResolution の上に積むため先行必須）
   ├─→ T02（T01 後・T03 と並列可）: getAuthEnv field-tolerant 化
   └─→ T03（T01 後・T02 と並列可）: transport 多段フォールバック chain
T04（T01〜T03 と独立並列）: 診断スクリプト拡張
```

### 実装ステップ（task 別: 変更ファイル・検証コマンド・DoD）

#### T01: 観測性成果統合（`outputs/phase-5/task-01-observability-branch-integration.md`）

| 項目 | 内容 |
| --- | --- |
| 操作 | `git merge origin/fix/profile-session-staging-localhost-endpoint`（dev 同期済のためコンフリクト最小。push/PR はしない） |
| 取り込まれる変更 | `apps/web/src/lib/fetch/transport.ts`（`ApiTransportError{transportKind,baseHost}` / `describeTransport`）/ `apps/web/src/lib/env.ts`（`getEnvironmentResolution`・`environmentExplicit` fail-closed）/ `apps/web/src/lib/server-fetch/safe-fetch.ts`（`server_fetch_failed {transportKind, baseHost}` ログ）/ `apps/web/src/lib/fetch/errors.ts`（`FetchAuthedError` transport 引数）+ 各 spec |
| 検証コマンド | Phase 9 L-3（focused vitest 5 spec）+ `mise exec -- pnpm typecheck` |
| DoD（AC-1） | merge 完了・既存テスト全 green・S2 が fail-closed 化（非 local で localhost に落ちず throw） |

#### T02: `getAuthEnv` field-tolerant 化（`outputs/phase-5/task-02-auth-env-field-tolerant.md`）

| 項目 | 内容 |
| --- | --- |
| 変更ファイル | `apps/web/src/lib/env.ts`（編集）/ `apps/web/src/lib/__tests__/env.spec.ts`（ケース追加） |
| シグネチャ | `export function getAuthEnv(rawEnv?: RawEnv): AuthEnv;`（戻り値型不変・内部を field 単位 safeParse 化） |
| 挙動 | 不正 field のみ drop し、dropped **key 名のみ**を構造化 warn `auth_env_field_dropped {keys}` で出力（値・secret 非出力） |
| 検証コマンド | `mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/__tests__/env.spec.ts` |
| DoD（AC-2） | 「無関係 field 1 つの不正で `INTERNAL_API_BASE_URL` が消える」回帰ケースが spec で固定され green |

#### T03: transport 多段フォールバック chain（`outputs/phase-5/task-03-transport-fallback-chain.md`）

| 項目 | 内容 |
| --- | --- |
| 変更ファイル | `apps/web/src/lib/fetch/transport.ts` / `apps/web/src/lib/fetch/authed.ts`（編集）/ `transport.spec.ts`・`authed.spec.ts`（ケース追加）/ `apps/web/app/(member)/profile/page.spec.tsx`（分岐・文言不変の回帰のみ） |
| シグネチャ | `resolveApiTransportChain(env: ApiTransportChainEnv): ApiTransport[]`（長さ>=1 or throw）/ `fetchViaApiTransportChain(chain, path, init?): Promise<Response>`（`ApiTransportError` 時のみ次候補・GET/HEAD のみ・全滅時 rethrow）/ `fetchAuthed` 公開契約不変 |
| chain 候補順 | service-binding → `INTERNAL_API_BASE_URL` → `NEXT_PUBLIC_API_BASE_URL`（staging/production のみ）→（`ENVIRONMENT=local` 明示時のみ localhost） |
| fallback 禁止条件 | HTTP エラー Response（401/404/410/5xx）/ 非冪等 method（POST 等）/ 候補 0 かつ非 local は throw（fail-closed） |
| ログ | fallback 発生時 `api_transport_fallback {from, to, path}` 構造化 warn（PII なし） |
| 検証コマンド | `mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/fetch/transport.spec.ts apps/web/src/lib/fetch/authed.spec.ts 'apps/web/app/(member)/profile/page.spec.tsx'` |
| DoD（AC-3/4/5） | service-binding throw → http fallback で `/me` 取得成功ケース green・HTTP エラー非 fallback green・非 local で localhost 非到達 green・fallback warn の PII 非出力 green |

#### T04: 診断スクリプト拡張（`outputs/phase-5/task-04-diagnose-script-extension.md`）

| 項目 | 内容 |
| --- | --- |
| 変更ファイル | `scripts/diagnose-profile-session.sh`（編集） |
| 挙動 | (a) probe を web `/api/me`（proxy 実経路）と API direct `${API_BASE}/me` の 2 系統へ拡張（旧 web `/me` probe の誤誘導是正 = MINOR-2）(b) cookie 提供時（user-gated）に web `/profile` HTML の `data-cause` 抽出 (c) `bash scripts/cf.sh` 経由の deploy 版数確認手順を出力。read-only・冪等・secret/cookie/memberId 非出力維持 |
| 検証コマンド | `bash -n scripts/diagnose-profile-session.sh` |
| DoD（AC-6） | `bash -n` PASS・2 系統 probe + `data-cause` 抽出 + 版数手順が出力に含まれる・再実行で同一出力 |

### 検証コマンド（全体・SSOT §8 逐語）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/__tests__/env.spec.ts \
  apps/web/src/lib/fetch/transport.spec.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  'apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts' \
  'apps/web/app/(member)/profile/page.spec.tsx'
bash -n scripts/diagnose-profile-session.sh
git diff dev --name-only | grep '^apps/api/'   # 空出力期待（apps/api 非接触・AC-7）
grep -rn '127.0.0.1:8888' apps/web/src          # 空出力期待（localhost 焼き込み禁止）
# 復旧検証（user-gated・deploy 後）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
bash scripts/diagnose-profile-session.sh
```

### エラーハンドリング

- chain 全滅時は最後の `ApiTransportError` を rethrow → 既存どおり `MEMBER_SESSION_FAILED` バナー（真の全断時のみ・UI 不変）。
- 候補 0 かつ非 local は `API transport unresolved` throw（fail-closed・AC-4）。
- HTTP エラー Response は無加工で返し、`AuthRequiredError`（401 redirect）・`MEMBER_SESSION_<status>` 体系を不変に保つ。

### エッジケース

- 非冪等 method（POST 等）の transport throw は fallback せず `ApiTransportError` を伝播（二重適用防止）。
- `NEXT_PUBLIC_API_BASE_URL` fallback は staging/production のみ（local では候補に入れない）。fallback 先は同一 deployment の自 API ホストのみで cookie 信頼境界を拡大しない。
- `auth_env_field_dropped` は dropped key 名のみ出力（値・secret は出さない）。

### 既知制限

- `apps/api` 非接触のため、S3（bound worker hard error）が真因の場合は chain fallback で**復旧はする**が根治しない。根治は staging ログで S3 確定後に `unassigned-task/task-api-worker-hard-error-root-fix.md` で実施（CONST_007 例外①）。
- staging deploy・復旧確認・runtime screenshot・commit・push・PR は user-gated（implemented_local_runtime_pending では未実施）。

---

## 視覚証跡

VISUAL_ON_EXECUTION。コード変更は transport/env 層で UI 外観は不変。現象 screenshot は**ユーザー提供**（2026-06-11 21:43 JST・「ishida 会員」・文中参照）。復旧の最終証跡は staging `/profile` 正常描画の runtime screenshot で user-gated。

| 証跡 | パス | 状況 |
| --- | --- | --- |
| 現象 screenshot（ユーザー提供） | （ユーザー提供画像・文中参照） | user-provided（受領済み） |
| focused vitest（5 spec・jsdom） | Phase 9 L-3 | PASS（72 tests・2026-06-12 再検証で `safe-fetch.spec.ts` の T01 取込漏れを是正し全 5 spec green） |
| 復旧後 staging runtime screenshot | `outputs/phase-11/screenshots/profile-session-recovery-staging.png` | pending（user-gated・認証必須） |

## 完了条件

- [x] Part 1（中学生レベル・例え話・なぜ→何を）を本文 3 行以上で記述
- [x] Part 2（実行順序 T01→{T02∥T03}∥T04 / task 別 変更ファイル・検証コマンド・DoD / 全体検証コマンド / エラーハンドリング / エッジケース / 既知制限）を背景・要約つきで記述
- [x] `## 視覚証跡` で現象 screenshot（ユーザー提供）と復旧後 capture 計画（user-gated pending）を明記
- [x] 識別子（`ApiTransportError` / `resolveApiTransportChain` / `fetchViaApiTransportChain` / `getAuthEnv` / `api_transport_fallback` / `auth_env_field_dropped` / `server_fetch_failed`）を SSOT と一致

## 成果物

- `outputs/phase-12/implementation-guide.md`（本ファイル）

## 参照資料

- `_shared-context.md` §1（F/S/F-A/F-B）/ §2（T01〜T04・シグネチャ）/ §8（検証コマンド）
- `outputs/phase-2/phase-2.md`（chain 設計・fallback 判定規則・ログ設計）
- `outputs/phase-5/task-01..04-*.md`（実装仕様書本体・CONST_005 全項目）
- `apps/web/src/lib/env.ts` / `apps/web/src/lib/fetch/transport.ts` / `authed.ts`（現行実装）
