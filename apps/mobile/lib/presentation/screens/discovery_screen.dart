import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/domain/entities/venue_summary.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';
import 'package:mobile/presentation/providers/venues_providers.dart';
import 'package:mobile/presentation/widgets/category_filter_bar.dart';
import 'package:mobile/presentation/widgets/profile_avatar_button.dart';
import 'package:mobile/presentation/widgets/venue_card.dart';
import 'package:mobile/presentation/widgets/venue_map_view.dart';

const _musicGenres = ['House', 'Hip-Hop', 'R&B', 'EDM', 'Live', 'Jazz', 'Pop'];
const _crowdTypes = ['Local', 'Expat', 'Mixed', 'Tourist', '21+', '25+', 'VIP'];

class DiscoveryScreen extends ConsumerStatefulWidget {
  const DiscoveryScreen({super.key});

  @override
  ConsumerState<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends ConsumerState<DiscoveryScreen> {
  final _mapController = MapController();
  bool _locating = false;
  bool _didAutoFly = false;

  void _showCreatorActions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: kSurfaceColor,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 20),
            _CreatorAction(
              icon: Icons.add_location_alt_outlined,
              label: 'Add Venue',
              onTap: () => context.push('/venues/add'),
            ),
            _CreatorAction(
              icon: Icons.rate_review_outlined,
              label: 'Write Review',
              onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Find a venue on the map or list, then tap Write a Review.')),
              ),
            ),
            _CreatorAction(
              icon: Icons.add_photo_alternate_outlined,
              label: 'Upload Photos',
              onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Photo uploads coming soon.')),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _useMyLocation() async {
    setState(() => _locating = true);
    final position = await ref.read(locationServiceProvider).getCurrentPosition();
    if (!mounted) return;
    setState(() => _locating = false);

    if (position == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Couldn't get your location — check location permissions.")),
      );
      return;
    }

    ref.read(userPositionProvider.notifier).state = position;
    _mapController.move(LatLng(position.latitude, position.longitude), 14);
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(authProvider).asData?.value;
    final isLoggedIn = session != null;

    // Auto-fly to user position only for logged-in users
    if (isLoggedIn) {
      ref.listen(autoLocationProvider, (_, next) {
        final pos = next.asData?.value;
        if (pos != null && !_didAutoFly) {
          _didAutoFly = true;
          _mapController.move(LatLng(pos.latitude, pos.longitude), 14);
        }
      });
    }

    final autoPos = isLoggedIn ? ref.watch(autoLocationProvider).asData?.value : null;
    final manualPos = isLoggedIn ? ref.watch(userPositionProvider) : null;
    final activePos = manualPos ?? autoPos;
    final userLatLng = activePos != null ? LatLng(activePos.latitude, activePos.longitude) : null;
    final hasLocation = activePos != null;

    final venuesAsync = ref.watch(venuesSearchProvider);

    return Scaffold(
      backgroundColor: kBackgroundColor,
      body: Stack(
        children: [
          // Map layer
          venuesAsync.when(
            data: (venues) {
              final display = isLoggedIn ? venues : venues.where((v) => v.reviewCount > 0).toList();
              return VenueMapView(
                venues: display,
                controller: _mapController,
                userPosition: userLatLng,
                onMarkerTap: (venue) => context.push('/venues/${venue.id}'),
              );
            },
            loading: () => VenueMapView(venues: const [], controller: _mapController, userPosition: userLatLng),
            error: (_, _) => VenueMapView(venues: const [], controller: _mapController, userPosition: userLatLng),
          ),

          // Top controls: search + filter button + avatar, then category chips
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Stack(
                    alignment: Alignment.centerRight,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 96),
                        child: _SearchField(),
                      ),
                      const Positioned(right: 48, child: _FilterButton()),
                      const Positioned(right: 0, child: ProfileAvatarButton()),
                    ],
                  ),
                ),
                const CategoryFilterBar(),
                const _ActiveFilterBar(),
              ],
            ),
          ),

          // FABs
          Positioned(
            right: 16,
            bottom: MediaQuery.of(context).size.height * 0.32 + 16,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (session != null && session.canCreate)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: FloatingActionButton(
                      heroTag: 'creator-add',
                      backgroundColor: kAccentColor,
                      foregroundColor: Colors.black,
                      onPressed: () => _showCreatorActions(context),
                      child: const Icon(Icons.add),
                    ),
                  ),
                // Zoom in
                FloatingActionButton.small(
                  heroTag: 'zoom-in',
                  backgroundColor: kSurfaceColor,
                  foregroundColor: Colors.white70,
                  elevation: 2,
                  onPressed: () => _mapController.move(
                    _mapController.camera.center,
                    (_mapController.camera.zoom + 1).clamp(3.0, 17.0),
                  ),
                  child: const Icon(Icons.add, size: 20),
                ),
                const SizedBox(height: 4),
                // Zoom out
                FloatingActionButton.small(
                  heroTag: 'zoom-out',
                  backgroundColor: kSurfaceColor,
                  foregroundColor: Colors.white70,
                  elevation: 2,
                  onPressed: () => _mapController.move(
                    _mapController.camera.center,
                    (_mapController.camera.zoom - 1).clamp(3.0, 17.0),
                  ),
                  child: const Icon(Icons.remove, size: 20),
                ),
                if (isLoggedIn) ...[
                  const SizedBox(height: 12),
                  FloatingActionButton(
                    heroTag: 'near-me',
                    backgroundColor: kSurfaceColor,
                    foregroundColor: kAccentColor,
                    onPressed: _locating ? null : _useMyLocation,
                    child: _locating
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(color: kAccentColor, strokeWidth: 2),
                          )
                        : const Icon(Icons.my_location),
                  ),
                ],
              ],
            ),
          ),

          // Venue list panel
          DraggableScrollableSheet(
            initialChildSize: 0.32,
            minChildSize: 0.14,
            maxChildSize: 0.85,
            builder: (context, scrollController) => Container(
              decoration: const BoxDecoration(
                color: kSurfaceColor,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: venuesAsync.when(
                data: (venues) {
                  final display = isLoggedIn ? venues : venues.where((v) => v.reviewCount > 0).toList();
                  return _VenueList(
                    venues: display,
                    scrollController: scrollController,
                    hasLocation: hasLocation,
                    isLoggedIn: isLoggedIn,
                    onRequestLocation: _useMyLocation,
                  );
                },
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
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Venue list panel
// ---------------------------------------------------------------------------

class _VenueList extends ConsumerWidget {
  final List<VenueSummary> venues;
  final ScrollController scrollController;
  final bool hasLocation;
  final bool isLoggedIn;
  final VoidCallback onRequestLocation;

  const _VenueList({
    required this.venues,
    required this.scrollController,
    required this.hasLocation,
    required this.isLoggedIn,
    required this.onRequestLocation,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final music = ref.watch(selectedMusicGenreProvider);
    final crowd = ref.watch(selectedCrowdTypeProvider);
    final hasFilters = music != null || crowd != null;

    return Column(
      children: [
        // Drag handle
        Container(
          margin: const EdgeInsets.symmetric(vertical: 10),
          width: 40,
          height: 4,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(2),
          ),
        ),

        // Location status header
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
          child: Row(
            children: [
              if (hasLocation) ...[
                const Icon(Icons.location_on, color: kAccentColor, size: 14),
                const SizedBox(width: 4),
                Text(
                  '${venues.length} venue${venues.length == 1 ? '' : 's'} nearby',
                  style: const TextStyle(
                    color: kAccentColor,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ] else ...[
                Icon(Icons.location_off_outlined, color: Colors.white.withValues(alpha: 0.35), size: 14),
                const SizedBox(width: 4),
                Text(
                  '${venues.length} venue${venues.length == 1 ? '' : 's'} found',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.45), fontSize: 13),
                ),
                if (isLoggedIn) ...[
                  const Spacer(),
                  GestureDetector(
                    onTap: onRequestLocation,
                    child: const Text(
                      'Use my location',
                      style: TextStyle(
                        color: kAccentColor,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ],
            ],
          ),
        ),

        // Venue list
        Expanded(
          child: venues.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.search_off_rounded, size: 40, color: Colors.white.withValues(alpha: 0.2)),
                        const SizedBox(height: 12),
                        Text(
                          hasFilters
                              ? 'No venues match your filters.'
                              : hasLocation
                                  ? 'No venues within 3 km.'
                                  : 'No venues found.',
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.5)),
                          textAlign: TextAlign.center,
                        ),
                        if (hasFilters) ...[
                          const SizedBox(height: 12),
                          TextButton(
                            onPressed: () {
                              ref.read(selectedMusicGenreProvider.notifier).state = null;
                              ref.read(selectedCrowdTypeProvider.notifier).state = null;
                            },
                            style: TextButton.styleFrom(foregroundColor: kAccentColor),
                            child: const Text('Clear filters'),
                          ),
                        ],
                      ],
                    ),
                  ),
                )
              : ListView.builder(
                  controller: scrollController,
                  itemCount: venues.length,
                  itemBuilder: (_, i) => VenueCard(
                    venue: venues[i],
                    onTap: () => context.push('/venues/${venues[i].id}'),
                  ),
                ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Filter button + sheet
// ---------------------------------------------------------------------------

class _FilterButton extends ConsumerWidget {
  const _FilterButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasMusic = ref.watch(selectedMusicGenreProvider) != null;
    final hasCrowd = ref.watch(selectedCrowdTypeProvider) != null;
    final active = hasMusic || hasCrowd;

    return GestureDetector(
      onTap: () => showModalBottomSheet(
        context: context,
        backgroundColor: kSurfaceColor,
        isScrollControlled: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (_) => const _FilterSheet(),
      ),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: active ? kAccentColor.withValues(alpha: 0.18) : kSurfaceColor.withValues(alpha: 0.95),
          shape: BoxShape.circle,
          border: Border.all(color: active ? kAccentColor : Colors.white12),
        ),
        child: Icon(
          Icons.tune_rounded,
          size: 20,
          color: active ? kAccentColor : Colors.white70,
        ),
      ),
    );
  }
}

class _FilterSheet extends ConsumerWidget {
  const _FilterSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedMusic = ref.watch(selectedMusicGenreProvider);
    final selectedCrowd = ref.watch(selectedCrowdTypeProvider);
    final hasAny = selectedMusic != null || selectedCrowd != null;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Title row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Filters',
                style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w600),
              ),
              if (hasAny)
                TextButton(
                  onPressed: () {
                    ref.read(selectedMusicGenreProvider.notifier).state = null;
                    ref.read(selectedCrowdTypeProvider.notifier).state = null;
                  },
                  style: TextButton.styleFrom(
                    foregroundColor: kAccentColor,
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('Clear all'),
                ),
            ],
          ),
          const SizedBox(height: 20),

          // Music section
          Text(
            'MUSIC',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.4),
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _musicGenres.map((g) {
              final sel = selectedMusic == g;
              return _Chip(
                label: g,
                selected: sel,
                onTap: () => ref.read(selectedMusicGenreProvider.notifier).state = sel ? null : g,
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          // Crowd section
          Text(
            'CROWD',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.4),
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _crowdTypes.map((c) {
              final sel = selectedCrowd == c;
              return _Chip(
                label: c,
                selected: sel,
                onTap: () => ref.read(selectedCrowdTypeProvider.notifier).state = sel ? null : c,
              );
            }).toList(),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _Chip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? kAccentColor.withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? kAccentColor : Colors.white12),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? kAccentColor : Colors.white70,
            fontSize: 13,
            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

class _CreatorAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _CreatorAction({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: kAccentColor, size: 22),
      title: Text(label, style: const TextStyle(color: Colors.white, fontSize: 15)),
      onTap: () {
        Navigator.pop(context);
        onTap();
      },
    );
  }
}

class _ActiveFilterBar extends ConsumerWidget {
  const _ActiveFilterBar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final music = ref.watch(selectedMusicGenreProvider);
    final crowd = ref.watch(selectedCrowdTypeProvider);
    if (music == null && crowd == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 6),
      child: Row(
        children: [
          if (music != null)
            _FilterChip(
              label: music,
              icon: Icons.music_note_rounded,
              onRemove: () => ref.read(selectedMusicGenreProvider.notifier).state = null,
            ),
          if (music != null && crowd != null) const SizedBox(width: 6),
          if (crowd != null)
            _FilterChip(
              label: crowd,
              icon: Icons.people_rounded,
              onRemove: () => ref.read(selectedCrowdTypeProvider.notifier).state = null,
            ),
          if (music != null || crowd != null) ...[
            const Spacer(),
            GestureDetector(
              onTap: () {
                ref.read(selectedMusicGenreProvider.notifier).state = null;
                ref.read(selectedCrowdTypeProvider.notifier).state = null;
              },
              child: Text(
                'Clear',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.45), fontSize: 12),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onRemove;

  const _FilterChip({required this.label, required this.icon, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(left: 8, right: 4, top: 4, bottom: 4),
      decoration: BoxDecoration(
        color: kAccentColor.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: kAccentColor.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: kAccentColor),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(color: kAccentColor, fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onRemove,
            child: Icon(Icons.close_rounded, size: 14, color: kAccentColor.withValues(alpha: 0.7)),
          ),
        ],
      ),
    );
  }
}

class _SearchField extends ConsumerStatefulWidget {
  @override
  ConsumerState<_SearchField> createState() => _SearchFieldState();
}

class _SearchFieldState extends ConsumerState<_SearchField> {
  late final TextEditingController _controller;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: ref.read(searchQueryProvider));
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      ref.read(searchQueryProvider.notifier).state = value;
    });
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
        suffixIcon: ref.watch(searchQueryProvider).isNotEmpty
            ? GestureDetector(
                onTap: () {
                  _controller.clear();
                  ref.read(searchQueryProvider.notifier).state = '';
                },
                child: Icon(Icons.close_rounded, color: Colors.white.withValues(alpha: 0.4), size: 18),
              )
            : null,
        filled: true,
        fillColor: kSurfaceColor.withValues(alpha: 0.95),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.symmetric(vertical: 0),
      ),
      onChanged: _onChanged,
      onSubmitted: (value) {
        _debounce?.cancel();
        ref.read(searchQueryProvider.notifier).state = value;
      },
    );
  }
}
