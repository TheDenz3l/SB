#!/bin/bash

# List of all API route files that import prisma
FILES=(
  "app/api/webhooks/payment/route.ts"
  "app/api/profile/route.ts"
  "app/api/jobs/close-invoices/route.ts"
  "app/api/proposals/route.ts"
  "app/api/boosts/route.ts"
  "app/api/test-db/route.ts"
  "app/api/matches/route.ts"
  "app/api/jobs/boost-outbound/route.ts"
  "app/api/invoices/route.ts"
  "app/api/click/route.ts"
)

for file in "${FILES[@]}"; do
  echo "Processing $file..."
  
  # Remove the prisma import line
  sed -i '' '/import { prisma } from "@\/lib\/db";/d' "$file"
  
  # Find the first function (GET, POST, etc.) and add dynamic import at the beginning
  # This is a bit tricky with sed, so we'll use a different approach
  
  # Create a temporary file with the modified content
  awk '
    /^export async function (GET|POST|PUT|DELETE|PATCH)/ {
      if (!imported) {
        print $0
        print "  const { getPrisma } = await import(\"@/lib/db-dynamic\");"
        print "  const prisma = await getPrisma();"
        imported = 1
        next
      }
    }
    {print}
  ' "$file" > "$file.tmp"
  
  # Replace the original file
  mv "$file.tmp" "$file"
done

echo "All files updated!"
