import { categoryMetadata } from '@/components/CategoryPage';
import SqlLibrary from '@/components/sql/SqlLibrary';

export const generateMetadata = ({ searchParams }) => categoryMetadata('sql', searchParams);

// SQL has its own list layout (hero + card list); AI and HR still use CategoryPage.
export default function SqlProblemsPage({ searchParams }) {
  return <SqlLibrary searchParams={searchParams} />;
}