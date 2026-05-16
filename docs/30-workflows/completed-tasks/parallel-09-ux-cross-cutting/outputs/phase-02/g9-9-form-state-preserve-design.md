# G9-9 Form State Preserve Design

mutation 失敗時、hook は form state に触れない。`onError` callback を呼ぶだけにし、`form.reset()` や field error 設定は caller responsibility とする。G9-1 の field error helper と toast を併用する。

Acceptance: AC-9 spec_created.

