# G9-8 Mutation Guard Design

`useAdminMutation` は既存 caller 互換を優先し、同一 hook instance の ongoing mutation 中のみ 2nd call を拒否する。拒否時は warning toast を出し `undefined` を返す。error 後の再 submit は阻害しない。

Acceptance: AC-8 spec_created.

