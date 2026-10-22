"""
predict.py
==========
Load the saved model and predict whether a startup will succeed or fail.

Usage:
    python predict.py                    ← runs the built-in examples
    python predict.py --interactive      ← type in your own startup values
"""

import sys
import joblib
import pandas as pd

MODEL_PATH = "startup_model.pkl"

# ── Load saved model ─────────────────────────────────────────
model_data = joblib.load(MODEL_PATH)
pipeline         = model_data["pipeline"]
numeric_cols     = model_data["numeric_cols"]
categorical_cols = model_data["categorical_cols"]

print("=" * 55)
print("  STARTUP SUCCESS PREDICTOR")
print("=" * 55)
print(f"  Model loaded from: {MODEL_PATH}\n")


def predict_startup(startup: dict) -> None:
    """Takes a dict of startup features and prints the prediction."""
    df = pd.DataFrame([startup])

    prob_success = pipeline.predict_proba(df)[0][1]
    prob_failure = 1 - prob_success
    label = "SUCCESS" if prob_success >= 0.5 else "FAILURE"

    print(f"  Prediction : {label}")
    print(f"  Confidence : {max(prob_success, prob_failure):.1%}")
    print(f"  Success probability : {prob_success:.1%}")
    print(f"  Failure probability : {prob_failure:.1%}")


def ask_user_for_startup() -> dict:
    """Interactive prompt — user types in values."""
    print("Enter startup details (press Enter to use default value):\n")

    def ask(prompt, default, cast):
        raw = input(f"  {prompt} [default: {default}]: ").strip()
        return cast(raw) if raw else default

    startup = {
        "funding_rounds":           ask("Funding rounds (0-8)",              2,       int),
        "founder_experience_years": ask("Founder experience (years, 0-24)",  10,      int),
        "team_size":                ask("Team size",                          50,      int),
        "market_size_billion":      ask("Market size (billion $)",            20.0,    float),
        "product_traction_users":   ask("Product traction (users)",          100000,  int),
        "burn_rate_million":        ask("Burn rate (million $/month)",        10.0,    float),
        "revenue_million":          ask("Revenue (million $)",                500000,  float),
    }

    print("\n  Investor type options: tier1_vc, tier2_vc, angel, none")
    startup["investor_type"] = ask("Investor type", "tier2_vc", str)

    print("  Sector options: AI, Fintech, Health, SaaS, Ecommerce, Crypto, Climate")
    startup["sector"] = ask("Sector", "SaaS", str)

    print("  Founder background options: first_time, ex_bigtech, academic, serial_founder")
    startup["founder_background"] = ask("Founder background", "first_time", str)

    return startup


# ── Example startups ─────────────────────────────────────────
examples = [
    {
        "name": "Strong startup (high revenue, experienced founder, tier1 VC)",
        "data": {
            "funding_rounds": 4,
            "founder_experience_years": 18,
            "team_size": 80,
            "market_size_billion": 50.0,
            "product_traction_users": 600000,
            "burn_rate_million": 15.0,
            "revenue_million": 1500000,
            "investor_type": "tier1_vc",
            "sector": "AI",
            "founder_background": "serial_founder",
        },
    },
    {
        "name": "Weak startup (no funding, first-time founder, no revenue)",
        "data": {
            "funding_rounds": 0,
            "founder_experience_years": 1,
            "team_size": 3,
            "market_size_billion": 5.0,
            "product_traction_users": 1000,
            "burn_rate_million": 8.0,
            "revenue_million": 5000,
            "investor_type": "none",
            "sector": "Crypto",
            "founder_background": "first_time",
        },
    },
    {
        "name": "Middle-of-the-road startup",
        "data": {
            "funding_rounds": 2,
            "founder_experience_years": 8,
            "team_size": 25,
            "market_size_billion": 15.0,
            "product_traction_users": 80000,
            "burn_rate_million": 12.0,
            "revenue_million": 300000,
            "investor_type": "angel",
            "sector": "SaaS",
            "founder_background": "ex_bigtech",
        },
    },
]

# ── Run ──────────────────────────────────────────────────────
if "--interactive" in sys.argv:
    print("--- Interactive Mode ---\n")
    startup = ask_user_for_startup()
    print("\n--- Prediction ---")
    predict_startup(startup)

else:
    print("--- Running built-in examples ---")
    print("(Run with --interactive flag to enter your own startup)\n")

    for i, ex in enumerate(examples, 1):
        print(f"Example {i}: {ex['name']}")
        print("  Features:", {k: v for k, v in list(ex["data"].items())[:4]}, "...")
        predict_startup(ex["data"])
        print()
