"""
app.py  —  Startup Success Predictor Web App
Run with: python webapp/app.py
Then open: http://127.0.0.1:5000
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import joblib
import pandas as pd
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Load model once at startup
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "startup_model.pkl")
model_data = joblib.load(MODEL_PATH)
pipeline         = model_data["pipeline"]
numeric_cols     = model_data["numeric_cols"]
categorical_cols = model_data["categorical_cols"]


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        startup = {
            "funding_rounds":           int(data["funding_rounds"]),
            "founder_experience_years": int(data["founder_experience_years"]),
            "team_size":                int(data["team_size"]),
            "market_size_billion":      float(data["market_size_billion"]),
            "product_traction_users":   int(data["product_traction_users"]),
            "burn_rate_million":        float(data["burn_rate_million"]),
            "revenue_million":          float(data["revenue_million"]),
            "investor_type":            str(data["investor_type"]),
            "sector":                   str(data["sector"]),
            "founder_background":       str(data["founder_background"]),
        }

        df = pd.DataFrame([startup])
        prob_success = float(pipeline.predict_proba(df)[0][1])
        prob_failure = 1.0 - prob_success
        label = "SUCCESS" if prob_success >= 0.5 else "FAILURE"

        return jsonify({
            "label":        label,
            "prob_success": round(prob_success * 100, 1),
            "prob_failure": round(prob_failure * 100, 1),
            "confidence":   round(max(prob_success, prob_failure) * 100, 1),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    print("Starting Startup Predictor at http://127.0.0.1:5000")
    app.run(debug=True)
