import { useEffect, useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetTicket, getGetTicketQueryKey } from "@workspace/api-client-react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Crown, Download, ArrowLeft, Ticket as TicketIcon } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function TicketView() {
  const [, params] = useRoute("/ticket/:id");
  const ticketId = params?.id ? parseInt(params.id) : 0;
  
  const { data: ticket, isLoading, isError } = useGetTicket(ticketId, {
    query: {
      enabled: !!ticketId,
      queryKey: getGetTicketQueryKey(ticketId)
    }
  });

  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const ticketRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (ticket?.ticketNumber) {
      QRCode.toDataURL(ticket.ticketNumber, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }).then(setQrCodeUrl);
    }
  }, [ticket?.ticketNumber]);

  const handleDownload = async () => {
    if (!ticketRef.current || !ticket) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `CrownedInHisGlory2026_${ticket.ticketNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to generate ticket image", error);
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
        <Skeleton className="w-[800px] h-[350px] max-w-full rounded-xl bg-card border border-primary/20" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4 text-center">
        <Crown className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-3xl font-cinzel text-destructive mb-2">Ticket Not Found</h1>
        <p className="text-muted-foreground mb-8">We couldn't find the ticket you're looking for.</p>
        <Link href="/">
          <Button variant="outline" className="border-primary text-primary">Return Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-[800px] mb-6 flex justify-between items-center relative z-10">
        <Link href="/">
          <Button variant="ghost" className="text-muted-foreground hover:text-primary pl-0">
            <ArrowLeft className="w-4 h-4 mr-2" /> Home
          </Button>
        </Link>
        <Button 
          onClick={handleDownload} 
          disabled={downloading}
          className="bg-primary hover:bg-secondary text-black font-bold uppercase"
        >
          {downloading ? "Generating..." : (
            <><Download className="w-4 h-4 mr-2" /> Download Ticket</>
          )}
        </Button>
      </div>

      {/* Ticket Container */}
      <motion.div 
        initial={{ y: 20, opacity: 0, rotateX: 10 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="relative z-10 perspective-1000"
      >
        <div 
          ref={ticketRef}
          className="w-full max-w-[800px] h-auto md:h-[350px] flex flex-col md:flex-row shadow-[0_0_50px_rgba(212,175,55,0.2)] rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #D4AF37 0%, #B8860B 50%, #D4AF37 100%)",
            color: "#000000"
          }}
        >
          {/* LEFT STUB */}
          <div className="w-full md:w-[220px] flex flex-row md:flex-col justify-between items-center p-6 border-b-2 md:border-b-0 md:border-r-2 border-black/30 border-dashed relative bg-black/5">
            <div className="hidden md:flex flex-col h-full justify-between items-center py-4">
              <span className="font-cinzel font-bold tracking-widest text-sm -rotate-90 whitespace-nowrap opacity-70">ADMIT ONE</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left space-y-4">
              <div>
                <p className="font-cinzel text-xs font-bold uppercase opacity-70">Date & Time</p>
                <p className="font-sans font-bold text-sm">THU, 25 JUN 2026</p>
                <p className="font-sans font-bold text-sm">6:00 PM</p>
              </div>
              
              <div>
                <p className="font-cinzel text-xs font-bold uppercase opacity-70">Venue</p>
                <p className="font-sans font-bold text-sm">16 GLEN STREET</p>
                <p className="font-sans font-bold text-sm">RICHMOND HILL</p>
              </div>

              <div className="pt-2 border-t border-black/20 w-full mt-4">
                <p className="font-cinzel font-bold text-lg text-center tracking-wider">R50.00</p>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col relative overflow-hidden bg-black/5">
            {/* Watermark/Texture */}
            <Crown className="absolute -bottom-10 -right-10 w-64 h-64 text-black/5 rotate-12" />
            
            <div className="text-center mb-4 relative z-10">
              <p className="text-[0.6rem] sm:text-xs font-cinzel font-bold tracking-[0.2em] uppercase opacity-80 mb-2">
                The Church of Pentecost / Port Elizabeth District / Youth Ministry Presents
              </p>
              <div className="flex justify-center items-center gap-4 mb-2">
                <div className="h-px bg-black/30 flex-1" />
                <Crown className="w-6 h-6 text-black" />
                <div className="h-px bg-black/30 flex-1" />
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel font-black tracking-tight leading-none mb-1">
                CROWNED IN HIS
              </h1>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-great-vibes -mt-2 mb-2 pr-8 text-black/90">
                Glory <span className="font-cinzel text-2xl lg:text-3xl font-bold not-italic tracking-normal">2026</span>
              </h2>
              
              <p className="font-playfair text-xs sm:text-sm italic font-medium opacity-90 max-w-md mx-auto">
                "A Night of Elegance, Talent, Culture and Godly Excellence"
              </p>
            </div>

            <div className="mt-auto flex justify-between items-end relative z-10">
              <div>
                <p className="font-cinzel text-xs font-bold opacity-70 uppercase mb-1">Admit</p>
                <p className="font-cinzel text-xl sm:text-2xl font-black uppercase leading-none">
                  {ticket.firstName} {ticket.lastName}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <TicketIcon className="w-4 h-4 opacity-70" />
                  <p className="font-mono font-bold tracking-wider text-sm">{ticket.ticketNumber}</p>
                </div>
              </div>

              {qrCodeUrl && (
                <div className="bg-white p-1.5 rounded-sm shadow-md">
                  <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
