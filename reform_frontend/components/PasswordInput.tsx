import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Props = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
};

export default function PasswordInput({
  label,
  value,
  onChangeText,
  placeholder,
}: Props) {
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={hidden}
          autoCapitalize="none"
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.eyeBtn}
          onPress={() => setHidden((p) => !p)}
        >
          <Ionicons
            name={hidden ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#E5E7EB"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { color: "#E5E7EB", marginBottom: 6, fontWeight: "600" },
  row: { position: "relative" },
  input: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.25)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingRight: 44,
    color: "#E5E7EB",
  },
  eyeBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    padding: 6,
  },
});
