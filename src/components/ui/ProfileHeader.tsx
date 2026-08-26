
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import EditProfileForm from './EditProfileForm';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import { updateUserProfilePicture } from '@/services/UserService';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store/store';
import { updateUserProfile } from '@/module/slice/AuthSlice';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CopyableId } from '@/components/ui/CopyableId';

const ProfileHeader: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.authReducer);
  const [open, setOpen] = useState(false);
  return (
    <div className="animate-fade-in glass-effect rounded-xl shadow-md transition-default">
      <div className="container-padding py-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="relative flex-shrink-0 group">
            <div className="flex justify-center">
              <ProfilePictureUpload
                currentImageUrl={user.profilePictureUrl}
                onUploadComplete={async (url) => {
                  try {
                    const updatedUser = await updateUserProfilePicture(user.uuid, url);
                    dispatch(updateUserProfile(updatedUser));
                    toast.success('Profile picture updated successfully!');
                  } catch (error) {
                    console.error('Failed to update profile picture:', error);
                    toast.error('Failed to update profile picture');
                  }
                }}
                onUploadError={() => {
                  toast.error('Profile picture upload failed');
                }}
                userName={`${user.firstName} ${user.lastName}`}
                showName={true}
                size="lg"
              />
            </div>
          </div>
          <div className="flex-grow text-center lg:text-left space-y-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-balance">{user.firstName} {user.lastName}</h1>
              <p className="text-muted-foreground">Member since {user.createdAt
                ? format(new Date(user.createdAt), "do MMMM yyyy")
                : "-"}</p>
              <CopyableId
                className="justify-center lg:justify-start"
                label="Account ID"
                value={user.uuid}
                hint="Sign in with this ID or your email."
              />
            </div>
          </div>

          <div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="hover-lift shadow-sm border-primary/20 hover:bg-accent"
                >
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto sm:rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="mt-2">
                  <EditProfileForm onSuccess={() => setOpen(false)} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
