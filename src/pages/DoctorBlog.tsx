import AdminArticles from './AdminArticles';

export default function DoctorBlog() {
  return (
    <AdminArticles
      basePath="/doctor/blog"
      ownArticlesOnly
      title="Blog"
      description="Publish articles to the website article section as your doctor profile."
    />
  );
}
