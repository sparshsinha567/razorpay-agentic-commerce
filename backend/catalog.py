"""
Product Catalog for Razorpay Agentic Commerce
"""

PRODUCTS = [
    {
        "id": "PROD_STARTER_01",
        "name": "AI Developer Starter Kit",
        "description": "100K API Tokens, Standard Inference, 5 Hosted Agent Workflows",
        "price_inr": 499,
        "price_paise": 49900,
        "category": "Developer Tools",
        "in_stock": True,
        "stock_count": 150,
        "badge": "Popular",
        "icon": "terminal"
    },
    {
        "id": "PROD_PRO_02",
        "name": "Autonomous Commerce Pro Tier",
        "description": "Unlimited Tool Calling, Priority Gateway Routing, Dedicated Sandbox",
        "price_inr": 2499,
        "price_paise": 249900,
        "category": "Subscriptions",
        "in_stock": True,
        "stock_count": 42,
        "badge": "Recommended",
        "icon": "zap"
    },
    {
        "id": "OUT_OF_STOCK_ITEM_01",
        "name": "H100 GPU Cluster Instant Node",
        "description": "Dedicated H100 GPU instance for heavy inference and fine-tuning",
        "price_inr": 3500,
        "price_paise": 350000,
        "category": "Hardware & Compute",
        "in_stock": False,
        "stock_count": 0,
        "badge": "Out of Stock",
        "icon": "server"
    },
    {
        "id": "PROD_ENTERPRISE_UNLIMITED",
        "name": "Enterprise Unlimited Global License",
        "description": "Full source access, SLA 99.99%, Dedicated Account Manager (Exceeds ₹5k Limit)",
        "price_inr": 12500,
        "price_paise": 1250000,
        "category": "Enterprise",
        "in_stock": True,
        "stock_count": 10,
        "badge": "Guardrail Test",
        "icon": "building-2"
    }
]

ADDONS = [
    {
        "id": "ADDON_GPU_BURST_01",
        "name": "+50K Token Burst Pack",
        "price_inr": 299,
        "price_paise": 29900,
        "description": "High-throughput token burst add-on",
        "icon": "⚡"
    },
    {
        "id": "ADDON_PRIORITY_ROUTE",
        "name": "Priority VIP Gateway SLA",
        "price_inr": 499,
        "price_paise": 49900,
        "description": "Sub-50ms priority payment routing",
        "icon": "🛡️"
    }
]

def get_product_by_id(product_id: str):
    for prod in PRODUCTS:
        if prod["id"].lower() == product_id.lower():
            return prod
    for addon in ADDONS:
        if addon["id"].lower() == product_id.lower():
            return addon
    return None

def find_product_by_query(query: str):
    query_lower = query.lower()
    # Check for bundle queries first
    for prod in PRODUCTS:
        if prod["id"].lower() in query_lower:
            return prod
        if prod["name"].lower() in query_lower:
            return prod
        if "starter" in query_lower and "starter" in prod["name"].lower():
            return prod
        if "pro" in query_lower and "pro" in prod["name"].lower():
            return prod
        if ("gpu" in query_lower or "cluster" in query_lower or "h100" in query_lower or "out of stock" in query_lower) and "OUT_OF_STOCK" in prod["id"]:
            return prod
        if ("enterprise" in query_lower or "unlimited" in query_lower or "12500" in query_lower) and "ENTERPRISE" in prod["id"]:
            return prod
    return None

def get_upsell_recommendation(base_product_id: str):
    """Upsell & Cross-Sell Agent Engine (Revenue Maximizer)"""
    if base_product_id == "PROD_STARTER_01":
        return {
            "type": "cross_sell",
            "addon": ADDONS[0],  # +50k tokens
            "bundle_price_inr": 798,
            "bundle_price_paise": 79800,
            "pitch": "Add the +50K Token Burst Pack for just ₹299 (Bundle Total: ₹798)."
        }
    elif base_product_id == "PROD_PRO_02":
        return {
            "type": "cross_sell",
            "addon": ADDONS[1],  # VIP Route
            "bundle_price_inr": 2998,
            "bundle_price_paise": 299800,
            "pitch": "Upgrade with Priority VIP Gateway SLA for ₹499 (Bundle Total: ₹2,998)."
        }
    return None
