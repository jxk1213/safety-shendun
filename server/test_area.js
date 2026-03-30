const xlsx = require('xlsx');
const workbook = xlsx.readFile('/Users/jixiaokang/Desktop/申盾智能/参考资料/风险清单.xlsx');
for (const sheetName of ['网点公司', '车队']) {
    console.log(`\n--- ${sheetName} ---`);
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: null });
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row[0] && typeof row[0] === 'string' && row[1] === null && !row[0].includes('评价法') && !row[0].includes('评价标准说明') && !row[0].includes('共120条')) {
            console.log(`Row ${i}:`, row[0]);
        }
    }
}
