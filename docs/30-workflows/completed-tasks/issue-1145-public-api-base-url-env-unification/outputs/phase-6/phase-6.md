# Phase 6: テスト拡充 — fail path / 回帰 guard

> **[実装区分: 実装仕様書]** NON_VISUAL

## 1. メタ情報

| 項目 | 内容 |
| ---- | ---- |
| Phase | 6（テスト拡充） |
| 入力 | Phase 4（検証 suite）/ Phase 5（実装手順） |
| 出力 | 本 `phase-6.md`（fail path / 回帰 guard の拡充方針） |
| 実装区分 | NON_VISUAL（挙動不変リファクタリング。拡充は既存 fail path の不変性確認に限定） |

## 2. 拡充方針（YAGNI で限定する）

本タスクは同義 env キーの削除 / rename であり、新しい振る舞い・新しい分岐を導入しない。
したがって**新規 fail path テストの追加は最小化**し、次の 2 種に限定する:

1. **既存 fail path の不変性確認**（新規追加ではなく、既存テストが移行後も同じ意図で fail を検証していることの確認）。
2. **回帰 guard としての grep gate / typecheck の継続実行**（Phase 4 の gate を Phase 6 でも回す）。

新規 it/test を追加するのは、移行によって**カバレッジが落ちる箇所が出た場合のみ**（後述 §4）。それ以外は YAGNI とし追加しない。

## 3. 不変性を確認する既存 fail path

| spec | 既存 fail path（不変点） | 移行後の期待 |
| ---- | ------------------------ | ------------ |
| `apps/web/src/lib/__tests__/env.spec.ts` | `EnvSchema.parse` が必須 env 欠落で throw する（zod 検証）。`NEXT_PUBLIC_API_BASE_URL` 欠落時に parse fail | 旧キー seed 削除後も「`NEXT_PUBLIC_API_BASE_URL` 必須」の fail path が維持される。旧キー `PUBLIC_API_BASE_URL` を schema から消したため「旧キーがあれば parse 成功」というケースは削除される（不要だったため正しい縮退） |
| `apps/web/src/lib/fetch/public.ts`（`public.spec.ts`） | `getBaseUrl()` が非 local runtime で base URL 未解決時に throw（`fetchPublic: API base URL unresolved ...`） | fallback（`?? env.PUBLIC_API_BASE_URL`）削除後、`NEXT_PUBLIC_API_BASE_URL` 単独 unset で同じ throw に到達することを確認。**fail path の到達条件が「両キー unset」→「単一キー unset」に単純化されるだけで throw 自体は不変** |
| `apps/og/src/member-source.ts`（`member-source.spec.ts`） | `fetchViaBaseUrl()` が base URL 未設定時に `null` を返し、`fetchMemberSummary` 全体が `null` に縮退（fail-soft） | rename 後、`NEXT_PUBLIC_API_BASE_URL` 未設定時に同じ `null` 縮退に到達することを確認。fail-soft 挙動は不変 |

> いずれも「throw / null 縮退の条件が旧キー併存 → 単一キーに単純化される」だけで、fail path の**結果**は不変。新規 it は追加せず、移行後に既存 fail path テストが green であることをもって不変性を担保する（Phase 4 V-1 / V-2 / V-10）。

## 4. 回帰 guard（移行で漏れやすい箇所の追加検証）

### 4-1. public.ts の取りこぼし回帰 guard（最重要 struggle point）

Phase 2 §5 / Phase 3 リスク表で最重要とされた「public.ts の `?? env.PUBLIC_API_BASE_URL` 取りこぼし」は、**型結合 + grep gate の二重 guard**で機械検出する（新規 it は不要）:

- 型 guard: Phase 4 T-1（`typecheck`）。`getPublicFetchEnv()` 戻り値型から旧キーが消えたため、public.ts に旧キー参照が残ると型エラー。
- 静的 guard: Phase 4 G-1（grep gate）。コメント残存も含め旧キー 0 件。

### 4-2. env.spec.ts の `getApiBaseEnv` テスト削除後のカバレッジ縮退確認

`getApiBaseEnv()` 関数を削除するため、その 2 テスト（Phase 5 §5-1）も削除する。これは**カバレッジ対象関数の消滅であり「テストが減った」ではなく「対象が消えた」**。Phase 7 で「削除した関数は coverage 母数から外れる」ことを明記する（カバレッジ低下の誤検知防止）。

### 4-3. transport 選択の回帰 guard

`public.spec.ts` の service-binding 優先 / HTTP fallback の選択テストは、seed を `NEXT_PUBLIC_API_BASE_URL` に置換しても**選択結果（どちらの transport が選ばれるか）が同一**であることを assert で維持する。これが transport 挙動不変の回帰 guard（Phase 4 V-2）。

## 5. 新規テストを追加しない判断の根拠

| 候補 | 追加するか | 理由 |
| ---- | --------- | ---- |
| 「旧キーが残っていたら fail」する meta テスト | 追加しない | grep gate（G-1）が静的に 0 件を担保。runtime テスト化は重複（YAGNI） |
| apps/og rename の semantics テスト | 追加しない | runtime 挙動不変（同じ値を読む）。既存 fallback テスト（V-10）で十分 |
| 新しい base URL 解決ロジックのテスト | 追加しない | 解決ロジックは変更しない（D-5・挙動不変） |

## 6. 完了条件

- [x] 既存 fail path 3 件の不変性確認方針を記録（throw / null 縮退の結果不変）
- [x] 取りこぼし回帰 guard を型 + grep の二重機械検出として明示
- [x] `getApiBaseEnv` テスト削除を「対象消滅」と位置付け（Phase 7 と連携）
- [x] transport 選択の回帰 guard を明示
- [x] 新規テスト非追加の判断根拠を記録（YAGNI）

## 7. 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 環境変数アクセス不変条件 | `CLAUDE.md`「apps/web env アクセス不変条件（task-02 wrangler-env-injection）」 | `getEnv()` は zod parse 失敗時 throw。本 Phase の env.spec fail path 不変性の根拠 |
| 検証 suite | `outputs/phase-4/phase-4.md` §3 | grep gate G-1/G-2 と vitest V-1〜V-11 を回帰 guard として継続実行 |
| 取りこぼしリスク対策 | `outputs/phase-3/phase-3.md` §3 | public.ts 取りこぼしを Step 1 先行 typecheck で機械検出 |
