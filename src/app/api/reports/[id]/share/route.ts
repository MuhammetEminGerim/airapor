import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

const SHARE_LINK_TTL_DAYS = 7

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json(
            { error: 'Oturum açmanız gerekiyor.' },
            { status: 401 }
        )
    }

    const { id } = await params
    const { action } = await req.json() // 'enable' or 'disable'
    const shouldEnable = action === 'enable'
    const shouldDisable = action === 'disable'

    if (!shouldEnable && !shouldDisable) {
      return NextResponse.json(
        { error: 'Gecersiz paylasim aksiyonu.' },
        { status: 400 }
      )
    }

    if (shouldEnable) {
        const newShareToken = randomUUID()
        const shareExpiresAt = new Date(Date.now() + SHARE_LINK_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
        const { data, error } = await supabase
            .from('reports')
            .update({ is_public: true, share_token: newShareToken, share_expires_at: shareExpiresAt })
            .eq('id', id)
            .eq('user_id', user.id)
            .select('share_token, share_expires_at')
            .single()

        if (error) throw error
        return NextResponse.json({
          success: true,
          share_token: data.share_token,
          share_expires_at: data.share_expires_at,
          ttl_days: SHARE_LINK_TTL_DAYS,
        })
    } else {
        // Rotate token on disable so previously shared links are revoked.
        const newShareToken = randomUUID()
        const { error } = await supabase
            .from('reports')
            .update({ is_public: false, share_token: newShareToken, share_expires_at: null })
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) throw error
        return NextResponse.json({ success: true })
    }

  } catch (error) {
    console.error('Share Action Error:', error)
    return NextResponse.json(
      { error: 'Paylaşım ayarları güncellenirken hata oluştu.' },
      { status: 500 }
    )
  }
}
