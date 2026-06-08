import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  useListTickets,
  useCancelTicket,
  type Ticket,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

type Filter = "active" | "cancelled" | "";

function TicketItem({ ticket, onCancel }: { ticket: Ticket; onCancel: (id: number) => void }) {
  const colors = useColors();
  const isActive = ticket.status === "active";
  const isCancelled = ticket.status === "cancelled";

  return (
    <View style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.ticketTop}>
        <View style={styles.ticketLeft}>
          <Text style={[styles.ticketName, { color: colors.foreground }]}>
            {ticket.firstName} {ticket.lastName}
          </Text>
          <Text style={[styles.ticketNum, { color: colors.primary }]}>{ticket.ticketNumber}</Text>
        </View>
        <View style={styles.ticketRight}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: ticket.checkedIn
                  ? colors.success + "22"
                  : isActive
                  ? colors.primary + "22"
                  : colors.destructive + "22",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: ticket.checkedIn
                    ? colors.success
                    : isActive
                    ? colors.primary
                    : colors.destructive,
                },
              ]}
            >
              {ticket.checkedIn ? "Checked In" : isActive ? "Active" : "Cancelled"}
            </Text>
          </View>
        </View>
      </View>
      <View style={[styles.ticketDivider, { backgroundColor: colors.border }]} />
      <View style={styles.ticketBottom}>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="seat-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{ticket.seatNumber}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="church" size={14} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {ticket.churchAssembly ?? "No Assembly"}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons
            name={ticket.gender === "Male" ? "gender-male" : "gender-female"}
            size={14}
            color={colors.mutedForeground}
          />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{ticket.gender}</Text>
        </View>
        {isActive && !ticket.checkedIn && (
          <TouchableOpacity
            onPress={() => onCancel(ticket.id)}
            style={[styles.cancelBtn, { borderColor: colors.destructive }]}
            hitSlop={4}
          >
            <Feather name="x" size={14} color={colors.destructive} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function TicketsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("active");

  const { data, isLoading, refetch } = useListTickets({
    status: filter || undefined,
    search: search || undefined,
    page: 1,
    limit: 100,
  });

  const cancelMutation = useCancelTicket({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        qc.invalidateQueries();
      },
    },
  });

  const handleCancel = (id: number) => {
    Alert.alert("Cancel Ticket", "Are you sure you want to cancel this ticket?", [
      { text: "No", style: "cancel" },
      {
        text: "Cancel Ticket",
        style: "destructive",
        onPress: () => cancelMutation.mutate({ id }),
      },
    ]);
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const tickets = data?.tickets ?? [];

  const filters: { key: Filter; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "cancelled", label: "Cancelled" },
    { key: "", label: "All" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 12, borderBottomColor: colors.border },
        ]}
      >
        <MaterialCommunityIcons name="crown" size={22} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Tickets</Text>
        {data && (
          <Text style={[styles.count, { color: colors.mutedForeground }]}>
            {data.total}
          </Text>
        )}
      </View>

      <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search name or ticket #..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f.key ? colors.primary : colors.muted,
                  borderColor: filter === f.key ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f.key ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(t) => String(t.id)}
          renderItem={({ item }) => <TicketItem ticket={item} onCancel={handleCancel} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
          scrollEnabled={tickets.length > 0}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="inbox" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No tickets found
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" as const, flex: 1 },
  count: { fontSize: 14 },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: "500" as const },
  listContent: { paddingHorizontal: 16, paddingTop: 12 },
  ticketCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  ticketTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  ticketLeft: { flex: 1 },
  ticketName: { fontSize: 15, fontWeight: "600" as const },
  ticketNum: { fontSize: 12, marginTop: 2, fontWeight: "500" as const },
  ticketRight: {},
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "600" as const },
  ticketDivider: { height: 1, marginVertical: 10 },
  ticketBottom: { flexDirection: "row", alignItems: "center", gap: 14, flexWrap: "wrap" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12 },
  cancelBtn: {
    marginLeft: "auto",
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14 },
});
