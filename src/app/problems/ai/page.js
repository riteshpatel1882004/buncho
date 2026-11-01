import CategoryPage, { categoryMetadata } from '@/components/CategoryPage';

// Same list as /problems (its canonical URL), so nobody is redirected.
export const generateMetadata = ({ searchParams }) => categoryMetadata('ai', searchParams);

export default function AiProblemsPage({ searchParams }) {
  return <CategoryPage category="ai" searchParams={searchParams} />;
}