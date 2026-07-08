import 'venue_summary.dart';

class VenueDetail extends VenueSummary {
  final String? description;
  final String address;
  final List<String> tags;
  final String status;
  final String? curatedReview;

  const VenueDetail({
    required super.id,
    required super.slug,
    required super.name,
    required super.categoryName,
    required super.lat,
    required super.lng,
    required super.priceRange,
    required super.distanceM,
    required super.rating,
    required super.coverPhotoUrl,
    required super.curatedRating,
    required this.description,
    required this.address,
    required this.tags,
    required this.status,
    required this.curatedReview,
  });
}
