# Phase 12 / Task 12-1: 実装ガイド（dismiss optimistic update）

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `visualEvidence: VISUAL_ON_EXECUTION`

> 本ガイドは dismiss 経路の optimistic 挙動を、実装済みの粒度で記録する。識別子は Phase 1 設計および既存コード（`IdentityConflictRow.tsx` の `optimisticMerged` / `onMerge` / `dismissReason` / `setStage` / `dismissMutation`）から引用し、対称命名で `optimisticDismissed` を導入した。

---

## Part 1 — 概念説明（中学生レベル・専門用語なし）

### なぜ必要か（身近な例え）

教室で「出席カード」を箱に入れる場面を想像してください。カードを箱に入れた瞬間、あなたの机の上からカードがなくなり、「もう出した」という気持ちになります。本当は先生が箱の中身を後で数えて記録するのですが、あなたを待たせないために、カードは入れた瞬間に机から消えてくれます。

もし先生が「ごめん、そのカードは別の箱だったよ」と気づいたら、そのときだけカードがあなたの机に戻ってきます。戻ってきたとき、あなたが書いておいた「ひとことメモ」は消えずにそのまま残っていてほしいですよね。

`/admin/identity-conflicts`（同じ人かもしれない会員のペアを管理者が確認する画面）でも、同じ気配りをしたいのが今回の話です。

### 何をするか

この画面には「この2人は同じ人です（統合 / merge）」のボタンと、「この2人は別の人です（別人マーク / dismiss）」のボタンがあります。

前回（Issue #988）の作業で、**統合ボタン**のほうは「押した瞬間に行が消える」ようにしました。でも**別人マークボタン**のほうは、まだ昔のまま「裏のコンピューターが返事をするまで行が残る」状態でした。片方だけ反応が速くて、もう片方が遅いのは、ちぐはぐで気持ちが悪いです。

そこで、別人マークボタンも統合ボタンと同じように直します。

1. 別人マークの確認（「別人として確定」）を押した**その瞬間に**、その行を一覧からスッと消す。
2. 裏側に「別人マークしてね」とお願いを出す。
3. 無事に成功したら、消えたまま（そのままで OK）。
4. もし裏側で失敗したら、消した行を**元に戻して**、「失敗しました」という赤い文字を表示する。**そのとき、管理者が入力していた「別人と判断した理由」のメモは消さずに残しておく**（書き直さなくて済むように）。

### 今回作ったもの（できるようになること）

- 別人マークも統合と同じく、押した瞬間に反応が返るので「押せた」という安心感がある。
- 失敗したときだけ元に戻すので、間違って消えっぱなしになることはない。失敗時に理由メモも残るので入力し直さなくてよい。
- 統合の「消える仕組み」と別人マークの「消える仕組み」は**別々の箱**で管理する。だから、片方をやり直しても、もう片方の表示には影響しない。

---

## Part 2 — 技術詳細（開発者向け）

### 全体方針

- dismiss optimistic state は **コンポーネントローカル**（`IdentityConflictRow` の `useState`）に持つ。`useAdminMutation` hook は不変（後方互換リスク回避）。
- merge 側 state（`optimisticMerged`）と dismiss 側 state（`optimisticDismissed`）は **共有しない**。責務（rollback の独立性）を明確にするため独立 boolean として持ち、合流は render guard でのみ行う（#988 苦戦箇所の知見）。
- 各 row が独立した component instance のため、cross-row rollback race は構造的に発生しない。
- `page.tsx` は Server Component のまま。dismiss endpoint / payload / D1 schema は不変。

### state 定義（追加するもの）

`IdentityConflictRow.tsx` 冒頭の既存 `useState` 群（`stage` / `mergeReason` / `dismissReason` / 既存 `optimisticMerged`）に、独立した boolean を 1 つ追加する。

```tsx
// dismiss を楽観的に消したかどうかを表す boolean（merge 側 optimisticMerged と分離）。
type OptimisticDismissed = boolean;
const [optimisticDismissed, setOptimisticDismissed] = useState<OptimisticDismissed>(false);
```

- 命名は既存規則（camelCase）を踏襲し、merge 側 `optimisticMerged` と対称命名にする。
- `stage` union（`"idle" | "merge-confirm" | "merge-final" | "dismiss"`）には**混ぜない**。`stage` は dialog 表示制御、`optimisticDismissed` は row 可視性制御という責務分離を保つ。
- `optimisticMerged` とは別変数とし、`||` で共有しない（render guard でのみ合流）。

### APIシグネチャ

本タスクは新規 API を追加しない。利用する既存 surface のシグネチャは以下のとおり（不変）。

