import CategoryPage, { categoryMetadata } from '@/components/CategoryPage';

export const generateMetadata = ({ searchParams }) => categoryMetadata('sql', searchParams);

// Same list as AI and HR: topics (document tabs) with their questions.
export default function SqlProblemsPage({ searchParams }) {
  return <CategoryPage category="sql" searchParams={searchParams} />;
}