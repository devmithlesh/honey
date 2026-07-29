'use strict';

const ApiError = require('../utils/ApiError');
const categoryRepository = require('../repositories/category.repository');
const uploadService = require('./upload.service');
const { buildUniqueSlug } = require('../utils/identifiers');

const listPublic = () =>
  categoryRepository.findAll({ includeInactive: false, withProductCount: true });

const listForAdmin = () =>
  categoryRepository.findAll({ includeInactive: true, withProductCount: true });

const getBySlug = async (slug) => {
  const category = await categoryRepository.findBySlug(slug);
  if (!category) throw ApiError.notFound('Category not found');
  return category;
};

const getById = async (id) => {
  const category = await categoryRepository.findById(id);
  if (!category) throw ApiError.notFound('Category not found');
  return category;
};

const create = async (payload, file) => {
  const slug = await buildUniqueSlug(payload.slug || payload.name, (candidate) =>
    categoryRepository.slugExists(candidate)
  );

  const image = file ? await uploadService.uploadImage(file, 'categories') : null;

  return categoryRepository.create({
    ...payload,
    slug,
    imageUrl: image?.url || payload.imageUrl || null,
    imagePublicId: image?.publicId || null,
  });
};

const update = async (id, payload, file) => {
  const category = await getById(id);

  const next = { ...payload };

  // Only recompute the slug when the admin actually changed it, so existing
  // category URLs (and their SEO value) survive an unrelated edit.
  if (payload.slug && payload.slug !== category.slug) {
    next.slug = await buildUniqueSlug(payload.slug, (candidate) =>
      categoryRepository.slugExists(candidate, category.id)
    );
  } else {
    delete next.slug;
  }

  if (file) {
    const image = await uploadService.uploadImage(file, 'categories');
    // Replace, then delete the previous asset so no orphan is left behind.
    const previousPublicId = category.imagePublicId;
    next.imageUrl = image.url;
    next.imagePublicId = image.publicId;
    await categoryRepository.update(category, next);
    await uploadService.destroyImage(previousPublicId);
    return category;
  }

  return categoryRepository.update(category, next);
};

const remove = async (id) => {
  const category = await getById(id);

  const productCount = await categoryRepository.countProducts(category.id);
  if (productCount > 0) {
    throw ApiError.conflict(
      `This category still holds ${productCount} product(s). Move or delete them first.`
    );
  }

  await categoryRepository.destroy(category);
  await uploadService.destroyImage(category.imagePublicId);
  return { deleted: true };
};

module.exports = { listPublic, listForAdmin, getBySlug, getById, create, update, remove };
