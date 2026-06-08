import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useCheckInTicket } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, CheckCircle2, XCircle, AlertCircle, ScanLine, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

type ScanResult = "idle" | "valid" | "already_checked_in" | "invalid";

export default function Scan() {
  const [scanResult, setScanResult] = useState<ScanResult>("idle");
  const [resultMessage, setResultMessage] = useState("");
  const [attendeeName, setAttendeeName] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [manualTicket, setManualTicket] = useState("");
  
  const checkInMutation = useCheckInTicket();

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (scanResult === "idle") {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render(onScanSuccess, onScanFailure);
    }

    function onScanSuccess(decodedText: string) {
      if (scanner) {
        scanner.pause(true);
      }
      handleCheckIn(decodedText);
    }

    function onScanFailure(error: any) {
      // Ignore normal scanning errors
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanResult]);

  const handleCheckIn = (ticketNum: string) => {
    checkInMutation.mutate(
      { data: { ticketNumber: ticketNum } },
      {
        onSuccess: (res) => {
          setTicketNumber(ticketNum);
          if (res.ticket) {
            setAttendeeName(`${res.ticket.firstName} ${res.ticket.lastName}`);
          }
          
          if (res.status === "valid") {
            setScanResult("valid");
            setResultMessage(res.message);
          } else if (res.status === "already_used") {
            setScanResult("already_checked_in");
            setResultMessage(res.message);
          } else {
            setScanResult("invalid");
            setResultMessage(res.message);
          }
        },
        onError: (err) => {
          setScanResult("invalid");
          setResultMessage(err.error || "Invalid ticket or not found.");
          setTicketNumber(ticketNum);
        }
      }
    );
  };

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTicket.trim()) return;
    handleCheckIn(manualTicket.trim());
  };

  const resetScanner = () => {
    setScanResult("idle");
    setResultMessage("");
    setAttendeeName("");
    setTicketNumber("");
    setManualTicket("");
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="p-4 border-b border-primary/20 bg-card flex justify-between items-center z-10">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" /> Admin
          </Button>
        </Link>
        <div className="flex items-center text-primary font-cinzel font-bold">
          <Crown className="w-5 h-5 mr-2" /> Staff Check-in
        </div>
        <div className="w-[88px]" /> {/* Spacer for balance */}
      </header>

      <main className="flex-1 relative flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {scanResult === "idle" && (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md w-full flex flex-col gap-6"
            >
              <div className="bg-card border border-primary/20 p-4 rounded-xl shadow-xl overflow-hidden">
                <div id="reader" className="w-full rounded-lg overflow-hidden border-2 border-dashed border-primary/50" />
                <p className="text-center text-muted-foreground text-sm mt-4 font-medium flex items-center justify-center">
                  <ScanLine className="w-4 h-4 mr-2" /> Point camera at QR Code
                </p>
              </div>

              <div className="bg-card border border-primary/20 p-6 rounded-xl shadow-xl">
                <h3 className="font-cinzel text-primary mb-4 text-center">Manual Entry</h3>
                <form onSubmit={handleManualCheckIn} className="flex gap-2">
                  <Input 
                    placeholder="Enter Ticket # (e.g. CG2026-001)" 
                    value={manualTicket}
                    onChange={(e) => setManualTicket(e.target.value)}
                    className="bg-black border-primary/30 font-mono uppercase"
                  />
                  <Button type="submit" disabled={!manualTicket.trim() || checkInMutation.isPending} className="bg-primary hover:bg-secondary text-black">
                    Check
                  </Button>
                </form>
              </div>
            </motion.div>
          )}

          {scanResult !== "idle" && (
            <motion.div
              key="result"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center
                ${scanResult === "valid" ? "bg-green-950/90 text-green-50" : 
                  scanResult === "already_checked_in" ? "bg-orange-950/90 text-orange-50" : 
                  "bg-red-950/90 text-red-50"}
                backdrop-blur-md`}
            >
              {scanResult === "valid" && <CheckCircle2 className="w-32 h-32 text-green-500 mb-6 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />}
              {scanResult === "already_checked_in" && <AlertCircle className="w-32 h-32 text-orange-500 mb-6 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />}
              {scanResult === "invalid" && <XCircle className="w-32 h-32 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />}

              <h1 className="text-4xl md:text-5xl font-cinzel font-bold mb-4 uppercase">
                {scanResult === "valid" ? "Valid Ticket" : 
                 scanResult === "already_checked_in" ? "Already Checked In" : 
                 "Invalid Ticket"}
              </h1>

              {attendeeName && (
                <p className="text-2xl md:text-3xl font-bold mb-2">{attendeeName}</p>
              )}
              
              <p className="text-lg opacity-80 font-mono mb-8">{ticketNumber}</p>
              
              <p className="text-xl mb-12 max-w-md bg-black/20 p-4 rounded-lg">
                {resultMessage}
              </p>

              <Button 
                onClick={resetScanner} 
                size="lg"
                className={`w-full max-w-sm h-16 text-xl font-bold rounded-full border-2 
                  ${scanResult === "valid" ? "bg-green-500 hover:bg-green-600 text-black border-green-400" : 
                    scanResult === "already_checked_in" ? "bg-orange-500 hover:bg-orange-600 text-black border-orange-400" : 
                    "bg-red-500 hover:bg-red-600 text-white border-red-400"}`}
              >
                Scan Next Ticket
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
