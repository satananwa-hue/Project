import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:mobile/core/config/api_config.dart';

class ReviewsRemoteDataSource {
  final http.Client _client;

  ReviewsRemoteDataSource(this._client);

  Future<Map<String, dynamic>> createReview({
    required String accessToken,
    required String venueId,
    required int rating,
    required String textBody,
    List<String> tags = const [],
    String? musicGenreNotes,
    String? priceLevelNotes,
    String? crowdNotes,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/reviews');
    final res = await _client.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      },
      body: jsonEncode({
        'venueId': venueId,
        'rating': rating,
        'textBody': textBody,
        'tags': tags,
        if (musicGenreNotes != null) 'musicGenreNotes': musicGenreNotes,
        if (priceLevelNotes != null) 'priceLevelNotes': priceLevelNotes,
        if (crowdNotes != null) 'crowdNotes': crowdNotes,
        'isPublished': true,
      }),
    );

    if (res.statusCode == 201) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }

    final body = jsonDecode(res.body) as Map<String, dynamic>;
    throw Exception(body['message'] ?? 'Failed to submit review (${res.statusCode})');
  }

  Future<void> deleteReview({
    required String reviewId,
    required String accessToken,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/reviews/$reviewId');
    final res = await _client.delete(
      uri,
      headers: {'Authorization': 'Bearer $accessToken'},
    );

    if (res.statusCode == 204) return;

    final body = jsonDecode(res.body) as Map<String, dynamic>;
    throw Exception(body['message'] ?? 'Failed to delete review (${res.statusCode})');
  }

  Future<void> claimSocialShare({
    required String reviewId,
    required String accessToken,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/reviews/$reviewId/social-share');
    final res = await _client.post(
      uri,
      headers: {'Authorization': 'Bearer $accessToken'},
    );
    if (res.statusCode == 200 || res.statusCode == 201) return;
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    throw Exception(body['message'] ?? 'Failed to claim share bonus (${res.statusCode})');
  }
}
