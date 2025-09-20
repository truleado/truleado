#!/bin/bash

echo "Applying database trigger for user signup..."

# Read the SQL file and apply it
psql "$DATABASE_URL" -f fix-user-signup-trigger.sql

echo "Database trigger applied successfully!"
echo "Now create a new account to test the trial system."
