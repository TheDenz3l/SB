#!/usr/bin/env python3

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
    print(f"Cleaning {filepath}...")
    
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    # Remove duplicate consecutive getPrisma/prisma lines
    cleaned_lines = []
    skip_next = False
    
    for i, line in enumerate(lines):
        if skip_next:
            skip_next = False
            continue
            
        # Check if this is a getPrisma line followed by another identical one
        if 'const { getPrisma }' in line and i < len(lines) - 2:
            if 'const { getPrisma }' in lines[i+2]:
                # Skip the next 2 lines (the duplicate)
                cleaned_lines.append(line)
                cleaned_lines.append(lines[i+1])
                skip_next = True
                continue
        
        cleaned_lines.append(line)
    
    with open(filepath, 'w') as f:
        f.writelines(cleaned_lines)
    
print("Duplicates removed!")
