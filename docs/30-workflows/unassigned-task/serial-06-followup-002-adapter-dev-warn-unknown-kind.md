# serial-06 followup-002 — adapter dev-mode unknown kind 観測 helper

## メタ情報

```yaml
issue_number: TBD
```

| 項目         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| タスクID     | serial-06-followup-002-adapter-dev-warn-unknown-kind                                  |
| タスク名     | adapter `toMemberDetailProps` の unknown kind 観測（dev 環境のみ）                    |
| 分類         | 改善（DX / 観測性）                                                                   |
| 対象機能     | `apps/web/src/lib/adapters/member-detail.ts`                                          |
| 優先度       | 低                                                                                    |
| 見積もり規模 | 小規模                                                                                |
| ステータス   | 未実施                                                                                |
| 発見元       | serial-06 Phase 9 §3「unknown field 出現時 fallback」の deferred 判断                |
| 発見日       | 2026-05-23                                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

serial-06 で `toMemberDetailProps` adapter は unknown kind を **silent skip** で処理する設計を採用した（`FieldKindZ.safeParse` 失敗時に `null` を返す）。理由は production console を汚さないため。

ただし Phase 9 §3 は「development では `console.warn` を出す方針も検討可」と保留している。Google Form の項目（`kind`）は将来追加される可能性があり、development で気づけない unknown kind は spec 反映漏れの早期発見機会を逸する。

### 1.2 問題点・課題

- production silent skip により、新しい `kind` が API 経由で来ても UI 開発者が気づけない
- adapter unit spec のケース 5 で挙動はテスト化されているが、現実の Google Form schema 変化を検知する dev loop は無い
- 環境分岐を入れると adapter の pure 性が壊れる懸念（Phase 9 で silent 統一を選んだ理由）

### 1.3 放置した場合の影響

- Google Form の field kind 追加に対する反応が遅延し、UI 反映漏れが production 後発見になる
- adapter unit spec の 8 ケース体制が新 kind に追従しないまま固定化する

---

## 2. 何を達成するか（What）

### 2.1 目的

adapter の pure 性を保ったまま、dev 環境で unknown kind を観測する hook を提供する。

### 2.2 最終ゴール

- `toMemberDetailProps` は引き続き pure（環境分岐を関数内に書かない）
- 観測は呼び出し側（page.tsx / Storybook fixture）または adapter の薄い wrapper で行う
- production bundle に dev-only コードが残らない（`process.env.NODE_ENV` の dead-code elimination 経路）

### 2.3 スコープ

#### 含むもの

- adapter API に optional `onUnknownKind?: (field) => void` callback を追加（pure 維持）
- page.tsx で `process.env.NODE_ENV !== "production"` 時のみ callback を渡す
- adapter spec に callback 呼び出しケース 1 件を追加（既存 8 ケース → 9 ケース）

#### 含まないもの

- production への logger 出力追加
- Sentry / Workers Analytics 連携
- API 側 schema 追加（`PublicMemberProfileZ` の変更）

### 2.4 成果物

- `apps/web/src/lib/adapters/member-detail.ts` の callback 拡張
- adapter spec への新規ケース 1 件
- page.tsx での callback 注入差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- serial-06 merge 済み
- adapter spec 8 ケースが green

### 3.2 依存タスク

- serial-06-form-response-binding（merge 必須）

### 3.3 必要な知識

- Next.js Server Component の `process.env.NODE_ENV` 評価タイミング（build time）
- Pure function 設計（副作用は引数として明示）
- Vitest mock callback パターン

### 3.4 推奨アプローチ

副作用は callback として外から注入する。adapter 内で環境分岐しない。Server Component の `process.env.NODE_ENV` は OpenNext Workers build で正しく dead-code elimination されることを `next build --webpack` で確認する。

```ts
// adapter
type Options = { onUnknownKind?: (field: RawField) => void };
export function toMemberDetailProps(
  profile: PublicMemberProfile,
  options: Options = {},
): MemberDetailProps { /* ... */ }

// page.tsx
const props = toMemberDetailProps(profile, {
  onUnknownKind:
    process.env.NODE_ENV !== "production"
      ? (f) => console.warn("[member-detail] unknown kind", f.kind, f.stableKey)
      : undefined,
});
```

---

## 4. 実行手順

### Phase構成

1. adapter シグネチャ拡張（後方互換）
2. spec ケース追加
3. page.tsx 注入
4. production bundle DCE 確認

### Phase 1〜4 実施後の verify

- `pnpm --filter @ubm-hyogo/web build` 後の output bundle を `grep "unknown kind"` で 0 件確認
- adapter spec 9 ケース pass

---

## 5. 苦戦箇所メモ

- **adapter pure 性の維持と観測性の両立**: 環境分岐を関数内に書くと test の network of cases が爆発する。callback 注入が最も clean。当時の Phase 9 では callback 形を採らず silent 統一にしたが、後付け拡張なら callback で互換性を壊さず追加できる。
- **OpenNext Workers の DCE 信頼度**: `process.env.NODE_ENV !== "production"` の DCE は webpack mode で安定しているが、Turbopack 経路では確実性が落ちる。`next build --webpack`（CLAUDE.md 不変条件）で production build を回す前提なら問題ない。

---

## 6. 完了条件

- [ ] adapter シグネチャ後方互換拡張
- [ ] spec 9 ケース全 green
- [ ] production bundle に dev warn 文字列が残らない
- [ ] page.tsx 注入完了
