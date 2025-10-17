import { createSampleData, cleanupSampleData } from '@/lib/utils/seed-data'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { action } = await request.json()
    
    if (action === 'seed') {
      const result = await createSampleData()
      return NextResponse.json(result)
    } else if (action === 'cleanup') {
      const result = await cleanupSampleData()
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid action. Use "seed" or "cleanup"' 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Seed Data API',
    usage: {
      'POST /api/seed-data': 'Create or cleanup sample data',
      body: {
        seed: '{"action": "seed"}',
        cleanup: '{"action": "cleanup"}'
      }
    }
  })
}