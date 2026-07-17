import 'dart:convert';

import 'package:http/http.dart' as http;

import 'package:mobile/core/config/api_config.dart';
import 'package:mobile/data/models/venue_detail_model.dart';
import 'package:mobile/data/models/venue_summary_model.dart';

class VenuesRemoteDataSource {
  final http.Client _client;

  VenuesRemoteDataSource(this._client);

  Future<List<VenueSummaryModel>> search({
    String? category,
    String? musicGenre,
    String? crowdType,
    String? query,
    double? lat,
    double? lng,
    double radiusM = 15000,
  }) async {
    final hasLocation = lat != null && lng != null;
    final params = <String, String>{
      'pageSize': hasLocation ? '300' : '5000',
      'publishedOnly': 'true',
      if (category != null) 'category': category,
      if (musicGenre != null) 'musicGenre': musicGenre,
      if (crowdType != null) 'crowdType': crowdType,
      if (query != null && query.isNotEmpty) 'query': query,
      if (hasLocation) ...{
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

  Future<VenueDetailModel> getById(String id) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/venues/$id');
    final res = await _client.get(uri);
    if (res.statusCode != 200) {
      throw Exception('Failed to load venue (${res.statusCode})');
    }
    return VenueDetailModel.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }
}
