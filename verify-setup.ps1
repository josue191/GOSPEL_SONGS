# Verification Script - Artist Registration Interface
# This script verify that all necessary files are in place

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALLATION VERIFICATION" -ForegroundColor Cyan
Write-Host "  Artist Registration Interface" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Verification function
function Test-FileExists {
    param($Path, $Description)
    if (Test-Path $Path) {
        Write-Host "V $Description" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "X $Description - MISSING" -ForegroundColor Red
        return $false
    }
}

Write-Host "1. Checking main files..." -ForegroundColor Yellow
Write-Host ""

# Check registration file
$allGood = (Test-FileExists "app\(artist)\auth\register.tsx" "Registration Interface (register.tsx)") -and $allGood

# Check migrations
Write-Host ""
Write-Host "2. Checking SQL migrations..." -ForegroundColor Yellow
Write-Host ""
$allGood = (Test-FileExists "supabase\migrations\04_artist_registration_fields.sql" "Migration 04 - Artist Fields") -and $allGood
$allGood = (Test-FileExists "supabase\migrations\05_storage_verification_documents.sql" "Migration 05 - Storage Documents") -and $allGood
$allGood = (Test-FileExists "supabase\migrations\06_device_tokens.sql" "Migration 06 - Device Tokens") -and $allGood

# Check documentation
Write-Host ""
Write-Host "3. Checking documentation..." -ForegroundColor Yellow
Write-Host ""
$allGood = (Test-FileExists "STATUS.md" "Status File") -and $allGood

# Check package.json
Write-Host ""
Write-Host "4. Checking dependencies..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    
    if ($packageJson.dependencies."expo-image-picker") {
        Write-Host "V expo-image-picker installed" -ForegroundColor Green
    }
    else {
        Write-Host "X expo-image-picker NOT installed" -ForegroundColor Red
        $allGood = $false
    }
    
    if ($packageJson.dependencies."@expo/vector-icons" -or $packageJson.dependencies."expo") {
        Write-Host "V Ionicons available (via Expo)" -ForegroundColor Green
    }
    else {
        Write-Host "! Check if Ionicons is available" -ForegroundColor Yellow
    }
}
else {
    Write-Host "X package.json NOT found" -ForegroundColor Red
    $allGood = $false
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "  V EVERYTHING IS IN PLACE !" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Testing the application: npm start" -ForegroundColor White
}
else {
    Write-Host "  X SOME FILES ARE MISSING" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please check the missing files above." -ForegroundColor Yellow
}
Write-Host ""
