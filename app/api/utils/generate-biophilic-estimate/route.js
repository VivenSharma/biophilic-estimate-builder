import { NextResponse } from 'next/server'
import { generateBiophilicEstimatePDF } from '@/lib/pdf/biophilicEstimateGenerator'

export const runtime = 'nodejs'

function isSameOriginRequest(request) {
  const requestUrl = new URL(request.url)
  const host = request.headers.get('host')
  const forwardedHost = request.headers.get('x-forwarded-host')
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const allowedHosts = new Set([requestUrl.host, host, forwardedHost].filter(Boolean))
  const isLocalHost = value => ['localhost', '127.0.0.1'].includes(value.split(':')[0])
  const hostMatches = incomingHost => {
    if (allowedHosts.has(incomingHost)) return true
    return isLocalHost(incomingHost) && [...allowedHosts].some(isLocalHost)
  }

  if (origin) {
    try {
      return hostMatches(new URL(origin).host)
    } catch {
      return false
    }
  }

  if (referer) {
    try {
      return hostMatches(new URL(referer).host)
    } catch {
      return false
    }
  }

  const internalApiKey = process.env.INTERNAL_API_KEY
  if (!internalApiKey) return true

  return request.headers.get('x-internal-api-key') === internalApiKey
}

export async function POST(request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Forbidden request origin' }, { status: 403 })
    }

    const body = await request.json()
    const required = ['clientName', 'projectName', 'estimateDate', 'projectRef']
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }
    const pdfBuffer = await generateBiophilicEstimatePDF(body)
    const safeName = (body.clientName || 'estimate').replace(/[^a-zA-Z0-9]/g, '_')
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="KV_EST_${safeName}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('[generate-biophilic-estimate]', err)
    return NextResponse.json({ error: 'Failed to generate PDF', details: err.message }, { status: 500 })
  }
}
