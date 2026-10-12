import jsPDF from 'jspdf'
import type { ISGReportData } from '@/types/isg'
import { DEFAULT_ISG_DISCLAIMER } from '@/types/isg'

// Helper to resize and compress photos in browser before embedding in jsPDF
async function compressImageForPdf(
  dataUri: string,
  maxDimension = 1000,
  quality = 0.75
): Promise<{ data: string; format: 'JPEG' | 'PNG' }> {
  if (typeof window === 'undefined') {
    const isPng = dataUri.startsWith('data:image/png')
    return { data: dataUri, format: isPng ? 'PNG' : 'JPEG' }
  }

  // Keep small PNG logos intact without lossy compression
  if (dataUri.startsWith('data:image/png') && dataUri.length < 50000) {
    return { data: dataUri, format: 'PNG' }
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        let width = img.width
        let height = img.height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve({ data: dataUri, format: dataUri.startsWith('data:image/png') ? 'PNG' : 'JPEG' })
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUri = canvas.toDataURL('image/jpeg', quality)
        resolve({ data: compressedDataUri, format: 'JPEG' })
      } catch {
        resolve({ data: dataUri, format: dataUri.startsWith('data:image/png') ? 'PNG' : 'JPEG' })
      }
    }
    img.onerror = () => {
      resolve({ data: dataUri, format: dataUri.startsWith('data:image/png') ? 'PNG' : 'JPEG' })
    }
    img.src = dataUri
  })
}

// Helper to safely convert image URL or data URI to optimized base64 for jsPDF
async function getBase64Image(url?: string): Promise<{ data: string; format: 'JPEG' | 'PNG' } | null> {
  if (!url) return null
  try {
    let dataUri = url
    if (!url.startsWith('data:')) {
      const res = await fetch(url)
      if (!res.ok) return null
      const blob = await res.blob()
      dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }
    return await compressImageForPdf(dataUri)
  } catch {
    return null
  }
}

