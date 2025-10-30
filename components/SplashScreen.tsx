import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Vari, Logo } from "./Common";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../hooks/useTheme";

interface SplashScreenProps {
  progress: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ progress }) => {
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity
  const scaleAnim = useRef(new Animated.Value(0.9)).current; // Initial scale

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500, // 1.5s
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1500, // 1.5s
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View
      style={[
        styles.container,
        isDarkMode ? styles.darkBackground : styles.lightBackground,
      ]}
    >
      <Animated.View
        style={[
          styles.animatedContent,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Vari style={styles.variLogo} />
        <View style={styles.appTitleContainer}>
          <Logo style={styles.logo} />
          <View style={styles.appTitleTextContainer}>
            <Text style={[styles.appTitle, isDarkMode ? styles.textBlue400 : styles.textBlue700]}>
              {t('app-name')}
            </Text>
            <Text style={[styles.appTagline, isDarkMode ? styles.textSlate400 : styles.textSlate600]}>
              {t('app-tagline')}
            </Text>
          </View>
        </View>

        <View style={[styles.progressBarBackground, isDarkMode ? styles.bgSlate700 : styles.bgSlate200]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progress}%` },
            ]}
          ></View>
        </View>
        <Text style={[styles.loadingText, isDarkMode ? styles.textSlate600 : styles.textSlate400]}>
          Loading application... {Math.round(progress)}%
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightBackground: {
    backgroundColor: '#ffffff', // bg-white
  },
  darkBackground: {
    backgroundColor: '#0f172a', // bg-slate-900
  },
  animatedContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variLogo: {
    width: 256, // w-64
    marginBottom: 16, // mb-4
    height: 40, // Approximate height for text
    alignSelf: 'center',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
  },
  appTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // gap-4
    marginVertical: 16, // my-4
  },
  logo: {
    width: 96, // w-24
    height: 96, // h-24
  },
  appTitleTextContainer: {
    flexDirection: 'column',
  },
  appTitle: {
    fontSize: 40, // text-5xl
    fontWeight: '800', // font-extrabold
  },
  appTagline: {
    fontSize: 20, // text-xl
    textAlign: 'right',
  },
  textBlue700: { color: '#1d4ed8' },
  textBlue400: { color: '#60a5fa' }, // dark:text-blue-400
  textSlate600: { color: '#475569' }, // text-slate-600
  textSlate400: { color: '#94a3b8' }, // dark:text-slate-400

  progressBarBackground: {
    width: 256, // w-64
    height: 8, // h-2
    borderRadius: 9999, // rounded-full
    overflow: 'hidden',
    marginTop: 32, // mt-8
  },
  bgSlate200: { backgroundColor: '#e2e8f0' },
  bgSlate700: { backgroundColor: '#334155' },

  progressBarFill: {
    backgroundColor: '#2563eb', // bg-blue-600
    height: '100%',
    borderRadius: 9999,
  },
  loadingText: {
    position: 'absolute',
    top: '100%',
    marginTop: 48, // mt-12
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
  },
});