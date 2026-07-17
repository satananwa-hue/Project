import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:mobile/core/config/api_config.dart';
import 'package:mobile/domain/entities/account_item.dart';
import 'package:mobile/domain/entities/venue_summary.dart';
import 'package:mobile/data/models/venue_summary_model.dart';

class AdminRemoteDataSource {
  final http.Client _client;
  final String _token;

  AdminRemoteDataSource(this._client, this._token);

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      };

  Future<Map<String, int>> fetchStats() async {
    final res = await _client.get(
      Uri.parse('${ApiConfig.baseUrl}/admin/stats'),
      headers: _headers,
    );
    _check(res);
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    return {
      'accounts': (body['accounts'] as num).toInt(),
      'venues': (body['venues'] as num).toInt(),
      'reviews': (body['reviews'] as num).toInt(),
      'publishedVenues': ((body['publishedVenues'] as num?) ?? 0).toInt(),
      'pendingVenues': ((body['pendingVenues'] as num?) ?? 0).toInt(),
    };
  }

  Future<List<AccountItem>> fetchAccounts() async {
    final res = await _client.get(
      Uri.parse('${ApiConfig.baseUrl}/admin/accounts'),
      headers: _headers,
    );
    _check(res);
    final list = jsonDecode(res.body) as List<dynamic>;
    return list
        .map((e) => AccountItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<AccountItem> createAccount({
    required String name,
    required String email,
    required String password,
    String role = 'CREATOR',
  }) async {
    final res = await _client.post(
      Uri.parse('${ApiConfig.baseUrl}/admin/accounts'),
      headers: _headers,
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
        'role': role,
      }),
    );
    _check(res, expected: 201);
    return AccountItem.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  Future<AccountItem> updateAccount(String id, {bool? active, String? role}) async {
    final res = await _client.patch(
      Uri.parse('${ApiConfig.baseUrl}/admin/accounts/$id'),
      headers: _headers,
      body: jsonEncode({
        if (active != null) 'active': active,
        if (role != null) 'role': role,
      }),
    );
    _check(res);
    return AccountItem.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  // ── Invite management ─────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> fetchInvites() async {
    final res = await _client.get(
      Uri.parse('${ApiConfig.baseUrl}/admin/invites'),
      headers: _headers,
    );
    _check(res);
    final list = jsonDecode(res.body) as List<dynamic>;
    return list.cast<Map<String, dynamic>>();
  }

  // ── Venue management ──────────────────────────────────────────────────────

  Future<List<VenueSummary>> fetchVenues() async {
    final res = await _client.get(
      Uri.parse('${ApiConfig.baseUrl}/admin/venues'),
      headers: _headers,
    );
    _check(res);
    final list = jsonDecode(res.body) as List<dynamic>;
    return list
        .map((e) => VenueSummaryModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<VenueSummary> createVenue(Map<String, dynamic> data) async {
    final res = await _client.post(
      Uri.parse('${ApiConfig.baseUrl}/admin/venues'),
      headers: _headers,
      body: jsonEncode(data),
    );
    _check(res, expected: 201);
    return VenueSummaryModel.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  Future<VenueSummary> updateVenue(String id, Map<String, dynamic> data) async {
    final res = await _client.patch(
      Uri.parse('${ApiConfig.baseUrl}/admin/venues/$id'),
      headers: _headers,
      body: jsonEncode(data),
    );
    _check(res);
    return VenueSummaryModel.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  Future<void> deleteVenue(String id) async {
    final res = await _client.delete(
      Uri.parse('${ApiConfig.baseUrl}/admin/venues/$id'),
      headers: _headers,
    );
    _check(res, expected: 204);
  }

  void _check(http.Response res, {int expected = 200}) {
    if (res.statusCode == expected) return;
    String message = 'Error ${res.statusCode}';
    if (res.body.isNotEmpty) {
      try {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        message = body['message'] as String? ?? message;
      } catch (_) {}
    }
    throw Exception(message);
  }
}
