import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/router/app_router.dart';
import 'package:mobile/core/theme/app_theme.dart';

void main() {
  runApp(const ProviderScope(child: ChiWitRakMaoChaAoWelaRakKhraiApp()));
}

class ChiWitRakMaoChaAoWelaRakKhraiApp extends StatelessWidget {
  const ChiWitRakMaoChaAoWelaRakKhraiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'ChiWitRakMaoChaAoWelaRakKhrai',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      routerConfig: appRouter,
    );
  }
}
