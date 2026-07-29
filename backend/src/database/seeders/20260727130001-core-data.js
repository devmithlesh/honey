'use strict';

const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

const now = () => new Date();

const ROLES = [
  { name: 'admin', description: 'Full access to the admin dashboard and all business data' },
  { name: 'customer', description: 'Storefront customer account' },
];

const SETTINGS = [
  ['site_name', 'Honey Bee Farm', 'string', 'general', 'Website name', true],
  ['site_tagline', 'Pure raw honey, straight from our hives', 'string', 'general', 'Tagline', true],
  ['contact_email', 'hello@honeybeefarm.local', 'string', 'contact', 'Contact email', true],
  ['contact_phone', '+91 81969 69106', 'string', 'contact', 'Contact phone', true],
  ['contact_address', 'Hive Road, Rampur, Uttarakhand 244901, India', 'string', 'contact', 'Farm address', true],
  ['whatsapp_number', '918196969106', 'string', 'contact', 'WhatsApp number', true],
  ['social_instagram', 'https://instagram.com/honeybeefarm', 'string', 'social', 'Instagram', true],
  ['social_facebook', 'https://facebook.com/honeybeefarm', 'string', 'social', 'Facebook', true],
  // Money kept as a string so it parses through the same DECIMAL path as prices.
  ['shipping_charge', '49.00', 'number', 'shipping', 'Flat shipping charge', true],
  ['free_shipping_threshold', '999.00', 'number', 'shipping', 'Order value for free shipping', true],
  ['upi_id', 'honeybeefarm@upi', 'string', 'payment', 'UPI ID for manual payments', true],
  ['upi_qr_url', '', 'string', 'payment', 'UPI QR code image URL', true],
  ['cod_enabled', 'true', 'boolean', 'payment', 'Accept cash on delivery', true],
  ['seo_meta_title', 'Honey Bee Farm — Pure Raw Honey Online', 'string', 'seo', 'Default meta title', true],
  ['seo_meta_description', 'Buy raw, unfiltered and lab-tested honey harvested from our own hives.', 'string', 'seo', 'Default meta description', true],
  ['low_stock_threshold', '10', 'number', 'inventory', 'Low stock alert threshold', false],
];

const CATEGORIES = [
  ['Raw Honey', 'raw-honey', 'Unheated and unfiltered honey, exactly as the bees made it.', 1],
  ['Organic Honey', 'organic-honey', 'Certified organic honey from pesticide-free foraging grounds.', 2],
  ['Forest Honey', 'forest-honey', 'Wild multi-floral honey gathered from deep forest hives.', 3],
  ['Mustard Honey', 'mustard-honey', 'Creamy, fast-crystallising honey from mustard blossom fields.', 4],
  ['Bee Wax', 'bee-wax', 'Pure filtered beeswax for candles, balms and cosmetics.', 5],
  ['Gift Packs', 'gift-packs', 'Curated honey hampers for festivals and celebrations.', 6],
];

/**
 * slug -> category slug, name, sku, price, discount, weight, stock, featured,
 * short description. Prices are strings so they travel to DECIMAL untouched.
 */
const PRODUCTS = [
  ['raw-honey', 'Himalayan Raw Honey', 'HB-RAW-500', '649.00', '549.00', '500 g', 48, true,
    'Cold-extracted raw honey from high-altitude Himalayan hives, unheated and unfiltered.'],
  ['raw-honey', 'Himalayan Raw Honey', 'HB-RAW-1000', '1149.00', null, '1 kg', 32, false,
    'The family-size jar of our signature cold-extracted Himalayan raw honey.'],
  ['organic-honey', 'Certified Organic Honey', 'HB-ORG-500', '799.00', '699.00', '500 g', 26, true,
    'Certified organic honey from hives placed in pesticide-free orchards.'],
  ['forest-honey', 'Wild Forest Honey', 'HB-FST-500', '899.00', null, '500 g', 18, true,
    'Dark, robust multi-floral honey collected from wild forest colonies.'],
  ['forest-honey', 'Wild Forest Honey', 'HB-FST-250', '499.00', '449.00', '250 g', 40, false,
    'A smaller jar of our deep, malty wild forest honey.'],
  ['mustard-honey', 'Mustard Blossom Honey', 'HB-MST-500', '549.00', null, '500 g', 55, false,
    'Creamy, mild honey pressed from golden mustard blossom fields.'],
  ['bee-wax', 'Pure Filtered Beeswax Block', 'HB-WAX-200', '399.00', '349.00', '200 g', 24, false,
    'Triple-filtered golden beeswax for candles, salves and wood polish.'],
  ['gift-packs', 'Honey Tasting Gift Box', 'HB-GFT-TRIO', '1499.00', '1299.00', '3 x 250 g', 12, true,
    'Three signature honeys in a hand-packed wooden gift box.'],
];

const BENEFITS = [
  'Naturally rich in antioxidants and enzymes',
  'Soothes sore throats and supports immunity',
  'Unpasteurised, so the natural pollen stays intact',
  'A clean, unrefined alternative to processed sugar',
].join('\n');

const INGREDIENTS = '100% pure raw honey. No added sugar, water, colour or preservatives.';

