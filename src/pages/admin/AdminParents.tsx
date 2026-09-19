import AdminUsers from '@/pages/AdminUsers';

/** Pet parents only — thin wrapper over the shared admin user list. */
export default function AdminParents() {
  return <AdminUsers mode="parents" />;
}
