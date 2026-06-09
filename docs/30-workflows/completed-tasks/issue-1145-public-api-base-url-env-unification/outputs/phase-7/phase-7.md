# Phase 7: カバレッジ確認 — 変更範囲限定

> **[実装区分: 実装仕様書]** NON_VISUAL

## 1. メタ情報

| 項目 | 内容 |
| ---- | ---- |
| Phase | 7（カバレッジ確認） |
| 入力 | Phase 5（実装手順 / 変更ファイル）/ Phase 6（fail path / 回帰 guard） |
| 出力 | 本 `phase-7.md`（変更範囲限定のカバレッジ確認方針） |
| 実装区分 | NON_VISUAL |

## 2. カバレッジ確認のスコープ（FB-BEFORE-QUIT-002）

**本 Phase のカバレッジ確認は、本タスクで変更した関数 / ブロックのみを対象とする。変更していない関数・ファイル・全体カバレッジ率は対象外とする。**

理由: 本タスクは同義 env キーの削除 / rename リファクタリングであり、新しい振る舞いを導入しない。全体 coverage 率の増減を評価対象にすると、本タスクと無関係な箇所の揺れ（並行タスクの追加コード等）を拾ってしまうため、対象を変更範囲に限定する。

### 2.1 カバレッジ対象（変更したブロックのみ）

| ファイル | 変更したブロック | カバレッジ確認観点 |
| -------- | --------------- | ------------------ |
| `apps/web/src/lib/env.ts` | `getPublicFetchEnv()` の `nextPublicBaseUrl` 単一解決ブロック（旧キー解決削除後） | `NEXT_PUBLIC_API_BASE_URL` の解決（process.env 優先 / cloudflareEnv / undefined）3 分岐が `env.spec.ts` で踏まれる |
| `apps/web/src/lib/fetch/public.ts` | `getBaseUrl()` L24（単一参照化）/ `getServiceBinding()` L48（単一参照化） | base URL 解決と service-binding disable 判定の分岐が `public.spec.ts` で踏まれる（service-binding 優先 / HTTP fallback の両経路） |
| `apps/og/src/member-source.ts` | `fetchViaBaseUrl()` L66（rename 後の `NEXT_PUBLIC_API_BASE_URL` 参照） | base URL 設定時 / 未設定時（null 縮退）の両分岐が `member-source.spec.ts` で踏まれる |

### 2.2 カバレッジ対象外（明示除外）

- **削除した関数 `getApiBaseEnv()` と型 `ApiBaseEnv`**: 母数から消滅するため coverage 評価対象外。「テストが減った → カバレッジ低下」と誤検知しないこと（Phase 6 §4-2）。関数ごと消えたので分母も分子も同時に減る。
- **env.ts の他 accessor**（`getEnv` / `getPublicEnv` / `getAuthEnv` / `getAdminFetchEnv` 等）: 本タスクで変更していないため対象外。
- **public.ts の `doFetch` / `fetchPublic` / `fetchPublicOrNotFound`**: 本体ロジック未変更（コメントと L24/L48 の参照のみ変更）のため対象外。
- **wrangler.toml / .dev.vars.example / playwright config**: 実行コードでなく設定ファイルのため coverage 対象外（grep gate G-1 で監査）。
- **全体 coverage 率 / 他ファイル**: 本タスク変更範囲外。

## 3. カバレッジ確認手順

変更範囲の coverage は、Phase 4 V-1 / V-2 / V-10（変更したブロックを含む spec）の targeted run で踏破を確認する。全件 coverage run（メモリ制約 = Phase 1 §6）は行わず、対象 spec の green = 変更ブロック踏破とみなす。

```bash
# 変更ブロックを含む 3 spec を targeted 実行（緑 = 変更分岐踏破）
pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/__tests__/env.spec.ts
pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/fetch/public.spec.ts
pnpm --filter @ubm-hyogo/og test -- apps/og/src/__tests__/member-source.spec.ts
```

### 3.1 各変更ブロックの踏破マトリクス

| 変更ブロック | 踏破する分岐 | 担保する spec / ケース |
| ------------ | ------------ | ---------------------- |
| `getPublicFetchEnv()` nextPublicBaseUrl 解決 | process.env 経路 / cloudflareEnv 経路 / undefined（キー不在） | `env.spec.ts`（seed 有無のケース） |
| `getBaseUrl()` | base URL 解決成功 / local fallback / 非 local throw | `public.spec.ts`（解決成功 + throw fail path） |
| `getServiceBinding()` disableBinding 判定 | test 環境 + base URL 明示で disable / production で binding 優先 | `public.spec.ts`（transport 選択 2 経路） |
| `fetchViaBaseUrl()`（og） | base URL 設定 fetch / 未設定 null 縮退 | `member-source.spec.ts`（fallback ケース + null ケース） |

## 4. カバレッジが落ちないことの根拠

- 変更ブロックの分岐は、旧キー削除前と同じ条件分岐構造（process.env 優先 / cloudflareEnv / undefined）を維持しており、対応する spec ケースも移行後に残る（Phase 5 §5）。
- 唯一テストが削除されるのは `getApiBaseEnv()` の 2 件だが、これは**関数本体の削除に伴う**ものであり、残存コードの未踏破を生まない（§2.2）。
- したがって変更範囲限定の coverage は移行前後で不変（踏破ブロック数 = テストケース数とも整合）。

## 5. 完了条件

- [x] カバレッジ対象を変更した関数 / ブロックのみに限定（FB-BEFORE-QUIT-002 明記）
- [x] 変更ブロック 3 ファイル分の踏破観点を列挙
- [x] 対象外（削除関数 / 未変更 accessor / 設定ファイル / 全体率）を明示除外
- [x] 削除関数のカバレッジ低下誤検知を防止する注記（Phase 6 連携）
- [x] 変更範囲 coverage が不変である根拠を記録

## 6. 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 環境変数アクセス不変条件 | `CLAUDE.md`「apps/web env アクセス不変条件（task-02 wrangler-env-injection）」 | env 参照は accessor 経由のみ。変更ブロックは `getPublicFetchEnv` accessor 内に閉じる |
| 変更ブロック詳細 | `outputs/phase-5/phase-5.md` Step 1-3 | env.ts / public.ts / member-source.ts の変更前後 |
| targeted test リスト | `outputs/phase-1/phase-1.md` §6 | 全件 coverage run を避け対象 spec の green で踏破確認 |
| 削除関数の母数除外 | `outputs/phase-6/phase-6.md` §4-2 | `getApiBaseEnv` テスト削除は対象消滅でカバレッジ低下ではない |
