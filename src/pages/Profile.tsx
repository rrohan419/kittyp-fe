import React, { useEffect, useRef, useState } from 'react';
import ProfileHeader from '@/components/ui/ProfileHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Footer } from '@/components/layout/Footer';
import { format } from 'date-fns';
import Loading from '@/components/ui/loading';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/module/store/store';
import { validateAndSetUser } from '@/module/slice/AuthSlice';
import FavoritesSection from '@/components/ui/FavoritesSection';
import { findAllSavedAddress } from '@/services/addressService';
import { Button } from '@/components/ui/button';
import { AddressModal } from '@/components/ui/AddressModal';
import EditProfileForm from '@/components/ui/EditProfileForm';
import { getAuthItem } from '@/utils/authStorage';

const PROFILE_TABS = ['favorites', 'details'] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];

function resolveProfileTab(value: string | null | undefined): ProfileTab {
  return value === 'details' ? 'details' : 'favorites';
}

const Profile: React.FC = () => {
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.authReducer);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  useEffect(() => {
    const token = getAuthItem('access_token');
    if (token && !isAuthenticated && !loading) {
      dispatch(validateAndSetUser());
    } else if (!token) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [dispatch, isAuthenticated, loading, navigate, location.pathname]);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (user?.uuid) {
        await findAllSavedAddress(user.uuid);
      }
    };
    fetchAddresses();
  }, [user?.uuid]);

  // Show loading while checking user state
  if (loading || (!isAuthenticated && getAuthItem('access_token'))) {
    return <Loading />;
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    navigate('/login', { state: { from: location.pathname } });
    return null;
  }

  const urlParams = new URLSearchParams(location.search);
  const tabParam = urlParams.get('tab');
  const stateTab = typeof location.state === 'string' ? location.state : undefined;
  const defaultTab = resolveProfileTab(tabParam || stateTab);
  const tabsRef = useRef<HTMLDivElement | null>(null);

  const [currentTab, setCurrentTab] = useState<ProfileTab>(defaultTab);

  useEffect(() => {
    setCurrentTab(defaultTab);
  }, [defaultTab]);

  const handleTabChange = (value: string) => {
    const next = resolveProfileTab(value);
    setCurrentTab(next);
    navigate(`${location.pathname}?tab=${next}`, { replace: true });
  };

  return (
    <>
      <div className="container mx-auto max-w-7xl mt-8 px-4">
        <div className="space-y-8 py-6 md:py-12">
          <div className="space-y-8 py-8 md:py-12">
            <ProfileHeader />

            <div className="space-y-8" ref={tabsRef}>
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full animate-fade-in">
            <TabsList className="mb-6 w-full grid grid-cols-2 bg-accent text-accent-foreground">
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                  <TabsTrigger value="details">Account</TabsTrigger>
                </TabsList>

                <TabsContent value="favorites" className="animate-fade-in">
                  <FavoritesSection />
                </TabsContent>

                <TabsContent value="details" className="animate-fade-in">
                  <div className="bg-card rounded-xl shadow-sm p-6 sm:p-6 space-y-8">
                    <EditProfileForm initiallyEditing={false} />

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Addresses</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Saved addresses</p>
                          <Button
                            variant="outline"
                            className="font-medium"
                            onClick={() => setAddressModalOpen(true)}
                          >
                            View Addresses
                          </Button>
                          <AddressModal open={addressModalOpen} onClose={() => setAddressModalOpen(false)} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                          <p className="font-medium">
                            {user.createdAt
                              ? format(new Date(user.createdAt), 'do MMMM yyyy')
                              : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Profile;
