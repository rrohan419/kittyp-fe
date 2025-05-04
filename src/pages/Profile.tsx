
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

const Profile: React.FC = () => {
  const {  user } = useCart();
  
  console.log("user created at", user.createdAt);
  console.log("formatted created at",format(new Date(user.createdAt), 'dd MMM yyyy'));
  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl mt-8">
        <div className="space-y-8 py-8 md:py-12">
          <ProfileHeader 
            firstName= {user.firstName}
            lastName= {user.lastName}
            memberSince={
              user.createdAt 
                ? format(new Date(user.createdAt), "do MMMM yyyy") 
                : "-"
            }
            ordersCount={12} 
          />
          
          <div className="space-y-8 container-padding">
            {/* <ProfileStats 
              purchasesCount={12} 
              favoritesCount={5}
              recentViewsCount={24}
            /> */}
            
            <Tabs defaultValue="favorites" className="w-full animate-fade-in">
              <TabsList className="mb-6 w-full md:w-auto bg-accent text-accent-foreground">
                <TabsTrigger value="favorites" className="flex-1 md:flex-none">Favorites</TabsTrigger>
                <TabsTrigger value="orders" className="flex-1 md:flex-none">Order History</TabsTrigger>
                <TabsTrigger value="details" className="flex-1 md:flex-none">Account Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="favorites" className="animate-fade-in">
                <FavoritesSection />
              </TabsContent>
              
              <TabsContent value="orders" className="animate-fade-in">
                <OrderHistory userUuid={user.uuid} />
              </TabsContent>
              
              <TabsContent value="details" className="animate-fade-in">
                <div className="bg-card rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold mb-6">Account Details</h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                        <p className="font-medium">Alex Johnson</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Email</p>
                        <p className="font-medium">alex.johnson@example.com</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Phone</p>
                        <p className="font-medium">+1 (555) 123-4567</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Address</p>
                        <p className="font-medium">123 Main Street, Apt 4B<br />New York, NY 10001</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                        <p className="font-medium">April 2022</p>
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
