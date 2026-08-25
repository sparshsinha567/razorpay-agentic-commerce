# Secure Agentic Commerce Build: JWT Auth & Protected Execution

This document provides the complete, runnable code for both the FastAPI backend and the React frontend. It integrates the strict password/username guardrails with a JSON Web Token (JWT) system, ensuring that autonomous payment actions are firmly bounded and tied to an authenticated session.

---

## 1. Backend Implementation (`main.py`)

This fully runnable FastAPI application handles secure registration, JWT issuance upon login, and protects the Razorpay execution endpoint so that only authenticated users can trigger money actions.

### Requirements
```bash
pip install fastapi uvicorn pydantic razorpay passlib[bcrypt] pyjwt python-multipart
```

### Code
```python
import os
import re
import razorpay
from datetime import datetime, timedelta
from typing import Dict, Optional

from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, validator
from passlib.context import CryptContext
import jwt

# ---------------------------------------------------------
# CONFIGURATION & INITIALIZATION
# ---------------------------------------------------------
app = FastAPI(title="Secure Agentic Commerce API")

# Security Configuration
SECRET_KEY = "your-super-secret-jwt-key-replace-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Razorpay Configuration
RAZORPAY_KEY_ID = "rzp_test_YOUR_KEY_HERE"
RAZORPAY_KEY_SECRET = "YOUR_SECRET_HERE"
rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# In-memory DB for demonstration
user_db: Dict[str, dict] = {}
audit_ledger = []

# ---------------------------------------------------------
# SCHEMAS & GUARDRAILS
# ---------------------------------------------------------
USERNAME_REGEX = r"^[a-zA-Z0-9_]{3,20}$"
PASSWORD_REGEX = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,64}$"
MAX_TRANSACTION_LIMIT_INR = 500000  # ₹5,000.00 in paise

class SignUpSchema(BaseModel):
    username: str
    email: str = Field(..., regex=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    password: str

    @validator("username")
    def validate_username(cls, value):
        cleaned = value.strip().lower()
        if not re.match(USERNAME_REGEX, cleaned):
            raise ValueError("Username must be 3-20 chars (alphanumeric and _ only).")
        if cleaned in user_db:
            raise ValueError("Username already exists.")
        return cleaned

    @validator("password")
    def validate_password(cls, value):
        if not re.match(PASSWORD_REGEX, value):
            raise ValueError("Password must be 8+ chars with uppercase, lowercase, number, and symbol.")
        return value

class OrderRequestSchema(BaseModel):
    amount_in_paise: int = Field(..., description="Total amount in paise. Must be > 100.")
    currency: str = Field(default="INR", regex="^INR$")
    receipt_id: str
    item_id: str
    
    @validator("amount_in_paise")
    def check_budget_limit(cls, value):
        if value > MAX_TRANSACTION_LIMIT_INR:
            raise ValueError(f"Transaction exceeds session limit of ₹{MAX_TRANSACTION_LIMIT_INR/100}")
        return value

def log_audit(username: str, action: str, status: str, details: str):
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "user": username,
        "action": action,
        "status": status,
        "details": details
    }
    audit_ledger.append(entry)
    print(f"[AUDIT] {entry}")

# ---------------------------------------------------------
# AUTHENTICATION DEPENDENCIES
# ---------------------------------------------------------
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = user_db.get(username)
    if user is None:
        raise credentials_exception
    return user

# ---------------------------------------------------------
# API ENDPOINTS
# ---------------------------------------------------------
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(payload: SignUpSchema):
    hashed_password = pwd_context.hash(payload.password)
    user_db[payload.username] = {
        "username": payload.username,
        "email": payload.email,
        "hashed_password": hashed_password
    }
    return {"status": "success", "message": "Account created."}

@app.post("/api/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    clean_username = form_data.username.strip().lower()
    user = user_db.get(clean_username)
    
    if not user or not pwd_context.verify(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
        
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/agent/execute_checkout")
def execute_checkout(payload: OrderRequestSchema, current_user: dict = Depends(get_current_user)):
    """Protected endpoint: Only authenticated sessions can trigger this."""
    try:
        if payload.item_id == "OUT_OF_STOCK_ITEM_01":
            log_audit(current_user["username"], "create_order", "FAILED", "Graceful failure: Out of stock.")
            return {"status": "rejected", "reason": "Item out of stock."}

        order_data = {
            "amount": payload.amount_in_paise,
            "currency": payload.currency,
            "receipt": payload.receipt_id,
            "payment_capture": 1
        }
        
        rzp_order = rzp_client.order.create(data=order_data)
        
        log_audit(current_user["username"], "create_order", "SUCCESS", f"Order {rzp_order['id']} created.")
        
        return {
            "status": "success",
            "order_id": rzp_order["id"],
            "amount": rzp_order["amount"]
        }
    except Exception as e:
        log_audit(current_user["username"], "create_order", "ERROR", str(e))
        raise HTTPException(status_code=400, detail=str(e))
```

---

## 2. Frontend Implementation (`CustomerAuth.jsx`)

This React component interfaces with the backend. It handles form state, validates the strict guardrails client-side for immediate feedback, and requests the JWT token on login.

```javascript
import React, { useState } from 'react';
import { User, Lock, Mail, ShieldCheck, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function CustomerAuth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,64}$/;

    if (!usernameRegex.test(formData.username)) return "Username must be 3-20 chars (alphanumeric and _ only).";
    if (isSignUp) {
      if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) return "Please enter a valid email address.";
      if (!passwordRegex.test(formData.password)) return "Password requires 8+ chars with uppercase, lowercase, number & symbol.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // REGISTER FLOW
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: formData.username, email: formData.email, password: formData.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail?.[0]?.msg || data.detail || 'Registration failed');
        
        setSuccessMessage('Registration complete! Please sign in.');
        setIsSignUp(false);
        setFormData(prev => ({ ...prev, password: '' }));
      } else {
        // LOGIN FLOW (OAuth2 expects form-urlencoded data for password flows)
        const params = new URLSearchParams();
        params.append('username', formData.username);
        params.append('password', formData.password);

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Login failed');

        // Store JWT token locally
        localStorage.setItem('agent_jwt_token', data.access_token);
        if (onAuthSuccess) onAuthSuccess(data.access_token);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 mb-3">
            <Sparkles className="text-indigo-400" size={22} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-400">
            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 text-gray-500" size={16} />
              <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60" />
            </div>
          </div>
          
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-gray-500" size={16} />
                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-gray-500" size={16} />
              <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60" />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full mt-2 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50">
            {isLoading ? 'Verifying...' : (isSignUp ? 'Create Account' : 'Sign In')}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(''); setSuccessMessage(''); }} className="text-indigo-400 hover:text-indigo-300 font-medium underline ml-1">
            {isSignUp ? 'Already have an account? Sign In' : 'Don\'t have an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 3. Usage: Triggering an Authenticated Payment Request

Once the user is authenticated and the token is stored locally, any payment logic executed by the agent must inject the `Bearer` token into the request headers. 

```javascript
// Example frontend execution logic (after intent reasoning is complete)
async function triggerAgentPayment(cartTotalPaise, itemId) {
  const token = localStorage.getItem('agent_jwt_token');
  
  const response = await fetch('/api/agent/execute_checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Protects the API
    },
    body: JSON.stringify({
      amount_in_paise: cartTotalPaise,
      currency: "INR",
      receipt_id: `rcpt_${Date.now()}`,
      item_id: itemId
    })
  });

  return await response.json();
}
```
