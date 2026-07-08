import 'package:go_router/go_router.dart';
import 'package:mobile/presentation/screens/discovery_screen.dart';
import 'package:mobile/presentation/screens/venue_detail_screen.dart';

final appRouter = GoRouter(
  routes: [
    GoRoute(path: '/', builder: (context, state) => const DiscoveryScreen()),
    GoRoute(
      path: '/venues/:slug',
      builder: (context, state) => VenueDetailScreen(slug: state.pathParameters['slug']!),
    ),
  ],
);
