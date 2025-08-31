import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserDetails } from '@/services/UserService';
import { useNavigate } from 'react-router-dom';
import Loading from './loading';
import { useAppDispatch, useAppSelector } from '@/module/store/hooks';
import { setUser } from '@/module/slice/AuthSlice';
import { toast } from 'sonner';

const formSchema = z.object({
  firstName: z.string().min(2, "Name must be at least 2 characters"),
  lastName: z.string(),
  email: z.string().email("Invalid email address"),
  phoneCountryCode: z.string().min(1, "Please select a country code"),
  phoneNumber: z.string().min(5, "Phone number must be at least 5 digits"),
  address: z.string().min(10, "Please enter your full address"),
  birthday: z.string().optional(),
});

const countryCodeOptions = [
  { value: "+1", label: "+1 (USA/Canada)" },
  { value: "+44", label: "+44 (UK)" },
  { value: "+91", label: "+91 (India)" },
  { value: "+61", label: "+61 (Australia)" },
  { value: "+49", label: "+49 (Germany)" },
  { value: "+33", label: "+33 (France)" },
  { value: "+81", label: "+81 (Japan)" },
  { value: "+86", label: "+86 (China)" },
];

const EditProfileForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.authReducer.user);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneCountryCode: "+1",
      phoneNumber: "",
      // address: "",
      birthday: "",
    },
  });

  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneCountryCode: user.phoneCountryCode || "+1",
        phoneNumber: user.phoneNumber || "",
        // address: "",
        birthday: "",
      });
    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user?.uuid) {
      toast.error("Please login to update your profile");
      return;
    }

    try {
      setLoading(true);
      const userDetail = await updateUserDetails(user.uuid, {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        phoneCountryCode: values.phoneCountryCode,
        phoneNumber: values.phoneNumber,
      });

      dispatch(setUser(userDetail));
      // toast.success("Profile updated successfully");
      // navigate('/profile');

      onSuccess?.(); 
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  if (!user?.uuid) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-4">Please login to edit your profile</p>
        <Button onClick={() => navigate('/login')} variant="outline">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] md:h-[calc(100vh-6rem)] overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-24 md:pb-20">
        <div className="px-4 md:px-6">
          <div className="max-w-2xl mx-auto py-8">
            <h2 className="text-2xl font-semibold mb-6">Edit Profile</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">First Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John" 
                            {...field} 
                            className="h-10 px-3 py-2 text-sm rounded-md border border-input bg-background hover:bg-accent/50 focus-visible:ring-1 focus-visible:ring-ring" 
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-500 mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Last Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Doe" 
                            {...field} 
                            className="h-10 px-3 py-2 text-sm rounded-md border border-input bg-background hover:bg-accent/50 focus-visible:ring-1 focus-visible:ring-ring" 
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-500 mt-1" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="john@example.com" 
                          type="email" 
                          {...field} 
                          className="h-10 px-3 py-2 text-sm rounded-md border border-input bg-background hover:bg-accent/50 focus-visible:ring-1 focus-visible:ring-ring" 
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 mt-1" />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="phoneCountryCode"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 text-sm rounded-md border border-input bg-background hover:bg-accent/50 focus:ring-1 focus:ring-ring">
                                <SelectValue placeholder="Code" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countryCodeOptions.map((option) => (
                                <SelectItem 
                                  key={option.value} 
                                  value={option.value}
                                  className="text-sm"
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs text-red-500 mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormControl>
                            <Input 
                              placeholder="555-000-0000" 
                              type="tel" 
                              {...field} 
                              className="h-10 px-3 py-2 text-sm rounded-md border border-input bg-background hover:bg-accent/50 focus-visible:ring-1 focus-visible:ring-ring" 
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-red-500 mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Shipping Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your full shipping address"
                          {...field}
                          className="min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none hover:bg-accent/50 focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 mt-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Birthday (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          className="h-10 px-3 py-2 text-sm rounded-md border border-input bg-background hover:bg-accent/50 focus-visible:ring-1 focus-visible:ring-ring" 
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 mt-1" />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:sticky border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="max-w-2xl mx-auto p-4">
          <Button 
            type="submit" 
            className="w-full h-11 text-sm font-medium shadow-sm"
            onClick={form.handleSubmit(onSubmit)}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileForm;
