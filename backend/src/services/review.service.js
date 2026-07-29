'use strict';

const ApiError = require('../utils/ApiError');
const reviewRepository = require('../repositories/review.repository');
const productRepository = require('../repositories/product.repository');
const orderRepository = require('../repositories/order.repository');
const notificationRepository = require('../repositories/notification.repository');
const { REVIEW_STATUS, NOTIFICATION_TYPE } = require('../constants');

const listForProduct = async (slug, query) => {
  const product = await productRepository.findBySlug(slug);
  if (!product) throw ApiError.notFound('Product not found');

  const [page, breakdown] = await Promise.all([
    reviewRepository.listForProduct({ productId: product.id, ...query }),
    reviewRepository.ratingBreakdown(product.id),
  ]);

  return { ...page, breakdown, product };
};

/**
 * A customer may leave one review per product. Reviews start unapproved and
 * only count toward the product rating once an admin publishes them.
 */
const create = async (slug, userId, payload) => {
  const product = await productRepository.findBySlug(slug);
  if (!product) throw ApiError.notFound('Product not found');

  const existing = await reviewRepository.findByUserAndProduct(userId, product.id);
  if (existing) {
    throw ApiError.conflict('You have already reviewed this product');
  }

  const purchase = await orderRepository.findDeliveredOrderForProduct(userId, product.id);

  const review = await reviewRepository.create({
    productId: product.id,
    userId,
    orderId: purchase?.order?.id || null,
    rating: payload.rating,
    title: payload.title || null,
    comment: payload.comment || null,
    isVerifiedPurchase: Boolean(purchase),
    status: REVIEW_STATUS.PENDING,
  });

  await notificationRepository.create({
    userId: null,
    type: NOTIFICATION_TYPE.REVIEW,
    title: 'New review awaiting moderation',
    message: `A ${payload.rating}-star review was submitted for ${product.name}.`,
    link: '/admin/reviews',
  });

  return reviewRepository.findById(review.id);
};

const listForAdmin = (query) => reviewRepository.listAll(query);

const getById = async (id) => {
  const review = await reviewRepository.findById(id);
  if (!review) throw ApiError.notFound('Review not found');
  return review;
};

/**
 * Moderation. Product rating aggregates are recomputed after every decision,
 * because both approving and un-approving change the published average.
 */
const setStatus = async (id, { status, adminNote }) => {
  const review = await getById(id);

  await reviewRepository.update(review, { status, adminNote: adminNote ?? review.adminNote });
  await productRepository.refreshRating(review.productId);

  if (status === REVIEW_STATUS.APPROVED) {
    await notificationRepository.create({
      userId: review.userId,
      type: NOTIFICATION_TYPE.REVIEW,
      title: 'Your review is live',
      message: `Your review of ${review.product?.name || 'a product'} has been published.`,
      link: review.product ? `/shop/${review.product.slug}` : '/account',
    });
  }

  return reviewRepository.findById(review.id);
};

const remove = async (id) => {
  const review = await getById(id);
  const { productId } = review;

  await reviewRepository.destroy(review);
  await productRepository.refreshRating(productId);

  return { deleted: true };
};

module.exports = { listForProduct, create, listForAdmin, getById, setStatus, remove };
