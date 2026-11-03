@echo off
title Smart Food Donation System - Database Seeder
color 0E

echo ===================================================================
echo     SMART FOOD DONATION SYSTEM - SEED SAMPLE DEMO DATA
echo ===================================================================
echo.
echo Running seed script to populate realistic Admin, Donors, NGOs, and Donations...
echo.

node backend/seed.js

echo.
echo ===================================================================
echo Database seeding complete! You can now log in using demo accounts.
echo ===================================================================
pause
