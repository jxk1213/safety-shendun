/**
 * 导入风险清单脚本
 * 将 参考资料/风险清单.xlsx 的数据导入到 risks 表中
 * 运行: node scripts/import_risk_list.js
 */

const xlsx = require('xlsx');
const path = require('path');
const db = require('../database');

const FILE_PATH = path.join(__dirname, '../../参考资料/风险清单.xlsx');

// Sheet 名称 -> domain 映射
const DOMAIN_MAP = {
  '网点公司': '网点',
  '转运中心': '转运中心',
  '车队': '车队'
};

// 判断是否为区域段标题行
function parseSectionTitle(row) {
  if (!row || !row[0] || row[1]) return null;
  const text = String(row[0]).trim();
  // 匹配: 一、xxx  /  第一部分 xxx  /  三、xxx
  if (
    /^[一二三四五六七八九十]+[、,，]/.test(text) ||
    /^第[一二三四五六七八九十]+部分/.test(text)
  ) {
    let area = text
      .replace(/^第[一二三四五六七八九十]+部分\s*/g, '')
      .replace(/^[一二三四五六七八九十]+[、,，]/g, '')
      .replace(/（\d+条）/g, '')
      .replace(/\(共\d+条\)/g, '')
      .replace(/风险$/, '')
      .replace(/安全$/, '')
      .trim();
    // 标准化
    if (area.includes('作业现场')) area = '作业现场';
    if (area.includes('宿舍')) area = '宿舍';
    if (area.includes('食堂')) area = '食堂';
    if (area.includes('人员管理')) area = '人员管理';
    if (area.includes('车辆管理')) area = '车辆管理';
    if (area.includes('车辆运行')) area = '车辆运行安全';
    if (area.includes('快件运输')) area = '快件运输安全';
    if (area.includes('网点公司')) area = '';  // 跳过总标题
    return area || null;
  }
  return null;
}

// 判断是否为表头行
function isHeaderRow(row) {
  if (!row) return false;
  const text = String(row[0] || row[1] || '');
  return text.includes('序号') || text.includes('风险点描述');
}

// 判断是否为有效数据行
function isDataRow(row) {
  if (!row) return false;
  // row[0] 是序号(数字), row[1] 是风险点描述
  const seq = row[0];
  const desc = row[1];
  return (typeof seq === 'number' || (typeof seq === 'string' && /^\d+$/.test(seq.trim())))
    && desc && typeof desc === 'string' && desc.trim().length > 0;
}

async function importSheet(sheetName, domain, sheet) {
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
  let currentArea = '综合';
  let count = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    // 区域标题检测
    const sectionArea = parseSectionTitle(row);
    if (sectionArea !== null) {
      currentArea = sectionArea || currentArea;
      continue;
    }

    // 跳过表头行
    if (isHeaderRow(row)) continue;

    // 解析数据行
    if (!isDataRow(row)) continue;

    const risk_point   = String(row[1]).trim();
    const l_value      = parseFloat(row[2]) || 0;
    const e_value      = parseFloat(row[3]) || 0;
    const c_value      = parseFloat(row[4]) || 0;
    const d_value      = parseFloat(row[5]) || (l_value * e_value * c_value);
    const risk_level   = row[6] ? String(row[6]).trim() : '';
    const control_level = row[7] ? String(row[7]).trim() : '';
    const control_measures = row[8] ? String(row[8]).trim() : '';

    await db.promisePool.query(
      `INSERT INTO risks (
        risk_point, l_value, e_value, c_value, d_value,
        risk_level, control_level, control_measures,
        domain, risk_area, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '已评审')`,
      [
        risk_point, l_value, e_value, c_value, d_value,
        risk_level, control_level, control_measures,
        domain, currentArea
      ]
    );
    count++;
  }
  return count;
}

async function run() {
  console.log('🔄 开始导入风险清单...');
  console.log('📁 文件路径:', FILE_PATH);

  const workbook = xlsx.readFile(FILE_PATH);
  console.log('📊 工作表:', workbook.SheetNames.join(', '));

  // 清空旧数据
  console.log('\n🗑️  清空旧风险数据...');
  await db.promisePool.query('DELETE FROM risks WHERE status = \'已评审\'');

  let total = 0;
  for (const sheetName of workbook.SheetNames) {
    const domain = DOMAIN_MAP[sheetName];
    if (!domain) {
      console.log(`⏭️  跳过工作表: ${sheetName}`);
      continue;
    }
    const sheet = workbook.Sheets[sheetName];
    console.log(`\n📋 处理工作表: ${sheetName} → domain: ${domain}`);
    const count = await importSheet(sheetName, domain, sheet);
    console.log(`   ✅ 插入 ${count} 条记录`);
    total += count;
  }

  console.log(`\n🎉 导入完成！共插入 ${total} 条风险数据。`);
  process.exit(0);
}

run().catch(err => {
  console.error('❌ 导入失败:', err);
  process.exit(1);
});
