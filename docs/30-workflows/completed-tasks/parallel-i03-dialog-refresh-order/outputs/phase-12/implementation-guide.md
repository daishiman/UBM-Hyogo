# Implementation Guide

## Part 1: 中学生レベル

### なぜ必要か

確認画面で「送信できた」とき、画面の情報を新しくしてから確認画面を閉じたい。先に閉じてしまうと、閉じたあとで画面を新しくしようとして、タイミングがずれることがある。

たとえば、図書館で貸出カードを書き直してから本棚を片付けるようなもの。先に本棚を片付けて係の人がいなくなると、貸出カードを直すタイミングがあいまいになる。

### 何をするか

送信が成功したら、次の順で動かす。

1. 画面を新しくする合図を出す。
2. 親画面へ「送れた」と知らせる。
3. 確認画面を閉じる。

### 専門用語セルフチェック

| 用語 | 日常語の言い換え |
| --- | --- |
| dialog | 小さな確認画面 |
| router.refresh | 画面を新しくする合図 |
| onSubmitted | 親画面へ「送れた」と知らせる合図 |
| onClose | 小さな確認画面を閉じる合図 |
| mutation | データを変える送信 |
| component | 画面の部品 |

## Part 2: 技術者レベル

### TypeScript interface

```ts
export interface VisibilityRequestDialogProps {
  readonly desiredState: VisibilityDesiredState;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmitted: (accepted: QueueAccepted) => void;
}

export interface DeleteRequestDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmitted: (accepted: QueueAccepted) => void;
}
```

### API signature

- `requestVisibilityChange(input): Promise<{ ok: true; accepted: QueueAccepted } | { ok: false; code: RequestErrorCode }>`
- `requestDelete(input): Promise<{ ok: true; accepted: QueueAccepted } | { ok: false; code: RequestErrorCode }>`

### Implementation pattern

```ts
const router = useRouter();

if (res.ok) {
  router.refresh();
  onSubmitted(res.accepted);
  onClose();
}
```

`RequestActionPanel` does not call `router.refresh()` in `onSubmitted`.

### Edge cases

| Case | Behavior |
| --- | --- |
| success | `refresh -> onSubmitted -> onClose` |
| duplicate pending | `refresh -> onSubmitted`; dialog remains open with duplicate-pending error |
| invalid request | error state only |
| auth/server/network error | existing error mapping unchanged |

### Constants / settings

| Item | Value |
| --- | --- |
| `REASON_MAX_LENGTH` | unchanged |
| `visualEvidence` | `NON_VISUAL` |
| PR base | `dev` |
