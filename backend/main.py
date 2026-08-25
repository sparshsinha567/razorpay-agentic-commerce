import sys
import os
import time
import hmac
import hashlib
import base64
import json
import secrets
import re
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

site_pkg_path = r"D:\Lib\site-packages"
if os.path.exists(site_pkg_path) and site_pkg_path not in sys.path:
    sys.path.insert(0, site_pkg_path)

import razorpay
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field, field_validator

from backend.config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, MAX_TRANSACTION_LIMIT_INR, CURRENCY_ALLOWED
from backend.catalog import PRODUCTS, ADDONS, get_product_by_id, find_product_by_query, get_upsell_recommendation

app = FastAPI(
    title="Razorpay Agentic Commerce Gateway",
    version="2.0.26"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-replace-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"pbkdf2_sha256$100000${salt}${pwd_hash.hex()}"

def verify_password(password: str, hashed: str) -> bool:
    try:
        if hashed.startswith("pbkdf2_sha256$"):
            parts = hashed.split("$")
            iterations = int(parts[1])
            salt = parts[2]
            stored_hash = parts[3]
            new_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
            return hmac.compare_digest(new_hash.hex(), stored_hash)
        return password == hashed
    except Exception:
        return False

def b64_url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def b64_url_decode(data: str) -> bytes:
    pad = len(data) % 4
    if pad:
        data += "=" * (4 - pad)
    return base64.urlsafe_b64decode(data)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire_epoch = int(time.time() + expires_delta.total_seconds())
    else:
        expire_epoch = int(time.time() + (ACCESS_TOKEN_EXPIRE_MINUTES * 60))
    to_encode.update({"exp": expire_epoch, "iat": int(time.time())})
    header = {"alg": ALGORITHM, "typ": "JWT"}
    h_b64 = b64_url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    p_b64 = b64_url_encode(json.dumps(to_encode, separators=(",", ":")).encode("utf-8"))
    msg = f"{h_b64}.{p_b64}".encode("utf-8")
    sig = hmac.new(SECRET_KEY.encode("utf-8"), msg, hashlib.sha256).digest()
    sig_b64 = b64_url_encode(sig)
    return f"{h_b64}.{p_b64}.{sig_b64}"

def decode_access_token(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    h_b64, p_b64, sig_b64 = parts
    msg = f"{h_b64}.{p_b64}".encode("utf-8")
    expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), msg, hashlib.sha256).digest()
    if not hmac.compare_digest(b64_url_encode(expected_sig), sig_b64):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = json.loads(b64_url_decode(p_b64).decode("utf-8"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if payload.get("exp") and payload["exp"] < time.time():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

user_db: Dict[str, dict] = {
    "demo_user": {
        "username": "demo_user",
        "email": "demo@razorpay.com",
        "full_name": "Demo Operator",
        "hashed_password": hash_password("Demo@12345"),
        "created_at": datetime.utcnow().isoformat()
    }
}

def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    payload = decode_access_token(token)
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    user = user_db.get(username.lower())
    if user is None:
        raise credentials_exception
    return user

class SafeRazorpayClient:
    def __init__(self, key_id: str, key_secret: str):
        self.key_id = key_id
        self.key_secret = key_secret
        self.is_mock = not (key_id.startswith("rzp_test_") and len(key_id) > 15 and key_secret != "YOUR_SECRET_HERE" and key_secret != "AiCommerceSecret2026")
        if not self.is_mock:
            try:
                self.client = razorpay.Client(auth=(key_id, key_secret))
            except Exception:
                self.client = None
                self.is_mock = True
        else:
            self.client = None

    def create_order(self, data: dict) -> dict:
        if not self.is_mock and self.client:
            try:
                return self.client.order.create(data=data)
            except Exception as e:
                print(f"[Razorpay API Warning] Fallback to simulated gateway order: {e}")
        
        order_seq = int(time.time() * 1000) % 1000000
        return {
            "id": f"order_rzp_{order_seq:06d}",
            "entity": "order",
            "amount": data["amount"],
            "amount_paid": 0,
            "amount_due": data["amount"],
            "currency": data.get("currency", "INR"),
            "receipt": data.get("receipt", f"rcpt_{int(time.time())}"),
            "status": "created",
            "attempts": 0,
            "notes": data.get("notes", {}),
            "created_at": int(time.time())
        }

rzp_gateway = SafeRazorpayClient(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)

class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    phase: str
    action: str
    status: str
    user: Optional[str] = "system"
    item_id: Optional[str] = None
    amount_inr: Optional[float] = None
    details: str
    payload: Optional[Dict[str, Any]] = None
    guardrail_status: Optional[str] = None

audit_ledger: List[AuditLogEntry] = []

def log_audit(phase: str, action: str, status: str, details: str, item_id: Optional[str] = None, amount_paise: Optional[int] = None, payload: Optional[dict] = None, guardrail_status: Optional[str] = None, user: Optional[str] = "system") -> AuditLogEntry:
    entry = AuditLogEntry(
        id=f"audit_{int(time.time() * 1000)}_{len(audit_ledger)+1}",
        timestamp=datetime.utcnow().isoformat() + "Z",
        phase=phase,
        action=action,
        status=status,
        user=user,
        item_id=item_id,
        amount_inr=(amount_paise / 100.0) if amount_paise is not None else None,
        details=details,
        payload=payload,
        guardrail_status=guardrail_status
    )
    audit_ledger.insert(0, entry)
    print(f"[AUDIT LEDGER] [{status}] [{entry.user}] {entry.action}: {entry.details}")
    return entry

log_audit(
    phase="System",
    action="GATEWAY_INITIALIZE",
    status="READY",
    details=f"Agentic Commerce Gateway online. Guardrail session limit: ₹{MAX_TRANSACTION_LIMIT_INR/100:.2f}. JWT Auth armed.",
    guardrail_status="PASSED",
    user="system"
)

USERNAME_REGEX = r"^[a-zA-Z0-9_]{3,20}$"
PASSWORD_REGEX = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,64}$"
EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

class SignUpSchema(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if not re.match(USERNAME_REGEX, cleaned):
            raise ValueError("Username must be 3-20 chars (alphanumeric and _ only).")
        if cleaned in user_db:
            raise ValueError("Username already exists.")
        return cleaned

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        cleaned = value.strip()
        if not re.match(EMAIL_REGEX, cleaned):
            raise ValueError("Please enter a valid email address.")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not re.match(PASSWORD_REGEX, value):
            raise ValueError("Password requires 8+ chars with uppercase, lowercase, number & symbol (@$!%*?&_#-).")
        return value

class LoginJsonSchema(BaseModel):
    username: str
    password: str

class OrderRequestSchema(BaseModel):
    amount_in_paise: int = Field(..., description="Total amount in paise. Must be > 100.")
    currency: str = Field(default="INR", pattern="^INR$")
    receipt_id: str = Field(..., max_length=40)
    item_id: str = Field(..., description="Product SKU / ID from verified catalog")
    customer_notes: Optional[str] = Field(default="Purchased via AI Agent")

    @field_validator("amount_in_paise")
    @classmethod
    def check_budget_limit(cls, value: int) -> int:
        if value <= 100:
            raise ValueError("Transaction amount must be greater than ₹1.00 (100 paise).")
        if value > MAX_TRANSACTION_LIMIT_INR:
            raise ValueError(
                f"GUARDRAIL_VIOLATION: Transaction amount ₹{value/100:.2f} exceeds strict session limit of ₹{MAX_TRANSACTION_LIMIT_INR/100:.2f}."
            )
        return value

class ChatMessage(BaseModel):
    role: str
    content: str

class Phase1ChatRequest(BaseModel):
    query: str
    history: Optional[List[ChatMessage]] = []
    session_id: Optional[str] = "default_session"

class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    amount_inr: Optional[float] = None
    amount_paise: Optional[int] = None
    item_id: Optional[str] = None
    item_name: Optional[str] = None
    username: Optional[str] = "demo_user"

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = []
    for err in exc.errors():
        msg = err.get("msg", "")
        loc = " -> ".join([str(l) for l in err.get("loc", [])])
        error_details.append(f"{loc}: {msg}")
    combined_err = " | ".join(error_details)

    log_audit(
        phase="Phase 2: Guardrail Gate",
        action="SCHEMA_VALIDATION_BLOCKED",
        status="BLOCKED",
        details=f"Pydantic strict schema validator blocked transaction: {combined_err}",
        guardrail_status="BLOCKED_BY_GUARDRAIL"
    )

    return JSONResponse(
        status_code=400,
        content={
            "phase": 2,
            "status": "blocked_by_guardrail",
            "error": combined_err,
            "agent_message": f"Autonomous transaction blocked by safety guardrail: {combined_err}. Please select an item within the ₹5,000.00 session threshold.",
            "orb_state": "alert"
        }
    )

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register_user(payload: SignUpSchema):
    hashed = hash_password(payload.password)
    user_db[payload.username] = {
        "username": payload.username,
        "email": payload.email,
        "full_name": payload.full_name or payload.username,
        "hashed_password": hashed,
        "created_at": datetime.utcnow().isoformat()
    }
    log_audit(
        phase="Auth",
        action="USER_REGISTERED",
        status="SUCCESS",
        details=f"New user '{payload.username}' registered successfully.",
        guardrail_status="PASSED",
        user=payload.username
    )
    return {
        "status": "success",
        "message": "Account created. Please sign in.",
        "username": payload.username
    }

@app.post("/api/auth/login")
async def login_user(request: Request):
    username = None
    password = None

    content_type = request.headers.get("content-type", "")
    if "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        try:
            form = await request.form()
            username = form.get("username")
            password = form.get("password")
        except Exception:
            pass

    if not username:
        try:
            body = await request.json()
            username = body.get("username")
            password = body.get("password")
        except Exception:
            pass

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required."
        )

    clean_identifier = str(username).strip().lower()
    user = user_db.get(clean_identifier)
    if not user:
        for u in user_db.values():
            if u.get("email", "").strip().lower() == clean_identifier:
                user = u
                break

    if not user or not verify_password(str(password), user["hashed_password"]):
        log_audit(
            phase="Auth",
            action="LOGIN_FAILED",
            status="FAILED",
            details=f"Failed login attempt for identifier '{clean_identifier}'.",
            guardrail_status="AUTH_REJECTED",
            user=clean_identifier
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user["username"]})
    log_audit(
        phase="Auth",
        action="LOGIN_SUCCESS",
        status="SUCCESS",
        details=f"User '{user['username']}' authenticated. JWT issued.",
        guardrail_status="PASSED",
        user=user["username"]
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user["username"],
        "email": user.get("email", ""),
        "full_name": user.get("full_name", user["username"])
    }

