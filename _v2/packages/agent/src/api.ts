import type { DeviceScanResult, ScanResponse } from './types.js'

const DEFAULT_API_URL = 'https://itsquare.ai'

export async function submitScan(
  scanData: DeviceScanResult,
  token: string,
  apiUrl: string = DEFAULT_API_URL
): Promise<ScanResponse> {
  const url = `${apiUrl}/api/agent/scan`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(scanData),
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    return {
      success: false,
      error: data.error || `Request failed with status ${response.status}`,
    }
  }
  
  return data as ScanResponse
}

export async function getLatestScan(
  token: string,
  apiUrl: string = DEFAULT_API_URL
): Promise<{ scan?: DeviceScanResult; error?: string }> {
  const url = `${apiUrl}/api/agent/scan`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    return { error: data.error || `Request failed with status ${response.status}` }
  }
  
  return { scan: data.scan }
}
