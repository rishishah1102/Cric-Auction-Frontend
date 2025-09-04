import * as XLSX from "xlsx";

const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          throw new Error("No sheet found in the Excel file");
        }
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => {
      reject(new Error("Error reading file: " + error.message));
    };
    reader.readAsArrayBuffer(file);
  });
};

export default parseExcel;