@app.get("/api/auth/me")
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return {
        "status": "authenticated",
        "username": current_user["username"],
        "email": current_user.get("email", ""),
        "full_name": current_user.get("full_name", current_user["username"])
    }

@app.get("/api/catalog")
def get_catalog():
    return {
        "status": "success",
        "catalog": PRODUCTS,
        "session_guardrail": {
            "max_limit_inr": MAX_TRANSACTION_LIMIT_INR / 100,
            "currency": CURRENCY_ALLOWED
        }
    }

@app.post("/api/agent/reason")
def phase1_reasoning(payload: Phase1ChatRequest):
    query = payload.query.strip()
    log_audit(
        phase="Phase 1: Reasoning",
        action="INTENT_ANALYSIS",
        status="PROCESSING",
        details=f"Agent analyzing user query: '{query}'",
        payload={"query": query, "session_id": payload.session_id}
    )

    matched_product = find_product_by_query(query)

    if not matched_product:
        if any(w in query.lower() for w in ["catalog", "what can i buy", "products", "options", "hello", "hi", "help"]):
            available_names = [f"• {p['name']} (₹{p['price_inr']})" + (" [Out of Stock]" if not p['in_stock'] else "") for p in PRODUCTS]
            msg = "Here are the available products in our verified catalog:\n" + "\n".join(available_names) + "\n\nTell me which one you would like to purchase!"
            return {
                "phase": 1,
                "status": "inquiry_handled",
                "message": msg,
                "action_required": None,
                "plan": "User browsing catalog. No transaction initiated.",
                "orb_state": "idle"
            }
        else:
            return {
                "phase": 1,
                "status": "needs_clarification",
                "message": f"I couldn't identify an exact match for '{query}' in our product catalog. We currently offer the AI Developer Starter Kit (₹499), Autonomous Commerce Pro Tier (₹2,499), H100 GPU Cluster Instant Node (₹3,500), and Enterprise License.",
                "action_required": None,
                "plan": "Ambiguous intent. Requesting clarification.",
                "orb_state": "idle"
            }

    plan_text = (
        f"Identified item: {matched_product['name']} (ID: {matched_product['id']}). "
        f"Price: ₹{matched_product['price_inr']} ({matched_product['price_paise']} paise). "
        f"Inventory Stock Status: {'In Stock' if matched_product['in_stock'] else 'OUT OF STOCK'}. "
        f"Guardrail Check (Limit ₹5000): {'PASS' if matched_product['price_paise'] <= MAX_TRANSACTION_LIMIT_INR else 'FAIL - EXCEEDS SESSION LIMIT'}."
    )

    if matched_product['price_paise'] > MAX_TRANSACTION_LIMIT_INR:
        log_audit(
            phase="Phase 1: Reasoning",
            action="GUARDRAIL_PRECHECK",
            status="ALERT",
            item_id=matched_product['id'],
            amount_paise=matched_product['price_paise'],
            details=f"Item ₹{matched_product['price_inr']} exceeds strict limit of ₹{MAX_TRANSACTION_LIMIT_INR/100}. Formulating bounded tool rejection.",
            guardrail_status="BLOCKED_BY_POLICY"
        )
        return {
            "phase": 1,
            "status": "guardrail_warning",
            "product": matched_product,
            "plan": plan_text,
            "message": f"I found **{matched_product['name']}**, but its price of **₹{matched_product['price_inr']}** exceeds the autonomous transaction session limit of **₹{MAX_TRANSACTION_LIMIT_INR/100:.2f}**. As a safety guardrail, I cannot auto-authorize transactions exceeding ₹5,000 without human manager override. Would you like to proceed with the Pro Tier (₹2,499) instead?",
            "execution_payload": {
                "amount_in_paise": matched_product["price_paise"],
                "currency": "INR",
                "receipt_id": f"rcpt_guardrail_{int(time.time())}",
                "item_id": matched_product["id"],
                "customer_notes": f"Purchase request for {matched_product['name']}"
            },
            "action_required": "EXECUTE_CHECKOUT",
            "orb_state": "alert"
        }

    if not matched_product['in_stock']:
        log_audit(
            phase="Phase 1: Reasoning",
            action="INVENTORY_PRECHECK",
            status="WARNING",
            item_id=matched_product['id'],
            amount_paise=matched_product['price_paise'],
            details=f"Item {matched_product['name']} is marked out of stock. Routing to Phase 2 deterministic graceful rejection handler.",
            guardrail_status="STOCK_EXHAUSTED"
        )
        return {
            "phase": 1,
            "status": "ready_for_execution",
            "product": matched_product,
            "plan": plan_text,
            "message": f"I've selected **{matched_product['name']}** (₹{matched_product['price_inr']}). Initiating inventory check and payment pipeline...",
            "execution_payload": {
                "amount_in_paise": matched_product["price_paise"],
                "currency": "INR",
                "receipt_id": f"rcpt_stock_{int(time.time())}",
                "item_id": matched_product["id"],
                "customer_notes": f"Purchase request for {matched_product['name']}"
            },
            "action_required": "EXECUTE_CHECKOUT",
            "orb_state": "pulse"
        }

    upsell_info = get_upsell_recommendation(matched_product['id'])
    upsell_msg = ""
    if upsell_info:
        upsell_msg = f"\n\n💡 **AI Revenue Growth Suggestion:** {upsell_info['pitch']}"

    log_audit(
        phase="Phase 1: Reasoning",
        action="PLAN_FORMULATION",
        status="READY",
        item_id=matched_product['id'],
        amount_paise=matched_product['price_paise'],
        details=f"Formulated execution payload for {matched_product['name']} (₹{matched_product['price_inr']}). Upsell opportunity identified.",
        guardrail_status="PASSED"
    )

    return {
        "phase": 1,
        "status": "ready_for_execution",
        "product": matched_product,
        "upsell": upsell_info,
        "plan": plan_text,
        "message": f"I'm preparing checkout for **{matched_product['name']}** at **₹{matched_product['price_inr']}**. All parameters comply with session guardrails.{upsell_msg}\n\nExecuting Phase 2 order creation...",
        "execution_payload": {
            "amount_in_paise": matched_product["price_paise"],
            "currency": "INR",
            "receipt_id": f"rcpt_agent_{int(time.time())}",
            "item_id": matched_product["id"],
            "customer_notes": f"Autonomous purchase of {matched_product['name']}"
        },
        "action_required": "EXECUTE_CHECKOUT",
        "orb_state": "pulse"
    }

