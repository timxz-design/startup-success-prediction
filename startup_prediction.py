"""
Startup Success/Failure Prediction Model
=========================================
Binary classification: Success (Acquisition + IPO) vs Failure
3 models compared with cross-validation and fixed seeds.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, ConfusionMatrixDisplay,
    roc_auc_score, roc_curve
)
from xgboost import XGBClassifier

# ============================================================
# 1. LOAD & PREPARE DATA
# ============================================================
SEED = 42
import os
import kagglehub

# Downloads the Kaggle dataset on first run (cached afterwards)
DATA_PATH = os.path.join(
    kagglehub.dataset_download("dhrubangtalukdar/startup-funding-and-outcome-dataset"),
    "startup_success_dataset.csv",
)

df = pd.read_csv(DATA_PATH)

# Binary target: Success (Acquisition/IPO) = 1, Failure = 0
df["target"] = (df["outcome"] != "Failure").astype(int)

print("=" * 60)
print("TARGET DISTRIBUTION")
print("=" * 60)
print(f"Failure (0): {(df['target'] == 0).sum():,}  ({(df['target'] == 0).mean():.1%})")
print(f"Success (1): {(df['target'] == 1).sum():,}  ({(df['target'] == 1).mean():.1%})")
print(f"\n>>> BASELINE (majority class): {df['target'].value_counts(normalize=True).max():.4f} accuracy")

# ============================================================
# 2. EXPLORATORY DATA ANALYSIS
# ============================================================
numeric_cols = [
    "funding_rounds", "founder_experience_years", "team_size",
    "market_size_billion", "product_traction_users",
    "burn_rate_million", "revenue_million"
]
categorical_cols = ["investor_type", "sector", "founder_background"]

# --- 2a. Feature distributions by outcome ---
fig, axes = plt.subplots(3, 3, figsize=(16, 12))
axes = axes.flatten()
for i, col in enumerate(numeric_cols):
    ax = axes[i]
    df.groupby("target")[col].plot.kde(ax=ax, legend=True)
    ax.set_title(col)
    ax.legend(["Failure", "Success"])
for j in range(len(numeric_cols), len(axes)):
    axes[j].set_visible(False)
plt.suptitle("Numeric Feature Distributions by Outcome", fontsize=14, y=1.01)
plt.tight_layout()
plt.savefig("eda_numeric_distributions.png", dpi=150, bbox_inches="tight")
plt.close()

# --- 2b. Categorical features vs outcome ---
fig, axes = plt.subplots(1, 3, figsize=(18, 5))
for i, col in enumerate(categorical_cols):
    ct = pd.crosstab(df[col], df["target"], normalize="index")
    ct.columns = ["Failure", "Success"]
    ct.plot.bar(ax=axes[i], stacked=True)
    axes[i].set_title(f"{col} vs Outcome")
    axes[i].set_ylabel("Proportion")
    axes[i].tick_params(axis="x", rotation=45)
plt.tight_layout()
plt.savefig("eda_categorical_vs_outcome.png", dpi=150, bbox_inches="tight")
plt.close()

# --- 2c. Correlation heatmap (numeric + target) ---
fig, ax = plt.subplots(figsize=(10, 8))
corr = df[numeric_cols + ["target"]].corr()
sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdBu_r", center=0, ax=ax)
ax.set_title("Correlation Matrix")
plt.tight_layout()
plt.savefig("eda_correlation_matrix.png", dpi=150, bbox_inches="tight")
plt.close()

print("\nEDA plots saved.")

# ============================================================
# 3. TRAIN / TEST SPLIT (fixed seed, stratified)
# ============================================================
X = df[numeric_cols + categorical_cols]
y = df["target"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=SEED, stratify=y
)

print(f"\nTrain set: {X_train.shape[0]:,} samples")
print(f"Test set:  {X_test.shape[0]:,} samples")

# ============================================================
# 4. PREPROCESSING PIPELINE
# ============================================================
preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), numeric_cols),
        ("cat", OneHotEncoder(drop="first", handle_unknown="infrequent_if_exist"), categorical_cols),
    ]
)

# ============================================================
# 5. DEFINE 3 MODELS
# ============================================================
models = {
    "Logistic Regression": LogisticRegression(
        max_iter=1000, random_state=SEED, solver="lbfgs"
    ),
    "Random Forest": RandomForestClassifier(
        n_estimators=300, max_depth=15, min_samples_leaf=5,
        random_state=SEED, n_jobs=-1
    ),
    "XGBoost": XGBClassifier(
        n_estimators=300, max_depth=6, learning_rate=0.1,
        random_state=SEED, eval_metric="logloss", n_jobs=-1
    ),
}

# ============================================================
# 6. CROSS-VALIDATION ON TRAINING SET (fixed seed KFold)
# ============================================================
print("\n" + "=" * 60)
print("CROSS-VALIDATION RESULTS (5-fold, on training set)")
print("=" * 60)

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
scoring = ["accuracy", "f1", "roc_auc", "precision", "recall"]

cv_results = {}
for name, model in models.items():
    pipe = Pipeline([("preprocessor", preprocessor), ("classifier", model)])
    scores = cross_validate(pipe, X_train, y_train, cv=cv, scoring=scoring, n_jobs=-1)
    cv_results[name] = scores

    print(f"\n--- {name} ---")
    print(f"  Accuracy:  {scores['test_accuracy'].mean():.4f} (+/- {scores['test_accuracy'].std():.4f})")
    print(f"  F1:        {scores['test_f1'].mean():.4f} (+/- {scores['test_f1'].std():.4f})")
    print(f"  ROC AUC:   {scores['test_roc_auc'].mean():.4f} (+/- {scores['test_roc_auc'].std():.4f})")
    print(f"  Precision: {scores['test_precision'].mean():.4f} (+/- {scores['test_precision'].std():.4f})")
    print(f"  Recall:    {scores['test_recall'].mean():.4f} (+/- {scores['test_recall'].std():.4f})")

# --- CV comparison bar chart ---
cv_summary = pd.DataFrame({
    name: {
        "Accuracy": cv_results[name]["test_accuracy"].mean(),
        "F1": cv_results[name]["test_f1"].mean(),
        "ROC AUC": cv_results[name]["test_roc_auc"].mean(),
    }
    for name in models
})

fig, ax = plt.subplots(figsize=(10, 6))
cv_summary.T.plot.bar(ax=ax, rot=0)
ax.axhline(y=df["target"].value_counts(normalize=True).max(), color="red",
           linestyle="--", linewidth=2, label="Baseline (majority)")
ax.set_ylabel("Score")
ax.set_title("Cross-Validation: Model Comparison")
ax.legend()
ax.set_ylim(0.4, 1.0)
plt.tight_layout()
plt.savefig("cv_model_comparison.png", dpi=150, bbox_inches="tight")
plt.close()

# ============================================================
# 7. FINAL EVALUATION ON HELD-OUT TEST SET
# ============================================================
print("\n" + "=" * 60)
print("TEST SET RESULTS")
print("=" * 60)
baseline_acc = y_test.value_counts(normalize=True).max()
print(f"Baseline (majority class) accuracy: {baseline_acc:.4f}\n")

test_scores = {}
fig_cm, axes_cm = plt.subplots(1, 3, figsize=(18, 5))
fig_roc, ax_roc = plt.subplots(figsize=(8, 6))

for idx, (name, model) in enumerate(models.items()):
    pipe = Pipeline([("preprocessor", preprocessor), ("classifier", model)])
    pipe.fit(X_train, y_train)
    y_pred = pipe.predict(X_test)
    y_prob = pipe.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)
    test_scores[name] = {"Accuracy": acc, "F1": f1, "Precision": prec, "Recall": rec, "ROC AUC": auc}

    print(f"--- {name} ---")
    print(f"  Accuracy:  {acc:.4f}  (vs baseline {baseline_acc:.4f}, improvement: +{acc - baseline_acc:.4f})")
    print(f"  F1:        {f1:.4f}")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall:    {rec:.4f}")
    print(f"  ROC AUC:   {auc:.4f}")
    print(classification_report(y_test, y_pred, target_names=["Failure", "Success"]))

    # Confusion matrix
    ConfusionMatrixDisplay.from_predictions(
        y_test, y_pred, display_labels=["Failure", "Success"],
        ax=axes_cm[idx], cmap="Blues"
    )
    axes_cm[idx].set_title(name)

    # ROC curve
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    ax_roc.plot(fpr, tpr, label=f"{name} (AUC={auc:.4f})")

fig_cm.suptitle("Confusion Matrices — Test Set", fontsize=14)
fig_cm.tight_layout()
fig_cm.savefig("test_confusion_matrices.png", dpi=150, bbox_inches="tight")
plt.close(fig_cm)

ax_roc.plot([0, 1], [0, 1], "k--", label="Random (AUC=0.50)")
ax_roc.set_xlabel("False Positive Rate")
ax_roc.set_ylabel("True Positive Rate")
ax_roc.set_title("ROC Curves — Test Set")
ax_roc.legend()
fig_roc.tight_layout()
fig_roc.savefig("test_roc_curves.png", dpi=150, bbox_inches="tight")
plt.close(fig_roc)

# ============================================================
# 8. FEATURE IMPORTANCE (best model)
# ============================================================
best_model_name = max(test_scores, key=lambda k: test_scores[k]["ROC AUC"])
print(f"\n{'=' * 60}")
print(f"BEST MODEL: {best_model_name} (ROC AUC: {test_scores[best_model_name]['ROC AUC']:.4f})")
print(f"{'=' * 60}")

# Get feature names after preprocessing
best_pipe = Pipeline([("preprocessor", preprocessor), ("classifier", models[best_model_name])])
best_pipe.fit(X_train, y_train)

feature_names = numeric_cols + list(
    best_pipe.named_steps["preprocessor"]
    .named_transformers_["cat"]
    .get_feature_names_out(categorical_cols)
)

if best_model_name == "XGBoost":
    importances = best_pipe.named_steps["classifier"].feature_importances_
elif best_model_name == "Random Forest":
    importances = best_pipe.named_steps["classifier"].feature_importances_
else:
    importances = np.abs(best_pipe.named_steps["classifier"].coef_[0])

feat_imp = pd.Series(importances, index=feature_names).sort_values(ascending=True)

fig, ax = plt.subplots(figsize=(10, 8))
feat_imp.plot.barh(ax=ax)
ax.set_title(f"Feature Importance — {best_model_name}")
ax.set_xlabel("Importance")
plt.tight_layout()
plt.savefig("feature_importance.png", dpi=150, bbox_inches="tight")
plt.close()

print("\nFeature importances (top 10):")
for feat, imp in feat_imp.sort_values(ascending=False).head(10).items():
    print(f"  {feat:35s} {imp:.4f}")

# ============================================================
# 9. SUMMARY TABLE
# ============================================================
print(f"\n{'=' * 60}")
print("FINAL SUMMARY")
print(f"{'=' * 60}")
summary_df = pd.DataFrame(test_scores).T
summary_df.index.name = "Model"
print(summary_df.to_string(float_format="{:.4f}".format))
print(f"\nBaseline (majority class): {baseline_acc:.4f}")
print(f"Best model: {best_model_name}")

print("\nAll plots saved to project directory.")
