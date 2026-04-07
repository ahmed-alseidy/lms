import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";

const BG = "#050508";
const LIME = "#BEF264";
const MUTED = "#8C8C96";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <SafeAreaView className="flex-1 px-6 pt-4">
        <Text className="text-2xl font-bold text-white mb-1">Profile</Text>
        <Text className="text-base mb-8" style={{ color: MUTED }}>
          {user?.email ?? "Signed in"}
        </Text>
        <TouchableOpacity
          className="rounded-2xl py-4 items-center"
          onPress={() => signOut()}
          style={{
            backgroundColor: "#141416",
            borderWidth: 1,
            borderColor: "#26262C",
          }}
        >
          <Text className="font-semibold" style={{ color: LIME }}>
            Sign out
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}
