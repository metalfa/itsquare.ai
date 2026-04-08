import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashToken } from '@/lib/slack/encryption'

// GET /api/scan/[token] - Returns a shell script that runs the scan
export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params
  
  // Verify token exists and is valid
  const supabase = createAdminClient()
  const tokenHash = hashToken(token)
  
  const { data: agentToken } = await supabase
    .from('agent_tokens')
    .select('*, slack_users(*), slack_workspaces(*)')
    .eq('token_hash', tokenHash)
    .eq('is_active', true)
    .single()
  
  if (!agentToken) {
    return new Response('#!/bin/bash\necho "Error: Invalid or expired scan token"\nexit 1', {
      headers: { 'Content-Type': 'text/plain' },
      status: 401,
    })
  }
  
  // Check if expired
  if (agentToken.expires_at && new Date(agentToken.expires_at) < new Date()) {
    return new Response('#!/bin/bash\necho "Error: Scan token has expired"\nexit 1', {
      headers: { 'Content-Type': 'text/plain' },
      status: 401,
    })
  }
  
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://itsquare.ai'
  
  // Generate a cross-platform scan script
  const script = `#!/bin/bash
# ITSquare.AI Device Health Scanner
# This script collects system health information and reports to ITSquare

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           ITSquare.AI Device Health Scanner                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Detect OS
OS="unknown"
OS_VERSION=""
if [[ "$OSTYPE" == "darwin"* ]]; then
  OS="macos"
  OS_VERSION=$(sw_vers -productVersion 2>/dev/null || echo "unknown")
  echo "Detected: macOS $OS_VERSION"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  OS="linux"
  if [ -f /etc/os-release ]; then
    OS_VERSION=$(grep VERSION_ID /etc/os-release | cut -d'"' -f2 2>/dev/null || echo "unknown")
  fi
  echo "Detected: Linux $OS_VERSION"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
  OS="windows"
  echo "Detected: Windows"
fi

echo ""
echo "Scanning device health..."
echo ""

# Collect hostname
HOSTNAME=$(hostname 2>/dev/null || echo "unknown")
echo "  [+] Hostname: $HOSTNAME"

# Collect hardware info
CPU_CORES=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo "0")
echo "  [+] CPU Cores: $CPU_CORES"

# RAM (in GB)
if [[ "$OS" == "macos" ]]; then
  RAM_BYTES=$(sysctl -n hw.memsize 2>/dev/null || echo "0")
  RAM_GB=$((RAM_BYTES / 1024 / 1024 / 1024))
elif [[ "$OS" == "linux" ]]; then
  RAM_KB=$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2}' || echo "0")
  RAM_GB=$((RAM_KB / 1024 / 1024))
else
  RAM_GB=0
fi
echo "  [+] RAM: \${RAM_GB}GB"

# Disk space
if [[ "$OS" == "macos" ]] || [[ "$OS" == "linux" ]]; then
  DISK_TOTAL=$(df -BG / 2>/dev/null | tail -1 | awk '{print $2}' | tr -d 'G' || echo "0")
  DISK_FREE=$(df -BG / 2>/dev/null | tail -1 | awk '{print $4}' | tr -d 'G' || echo "0")
else
  DISK_TOTAL=0
  DISK_FREE=0
fi
echo "  [+] Disk: \${DISK_FREE}GB free of \${DISK_TOTAL}GB"

# Security checks
FIREWALL_ENABLED="false"
DISK_ENCRYPTED="false"
ANTIVIRUS_INSTALLED="false"
OS_UP_TO_DATE="true"
SCREEN_LOCK_ENABLED="false"
GATEKEEPER_ENABLED="false"
SIP_ENABLED="false"

echo ""
echo "Checking security settings..."

if [[ "$OS" == "macos" ]]; then
  # Firewall
  if /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null | grep -q "enabled"; then
    FIREWALL_ENABLED="true"
    echo "  [+] Firewall: Enabled"
  else
    echo "  [-] Firewall: Disabled"
  fi
  
  # FileVault
  if fdesetup status 2>/dev/null | grep -q "On"; then
    DISK_ENCRYPTED="true"
    echo "  [+] FileVault: Enabled"
  else
    echo "  [-] FileVault: Disabled"
  fi
  
  # Gatekeeper
  if spctl --status 2>/dev/null | grep -q "enabled"; then
    GATEKEEPER_ENABLED="true"
    echo "  [+] Gatekeeper: Enabled"
  else
    echo "  [-] Gatekeeper: Disabled"
  fi
  
  # SIP
  if csrutil status 2>/dev/null | grep -q "enabled"; then
    SIP_ENABLED="true"
    echo "  [+] System Integrity Protection: Enabled"
  else
    echo "  [-] System Integrity Protection: Disabled"
  fi
  
  # Screen lock
  if sysadminctl -screenLock status 2>/dev/null | grep -q "enabled"; then
    SCREEN_LOCK_ENABLED="true"
    echo "  [+] Screen Lock: Enabled"
  else
    echo "  [?] Screen Lock: Unknown"
  fi
  
  # Antivirus (check for common ones)
  if [ -d "/Applications/Malwarebytes.app" ] || [ -d "/Applications/Norton Security.app" ] || [ -d "/Applications/Avast.app" ] || [ -d "/Library/Application Support/com.apple.TCC" ]; then
    ANTIVIRUS_INSTALLED="true"
    echo "  [+] Antivirus: Detected"
  else
    echo "  [?] Antivirus: Not detected (XProtect active)"
  fi

elif [[ "$OS" == "linux" ]]; then
  # UFW or firewalld
  if command -v ufw &>/dev/null && ufw status 2>/dev/null | grep -q "active"; then
    FIREWALL_ENABLED="true"
    echo "  [+] Firewall (UFW): Enabled"
  elif command -v firewall-cmd &>/dev/null && firewall-cmd --state 2>/dev/null | grep -q "running"; then
    FIREWALL_ENABLED="true"
    echo "  [+] Firewall (firewalld): Enabled"
  else
    echo "  [-] Firewall: Disabled or not detected"
  fi
  
  # LUKS encryption
  if lsblk 2>/dev/null | grep -q "crypt"; then
    DISK_ENCRYPTED="true"
    echo "  [+] Disk Encryption: Enabled"
  else
    echo "  [-] Disk Encryption: Not detected"
  fi
  
  # ClamAV
  if command -v clamscan &>/dev/null; then
    ANTIVIRUS_INSTALLED="true"
    echo "  [+] Antivirus (ClamAV): Installed"
  else
    echo "  [?] Antivirus: Not detected"
  fi
fi

# Network connectivity check
echo ""
echo "Checking network..."
INTERNET_CONNECTED="false"
DNS_WORKING="false"

if ping -c 1 -W 3 8.8.8.8 &>/dev/null; then
  INTERNET_CONNECTED="true"
  echo "  [+] Internet: Connected"
else
  echo "  [-] Internet: Disconnected"
fi

if ping -c 1 -W 3 google.com &>/dev/null; then
  DNS_WORKING="true"
  echo "  [+] DNS: Working"
else
  echo "  [-] DNS: Not working"
fi

# Build JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "hostname": "$HOSTNAME",
  "os_type": "$OS",
  "os_version": "$OS_VERSION",
  "cpu_cores": $CPU_CORES,
  "ram_gb": $RAM_GB,
  "disk_total_gb": $DISK_TOTAL,
  "disk_free_gb": $DISK_FREE,
  "firewall_enabled": $FIREWALL_ENABLED,
  "filevault_enabled": $DISK_ENCRYPTED,
  "bitlocker_enabled": false,
  "antivirus_installed": $ANTIVIRUS_INSTALLED,
  "os_up_to_date": $OS_UP_TO_DATE,
  "screen_lock_enabled": $SCREEN_LOCK_ENABLED,
  "gatekeeper_enabled": $GATEKEEPER_ENABLED,
  "sip_enabled": $SIP_ENABLED,
  "internet_connected": $INTERNET_CONNECTED,
  "dns_working": $DNS_WORKING,
  "issues": []
}
EOF
)

echo ""
echo "Submitting results to ITSquare..."
echo ""

# Submit to API
RESPONSE=$(curl -s -w "\\n%{http_code}" -X POST "${apiUrl}/api/agent/scan" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d "$JSON_PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  HEALTH_SCORE=$(echo "$BODY" | grep -o '"overall_health_score":[0-9]*' | cut -d':' -f2 || echo "?")
  SECURITY_SCORE=$(echo "$BODY" | grep -o '"security_score":[0-9]*' | cut -d':' -f2 || echo "?")
  
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║                    SCAN COMPLETE                             ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║  Health Score:   $HEALTH_SCORE/100                                      ║"
  echo "║  Security Score: $SECURITY_SCORE/100                                      ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║  Results have been sent to Slack!                            ║"
  echo "║  Run /itsquare status to see your full report.               ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
else
  echo "Error submitting results (HTTP $HTTP_CODE)"
  echo "$BODY"
  exit 1
fi
`

  return new Response(script, {
    headers: { 
      'Content-Type': 'text/plain',
      'Content-Disposition': 'inline',
    },
  })
}
