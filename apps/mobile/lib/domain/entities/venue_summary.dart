import 'rating_summary.dart';

class VenueSummary {
  final String id;
  final String slug;
  final String name;
  final String? categoryName;
  final double lat;
  final double lng;
  final int? priceRange;
  final double? distanceM;
  final RatingSummary rating;
  final String? coverPhotoUrl;

  /// Admin-curated rating, distinct from [rating] (the reviewer community's
  /// aggregate). Phase 1 has no reviewer accounts at all, so this is the only
  /// rating this app can ever show - see [displayRating].
  final double? curatedRating;

  const VenueSummary({
    required this.id,
    required this.slug,
    required this.name,
    required this.categoryName,
    required this.lat,
    required this.lng,
    required this.priceRange,
    required this.distanceM,
    required this.rating,
    required this.coverPhotoUrl,
    required this.curatedRating,
  });

  double? get displayRating => rating.reviewCount > 0 ? rating.overall : curatedRating;
}
