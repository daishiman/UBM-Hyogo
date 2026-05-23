# SOP Walkthrough

1. Disable shell history before any secret source is read.
2. Validate that the 1Password item parses as JSON without printing the value.
3. Compute a 16 character fingerprint for operator records.
4. Put staging first through `scripts/cf-rotate-sa-key.sh`.
5. Run `verify --env staging`; this is the only local unlock for production.
6. Run UT-26 staging smoke outside this helper.
7. Put production only after staging verification.
8. Keep the old key through the 24-48 hour grace period, then disable and hold
   for 7 days before delete.
