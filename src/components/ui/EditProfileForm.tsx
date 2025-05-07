
import React, { useState } from 'react';
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
import { useCart } from '@/context/CartContext';
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

const EditProfileForm = () => {
  const { user, setUser } = useCart();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phoneCountryCode: user.phoneCountryCode || "+1",
      phoneNumber: user.phoneNumber || "",
      address: "",
      birthday: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // async function onSubmit(values: z.infer<typeof formSchema>) {
  //   console.log(values);

  //   const userDetail = await updateUserDetails(user.uuid, {
  //     email: values.email,
  //     firstName: values.firstName,
  //     lastName: values.lastName,
  //     phoneCountryCode: 'ji',
  //     phoneNumber: '7678',
  //   });

  //   setUser(userDetail);
  //   localStorage.setItem("user", JSON.stringify(userDetail));


  // }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const userDetail = await updateUserDetails(user.uuid, {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        phoneCountryCode: values.phoneCountryCode,
        phoneNumber: values.phoneNumber,
      });

      setUser(userDetail);
      localStorage.setItem("user", JSON.stringify(userDetail));
      navigate('/');
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;


  return (
    // <div className="h-screen overflow-hidden flex flex-col">
    //   <div className="flex-1 overflow-y-auto px-4 pb-36">
  //   <div className="min-h-screen flex flex-col bg-background">
  // <div className="flex-1 overflow-y-auto px-4 pb-36">
  <div className="overflow-y-auto max-h-[calc(100vh-10rem)] pb-20 pr-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="phoneCountryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country Code</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countryCodeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="555-000-0000" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your full shipping address"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Birthday (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="sticky bottom-0 pt-4 pb-2 bg-background">
            <Button type="submit" className="w-full">Save Changes</Button>
          </div>
          </form>
        </Form>
      </div>
  );
};

export default EditProfileForm;
