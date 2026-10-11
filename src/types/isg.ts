export type ISGRiskLevel = 'high' | 'medium' | 'low'

export type ISGFindingStatus = 'open' | 'closed'

export interface ISGFinding {
  id: string
  photoUrl?: string
  location?: string // Şantiye içi konum (örn: A Blok 3. Kat, Asansör Boşluğu, Şantiye Girişi)
  description: string // Tespit / Uygunsuzluk açıklaması
  regulationRef: string // İlgili Kanun/Yönetmelik (Örn: 6331 s. İSGK Md. 4, Yapı İşl. Yön. Ek-4 Md. 12)
  riskLevel: ISGRiskLevel // high (Yüksek/Acil), medium (Orta), low (Düşük)
  suggestedAction: string // Önerilen Düzeltici/Önleyici Faaliyet
  responsible: string // Sorumlu (Saha Şefi, Elektrikçi, Kalıpçı vb.)
  deadline: string // Termin Tarihi (YYYY-MM-DD)
  status: ISGFindingStatus // open (Açık) | closed (Giderildi)
  resolvedPhotoUrl?: string // Giderildiğine dair fotoğraf (opsiyonel)
}

export interface ISGProjectInfo {
  projectName: string // Proje / Şantiye Adı
  companyName: string // Hizmet Verilen Firma / İşveren
  companyLogoUrl?: string // Firma Logosu (Base64 veya URL)
  osgbName?: string // OSGB / Ortak Sağlık Güvenlik Birimi Adı
  osgbLogoUrl?: string // OSGB Logosu (Base64 veya URL)
  location: string // Şantiye Konumu / İl - İlçe
  weather: string // Hava Durumu (Güneşli, Yağmurlu, Rüzgarlı, Karlı vb.)
  workerCount: number | string // Sahadaki Çalışan Sayısı
  inspectionDate: string // Denetim Tarihi (YYYY-MM-DD)
  inspectionTime: string // Denetim Saati (Örn: 09:30 - 12:00)
  inspectorName: string // Denetimi Yapan İSG Uzmanı Adı
  inspectorTitle: string // A/B/C Sınıfı İSG Uzmanı, İşyeri Hekimi vb.
  inspectorCertificateNo?: string // İSG-KATİP Sertifika / Belge No
}

export interface ISGSignatures {
  inspectorName: string
  inspectorTitle: string
  employerRepName: string // Tebellüğ Eden (İşveren Vekili / Şantiye Şefi)
  employerRepTitle: string // Unvanı
  disclaimer: string // Yasal Sorumluluk Uyarısı
}

export interface ISGReportData {
  reportNumber: string // Örn: RAPOR-2026-001
  projectInfo: ISGProjectInfo
  findings: ISGFinding[]
  signatures: ISGSignatures
  generalNotes?: string // Genel İSG Değerlendirmesi
}

export interface ISGProfile {
  id: string
  full_name?: string
  company_name?: string
  company_logo_url?: string
  osgb_name?: string
  osgb_logo_url?: string
  inspector_title?: string
  certificate_no?: string
  gemini_api_key?: string
}

export const DEFAULT_ISG_DISCLAIMER =
  'Bu rapor, 6331 Sayılı İş Sağlığı ve Güvenliği Kanunu ve ilgili alt mevzuat kapsamında yapılan saha gözetimi sonucunda tavsiye ve rehberlik amacıyla hazırlanmıştır. İşverenin işyerindeki iş sağlığı ve güvenliği gözetim, denetim ve nihai yasal sorumluluklarını ortadan kaldırmaz.'
