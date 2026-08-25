import os
from dotenv import load_dotenv

load_dotenv()

# Razorpay credentials (falls back to demo test credentials or mock test provider if real key is not provided)
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_AiCommerceDemoKey")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "AiCommerceSecret2026")

# Session-level hard guardrails
MAX_TRANSACTION_LIMIT_INR = 500000  # ₹5,000.00 (in paise)
CURRENCY_ALLOWED = "INR"
