import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/data/datasources/reviews_remote_data_source.dart';
import 'package:mobile/domain/entities/venue_detail.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';
import 'package:mobile/presentation/providers/venues_providers.dart';
import 'package:mobile/presentation/widgets/venue_map_view.dart';

const _dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const _dayAbbr = {'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun'};

String _formatTag(String tag) {
  final parts = tag.split('-');
  if (parts.length == 2) {
    final category = parts[0][0].toUpperCase() + parts[0].substring(1);
    final rating = int.tryParse(parts[1]);
    if (rating != null) return '$category ${'★' * rating}${'☆' * (5 - rating)}';
  }
  return tag;
}

String _relativeDate(String iso) {
  try {
    final date = DateTime.parse(iso).toLocal();
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 365) return '${(diff.inDays / 365).floor()}y ago';
    if (diff.inDays > 30) return '${(diff.inDays / 30).floor()}mo ago';
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    return 'Just now';
  } catch (_) {
    return '';
  }
}

class VenueDetailScreen extends ConsumerWidget {
  final String id;

  const VenueDetailScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(venueDetailProvider(id));

    return Scaffold(
      backgroundColor: kBackgroundColor,
      body: detailAsync.when(
        data: (venue) => _VenueDetailBody(venue: venue),
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

class _VenueDetailBody extends ConsumerWidget {
  final VenueDetail venue;

  const _VenueDetailBody({required this.venue});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authProvider).asData?.value;
    final hasPhotos = venue.photos.isNotEmpty;

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          backgroundColor: kBackgroundColor,
          expandedHeight: 220,
          flexibleSpace: FlexibleSpaceBar(
            background: hasPhotos
                ? _PhotoCarousel(photos: venue.photos)
                : IgnorePointer(
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
                Text(venue.name, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                _MetaRow(venue: venue),
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
                if (venue.musicGenres.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  _TagRow(label: 'Music', tags: venue.musicGenres),
                ],
                if (venue.crowdTypes.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  _TagRow(label: 'Crowd', tags: venue.crowdTypes),
                ],
                if (venue.coverCharge != null) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Icon(Icons.local_activity_outlined, size: 16, color: Colors.white54),
                      const SizedBox(width: 6),
                      Text('Cover: ฿${venue.coverCharge}', style: TextStyle(color: Colors.white.withValues(alpha: 0.7))),
                    ],
                  ),
                ],
                if (venue.hoursJson != null && venue.hoursJson!.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  _HoursSection(hoursJson: venue.hoursJson!),
                ],
                const SizedBox(height: 28),
                Row(
                  children: [
                    const Text('Reviews', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                    const Spacer(),
                    if (session != null)
                      TextButton.icon(
                        onPressed: () => context.push(
                          '/venues/${venue.id}/review',
                          extra: {'venueName': venue.name, 'venueCategory': venue.category},
                        ),
                        style: TextButton.styleFrom(
                          foregroundColor: kAccentColor,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        ),
                        icon: const Icon(Icons.rate_review_outlined, size: 16),
                        label: const Text('Write a Review', style: TextStyle(fontSize: 13)),
                      ),
                  ],
                ),
                if (venue.reviews.isEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(
                      'No reviews yet. Be the first!',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 14),
                    ),
                  )
                else ...[
                  const SizedBox(height: 12),
                  for (final review in venue.reviews)
                    _ReviewCard(
                      review: review,
                      canDelete: session != null &&
                          (session.id == review.authorId || session.isAdmin),
                      onDelete: session == null
                          ? null
                          : () async {
                              await ReviewsRemoteDataSource(http.Client()).deleteReview(
                                reviewId: review.id,
                                accessToken: session.accessToken,
                              );
                              ref.invalidate(venueDetailProvider(venue.id));
                              ref.invalidate(venuesSearchProvider);
                            },
                    ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _PhotoCarousel extends StatefulWidget {
  final List<String> photos;

  const _PhotoCarousel({required this.photos});

  @override
  State<_PhotoCarousel> createState() => _PhotoCarouselState();
}

class _PhotoCarouselState extends State<_PhotoCarousel> {
  int _current = 0;
  final _controller = PageController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        PageView.builder(
          controller: _controller,
          itemCount: widget.photos.length,
          onPageChanged: (i) => setState(() => _current = i),
          itemBuilder: (_, i) => CachedNetworkImage(
            imageUrl: widget.photos[i],
            fit: BoxFit.cover,
            placeholder: (_, __) => Container(color: Colors.white10),
            errorWidget: (_, __, ___) => Container(
              color: Colors.white10,
              child: const Icon(Icons.image_not_supported_outlined, color: Colors.white24),
            ),
          ),
        ),
        if (widget.photos.length > 1)
          Positioned(
            bottom: 10,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(widget.photos.length, (i) {
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: i == _current ? 16 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: i == _current ? kAccentColor : Colors.white38,
                    borderRadius: BorderRadius.circular(3),
                  ),
                );
              }),
            ),
          ),
      ],
    );
  }
}

class _HoursSection extends StatelessWidget {
  final Map<String, String> hoursJson;

  const _HoursSection({required this.hoursJson});