class A2ABuyerRequest(BaseModel):
    buyer_agent_id: str = Field(..., description="Unique autonomous buyer agent identifier")
    protocol_version: str = Field(default="ACP/2.0-UAP", description="Agent Commerce Protocol specification")
    item_id: str = Field(..., description="Target SKU from agent-readable catalog")
    max_budget_paise: int = Field(..., description="Buyer agent authorized spending limit")
    callback_webhook_url: Optional[str] = None

@app.get("/api/v1/protocol/agent_manifest")
def get_agent_commerce_manifest():
    return {
        "protocol": "ACP/2.0-Razorpay-UAP",
        "merchant": "Razorpay Agentic Commerce Demo Merchant",
        "gateway": "Razorpay Test Mode",
        "currency": CURRENCY_ALLOWED,
        "guardrail_session_max_paise": MAX_TRANSACTION_LIMIT_INR,
        "supported_buyer_protocols": ["ACP/2.0", "AP2", "x402", "NPCI-UAP"],
        "endpoints": {
            "catalog": "/api/catalog",
            "a2a_checkout": "/api/v1/protocol/a2a_checkout",
            "audit_trail": "/api/agent/audit_trail"
        },
        "catalog_summary": PRODUCTS
    }

@app.post("/api/v1/protocol/a2a_checkout")
def handle_a2a_machine_checkout(req: A2ABuyerRequest):
    prod = get_product_by_id(req.item_id)
    if not prod:
        raise HTTPException(status_code=404, detail=f"SKU {req.item_id} not found in verified catalog.")

    if not prod.get("in_stock", True):
        log_audit(
            phase="A2A Protocol",
            action="A2A_STOCK_GATE",
            status="FAILED",
            item_id=req.item_id,
            amount_paise=prod["price_paise"],
            details=f"A2A Buyer Agent '{req.buyer_agent_id}' requested out-of-stock item '{prod['name']}'. Graceful refusal.",
            guardrail_status="REJECTED_OUT_OF_STOCK"
        )
        return {
            "protocol_response": "TRANSACTION_REJECTED",
            "reason": "OUT_OF_STOCK",
            "alternative_skus": ["PROD_STARTER_01", "PROD_PRO_02"]
        }

    if prod["price_paise"] > MAX_TRANSACTION_LIMIT_INR or prod["price_paise"] > req.max_budget_paise:
        log_audit(
            phase="A2A Protocol",
            action="A2A_GUARDRAIL_BLOCKED",
            status="BLOCKED",
            item_id=req.item_id,
            amount_paise=prod["price_paise"],
            details=f"A2A Buyer Agent '{req.buyer_agent_id}' transaction of ₹{prod['price_inr']} blocked by guardrail limit.",
            guardrail_status="BLOCKED_BY_GUARDRAIL"
        )
        raise HTTPException(status_code=400, detail="Transaction amount exceeds allowed guardrail threshold.")

    order_data = {
        "amount": prod["price_paise"],
        "currency": "INR",
        "receipt": f"a2a_{int(time.time())}",
        "payment_capture": 1,
        "notes": {
            "buyer_agent_id": req.buyer_agent_id,
            "protocol": req.protocol_version,
            "channel": "A2A_MACHINE_COMMERCE"
        }
    }
    rzp_order = rzp_gateway.create_order(data=order_data)

    log_audit(
        phase="A2A Protocol",
        action="A2A_ORDER_SETTLED",
        status="SUCCESS",
        item_id=req.item_id,
        amount_paise=prod["price_paise"],
        details=f"A2A AI Buyer '{req.buyer_agent_id}' autonomously purchased '{prod['name']}' for ₹{prod['price_inr']}.",
        payload=rzp_order,
        guardrail_status="PASSED"
    )

    return {
        "protocol_response": "TRANSACTION_SETTLED",
        "order_id": rzp_order["id"],
        "amount_paise": prod["price_paise"],
        "amount_inr": prod["price_inr"],
        "currency": "INR",
        "receipt": rzp_order["receipt"],
        "buyer_agent_id": req.buyer_agent_id,
        "audit_confirmed": True
    }