```tsx
// useAdminMutation の戻り値（既存・変更なし）
type UseAdminMutationReturn<T> = {
  trigger: (payload: unknown, endpointOverride?: string) => Promise<T>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
  abort: () => void;
};

// 本タスクで差し替えるハンドラのシグネチャ
const onDismiss: () => void;
```

| surface | シグネチャ | 変更 |
| --- | --- | --- |
| endpoint | `POST /api/admin/identity-conflicts/:conflictId/dismiss` | 不変 |
| trigger payload | `{ reason: string }`（既存 dismiss payload） | 不変 |
| `onDismiss` | `() => void`（副作用: state 更新 + `dismissMutation.trigger` 発火） | 新規差し替え |

### dismiss ハンドラ（確定コード）

既存 `onDismiss`（現在は trigger のみで row を残す）を、以下へ差し替える。merge 側 `onMerge` の対称形。

```tsx
const onDismiss = () => {
  setOptimisticDismissed(true);
  void dismissMutation
    .trigger({ reason: dismissReason.trim() })
    .catch(() => {
      setOptimisticDismissed(false); // rollback: row 復元。dismissReason は clear しない（保持）
    });
};
```

| 行 | 役割 |
| --- | --- |
| `setOptimisticDismissed(true)` | trigger より**前**に呼び、押下直後に row を消す（楽観的反映） |
| `dismissMutation.trigger({ reason: ... })` | 既存 dismiss payload のまま。API contract 不変 |
| `.catch(() => setOptimisticDismissed(false))` | server エラー時のみ rollback（row 復元）。`dismissReason` は **clear しない**（保持） |

### render 分岐（row の非表示・merge との合流）

既存の merge 用ガード節 `if (optimisticMerged) return null;` を、以下へ**統合**する。state は分離したまま、可視性判定だけを合流させる。

```tsx
if (optimisticMerged || optimisticDismissed) return null;
```

- `optimisticDismissed === true` の間、この row の視覚的内容は DOM から外れる（collapsed）。ただし `role="status"` の sr-only node を残し、focus を移譲して「候補を一覧から非表示にした」ことを支援技術へ通知する。
- success 後も `true` を維持するため、消えたままになる。server list との最終整合は既存 success フロー（`router.refresh()` / `onSuccess`）が担う。
- `optimisticMerged` と `optimisticDismissed` は別 state のため、merge の rollback が dismiss の可視性に波及しない（その逆も同様）。

### 使用例

`IdentityConflictRow` 内での dismiss optimistic state と dismiss ハンドラの組み合わせ例（実装イメージ）。

```tsx
function IdentityConflictRow({ item }: { item: Row }) {
  const [optimisticMerged, setOptimisticMerged] = useState<boolean>(false);
  const [optimisticDismissed, setOptimisticDismissed] = useState<boolean>(false);

  const dismissMutation = useAdminMutation<DismissIdentityResponse>(
    `/api/admin/identity-conflicts/${encodeURIComponent(item.conflictId)}/dismiss`,
    "POST",
    { successMessage: "✓ 別人として確定しました", onSuccess: () => { setStage("idle"); setDismissReason(""); } },
  );

  const onDismiss = () => {
    setOptimisticDismissed(true);
    void dismissMutation
      .trigger({ reason: dismissReason.trim() })
      .catch(() => setOptimisticDismissed(false)); // dismissReason は保持
  };

  if (optimisticMerged || optimisticDismissed) return null; // 楽観的に row を非表示（統合 guard）
  // ...既存 render...
}
```

### success / error / cancel 挙動表

| イベント | `optimisticDismissed` | `dismissReason` | 既存 mutation 挙動 | 追加挙動 |
| --- | --- | --- | --- | --- |
| dismiss 実行（onDismiss） | `false → true` | 変化なし | `dismissMutation.trigger` 発火 | row を即座に非表示 |
| success（onSuccess） | `true` 維持 | `""` に clear（既存どおり） | 既存 `setStage("idle")` 維持 | `router.refresh()` を後追いで実行し server list を整合 |
| error（.catch） | `true → false` | **保持（clear しない）** | 既存 `dismissMutation.error` が設定される | row を復元し、既存 `dismissError`（`role="alert"` inline）を surface |
| cancel（dismiss dialog cancel） | 変化なし（`false` のまま） | 既存どおり | 既存 `setStage("idle")` | なし（dismiss 未発火） |
| merge（onMerge） | **不変** | 変化なし | 既存 merge フローのまま | なし（merge は `optimisticMerged` 側で独立処理） |

### エラーハンドリング（rollback）

- rollback は `.catch` のみで行い、`setOptimisticDismissed(false)` 単独で完結する。`dismissReason` は触らない（保持）。
- rollback 後、既存の inline error（`dismissError = errorMessage(dismissMutation.error)` を `role="alert"` で表示）が再び見える状態に戻るため、新規のエラー表示 markup は追加しない。
- toast 等の既存 surface も流用する（mutation hook 側の責務）。

