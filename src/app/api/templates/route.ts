import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json(
            { error: 'Oturum açmanız gerekiyor.' },
            { status: 401 }
        )
    }

    const { data: templates, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Templates GET Error:', error)
    return NextResponse.json(
      { error: 'Şablonlar getirilirken bir hata oluştu.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json(
            { error: 'Oturum açmanız gerekiyor.' },
            { status: 401 }
        )
    }

    const { name, system_prompt, icon } = await req.json()

    if (!name || !system_prompt) {
        return NextResponse.json(
            { error: 'İsim ve sistem talimatı zorunludur.' },
            { status: 400 }
        )
    }

    const { data, error } = await supabase
        .from('templates')
        .insert({
            user_id: user.id,
            name,
            system_prompt,
            icon: icon || '🤖'
        })
        .select()
        .single()

    if (error) throw error

    return NextResponse.json({ template: data })
  } catch (error) {
    console.error('Templates POST Error:', error)
    return NextResponse.json(
      { error: 'Şablon oluşturulurken bir hata oluştu.' },
      { status: 500 }
    )
  }
}
