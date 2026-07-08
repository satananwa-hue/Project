import '../../domain/entities/rating_summary.dart';

class RatingSummaryModel extends RatingSummary {
  const RatingSummaryModel({required super.overall, required super.reviewCount});

  factory RatingSummaryModel.fromJson(Map<String, dynamic> json) {
    return RatingSummaryModel(
      overall: (json['overall'] as num).toDouble(),
      reviewCount: json['reviewCount'] as int,
    );
  }
}
