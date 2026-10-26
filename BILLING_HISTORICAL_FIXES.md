# Dairy backend billing and historical data fixes

This patch is based on the uploaded `dairyFarmProject.zip`.

## Changes included

- `GET /api/milk-delivery?date=YYYY-MM-DD` now filters to the farm-local calendar day. Optional `customerId` filtering is also supported.
- Customer delivery quantities and default morning/evening quantities now accept 0 through 10 litres in 0.25-litre increments.
- Customer update API accepts `ratePerLiter`. Rate edits affect new deliveries only; existing delivery records keep their saved rate so prior months are not silently repriced.
- Creating, updating, moving, or deleting a delivery recalculates a matching existing monthly bill. It does not automatically create a bill; explicit bill generation remains the user's action.
- Existing payment records are summed again after a delivery correction. If recorded payments exceed the corrected bill, the difference is stored as `creditAmount`; payment history is not deleted and pending is never negative.
- Monthly bill summary includes customers with deliveries even when no bill has been generated. It returns `billGenerated`, `estimatedAmount`, `totalUnbilledAmount`, and `totalCredit` so the frontend can display preview versus saved bill.
- Financial report includes estimated amounts for customers who have deliveries but have not generated a bill yet.
- Fixed the monthly production report's next-month boundary to use the timezone-aware helper.

## Important behavior

- A customer's rate is copied onto each new delivery. Changing the customer's current rate does not rewrite old delivery rates.
- Bill generation remains an explicit action. Editing a delivery automatically updates a bill only if that customer's bill for the affected month already exists.
- `creditAmount` is an additional field on monthly bill documents. Existing documents get the schema default when read; no destructive migration is included.

## Verification

Dependency installation timed out in this environment, so a full NestJS production build could not be run here. Before deployment, run:

```bash
npm ci
npm run build
npm test
```

Then test date filtering, a 10 L delivery, bill generation, editing a past delivery after bill generation, deleting a past delivery, and a delivery correction that makes recorded payments exceed the revised bill total.
