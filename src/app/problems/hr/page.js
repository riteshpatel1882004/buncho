import CategoryPage, { categoryMetadata } from '@/components/CategoryPage';

export const generateMetadata = ({ searchParams }) => categoryMetadata('hr', searchParams);

export default function HrProblemsPage({ searchParams }) {
  return <CategoryPage category="hr" searchParams={searchParams} />;
}