/** Deterministic placeholder imagery so the storefront renders before uploads. */
const imageFor = (slug) =>
  `https://res.cloudinary.com/demo/image/upload/w_800,h_800,c_fill,q_auto,f_auto/sample.jpg#${slug}`;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const timestamp = now();

    // ----- Roles -------------------------------------------------------------
    await queryInterface.bulkInsert(
      'roles',
      ROLES.map((r) => ({ ...r, created_at: timestamp, updated_at: timestamp }))
    );

    const [roleRows] = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('admin','customer');`
    );
    const roleId = Object.fromEntries(roleRows.map((r) => [r.name, r.id]));

    // ----- Administrator -----------------------------------------------------
    // Hashed here rather than through the model hook, because bulkInsert
    // bypasses Sequelize model hooks entirely.
    const adminPassword = await bcrypt.hash(
      process.env.SEED_ADMIN_PASSWORD || 'ChangeMe@12345',
      Number(process.env.BCRYPT_SALT_ROUNDS || 12)
    );

    await queryInterface.bulkInsert('users', [
      {
        role_id: roleId.admin,
        name: process.env.SEED_ADMIN_NAME || 'Farm Administrator',
        email: (process.env.SEED_ADMIN_EMAIL || 'admin@honeybeefarm.local').toLowerCase(),
        password: adminPassword,
        is_active: true,
        email_verified_at: timestamp,
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]);

    // ----- Settings ----------------------------------------------------------
    await queryInterface.bulkInsert(
      'settings',
      SETTINGS.map(([key, value, type, group, label, isPublic]) => ({
        setting_key: key,
        setting_value: value,
        value_type: type,
        setting_group: group,
        label,
        is_public: isPublic,
        created_at: timestamp,
        updated_at: timestamp,
      }))
    );

    // ----- Categories --------------------------------------------------------
    await queryInterface.bulkInsert(
      'categories',
      CATEGORIES.map(([name, slug, description, sortOrder]) => ({
        name,
        slug,
        description,
        sort_order: sortOrder,
        is_active: true,
        meta_title: `${name} | Honey Bee Farm`,
        meta_description: description,
        created_at: timestamp,
        updated_at: timestamp,
      }))
    );

    const [categoryRows] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM categories;`
    );
    const categoryId = Object.fromEntries(categoryRows.map((c) => [c.slug, c.id]));

    // ----- Products ----------------------------------------------------------
    await queryInterface.bulkInsert(
      'products',
      PRODUCTS.map(
        ([catSlug, name, sku, price, discount, weight, stock, featured, shortDescription]) => ({
          category_id: categoryId[catSlug],
          name,
          // SKU is appended so the two pack sizes of one honey stay unique.
          slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sku.split('-').pop().toLowerCase()}`,
          sku,
          short_description: shortDescription,
          description: `${shortDescription}\n\nHarvested in small batches from our own hives and packed within days, so nothing is lost between the comb and your kitchen.`,
          benefits: BENEFITS,
          ingredients: INGREDIENTS,
          price,
          discount_price: discount,
          weight,
          stock,
          low_stock_threshold: 10,
          is_featured: featured,
          is_active: true,
          rating_average: 0,
          rating_count: 0,
          meta_title: `${name} ${weight} | Honey Bee Farm`,
          meta_description: shortDescription,
          created_at: timestamp,
          updated_at: timestamp,
        })
      )
    );

    const [productRows] = await queryInterface.sequelize.query(
      `SELECT id, slug, name FROM products;`
    );

    // ----- Product images ----------------------------------------------------
    await queryInterface.bulkInsert(
      'product_images',
      productRows.map((product) => ({
        product_id: product.id,
        url: imageFor(product.slug),
        alt_text: product.name,
        is_primary: true,
        sort_order: 0,
        created_at: timestamp,
        updated_at: timestamp,
      }))
    );

    // ----- Opening stock ledger ---------------------------------------------
    // Every product starts with a movement so `products.stock` always reconciles
    // against the ledger rather than appearing from nowhere.
    const [stockRows] = await queryInterface.sequelize.query(
      `SELECT id, stock FROM products;`
    );
    await queryInterface.bulkInsert(
      'inventory',
      stockRows.map((product) => ({
        product_id: product.id,
        change_quantity: product.stock,
        stock_after: product.stock,
        reason: 'restock',
        reference_type: 'seed',
        note: 'Opening stock from initial seed',
        created_at: timestamp,
        updated_at: timestamp,
      }))
    );

    // ----- Launch coupons ----------------------------------------------------
    await queryInterface.bulkInsert('coupons', [
      {
        code: 'WELCOME10',
        description: '10% off your first order',
        type: 'percentage',
        value: '10.00',
        min_order_amount: '499.00',
        max_discount_amount: '150.00',
        usage_limit: null,
        usage_limit_per_user: 1,
        used_count: 0,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        code: 'HONEY50',
        description: 'Flat Rs.50 off orders above Rs.799',
        type: 'fixed',
        value: '50.00',
        min_order_amount: '799.00',
        max_discount_amount: null,
        usage_limit: 500,
        usage_limit_per_user: 2,
        used_count: 0,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]);
  },

  async down(queryInterface) {
    // Reverse dependency order; products/categories are restricted, so children
    // must go first.
    await queryInterface.bulkDelete('inventory', null, {});
    await queryInterface.bulkDelete('product_images', null, {});
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('coupons', null, {});
    await queryInterface.bulkDelete('settings', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  },
};
