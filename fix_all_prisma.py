#!/usr/bin/env python3

import os
import re

files = [
    "app/api/webhooks/payment/route.ts",
    "app/api/profile/route.ts",
    "app/api/jobs/close-invoices/route.ts",
    "app/api/proposals/route.ts",
    "app/api/boosts/route.ts",
    "app/api/test-db/route.ts",
    "app/api/matches/route.ts",
    "app/api/jobs/boost-outbound/route.ts",
    "app/api/invoices/route.ts",
    "app/api/click/route.ts",
]

for filepath in files:
    print(f"Processing {filepath}...")
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Remove any existing prisma import
    content = re.sub(r'^import \{ prisma \} from.*\n', '', content, flags=re.MULTILINE)
    
    # Find all export async functions and add prisma import at the beginning
    def add_prisma(match):
        func_line = match.group(0)
        indent = '  '
        # Check if prisma import already exists
        if 'getPrisma' in match.group(0):
            return func_line
        return func_line + f'\n{indent}const {{ getPrisma }} = await import("@/lib/db-dynamic");\n{indent}const prisma = await getPrisma();'
    
    # Match export async function declarations
    content = re.sub(
        r'^export async function (?:GET|POST|PUT|DELETE|PATCH)\([^)]*\) \{',
        add_prisma,
        content,
        flags=re.MULTILINE
    )
    
    with open(filepath, 'w') as f:
        f.write(content)
    
print("All files updated!")
