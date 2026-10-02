/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - BUKU TAMU / RSVP & UCAPAN WEDDING IMEL & DERI
 * =========================================================================
 * Spreadsheet ID: 1reVsIBCMpVGdTjWGJWIKS1pcwYOzYupcqdFsTT2R2m8
 * Sheet Name    : Sheet1
 *
 * Kolom yang dihasilkan di Spreadsheet:
 * 1. Timestamp            (Waktu kirim ucapan, contoh: 03/10/2026 13:45:00)
 * 2. Nama Tamu            (Nama pengirim)
 * 3. Ucapan               (Pesan doa dan ucapan)
 * 4. Konfirmasi Kehadiran (Hadir / Tidak Hadir)
 * 5. Jumlah Tamu          (Jumlah orang, contoh: 1 orang, 2 orang, atau -)
 * =========================================================================
 */

const SPREADSHEET_ID = "1reVsIBCMpVGdTjWGJWIKS1pcwYOzYupcqdFsTT2R2m8";
const SHEET_NAME = "Sheet1";

/**
 * Jalankan fungsi setupSheet() satu kali dari editor Apps Script
 * untuk menyiapkan judul kolom secara otomatis jika sheet masih kosong.
 */
function setupSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Nama Tamu", "Ucapan", "Konfirmasi Kehadiran", "Jumlah Tamu"]);
    const headerRange = sheet.getRange(1, 1, 1, 5);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#866350");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 170); // Timestamp
    sheet.setColumnWidth(2, 200); // Nama Tamu
    sheet.setColumnWidth(3, 350); // Ucapan
    sheet.setColumnWidth(4, 160); // Kehadiran
    sheet.setColumnWidth(5, 120); // Jumlah Tamu
  }
}

/**
 * Handle GET Request: Mengambil daftar ucapan dari Google Spreadsheet
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return createJsonResponse({ status: "success", total: 0, data: [] }, e);
    }
    
    // Ambil semua data baris setelah header
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
    const data = [];
    
    // Looping dari baris paling bawah ke atas (urutan terbaru di atas)
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      const nama = String(row[1] || "").trim();
      const ucapan = String(row[2] || "").trim();
      
      // Lewati baris kosong
      if (!nama && !ucapan) continue;
      
      let formattedTime = "";
      if (row[0] instanceof Date) {
        formattedTime = Utilities.formatDate(row[0], "Asia/Jakarta", "dd MMM yyyy, HH:mm");
      } else {
        formattedTime = String(row[0] || "");
      }
      
      data.push({
        timestamp: formattedTime,
        nama: nama,
        ucapan: ucapan,
        kehadiran: String(row[3] || "Hadir").trim(),
        jumlah: String(row[4] || "1").trim()
      });
    }
    
    return createJsonResponse({
      status: "success",
      total: data.length,
      data: data
    }, e);
    
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    }, e);
  }
}

/**
 * Handle POST Request: Menyimpan ucapan baru ke Google Spreadsheet
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    
    // Buat header jika kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Nama Tamu", "Ucapan", "Konfirmasi Kehadiran", "Jumlah Tamu"]);
      const headerRange = sheet.getRange(1, 1, 1, 5);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#866350");
      headerRange.setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
    }
    
    let nama = "";
    let ucapan = "";
    let kehadiran = "";
    let jumlah = "";
    
    // Parsing data dari berbagai format input (JSON atau Form URL Encoded)
    if (e && e.postData && e.postData.contents) {
      try {
        const body = JSON.parse(e.postData.contents);
        nama = body.nama || body.author || "";
        ucapan = body.ucapan || body.comment || "";
        kehadiran = body.kehadiran || body.attendance || "";
        jumlah = body.jumlah || body.guest || "";
      } catch (jsonErr) {
        nama = (e.parameter && (e.parameter.nama || e.parameter.author)) || "";
        ucapan = (e.parameter && (e.parameter.ucapan || e.parameter.comment)) || "";
        kehadiran = (e.parameter && (e.parameter.kehadiran || e.parameter.attendance)) || "";
        jumlah = (e.parameter && (e.parameter.jumlah || e.parameter.guest)) || "";
      }
    } else if (e && e.parameter) {
      nama = e.parameter.nama || e.parameter.author || "";
      ucapan = e.parameter.ucapan || e.parameter.comment || "";
      kehadiran = e.parameter.kehadiran || e.parameter.attendance || "";
      jumlah = e.parameter.jumlah || e.parameter.guest || "";
    }
    
    // Validasi
    nama = String(nama).trim();
    ucapan = String(ucapan).trim();
    
    if (!nama || !ucapan) {
      return createJsonResponse({
        status: "error",
        message: "Nama tamu dan ucapan wajib diisi."
      }, e);
    }
    
    // Normalisasi kehadiran
    if (kehadiran.toLowerCase() === "present" || kehadiran.toLowerCase() === "hadir") {
      kehadiran = "Hadir";
    } else if (kehadiran.toLowerCase() === "notpresent" || kehadiran.toLowerCase() === "tidak hadir") {
      kehadiran = "Tidak Hadir";
    } else {
      kehadiran = "Hadir";
    }
    
    // Normalisasi jumlah tamu
    if (kehadiran === "Tidak Hadir") {
      jumlah = "-";
    } else {
      if (!jumlah || jumlah === "0") {
        jumlah = "1";
      }
      if (!jumlah.includes("orang") && jumlah !== "-") {
        jumlah = jumlah + " orang";
      }
    }
    
    // Timestamp WIB
    const timestampWIB = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm:ss");
    const displayTime = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd MMM yyyy, HH:mm");
    
    // Simpan ke Google Sheet
    sheet.appendRow([timestampWIB, nama, ucapan, kehadiran, jumlah]);
    
    return createJsonResponse({
      status: "success",
      message: "Ucapan berhasil disimpan.",
      data: {
        timestamp: displayTime,
        nama: nama,
        ucapan: ucapan,
        kehadiran: kehadiran,
        jumlah: jumlah
      }
    }, e);
    
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    }, e);
  }
}

/**
 * Helper untuk response JSON & JSONP (CORS friendly)
 */
function createJsonResponse(data, e) {
  const jsonString = JSON.stringify(data);
  if (e && e.parameter && e.parameter.callback) {
    return ContentService.createTextOutput(e.parameter.callback + "(" + jsonString + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}
