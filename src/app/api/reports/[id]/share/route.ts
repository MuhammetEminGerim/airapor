import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

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

    if (action === 'enable') {
        const { data, error } = await supabase
            .from('reports')
            .update({ is_public: true })
            .eq('id', id)
            .eq('user_id', user.id)
            .select('share_token')
            .single()

        if (error) throw error
        return NextResponse.json({ success: true, share_token: data.share_token })
    } else {
        const { error } = await supabase
            .from('reports')
            .update({ is_public: false })
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
