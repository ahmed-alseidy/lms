import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = "#050508";
const MUTED = "#8C8C96";

export default function LearningScreen() {
  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <SafeAreaView className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-white mb-2">Learning</Text>
        <Text className="text-center text-base" style={{ color: MUTED }}>
          Pick up where you left off.
        </Text>
      </SafeAreaView>
    </View>
  );
}
