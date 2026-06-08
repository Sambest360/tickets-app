import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { useRegisterTicket } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Crown, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  churchAssembly: z.string().optional(),
  quantity: z.number().min(1).max(5).default(1),
});

type FormValues = z.infer<typeof formSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerTicket = useRegisterTicket();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      gender: "MALE",
      churchAssembly: "",
      quantity: 1,
    },
  });

  const onSubmit = (data: FormValues) => {
    registerTicket.mutate(
      { data },
      {
        onSuccess: (ticket) => {
          toast({
            title: "Registration Successful!",
            description: "Your ticket has been generated.",
            style: { backgroundColor: '#D4AF37', color: '#000', borderColor: '#B8860B' }
          });
          setLocation(`/ticket/${ticket.id}`);
        },
        onError: (error) => {
          toast({
            title: "Registration Failed",
            description: error.error || "An error occurred. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground py-12 px-4 sm:px-6 relative flex justify-center items-center">
      {/* Background accents */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/20 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-card border border-primary/20 rounded-xl p-6 sm:p-10 shadow-2xl relative z-10"
      >
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-primary pl-0">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>

        <div className="text-center mb-10">
          <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-cinzel font-bold text-primary mb-2">Secure Your Seat</h1>
          <p className="text-muted-foreground">Crowned In His Glory 2026</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/90">First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" className="bg-black border-primary/30 focus-visible:ring-primary" {...field} />
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
                    <FormLabel className="text-foreground/90">Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" className="bg-black border-primary/30 focus-visible:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/90">Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="081 234 5678" type="tel" className="bg-black border-primary/30 focus-visible:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/90">Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black border-primary/30 focus-visible:ring-primary">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-primary/30">
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="churchAssembly"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">Church Assembly (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Richmond Hill Assembly" className="bg-black border-primary/30 focus-visible:ring-primary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 border-t border-primary/10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-cinzel text-primary">Ticket Price</h3>
                  <p className="text-muted-foreground text-sm">Standard Admission</p>
                </div>
                <div className="text-2xl font-bold text-accent">R50</div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-secondary text-black font-bold h-14 text-lg rounded-none uppercase tracking-wider"
                disabled={registerTicket.isPending}
              >
                {registerTicket.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