// Load and embed Turkish Roboto font (Regular & Bold) into jsPDF
async function loadTurkishFont(doc: jsPDF): Promise<boolean> {
  try {
    const fetchBase64 = async (url: string) => {
      try {
        const response = await fetch(url)
        if (!response.ok) return null
        const blob = await response.blob()
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve((reader.result as string).split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      } catch {
        return null
      }
    }

    const [regBase64, boldBase64] = await Promise.all([
      fetchBase64('/fonts/Roboto-Regular.ttf'),
      fetchBase64('/fonts/Roboto-Bold.ttf'),
    ])

    if (regBase64) {
      doc.addFileToVFS('Roboto-Regular.ttf', regBase64)
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
    }

    if (boldBase64) {
      doc.addFileToVFS('Roboto-Bold.ttf', boldBase64)
      doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
    } else if (regBase64) {
      // Bold variant fallback to regular so UTF-8 characters NEVER corrupt
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bold')
    }

    doc.setFont('Roboto', 'normal')
    return true
  } catch (err) {
    console.warn('Türkçe Roboto fontu yüklenemedi:', err)
    return false
  }
}

export async function generateISGReportPDF(report: ISGReportData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  await loadTurkishFont(doc)

  const pageWidth = 210
  const pageHeight = 297
  const margin = 12
  const printableWidth = pageWidth - margin * 2
  let currentY = margin

  // Fetch logos
  const [companyLogo, osgbLogo] = await Promise.all([
    getBase64Image(report.projectInfo.companyLogoUrl),
    getBase64Image(report.projectInfo.osgbLogoUrl),
  ])

  // Header drawing function
  const drawPageHeader = (isFirstPage: boolean) => {
    if (isFirstPage) {
      const headerHeight = 22
      // Company Logo (Left)
      if (companyLogo) {
        try {
          doc.addImage(companyLogo.data, companyLogo.format, margin, margin, 34, 16)
        } catch {
          // ignore
        }
      }

      // OSGB Logo (Right)
      if (osgbLogo) {
        try {
          doc.addImage(osgbLogo.data, osgbLogo.format, pageWidth - margin - 34, margin, 34, 16)
        } catch {
          // ignore
        }
      }

      // Title (Center)
      doc.setFont('Roboto', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139) // Slate-500
      doc.text('T.C. ÇALIŞMA VE SOSYAL GÜVENLİK MEVZUATI UYARINCA', pageWidth / 2, margin + 4, { align: 'center' })

      doc.setFont('Roboto', 'bold')
      doc.setFontSize(12.5)
      doc.setTextColor(15, 23, 42) // Slate-900
      doc.text('İŞ SAĞLIĞI VE GÜVENLİĞİ SAHA DENETİM RAPORU', pageWidth / 2, margin + 10.5, { align: 'center' })

      doc.setFont('Roboto', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)
      doc.text(
        `Rapor No: ${report.reportNumber}   •   Denetim Tarihi: ${report.projectInfo.inspectionDate}`,
        pageWidth / 2,
        margin + 16.5,
        { align: 'center' }
      )

      // Divider Line
      doc.setDrawColor(203, 213, 225) // Slate-300
      doc.setLineWidth(0.4)
      doc.line(margin, margin + headerHeight, pageWidth - margin, margin + headerHeight)

      currentY = margin + headerHeight + 4
    } else {
      // Running header on subsequent pages
      doc.setFont('Roboto', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text(
        `${report.projectInfo.projectName || 'İSG Saha Denetimi'} - Saha Gözetim Raporu (${report.reportNumber})`,
        margin,
        margin + 1
      )
      doc.setFont('Roboto', 'normal')
      doc.text(`Tarih: ${report.projectInfo.inspectionDate}`, pageWidth - margin, margin + 1, { align: 'right' })
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.3)
      doc.line(margin, margin + 4, pageWidth - margin, margin + 4)
      currentY = margin + 9
    }
  }

  // Draw first page header
  drawPageHeader(true)

  // -------------------------------------------------------------
  // 1. METADATA SUMMARY TABLE (Şantiye ve Denetim Parametreleri)
  // -------------------------------------------------------------
  const drawMetadataTable = () => {
    const tableY = currentY
    const rowHeight = 6.2
    const totalHeight = rowHeight * 4 + 2

    // Background container
    doc.setFillColor(248, 250, 252) // Slate-50
    doc.setDrawColor(203, 213, 225) // Slate-300
    doc.roundedRect(margin, tableY, printableWidth, totalHeight, 1.5, 1.5, 'FD')

    doc.setFontSize(8)

    const col1LabelX = margin + 3
    const col1ValX = margin + 32
    const col1MaxW = 56

    const col2LabelX = margin + 90
    const col2ValX = margin + 117
    const col2MaxW = 68

    const drawRow = (
      yOffset: number,
      lbl1: string,
      val1: string | undefined,
      lbl2: string,
      val2: string | undefined
    ) => {
      const y = tableY + yOffset
      // Left Col
      doc.setFont('Roboto', 'bold')
      doc.setTextColor(71, 85, 105) // Slate-600
      doc.text(lbl1, col1LabelX, y)

      doc.setFont('Roboto', 'normal')
      doc.setTextColor(15, 23, 42) // Slate-900
      const lines1 = doc.splitTextToSize(val1 || '-', col1MaxW)
      doc.text(lines1[0] || '-', col1ValX, y)

      // Right Col
      doc.setFont('Roboto', 'bold')
      doc.setTextColor(71, 85, 105)
      doc.text(lbl2, col2LabelX, y)

      doc.setFont('Roboto', 'normal')
      doc.setTextColor(15, 23, 42)
      const lines2 = doc.splitTextToSize(val2 || '-', col2MaxW)
      doc.text(lines2[0] || '-', col2ValX, y)
    }

    // Row 1
    const inspectorFull = report.projectInfo.inspectorTitle
      ? `${report.projectInfo.inspectorName} (${report.projectInfo.inspectorTitle})`
      : report.projectInfo.inspectorName
    drawRow(4.8, 'Şantiye / Proje:', report.projectInfo.projectName, 'Denetimi Yapan:', inspectorFull)

    // Row 2
    drawRow(
      4.8 + rowHeight,
      'Konum / Adres:',
      report.projectInfo.location,
      'İSG Belge No:',
      report.projectInfo.inspectorCertificateNo || '-'
    )

    // Row 3
    drawRow(
      4.8 + rowHeight * 2,
      'Hizmet Alan Firma:',
      report.projectInfo.companyName,
      'Hava Durumu:',
      report.projectInfo.weather || 'Güneşli'
    )

    // Row 4
    const workerInfo = `${report.projectInfo.workerCount ? report.projectInfo.workerCount + ' Kişi' : '-'}   •   ${report.projectInfo.inspectionTime || '-'}`
    drawRow(
      4.8 + rowHeight * 3,
      'OSGB Birimi:',
      report.projectInfo.osgbName,
      'Çalışan / Saat:',
      workerInfo
    )

    currentY = tableY + totalHeight + 5
  }

  drawMetadataTable()

  // Section title for findings
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text(`SAHA TESPİTLERİ VE UYGUNSUZLUK LİSTESİ (${report.findings.length} Bulgu)`, margin, currentY)

  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
  currentY += 5.5

  // -------------------------------------------------------------
  // 2. FINDINGS LIST (Fotoğraflı Bulgular Tablosu - Dinamik Yükseklik)
  // -------------------------------------------------------------
  for (let i = 0; i < report.findings.length; i++) {
    const finding = report.findings[i]
    const photo = await getBase64Image(finding.photoUrl)

    const photoWidth = 40
    const photoHeight = 30
    const contentX = photo ? margin + photoWidth + 6 : margin + 5
    const contentWidth = printableWidth - (photo ? photoWidth + 9 : 10)

    // Wrap all textual fields safely
    doc.setFontSize(7.5)
    doc.setFont('Roboto', 'normal')
    const descLines = doc.splitTextToSize(finding.description || '-', contentWidth - 14)
    const regLines = doc.splitTextToSize(finding.regulationRef || '6331 Sayılı İSG Kanunu', contentWidth - 16)
    const actionLines = doc.splitTextToSize(finding.suggestedAction || '-', contentWidth - 14)

    // Calculate dynamic required height
    const headerH = 6
    const descH = descLines.length * 3.4 + 2
    const regH = regLines.length * 3.4 + 2
    const actionH = actionLines.length * 3.4 + 3
    const footerH = 6.5
    const calculatedTextH = headerH + descH + regH + actionH + footerH + 2
    const cardHeight = Math.max(photo ? photoHeight + 6 : 28, calculatedTextH)

    // Page break check (Leave room for footer)
    if (currentY + cardHeight > pageHeight - 25) {
      doc.addPage()
      drawPageHeader(false)
    }

    const cardY = currentY

    // Card background
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(203, 213, 225) // Slate-300
    doc.roundedRect(margin, cardY, printableWidth, cardHeight, 1.5, 1.5, 'FD')

    // Risk indicator stripe on left edge (3mm wide)
    if (finding.riskLevel === 'high') {
      doc.setFillColor(220, 38, 38) // Red-600
    } else if (finding.riskLevel === 'medium') {
      doc.setFillColor(217, 119, 6) // Amber-600
    } else {
      doc.setFillColor(5, 150, 105) // Emerald-600
    }
    doc.rect(margin, cardY, 2.5, cardHeight, 'F')

    // Photo insertion with frame
    if (photo) {
      try {
        doc.addImage(photo.data, photo.format, margin + 4, cardY + 3, photoWidth, photoHeight)
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.2)
        doc.rect(margin + 4, cardY + 3, photoWidth, photoHeight, 'D')
      } catch {
        doc.setFillColor(241, 245, 249)
        doc.rect(margin + 4, cardY + 3, photoWidth, photoHeight, 'F')
        doc.setFontSize(7)
        doc.setTextColor(148, 163, 184)
        doc.text('Görsel Yüklenemedi', margin + 6, cardY + 16)
      }
    }

    // Top metadata row inside finding card
    let yCursor = cardY + 4.8
    doc.setFontSize(8.5)
    doc.setFont('Roboto', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(
      `Bulgu #${i + 1}   •   Konum: ${finding.location || 'Saha Genel'}`,
      contentX,
      yCursor
    )

    // Risk badge pill (Right-aligned)
    const badgeText =
      finding.riskLevel === 'high' ? 'YÜKSEK RİSK' : finding.riskLevel === 'medium' ? 'ORTA RİSK' : 'DÜŞÜK RİSK'
    const badgeColor =
      finding.riskLevel === 'high'
        ? [220, 38, 38]
        : finding.riskLevel === 'medium'
        ? [217, 119, 6]
        : [5, 150, 105]

    const badgeW = 23
    const badgeH = 4.8
    const badgeX = pageWidth - margin - badgeW - 2.5
    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2])
    doc.roundedRect(badgeX, cardY + 2.2, badgeW, badgeH, 1, 1, 'F')
    doc.setFontSize(7)
    doc.setFont('Roboto', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(badgeText, badgeX + badgeW / 2, cardY + 5.5, { align: 'center' })

    yCursor += 5.2

    // Tespit (Description)
    doc.setFontSize(7.5)
    doc.setFont('Roboto', 'bold')
    doc.setTextColor(51, 65, 85)
    doc.text('Tespit:', contentX, yCursor)
    doc.setFont('Roboto', 'normal')
    doc.setTextColor(15, 23, 42)
    doc.text(descLines, contentX + 13, yCursor)
    yCursor += descLines.length * 3.4 + 2

    // Mevzuat (Regulation Reference)
    doc.setFont('Roboto', 'bold')
    doc.setTextColor(51, 65, 85)
    doc.text('Mevzuat:', contentX, yCursor)
    doc.setFont('Roboto', 'normal')
    doc.setTextColor(100, 116, 139) // Slate-500
    doc.text(regLines, contentX + 15, yCursor)
    yCursor += regLines.length * 3.4 + 2

    // Aksiyon (Suggested Action)
    doc.setFont('Roboto', 'bold')
    doc.setTextColor(51, 65, 85)
    doc.text('Aksiyon:', contentX, yCursor)
    doc.setFont('Roboto', 'normal')
    doc.setTextColor(15, 23, 42)
    doc.text(actionLines, contentX + 13, yCursor)

    // Inner Card Footer (Responsible, Deadline, Status)
    const footerY = cardY + cardHeight - 2.5
    doc.setDrawColor(241, 245, 249) // Slate-100
    doc.setLineWidth(0.3)
    doc.line(contentX, cardY + cardHeight - 6.5, pageWidth - margin - 3, cardY + cardHeight - 6.5)

    doc.setFontSize(7.5)
    doc.setFont('Roboto', 'bold')
    doc.setTextColor(71, 85, 105)
    doc.text(`Sorumlu: ${finding.responsible || 'Saha Şefi / İlgili Taşeron'}`, contentX, footerY)

    doc.setFont('Roboto', 'normal')
    const statusText = finding.status === 'open' ? 'Açık' : 'Giderildi'
    doc.text(
      `Termin: ${finding.deadline || '-'}   •   Durum: ${statusText}`,
      pageWidth - margin - 3,
      footerY,
      { align: 'right' }
    )

    currentY = cardY + cardHeight + 4
  }

  // -------------------------------------------------------------
  // 3. SIGNATURES & DISCLAIMER SECTION (Alt İmza ve Onay Bölümü)
  // -------------------------------------------------------------
  const signatureSectionHeight = 44
  if (currentY + signatureSectionHeight > pageHeight - 15) {
    doc.addPage()
    drawPageHeader(false)
  }

  currentY += 2

  // Optional general notes
  if (report.generalNotes) {
    doc.setFontSize(8)
    doc.setFont('Roboto', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text('GENEL DEĞERLENDİRME VE TAVSİYELER:', margin, currentY)
    doc.setFont('Roboto', 'normal')
    doc.setTextColor(71, 85, 105)
    const splitNotes = doc.splitTextToSize(report.generalNotes, printableWidth)
    doc.text(splitNotes, margin, currentY + 4)
    currentY += splitNotes.length * 3.8 + 4
  }

  // Two signature boxes
  const boxWidth = (printableWidth - 6) / 2
  const boxHeight = 26
  const boxY = currentY + 1

  // Left Signature Box (İSG Uzmanı)
  doc.setDrawColor(203, 213, 225)
  doc.setFillColor(250, 250, 250)
  doc.roundedRect(margin, boxY, boxWidth, boxHeight, 1.5, 1.5, 'FD')

  doc.setFontSize(8)
  doc.setFont('Roboto', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('TESPİT VE TEBLİĞ EDEN (İSG UZMANI)', margin + boxWidth / 2, boxY + 5, { align: 'center' })

  doc.setFontSize(8)
  doc.setFont('Roboto', 'bold')
  doc.text(report.signatures.inspectorName, margin + boxWidth / 2, boxY + 10, { align: 'center' })
  doc.setFontSize(7.5)
  doc.setFont('Roboto', 'normal')
  doc.setTextColor(100, 116, 139)
  const inspectorCert = report.projectInfo.inspectorCertificateNo
    ? `${report.signatures.inspectorTitle} • Belge No: ${report.projectInfo.inspectorCertificateNo}`
    : report.signatures.inspectorTitle
  doc.text(inspectorCert, margin + boxWidth / 2, boxY + 14.5, { align: 'center' })
  doc.text('İmza / Kaşe: ................................................', margin + boxWidth / 2, boxY + 21.5, {
    align: 'center',
  })

  // Right Signature Box (İşveren Vekili)
  const rightBoxX = margin + boxWidth + 6
  doc.setDrawColor(203, 213, 225)
  doc.setFillColor(250, 250, 250)
  doc.roundedRect(rightBoxX, boxY, boxWidth, boxHeight, 1.5, 1.5, 'FD')

  doc.setFontSize(8)
  doc.setFont('Roboto', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('TEBELLÜĞ EDEN (İŞVEREN / VEKİLİ)', rightBoxX + boxWidth / 2, boxY + 5, { align: 'center' })

  doc.setFontSize(8)
  doc.setFont('Roboto', 'bold')
  const empName = report.signatures.employerRepName || 'Şantiye Yetkilisi'
  doc.text(empName, rightBoxX + boxWidth / 2, boxY + 10, { align: 'center' })
  doc.setFontSize(7.5)
  doc.setFont('Roboto', 'normal')
  doc.setTextColor(100, 116, 139)
  const empTitle = report.signatures.employerRepTitle || 'İşveren Vekili'
  doc.text(empTitle, rightBoxX + boxWidth / 2, boxY + 14.5, { align: 'center' })
  doc.text('İmza / Kaşe: ................................................', rightBoxX + boxWidth / 2, boxY + 21.5, {
    align: 'center',
  })

  // Disclaimer text
  const disclaimerY = boxY + boxHeight + 4
  doc.setFontSize(6.5)
  doc.setFont('Roboto', 'normal')
  doc.setTextColor(148, 163, 184)
  const disclaimerText = report.signatures.disclaimer || DEFAULT_ISG_DISCLAIMER
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, printableWidth)
  doc.text(splitDisclaimer, margin, disclaimerY)

  // -------------------------------------------------------------
  // Page numbering and footer branding on ALL pages
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages()
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum)
    doc.setFont('Roboto', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(`Sayfa ${pageNum} / ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' })
    doc.text('İSG Saha Asistanı ile hazırlanmıştır.', margin, pageHeight - 6)
  }

  return doc
}
