import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/domain/entities/venue_summary.dart';

class VenueCard extends StatelessWidget {
  final VenueSummary venue;
  final VoidCallback onTap;

  const VenueCard({super.key, required this.venue, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final subtitle = [
      venue.category.replaceAll('_', ' '),
      if (venue.priceRangeSymbol != null) venue.priceRangeSymbol!,
      if (venue.distanceM != null) _formatDistance(venue.distanceM!),
    ].join(' · ');

    return Card(
      color: kSurfaceColor,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              if (venue.coverPhoto != null) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedNetworkImage(
                    imageUrl: venue.coverPhoto!,
                    width: 56,
                    height: 56,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(
                      width: 56,
                      height: 56,
                      color: Colors.white10,
                    ),
                    errorWidget: (_, __, ___) => Container(
                      width: 56,
                      height: 56,
                      color: Colors.white10,
                      child: const Icon(Icons.image_not_supported_outlined,
                          color: Colors.white24, size: 20),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      venue.name,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 13),
                    ),
                  ],
                ),
              ),
              if (venue.topRating != null) ...[
                const Icon(Icons.star, color: kAccentColor, size: 16),
                const SizedBox(width: 4),
                Text(venue.topRating!.toStringAsFixed(1), style: const TextStyle(fontWeight: FontWeight.w600)),
              ] else
                Text('New', style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 13)),
            ],
          ),
        ),
      ),
    );
  }
}

String _formatDistance(double meters) {
  if (meters < 1000) return '${meters.round()} m';
  return '${(meters / 1000).toStringAsFixed(1)} km';
}
