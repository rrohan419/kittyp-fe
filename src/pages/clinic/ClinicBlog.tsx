import AdminArticles from '@/pages/AdminArticles';

export default function ClinicBlog() {
  return (
    <AdminArticles
      basePath="/clinic/blog"
      ownArticlesOnly
      title="Articles"
      description="Publish clinic blogs to the website article section."
    />
  );
}
