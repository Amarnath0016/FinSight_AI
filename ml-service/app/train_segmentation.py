import os
import json
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import joblib

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def generate_synthetic_training_data(n_samples=600, random_state=42):
    """
    Generates realistic, synthetic financial profile data for training:
    Group 1: Disciplined Savers (high savings, low expense ratio, low discretionary)
    Group 2: Balanced Spenders (moderate savings, healthy cashflow)
    Group 3: High-Outflow Spenders (living paycheck-to-paycheck or spending exceeds income)
    """
    np.random.seed(random_state)
    n_per_group = n_samples // 3

    # Group 1: Disciplined Savers
    income_g1 = np.random.normal(75000, 15000, n_per_group).clip(30000, 200000)
    savings_rate_g1 = np.random.normal(45, 10, n_per_group).clip(25, 75)
    expense_g1 = income_g1 * (1 - savings_rate_g1 / 100.0)
    expense_ratio_g1 = (expense_g1 / income_g1) * 100.0
    disc_ratio_g1 = np.random.normal(0.18, 0.05, n_per_group).clip(0.05, 0.35)

    # Group 2: Balanced Spenders
    income_g2 = np.random.normal(55000, 12000, n_per_group).clip(25000, 150000)
    savings_rate_g2 = np.random.normal(18, 5, n_per_group).clip(10, 28)
    expense_g2 = income_g2 * (1 - savings_rate_g2 / 100.0)
    expense_ratio_g2 = (expense_g2 / income_g2) * 100.0
    disc_ratio_g2 = np.random.normal(0.32, 0.06, n_per_group).clip(0.15, 0.50)

    # Group 3: High-Outflow Spenders
    income_g3 = np.random.normal(42000, 10000, n_per_group).clip(20000, 120000)
    savings_rate_g3 = np.random.normal(-5, 8, n_per_group).clip(-40, 8)
    expense_g3 = income_g3 * (1 - savings_rate_g3 / 100.0)
    expense_ratio_g3 = (expense_g3 / income_g3) * 100.0
    disc_ratio_g3 = np.random.normal(0.48, 0.08, n_per_group).clip(0.30, 0.75)

    incomes = np.concatenate([income_g1, income_g2, income_g3])
    expenses = np.concatenate([expense_g1, expense_g2, expense_g3])
    savings_rates = np.concatenate([savings_rate_g1, savings_rate_g2, savings_rate_g3])
    expense_ratios = np.concatenate([expense_ratio_g1, expense_ratio_g2, expense_ratio_g3])
    disc_ratios = np.concatenate([disc_ratio_g1, disc_ratio_g2, disc_ratio_g3])

    X = np.column_stack([incomes, expenses, savings_rates, expense_ratios, disc_ratios])
    return X


def train_and_export_model():
    print("Generating synthetic financial data...")
    X = generate_synthetic_training_data(n_samples=600)

    print("Fitting StandardScaler...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    print("Fitting KMeans (k=3)...")
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)

    score = silhouette_score(X_scaled, labels)
    print(f"Clustering Evaluation - Silhouette Score: {score:.4f}")

    # Inspect centroids in original feature space to name clusters dynamically
    centroids_original = scaler.inverse_transform(kmeans.cluster_centers_)
    
    # Feature order: [income, expense, savings_rate, expense_ratio, disc_ratio]
    cluster_profiles = {}
    for i, c in enumerate(centroids_original):
        cluster_profiles[i] = {
            "income": float(c[0]),
            "expense": float(c[1]),
            "savings_rate": float(c[2]),
            "expense_ratio": float(c[3]),
            "disc_ratio": float(c[4]),
        }

    # Map clusters by savings_rate centroid:
    # Highest savings_rate -> "Disciplined Saver"
    # Middle savings_rate -> "Balanced Spender"
    # Lowest savings_rate -> "High-Outflow Spender"
    sorted_by_savings = sorted(cluster_profiles.items(), key=lambda item: item[1]["savings_rate"], reverse=True)
    
    label_mapping = {
        sorted_by_savings[0][0]: {
            "name": "Disciplined Saver",
            "description": "Consistent high surplus, strong savings allocation, and disciplined discretionary spending.",
            "recommendation": "Great financial resilience! Consider exploring tax-advantaged investments, emergency liquid reserves, and medium-term growth assets.",
        },
        sorted_by_savings[1][0]: {
            "name": "Balanced Spender",
            "description": "Stable financial rhythm with moderate savings and managed daily living expenses.",
            "recommendation": "Healthy baseline. Look for opportunities to trim recurring subscriptions and automate a 5% increase to your monthly savings.",
        },
        sorted_by_savings[2][0]: {
            "name": "High-Outflow Spender",
            "description": "Expenses consume nearly all (or more than) total income, leaving minimal reserve for unexpected events.",
            "recommendation": "High priority: conduct a category audit to identify non-essential discretionary costs and build a ₹10,000 baseline emergency buffer.",
        },
    }

    model_path = os.path.join(MODELS_DIR, "kmeans_model.joblib")
    scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")
    meta_path = os.path.join(MODELS_DIR, "metadata.json")

    joblib.dump(kmeans, model_path)
    joblib.dump(scaler, scaler_path)

    metadata = {
        "model_version": "kmeans-v1.0",
        "n_clusters": 3,
        "silhouette_score": float(score),
        "cluster_labels": {str(k): v for k, v in label_mapping.items()},
        "centroids": {str(k): v for k, v in cluster_profiles.items()},
    }

    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Model saved to: {model_path}")
    print(f"Scaler saved to: {scaler_path}")
    print(f"Metadata saved to: {meta_path}")
    return metadata


if __name__ == "__main__":
    train_and_export_model()