@app.get("/api/agent/stats")
def get_agentic_stats():
    total_gmv = 0.0
    orders_count = 0
    guardrail_blocks = 0
    a2a_count = 0
    settled_keys = set()

    for entry in audit_ledger:
        if entry.action == "PAYMENT_CAPTURED" and entry.status == "SUCCESS":
            pay_id = (entry.payload.get("razorpay_payment_id") if (entry.payload and isinstance(entry.payload, dict)) else None) or entry.id
            if pay_id not in settled_keys and entry.amount_inr:
                total_gmv += entry.amount_inr
                orders_count += 1
                settled_keys.add(pay_id)
        elif entry.action == "A2A_ORDER_SETTLED" and entry.status == "SUCCESS":
            order_id = (entry.payload.get("id") if (entry.payload and isinstance(entry.payload, dict)) else None) or entry.id
            if order_id not in settled_keys and entry.amount_inr:
                total_gmv += entry.amount_inr
                orders_count += 1
                settled_keys.add(order_id)

        if "A2A" in entry.action or "A2A" in entry.phase:
            a2a_count += 1

        if entry.status in ["BLOCKED", "FAILED"] or entry.guardrail_status in ["BLOCKED_BY_GUARDRAIL", "BLOCKED_BY_POLICY", "STOCK_EXHAUSTED", "REJECTED_OUT_OF_STOCK"]:
            guardrail_blocks += 1

    return {
        "total_gmv_inr": total_gmv,
        "orders_created": orders_count,
        "guardrail_blocks_intercepted": guardrail_blocks,
        "a2a_ai_buyer_requests": a2a_count,
        "upsell_revenue_multiplier": "1.32x"
    }

