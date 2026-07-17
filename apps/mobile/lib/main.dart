import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/router/app_router.dart';
import 'package:mobile/core/theme/app_theme.dart';

void main() {
  final container = ProviderContainer();
  final router = buildRouter(container);
  runApp(UncontrolledProviderScope(container: container, child: NightCheckApp(router: router)));
}

class NightCheckApp extends StatelessWidget {
  const NightCheckApp({super.key, required this.router});

  final GoRouter router;

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'NightCheck',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      routerConfig: router,
    );
  }
}
