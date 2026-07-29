'use strict';

const orderRepository = require('../repositories/order.repository');
const productRepository = require('../repositories/product.repository');
const categoryRepository = require('../repositories/category.repository');
const couponRepository = require('../repositories/coupon.repository');
const reviewRepository = require('../repositories/review.repository');
const userRepository = require('../repositories/user.repository');
const { Role } = require('../models');
const { ROLES, ORDER_STATUS, REVIEW_STATUS } = require('../constants');

const startOfDay = (date) => new Date(date.setHours(0, 0, 0, 0));

/** Zero-fills days with no orders so the chart has no gaps. */
const fillDays = (rows, days) => {
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const result = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    result.push(byDay.get(key) || { day: key, orders: 0, revenue: 0 });
  }

  return result;
};

/**
 * Single aggregate call behind the admin dashboard. Everything runs in parallel
 * because none of the figures depend on each other.
 */
const getOverview = async () => {
  const customerRole = await Role.findOne({ where: { name: ROLES.CUSTOMER } });

  const today = startOfDay(new Date());
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalRevenue,
    revenueLast30Days,
    revenueToday,
    totalOrders,
    ordersByStatus,
    totalProducts,
    lowStockCount,
    lowStockProducts,
    totalCategories,
    activeCoupons,
    pendingReviews,
    customers,
    recentOrders,
    topProducts,
    dailyRows,
  ] = await Promise.all([
    orderRepository.sumRevenue(),
    orderRepository.sumRevenue({ from: thirtyDaysAgo }),
    orderRepository.sumRevenue({ from: today }),
    orderRepository.countAll(),
    orderRepository.countByStatus(),
    productRepository.countAll(),
    productRepository.countLowStock(),
    productRepository.findLowStock(8),
    categoryRepository.countAll(),
    couponRepository.countActive(),
    reviewRepository.countByStatus(REVIEW_STATUS.PENDING),
    userRepository.listCustomers({ roleId: customerRole?.id, page: 1, limit: 1 }),
    orderRepository.findRecent(8),
    orderRepository.topProducts(5),
    orderRepository.revenueByDay(14),
  ]);

  return {
    cards: {
      totalRevenue,
      revenueLast30Days,
      revenueToday,
      totalOrders,
      pendingOrders: ordersByStatus[ORDER_STATUS.PENDING] || 0,
      totalCustomers: customers.count,
      totalProducts,
      lowStockCount,
      totalCategories,
      activeCoupons,
      pendingReviews,
    },
    ordersByStatus,
    revenueSeries: fillDays(dailyRows, 14),
    recentOrders,
    topProducts: topProducts.map((row) => ({
      ...row,
      revenue: Number.parseFloat(row.revenue),
    })),
    lowStockProducts,
  };
};

module.exports = { getOverview };
