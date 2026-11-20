# Vibe Coding Log 01: Payout order

## ASK

Prompt: “Context: this React app loads members in join order from json-server.
Add a numbered payout list to group details, label the first ‘Next payout,’
preserve order after adds or removals, and show an empty state. Use a pure
helper and Node tests. Handle missing names; do not change the API or
contribution rules.”

## READ and EXPLAIN

`getPayoutOrder` rejects non-arrays, maps server order to one-based positions,
trims names, and supplies fallbacks. `PayoutOrder` gets the selected group with
`useGroups` and renders the list without group props.

## TEST

Tests cover order, empty members, and odd input (null rows, blank names,
non-array). All eight tests and the build passed. Browser checks confirmed the
list updates after member changes.

## CHANGE and reflection

I made payout order visible without changing stored data. I nearly sorted names,
then caught that this changes join order; I kept server order. I learned that
display-only work still needs missing-data rules, and I can explain the helper
and tests.
