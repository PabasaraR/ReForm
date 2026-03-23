import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { getToken } from "../services/token.storage";

export default function LoadingScreen() {
  const fullText = "ReForm";
  const [shownCount, setShownCount] = useState(0);
  const [shimmerOn, setShimmerOn] = useState(false);

  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let navigateTimeout: any;

    const start = async () => {
  
      const token = await getToken();
      // decide next screen based on login status
      const nextRoute = token ? "/home" : "/signin";

      const bgOnlyDelay = setTimeout(() => {
        let i = 0;

        const letterTimer = setInterval(() => {
          i += 1;
          setShownCount(i);

          if (i >= fullText.length) {
            clearInterval(letterTimer);

            setTimeout(() => {
              setShimmerOn(true);
              shimmer.setValue(0);

              Animated.loop(
                Animated.timing(shimmer, {
                  toValue: 1,
                  duration: 1800,
                  easing: Easing.inOut(Easing.ease),
                  useNativeDriver: false,
                }),
              ).start();

              navigateTimeout = setTimeout(() => {
                router.replace(nextRoute);
              }, 2000);
            }, 200);
          }
        }, 140);
      }, 600);

      return () => {
        clearTimeout(bgOnlyDelay);
        if (navigateTimeout) clearTimeout(navigateTimeout);
      };
    };

    start();
  }, [fullText.length, shimmer]);

  const baseLetterColor = "#3B82F6";
  const dimColor = "#3B82F6";
  const brightColor = "#0096FF";

  const letters = fullText.split("");

  return (
    <View style={styles.container}>
      <View style={styles.wordRow}>
        {letters.map((ch, index) => {
          const isVisible = index < shownCount;
          const n = letters.length;
          const center = index / (n - 1);
          const width = 0.25;

          const color = shimmerOn
            ? shimmer.interpolate({
                inputRange: [
                  Math.max(0, center - width),
                  center,
                  Math.min(1, center + width),
                ],
                outputRange: [dimColor, brightColor, dimColor],
                extrapolate: "clamp",
              })
            : baseLetterColor;

          return (
            <Animated.Text
              key={`${ch}-${index}`}
              style={[
                styles.letter,
                {
                  opacity: isVisible ? 1 : 0,
                  color: shimmerOn ? (color as any) : baseLetterColor,
                },
              ]}
            >
              {ch}
            </Animated.Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  wordRow: {
    flexDirection: "row",
  },
  letter: {
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
});
