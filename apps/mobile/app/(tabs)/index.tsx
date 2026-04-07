import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";

const LIME = "#BEF264";
const BG = "#050508";
const CARD = "#141416";
const CARD_BORDER = "#26262C";
const MUTED = "#8C8C96";
const WHITE = "#FAFAFA";
const ZINC_200 = "#E4E4E7";

const CONTINUE_COURSES = [
  {
    id: "1",
    module: "MODULE 04",
    title: "Advanced Design Systems & Logic",
    next: "Next: Semantic Shell Tokens",
    progress: 0.68,
    icon: "compass" as const,
  },
  {
    id: "2",
    module: "MODULE 02",
    title: "Visual Theory Foundations",
    next: "Next: Color & Contrast Systems",
    progress: 0.34,
    icon: "color-palette" as const,
  },
];

const ACTIVITIES = [
  {
    id: "1",
    icon: "help-circle" as const,
    iconColor: LIME,
    title: "Logic Quiz: Level 4",
    sub: "Successfully completed • 2h ago",
    right: "+200 XP",
    rightDot: false,
  },
  {
    id: "2",
    icon: "chatbubble-ellipses" as const,
    iconColor: LIME,
    title: "New Mentor Feedback",
    sub: "Visual Theory 101 • 5h ago",
    right: null,
    rightDot: true,
  },
  {
    id: "3",
    icon: "rocket" as const,
    iconColor: MUTED,
    title: "New Course Unlocked",
    sub: "Systemic Thinking • Yesterday",
    right: null,
    rightDot: false,
  },
];

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const firstName = user?.name?.split(/\s+/)[0] ?? "there";

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                {user?.name ? (
                  <Text style={styles.avatarText}>{initials(user.name)}</Text>
                ) : (
                  <Ionicons color={MUTED} name="person" size={20} />
                )}
              </View>
              <Text style={styles.brand}>LUMINARY</Text>
            </View>
            <Pressable
              accessibilityLabel="Notifications"
              hitSlop={12}
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Ionicons
                color={ZINC_200}
                name="notifications-outline"
                size={22}
              />
            </Pressable>
          </View>

          {/* Greeting */}
          <View style={styles.sectionGreeting}>
            <Text style={styles.greetingTitle}>Hi, {firstName}!</Text>
            <Text style={styles.greetingSub}>
              Ready to master UI Architecture today?
            </Text>
          </View>

          {/* Continue Learning */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRowPadded}>
              <Text style={styles.sectionTitle}>Continue Learning</Text>
              <Pressable hitSlop={8}>
                <Text style={styles.viewAll}>VIEW ALL</Text>
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.hScrollContent}
              decelerationRate="fast"
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={296}
            >
              {CONTINUE_COURSES.map((c) => (
                <View key={c.id} style={styles.courseCard}>
                  <View style={styles.courseCardTop}>
                    <View style={styles.iconTile}>
                      <Ionicons color={LIME} name={c.icon} size={22} />
                    </View>
                    <View style={styles.modulePill}>
                      <Text style={styles.modulePillText}>{c.module}</Text>
                    </View>
                  </View>
                  <Text style={styles.courseTitle}>{c.title}</Text>
                  <Text style={styles.courseNext}>{c.next}</Text>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>PROGRESS</Text>
                    <Text style={styles.progressPct}>
                      {Math.round(c.progress * 100)}%
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${c.progress * 100}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Performance */}
          <View style={styles.sectionPadded}>
            <Text style={[styles.sectionTitle, styles.mb16]}>Performance</Text>
            <View style={styles.perfRow}>
              <View style={styles.perfLeftCard}>
                <View style={styles.perfAccentBar} />
                <Text style={styles.perfLabelPadded}>COURSES DONE</Text>
                <View style={styles.perfBigRow}>
                  <Text style={styles.perfBigNumber}>12</Text>
                  <Ionicons color={LIME} name="checkmark-circle" size={22} />
                </View>
              </View>
              <View style={styles.perfRightCol}>
                <View style={styles.perfSmallCard}>
                  <Text style={styles.perfLabel}>HOURS</Text>
                  <Text style={styles.perfStatWhite}>142h</Text>
                </View>
                <View style={styles.perfSmallCard}>
                  <Text style={styles.perfLabel}>AVG QUIZ</Text>
                  <Text style={styles.perfStatLime}>94%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.sectionPadded}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Pressable
                hitSlop={8}
                style={({ pressed }) => pressed && styles.pressedOpacity}
              >
                <Ionicons color={MUTED} name="options-outline" size={22} />
              </Pressable>
            </View>
            <View style={styles.activityList}>
              {ACTIVITIES.map((a) => (
                <View key={a.id} style={styles.activityRow}>
                  <View style={styles.activityIcon}>
                    <Ionicons color={a.iconColor} name={a.icon} size={22} />
                  </View>
                  <View style={styles.activityBody}>
                    <Text style={styles.activityTitle}>{a.title}</Text>
                    <Text style={styles.activitySub}>{a.sub}</Text>
                  </View>
                  {a.right ? (
                    <Text style={styles.activityXp}>{a.right}</Text>
                  ) : a.rightDot ? (
                    <View style={styles.activityDot} />
                  ) : null}
                </View>
              ))}
            </View>
          </View>

          {/* CTA */}
          <View style={styles.ctaWrap}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push("/(tabs)/learning")}
              style={styles.ctaBtn}
            >
              <Ionicons color={BG} name="play" size={20} />
              <Text style={styles.ctaText}>RESUME STUDYING</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  pressedOpacity: {
    opacity: 0.7,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    height: 44,
    width: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: "hidden",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: LIME,
  },
  brand: {
    fontSize: 18,
    fontWeight: "700",
    color: LIME,
    letterSpacing: 3,
  },
  iconBtn: {
    height: 40,
    width: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CARD,
  },
  sectionGreeting: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  greetingTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: WHITE,
    marginBottom: 8,
  },
  greetingSub: {
    fontSize: 16,
    lineHeight: 24,
    color: MUTED,
  },
  sectionBlock: {
    marginBottom: 32,
  },
  sectionPadded: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionHeaderRowPadded: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: WHITE,
  },
  mb16: {
    marginBottom: 16,
  },
  viewAll: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: LIME,
  },
  hScrollContent: {
    paddingHorizontal: 20,
    gap: 14,
    flexDirection: "row",
  },
  courseCard: {
    width: 280,
    borderRadius: 24,
    padding: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  courseCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  iconTile: {
    height: 40,
    width: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0C0C0E",
  },
  modulePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#0C0C0E",
  },
  modulePillText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: LIME,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: WHITE,
    marginBottom: 4,
  },
  courseNext: {
    fontSize: 14,
    fontStyle: "italic",
    color: MUTED,
    marginBottom: 20,
  },
  progressLabels: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    color: MUTED,
  },
  progressPct: {
    fontSize: 14,
    fontWeight: "700",
    color: LIME,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#0C0C0E",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: LIME,
  },
  perfRow: {
    flexDirection: "row",
    gap: 12,
    minHeight: 168,
  },
  perfLeftCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    justifyContent: "space-between",
    overflow: "hidden",
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  perfAccentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 999,
    backgroundColor: LIME,
  },
  perfLabelPadded: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: MUTED,
    paddingLeft: 8,
  },
  perfBigRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 8,
  },
  perfBigNumber: {
    fontSize: 36,
    fontWeight: "700",
    color: WHITE,
  },
  perfRightCol: {
    flex: 1,
    gap: 12,
  },
  perfSmallCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    justifyContent: "center",
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  perfLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: MUTED,
    marginBottom: 4,
  },
  perfStatWhite: {
    fontSize: 24,
    fontWeight: "700",
    color: WHITE,
  },
  perfStatLime: {
    fontSize: 24,
    fontWeight: "700",
    color: LIME,
  },
  activityList: {
    gap: 12,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  activityIcon: {
    height: 44,
    width: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0C0C0E",
    marginRight: 12,
  },
  activityBody: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: WHITE,
    marginBottom: 2,
  },
  activitySub: {
    fontSize: 12,
    color: MUTED,
  },
  activityXp: {
    fontSize: 14,
    fontWeight: "700",
    color: LIME,
    marginLeft: 8,
    flexShrink: 0,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: LIME,
    marginLeft: 8,
    flexShrink: 0,
  },
  ctaWrap: {
    paddingHorizontal: 20,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
    backgroundColor: LIME,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: BG,
  },
});