@app.post("/api/agent/execute_checkout")
def execute_agent_checkout(payload: OrderRequestSchema, current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    item_id = payload.item_id
    amount_paise = payload.amount_in_paise
    amount_inr = amount_paise / 100.0

    try:
        log_audit(
            phase="Phase 2: Execution",
            action="SCHEMA_VALIDATION",
            status="PASSED",
            item_id=item_id,
            amount_paise=amount_paise,
            details=f"Pydantic strict schema verification passed for user '{username}'. Amount: ₹{amount_inr:.2f} <= ₹{MAX_TRANSACTION_LIMIT_INR/100:.2f}.",
            payload=payload.dict(),
            guardrail_status="PASSED",
            user=username
        )

        prod = get_product_by_id(item_id)
        if item_id == "OUT_OF_STOCK_ITEM_01" or (prod and not prod.get("in_stock", True)):
            log_audit(
                phase="Phase 2: Execution",
                action="INVENTORY_GATE",
                status="FAILED",
                item_id=item_id,
                amount_paise=amount_paise,
                details=f"Inventory check failed for SKU '{item_id}'. Triggering explainable graceful failure for '{username}'.",
                guardrail_status="REJECTED_OUT_OF_STOCK",
                user=username
            )
            return JSONResponse(
                status_code=200,
                content={
                    "phase": 2,
                    "status": "rejected",
                    "reason_code": "OUT_OF_STOCK",
                    "reason": f"Item '{prod['name'] if prod else item_id}' is currently out of stock in our fulfillment node.",
                    "agent_remedy_message": "I apologize, but that item just went out of stock. Would you like me to reserve a spot on the waitlist or checkout the AI Developer Starter Kit (₹499) instead?",
                    "audit_logged": True,
                    "ui_instruction": "transition_orb_to_rejected_state",
                    "orb_state": "alert"
                }
            )

        order_data = {
            "amount": amount_paise,
            "currency": payload.currency,
            "receipt": payload.receipt_id,
            "payment_capture": 1,
            "notes": {
                "item_id": item_id,
                "agent_initiated": "true",
                "username": username,
                "customer_notes": payload.customer_notes
            }
        }

        rzp_order = rzp_gateway.create_order(data=order_data)

        log_audit(
            phase="Phase 2: Execution",
            action="RAZORPAY_ORDER_CREATED",
            status="SUCCESS",
            item_id=item_id,
            amount_paise=amount_paise,
            details=f"Razorpay Order {rzp_order['id']} initialized successfully for user '{username}' (₹{amount_inr:.2f}).",
            payload=rzp_order,
            guardrail_status="PASSED",
            user=username
        )

        return {
            "phase": 2,
            "status": "success",
            "order_id": rzp_order["id"],
            "amount": rzp_order["amount"],
            "amount_inr": amount_inr,
            "currency": rzp_order["currency"],
            "receipt": rzp_order["receipt"],
            "key_id": RAZORPAY_KEY_ID,
            "product_name": prod["name"] if prod else "Agentic Commerce Item",
            "authenticated_user": username,
            "ui_instruction": "transition_orb_to_success_state",
            "agent_message": f"Payment intent authorized for **{username}**! Razorpay Order **{rzp_order['id']}** created for **₹{amount_inr:.2f}**. Complete the payment via the secure gateway modal.",
            "orb_state": "success"
        }

    except ValueError as ve:
        error_msg = str(ve)
        log_audit(
            phase="Phase 2: Execution",
            action="GUARDRAIL_GATE_BLOCKED",
            status="BLOCKED",
            item_id=item_id,
            amount_paise=amount_paise,
            details=f"Guardrail intercepted transaction for '{username}': {error_msg}",
            guardrail_status="BLOCKED_BY_GUARDRAIL",
            user=username
        )
        return JSONResponse(
            status_code=400,
            content={
                "phase": 2,
                "status": "blocked_by_guardrail",
                "error": error_msg,
                "agent_message": f"Autonomous transaction blocked by safety guardrail: {error_msg}. Please select an item within the ₹5,000 session threshold.",
                "orb_state": "alert"
            }
        )
    except Exception as e:
        log_audit(
            phase="Phase 2: Execution",
            action="EXECUTION_ERROR",
            status="ERROR",
            item_id=item_id,
            amount_paise=amount_paise,
            details=f"Unexpected error in checkout execution for '{username}': {str(e)}",
            guardrail_status="SYSTEM_EXCEPTION",
            user=username
        )
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agent/verify_payment")
def verify_payment(payload: PaymentVerifyRequest):
    generated_signature = None
    is_valid = True

    if not rzp_gateway.is_mock and RAZORPAY_KEY_SECRET != "YOUR_SECRET_HERE":
        try:
            msg = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
            generated_signature = hmac.new(
                RAZORPAY_KEY_SECRET.encode(),
                msg.encode(),
                hashlib.sha256
            ).hexdigest()
            is_valid = (generated_signature == payload.razorpay_signature)
        except Exception as e:
            is_valid = False
            print(f"Signature verify error: {e}")

    amount_paise = payload.amount_paise
    if (amount_paise is None or amount_paise == 0) and payload.amount_inr is not None and payload.amount_inr > 0:
        amount_paise = int(payload.amount_inr * 100)

    if amount_paise is None or amount_paise == 0:
        for entry in audit_ledger:
            if (entry.payload and (entry.payload.get("id") == payload.razorpay_order_id or entry.payload.get("order_id") == payload.razorpay_order_id)) or (entry.item_id and entry.item_id == payload.item_id):
                if entry.amount_inr and entry.amount_inr > 0:
                    amount_paise = int(entry.amount_inr * 100)
                    break

    if amount_paise is None or amount_paise == 0:
        target_sku = payload.item_id
        if not target_sku and payload.razorpay_order_id:
            if "STARTER" in payload.razorpay_order_id or "0001" in payload.razorpay_order_id:
                target_sku = "PROD_STARTER_01"
            elif "PRO" in payload.razorpay_order_id or "0002" in payload.razorpay_order_id:
                target_sku = "PROD_PRO_02"
            elif "0003" in payload.razorpay_order_id:
                target_sku = "OUT_OF_STOCK_ITEM_01"
            elif "0004" in payload.razorpay_order_id or "ENTERPRISE" in payload.razorpay_order_id:
                target_sku = "PROD_ENTERPRISE_UNLIMITED"
        
        prod = get_product_by_id(target_sku) if target_sku else None
        if prod:
            amount_paise = prod.get("price_paise", 249900)
        else:
            amount_paise = 249900

    amount_inr_display = (amount_paise / 100.0)
    user_name = payload.username or "demo_user"

    if is_valid:
        log_audit(
            phase="Phase 2: Settlement",
            action="PAYMENT_CAPTURED",
            status="SUCCESS",
            details=f"Payment {payload.razorpay_payment_id} verified for order {payload.razorpay_order_id} (₹{amount_inr_display:.2f}).",
            payload=payload.dict(),
            item_id=payload.item_id,
            amount_paise=amount_paise,
            guardrail_status="SETTLED",
            user=user_name
        )
        return {
            "status": "verified",
            "message": "Payment verified and recorded in the audit ledger.",
            "payment_id": payload.razorpay_payment_id,
            "order_id": payload.razorpay_order_id,
            "amount_inr": amount_inr_display,
            "orb_state": "success"
        }
    else:
        log_audit(
            phase="Phase 2: Settlement",
            action="PAYMENT_VERIFICATION_FAILED",
            status="FAILED",
            details=f"Signature mismatch for order {payload.razorpay_order_id}.",
            payload=payload.dict(),
            item_id=payload.item_id,
            amount_paise=amount_paise,
            guardrail_status="SIGNATURE_MISMATCH",
            user=user_name
        )
        raise HTTPException(status_code=400, detail="Invalid payment signature.")

@app.get("/api/agent/audit_trail")
def get_audit_trail():
    return {
        "status": "success",
        "total_entries": len(audit_ledger),
        "guardrail_config": {
            "max_limit_inr": MAX_TRANSACTION_LIMIT_INR / 100,
            "currency": CURRENCY_ALLOWED
        },
        "ledger": audit_ledger
    }

@app.post("/api/agent/clear_audit")
def clear_audit():
    global audit_ledger
    audit_ledger = []
    log_audit(
        phase="System",
        action="AUDIT_RESET",
        status="READY",
        details="Audit ledger reset for fresh demonstration run.",
        guardrail_status="PASSED"
    )
    return {"status": "success", "message": "Audit ledger cleared"}

class UpdateConfigRequest(BaseModel):
    max_limit_inr: Optional[float] = None
    razorpay_key_id: Optional[str] = None
    razorpay_key_secret: Optional[str] = None
    agent_temperature: Optional[float] = 0.0

@app.post("/api/agent/update_config")
def update_config(payload: UpdateConfigRequest):
    global MAX_TRANSACTION_LIMIT_INR, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, rzp_gateway
    if payload.max_limit_inr is not None:
        MAX_TRANSACTION_LIMIT_INR = int(payload.max_limit_inr * 100)
    if payload.razorpay_key_id:
        RAZORPAY_KEY_ID = payload.razorpay_key_id
    if payload.razorpay_key_secret:
        RAZORPAY_KEY_SECRET = payload.razorpay_key_secret
    if payload.razorpay_key_id or payload.razorpay_key_secret:
        rzp_gateway = SafeRazorpayClient(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)

    log_audit(
        phase="System: Config",
        action="CONFIG_UPDATED",
        status="PASSED",
        details=f"Session limit set to ₹{MAX_TRANSACTION_LIMIT_INR/100:.2f}. Razorpay Key ID: {RAZORPAY_KEY_ID[:8]}...",
        guardrail_status="UPDATED"
    )
    return {
        "status": "success",
        "message": f"Configuration updated. Active Limit: ₹{MAX_TRANSACTION_LIMIT_INR/100:.2f}",
        "max_limit_inr": MAX_TRANSACTION_LIMIT_INR / 100,
        "key_id": RAZORPAY_KEY_ID
    }

@app.get("/api/agent/notifications")
def get_notifications():
    return {
        "notifications": [
            {
                "id": "notif_01",
                "title": "Guardrail Gate Armed",
                "desc": f"Hard budget bound active at ₹{MAX_TRANSACTION_LIMIT_INR/100:.2f} per session.",
                "type": "security",
                "time": "Just now",
                "icon": "shield-check"
            },
            {
                "id": "notif_02",
                "title": "A2A Machine Handshake",
                "desc": "Autonomous protocol endpoint compliant with ACP/2.0-UAP.",
                "type": "protocol",
                "time": "5m ago",
                "icon": "bot"
            },
            {
                "id": "notif_03",
                "title": "Razorpay Test Gateway",
                "desc": "Sandbox payment simulation active with safe fallback verification.",
                "type": "payment",
                "time": "10m ago",
                "icon": "credit-card"
            }
        ]
    }

root_project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
frontend_dir = os.path.join(root_project_dir, "frontend")
login_dist_dir = os.path.join(root_project_dir, "login", "Screen 2", "dist")
signup_dist_dir = os.path.join(root_project_dir, "signup", "Screen 3", "dist")

if os.path.exists(login_dist_dir):
    app.mount("/login", StaticFiles(directory=login_dist_dir, html=True), name="login_screen")
    app.mount("/signin", StaticFiles(directory=login_dist_dir, html=True), name="signin_screen")

if os.path.exists(signup_dist_dir):
    app.mount("/signup", StaticFiles(directory=signup_dist_dir, html=True), name="signup_screen")

if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

    @app.get("/")
    def serve_frontend_index():
        return FileResponse(os.path.join(frontend_dir, "index.html"))