### エッジケース

| ケース | 仕様 |
| --- | --- |
| optimistic 中（row 非表示中）の再操作 | row の操作 UI が DOM から外れ、sr-only status だけが残るため、dismiss/cancel ボタンへの再アクセスは構造的に不可能。多重 trigger は発生しない |
| trigger 中の連打 | `setOptimisticDismissed(true)` で即座に `return null` するため、同一 row 内の二重押下は次フレームで不可能 |
| cross-row への影響 | 各 row が自身の `optimisticDismissed` を持つため、ある row の rollback が別 row の可視性に波及しない |
| merge と dismiss の同時操作 | state を分離（`optimisticMerged` / `optimisticDismissed`）しているため相互干渉なし。合流は render guard の `||` のみ |
| rollback 後の理由再入力 | `dismissReason` を保持するため、管理者は入力し直さずに再実行できる |
| 支援技術への通知 | optimistic 中は sr-only `role="status"` を表示し、`tabIndex=-1` の status に focus を移譲する。error rollback は既存 `role="alert"` で通知する |

### 設定項目と定数一覧

本タスクで追加する設定値・定数・新規トークンは**なし**。`optimisticDismissed` は component-local boolean のみ。OKLch トークンの新規追加もなし（markup 追加が render guard 1 行のみで最小）。

| 項目 | 値 | 備考 |
| --- | --- | --- |
| `optimisticDismissed` 初期値 | `false` | row 可視（既定） |
| 新規定数 | なし | — |
| 新規トークン | なし | — |

### テスト構成

| レイヤ | ファイル | 追加ケース |
| --- | --- | --- |
| focused vitest | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | (1) dismiss 実行 click 直後に row が DOM から消える / (2) live status + focus handoff / (3) `dismissMutation.trigger` reject で row 復元（rollback）かつ `dismissReason` が保持される / (4) 403・409・5xx・network rollback / (5) success で row 消えたまま / (6) merge 既存ケース（hide / rollback）が非回帰で PASS |
| Playwright e2e | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | (1) dismiss 後 row が消える / (2) server error mock で row 復元 + inline error / (3) merge 不変 回帰 |

実行コマンド（実装時）: `pnpm --filter @ubm-hyogo/web test -- src/components/admin/__tests__/IdentityConflictRow.spec.tsx` / `pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-identity-conflicts.spec.ts --project=desktop-chromium --grep "dismiss.*optimistic|dismiss error"`。

### 不変条件チェック

| 不変条件 | 本タスクでの遵守 |
| --- | --- |
| #1 既存 API のみ | dismiss trigger payload・endpoint 不変 |
| #2 OKLch トークン正本 | 既存 `var(--ubm-color-*)` のみ。HEX 直書きなし |
| #9 primitive 経由 | 既存 `Button` / `Textarea` / `Badge` を流用。新規 `<input>` を増やさない |
| #10 useAdminMutation | `../../features/admin/hooks` の `useAdminMutation` を流用。legacy `@/lib/useAdminMutation` 不使用 |

---

## 視覚証跡

本タスクは VISUAL_ON_EXECUTION（dismiss 押下直後に row が画面から消える視覚変化を伴う）。Phase 11 で以下 3 枚の screenshot を `outputs/phase-11/screenshots/` に保存済み。canonical 名は Phase 1 spec / capture metadata / 本ガイドで一致させる（FB-VISUAL-CAP-001）。

| # | ファイル名 | 撮影状態 | status |
| --- | --- | --- | --- |
| 1 | `identity-conflict-row-dismiss-confirm.png` | dismiss 確認（`dismiss` stage、理由入力済み・「別人として確定」押下前） | captured |
| 2 | `identity-conflict-row-dismiss-optimistic-removed.png` | dismiss 実行直後（`optimisticDismissed === true`、該当 row が一覧から消えた状態） | captured |
| 3 | `identity-conflict-row-dismiss-rollback-error.png` | server エラー後の rollback（row 復元 + `dismissReason` 保持 + `role="alert"` inline error 表示） | captured |

> 親 #988（merge 側）は実装済みで screenshot present だが、本タスクも 3 枚とも captured。上記 canonical 名のまま capture 済み。

## 完了条件

- Part 1（中学生レベルの概念説明）/ Part 2（技術詳細）/ 視覚証跡セクションがすべて揃っていること。
- 確定コードの識別子（`optimisticDismissed` / `setOptimisticDismissed` / `onDismiss` / `dismissMutation` / `dismissReason` / `setStage`）が Phase 1 設計および既存コード規則と一致していること。
- 視覚証跡 3 枚の canonical 名と status（captured）が記載されていること。
