import CategoryPage, { categoryMetadata } from '@/components/CategoryPage';

export const generateMetadata = ({ searchParams }) => categoryMetadata('sql', searchParams);

export default function SqlProblemsPage({ searchParams }) {
  return <CategoryPage category="sql" searchParams={searchParams} />;
}