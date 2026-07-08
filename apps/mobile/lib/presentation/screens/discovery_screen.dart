import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/domain/entities/venue_summary.dart';
import 'package:mobile/presentation/providers/venues_providers.dart';
import 'package:mobile/presentation/widgets/category_filter_bar.dart';
import 'package:mobile/presentation/widgets/venue_card.dart';
import 'package:mobile/presentation/widgets/venue_map_view.dart';

/// Map-first discovery: a full-screen map with a draggable sheet of venue
/// cards underneath, styled after the Apple-Maps-style browsing flow the
/// product brief referenced, adapted for nightlife instead of coffee shops.
class DiscoveryScreen extends ConsumerWidget {
  const DiscoveryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final venuesAsync = ref.watch(venuesSearchProvider);

    return Scaffold(
      backgroundColor: kBackgroundColor,
      body: Stack(
        children: [
          venuesAsync.when(
            data: (venues) => VenueMapView(
              venues: venues,
              onMarkerTap: (venue) => context.push('/venues/${venue.slug}'),
            ),
            loading: () => const VenueMapView(venues: []),
            error: (_, _) => const VenueMapView(venues: []),
          ),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: _SearchField(),
                ),
                const CategoryFilterBar(),
              ],
            ),
          ),
          DraggableScrollableSheet(
            initialChildSize: 0.32,
            minChildSize: 0.14,
            maxChildSize: 0.85,
            builder: (context, scrollController) {
              return Container(
                decoration: const BoxDecoration(
                  color: kSurfaceColor,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: venuesAsync.when(
                  data: (venues) => _VenueList(venues: venues, scrollController: scrollController),
                  loading: () => const Center(child: CircularProgressIndicator(color: kAccentColor)),
                  error: (error, _) => Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        'Could not load venues.\n$error',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _VenueList extends StatelessWidget {
  final List<VenueSummary> venues;
  final ScrollController scrollController;

  const _VenueList({required this.venues, required this.scrollController});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          margin: const EdgeInsets.symmetric(vertical: 10),
          width: 40,
          height: 4,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        Expanded(
          child: venues.isEmpty
              ? Center(
                  child: Text(
                    'No venues match yet.',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
                  ),
                )
              : ListView.builder(
                  controller: scrollController,
                  itemCount: venues.length,
                  itemBuilder: (context, index) {
                    final venue = venues[index];
                    return VenueCard(
                      venue: venue,
                      onTap: () => context.push('/venues/${venue.slug}'),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _SearchField extends ConsumerStatefulWidget {
  @override
  ConsumerState<_SearchField> createState() => _SearchFieldState();
}

class _SearchFieldState extends ConsumerState<_SearchField> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: ref.read(searchQueryProvider));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: 'Search Bangkok nightlife',
        hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.5)),
        prefixIcon: const Icon(Icons.search, color: Colors.white70),
        filled: true,
        fillColor: kSurfaceColor.withValues(alpha: 0.95),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.symmetric(vertical: 0),
      ),
      onSubmitted: (value) => ref.read(searchQueryProvider.notifier).state = value,
    );
  }
}
