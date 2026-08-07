import * as XLSX from 'xlsx'

export function exportRowsToExcel(
  rows: Array<Record<string, string | number>>,
  filename: string,
  sheetName = 'Sheet1',
) {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}
