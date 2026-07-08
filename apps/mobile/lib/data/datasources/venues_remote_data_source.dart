import 'dart:convert';

import 'package:http/http.dart' as http;

import 'package:mobile/core/config/api_config.dart';
import 'package:mobile/data/models/venue_category_model.dart';
import 'package:mobile/data/models/venue_detail_model.dart';
import 'package:mobile/data/models/venue_summary_model.dart';

// Bangkok is the only city seeded in Phase 1 - see apps/api/scripts/seed-venues.ts.
const _defaultCityId = 'bangkok';

class VenuesRemoteDataSource {
  final http.Client _client;

  VenuesRemoteDataSource(this._client);

  Future<List<VenueSummaryModel>> search({
    String? categoryId,
    String? query,
    double? lat,
    double? lng,
    double radiusM = 15000,
  }) async {
    final params = <String, String>{
      'cityId': _defaultCityId,
      'pageSize': '50',
      if (categoryId != null) 'categoryId': categoryId,
      if (query != null && query.isNotEmpty) 'query': query,
      // Passing lat/lng switches the API to distance-ordered results with a
      // `distanceM` on each item, instead of a plain unordered city listing.
      if (lat != null && lng != null) ...{
        'lat': lat.toString(),
        'lng': lng.toString(),
        'radiusM': radiusM.toString(),
      },
    };
    final uri = Uri.parse('${ApiConfig.baseUrl}/venues').replace(queryParameters: params);
    final res = await _client.get(uri);
    if (res.statusCode != 200) {
      throw Exception('Failed to load venues (${res.statusCode})');
    }
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final items = body['items'] as List<dynamic>;
    return items
        .map((item) => VenueSummaryModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<VenueDetailModel> getBySlug(String slug) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/venues/$slug');
    final res = await _client.get(uri);
    if (res.statusCode != 200) {
      throw Exception('Failed to load venue (${res.statusCode})');
    }
    return VenueDetailModel.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  Future<List<VenueCategoryModel>> listCategories() async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/venues/categories');
    final res = await _client.get(uri);
    if (res.statusCode != 200) {
      throw Exception('Failed to load categories (${res.statusCode})');
    }
    final items = jsonDecode(res.body) as List<dynamic>;
    return items
        .map((item) => VenueCategoryModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }
}
