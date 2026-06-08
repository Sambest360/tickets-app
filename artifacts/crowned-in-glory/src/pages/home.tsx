import { Link } from "wouter";
import { motion } from "framer-motion";
import { ParticleBackground } from "@/components/ParticleBackground";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useGetEventStats } from "@workspace/api-client-react";
import { Crown, MapPin, Calendar, Clock, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: stats, isLoading } = useGetEventStats();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-hidden relative">
      <ParticleBackground />
      
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 sm:px-6 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-center z-10 max-w-4xl mx-auto"
        >
          <div className="flex justify-center mb-6">
            <Crown className="w-16 h-16 sm:w-20 sm:h-20 text-primary drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
          </div>
          
          <h3 className="text-accent uppercase tracking-[0.3em] text-xs sm:text-sm mb-4 font-medium">
            The Church of Pentecost / Port Elizabeth District / Youth Ministry Presents
          </h3>
          
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary drop-shadow-sm mb-4 leading-tight">
            CROWNED IN HIS<br/>
            <span className="font-great-vibes text-7xl sm:text-8xl md:text-9xl text-primary font-normal lowercase capitalize drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]">Glory</span> 2026
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-foreground/80 font-playfair italic mb-10">
            "A Night of Elegance, Talent, Culture and Godly Excellence"
          </p>

          {/* Stats if available */}
          <div className="mb-8 flex justify-center items-center gap-2 text-sm text-primary/80 bg-black/40 px-4 py-2 rounded-full border border-primary/20 backdrop-blur-sm w-max mx-auto">
            <TicketIcon className="w-4 h-4" />
            {isLoading ? (
              <Skeleton className="w-20 h-4 bg-primary/20" />
            ) : (
              <span>{stats?.totalTickets || 0} Tickets Claimed</span>
            )}
          </div>

          <Link href="/register">
            <Button size="lg" className="bg-gradient-to-r from-secondary via-primary to-secondary hover:from-primary hover:via-accent hover:to-primary text-black font-bold uppercase tracking-wider px-10 py-6 text-lg rounded-none border border-accent/50 shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_50px_rgba(212,175,55,0.5)] transition-all duration-500">
              Get Your Ticket
            </Button>
          </Link>
        </motion.div>

        <CountdownTimer />
      </section>

      {/* Details Section */}
      <section className="py-24 px-4 sm:px-6 relative z-10 bg-black/50 border-t border-primary/20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-cinzel text-center text-primary mb-16 uppercase tracking-widest">Event Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card/50 border border-primary/20 p-6 rounded-lg text-center hover:bg-card hover:border-primary/40 transition-colors duration-300 group">
              <Calendar className="w-10 h-10 mx-auto text-accent mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="font-cinzel text-lg text-primary mb-2">Date</h4>
              <p className="text-muted-foreground">Thursday<br/>25 June 2026</p>
            </div>
            
            <div className="bg-card/50 border border-primary/20 p-6 rounded-lg text-center hover:bg-card hover:border-primary/40 transition-colors duration-300 group">
              <Clock className="w-10 h-10 mx-auto text-accent mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="font-cinzel text-lg text-primary mb-2">Time</h4>
              <p className="text-muted-foreground">6:00 PM – 9:00 PM</p>
            </div>
            
            <div className="bg-card/50 border border-primary/20 p-6 rounded-lg text-center hover:bg-card hover:border-primary/40 transition-colors duration-300 group">
              <MapPin className="w-10 h-10 mx-auto text-accent mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="font-cinzel text-lg text-primary mb-2">Venue</h4>
              <p className="text-muted-foreground">16 Glen Street<br/>Richmond Hill</p>
            </div>

            <div className="bg-card/50 border border-primary/20 p-6 rounded-lg text-center hover:bg-card hover:border-primary/40 transition-colors duration-300 group">
              <Crown className="w-10 h-10 mx-auto text-accent mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="font-cinzel text-lg text-primary mb-2">Dress Code</h4>
              <p className="text-muted-foreground">Royal Elegance<br/>(Formal)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/20 py-8 text-center bg-black z-10 relative">
        <p className="text-muted-foreground text-sm font-playfair">
          &copy; {new Date().getFullYear()} The Church of Pentecost Port Elizabeth District. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
