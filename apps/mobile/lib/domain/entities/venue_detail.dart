import 'venue_summary.dart';

class ReviewSummary {
  final String id;
  final String authorId;
  final int rating;
  final String textBody;
  final List<String> tags;
  final String createdAt;
  final String authorName;
  final String? authorAvatarUrl;

  const ReviewSummary({
    required this.id,
    required this.authorId,
    required this.rating,
    required this.textBody,
    required this.tags,
    required this.createdAt,
    required this.authorName,
    this.authorAvatarUrl,
  });
}

class VenueDetail extends VenueSummary {
  final Map<String, String>? hoursJson;
  final String createdByName;
  final String lastEditedByName;
  final String createdAt;
  final String updatedAt;
  final List<ReviewSummary> reviews;

  const VenueDetail({
    required super.id,
    required super.name,
    required super.category,
    required super.address,
    required super.lat,
    required super.lng,
    required super.city,
    super.coverCharge,
    required super.musicGenres,
    required super.crowdTypes,
    super.priceRange,
    required super.photos,
    required super.isPublished,
    super.topRating,
    required super.reviewCount,
    super.distanceM,
    this.hoursJson,
    required this.createdByName,
    required this.lastEditedByName,
    required this.createdAt,
    required this.updatedAt,
    required this.reviews,
  });
}
