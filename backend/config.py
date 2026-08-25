import os
from dotenv import load_dotenv

load_dotenv()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_AiCommerceDemoKey")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "AiCommerceSecret2026")

MAX_TRANSACTION_LIMIT_INR = 500000
CURRENCY_ALLOWED = "INR"
