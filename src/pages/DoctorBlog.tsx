import AdminArticles from './AdminArticles';

export default function DoctorBlog() {
  return (
    <AdminArticles
      basePath="/doctor/blog"
      ownArticlesOnly
      title="Blog"
      description=""
    />
  );
}
