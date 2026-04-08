const express = require('express');
const router = express.Router();
const { promisePool } = require('../database');

// GET /api/accidents - 分页查询事故清单
router.get('/', async (req, res) => {
  try {
    let { page = 1, limit = 20, year, month, area, province, center, type } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    const offset = (page - 1) * limit;

    let baseQuery = `FROM accidents WHERE 1=1`;
    const queryParams = [];

    // 时间维度过滤 (支持"XXXX年"和"X月"这种前端带后缀的字符串，或者纯数字年份)
    if (year && year !== '全部') {
      const yearStr = year.replace('年', '');
      baseQuery += ` AND YEAR(accident_date) = ?`;
      queryParams.push(yearStr);
    }
    if (month && month !== '全部') {
      const monthStr = month.replace('月', ''); // e.g. "3"
      baseQuery += ` AND (month = ? OR MONTH(accident_date) = ?)`;
      // DB month column might be pure numbers or might contain "月"
      // We will look up either standard month column or parsed date
      queryParams.push(month, monthStr); 
    }
    
    // 组织架构过滤
    if (area && area !== '全部') {
       // Area isn't properly mapped in the direct excel yet, but if it exists we query it
      baseQuery += ` AND area = ?`;
      queryParams.push(area);
    }
    if (province && province !== '全部') {
      baseQuery += ` AND province = ?`;
      queryParams.push(province);
    }
    if (center && center !== '全部') {
      baseQuery += ` AND center = ?`;
      queryParams.push(center);
    }

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
    // limit and offset are added to the end of the params
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

module.exports = router;
