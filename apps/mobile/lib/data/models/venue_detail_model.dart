import '../../domain/entities/venue_detail.dart';
import 'rating_summary_model.dart';

class VenueDetailModel extends VenueDetail {
  const VenueDetailModel({
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
    required super.description,
    required super.address,
    required super.tags,
    required super.status,
    required super.curatedReview,
  });

  factory VenueDetailModel.fromJson(Map<String, dynamic> json) {
    return VenueDetailModel(
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
      description: json['description'] as String?,
      address: json['address'] as String,
      tags: (json['tags'] as List<dynamic>).map((t) => t as String).toList(),
      status: json['status'] as String,
      curatedReview: json['curatedReview'] as String?,
    );
  }
}
