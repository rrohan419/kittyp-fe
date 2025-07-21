
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserRound, Heart, Bookmark, Camera } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import EditProfileForm from './EditProfileForm';
import { useIsMobile } from '@/hooks/use-mobile';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import { updateUserProfilePicture } from '@/services/UserService';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/module/store/store';
import { updateUserProfile } from '@/module/slice/AuthSlice';
import { toast } from 'sonner';

interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  memberSince: string;
  ordersCount: number;
  profilePictureUrl?: string;
  userUuid: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  firstName,
  lastName,
  memberSince,
  ordersCount,
  profilePictureUrl,
  userUuid
}) => {
  const isMobile = useIsMobile();
  const dispatch = useDispatch<AppDispatch>();
  return (
    <div className="animate-fade-in glass-effect rounded-xl shadow-md transition-default">
      <div className="container-padding py-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="relative flex-shrink-0 group">
            <div className="flex justify-center">
              <ProfilePictureUpload
                currentImageUrl={profilePictureUrl}
                onUploadComplete={async (url) => {
                  try {
                    // Update user profile with new image URL
                    const updatedUser = await updateUserProfilePicture(userUuid, url);
                    // Update Redux store
                    dispatch(updateUserProfile(updatedUser));
                    toast.success('Profile picture updated successfully!');
                  } catch (error) {
                    console.error('Failed to update profile picture:', error);
                    toast.error('Failed to update profile picture');
                  }
                }}
                onUploadError={(error) => {
                  console.error('Profile picture upload failed:', error);
                  toast.error('Profile picture upload failed');
                }}
                userName={`${firstName} ${lastName}`}
                showName={true}
                size="lg"
              />
            </div>
          </div>
          <div className="flex-grow text-center lg:text-left space-y-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-balance">{firstName} {lastName}</h1>
              <p className="text-muted-foreground">Member since {memberSince}</p>
            </div>

            <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-sm">
              <span className="inline-flex items-center gap-2 hover-lift">
                <div className="p-2 rounded-full bg-accent">
                  <Bookmark className="h-4 w-4 text-primary" />
                </div>
                <span><strong>{ordersCount}</strong> Orders</span>
              </span>
            </div>
          </div>

          <div>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="hover-lift shadow-sm border-primary/20 hover:bg-accent"
                >
                  Edit Profile
                </Button>
              </SheetTrigger>
              <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[85vh]" : ""}>
                <SheetHeader>
                  <SheetTitle className="text-xl font-semibold">Edit Profile</SheetTitle>
                </SheetHeader>
                <div className="mt-8">
                  <EditProfileForm />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
