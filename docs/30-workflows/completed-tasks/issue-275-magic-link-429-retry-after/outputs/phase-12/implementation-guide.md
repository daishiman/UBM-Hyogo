# Implementation Guide

## Part 1: 中学生にも分かる説明

ログインリンクを何度も送ろうとすると、サーバーは「あと何秒待って」と返します。この実装では、その秒数を画面が読み取り、ボタンを押せない状態にして「45s 後に再送可能」のように表示します。

普通のエラーとは違い、429 は「失敗」ではなく「少し待てば再試行できる」という合図です。そのため `MagicLinkRateLimitedError` という専用エラーで秒数を持たせ、フォーム側はエラー画面にせず countdown だけを始めます。

## Part 2: 技術者向け

### Client contract

`sendMagicLink()` は `res.status === 429` を通常 error 分岐より先に処理する。`Retry-After` header は API の server-truth として最優先し、欠落時のみ JSON body `retryAfterSec` を読む。どちらも正の整数でない場合は default 60 秒に fallback する。

### UI contract

`MagicLinkForm` は `MagicLinkRateLimitedError` を受けた場合、`setCooldown(err.retryAfterSec)` だけを実行して早期 return する。`replaceLoginState("error")` と `router.refresh()` は呼ばない。mail は送信されていないため `sent` state にもしない。

### Scope control

`Retry-After` parser は callsite が 1 件のため共通 util 化しない。reload 永続化、BroadcastChannel、実 API E2E は scope 外。
