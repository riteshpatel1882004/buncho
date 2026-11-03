Use **versioned model artifacts** and a controlled rollout:

| Strategy | What it does |
|---|---|
| **Blue-green** | Run old (blue) and new (green) side by side, switch traffic at once, switch back if needed |
| **Canary** | Send a small share of traffic (for example 5%) to the new model, then increase |
| **Shadow testing** | New model receives a copy of live traffic, but its answers are not returned |
| **Health checks** | Route traffic only to instances that pass readiness checks |
| **Rollback** | Keep the previous version deployable and one command away |

Never overwrite the live model file in place. Compare quality, latency and errors between versions before moving 100% of traffic.
