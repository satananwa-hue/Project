import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/domain/entities/venue_summary.dart';

class VenueCard extends StatelessWidget {
  final VenueSummary venue;
  final VoidCallback onTap;

  const VenueCard({super.key, required this.venue, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final rating = venue.displayRating;

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
                      [
                        if (venue.categoryName != null) venue.categoryName!,
                        if (venue.priceRange != null) '\$' * venue.priceRange!,
                      ].join(' · '),
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 13),
                    ),
                  ],
                ),
              ),
              if (rating != null) ...[
                const Icon(Icons.star, color: kAccentColor, size: 16),
                const SizedBox(width: 4),
                Text(rating.toStringAsFixed(1), style: const TextStyle(fontWeight: FontWeight.w600)),
              ] else
                Text('New', style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 13)),
            ],
          ),
        ),
      ),
    );
  }
}
