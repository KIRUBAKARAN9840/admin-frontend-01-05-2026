import re

file_path = '../backend/production_backend/app/fittbot_admin_api/revenue_service.py'
with open(file_path, 'r') as f:
    content = f.read()

# Make start_date and end_date Optional in function signatures
content = re.sub(r'start_date:\s*date\s*,', r'start_date: Optional[date] = None,', content)
content = re.sub(r'end_date:\s*date\s*,', r'end_date: Optional[date] = None,', content)

# Conditionally apply all date filters using literal(True) if date is None
content = re.sub(r'(func\.date\([A-Za-z_]+\.[a-z_]+\)\s*>=\s*start_date)(?! if)', r'\1 if start_date else literal(True)', content)
content = re.sub(r'(func\.date\([A-Za-z_]+\.[a-z_]+\)\s*<=\s*end_date)(?! if)', r'\1 if end_date else literal(True)', content)

# For get_amortized_gym_membership_revenue: target_month_start and target_month_end
content = re.sub(r'target_month_start:\s*date\s*,', r'target_month_start: Optional[date] = None,', content)
content = re.sub(r'target_month_end:\s*date\s*,', r'target_month_end: Optional[date] = None,', content)

# But target_month_start is used in Python logic like:
# validity_end_date >= target_month_start and payment_date <= target_month_end
# We should change it to:
# (not target_month_start or validity_end_date >= target_month_start) and (not target_month_end or payment_date <= target_month_end)
content = content.replace(
    'if validity_end_date >= target_month_start and payment_date <= target_month_end:',
    'if (not target_month_start or validity_end_date >= target_month_start) and (not target_month_end or payment_date <= target_month_end):'
)

# And in get_amortized_fittbot_subscription_revenue
content = content.replace(
    'func.date(Payment.captured_at) >= target_month_start,',
    'func.date(Payment.captured_at) >= target_month_start if target_month_start else literal(True),'
)
content = content.replace(
    'func.date(Payment.captured_at) <= target_month_end,',
    'func.date(Payment.captured_at) <= target_month_end if target_month_end else literal(True),'
)

# Also ensure literal is imported
if 'from sqlalchemy import literal' not in content:
    content = content.replace('from sqlalchemy import func, and_, select, or_, distinct, cast, Integer', 
                              'from sqlalchemy import func, and_, select, or_, distinct, cast, Integer, literal')

with open(file_path, 'w') as f:
    f.write(content)

print("Updated revenue_service.py successfully!")
