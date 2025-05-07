
import React, { useState } from 'react';
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

interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  memberSince: string;
  ordersCount: number;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  firstName,
  lastName,
  memberSince,
  ordersCount,
}) => {
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatar(e.target.result as string);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="animate-fade-in glass-effect rounded-xl shadow-md transition-default">
      <div className="container-padding py-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="relative flex-shrink-0 group">
            <Avatar className="h-28 w-28 ring-2 ring-primary/20 shadow-md cursor-pointer overflow-hidden" onClick={handleAvatarClick}>
              {avatar ? (
                <AvatarImage src={avatar} alt={firstName} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-accent">
                  <UserRound className="h-14 w-14 text-primary" />
                </AvatarFallback>
              )}
            </Avatar>
            <div 
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer"
              onClick={handleAvatarClick}
            >
              <Camera className="h-6 w-6 text-white" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
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
              {/* <span className="inline-flex items-center gap-2 hover-lift">
                <div className="p-2 rounded-full bg-accent">
                  <Heart className="h-4 w-4 text-primary" />
                </div>
                <span><strong>Favorites</strong></span>
              </span> */}
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
              {/* <SheetContent> */}
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
