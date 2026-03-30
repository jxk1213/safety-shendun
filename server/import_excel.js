const xlsx = require('xlsx');
const path = require('path');
const db = require('./database'); // Assuming database.js exports the promise pool

const filePath = '/Users/jixiaokang/Desktop/申盾智能/参考资料/风险清单.xlsx';
const workbook = xlsx.readFile(filePath);

const domainMap = {
    '网点公司': '网点',
    '转运中心': '转运中心',
    '车队': '车队'
};

const headerRowIndexApprox = {
    '网点公司': 7,
    '转运中心': 5,
    '车队': 5
};

async function importData() {
    try {
        console.log('开始清理旧风险数据...');
        await db.promisePool.query('TRUNCATE TABLE risks');
        
        let totalInserted = 0;

        for (const sheetName of workbook.SheetNames) {
            if (!domainMap[sheetName]) continue;
            const domain = domainMap[sheetName];
            console.log(`\n开始处理: ${sheetName} -> ${domain}`);

            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

            let headerFound = false;
            let count = 0;
            let currentRiskArea = '';

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                
                // Keep track of section headers
                if (row && typeof row[0] === 'string' && !row[1]) {
                    if (/^[一二三四五六七八九十]+、/.test(row[0]) || /第[一二三四五六七八九十]+部分/.test(row[0])) {
                        let rawArea = row[0].replace(/^[一二三四五六七八九十]+、/g, '')
                                            .replace(/^第[一二三四五六七八九十]+部分\s*/g, '')
                                            .replace(/（\d+条）/g, '')
                                            .replace(/风险$/g, '')
                                            .replace(/安全$/g, '')
                                            .trim();
                        // Clean up per user spec
                        if (rawArea === '中心作业现场' || rawArea === '网点作业现场') rawArea = '作业现场';
                        if (rawArea === '中心宿舍') rawArea = '宿舍';
                        if (rawArea === '网点人员管理') rawArea = '人员管理';
                        if (rawArea === '网点车辆管理') rawArea = '车辆管理';
                        
                        currentRiskArea = rawArea;
                        continue;
                    }
                }

                // Check if row matches header structure (contains '序号' or '风险点描述')
                if (!headerFound) {
                    if (row && row.length > 1 && typeof row[1] === 'string' && row[1].includes('风险点描述')) {
                        headerFound = true;
                    }
                    continue;
                }

                if (!row || !row[1] || typeof row[1] !== 'string') continue;
                if (row[1].includes('风险点描述') || row[0] === '序号') continue;

                // Parse
                const risk_point = row[1];
                const l_value = parseFloat(row[2]) || 0;
                const e_value = parseFloat(row[3]) || 0;
                const c_value = parseFloat(row[4]) || 0;
                const d_value = parseFloat(row[5]) || 0;
                const risk_level = row[6] ? String(row[6]).trim() : '';
                const control_level = row[7] ? String(row[7]).trim() : '';
                const control_measures = row[8] ? String(row[8]).trim() : '';

                // Insert into db
                await db.promisePool.query(
                    `INSERT INTO risks(
                        risk_point,
                        l_value,
                        e_value,
                        c_value,
                        d_value,
                        risk_level,
                        control_level,
                        control_measures,
                        domain,
                        risk_area,
                        status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '已评审')`,
                    [
                        risk_point,
                        l_value,
                        e_value,
                        c_value,
                        d_value,
                        risk_level,
                        control_level,
                        control_measures,
                        domain,
                        currentRiskArea
                    ]
                );
                count++;
            }
            totalInserted += count;
            console.log(`成功插入 ${domain} 数据: ${count} 条`);
        }

        console.log(`\n全部完成！共插入 ${totalInserted} 条风险数据。`);
    } catch (error) {
        console.error('导入失败:', error);
    } finally {
        process.exit(0);
    }
}

importData();
