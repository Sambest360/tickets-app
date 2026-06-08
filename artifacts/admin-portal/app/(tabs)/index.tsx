import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useGetEventStats, useGetRecentRegistrations } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderColor: accent ? colors.primary : colors.border,
          borderWidth: accent ? 1 : 1,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon as never}
        size={22}
        color={accent ? colors.primary : colors.mutedForeground}
      />
      <Text style={[styles.statValue, { color: accent ? colors.primary : colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {sub ? <Text style={[styles.statSub, { color: colors.mutedForeground }]}>{sub}</Text> : null}
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { username, logout } = useAuth();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetEventStats();
  const { data: recent, isLoading: recentLoading, refetch: refetchRecent } = useGetRecentRegistrations({ limit: 8 });

  const refreshing = statsLoading || recentLoading;

  const onRefresh = () => {
    refetchStats();
    refetchRecent();
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const capacityPct = stats ? Math.round((stats.totalTickets / 250) * 100) : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 12, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="crown" size={22} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Dashboard</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.adminLabel, { color: colors.mutedForeground }]}>{username}</Text>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn} hitSlop={8}>
            <Feather name="log-out" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={[styles.section, { color: colors.mutedForeground }]}>EVENT STATS</Text>

        <View style={styles.statsGrid}>
          <StatCard icon="ticket-outline" label="Total Tickets" value={stats?.totalTickets ?? "—"} accent />
          <StatCard icon="check-circle-outline" label="Checked In" value={stats?.checkedIn ?? "—"} />
          <StatCard icon="cash" label="Revenue" value={stats ? `R${stats.totalRevenue}` : "—"} />
          <StatCard icon="seat-outline" label="Remaining" value={stats?.remaining ?? "—"} />
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="gender-male" label="Male" value={stats?.maleCount ?? "—"} />
          <StatCard icon="gender-female" label="Female" value={stats?.femaleCount ?? "—"} />
          <StatCard
            icon="chart-arc"
            label="Capacity"
            value={`${capacityPct}%`}
            sub={`${stats?.totalTickets ?? 0} / 250`}
          />
          <StatCard icon="alert-circle-outline" label="Pending" value={stats?.pendingCount ?? "—"} />
        </View>

        {stats && (
          <View style={[styles.progressWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.foreground }]}>Venue Capacity</Text>
              <Text style={[styles.progressPct, { color: colors.primary }]}>{capacityPct}%</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: capacityPct >= 90 ? colors.destructive : colors.primary,
                    width: `${Math.min(capacityPct, 100)}%` as `${number}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        <Text style={[styles.section, { color: colors.mutedForeground }]}>RECENT REGISTRATIONS</Text>

        {recent && recent.length > 0 ? (
          recent.map((ticket) => (
            <View
              key={ticket.id}
              style={[styles.activityRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View
                style={[
                  styles.activityAvatar,
                  { backgroundColor: colors.muted },
                ]}
              >
                <Text style={[styles.activityInitial, { color: colors.primary }]}>
                  {ticket.firstName[0]?.toUpperCase()}
                </Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={[styles.activityName, { color: colors.foreground }]}>
                  {ticket.firstName} {ticket.lastName}
                </Text>
                <Text style={[styles.activityMeta, { color: colors.mutedForeground }]}>
                  {ticket.ticketNumber} · {ticket.churchAssembly ?? "No Assembly"}
                </Text>
              </View>
              <Text style={[styles.activitySeat, { color: colors.mutedForeground }]}>
                {ticket.seatNumber}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Feather name="users" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No registrations yet
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: "700" as const },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  adminLabel: { fontSize: 13 },
  logoutBtn: { padding: 4 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20 },
  section: { fontSize: 11, letterSpacing: 1.5, marginBottom: 12, marginTop: 4 },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  statValue: { fontSize: 22, fontWeight: "700" as const },
  statLabel: { fontSize: 11, textAlign: "center" },
  statSub: { fontSize: 10, textAlign: "center" },
  progressWrap: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  progressLabel: { fontSize: 14, fontWeight: "600" as const },
  progressPct: { fontSize: 14, fontWeight: "700" as const },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  activityAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  activityInitial: { fontSize: 16, fontWeight: "700" as const },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 14, fontWeight: "600" as const },
  activityMeta: { fontSize: 12, marginTop: 2 },
  activitySeat: { fontSize: 13, fontWeight: "600" as const },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14 },
});
