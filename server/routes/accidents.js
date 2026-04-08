const express = require('express');
const router = express.Router();
const { promisePool } = require('../database');
const fs = require('fs');
const path = require('path');

// 加载省区和中心映射数据
let provincesData = [];
let centersData = [];
try {
  provincesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../platform/data/provinces.json'), 'utf-8'));
  centersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../platform/data/centers.json'), 'utf-8'));
} catch (e) {
  console.warn('加载省区/中心映射数据失败:', e.message);
}

// 根据区域获取对应的省区名称列表
function getProvinceNamesByArea(area) {
  if (!area || area === '全部') return [];
  return provincesData
    .filter(p => p.northSouth === area)
    .map(p => p.name);
}

// 根据中心短名获取对应的中心全名（用于模糊匹配 unit 字段）
function getCenterKeyword(centerShortName) {
  if (!centerShortName || centerShortName === '全部') return null;
  const center = centersData.find(c => c.shortName === centerShortName || c.name === centerShortName);
  return center ? center.name : centerShortName;
}

// 构建组织架构过滤条件（area 映射为 province IN，center 映射为 unit LIKE）
function buildOrgFilter(area, province, center) {
  let sql = '';
  const params = [];

  if (province && province !== '全部') {
    sql += ` AND province = ?`;
    params.push(province);
  } else if (area && area !== '全部') {
    const provinceNames = getProvinceNamesByArea(area);
    if (provinceNames.length > 0) {
      sql += ` AND province IN (${provinceNames.map(() => '?').join(',')})`;
      params.push(...provinceNames);
    } else {
      sql += ` AND 1=0`; // 无匹配省区，返回空
    }
  }

  if (center && center !== '全部') {
    const keyword = getCenterKeyword(center);
    if (keyword) {
      sql += ` AND unit LIKE ?`;
      params.push('%' + keyword.replace(/转运中心|集散中心/, '') + '%');
    }
  }

  return { sql, params };
}

// GET /api/accidents - 分页查询事故清单
router.get('/', async (req, res) => {
  try {
    let { page = 1, limit = 20, year, month, area, province, center, type } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    const offset = (page - 1) * limit;

    let baseQuery = `FROM accidents WHERE 1=1`;
    const queryParams = [];

    if (year && year !== '全部') {
      const yearStr = year.replace('年', '');
      baseQuery += ` AND YEAR(accident_date) = ?`;
      queryParams.push(yearStr);
    }
    if (month && month !== '全部') {
      const monthStr = month.replace('月', '');
      baseQuery += ` AND (month = ? OR MONTH(accident_date) = ?)`;
      queryParams.push(month, monthStr); 
    }
    
    // 组织架构过滤（使用映射逻辑）
    const orgFilter = buildOrgFilter(area, province, center);
    baseQuery += orgFilter.sql;
    queryParams.push(...orgFilter.params);

    // 事故类型过滤
    if (type && type !== '全部') {
      baseQuery += ` AND accident_type LIKE ?`;
      queryParams.push('%' + type + '%');
    }

    // 1. 获取总数
    const countSql = `SELECT COUNT(*) AS total ${baseQuery}`;
    const [countRows] = await promisePool.query(countSql, queryParams);
    const totalCount = countRows[0].total;

    // 2. 获取分页数据
    const dataSql = `SELECT id, serial_number, person_name, unit, province, accident_date, month, description, injured_part, accident_type, created_at ${baseQuery} ORDER BY accident_date ASC, id ASC LIMIT ? OFFSET ?`;
    const pageParams = [...queryParams, limit, offset];
    
    const [rows] = await promisePool.query(dataSql, pageParams);

    res.json({
      code: 200,
      data: rows,
      pagination: {
        total: totalCount,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('查询事故列表失败:', error);
    res.status(500).json({ code: 500, error: '内部服务器错误' });
  }
});

// GET /api/accidents/stats - 获取事故分析聚合数据
router.get('/stats', async (req, res) => {
  try {
    const { year = '2025', month, area, province, center } = req.query;
    
    let baseWhere = `WHERE 1=1`;
    const params = [];

    if (year && year !== '全部') {
      const yearStr = year.replace('年', '');
      baseWhere += ` AND YEAR(accident_date) = ?`;
      params.push(yearStr);
    }
    
    if (month && month !== '全部') {
      const monthStr = month.replace('月', '');
      baseWhere += ` AND (month = ? OR MONTH(accident_date) = ?)`;
      params.push(month, monthStr);
    }

    // 组织架构过滤
    const orgFilter = buildOrgFilter(area, province, center);
    baseWhere += orgFilter.sql;
    params.push(...orgFilter.params);

    // 1. 筛选条件下的总事故数
    const [totalYearRows] = await promisePool.query(
      `SELECT COUNT(*) as count FROM accidents ${baseWhere}`, params
    );
    const totalYearly = totalYearRows[0].count;

    // 当前月发生（仅受年份和组织架构筛选）
    const currentMonth = new Date().getMonth() + 1;
    let monthWhere = `WHERE YEAR(accident_date) = ? AND (MONTH(accident_date) = ? OR month = ?)`;
    const monthParams = [year.replace('年', ''), currentMonth, currentMonth + '月'];
    const monthOrgFilter = buildOrgFilter(area, province, center);
    monthWhere += monthOrgFilter.sql;
    monthParams.push(...monthOrgFilter.params);

    const [totalMonthRows] = await promisePool.query(
      `SELECT COUNT(*) as count FROM accidents ${monthWhere}`, monthParams
    );
    const totalMonthly = totalMonthRows[0].count;

    // 2. 月度趋势（不受月份筛选，但受年份和组织架构筛选）
    let trendWhere = `WHERE 1=1`;
    const trendParams = [];
    if (year && year !== '全部') { trendWhere += ` AND YEAR(accident_date) = ?`; trendParams.push(year.replace('年', '')); }
    const trendOrgFilter = buildOrgFilter(area, province, center);
    trendWhere += trendOrgFilter.sql;
    trendParams.push(...trendOrgFilter.params);

    const monthlyTrend = Array(12).fill(0);
    const [trendRows] = await promisePool.query(
      `SELECT MONTH(accident_date) as m, COUNT(*) as count 
       FROM accidents 
       ${trendWhere}
       GROUP BY m`, trendParams
    );
    trendRows.forEach(row => {
      if (row.m >= 1 && row.m <= 12) {
        monthlyTrend[row.m - 1] = row.count;
      }
    });

    // 3. 事故性质占比
    const [typeRows] = await promisePool.query(
      `SELECT accident_type as label, COUNT(*) as value 
       FROM accidents 
       ${baseWhere} AND accident_type IS NOT NULL AND accident_type != ''
       GROUP BY accident_type 
       ORDER BY value DESC 
       LIMIT 5`, params
    );

    // 4. 区域排行榜
    const [regionRows] = await promisePool.query(
      `SELECT province as label, COUNT(*) as count 
       FROM accidents 
       ${baseWhere} AND province IS NOT NULL AND province != ''
       GROUP BY province 
       ORDER BY count DESC 
       LIMIT 3`, params
    );

    res.json({
      code: 200,
      data: {
        totalYearly,
        totalMonthly,
        monthlyTrend,
        typeDist: typeRows,
        regionalTop: regionRows.map(r => ({
          ...r,
          percent: totalYearly > 0 ? (r.count / totalYearly * 100).toFixed(1) : 0
        }))
      }
    });

  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ code: 500, error: '内部服务器错误' });
  }
});

module.exports = router;
