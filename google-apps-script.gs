// Google Apps Script - contoh endpoint muat naik JPEG ke Google Drive.
// 1) Gantikan FOLDER_ID dengan ID folder Google Drive anda.
// 2) Deploy > New deployment > Web app; Execute as: Me; Who has access: Anyone.
// 3) Salin URL /exec ke config.js.
// Uji dengan satu gambar percubaan dahulu. Jangan kongsi URL ini secara terbuka jika tidak mahu menerima muat naik orang lain.
const FOLDER_ID = "GANTI_DENGAN_ID_FOLDER_DRIVE";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (!data || !data.base64 || data.mimeType !== "image/jpeg") {
      return json({ok:false, message:"Hanya fail JPEG dibenarkan."});
    }
    const bytes = Utilities.base64Decode(data.base64);
    const blob = Utilities.newBlob(bytes, "image/jpeg", data.filename || ("KEMAS2026_" + Date.now() + ".jpg"));
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const file = folder.createFile(blob);
    return json({ok:true, fileId:file.getId(), name:file.getName()});
  } catch (err) {
    return json({ok:false, message:String(err)});
  }
}
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
