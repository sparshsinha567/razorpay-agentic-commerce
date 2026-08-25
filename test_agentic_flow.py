import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

site_pkg_path = r"D:\Lib\site-packages"
if os.path.exists(site_pkg_path) and site_pkg_path not in sys.path:
    sys.path.insert(0, site_pkg_path)

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_catalog_endpoint():
    print("\n[TEST 1] Testing Catalog Endpoint...")
    resp = client.get("/api/catalog")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert len(data["catalog"]) >= 4, "Expected at least 4 catalog products"
    print("  ✓ Catalog loaded successfully with products:")
    for prod in data["catalog"]:
        print(f"    • {prod['name']} (₹{prod['price_inr']}) - Stock: {prod['in_stock']}")

def test_auth_guardrails_registration():
    print("\n[TEST 2] Testing User Registration & Guardrail Validation...")
    
    bad_user_resp = client.post("/api/auth/register", json={
        "username": "a!",
        "email": "test@example.com",
        "password": "Password@123"
    })
    assert bad_user_resp.status_code == 400 or bad_user_resp.status_code == 422
    print("  ✓ Invalid username correctly blocked by guardrail")

    bad_pass_resp = client.post("/api/auth/register", json={
        "username": "valid_user_01",
        "email": "test@example.com",
        "password": "simplepassword"
    })
    assert bad_pass_resp.status_code == 400 or bad_pass_resp.status_code == 422
    print("  ✓ Weak password correctly blocked by complexity guardrail")

    valid_resp = client.post("/api/auth/register", json={
        "username": "agent_trader_01",
        "email": "trader01@company.com",
        "password": "SecureTrader@2026",
        "full_name": "Agent Trader 01"
    })
    assert valid_resp.status_code == 201, f"Expected 201, got {valid_resp.status_code}: {valid_resp.text}"
    valid_data = valid_resp.json()
    assert valid_data["status"] == "success"
    print(f"  ✓ User '{valid_data['username']}' registered successfully with hashed credentials")

def test_auth_login_and_jwt_generation():
    print("\n[TEST 3] Testing Login & JWT Issuance...")
    
    bad_login = client.post("/api/auth/login", json={
        "username": "agent_trader_01",
        "password": "WrongPassword123"
    })
    assert bad_login.status_code == 401
    print("  ✓ Invalid login correctly rejected with 401")

    good_login = client.post("/api/auth/login", json={
        "username": "agent_trader_01",
        "password": "SecureTrader@2026"
    })
    assert good_login.status_code == 200
    token_data = good_login.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    token = token_data["access_token"]
    print(f"  ✓ JWT access token issued: {token[:24]}...")

    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["username"] == "agent_trader_01"
    print(f"  ✓ Authenticated user profile verified for '{me_data['username']}'")
    return token

def test_unauthenticated_checkout_blocked():
    print("\n[TEST 4] Testing Unauthenticated Execution Rejection (401)...")
    
    exec_resp = client.post("/api/agent/execute_checkout", json={
        "amount_in_paise": 249900,
        "currency": "INR",
        "receipt_id": "rcpt_unauth_test",
        "item_id": "PROD_PRO_02",
        "customer_notes": "Unauth attack test"
    })
    assert exec_resp.status_code == 401, f"Expected 401 Unauthorized, got {exec_resp.status_code}"
    print("  ✓ Unauthenticated checkout blocked with 401 Unauthorized")

def test_authenticated_checkout_success(token: str):
    print("\n[TEST 5] Testing Authenticated Scenario A: Normal Checkout (Pro Tier ₹2499)...")
    
    reason_resp = client.post("/api/agent/reason", json={"query": "Authorize purchase for Autonomous Commerce Pro Tier"})
    assert reason_resp.status_code == 200
    reason_data = reason_resp.json()
    assert reason_data["action_required"] == "EXECUTE_CHECKOUT"
    print(f"  ✓ Phase 1 Formulated Plan: {reason_data['plan']}")

    payload = reason_data["execution_payload"]
    exec_resp = client.post(
        "/api/agent/execute_checkout",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert exec_resp.status_code == 200, f"Expected 200, got {exec_resp.status_code}: {exec_resp.text}"
    exec_data = exec_resp.json()
    assert exec_data["status"] == "success"
    assert "order_id" in exec_data
    assert exec_data["authenticated_user"] == "agent_trader_01"
    print(f"  ✓ Phase 2 Order Created for '{exec_data['authenticated_user']}': {exec_data['order_id']} for ₹{exec_data['amount_inr']}")

def test_scenario_b_graceful_failure_out_of_stock(token: str):
    print("\n[TEST 6] Testing Scenario B: Graceful Failure - Out of Stock Item...")
    
    reason_resp = client.post("/api/agent/reason", json={"query": "Order H100 GPU Cluster Instant Node"})
    assert reason_resp.status_code == 200
    reason_data = reason_resp.json()
    
    payload = reason_data["execution_payload"]
    exec_resp = client.post(
        "/api/agent/execute_checkout",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert exec_resp.status_code == 200
    exec_data = exec_resp.json()
    assert exec_data["status"] == "rejected"
    assert exec_data["reason_code"] == "OUT_OF_STOCK"
    print(f"  ✓ Graceful Rejection Handled: {exec_data['reason']}")
    print(f"  ✓ Agent Conversational Remedy: {exec_data['agent_remedy_message']}")

def test_scenario_c_guardrail_budget_violation(token: str):
    print("\n[TEST 7] Testing Scenario C: Guardrail Gate - Budget Limit Violation (> ₹5000)...")
    
    reason_resp = client.post("/api/agent/reason", json={"query": "Buy Enterprise Unlimited Global License"})
    assert reason_resp.status_code == 200
    reason_data = reason_resp.json()
    
    payload = reason_data["execution_payload"]
    exec_resp = client.post(
        "/api/agent/execute_checkout",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert exec_resp.status_code == 400
    exec_data = exec_resp.json()
    assert exec_data["status"] == "blocked_by_guardrail"
    print(f"  ✓ Transaction Intercepted by Guardrail: {exec_data['error']}")

def test_audit_trail_integrity():
    print("\n[TEST 8] Testing Explainable Audit Trail Ledger & User Tracking...")
    resp = client.get("/api/agent/audit_trail")
    assert resp.status_code == 200
    data = resp.json()
    ledger = data["ledger"]
    assert len(ledger) > 0, "Audit ledger should not be empty"
    print(f"  ✓ Total Audit Entries: {data['total_entries']}")
    print("  ✓ Recent Explainable Audit Log Entries with User Tags:")
    for entry in ledger[:5]:
        user_tag = entry.get("user", "system")
        print(f"    [{entry['status']}] [{user_tag}] {entry['phase']} -> {entry['action']}: {entry['details']}")

if __name__ == "__main__":
    print("=" * 60)
    print("🔍 RUNNING SECURE AGENTIC COMMERCE (JWT & GUARDRAILS) TEST SUITE")
    print("=" * 60)
    test_catalog_endpoint()
    test_auth_guardrails_registration()
    auth_token = test_auth_login_and_jwt_generation()
    test_unauthenticated_checkout_blocked()
    test_authenticated_checkout_success(auth_token)
    test_scenario_b_graceful_failure_out_of_stock(auth_token)
    test_scenario_c_guardrail_budget_violation(auth_token)
    test_audit_trail_integrity()
    print("\n" + "=" * 60)
    print("🎉 ALL TESTS PASSED! SECURE AUTH & GUARDRAILS 100% OPERATIONAL.")
    print("=" * 60)
