import '../../domain/entities/venue_summary.dart';

class VenueSummaryModel extends VenueSummary {
  const VenueSummaryModel({
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
  });

  factory VenueSummaryModel.fromJson(Map<String, dynamic> json) {
    return VenueSummaryModel(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String,
      address: json['address'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      city: json['city'] as String? ?? 'Bangkok',
      coverCharge: json['coverCharge'] as int?,
      musicGenres: (json['musicGenres'] as List<dynamic>? ?? []).map((e) => e as String).toList(),
      crowdTypes: (json['crowdTypes'] as List<dynamic>? ?? []).map((e) => e as String).toList(),
      priceRange: json['priceRange'] as String?,
      photos: (json['photos'] as List<dynamic>? ?? []).map((e) => e as String).toList(),
      isPublished: json['isPublished'] as bool? ?? false,
      topRating: (json['topRating'] as num?)?.toDouble(),
      reviewCount: json['reviewCount'] as int? ?? 0,
      distanceM: (json['distanceM'] as num?)?.toDouble(),
    );
  }
}
