import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useCheckInTicket } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

type ResultState =
  | null
  | { status: "success"; message: string; name: string; ticketNumber: string; seat: string }
  | { status: "duplicate"; message: string; name: string; ticketNumber: string }
  | { status: "error"; message: string };

export default function ScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [isActive, setIsActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ResultState>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualTicket, setManualTicket] = useState("");

  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      setResult(null);
      setProcessing(false);
      return () => setIsActive(false);
    }, [])
  );

  const checkInMutation = useCheckInTicket({
    mutation: {
      onSuccess: (data) => {
        setProcessing(false);
        const name = data.ticket
          ? `${data.ticket.firstName} ${data.ticket.lastName}`
          : "";

        if (data.status === "valid") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setResult({
            status: "success",
            message: data.message,
            name,
            ticketNumber: data.ticket?.ticketNumber ?? "",
            seat: data.ticket?.seatNumber ?? "",
          });
        } else if (data.status === "already_used") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setResult({
            status: "duplicate",
            message: data.message,
            name,
            ticketNumber: data.ticket?.ticketNumber ?? "",
          });
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setResult({ status: "error", message: data.message });
        }
        qc.invalidateQueries();
      },
      onError: (err: unknown) => {
        setProcessing(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const msg =
          (err as { data?: { error?: string } })?.data?.error ?? "Ticket not found";
        setResult({ status: "error", message: msg });
      },
    },
  });

  const handleCheckIn = (ticketNumber: string) => {
    if (processing) return;
    setProcessing(true);
    setResult(null);
    checkInMutation.mutate({ data: { ticketNumber } });
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (processing || result) return;
    try {
      const parsed = JSON.parse(data) as { ticketNumber?: string };
      const ticketNumber = parsed.ticketNumber;
      if (!ticketNumber) throw new Error("No ticket number");
      handleCheckIn(ticketNumber);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResult({ status: "error", message: "Invalid QR code" });
    }
  };

  const handleManualSubmit = () => {
    const t = manualTicket.trim().toUpperCase();
    if (!t) return;
    Keyboard.dismiss();
    setShowManual(false);
    setManualTicket("");
    handleCheckIn(t);
  };

  const reset = () => {
    setResult(null);
    setProcessing(false);
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permScreen, { backgroundColor: colors.background, paddingTop: topInset + 40 }]}>
        <MaterialCommunityIcons name="camera-off" size={56} color={colors.mutedForeground} />
        <Text style={[styles.permTitle, { color: colors.foreground }]}>Camera Required</Text>
        <Text style={[styles.permSub, { color: colors.mutedForeground }]}>
          Camera access is needed to scan attendee QR codes.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={[styles.permBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.permBtnText, { color: colors.primaryForeground }]}>
            Grant Access
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const resultBg =
    result?.status === "success"
      ? colors.success
      : result?.status === "duplicate"
      ? colors.warning
      : result?.status === "error"
      ? colors.destructive
      : "transparent";

  return (
    <View style={[styles.root, { backgroundColor: "#000" }]}>
      {isActive && !result && !showManual && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
      )}

      {!result && !showManual && (
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          <View style={[styles.overlayTop, { paddingTop: topInset + 16 }]}>
            <MaterialCommunityIcons name="crown" size={22} color={colors.primary} />
            <Text style={[styles.overlayTitle, { color: "#fff" }]}>Check-In Scanner</Text>
          </View>

          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
            {processing && (
              <View style={styles.scanProcessing}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            )}
          </View>

          <View style={[styles.overlayBottom, { paddingBottom: bottomInset + 24 }]}>
            <Text style={styles.scanHint}>
              {processing ? "Processing..." : "Point camera at attendee QR code"}
            </Text>
            <TouchableOpacity
              onPress={() => setShowManual(true)}
              style={[styles.manualBtn, { borderColor: "rgba(255,255,255,0.3)" }]}
            >
              <Feather name="edit-3" size={16} color="#fff" />
              <Text style={styles.manualBtnText}>Enter Ticket Number</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showManual && (
        <View
          style={[
            styles.manualModal,
            { backgroundColor: colors.background, paddingTop: topInset + 24, paddingBottom: bottomInset + 24 },
          ]}
        >
          <TouchableOpacity onPress={() => { setShowManual(false); setManualTicket(""); }} style={[styles.closeBtn]}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <MaterialCommunityIcons name="ticket-outline" size={48} color={colors.primary} style={{ marginBottom: 16 }} />
          <Text style={[styles.manualTitle, { color: colors.foreground }]}>Manual Check-In</Text>
          <Text style={[styles.manualSub, { color: colors.mutedForeground }]}>
            Enter the ticket number (e.g. CG2026-000001)
          </Text>
          <TextInput
            style={[styles.manualInput, { color: colors.foreground, borderColor: colors.primary, backgroundColor: colors.input }]}
            placeholder="CG2026-000001"
            placeholderTextColor={colors.mutedForeground}
            value={manualTicket}
            onChangeText={setManualTicket}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleManualSubmit}
          />
          <TouchableOpacity
            onPress={handleManualSubmit}
            style={[styles.manualSubmit, { backgroundColor: colors.primary, opacity: !manualTicket.trim() ? 0.5 : 1 }]}
            disabled={!manualTicket.trim()}
          >
            <Text style={[styles.manualSubmitText, { color: colors.primaryForeground }]}>CHECK IN</Text>
          </TouchableOpacity>
        </View>
      )}

      {result && (
        <View style={[styles.resultScreen, { backgroundColor: resultBg + "EE", paddingTop: topInset }]}>
          <View style={styles.resultContent}>
            {result.status === "success" ? (
              <Ionicons name="checkmark-circle" size={80} color="#fff" />
            ) : result.status === "duplicate" ? (
              <Ionicons name="warning" size={80} color="#fff" />
            ) : (
              <Ionicons name="close-circle" size={80} color="#fff" />
            )}

            <Text style={styles.resultStatus}>
              {result.status === "success"
                ? "CHECKED IN!"
                : result.status === "duplicate"
                ? "ALREADY CHECKED IN"
                : "CHECK-IN FAILED"}
            </Text>

            {(result.status === "success" || result.status === "duplicate") && (
              <>
                <Text style={styles.resultName}>
                  {"name" in result ? result.name : ""}
                </Text>
                <Text style={styles.resultTicket}>
                  {"ticketNumber" in result ? result.ticketNumber : ""}
                </Text>
                {result.status === "success" && "seat" in result && (
                  <Text style={styles.resultSeat}>Seat {result.seat}</Text>
                )}
              </>
            )}

            {result.status === "error" && (
              <Text style={styles.resultError}>{result.message}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={reset}
            style={[styles.resultNextBtn, { borderColor: "rgba(255,255,255,0.5)" }]}
          >
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.resultNextText}>Scan Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const CORNER_SIZE = 24;

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay: { justifyContent: "space-between" },
  overlayTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  overlayTitle: { fontSize: 18, fontWeight: "700" as const },
  scanFrame: {
    width: 260,
    height: 260,
    alignSelf: "center",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanProcessing: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  overlayBottom: { alignItems: "center", paddingHorizontal: 24, gap: 16 },
  scanHint: { color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center" },
  manualBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 24,
  },
  manualBtnText: { color: "#fff", fontSize: 14 },
  manualModal: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  closeBtn: { alignSelf: "flex-end", marginBottom: 32, padding: 4 },
  manualTitle: { fontSize: 22, fontWeight: "700" as const, marginBottom: 8 },
  manualSub: { fontSize: 14, textAlign: "center", marginBottom: 32 },
  manualInput: {
    width: "100%",
    height: 52,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 20,
  },
  manualSubmit: {
    width: "100%",
    height: 52,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  manualSubmitText: { fontSize: 15, fontWeight: "700" as const, letterSpacing: 2 },
  permScreen: { flex: 1, alignItems: "center", paddingHorizontal: 40, gap: 16 },
  permTitle: { fontSize: 22, fontWeight: "700" as const },
  permSub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  permBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  permBtnText: { fontSize: 15, fontWeight: "700" as const },
  resultScreen: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 60,
    paddingHorizontal: 32,
  },
  resultContent: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  resultStatus: { color: "#fff", fontSize: 28, fontWeight: "700" as const, textAlign: "center" },
  resultName: { color: "#fff", fontSize: 22, fontWeight: "600" as const, textAlign: "center" },
  resultTicket: { color: "rgba(255,255,255,0.8)", fontSize: 16 },
  resultSeat: { color: "rgba(255,255,255,0.8)", fontSize: 16 },
  resultError: { color: "#fff", fontSize: 16, textAlign: "center", opacity: 0.9 },
  resultNextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderRadius: 28,
  },
  resultNextText: { color: "#fff", fontSize: 16, fontWeight: "600" as const },
});
