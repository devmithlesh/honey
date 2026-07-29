'use strict';

const ApiError = require('../utils/ApiError');
const productRepository = require('../repositories/product.repository');
const categoryRepository = require('../repositories/category.repository');
const reviewRepository = require('../repositories/review.repository');
const uploadService = require('./upload.service');
const { ProductImage, Inventory, sequelize } = require('../models');
const { buildUniqueSlug, generateSku } = require('../utils/identifiers');
const { INVENTORY_REASON } = require('../constants');

const listPublic = (query) => productRepository.list({ ...query, includeInactive: false });

const listForAdmin = (query) => productRepository.list({ ...query, includeInactive: true });

const getBySlug = async (slug, { includeInactive = false } = {}) => {
  const product = await productRepository.findBySlug(slug, { includeInactive });
  if (!product) throw ApiError.notFound('Product not found');
  return product;
};

const getById = async (id) => {
  const product = await productRepository.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  return product;
};

/** Product page payload: the item, its rating histogram and its neighbours. */
const getDetail = async (slug) => {
  const product = await getBySlug(slug);
  const [related, ratingBreakdown] = await Promise.all([
    productRepository.findRelated(product, 4),
    reviewRepository.ratingBreakdown(product.id),
  ]);

  return { product, related, ratingBreakdown };
};

const getRelated = async (slug) => {
  const product = await getBySlug(slug);
  return productRepository.findRelated(product, 4);
};

const assertCategoryExists = async (categoryId) => {
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    throw ApiError.badRequest('The selected category does not exist', [
      { field: 'categoryId', message: 'Choose an existing category' },
    ]);
  }
  return category;
};

/**
 * Persists images for a product in one batch and guarantees exactly one primary
 * image, since the storefront always renders `images[0]` as the hero shot.
 */
const attachImages = async (productId, uploaded, { startIndex = 0, makeFirstPrimary = false }) => {
  if (uploaded.length === 0) return [];

  return ProductImage.bulkCreate(
    uploaded.map((image, index) => ({
      productId,
      url: image.url,
      publicId: image.publicId,
      isPrimary: makeFirstPrimary && index === 0,
      sortOrder: startIndex + index,
    }))
  );
};

const create = async (payload, files = []) => {
  await assertCategoryExists(payload.categoryId);

  const slug = await buildUniqueSlug(payload.slug || payload.name, (candidate) =>
    productRepository.slugExists(candidate)
  );

  let sku = payload.sku ? String(payload.sku).trim().toUpperCase() : generateSku(payload.name);
  if (await productRepository.skuExists(sku)) {
    if (payload.sku) {
      throw ApiError.conflict('This SKU is already in use', [
        { field: 'sku', message: 'Choose a unique SKU' },
      ]);
    }
    sku = generateSku(`${payload.name}${Date.now()}`);
  }

  // Images are uploaded before the transaction opens: a Cloudinary round-trip
  // is slow and must not hold a database transaction open.
  const uploaded = files.length > 0 ? await uploadService.uploadImages(files, 'products') : [];

  try {
    const product = await sequelize.transaction(async (transaction) => {
      const created = await productRepository.create({ ...payload, slug, sku }, { transaction });

      if (created.stock > 0) {
        await Inventory.create(
          {
            productId: created.id,
            changeQuantity: created.stock,
            stockAfter: created.stock,
            reason: INVENTORY_REASON.RESTOCK,
            referenceType: 'product_create',
            referenceId: created.id,
            note: 'Opening stock',
          },
          { transaction }
        );
      }

      return created;
    });

    await attachImages(product.id, uploaded, { makeFirstPrimary: true });
    return productRepository.findById(product.id);
  } catch (error) {
    // Roll the uploads back so a failed insert does not leave orphaned assets.
    await uploadService.destroyImages(uploaded.map((image) => image.publicId));
    throw error;
  }
};

const update = async (id, payload, files = []) => {
  const product = await getById(id);
  const next = { ...payload };

  if (payload.categoryId && String(payload.categoryId) !== String(product.categoryId)) {
    await assertCategoryExists(payload.categoryId);
  }

  if (payload.slug && payload.slug !== product.slug) {
    next.slug = await buildUniqueSlug(payload.slug, (candidate) =>
      productRepository.slugExists(candidate, product.id)
    );
  } else {
    delete next.slug;
  }

  if (payload.sku) {
    const sku = String(payload.sku).trim().toUpperCase();
    if (sku !== product.sku && (await productRepository.skuExists(sku, product.id))) {
      throw ApiError.conflict('This SKU is already in use', [
        { field: 'sku', message: 'Choose a unique SKU' },
      ]);
    }
    next.sku = sku;
  }

  // A stock edit is a real inventory movement and is recorded as one.
  const stockDelta =
    payload.stock !== undefined ? Number.parseInt(payload.stock, 10) - product.stock : 0;

  await productRepository.update(product, next);

  if (stockDelta !== 0) {
    await Inventory.create({
      productId: product.id,
      changeQuantity: stockDelta,
      stockAfter: product.stock,
      reason: INVENTORY_REASON.MANUAL_ADJUSTMENT,
      referenceType: 'product_update',
      referenceId: product.id,
      note: 'Stock adjusted from the admin dashboard',
    });
  }

  if (files.length > 0) {
    const uploaded = await uploadService.uploadImages(files, 'products');
    const existingCount = await ProductImage.count({ where: { productId: product.id } });
    await attachImages(product.id, uploaded, {
      startIndex: existingCount,
      makeFirstPrimary: existingCount === 0,
    });
  }

  return productRepository.findById(product.id);
};

const remove = async (id) => {
  const product = await getById(id);
  const images = await ProductImage.findAll({ where: { productId: product.id } });

  await productRepository.destroy(product);
  // Soft delete keeps order history readable, so the image rows stay too; only
  // the remote assets are released.
  await uploadService.destroyImages(images.map((image) => image.publicId));

  return { deleted: true };
};

const addImages = async (id, files = []) => {
  const product = await getById(id);
  if (files.length === 0) throw ApiError.badRequest('No images were uploaded');

  const uploaded = await uploadService.uploadImages(files, 'products');
  const existingCount = await ProductImage.count({ where: { productId: product.id } });

  await attachImages(product.id, uploaded, {
    startIndex: existingCount,
    makeFirstPrimary: existingCount === 0,
  });

  return productRepository.findById(product.id);
};

const removeImage = async (id, imageId) => {
  const product = await getById(id);
  const image = await ProductImage.findOne({ where: { id: imageId, productId: product.id } });
  if (!image) throw ApiError.notFound('Image not found on this product');

  await image.destroy();
  await uploadService.destroyImage(image.publicId);

  // Promote the next image so the product never renders without a hero shot.
  if (image.isPrimary) {
    const next = await ProductImage.findOne({
      where: { productId: product.id },
      order: [['sortOrder', 'ASC']],
    });
    if (next) {
      next.isPrimary = true;
      await next.save();
    }
  }

  return productRepository.findById(product.id);
};

const setPrimaryImage = async (id, imageId) => {
  const product = await getById(id);
  const image = await ProductImage.findOne({ where: { id: imageId, productId: product.id } });
  if (!image) throw ApiError.notFound('Image not found on this product');

  await ProductImage.update({ isPrimary: false }, { where: { productId: product.id } });
  image.isPrimary = true;
  await image.save();

  return productRepository.findById(product.id);
};

module.exports = {
  listPublic,
  listForAdmin,
  getBySlug,
  getById,
  getDetail,
  getRelated,
  create,
  update,
  remove,
  addImages,
  removeImage,
  setPrimaryImage,
};