  @override
  Widget build(BuildContext context) {
    final todayName = _dayOrder[DateTime.now().weekday - 1];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.access_time_outlined, size: 16, color: Colors.white54),
            const SizedBox(width: 6),
            const Text('Hours', style: TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(color: kSurfaceColor, borderRadius: BorderRadius.circular(10)),
          child: Column(
            children: _dayOrder.where((d) => hoursJson.containsKey(d)).map((day) {
              final isToday = day == todayName;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                child: Row(
                  children: [
                    SizedBox(
                      width: 36,
                      child: Text(
                        _dayAbbr[day] ?? day.substring(0, 3),
                        style: TextStyle(
                          fontSize: 13,
                          color: isToday ? kAccentColor : Colors.white54,
                          fontWeight: isToday ? FontWeight.w700 : FontWeight.normal,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      hoursJson[day] ?? 'Closed',
                      style: TextStyle(
                        fontSize: 13,
                        color: isToday ? Colors.white : Colors.white70,
                        fontWeight: isToday ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _MetaRow extends StatelessWidget {
  final VenueDetail venue;

  const _MetaRow({required this.venue});

  @override
  Widget build(BuildContext context) {
    final parts = <String>[
      venue.category.replaceAll('_', ' '),
      if (venue.priceRangeSymbol != null) venue.priceRangeSymbol!,
    ];

    return Row(
      children: [
        Text(parts.join(' · '), style: TextStyle(color: Colors.white.withValues(alpha: 0.6))),
        if (venue.topRating != null) ...[
          const SizedBox(width: 10),
          const Icon(Icons.star, color: kAccentColor, size: 16),
          const SizedBox(width: 2),
          Text(venue.topRating!.toStringAsFixed(1)),
          Text(' (${venue.reviewCount})', style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 13)),
        ],
      ],
    );
  }
}

class _TagRow extends StatelessWidget {
  final String label;
  final List<String> tags;

  const _TagRow({required this.label, required this.tags});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$label: ', style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 13)),
        Expanded(
          child: Wrap(
            spacing: 6,
            runSpacing: 4,
            children: tags
                .map((t) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: kSurfaceColor, borderRadius: BorderRadius.circular(12)),
                      child: Text(t, style: const TextStyle(fontSize: 12)),
                    ))
                .toList(),
          ),
        ),
      ],
    );
  }
}

class _ReviewCard extends StatefulWidget {
  final ReviewSummary review;
  final bool canDelete;
  final Future<void> Function()? onDelete;

  const _ReviewCard({
    required this.review,
    this.canDelete = false,
    this.onDelete,
  });

  @override
  State<_ReviewCard> createState() => _ReviewCardState();
}

class _ReviewCardState extends State<_ReviewCard> {
  bool _deleting = false;

  Future<void> _handleDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: kSurfaceColor,
        title: const Text('Delete review?', style: TextStyle(color: Colors.white)),
        content: const Text(
          'This will remove your review and the points you earned from it.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Cancel', style: TextStyle(color: Colors.white.withValues(alpha: 0.5))),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Color(0xFFEF4444))),
          ),
        ],
      ),
    );
    if (confirmed != true || widget.onDelete == null || !mounted) return;
    setState(() => _deleting = true);
    try {
      await widget.onDelete!();
    } catch (e) {
      if (mounted) {
        setState(() => _deleting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: Colors.red.shade800,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final initial = widget.review.authorName.isNotEmpty ? widget.review.authorName[0].toUpperCase() : '?';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: kSurfaceColor, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (widget.review.authorAvatarUrl != null)
                CircleAvatar(
                  radius: 16,
                  backgroundImage: CachedNetworkImageProvider(widget.review.authorAvatarUrl!),
                  backgroundColor: kAccentColor.withValues(alpha: 0.3),
                )
              else
                CircleAvatar(
                  radius: 16,
                  backgroundColor: kAccentColor.withValues(alpha: 0.2),
                  child: Text(initial, style: const TextStyle(color: kAccentColor, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.review.authorName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    Text(_relativeDate(widget.review.createdAt), style: TextStyle(color: Colors.white.withValues(alpha: 0.35), fontSize: 11)),
                  ],
                ),
              ),
              Row(
                children: List.generate(5, (i) => Icon(
                  Icons.star,
                  size: 12,
                  color: i < widget.review.rating ? kAccentColor : Colors.white24,
                )),
              ),
              if (widget.canDelete) ...[
                const SizedBox(width: 4),
                SizedBox(
                  width: 36,
                  height: 36,
                  child: _deleting
                      ? const Center(
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 1.5, color: Colors.white38),
                          ),
                        )
                      : IconButton(
                          onPressed: _handleDelete,
                          padding: EdgeInsets.zero,
                          icon: Icon(
                            Icons.delete_outline,
                            size: 18,
                            color: Colors.white.withValues(alpha: 0.55),
                          ),
                          tooltip: 'Delete review',
                        ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 10),
          Text(widget.review.textBody, style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 14)),
          if (widget.review.tags.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: widget.review.tags
                  .map((t) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: kAccentColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(_formatTag(t), style: TextStyle(color: kAccentColor.withValues(alpha: 0.8), fontSize: 11)),
                      ))
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}

Future<void> _openDirections(double lat, double lng) async {
  final uri = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng');
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}
