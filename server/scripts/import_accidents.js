const xlsx = require('xlsx');
const path = require('path');
const { promisePool } = require('../database');
const moment = require('moment');

async function importData() {
  const filePath = path.resolve('/Users/jixiaokang/Desktop/申盾智能/参考资料/2025年安全事故汇总..xlsx');
  console.log(`Starting to read Excel file at: ${filePath}`);
  
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });
    console.log(`Successfully parsed ${data.length} rows.`);

    let inserted = 0;
    
    for (const row of data) {
      if (!row['序号']) continue; // skip empty rows
      
      const serialNumber = row['序号'] || '';
      const personName = row['姓名'] || '';
      const unit = row['所属单位'] || '';
      const province = row['省区'] || '';
      let accDate = row['出险日期'];
      const month = row['月份'] || '';
      const desc = row['出险情况说明'] || '';
      const injuredPart = row['受伤部位'] || '';
      const accType = row['事故详细类型'] || '';
      
      let formattedDate = null;
      if (accDate) {
         try {
             formattedDate = moment(accDate, ['YYYY-MM-DD', 'YYYY/MM/DD', 'MM/DD/YYYY', 'M/D/YY']).format('YYYY-MM-DD HH:mm:ss');
             if (formattedDate === 'Invalid date') formattedDate = null;
         } catch(e) {}
      }

      const sql = `
        INSERT INTO accidents 
        (serial_number, person_name, unit, province, accident_date, month, description, injured_part, accident_type, center)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await promisePool.execute(sql, [
        serialNumber, 
        personName, 
        unit, 
        province, 
        formattedDate, 
        month, 
        desc, 
        injuredPart, 
        accType, 
        unit // Map unit to center for consistency
      ]);
      inserted++;
    }
    
    console.log(`✅ Successfully imported ${inserted} rows into 'accidents' table.`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error importing data: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

importData();
