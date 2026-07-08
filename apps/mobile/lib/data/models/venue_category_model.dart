import '../../domain/entities/venue_category.dart';

class VenueCategoryModel extends VenueCategory {
  const VenueCategoryModel({required super.id, required super.name});

  factory VenueCategoryModel.fromJson(Map<String, dynamic> json) {
    return VenueCategoryModel(id: json['id'] as String, name: json['name'] as String);
  }
}
