import '../../domain/entities/venue_detail.dart';

class ReviewSummaryModel extends ReviewSummary {
  const ReviewSummaryModel({
    required super.id,
    required super.authorId,
    required super.rating,
    required super.textBody,
    required super.tags,
    required super.createdAt,
    required super.authorName,
    super.authorAvatarUrl,
  });

  factory ReviewSummaryModel.fromJson(Map<String, dynamic> json) {
    final author = json['author'] as Map<String, dynamic>? ?? {};
    return ReviewSummaryModel(
      id: json['id'] as String,
      authorId: author['id'] as String? ?? '',
      rating: json['rating'] as int,
      textBody: json['textBody'] as String,
      tags: (json['tags'] as List<dynamic>? ?? []).map((e) => e as String).toList(),
      createdAt: json['createdAt'] as String,
      authorName: author['name'] as String? ?? '',
      authorAvatarUrl: author['avatarUrl'] as String?,
    );
  }
}

class VenueDetailModel extends VenueDetail {
  const VenueDetailModel({
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
    super.hoursJson,
    required super.createdByName,
    required super.lastEditedByName,
    required super.createdAt,
    required super.updatedAt,
    required super.reviews,
  });

  factory VenueDetailModel.fromJson(Map<String, dynamic> json) {
    final hoursRaw = json['hoursJson'] as Map<String, dynamic>?;
    return VenueDetailModel(
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
      hoursJson: hoursRaw?.map((k, v) => MapEntry(k, v as String)),
      createdByName: json['createdByName'] as String? ?? '',
      lastEditedByName: json['lastEditedByName'] as String? ?? '',
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
      reviews: (json['reviews'] as List<dynamic>? ?? [])
          .map((r) => ReviewSummaryModel.fromJson(r as Map<String, dynamic>))
          .toList(),
    );
  }
}
