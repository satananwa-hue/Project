import '../../domain/entities/venue_summary.dart';
import 'rating_summary_model.dart';

class VenueSummaryModel extends VenueSummary {
  const VenueSummaryModel({
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
  });

  factory VenueSummaryModel.fromJson(Map<String, dynamic> json) {
    return VenueSummaryModel(
      id: json['id'] as String,
      slug: json['slug'] as String,
      name: json['name'] as String,
      categoryName: json['categoryName'] as String?,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      priceRange: json['priceRange'] as int?,
      distanceM: (json['distanceM'] as num?)?.toDouble(),
      rating: RatingSummaryModel.fromJson(json['rating'] as Map<String, dynamic>),
      coverPhotoUrl: json['coverPhotoUrl'] as String?,
      curatedRating: (json['curatedRating'] as num?)?.toDouble(),
    );
  }
}
