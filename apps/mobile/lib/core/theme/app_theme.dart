import 'package:flutter/material.dart';

// Matches the web app's dark theme accent (apps/web/src/app/globals.css)
// so the two feel like the same product.
const kAccentColor = Color(0xFFD4A94F);
const kBackgroundColor = Color(0xFF0A0A0A);
const kSurfaceColor = Color(0xFF171717);

ThemeData buildAppTheme() {
  final base = ThemeData(brightness: Brightness.dark, useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: kBackgroundColor,
    colorScheme: base.colorScheme.copyWith(
      brightness: Brightness.dark,
      primary: kAccentColor,
      surface: kSurfaceColor,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: kBackgroundColor,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: kSurfaceColor,
      modalBackgroundColor: kSurfaceColor,
    ),
    chipTheme: base.chipTheme.copyWith(
      selectedColor: kAccentColor,
      backgroundColor: kSurfaceColor,
      labelStyle: const TextStyle(color: Colors.white),
    ),
  );
}
