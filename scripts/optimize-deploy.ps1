Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$root = (Resolve-Path "$PSScriptRoot\..").Path
$staging = "$root\temp_deploy_staging"
$zipPath = "$root\deploy.zip"

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

New-Item -ItemType Directory -Path $staging | Out-Null
New-Item -ItemType Directory -Path "$staging\.output" | Out-Null

Write-Host "Copying .output/server..."
Copy-Item "$root\.output\server" "$staging\.output\server" -Recurse

Write-Host "Copying .output/nitro.json..."
if (Test-Path "$root\.output\nitro.json") { Copy-Item "$root\.output\nitro.json" "$staging\.output\nitro.json" }

Write-Host "Copying .output/public..."
Copy-Item "$root\.output\public" "$staging\.output\public" -Recurse

Write-Host "Removing heavy video mockups/media (*.mp4, *.webm)..."
Get-ChildItem -Path "$staging\.output\public" -Recurse -Include *.mp4, *.webm | Remove-Item -Force

Write-Host "Optimizing oversized mockups/images (> 1MB)..."
$encoderJpg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }

Get-ChildItem -Path "$staging\.output\public" -Recurse -File | Where-Object { $_.Length -gt 1MB } | ForEach-Object {
    $filePath = $_.FullName
    $ext = $_.Extension.ToLower()
    try {
        $img = [System.Drawing.Image]::FromFile($filePath)
        $w = $img.Width
        $h = $img.Height
        
        # Scale down if width > 1920
        $newW = $w
        $newH = $h
        if ($w -gt 1920) {
            $newW = 1920
            $newH = [int]($h * (1920.0 / $w))
        }
        
        $bmp = New-Object System.Drawing.Bitmap($newW, $newH)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($img, 0, 0, $newW, $newH)
        $g.Dispose()
        $img.Dispose()
        
        # Save as optimized JPG (quality 75)
        $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]75)
        
        $tempOut = "$filePath.tmp"
        $bmp.Save($tempOut, $encoderJpg, $encParams)
        $bmp.Dispose()
        
        if ((Get-Item $tempOut).Length -lt (Get-Item $filePath).Length) {
            Remove-Item $filePath -Force
            Move-Item $tempOut $filePath -Force
            Write-Host "Optimized: $($_.Name) -> $([math]::Round((Get-Item $filePath).Length/1KB,1)) KB"
        } else {
            Remove-Item $tempOut -Force
        }
    } catch {
        Write-Warning "Could not optimize $($_.Name): $_"
    }
}

Write-Host "Copying root config files..."
if (Test-Path "$root\package.json") { Copy-Item "$root\package.json" "$staging\package.json" }
if (Test-Path "$root\package-lock.json") { Copy-Item "$root\package-lock.json" "$staging\package-lock.json" }
if (Test-Path "$root\.env") { Copy-Item "$root\.env" "$staging\.env" }
if (Test-Path "$root\src\server.ts") { Copy-Item "$root\src\server.ts" "$staging\server.ts" }
if (Test-Path "$root\src\start.ts") { Copy-Item "$root\src\start.ts" "$staging\start.ts" }

Write-Host "Compressing deploy.zip with Optimal compression..."
[System.IO.Compression.ZipFile]::CreateFromDirectory($staging, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)

Remove-Item $staging -Recurse -Force

$finalSize = [math]::Round(((Get-Item $zipPath).Length / 1MB), 2)
Write-Host "--------------------------------------------"
Write-Host "SUCCESS! Generated deploy.zip"
Write-Host "Final File Size: $finalSize MB"
Write-Host "--------------------------------------------"
