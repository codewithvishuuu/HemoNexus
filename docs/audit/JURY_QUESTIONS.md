# HemoNexus — difficult jury questions and evidence-based answers

These answers are deliberately conservative. Where evidence is unavailable, the answer says so.

---

1. **What exactly is your AI, and is it machine learning?**
   The forecasting core is statistical, not ML: seasonal naive, 4-week moving average and a hand-written additive Holt-Winters model (`src/lib/analytics.ts:16-47`). Risk scoring is a fixed-weight transparent heuristic (`analytics.ts:139-163`). The assistant is a deterministic regex-to-template responder, not an LLM. We do not claim deep learning.

2. **What accuracy did you achieve?**
   On synthetic East/O−/RBC data: MAE 5.19 units/week, WAPE 0.25, MASE 0.83, bias 1.44 across 4 rolling-origin folds. These are real computed values, but they are from simulated data and one series only. We do not claim clinical accuracy.

3. **Your interval coverage is 0.50. Why call it an 80% interval?**
   We should not. The interval uses `1.28 × 1.4 × std(first differences)`, which is not calibrated; empirical coverage is 0.50. The UI discloses this. A proper fix is to calibrate intervals on held-out backtest residuals. This is a known limitation.

4. **Are your event-detection metrics circular?**
   Partly. Seeded event indices are hardcoded in `domain.ts:89-93`, and the detection threshold is tuned at `analytics.ts:116`. The metrics prove the pipeline responds to planted events, not that it generalises. We acknowledge this.

5. **Is any of your data real?**
   No. All institutions, units, consumption and donations are synthetic, generated with seed 42. Every screen is labelled SIMULATED DATA. There is no real hospital connection and no patient or donor data.

6. **How would a real hospital onboard?**
   The architecture documents a governance/onboarding path (data dictionary, verification, authorized feed, provenance, DPDP review), but no onboarding workflow is implemented in the application. This is future work, not a delivered feature.

7. **How is blood compatibility decided?**
   By a versioned ABO/Rh rule table in `domain.ts:4-7`, used only as a filter. The UI states that clinical suitability requires a qualified human reviewer. We do not claim the table is a clinical protocol; before real use it must be replaced by an institution-approved protocol.

8. **Can a quarantined unit be transferred?**
   No. `eligible()` (`domain.ts:22-24`) excludes quarantined, excursion-affected, unverified, expired and reserved units, and matching uses that filter. This was tested. However, expired reservations currently leave the `reserved` flag set, which is a known defect (F-06).

9. **Can two institutions reserve the same unit?**
   The application checks for active reservations inside a transaction, and our concurrent probe produced one 201 and one 409 on the local SQLite database. There is no unique database constraint on active reservations, so under PostgreSQL concurrency we cannot guarantee this. A migration with a partial unique index is proposed, not applied.

10. **Can a non-clinical user approve a transfer?**
    Clinical sign-off is correctly restricted to the `CLINICAL_REVIEWER` role. However, we found that institutional checkpoints were not role-bound, so an analyst could sign them. This is F-01 and is being fixed before the final demo.

11. **Does the assistant leak other institutions' data?**
    The audit reproduced a leak: a hospital manager asking about risk received the network-wide top risk because `assistant/route.ts:23` does not apply the institution scope used by the scores API. This is F-02 and is being fixed.

12. **What happens if a prediction is wrong?**
    The score is decision support. Alerts are advisory, transfers require human approval, and audit records capture what was shown and who acted. There is no automated clinical action. We do not have a formal incident-review workflow implemented.

13. **How do you handle stale or conflicting inventory?**
    `DataTrustRecord` stores verification state, missing fields, conflicts, stale flags and completeness. `computeScore` (`domain.ts:52-55`) returns `DATA_QUALITY_BLOCK` for rejected/stale/conflicting sources. Freshness is distinct from forecast confidence. The per-dimension UI is limited, so this is partially implemented.

14. **Is this secure enough for a hospital?**
    No. We have httpOnly cookies, bcrypt, RBAC, institution scoping on most APIs and security headers, but we found a P0 approval RBAC flaw, an assistant scope leak, a hardcoded fallback JWT secret, no rate limiting and no explicit CSRF token. It is acceptable for a controlled hackathon demo after fixes, not for hospital deployment.

15. **How does this differ from e-RaktKosh or a blood bank register?**
    e-RaktKosh is a system of record for availability. HemoNexus is proposed as a decision layer on top: forecasting, explainable risk, cold-chain-aware matching, simulation and audit. There is no integration with e-RaktKosh today; we do not claim one.

16. **What are your deployment and infrastructure costs?**
    The demo runs on Vercel with a free-tier Neon Postgres; no additional paid infrastructure was added. A real deployment would need paid database capacity, monitoring, backup/DR and security review. We have not costed a real pilot.

17. **Can this scale to 1,000 hospitals?**
    Not as currently written. Matching performs N+1 queries, inventory endpoints cap at 500 rows, there is no pagination or caching, and no load test was run. The architecture could be extended with indexes, pagination, queueing and connection pooling, but that is untested.

18. **What is the single strongest evidence this works?**
    A seeded O− shortage in the synthetic East region is detected 21 days before the planted onset by the rolling signal, with a stored factor breakdown, and a feasible surplus candidate is surfaced; the transfer then requires two institutional approvals and a clinical sign-off and is recorded in the audit log. That is a complete, reproducible demonstration of the intended workflow — on synthetic data only.

19. **What should we not believe from your dashboard?**
    Do not interpret “80% interval” as calibrated (measured coverage 0.50), do not interpret lead time as real-world predictive skill (hardcoded event windows), and do not interpret any institution as real (all are fictional).

20. **Are you clinically validated?**
    No. HemoNexus is a decision-support prototype. It makes no transfusion decisions and has no clinical validation, regulatory approval or real patient data.
