
import React, { useEffect, useState } from 'react';
import ProfileHeader from '@/components/ui/ProfileHeader';
import ProfileStats from '@/components/ui/ProfileStats';
import FavoritesSection from '@/components/ui/FavoritesSection';
import OrderHistory from '@/components/ui/OrderHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { format } from 'date-fns';
import { useCart } from '@/context/CartContext';
import Loading from '@/components/ui/loading';

const Profile: React.FC = () => {
  const { user } = useCart();
  
  if (!user) {
    return <Loading />;
  }
  return (
    <>
      <Navbar />
        <div className="container mx-auto max-w-7xl mt-8 px-4">
        <div className="space-y-8 py-6 md:py-12">
          <div className="space-y-8 py-8 md:py-12">
            <ProfileHeader
              firstName={user.firstName}
              lastName={user.lastName}
              memberSince={
                user.createdAt
                  ? format(new Date(user.createdAt), "do MMMM yyyy")
                  : "-"
              }
              ordersCount={12}
            />

            <div className="space-y-8">
              {/* <ProfileStats 
              purchasesCount={12} 
              favoritesCount={5}
              recentViewsCount={24}
            /> */}

              <Tabs defaultValue="favorites" className="w-full animate-fade-in">
              <TabsList className="mb-6 w-full grid grid-cols-3 bg-accent text-accent-foreground">
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="details">Account</TabsTrigger>
                </TabsList>

                <TabsContent value="favorites" className="animate-fade-in">
                  <FavoritesSection />
                </TabsContent>

                <TabsContent value="orders" className="animate-fade-in">
                  <OrderHistory userUuid={user.uuid} />
                </TabsContent>

                <TabsContent value="details" className="animate-fade-in">
                  <div className="bg-card rounded-xl shadow-sm p-6 sm:p-6">
                    <h2 className="text-2xl font-bold mb-6">Account Details</h2>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Email</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Phone</p>
                          <p className="font-medium">{user.phoneCountryCode && user.phoneNumber 
                              ? `${user.phoneCountryCode} ${user.phoneNumber}` 
                              : 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Address</p>
                          <p className="font-medium">123 Main Street, Apt 4B<br />New York, NY 10001</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                          <p className="font-medium">{
                            user.createdAt
                              ? format(new Date(user.createdAt), "do MMMM yyyy")
                              : "-"
                          }</p>
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
