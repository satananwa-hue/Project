import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/presentation/providers/venues_providers.dart';
import 'package:mobile/presentation/widgets/venue_map_view.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

class VenueDetailScreen extends ConsumerWidget {
  final String slug;

  const VenueDetailScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(venueDetailProvider(slug));

    return Scaffold(
      backgroundColor: kBackgroundColor,
      body: detailAsync.when(
        data: (venue) {
          final rating = venue.displayRating;
          return CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                backgroundColor: kBackgroundColor,
                expandedHeight: 220,
                flexibleSpace: FlexibleSpaceBar(
                  background: IgnorePointer(
                    child: VenueMapView(
                      venues: [venue],
                      center: LatLng(venue.lat, venue.lng),
                      zoom: 15,
                    ),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        venue.name,
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          if (venue.categoryName != null)
                            Text(
                              venue.categoryName!,
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
                            ),
                          if (venue.priceRange != null) ...[
                            const Text(' · ', style: TextStyle(color: Colors.white54)),
                            Text(
                              '\$' * venue.priceRange!,
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
                            ),
                          ],
                          if (rating != null) ...[
                            const SizedBox(width: 10),
                            const Icon(Icons.star, color: kAccentColor, size: 16),
                            const SizedBox(width: 2),
                            Text(rating.toStringAsFixed(1)),
                          ],
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.location_on_outlined, size: 18, color: Colors.white70),
                          const SizedBox(width: 6),
                          Expanded(child: Text(venue.address)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: () => _openDirections(venue.lat, venue.lng),
                          style: FilledButton.styleFrom(
                            backgroundColor: kAccentColor,
                            foregroundColor: Colors.black,
                          ),
                          icon: const Icon(Icons.directions),
                          label: const Text('Get directions'),
                        ),
                      ),
                      if (venue.description != null) ...[
                        const SizedBox(height: 20),
                        Text(venue.description!),
                      ],
                      if (venue.curatedReview != null) ...[
                        const SizedBox(height: 24),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: kSurfaceColor,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Editor\'s note',
                                style: TextStyle(
                                  color: kAccentColor,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(venue.curatedReview!),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: kAccentColor)),
        error: (error, _) => Center(
          child: Text(
            'Could not load this venue.\n$error',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
          ),
        ),
      ),
    );
  }
}

// Google Maps' universal directions link - opens the native Maps app on both
// iOS and Android if installed, otherwise falls back to the browser, so it
// doesn't need a platform check the way `geo:`/`maps:` URI schemes would.
Future<void> _openDirections(double lat, double lng) async {
  final uri = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng');
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}
