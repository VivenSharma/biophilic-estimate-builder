import { NextResponse } from 'next/server'
import { generateBiophilicEstimatePDF } from '@/lib/pdf/biophilicEstimateGenerator'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
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
