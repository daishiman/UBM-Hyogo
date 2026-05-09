# Phase 6: redact.ts 実装（dual-hash）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | spec-confirmed |
| 対象 | `apps/api/src/audit-correlation/redact.ts` / `apps/api/src/audit-correlation/types.ts` |
| 実装区分 | 実装仕様書（pure function 拡張） |

## 目的

`AUDIT_CORRELATION_SALT_PREVIOUS` 環境変数の存在検知をきっかけに、redact.ts 内の fingerprint 計算を dual-hash モードに切替える。rotation 期間中は v1（旧 salt）と v2（新 salt）の双方を返却し、rotation 終了後は v2 のみを返却する。`fingerprintVersion` は新形式 canonical として常に `2` に固定する（v1 は merge 用補助）。pure function 維持（外部 I/O 禁止）を不変条件とする。

## 変更対象ファイル

| パス | 変更種別 |
| --- | --- |
| `apps/api/src/audit-correlation/redact.ts` | 既存編集 |
| `apps/api/src/audit-correlation/types.ts` | 既存編集 |

## 型シグネチャ拡張（types.ts）

```ts
// 既存 NormalizedAuditEvent bridge shape に dual-hash フィールドを追加する。
export interface NormalizedAuditEvent bridge shape {
  // 既存フィールドは維持
  fingerprintVersion: 2; // rotation 完了済みかに関わらず常に 2 (v2 を canonical とする)
  fingerprintHashes: {
    /** rotation 期間中のみ存在。旧 salt で計算した hash。group merge 用補助 */
    v1?: string;
    /** 常に存在。新 salt で計算した hash。canonical */
    v2: string;
  };
}

export interface RedactEnv {
  AUDIT_CORRELATION_SALT: string;
  /** 設定されている期間が rotation 期間。undefined なら通常運用 */
  AUDIT_CORRELATION_SALT_PREVIOUS?: string;
}
```

## 関数シグネチャ（redact.ts）

```ts
/**
 * canonical 入力（email|... 形式）と env から NormalizedAuditEvent bridge shape を生成する pure function。
 * AUDIT_CORRELATION_SALT_PREVIOUS が定義されている場合のみ dual-hash を返却する。
 */
export function computeFingerprint(
  canonical: string,
  env: RedactEnv,
): NormalizedAuditEvent bridge shape;
```

入出力:

| 入力 | 値域 |
| --- | --- |
| `canonical` | redact 後の正規化済み文字列（email-based。空文字は呼び出し側で除外済みの前提） |
| `env.AUDIT_CORRELATION_SALT` | 必須。空文字 / undefined はエラー（throw） |
| `env.AUDIT_CORRELATION_SALT_PREVIOUS` | 任意。文字列なら dual-hash mode、`undefined` なら single-hash mode |

| 出力 | 内容 |
| --- | --- |
| single-hash | `{ fingerprintVersion: 2, fingerprintHashes: { v2 } }` |
| dual-hash | `{ fingerprintVersion: 2, fingerprintHashes: { v1, v2 } }` |

副作用: なし（pure）。`crypto.subtle.digest` のみを利用し、外部 I/O は呼び出さない。

## hash 計算仕様

```ts
// 擬似コード
async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// dual-hash 時
const v2 = await sha256Hex(`${env.AUDIT_CORRELATION_SALT}|${canonical}`);
const v1 = env.AUDIT_CORRELATION_SALT_PREVIOUS
  ? await sha256Hex(`${env.AUDIT_CORRELATION_SALT_PREVIOUS}|${canonical}`)
  : undefined;
```

> separator は `|`（既存実装と整合）。canonical 内に `|` が混入しない正規化は呼び出し側で済ませる前提（既存仕様）。

## 異常系

| 条件 | 挙動 |
| --- | --- |
| `env.AUDIT_CORRELATION_SALT` が空 / undefined | `throw new Error('AUDIT_CORRELATION_SALT is required')` |
| `env.AUDIT_CORRELATION_SALT_PREVIOUS` が空文字 | `undefined` と同じ扱い（dual-hash mode に入らない）。空文字運用は禁止である旨をコメントで明記 |
| `canonical` が空文字 | 呼び出し側で除外済みの前提。万一渡った場合も hash を計算する（仕様変更しない） |

## テスト方針（Phase 10 と連携）

- single-hash: `AUDIT_CORRELATION_SALT_PREVIOUS=undefined` で `fingerprintHashes.v1` が `undefined`。
- dual-hash: 旧 salt と新 salt で `v1 !== v2` かつ両方とも 64 文字 hex。
- `AUDIT_CORRELATION_SALT` 欠落時 throw 検証。
- 同一入力 + 同一 salt で決定論的に同じ hash になること。
- pure 性: 連続 100 回呼び出しでメモリ / 外部 I/O 副作用が発生しないこと（mock 不要）。

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run audit-correlation/redact \
  | tee outputs/phase-6/redact-test.log
```

## 完了条件（DoD）

- [ ] `RedactEnv` / `NormalizedAuditEvent bridge shape` 型拡張シグネチャ確定。
- [ ] dual-hash / single-hash の出力 shape 確定。
- [ ] `AUDIT_CORRELATION_SALT` 欠落時 throw 仕様確定。
- [ ] hash 計算 separator が既存実装と整合。
- [ ] pure function（外部 I/O 禁止）不変条件が明記。
- [ ] vitest 観点が列挙されている。

## 次 Phase 連携

- Phase 7（correlate.ts）は本 Phase の `fingerprintHashes.v1` / `v2` を入力として group merge する。
- Phase 8（rotate-salt.sh）は本 Phase の env 検出仕様（`AUDIT_CORRELATION_SALT_PREVIOUS` 削除で rotation 終了）と整合する。
