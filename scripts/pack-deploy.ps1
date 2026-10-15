Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$zipPath = "$PSScriptRoot\..\deploy.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

function Add-FileToZip($file, $entryName) {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file, $entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
}

function Add-FolderToZip($folder, $basePrefix) {
    Get-ChildItem -Path $folder -Recurse -File | ForEach-Object {
        # Check exclusion: exclude videos (*.mp4, *.webm)
        if ($_.Extension -match '\.(mp4|webm)$') {
            return
        }
        $rel = $_.FullName.Substring($folder.Length).TrimStart('\', '/')
        $entry = "$basePrefix/$rel" -replace '\\', '/'
        Add-FileToZip $_.FullName $entry
    }
}

# Add root required files
$root = (Resolve-Path "$PSScriptRoot\..").Path
Write-Host "Adding root files..."
if (Test-Path "$root\package.json") { Add-FileToZip "$root\package.json" "package.json" }
if (Test-Path "$root\package-lock.json") { Add-FileToZip "$root\package-lock.json" "package-lock.json" }
if (Test-Path "$root\.env") { Add-FileToZip "$root\.env" ".env" }
if (Test-Path "$root\src\server.ts") { Add-FileToZip "$root\src\server.ts" "server.ts" }
if (Test-Path "$root\src\start.ts") { Add-FileToZip "$root\src\start.ts" "start.ts" }

# Add .output folder
Write-Host "Adding .output..."
Add-FolderToZip "$root\.output" ".output"

$zip.Dispose()

$sizeMB = [math]::Round(((Get-Item $zipPath).Length / 1MB), 2)
Write-Host "Created deploy.zip successfully!"
Write-Host "Archive size: $sizeMB MB"
