import ProductForm from '@/components/admin/ProductForm';

export const metadata = {
  title: 'Add product',
  robots: { index: false, follow: false },
};

export default function NewProductPage() {
  return <ProductForm />;
}
