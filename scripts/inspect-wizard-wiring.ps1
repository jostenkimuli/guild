$ErrorActionPreference = "Stop"
$quotedRoot = "C:\Users\josef\Documents\Default Project\theguild"
$preview = Join-Path $quotedRoot "src\components\playground\curriculum-admin-preview.tsx"
$wizard = Join-Path $quotedRoot "src\components\playground\document-onboarding-dialog.tsx"

"=== SECTION 1: does the parent reference the wizard at all? ==="
$matches = Select-String -LiteralPath $preview -Pattern "DocumentOnboardingDialog|OnboardingStructureType|onboarding|DocumentOnboarding"
if ($matches) {
    $matches | ForEach-Object { "{0,5}: {1}" -f $_.LineNumber, ($_.Line.Trim()) }
} else {
    "NOT WIRED - zero references in parent"
}

""
"=== SECTION 2: root entry component + related selection state ==="
Select-String -LiteralPath $preview -Pattern "export function |createNationalTemplateDraft|createThematicCurriculumDraft|mockNationalTemplates|mockThematicCurricula|setTemplateId\b|setThematicId\b|selectedTemplateId|selectedThematicId" | ForEach-Object { "{0,5}: {1}" -f $_.LineNumber, ($_.Line.Trim()) }

""
"=== SECTION 3: imports at top of parent (first 30 lines) ==="
Get-Content -LiteralPath $preview -TotalCount 64 | Select-String -Pattern "^import" | ForEach-Object { "{0}: {1}" -f $_.LineNumber, ($_.Line.Trim()) }
