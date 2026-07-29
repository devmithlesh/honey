'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const dashboardService = require('../services/dashboard.service');
const notificationRepository = require('../repositories/notification.repository');
const { buildPaginationMeta } = require('../utils/pagination');

const readQuery = (req) => req.validatedQuery || req.query;

const overview = asyncHandler(async (req, res) => {
  const data = await dashboardService.getOverview();
  return ApiResponse.ok(res, 'Dashboard loaded', data);
});

const notifications = asyncHandler(async (req, res) => {
  const { rows, count, page, limit } = await notificationRepository.listForAdmin(readQuery(req));
  return ApiResponse.ok(
    res,
    'Notifications loaded',
    rows,
    buildPaginationMeta({ totalItems: count, page, limit })
  );
});

const markNotificationRead = asyncHandler(async (req, res) => {
  await notificationRepository.markRead(req.params.id, null);
  return ApiResponse.ok(res, 'Notification marked as read', null);
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await notificationRepository.markAllRead(null);
  return ApiResponse.ok(res, 'All notifications marked as read', null);
});

module.exports = { overview, notifications, markNotificationRead, markAllNotificationsRead };
