import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';
import 'package:mobile/presentation/screens/add_venue_screen.dart';
import 'package:mobile/presentation/screens/admin_screen.dart';
import 'package:mobile/presentation/screens/admin_venues_screen.dart';
import 'package:mobile/presentation/screens/create_account_screen.dart';
import 'package:mobile/presentation/screens/creator_login_screen.dart';
import 'package:mobile/presentation/screens/signup_screen.dart';
import 'package:mobile/presentation/screens/discovery_screen.dart';
import 'package:mobile/presentation/screens/review_submitted_screen.dart';
import 'package:mobile/presentation/screens/venue_detail_screen.dart';
import 'package:mobile/presentation/screens/write_review_screen.dart';

GoRouter buildRouter(ProviderContainer container) {
  return GoRouter(
    redirect: (context, state) {
      final authState = container.read(authProvider);
      final session = authState.asData?.value;
      final isLoggedIn = session != null;
      final loc = state.matchedLocation;
      if (loc == '/venues/add' && !isLoggedIn) return '/creator-login';
      if (loc.startsWith('/admin') && !isLoggedIn) return '/creator-login';
      if (loc.startsWith('/admin') && isLoggedIn && !session.isAdmin) return '/';
      if ((loc == '/creator-login' || loc == '/signup') && isLoggedIn) return '/';
      return null;
    },
    refreshListenable: _AuthListenable(container),
    routes: [
      GoRoute(path: '/', builder: (context, state) => const DiscoveryScreen()),
      GoRoute(
        path: '/venues/add',
        builder: (context, state) => const AddVenueScreen(),
      ),
      GoRoute(
        path: '/venues/:id',
        builder: (context, state) =>
            VenueDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/venues/:id/review',
        builder: (context, state) {
          final extra = (state.extra as Map<String, dynamic>?) ?? {};
          return WriteReviewScreen(
            venueId: state.pathParameters['id']!,
            venueName: extra['venueName'] as String? ?? '',
            venueCategory: extra['venueCategory'] as String? ?? '',
          );
        },
      ),
      GoRoute(
        path: '/review-submitted',
        builder: (context, state) {
          final extra = (state.extra as Map<String, dynamic>?) ?? {};
          return ReviewSubmittedScreen(
            venueName: extra['venueName'] as String? ?? '',
            venueCategory: extra['venueCategory'] as String? ?? '',
            reviewId: extra['reviewId'] as String? ?? '',
            reviewText: extra['reviewText'] as String? ?? '',
            totalPoints: extra['totalPoints'] as int? ?? 0,
            ratingPoints: extra['ratingPoints'] as int? ?? 0,
            reviewPoints: extra['reviewPoints'] as int? ?? 0,
            bonusPoints: extra['bonusPoints'] as int? ?? 0,
            notesPoints: extra['notesPoints'] as int? ?? 0,
            overallRating: extra['overallRating'] as int? ?? 0,
            foodRating: extra['foodRating'] as int? ?? 0,
            serviceRating: extra['serviceRating'] as int? ?? 0,
            atmosphereRating: extra['atmosphereRating'] as int? ?? 0,
          );
        },
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminScreen(),
      ),
      GoRoute(
        path: '/admin/new-account',
        builder: (context, state) => const CreateAccountScreen(),
      ),
      GoRoute(
        path: '/admin/venues',
        builder: (context, state) => const AdminVenuesScreen(),
      ),
      GoRoute(
        path: '/creator-login',
        builder: (context, state) => const CreatorLoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) {
          final code = state.uri.queryParameters['code'];
          return SignUpScreen(prefillCode: code);
        },
      ),
    ],
  );
}

class _AuthListenable extends ChangeNotifier {
  _AuthListenable(this._container) {
    _container.listen(authProvider, (_, __) => notifyListeners());
  }
  final ProviderContainer _container;
}
