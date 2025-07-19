import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Mail, Phone, Calendar, Loader2, ChevronLeft, ChevronRight, Edit, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchAllUsers, updateUserStatus } from '@/services/adminService';
import { UserProfile } from '@/services/authService';
import { toast } from 'sonner';
import { useAppSelector } from '@/module/store/hooks';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface PaginationState {
  models: UserProfile[];
  isFirst: boolean;
  isLast: boolean;
  totalElements: number;
  totalPages: number;
}

const AdminUsers = () => {
  const [paginationState, setPaginationState] = useState<PaginationState>({
    models: [],
    isFirst: true,
    isLast: true,
    totalElements: 0,
    totalPages: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const loggedinUser = useAppSelector((state) => state.authReducer.user);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneCountryCode: '',
    phoneNumber: '',
  });

  const loadUsers = async (page: number = currentPage) => {
    try {
      setIsLoading(true);
      const data = await fetchAllUsers(page);
      setPaginationState(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  useEffect(() => {
    if (editUser) {
      setEditForm({
        firstName: editUser.firstName,
        lastName: editUser.lastName,
        email: editUser.email,
        phoneCountryCode: editUser.phoneCountryCode || '',
        phoneNumber: editUser.phoneNumber || '',
      });
    }
  }, [editUser]);

  const handleStatusUpdate = async (userUuid: string, enabled: boolean) => {
    try {
      setIsUpdating(userUuid);
      const updatedUser = await updateUserStatus(userUuid, !enabled);
      setPaginationState(prev => ({
        ...prev,
        models: prev.models.map(user =>
          user.uuid === userUuid ? updatedUser : user
        )
      }));
      toast.success(`User ${!enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setIsUpdating(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdating(editUser.uuid);
      // Call your update API here (e.g., updateUserDetail)
      const updatedUser = await updateUserStatus(editUser.uuid, editUser.enabled); // Replace with actual update API
      setPaginationState(prev => ({
        ...prev,
        models: prev.models.map(user =>
          user.uuid === editUser.uuid ? { ...user, ...editForm } : user
        )
      }));
      toast.success('User updated successfully');
      setEditDialogOpen(false);
      setEditUser(null);
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredUsers = paginationState.models.filter(user => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.enabled) ||
      (filterStatus === 'inactive' && !user.enabled);

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6 flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">
                Manage users, roles, and permissions
              </p>
            </div>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="inactive">Inactive</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.uuid}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.phoneCountryCode && user.phoneNumber ? (
                            <div className="text-sm flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {user.phoneCountryCode} {user.phoneNumber}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {user.roles.map((role) => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.enabled ? "default" : "destructive"}>
                            {user.enabled ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              onClick={() => { setEditUser(user); setEditDialogOpen(true); }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isUpdating === user.uuid}
                                  className={user.enabled ?
                                    "hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400" :
                                    "hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                                  }
                                >
                                  {isUpdating === user.uuid ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      {user.enabled ? "Disable" : "Enable"}
                                    </>
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm User Status Change</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to {user.enabled ? 'disable' : 'enable'} <strong>{user.firstName} {user.lastName}</strong> ({user.email})?
                                    {user.enabled ? ' This will prevent them from accessing the system.' : ' This will allow them to access the system.'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleStatusUpdate(user.uuid, user.enabled)}
                                    className={user.enabled ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                                  >
                                    {user.enabled ? 'Disable User' : 'Enable User'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                        {/* <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">Edit</Button>

                            {user.uuid !== loggedinUser.uuid && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(user.uuid, user.enabled)}
                                disabled={isUpdating === user.uuid}
                              >
                                {isUpdating === user.uuid ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  user.enabled ? "Disable" : "Enable"
                                )}
                              </Button>
                            )}

                            {user.uuid === loggedinUser.uuid && (
                              <Button variant="outline" size="sm" disabled>
                                Self
                              </Button>
                            )}
                          </div>
                        </TableCell> */}

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {paginationState.models.length} of {paginationState.totalElements} users
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={paginationState.isFirst}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm font-medium">
                    Page {currentPage} of {paginationState.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={paginationState.isLast}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-1">First Name</label>
              <Input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} required />
            </div>
            <div>
              <label className="block font-medium mb-1">Last Name</label>
              <Input value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} required />
            </div>
            <div>
              <label className="block font-medium mb-1">Email</label>
              <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block font-medium mb-1">Country Code</label>
                <Input value={editForm.phoneCountryCode} onChange={e => setEditForm(f => ({ ...f, phoneCountryCode: e.target.value }))} />
              </div>
              <div className="flex-1">
                <label className="block font-medium mb-1">Phone Number</label>
                <Input value={editForm.phoneNumber} onChange={e => setEditForm(f => ({ ...f, phoneNumber: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isUpdating === (editUser && editUser.uuid)}>
                {isUpdating === (editUser && editUser.uuid) ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;